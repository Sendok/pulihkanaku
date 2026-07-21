import { getD1 } from "@/db";
import { fail, ok, requestId } from "@/lib/api-response";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const reqId = requestId(request);
  if (process.env.NODE_ENV === "production") return fail("NOT_FOUND", "Endpoint tidak ditemukan.", reqId, 404);
  const signature = request.headers.get("x-mock-signature");
  if (signature !== "local-development-only") return fail("INVALID_WEBHOOK_SIGNATURE", "Signature webhook tidak valid.", reqId, 401);
  const { id } = await context.params; const d1 = getD1();
  const payment = await d1.prepare("SELECT p.id,p.job_id,p.status,p.amount,j.status job_status,j.pay_amount,j.worker_count FROM payment_transactions p JOIN jobs j ON j.id=p.job_id WHERE p.id=? LIMIT 1").bind(id).first<{id:string;job_id:string;status:string;amount:number;job_status:string;pay_amount:number;worker_count:number}>();
  if (!payment) return fail("PAYMENT_NOT_FOUND", "Pembayaran tidak ditemukan.", reqId, 404);
  if (payment.status === "PAID") return ok({ id, status: "PAID", jobId: payment.job_id, reused: true });
  if (payment.status !== "PENDING" || payment.job_status !== "PENDING_FUNDING") return fail("PAYMENT_INVALID_STATE", "Pembayaran tidak dapat dikonfirmasi.", reqId, 409);
  const now = Date.now(); const workerTotal = payment.pay_amount * payment.worker_count; const fees = payment.amount - workerTotal;
  const [updated] = await d1.batch([
    d1.prepare("UPDATE payment_transactions SET status='PAID',updated_at=? WHERE id=? AND status='PENDING'").bind(now,id),
    d1.prepare("UPDATE jobs SET funding_status='FUNDED',status='PUBLISHED',published_at=?,version=version+1,updated_at=? WHERE id=? AND status='PENDING_FUNDING'").bind(now,now,payment.job_id),
    d1.prepare("INSERT INTO ledger_entries (id,job_id,transaction_id,type,direction,amount,currency,reference,created_at) VALUES (?,?,?,'JOB_FUNDING','CREDIT',?,'IDR',?,?)").bind(crypto.randomUUID(),payment.job_id,id,payment.amount,`job-funding:${id}`,now),
    d1.prepare("INSERT INTO ledger_entries (id,job_id,transaction_id,type,direction,amount,currency,reference,created_at) VALUES (?,?,?,'PLATFORM_FEE','CREDIT',?,'IDR',?,?)").bind(crypto.randomUUID(),payment.job_id,id,fees,`platform-fee:${id}`,now),
    d1.prepare("INSERT INTO audit_logs (id,actor_email,actor_role,action,entity_type,entity_id,previous_state,next_state,request_id,created_at) VALUES (?,'mock-payment-provider','SYSTEM','PAYMENT_CONFIRMED','PAYMENT',?,'PENDING','PAID',?,?)").bind(crypto.randomUUID(),id,reqId,now),
  ]);
  if (!updated.success || (updated.meta.changes ?? 0) !== 1) return fail("PAYMENT_CONFLICT", "Pembayaran berubah saat diproses.", reqId, 409);
  return ok({ id, status: "PAID", jobId: payment.job_id, jobStatus: "PUBLISHED" });
}
