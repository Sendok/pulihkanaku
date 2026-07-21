import { getD1 } from "@/db";
import { fail, ok, requestId } from "@/lib/api-response";
import { assertAuthorized } from "@/lib/domain/authorization";
import { calculatePaymentQuote } from "@/lib/domain/payment";
import { requireApiIdentity } from "@/lib/identity";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const reqId = requestId(request); const identity = await requireApiIdentity(request).catch(() => null);
  if (!identity) return fail("UNAUTHENTICATED", "Silakan masuk untuk mendanai pekerjaan.", reqId, 401);
  try { assertAuthorized(identity.role, "job:transition"); } catch { return fail("FORBIDDEN", "Akun ini tidak dapat mendanai pekerjaan.", reqId, 403); }
  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) return fail("IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key diperlukan untuk membuat pembayaran.", reqId, 400);
  const { id } = await context.params; const d1 = getD1();
  const existing = await d1.prepare("SELECT id, status, amount, currency, provider_reference FROM payment_transactions WHERE idempotency_key = ? LIMIT 1").bind(idempotencyKey).first<{id:string;status:string;amount:number;currency:string;provider_reference:string}>();
  if (existing) return ok({ id: existing.id, status: existing.status, amount: existing.amount, currency: existing.currency, providerReference: existing.provider_reference, reused: true });
  const job = await d1.prepare("SELECT id, pay_amount, worker_count, status, created_by_email FROM jobs WHERE id = ? LIMIT 1").bind(id).first<{id:string;pay_amount:number;worker_count:number;status:string;created_by_email:string}>();
  if (!job) return fail("JOB_NOT_FOUND", "Pekerjaan tidak ditemukan.", reqId, 404);
  if (job.created_by_email.toLowerCase() !== identity.email && !["OPERATIONS_ADMIN", "SUPER_ADMIN"].includes(identity.role)) return fail("FORBIDDEN", "Pekerjaan ini bukan milik bisnis Anda.", reqId, 403);
  if (job.status !== "PENDING_FUNDING") return fail("JOB_NOT_READY_FOR_FUNDING", "Pekerjaan belum siap didanai.", reqId, 409);
  const quote = calculatePaymentQuote(job.pay_amount * job.worker_count); const paymentId = crypto.randomUUID(); const now = Date.now(); const providerReference = `mock_invoice_${paymentId}`;
  try {
    await d1.batch([
      d1.prepare("INSERT INTO payment_transactions (id,job_id,provider_reference,type,status,amount,currency,idempotency_key,created_at,updated_at) VALUES (?, ?, ?, 'JOB_FUNDING', 'PENDING', ?, 'IDR', ?, ?, ?)").bind(paymentId,id,providerReference,quote.invoiceTotal,idempotencyKey,now,now),
      d1.prepare("INSERT INTO audit_logs (id,actor_email,actor_role,action,entity_type,entity_id,previous_state,next_state,request_id,created_at) VALUES (?,?,?,'PAYMENT_CREATED','PAYMENT',?,NULL,'PENDING',?,?)").bind(crypto.randomUUID(),identity.email,identity.role,paymentId,reqId,now),
    ]);
    return ok({ id: paymentId, status: "PENDING", quote, providerReference, nextAction: { type: "PAYMENT_PROVIDER", message: "Selesaikan pembayaran melalui provider yang dikonfigurasi." } }, 201);
  } catch { return fail("PAYMENT_CREATE_FAILED", "Invoice pembayaran belum dapat dibuat.", reqId, 409); }
}
