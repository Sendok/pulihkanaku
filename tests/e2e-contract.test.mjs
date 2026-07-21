import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("vertical slice contracts exist and remain audited", async () => {
  const [schema, transition, stateMachine] = await Promise.all([
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/v1/jobs/[id]/transition/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/domain/job-state-machine.ts", import.meta.url), "utf8"),
  ]);
  for (const entity of ["jobs", "job_applications", "job_assignments", "payment_transactions", "payouts", "audit_logs"]) assert.match(schema, new RegExp(entity));
  assert.match(transition, /expectedVersion/);
  assert.match(transition, /audit_logs/);
  assert.match(stateMachine, /PENDING_FUNDING/);
  assert.match(stateMachine, /COMPLETED/);
});
