import { getD1 } from "@/db";
import { fail, ok, requestId } from "@/lib/api-response";
import { assertAuthorized } from "@/lib/domain/authorization";
import { requireApiIdentity } from "@/lib/identity";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const reqId = requestId(request);
  const identity = await requireApiIdentity(request).catch(() => null);
  if (!identity) return fail("UNAUTHENTICATED", "Silakan masuk sebagai pekerja untuk melamar.", reqId, 401);
  try { assertAuthorized(identity.role, "job:apply"); } catch { return fail("FORBIDDEN", "Akun ini tidak dapat melamar pekerjaan.", reqId, 403); }
  const { id: jobId } = await context.params;
  const d1 = getD1();
  const job = await d1.prepare("SELECT id, status, funding_status FROM jobs WHERE id = ? LIMIT 1").bind(jobId).first<{ id: string; status: string; funding_status: string }>();
  if (!job) return fail("JOB_NOT_FOUND", "Pekerjaan tidak ditemukan.", reqId, 404);
  if (job.status !== "PUBLISHED" || job.funding_status !== "FUNDED") return fail("JOB_NOT_AVAILABLE", "Pekerjaan ini belum tersedia untuk dilamar.", reqId, 409);
  const now = Date.now(); const applicationId = crypto.randomUUID();
  try {
    await d1.batch([
      d1.prepare("INSERT INTO job_applications (id, job_id, worker_user_id, status, version, created_at, updated_at) VALUES (?, ?, ?, 'SUBMITTED', 1, ?, ?)").bind(applicationId, jobId, identity.id, now, now),
      d1.prepare("INSERT INTO audit_logs (id, actor_email, actor_role, action, entity_type, entity_id, previous_state, next_state, request_id, created_at) VALUES (?, ?, ?, 'APPLICATION_SUBMITTED', 'APPLICATION', ?, NULL, 'SUBMITTED', ?, ?)").bind(crypto.randomUUID(), identity.email, identity.role, applicationId, reqId, now),
    ]);
    return ok({ id: applicationId, jobId, status: "SUBMITTED", version: 1 }, 201);
  } catch { return fail("APPLICATION_ALREADY_EXISTS", "Kamu sudah melamar pekerjaan ini.", reqId, 409); }
}
