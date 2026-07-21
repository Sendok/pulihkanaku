CREATE TABLE `dispute_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`dispute_id` text NOT NULL,
	`sender_user_id` text NOT NULL,
	`visibility` text DEFAULT 'PUBLIC' NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`dispute_id`) REFERENCES `disputes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `dispute_message_idx` ON `dispute_messages` (`dispute_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`job_id` text NOT NULL,
	`opened_by_user_id` text NOT NULL,
	`category` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`assigned_to_user_id` text,
	`resolution` text,
	`resolution_note` text,
	`resolved_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `job_assignments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`opened_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `dispute_status_idx` ON `disputes` (`status`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `dispute_open_assignment_idx` ON `disputes` (`assignment_id`,`status`);--> statement-breakpoint
CREATE TABLE `reconciliation_records` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`provider_reference` text NOT NULL,
	`internal_reference` text NOT NULL,
	`status` text NOT NULL,
	`expected_amount` integer NOT NULL,
	`actual_amount` integer NOT NULL,
	`variance` integer NOT NULL,
	`resolved_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reconciliation_provider_idx` ON `reconciliation_records` (`provider_reference`);--> statement-breakpoint
CREATE INDEX `reconciliation_status_idx` ON `reconciliation_records` (`status`,`created_at`);--> statement-breakpoint
ALTER TABLE `payouts` ADD `processed_at` integer;--> statement-breakpoint
ALTER TABLE `payouts` ADD `paid_at` integer;--> statement-breakpoint
ALTER TABLE `payouts` ADD `failure_code` text;
--> statement-breakpoint
INSERT OR IGNORE INTO `users` (`id`,`email`,`phone_e164`,`role`,`status`,`created_at`,`updated_at`) VALUES
('user_support','support@pulihkanaku.local','+628123450004','SUPPORT_AGENT','ACTIVE',1784646000000,1784646000000);
