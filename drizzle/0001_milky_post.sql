CREATE TABLE `assignment_attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`type` text NOT NULL,
	`method` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`distance_meters` integer,
	`device_metadata` text,
	`occurred_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `job_assignments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `attendance_assignment_idx` ON `assignment_attendance` (`assignment_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `assignment_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`type` text NOT NULL,
	`note` text,
	`storage_key` text,
	`mime_type` text,
	`captured_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `job_assignments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `evidence_assignment_idx` ON `assignment_evidence` (`assignment_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `assignment_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`reviewer_user_id` text NOT NULL,
	`reviewee_type` text NOT NULL,
	`rating` integer NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`comment` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `job_assignments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_assignment_reviewer_idx` ON `assignment_reviews` (`assignment_id`,`reviewer_user_id`);--> statement-breakpoint
CREATE TABLE `ledger_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`assignment_id` text,
	`transaction_id` text,
	`type` text NOT NULL,
	`direction` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`reference` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignment_id`) REFERENCES `job_assignments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `payment_transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ledger_job_idx` ON `ledger_entries` (`job_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_reference_idx` ON `ledger_entries` (`reference`);--> statement-breakpoint
ALTER TABLE `job_applications` ADD `accepted_at` integer;--> statement-breakpoint
ALTER TABLE `job_assignments` ADD `evidence_submitted_at` integer;--> statement-breakpoint
ALTER TABLE `job_assignments` ADD `submitted_at` integer;--> statement-breakpoint
ALTER TABLE `job_assignments` ADD `approved_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `assignment_application_idx` ON `job_assignments` (`application_id`);