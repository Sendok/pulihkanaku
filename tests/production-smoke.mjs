import assert from "node:assert/strict";

const base = process.env.SERVICE_URL ?? "http://127.0.0.1:4000/api/v1";
async function json(path) {
  const response = await fetch(`${base}${path}`, { headers: { "x-request-id": `production-smoke-${Date.now()}` }, signal: AbortSignal.timeout(10_000) });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  return body;
}

assert.equal((await json("/health/live")).status, "ok");
assert.equal((await json("/health/ready")).status, "ready");
const invalid = await fetch(`${base}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier: "invalid", password: "invalid" }), signal: AbortSignal.timeout(10_000) });
assert.equal(invalid.status, 400);
const invalidBody = await invalid.json();
assert.equal(invalidBody.success, false);
assert.ok(invalidBody.error.requestId);
const rejectedWebhook = await fetch(`${base}/payments/webhooks/xendit`, { method: "POST", headers: { "content-type": "application/json", "webhook-id": `smoke-${Date.now()}` }, body: JSON.stringify({ status: "PENDING" }), signal: AbortSignal.timeout(10_000) });
assert.equal(rejectedWebhook.status, 401);
console.log("Production HTTP smoke checks passed.");
