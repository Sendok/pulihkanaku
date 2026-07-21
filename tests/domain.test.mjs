import assert from "node:assert/strict";
import test from "node:test";
import { assertJobTransition, availableJobTransitions, InvalidJobTransitionError } from "../lib/domain/job-state-machine.ts";
import { calculateMatchingScore } from "../lib/domain/matching.ts";
import { calculatePaymentQuote } from "../lib/domain/payment.ts";
import { can } from "../lib/domain/authorization.ts";
import { assertApplicationTransition, assertAssignmentTransition } from "../lib/domain/assignment-state-machine.ts";

test("job state machine accepts the funded publish path", () => {
  assert.doesNotThrow(() => assertJobTransition("PENDING_FUNDING", "PUBLISHED"));
  assert.ok(availableJobTransitions("PUBLISHED").includes("APPLICATION_CLOSED"));
});

test("job state machine rejects skipping funding", () => {
  assert.throws(() => assertJobTransition("DRAFT", "PUBLISHED"), InvalidJobTransitionError);
});

test("matching is deterministic and explainable", () => {
  const result = calculateMatchingScore({ skillMatch: 100, availabilityMatch: 100, distanceScore: 80, reliabilityScore: 90, experienceScore: 70, preferenceMatch: 80, businessRepeatScore: 0 });
  assert.equal(result.score, 87);
  assert.deepEqual(result.reasons, ["Sesuai dengan kemampuan Anda", "Cocok dengan jadwal Anda", "Berjarak dekat"]);
});

test("payment quote preserves worker payable", () => {
  assert.deepEqual(calculatePaymentQuote(175_000), { workerPayable: 175_000, platformFee: 17_500, providerFee: 1_925, invoiceTotal: 194_425, currency: "IDR" });
});

test("RBAC does not grant payout override to business", () => {
  assert.equal(can("BUSINESS_OWNER", "job:create"), true);
  assert.equal(can("BUSINESS_OWNER", "payout:override"), false);
});

test("application and assignment workflow blocks skipped steps", () => {
  assert.doesNotThrow(() => assertApplicationTransition("SUBMITTED", "ACCEPTED"));
  assert.doesNotThrow(() => assertAssignmentTransition("CONFIRMED", "IN_PROGRESS"));
  assert.throws(() => assertAssignmentTransition("CONFIRMED", "APPROVED"), /ASSIGNMENT_INVALID_TRANSITION/);
});
