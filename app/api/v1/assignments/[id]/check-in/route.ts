import { getD1 } from "@/db";
import { fail, ok, requestId } from "@/lib/api-response";
import { assertAssignmentTransition, isAssignmentStatus } from "@/lib/domain/assignment-state-machine";
import { assertAuthorized } from "@/lib/domain/authorization";
import { requireApiIdentity } from "@/lib/identity";

export const dynamic = "force-dynamic"; type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  const reqId=requestId(request); const identity=await requireApiIdentity(request).catch(()=>null);
  if(!identity)return fail("UNAUTHENTICATED","Silakan masuk untuk check-in.",reqId,401);
  try{assertAuthorized(identity.role,"assignment:work");}catch{return fail("FORBIDDEN","Akun ini tidak dapat check-in.",reqId,403);}
  const {id}=await context.params; const body=await request.json().catch(()=>({})) as {method?:string;latitude?:number;longitude?:number;deviceMetadata?:string}; const d1=getD1();
  const row=await d1.prepare("SELECT id, worker_user_id, status, version FROM job_assignments WHERE id = ? LIMIT 1").bind(id).first<{id:string;worker_user_id:string;status:string;version:number}>();
  if(!row)return fail("ASSIGNMENT_NOT_FOUND","Penugasan tidak ditemukan.",reqId,404); if(row.worker_user_id!==identity.id)return fail("FORBIDDEN","Penugasan ini bukan milik Anda.",reqId,403);
  if(!isAssignmentStatus(row.status))return fail("ASSIGNMENT_STATE_CORRUPT","Status penugasan perlu diperiksa.",reqId,409); try{assertAssignmentTransition(row.status,"IN_PROGRESS");}catch{return fail("CHECK_IN_NOT_ALLOWED","Check-in tidak tersedia pada status ini.",reqId,409);}
  const now=Date.now(); const attendanceId=crypto.randomUUID(); const [update]=await d1.batch([
    d1.prepare("UPDATE job_assignments SET status = 'IN_PROGRESS', checked_in_at = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ? AND status = 'CONFIRMED'").bind(now,now,id,row.version),
    d1.prepare("INSERT INTO assignment_attendance (id, assignment_id, type, method, latitude, longitude, device_metadata, occurred_at, created_at) SELECT ?, id, 'CHECK_IN', ?, ?, ?, ?, ?, ? FROM job_assignments WHERE id = ? AND status = 'IN_PROGRESS'").bind(attendanceId,body.method??"PIN",body.latitude??null,body.longitude??null,body.deviceMetadata?.slice(0,500)??null,now,now,id),
    d1.prepare("INSERT INTO audit_logs (id, actor_email, actor_role, action, entity_type, entity_id, previous_state, next_state, request_id, created_at) SELECT ?, ?, ?, 'WORKER_CHECKED_IN', 'ASSIGNMENT', id, 'CONFIRMED', 'IN_PROGRESS', ?, ? FROM job_assignments WHERE id = ? AND status = 'IN_PROGRESS'").bind(crypto.randomUUID(),identity.email,identity.role,reqId,now,id),
  ]); if(!update.success||(update.meta.changes??0)!==1)return fail("VERSION_CONFLICT","Penugasan sudah berubah.",reqId,409); return ok({assignmentId:id,attendanceId,status:"IN_PROGRESS",checkedInAt:new Date(now).toISOString()});
}
