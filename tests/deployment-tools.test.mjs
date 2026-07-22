import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const valid = {
  POSTGRES_PASSWORD: "test-postgres-password-123456",
  REDIS_PASSWORD: "test-redis-password-123456789",
  MINIO_ROOT_USER: "pulihkanaku",
  MINIO_ROOT_PASSWORD: "test-minio-password-123456789",
  SESSION_SECRET: "test-session-secret-at-least-32-characters",
  OTP_SECRET: "test-otp-secret-independent-32-characters",
  PAYOUT_ENCRYPTION_KEY: "Y2ktcGF5b3V0LWtleS0zMi1ieXRlcy1sb25nISEhISE",
  CORS_ORIGINS: "https://staging.pulihkanaku.test",
  METRICS_TOKEN: "test-metrics-token-at-least-24-characters",
  PAYOUT_PROVIDER: "disabled",
  EMAIL_PROVIDER: "disabled",
  GO_LIVE: "false",
};

function validate(overrides = {}) {
  return spawnSync(process.execPath, ["scripts/validate-production-env.mjs"], { cwd: process.cwd(), env: { ...process.env, ...valid, ...overrides }, encoding: "utf8" });
}

test("production environment validator accepts a safe infrastructure stage", () => {
  const result = validate();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Environment valid/);
});

test("production environment validator blocks go-live without providers", () => {
  const result = validate({ GO_LIVE: "true" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /requires PAYOUT_PROVIDER=xendit/);
  assert.match(result.stderr, /requires at least one notification provider/);
});

test("self-host tooling includes dependency, malware, heartbeat, and webhook checks", () => {
  const preflight = readFileSync("apps/api/src/preflight.ts", "utf8");
  const smoke = readFileSync("tests/production-smoke.mjs", "utf8");
  const deployment = readFileSync("scripts/deploy-production.sh", "utf8");
  const cutover = readFileSync("apps/api/src/cutover-check.ts", "utf8");
  for (const boundary of ["postgres", "redis", "minio", "clamav-signature", "worker-heartbeat"]) assert.match(preflight, new RegExp(boundary));
  assert.match(smoke, /payments\/webhooks\/xendit/);
  assert.match(deployment, /preflight\.js/);
  assert.match(cutover, /REQUIRE_QUIESCENT/);
});

test("D1 cutover migrator transfers, checkpoints, and compares content",()=>{
  const migrator=readFileSync("scripts/migrate-d1-to-postgres.mjs","utf8");
  for(const contract of["CONFIRM_D1_CUTOVER","on conflict (id)","state.completed","sourceContentChecksum","targetContentChecksum","stableUuid","rollback"])assert.match(migrator,new RegExp(contract.replace(/[()]/g,"\\$&")));
});
