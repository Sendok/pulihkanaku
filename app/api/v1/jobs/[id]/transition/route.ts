import { getD1 } from "@/db";
import { fail, ok, requestId } from "@/lib/api-response";
import { assertAuthorized } from "@/lib/domain/authorization";
import { assertJobTransition, isJobStatus, type JobStatus } from "@/lib/domain/job-state-machine";
import { requireApiIdentity } from "@/lib/identity";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const reqId = requestId(request);
  const identity = await requireApiIdentity(request);
  if (!identity) return fail("UNAUTHENTICATED", "Silakan masuk untuk melanjutkan.", reqId, 401);
  try { assertAuthorized(identity.role, "job:transition"); } catch { return fail("FORBIDDEN", "Anda tidak dapat mengubah pekerjaan ini.", reqId, 403); }
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { to?: string; expectedVersion?: number; reason?: string } | null;
  if (!body?.to || !isJobStatus(body.to) || !Number.isSafeInteger(body.expectedVersion)) return fail("VALIDATION_ERROR", "Status tujuan atau versi tidak valid.", reqId, 422);
  const d1 = getD1();
  const row = await d1.prepare("SELECT id, status, version, created_by_email FROM jobs WHERE id = ? LIMIT 1").bind(id).first<{ id: string; status: string; version: number; created_by_email: string }>();
  if (!row) return fail("JOB_NOT_FOUND", "Pekerjaan tidak ditemukan.", reqId, 404);
  if (row.created_by_email.toLowerCase() !== identity.email && !["OPERATIONS_ADMIN", "SUPER_ADMIN"].includes(identity.role)) return fail("FORBIDDEN", "Anda tidak dapat mengubah pekerjaan ini.", reqId, 403);
  if (!isJobStatus(row.status)) return fail("JOB_STATE_CORRUPT", "Status pekerjaan perlu diperiksa oleh tim dukungan.", reqId, 409);
  try { assertJobTransition(row.status, body.to); } catch { return fail("JOB_INVALID_TRANSITION", `Pekerjaan tidak dapat dipindahkan dari ${row.status} ke ${body.to}.`, reqId, 409); }
  if (row.version !== body.expectedVersion) return fail("VERSION_CONFLICT", "Pekerjaan sudah diperbarui. Muat ulang sebelum mencoba lagi.", reqId, 409, { currentVersion: row.version });
  const nextVersion = row.version + 1;
  const now = Date.now();
  const update = d1.prepare("UPDATE jobs SET status = ?, version = ?, updated_at = ?, published_at = CASE WHEN ? = 'PUBLISHED' THEN ? ELSE published_at END WHERE id = ? AND status = ? AND version = ?")
    .bind(body.to, nextVersion, now, body.to, now, id, row.status, row.version);
  const audit = d1.prepare("INSERT INTO audit_logs (id, actor_email, actor_role, action, entity_type, entity_id, previous_state, next_state, request_id, reason, created_at) SELECT ?, ?, ?, 'JOB_STATUS_CHANGED', 'JOB', id, ?, ?, ?, ?, ? FROM jobs WHERE id = ? AND status = ? AND version = ?")
    .bind(crypto.randomUUID(), identity.email, identity.role, row.status, body.to, reqId, body.reason ?? null, now, id, body.to, nextVersion);
  const [result] = await d1.batch([update, audit]);
  if (!result.success || (result.meta.changes ?? 0) !== 1) return fail("VERSION_CONFLICT", "Pekerjaan berubah saat diproses. Silakan coba kembali.", reqId, 409);
  return ok({ id, previousStatus: row.status as JobStatus, status: body.to, version: nextVersion });
}
