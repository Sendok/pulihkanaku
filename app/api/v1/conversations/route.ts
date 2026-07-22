import { getD1 } from "@/db";
import { fail, ok, requestId } from "@/lib/api-response";
import { requireApiIdentity } from "@/lib/identity";

export async function GET(request: Request) {
  const reqId = requestId(request); const identity = await requireApiIdentity(request);
  if (!identity) return fail("UNAUTHENTICATED", "Silakan masuk untuk membuka pesan.", reqId, 401);
  const d1 = getD1();
  const conversations = await d1.prepare(`SELECT c.id,c.assignment_id,c.job_id,c.status,c.last_message_at,j.title,
    (SELECT body FROM messages WHERE conversation_id=c.id AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1) last_message,
    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id=c.id AND m.created_at>COALESCE(p.last_read_at,0) AND m.sender_user_id<>?) unread_count
    FROM conversation_participants p JOIN conversations c ON c.id=p.conversation_id LEFT JOIN jobs j ON j.id=c.job_id
    WHERE p.user_id=? ORDER BY c.last_message_at DESC,c.updated_at DESC`).bind(identity.id, identity.id).all();
  const available = identity.role === "WORKER"
    ? await d1.prepare(`SELECT a.id assignment_id,j.id job_id,j.title,b.name counterparty FROM job_assignments a JOIN jobs j ON j.id=a.job_id JOIN businesses b ON b.id=j.business_id LEFT JOIN conversations c ON c.assignment_id=a.id WHERE a.worker_user_id=? AND c.id IS NULL ORDER BY a.updated_at DESC LIMIT 30`).bind(identity.id).all()
    : await d1.prepare(`SELECT a.id assignment_id,j.id job_id,j.title,u.full_name counterparty FROM business_members bm JOIN jobs j ON j.business_id=bm.business_id JOIN job_assignments a ON a.job_id=j.id JOIN users u ON u.id=a.worker_user_id LEFT JOIN conversations c ON c.assignment_id=a.id WHERE bm.user_id=? AND bm.status='ACTIVE' AND c.id IS NULL ORDER BY a.updated_at DESC LIMIT 30`).bind(identity.id).all();
  return ok({ items: conversations.results, availableAssignments: available.results });
}

export async function POST(request: Request) {
  const reqId = requestId(request); const identity = await requireApiIdentity(request);
  if (!identity) return fail("UNAUTHENTICATED", "Silakan masuk untuk memulai pesan.", reqId, 401);
  const body = await request.json().catch(() => null) as { assignmentId?: string } | null;
  if (!body?.assignmentId) return fail("VALIDATION_ERROR", "Pilih penugasan yang akan dibahas.", reqId, 422);
  const d1 = getD1();
  const assignment = await d1.prepare(`SELECT a.id,a.job_id,a.worker_user_id,j.business_id FROM job_assignments a JOIN jobs j ON j.id=a.job_id WHERE a.id=? LIMIT 1`).bind(body.assignmentId).first<{id:string;job_id:string;worker_user_id:string;business_id:string}>();
  if (!assignment) return fail("ASSIGNMENT_NOT_FOUND", "Penugasan tidak ditemukan.", reqId, 404);
  const member = await d1.prepare("SELECT role FROM business_members WHERE business_id=? AND user_id=? AND status='ACTIVE' LIMIT 1").bind(assignment.business_id, identity.id).first<{role:string}>();
  if (identity.id !== assignment.worker_user_id && !member) return fail("FORBIDDEN", "Anda bukan bagian dari penugasan ini.", reqId, 403);
  const existing = await d1.prepare("SELECT id FROM conversations WHERE assignment_id=? LIMIT 1").bind(assignment.id).first<{id:string}>();
  if (existing) return ok(existing);
  const id = crypto.randomUUID(), now = Date.now();
  const members = await d1.prepare("SELECT user_id,role FROM business_members WHERE business_id=? AND status='ACTIVE'").bind(assignment.business_id).all<{user_id:string;role:string}>();
  const statements = [d1.prepare("INSERT INTO conversations(id,assignment_id,job_id,type,status,created_at,updated_at) VALUES(?,?,?,'ASSIGNMENT','ACTIVE',?,?)").bind(id,assignment.id,assignment.job_id,now,now), d1.prepare("INSERT INTO conversation_participants(id,conversation_id,user_id,role,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),id,assignment.worker_user_id,"WORKER",now)];
  for (const row of members.results) statements.push(d1.prepare("INSERT OR IGNORE INTO conversation_participants(id,conversation_id,user_id,role,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),id,row.user_id,row.role,now));
  await d1.batch(statements); return ok({ id }, 201);
}
