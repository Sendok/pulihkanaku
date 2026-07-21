import { getD1 } from "@/db";
import { fail, ok, requestId } from "@/lib/api-response";
import { assertApplicationTransition, isApplicationStatus } from "@/lib/domain/assignment-state-machine";
import { assertAuthorized } from "@/lib/domain/authorization";
import { requireApiIdentity } from "@/lib/identity";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const reqId = requestId(request); const identity = await requireApiIdentity(request).catch(() => null);
  if (!identity) return fail("UNAUTHENTICATED", "Silakan masuk untuk meninjau kandidat.", reqId, 401);
  try { assertAuthorized(identity.role, "application:accept"); } catch { return fail("FORBIDDEN", "Anda tidak dapat menerima kandidat.", reqId, 403); }
  const { id } = await context.params; const d1 = getD1();
  const row = await d1.prepare("SELECT a.id, a.job_id, a.worker_user_id, a.status, a.version, j.created_by_email FROM job_applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ? LIMIT 1").bind(id).first<{ id: string; job_id: string; worker_user_id: string; status: string; version: number; created_by_email: string }>();
  if (!row) return fail("APPLICATION_NOT_FOUND", "Lamaran tidak ditemukan.", reqId, 404);
  if (row.created_by_email.toLowerCase() !== identity.email && !["OPERATIONS_ADMIN", "SUPER_ADMIN"].includes(identity.role)) return fail("FORBIDDEN", "Lamaran ini bukan milik bisnis Anda.", reqId, 403);
  if (!isApplicationStatus(row.status)) return fail("APPLICATION_STATE_CORRUPT", "Status lamaran perlu diperiksa.", reqId, 409);
  try { assertApplicationTransition(row.status, "ACCEPTED"); } catch { return fail("APPLICATION_INVALID_TRANSITION", "Lamaran ini tidak dapat diterima lagi.", reqId, 409); }
  const now = Date.now(); const assignmentId = crypto.randomUUID();
  const [update] = await d1.batch([
    d1.prepare("UPDATE job_applications SET status = 'ACCEPTED', accepted_at = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ? AND status = ?").bind(now, now, id, row.version, row.status),
    d1.prepare("INSERT INTO job_assignments (id, job_id, application_id, worker_user_id, status, version, created_at, updated_at) SELECT ?, job_id, id, worker_user_id, 'CONFIRMED', 1, ?, ? FROM job_applications WHERE id = ? AND status = 'ACCEPTED'").bind(assignmentId, now, now, id),
    d1.prepare("INSERT INTO audit_logs (id, actor_email, actor_role, action, entity_type, entity_id, previous_state, next_state, request_id, created_at) SELECT ?, ?, ?, 'APPLICATION_ACCEPTED', 'APPLICATION', id, ?, 'ACCEPTED', ?, ? FROM job_applications WHERE id = ? AND status = 'ACCEPTED'").bind(crypto.randomUUID(), identity.email, identity.role, row.status, reqId, now, id),
  ]);
  if (!update.success || (update.meta.changes ?? 0) !== 1) return fail("VERSION_CONFLICT", "Lamaran sudah berubah. Muat ulang sebelum mencoba lagi.", reqId, 409);
  return ok({ applicationId: id, assignmentId, status: "ACCEPTED" });
}
