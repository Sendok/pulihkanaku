ALTER TABLE "job_assignments" ADD COLUMN "evidence_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "latitude" numeric;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "longitude" numeric;