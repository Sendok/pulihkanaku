import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  phoneE164: text("phone_e164"),
  role: text("role").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  ...timestamps,
}, (table) => [uniqueIndex("users_email_idx").on(table.email), uniqueIndex("users_phone_idx").on(table.phoneE164)]);

export const businesses = sqliteTable("businesses", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  city: text("city").notNull(),
  verificationStatus: text("verification_status").notNull().default("DRAFT"),
  trustScore: integer("trust_score").notNull().default(0),
  ...timestamps,
}, (table) => [index("business_owner_idx").on(table.ownerUserId), index("business_verification_idx").on(table.verificationStatus)]);

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
  version: integer("version").notNull().default(1),
  ...timestamps,
}, (table) => [index("assignment_job_idx").on(table.jobId), index("assignment_status_idx").on(table.status)]);

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
  version: integer("version").notNull().default(1),
  ...timestamps,
}, (table) => [index("payout_status_idx").on(table.status), index("payout_worker_idx").on(table.workerUserId)]);

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
