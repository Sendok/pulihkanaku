CREATE TABLE "auth_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key_hash" text NOT NULL,
	"action" text NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"blocked_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"version" text NOT NULL,
	"granted" integer NOT NULL,
	"granted_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "emergency_contact_name" text;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "emergency_contact_phone" text;--> statement-breakpoint
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_rate_key_uq" ON "auth_rate_limits" USING btree ("key_hash","action");--> statement-breakpoint
CREATE INDEX "auth_rate_block_idx" ON "auth_rate_limits" USING btree ("blocked_until");--> statement-breakpoint
CREATE UNIQUE INDEX "consent_user_type_version_uq" ON "user_consents" USING btree ("user_id","type","version");