import assert from "node:assert/strict";
import test from "node:test";
import { assertJobTransition, availableJobTransitions, InvalidJobTransitionError } from "../lib/domain/job-state-machine.ts";
import { calculateMatchingScore } from "../lib/domain/matching.ts";
import { calculatePaymentQuote } from "../lib/domain/payment.ts";
import { can } from "../lib/domain/authorization.ts";
import { assertApplicationTransition, assertAssignmentTransition } from "../lib/domain/assignment-state-machine.ts";
import { assertDisputeTransition, assertPayoutTransition } from "../lib/domain/finance-state-machine.ts";
import { normalizeIndonesianPhone } from "../lib/domain/phone.ts";
import { safeDocumentName, validateVerificationFile } from "../lib/domain/verification-document.ts";

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

test("finance workflow enforces payout hold and dispute resolution", () => {
  assert.doesNotThrow(() => assertPayoutTransition("SCHEDULED", "PROCESSING"));
  assert.doesNotThrow(() => assertPayoutTransition("ON_HOLD", "SCHEDULED"));
  assert.throws(() => assertPayoutTransition("SCHEDULED", "PAID"), /PAYOUT_INVALID_TRANSITION/);
  assert.doesNotThrow(() => assertDisputeTransition("OPEN", "RESOLVED_WORKER"));
  assert.throws(() => assertDisputeTransition("CLOSED", "UNDER_REVIEW"), /DISPUTE_INVALID_TRANSITION/);
});

test("Indonesian phone numbers normalize to E.164", () => {
  assert.equal(normalizeIndonesianPhone("0812-3456-7890"), "+6281234567890");
  assert.equal(normalizeIndonesianPhone("6281234567890"), "+6281234567890");
  assert.equal(normalizeIndonesianPhone("+62 812 3456 7890"), "+6281234567890");
  assert.throws(() => normalizeIndonesianPhone("021555"), /PHONE_INVALID/);
});

test("verification documents require an allowed MIME type and matching signature", async () => {
  await assert.doesNotReject(() => validateVerificationFile(new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "ktp.jpg", { type: "image/jpeg" })));
  await assert.rejects(() => validateVerificationFile(new File(["<script>alert(1)</script>"], "ktp.jpg", { type: "image/jpeg" })), /INVALID_FILE_SIGNATURE/);
  await assert.rejects(() => validateVerificationFile(new File(["hello"], "ktp.svg", { type: "image/svg+xml" })), /UNSUPPORTED_FILE_TYPE/);
  assert.equal(safeDocumentName('../../KTP "Rina".pdf'), "KTP Rina.pdf");
});
