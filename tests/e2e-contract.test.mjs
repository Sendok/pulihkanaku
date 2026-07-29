import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import test from "node:test";

const cwd = new URL("../", import.meta.url).pathname;
const baseUrl = "http://localhost:3011";
try { loadEnvFile(new URL("../.env", import.meta.url)); } catch (error) { if (error?.code !== "ENOENT") throw error; }
const e2eCronSecret = process.env.CRON_SECRET ?? "local-cron-secret";

function startServer() {
  const child = spawn(new URL("../node_modules/.bin/vinext", import.meta.url).pathname, ["dev", "--port", "3011"], { cwd, env: { ...process.env, NODE_ENV: "development", CRON_SECRET: e2eCronSecret, WRANGLER_LOG_PATH: ".wrangler/wrangler-e2e.log" }, stdio: ["ignore", "pipe", "pipe"] });
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

async function api(path, { user, body, headers = {}, method = "POST" } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
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
  for (const entity of ["user_credentials", "user_sessions", "business_members", "worker_payment_accounts", "notifications", "jobs", "job_applications", "job_assignments", "assignment_attendance", "assignment_evidence", "assignment_reviews", "payment_transactions", "ledger_entries", "payouts", "disputes", "dispute_messages", "reconciliation_records", "verification_submissions", "verification_documents", "audit_logs", "conversations", "conversation_participants", "messages", "risk_events", "risk_cases", "support_tickets"]) assert.match(schema, new RegExp(entity));
  assert.match(transition, /expectedVersion/); assert.match(transition, /audit_logs/); assert.match(stateMachine, /PENDING_FUNDING/); assert.match(stateMachine, /COMPLETED/);
  for (const route of ["auth/login", "auth/logout", "auth/sessions", "onboarding", "payout-accounts", "internal/verification-maintenance", "verifications", "verifications/[id]", "verifications/[id]/review", "documents/[id]", "jobs/[id]/applications", "applications/[id]/accept", "assignments/[id]/check-in", "assignments/[id]/check-out", "assignments/[id]/evidence", "assignments/[id]/submit", "assignments/[id]/request-revision", "assignments/[id]/approve", "assignments/[id]/disputes", "assignments/[id]/reviews", "disputes/[id]/messages", "disputes/[id]/resolve", "payouts/[id]/mock-process", "payouts/[id]/mock-complete", "conversations", "conversations/[id]/messages", "conversations/[id]/events", "support-tickets", "admin/risk-cases", "admin/risk-cases/[id]", "admin/support-tickets/[id]"]) await access(new URL(`../app/api/v1/${route}/route.ts`, import.meta.url));
});

test("funded job completes worker-to-payout workflow", { timeout: 60_000 }, async () => {
  const server = await startServer();
  const business = "business@pulihkanaku.local"; const worker = "worker@pulihkanaku.local";
  try {
    const roleSession=async(email)=>{const response=await fetch(`${baseUrl}/api/v1/internal/e2e-session`,{method:"POST",headers:{"content-type":"application/json","x-e2e-secret":"local-e2e-secret"},body:JSON.stringify({email})});const payload=await response.json();assert.equal(payload.success,true,JSON.stringify(payload));return response.headers.get("set-cookie")?.split(";")[0]??""};
    const workerSeedCookie=await roleSession(worker),businessSeedCookie=await roleSession(business),adminSeedCookie=await roleSession("admin@pulihkanaku.local");
    for(const[path,cookie,copy]of[["/app/messages",workerSeedCookie,"Percakapan pekerjaan"],["/business/messages",businessSeedCookie,"Percakapan pekerjaan"],["/admin/operations",adminSeedCookie,"Risk"]]){const response=await fetch(`${baseUrl}${path}`,{headers:{cookie},redirect:"manual"});assert.equal(response.status,200,`${path} ${response.status}`);assert.match(await response.text(),new RegExp(copy))}
    const authSuffix=String(Date.now()).slice(-8);const newWorker=`auth-${authSuffix}@example.local`;
    const registrationResponse=await fetch(`${baseUrl}/api/v1/auth/register`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({role:"WORKER",email:newWorker,password:"AmanSekali123",fullName:"Rina Puspita",phone:`0812${authSuffix}`,city:"Tulungagung",district:"Kedungwaru",termsAccepted:true,privacyAccepted:true,marketingConsent:false})});const registrationPayload=await registrationResponse.json();assert.equal(registrationPayload.success,true,JSON.stringify(registrationPayload));const registered=registrationPayload.data;let authCookie=registrationResponse.headers.get("set-cookie")?.split(";")[0]??"";assert.match(authCookie,/pulihkanaku_session=/);
    assert.deepEqual({role:registered.role,next:registered.next},{role:"WORKER",next:"/app"});
    const workerPage=await fetch(`${baseUrl}/app`,{headers:{cookie:authCookie},redirect:"manual"});assert.equal(workerPage.status,200);
    const wrongRole=await fetch(`${baseUrl}/business`,{headers:{cookie:authCookie},redirect:"manual"});assert.equal(wrongRole.status,307);assert.match(wrongRole.headers.get("location")??"",/akses-ditolak/);
    const anonymousPage=await fetch(`${baseUrl}/app`,{redirect:"manual"});assert.equal(anonymousPage.status,307);assert.match(anonymousPage.headers.get("location")??"",/masuk/);
    const logoutResponse=await fetch(`${baseUrl}/api/v1/auth/logout`,{method:"POST",headers:{cookie:authCookie}});assert.equal(logoutResponse.status,200);const revokedPage=await fetch(`${baseUrl}/app`,{headers:{cookie:authCookie},redirect:"manual"});assert.equal(revokedPage.status,307);
    const loginResponse=await fetch(`${baseUrl}/api/v1/auth/login`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({identifier:newWorker,password:"AmanSekali123",returnTo:"/business"})});const loginPayload=await loginResponse.json();assert.equal(loginPayload.success,true,JSON.stringify(loginPayload));assert.equal(loginPayload.data.next,"/app");authCookie=loginResponse.headers.get("set-cookie")?.split(";")[0]??"";
    await api("/api/v1/onboarding",{method:"PUT",headers:{cookie:authCookie},body:{birthYear:1995,bio:"Berpengalaman membantu operasional toko lokal.",skills:["Packing","Kasir"],availability:["Pagi"],preferredJobTypes:["Shift harian"],vehicles:["Motor"],maxDistanceKm:20}});
    const verificationForm=new FormData();verificationForm.set("identityDocument",new File([new Uint8Array([0xff,0xd8,0xff,0xe0,0,0,0,0])],"identitas.jpg",{type:"image/jpeg"}));
    const verificationResponse=await fetch(`${baseUrl}/api/v1/verifications`,{method:"POST",headers:{cookie:authCookie},body:verificationForm});const verificationPayload=await verificationResponse.json();assert.equal(verificationPayload.success,true,JSON.stringify(verificationPayload));
    const verificationDetailResponse=await fetch(`${baseUrl}/api/v1/verifications/${verificationPayload.data.id}`,{headers:{cookie:authCookie}});const verificationDetail=await verificationDetailResponse.json();assert.equal(verificationDetail.success,true);const documentId=verificationDetail.data.documents[0].id;
    const forbiddenDocument=await fetch(`${baseUrl}/api/v1/documents/${documentId}`,{headers:{"x-demo-user":business}});assert.equal(forbiddenDocument.status,403);
    const ownedDocument=await fetch(`${baseUrl}/api/v1/documents/${documentId}`,{headers:{cookie:authCookie}});assert.equal(ownedDocument.status,200);assert.equal(ownedDocument.headers.get("cache-control"),"private, no-store");
    const reviewed=await api(`/api/v1/verifications/${verificationPayload.data.id}/review`,{user:"admin@pulihkanaku.local",body:{decision:"APPROVE",expectedVersion:1,expiryDays:365}});assert.equal(reviewed.status,"APPROVED");
    const payoutAccount=await api("/api/v1/payout-accounts",{headers:{cookie:authCookie},body:{bankCode:"BRI",accountName:"Rina Puspita",accountNumber:"123456789012"}});assert.deepEqual({bank:payoutAccount.bankCode,lastFour:payoutAccount.lastFour,status:payoutAccount.status},{bank:"BRI",lastFour:"9012",status:"PENDING_VERIFICATION"});
    const payoutAccountResponse=await fetch(`${baseUrl}/api/v1/payout-accounts`,{headers:{cookie:authCookie}});const payoutAccountPayload=await payoutAccountResponse.json();assert.equal(payoutAccountPayload.success,true);assert.equal("account_number_encrypted" in payoutAccountPayload.data.account,false);
    const maintenance=await api("/api/v1/internal/verification-maintenance",{headers:{authorization:`Bearer ${e2eCronSecret}`}});assert.equal(typeof maintenance.verificationsExpired,"number");
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
    const conversation=await api("/api/v1/conversations",{user:worker,body:{assignmentId:accepted.assignmentId}});assert.ok(conversation.id);
    const message=await api(`/api/v1/conversations/${conversation.id}/messages`,{user:business,body:{body:"Briefing dimulai pukul sembilan di lokasi pekerjaan.",idempotencyKey:`message-${crypto.randomUUID()}`}});assert.equal(message.delivered,true);
    const blockedMessage=await api(`/api/v1/conversations/${conversation.id}/messages`,{user:worker,body:{body:"Tolong kirim kode OTP dan kata sandi sekarang.",idempotencyKey:`message-${crypto.randomUUID()}`}});assert.equal(blockedMessage.delivered,false);
    const ticket=await api("/api/v1/support-tickets",{user:worker,body:{category:"SAFETY",subject:"Permintaan informasi sensitif",description:"Saya menerima permintaan informasi sensitif dan membutuhkan pemeriksaan tim keamanan."}});assert.equal(ticket.priority,"HIGH");
    const riskQueue=await api("/api/v1/admin/risk-cases?status=OPEN",{user:"admin@pulihkanaku.local",method:"GET"});assert.ok(riskQueue.items.length>=1);
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
