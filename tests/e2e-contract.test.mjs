import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const cwd = new URL("../", import.meta.url).pathname;
const baseUrl = "http://localhost:3011";

function startServer() {
  const child = spawn(new URL("../node_modules/.bin/vinext", import.meta.url).pathname, ["dev", "--port", "3011"], { cwd, env: { ...process.env, NODE_ENV: "development", WRANGLER_LOG_PATH: ".wrangler/wrangler-e2e.log" }, stdio: ["ignore", "pipe", "pipe"] });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Development server did not start in time.")), 30_000);
    const onData = (chunk) => {
      if (String(chunk).includes("Local:")) { clearTimeout(timer); resolve(child); }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => { clearTimeout(timer); reject(new Error(`Development server exited with ${code}.`)); });
  });
}

async function api(path, { user, body, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: body === undefined ? "POST" : "POST",
    headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), ...(user ? { "x-demo-user": user } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  assert.equal(payload.success, true, `${path}: ${JSON.stringify(payload)}`);
  return payload.data;
}

test("vertical slice contracts exist and remain audited", async () => {
  const [schema, transition, stateMachine] = await Promise.all([
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/v1/jobs/[id]/transition/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/domain/job-state-machine.ts", import.meta.url), "utf8"),
  ]);
  for (const entity of ["jobs", "job_applications", "job_assignments", "assignment_attendance", "assignment_evidence", "assignment_reviews", "payment_transactions", "ledger_entries", "payouts", "disputes", "dispute_messages", "reconciliation_records", "audit_logs"]) assert.match(schema, new RegExp(entity));
  assert.match(transition, /expectedVersion/); assert.match(transition, /audit_logs/); assert.match(stateMachine, /PENDING_FUNDING/); assert.match(stateMachine, /COMPLETED/);
  for (const route of ["jobs/[id]/applications", "applications/[id]/accept", "assignments/[id]/check-in", "assignments/[id]/check-out", "assignments/[id]/evidence", "assignments/[id]/submit", "assignments/[id]/request-revision", "assignments/[id]/approve", "assignments/[id]/disputes", "assignments/[id]/reviews", "disputes/[id]/messages", "disputes/[id]/resolve", "payouts/[id]/mock-process", "payouts/[id]/mock-complete"]) await access(new URL(`../app/api/v1/${route}/route.ts`, import.meta.url));
});

test("funded job completes worker-to-payout workflow", { timeout: 60_000 }, async () => {
  const server = await startServer();
  const business = "business@pulihkanaku.local"; const worker = "worker@pulihkanaku.local";
  try {
    const authSuffix=String(Date.now()).slice(-8);const newWorker=`auth-${authSuffix}@example.local`;
    const registered=await api("/api/v1/auth/register",{headers:{"x-demo-email":newWorker},body:{role:"WORKER",fullName:"Rina Puspita",phone:`0812${authSuffix}`,city:"Tulungagung",district:"Kedungwaru",termsAccepted:true,privacyAccepted:true,marketingConsent:false}});
    assert.deepEqual({role:registered.role,next:registered.next},{role:"WORKER",next:"/app"});
    const workerPage=await fetch(`${baseUrl}/app`,{headers:{"oai-authenticated-user-email":newWorker},redirect:"manual"});assert.equal(workerPage.status,200);
    const wrongRole=await fetch(`${baseUrl}/business`,{headers:{"oai-authenticated-user-email":newWorker},redirect:"manual"});assert.equal(wrongRole.status,307);assert.match(wrongRole.headers.get("location")??"",/akses-ditolak/);
    const unknownAccount=await fetch(`${baseUrl}/app`,{headers:{"oai-authenticated-user-email":`unknown-${authSuffix}@example.local`},redirect:"manual"});assert.equal(unknownAccount.status,307);assert.match(unknownAccount.headers.get("location")??"",/daftar/);
    const created = await api("/api/v1/jobs", { user: business, body: { title: `E2E Packing ${Date.now()}`, payAmount: 160000, category: "Gudang", city: "Tulungagung", district: "Kedungwaru", workerCount: 1, businessId: "business_kirana" } });
    assert.equal(created.status, "DRAFT");
    await api(`/api/v1/jobs/${created.id}/transition`, { user: business, body: { to: "PENDING_VERIFICATION", expectedVersion: 1 } });
    await api(`/api/v1/jobs/${created.id}/transition`, { user: business, body: { to: "PENDING_FUNDING", expectedVersion: 2 } });
    const invoice = await api(`/api/v1/jobs/${created.id}/fund`, { user: business, headers: { "idempotency-key": `e2e-${crypto.randomUUID()}` } });
    assert.equal(invoice.status, "PENDING");
    const paid = await api(`/api/v1/payments/${invoice.id}/mock-confirm`, { headers: { "x-mock-signature": "local-development-only" } });
    assert.equal(paid.jobStatus, "PUBLISHED");
    const application = await api(`/api/v1/jobs/${created.id}/applications`, { user: worker });
    const accepted = await api(`/api/v1/applications/${application.id}/accept`, { user: business });
    await api(`/api/v1/assignments/${accepted.assignmentId}/check-in`, { user: worker, body: { method: "PIN", latitude: -8.0436, longitude: 111.908 } });
    await api(`/api/v1/assignments/${accepted.assignmentId}/evidence`, { user: worker, body: { type: "WORK_RESULT", note: "Packing selesai dan jumlah sudah diperiksa." } });
    await api(`/api/v1/assignments/${accepted.assignmentId}/check-out`, { user: worker, body: { method: "PIN", latitude: -8.0436, longitude: 111.908 } });
    const submitted = await api(`/api/v1/assignments/${accepted.assignmentId}/submit`, { user: worker });
    assert.equal(submitted.status, "SUBMITTED");
    const revision = await api(`/api/v1/assignments/${accepted.assignmentId}/request-revision`, { user: business, body: { reason: "Tambahkan catatan jumlah paket per kategori." } });
    assert.equal(revision.status, "IN_PROGRESS");
    await api(`/api/v1/assignments/${accepted.assignmentId}/evidence`, { user: worker, body: { type: "CHECKLIST", note: "Jumlah paket per kategori sudah ditambahkan." } });
    await api(`/api/v1/assignments/${accepted.assignmentId}/submit`, { user: worker });
    const approved = await api(`/api/v1/assignments/${accepted.assignmentId}/approve`, { user: business });
    assert.deepEqual({ status: approved.status, payout: approved.payout.status, amount: approved.payout.amount }, { status: "APPROVED", payout: "SCHEDULED", amount: 160000 });
    const dispute = await api(`/api/v1/assignments/${accepted.assignmentId}/disputes`, { user: worker, body: { category: "PAYMENT", reason: "Nominal payout perlu dipastikan sebelum pencairan diproses." } });
    assert.equal(dispute.payoutStatus, "ON_HOLD");
    await api(`/api/v1/disputes/${dispute.id}/messages`, { user: business, body: { message: "Nominal sudah sesuai dengan kesepakatan pekerjaan." } });
    const resolved = await api(`/api/v1/disputes/${dispute.id}/resolve`, { user: "admin@pulihkanaku.local", body: { decision: "WORKER", note: "Bukti menunjukkan nominal pekerja sesuai dan payout dapat dilanjutkan." } });
    assert.equal(resolved.payout.status, "SCHEDULED");
    const processing = await api(`/api/v1/payouts/${approved.payout.id}/mock-process`, { headers: { "x-mock-signature": "local-development-only" } });
    assert.equal(processing.status, "PROCESSING");
    const completed = await api(`/api/v1/payouts/${approved.payout.id}/mock-complete`, { headers: { "x-mock-signature": "local-development-only" } });
    assert.deepEqual({ status: completed.status, reconciliation: completed.reconciliationStatus }, { status: "PAID", reconciliation: "MATCHED" });
    await api(`/api/v1/assignments/${accepted.assignmentId}/reviews`, { user: worker, body: { rating: 5, tags: ["Bayaran jelas"] } });
    await api(`/api/v1/assignments/${accepted.assignmentId}/reviews`, { user: business, body: { rating: 5, tags: ["Tepat waktu"] } });
  } finally {
    server.kill("SIGTERM");
  }
});
