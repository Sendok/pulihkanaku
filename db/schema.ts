import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull().default(""),
  phoneE164: text("phone_e164"),
  role: text("role").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  ...timestamps,
}, (table) => [uniqueIndex("users_email_idx").on(table.email), uniqueIndex("users_phone_idx").on(table.phoneE164)]);

export const businesses = sqliteTable("businesses", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  category: text("category").notNull().default("Lainnya"),
  city: text("city").notNull(),
  district: text("district").notNull().default(""),
  address: text("address").notNull().default(""),
  representativeName: text("representative_name").notNull().default(""),
  nib: text("nib"),
  onboardingStatus: text("onboarding_status").notNull().default("BASIC_COMPLETE"),
  verificationStatus: text("verification_status").notNull().default("DRAFT"),
  trustScore: integer("trust_score").notNull().default(0),
  ...timestamps,
}, (table) => [index("business_owner_idx").on(table.ownerUserId), index("business_verification_idx").on(table.verificationStatus)]);

export const workerProfiles = sqliteTable("worker_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  fullName: text("full_name").notNull(),
  city: text("city").notNull(),
  district: text("district").notNull(),
  birthYear: integer("birth_year"),
  bio: text("bio").notNull().default(""),
  skills: text("skills").notNull().default("[]"),
  availability: text("availability").notNull().default("[]"),
  preferredJobTypes: text("preferred_job_types").notNull().default("[]"),
  vehicles: text("vehicles").notNull().default("[]"),
  maxDistanceKm: integer("max_distance_km").notNull().default(10),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  payoutStatus: text("payout_status").notNull().default("MISSING"),
  onboardingStatus: text("onboarding_status").notNull().default("BASIC_COMPLETE"),
  verificationLevel: text("verification_level").notNull().default("BASIC"),
  profileCompletion: integer("profile_completion").notNull().default(35),
  ...timestamps,
}, (table) => [uniqueIndex("worker_profile_user_idx").on(table.userId), index("worker_profile_city_idx").on(table.city)]);

export const userConsents = sqliteTable("user_consents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  version: text("version").notNull(),
  granted: integer("granted", { mode: "boolean" }).notNull(),
  grantedAt: integer("granted_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("consent_user_type_version_idx").on(table.userId, table.type, table.version)]);

export const verificationSubmissions = sqliteTable("verification_submissions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  subjectType: text("subject_type").notNull(),
  businessId: text("business_id").references(() => businesses.id),
  status: text("status").notNull().default("SUBMITTED"),
  submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).notNull(),
  reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
  reviewedByUserId: text("reviewed_by_user_id").references(() => users.id),
  reviewReason: text("review_reason"),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
  version: integer("version").notNull().default(1),
  ...timestamps,
}, (table) => [index("verification_status_idx").on(table.status, table.submittedAt), index("verification_user_idx").on(table.userId, table.submittedAt)]);

export const verificationDocuments = sqliteTable("verification_documents", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id").notNull().references(() => verificationSubmissions.id),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  objectKey: text("object_key").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("verification_document_object_idx").on(table.objectKey), index("verification_document_submission_idx").on(table.submissionId)]);

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  businessId: text("business_id").notNull().references(() => businesses.id),
  createdByEmail: text("created_by_email").notNull(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  city: text("city").notNull(),
  district: text("district").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
  payAmount: integer("pay_amount").notNull(),
  workerCount: integer("worker_count").notNull(),
  status: text("status").notNull().default("DRAFT"),
  fundingStatus: text("funding_status").notNull().default("UNFUNDED"),
  version: integer("version").notNull().default(1),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  ...timestamps,
}, (table) => [
  uniqueIndex("jobs_slug_idx").on(table.slug),
  index("jobs_status_idx").on(table.status),
  index("jobs_city_idx").on(table.city),
  index("jobs_category_idx").on(table.category),
  index("jobs_starts_at_idx").on(table.startsAt),
]);

export const jobApplications = sqliteTable("job_applications", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull().references(() => jobs.id),
  workerUserId: text("worker_user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("SUBMITTED"),
  acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
  version: integer("version").notNull().default(1),
  ...timestamps,
}, (table) => [uniqueIndex("application_worker_job_idx").on(table.workerUserId, table.jobId), index("application_job_idx").on(table.jobId)]);

export const jobAssignments = sqliteTable("job_assignments", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull().references(() => jobs.id),
  applicationId: text("application_id").notNull().references(() => jobApplications.id),
  workerUserId: text("worker_user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("CONFIRMED"),
  checkedInAt: integer("checked_in_at", { mode: "timestamp_ms" }),
  checkedOutAt: integer("checked_out_at", { mode: "timestamp_ms" }),
  evidenceSubmittedAt: integer("evidence_submitted_at", { mode: "timestamp_ms" }),
  submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
  approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
  version: integer("version").notNull().default(1),
  ...timestamps,
}, (table) => [index("assignment_job_idx").on(table.jobId), index("assignment_status_idx").on(table.status), uniqueIndex("assignment_application_idx").on(table.applicationId)]);

export const assignmentAttendance = sqliteTable("assignment_attendance", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").notNull().references(() => jobAssignments.id),
  type: text("type").notNull(),
  method: text("method").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  distanceMeters: integer("distance_meters"),
  deviceMetadata: text("device_metadata"),
  occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("attendance_assignment_idx").on(table.assignmentId, table.occurredAt)]);

export const assignmentEvidence = sqliteTable("assignment_evidence", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").notNull().references(() => jobAssignments.id),
  type: text("type").notNull(),
  note: text("note"),
  storageKey: text("storage_key"),
  mimeType: text("mime_type"),
  capturedAt: integer("captured_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("evidence_assignment_idx").on(table.assignmentId, table.createdAt)]);

export const assignmentReviews = sqliteTable("assignment_reviews", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").notNull().references(() => jobAssignments.id),
  reviewerUserId: text("reviewer_user_id").notNull().references(() => users.id),
  revieweeType: text("reviewee_type").notNull(),
  rating: integer("rating").notNull(),
  tags: text("tags").notNull().default("[]"),
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("review_assignment_reviewer_idx").on(table.assignmentId, table.reviewerUserId)]);

export const paymentTransactions = sqliteTable("payment_transactions", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull().references(() => jobs.id),
  providerReference: text("provider_reference").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("IDR"),
  idempotencyKey: text("idempotency_key").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("payment_reference_idx").on(table.providerReference), uniqueIndex("payment_idempotency_idx").on(table.idempotencyKey)]);

export const payouts = sqliteTable("payouts", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").notNull().references(() => jobAssignments.id),
  workerUserId: text("worker_user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("PENDING"),
  providerReference: text("provider_reference"),
  processedAt: integer("processed_at", { mode: "timestamp_ms" }),
  paidAt: integer("paid_at", { mode: "timestamp_ms" }),
  failureCode: text("failure_code"),
  version: integer("version").notNull().default(1),
  ...timestamps,
}, (table) => [index("payout_status_idx").on(table.status), index("payout_worker_idx").on(table.workerUserId)]);

export const ledgerEntries = sqliteTable("ledger_entries", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull().references(() => jobs.id),
  assignmentId: text("assignment_id").references(() => jobAssignments.id),
  transactionId: text("transaction_id").references(() => paymentTransactions.id),
  type: text("type").notNull(),
  direction: text("direction").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("IDR"),
  reference: text("reference").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("ledger_job_idx").on(table.jobId, table.createdAt), uniqueIndex("ledger_reference_idx").on(table.reference)]);

export const disputes = sqliteTable("disputes", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").notNull().references(() => jobAssignments.id),
  jobId: text("job_id").notNull().references(() => jobs.id),
  openedByUserId: text("opened_by_user_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("OPEN"),
  assignedToUserId: text("assigned_to_user_id").references(() => users.id),
  resolution: text("resolution"),
  resolutionNote: text("resolution_note"),
  resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
  version: integer("version").notNull().default(1),
  ...timestamps,
}, (table) => [index("dispute_status_idx").on(table.status, table.createdAt), uniqueIndex("dispute_open_assignment_idx").on(table.assignmentId, table.status)]);

export const disputeMessages = sqliteTable("dispute_messages", {
  id: text("id").primaryKey(),
  disputeId: text("dispute_id").notNull().references(() => disputes.id),
  senderUserId: text("sender_user_id").notNull().references(() => users.id),
  visibility: text("visibility").notNull().default("PUBLIC"),
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("dispute_message_idx").on(table.disputeId, table.createdAt)]);

export const reconciliationRecords = sqliteTable("reconciliation_records", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  providerReference: text("provider_reference").notNull(),
  internalReference: text("internal_reference").notNull(),
  status: text("status").notNull(),
  expectedAmount: integer("expected_amount").notNull(),
  actualAmount: integer("actual_amount").notNull(),
  variance: integer("variance").notNull(),
  resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("reconciliation_provider_idx").on(table.providerReference), index("reconciliation_status_idx").on(table.status, table.createdAt)]);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorEmail: text("actor_email").notNull(),
  actorRole: text("actor_role").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  previousState: text("previous_state"),
  nextState: text("next_state"),
  requestId: text("request_id").notNull(),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("audit_entity_idx").on(table.entityType, table.entityId), index("audit_created_idx").on(table.createdAt)]);
