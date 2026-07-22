CREATE TABLE `conversation_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`last_read_at` integer,
	`muted_until` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conversation_participant_idx` ON `conversation_participants` (`conversation_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `conversation_user_idx` ON `conversation_participants` (`user_id`,`conversation_id`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text,
	`job_id` text,
	`type` text DEFAULT 'ASSIGNMENT' NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`last_message_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `job_assignments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conversation_assignment_idx` ON `conversations` (`assignment_id`);--> statement-breakpoint
CREATE INDEX `conversation_last_message_idx` ON `conversations` (`last_message_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_user_id` text NOT NULL,
	`body` text NOT NULL,
	`type` text DEFAULT 'TEXT' NOT NULL,
	`moderation_status` text DEFAULT 'ALLOWED' NOT NULL,
	`idempotency_key` text NOT NULL,
	`metadata` text,
	`edited_at` integer,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `message_idempotency_idx` ON `messages` (`conversation_id`,`sender_user_id`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `message_conversation_idx` ON `messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `notification_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`notification_id` text NOT NULL,
	`channel` text NOT NULL,
	`status` text DEFAULT 'QUEUED' NOT NULL,
	`provider_reference` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_retry_at` integer,
	`failure_code` text,
	`sent_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_delivery_idx` ON `notification_deliveries` (`notification_id`,`channel`);--> statement-breakpoint
CREATE INDEX `notification_delivery_retry_idx` ON `notification_deliveries` (`status`,`next_retry_at`);--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email_enabled` integer DEFAULT true NOT NULL,
	`sms_enabled` integer DEFAULT false NOT NULL,
	`whatsapp_enabled` integer DEFAULT true NOT NULL,
	`push_enabled` integer DEFAULT false NOT NULL,
	`quiet_hours` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_preference_user_idx` ON `notification_preferences` (`user_id`);--> statement-breakpoint
CREATE TABLE `risk_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`priority` text NOT NULL,
	`score` integer NOT NULL,
	`reason` text NOT NULL,
	`assigned_to_user_id` text,
	`resolution` text,
	`resolved_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `risk_case_queue_idx` ON `risk_cases` (`status`,`priority`,`created_at`);--> statement-breakpoint
CREATE TABLE `risk_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`type` text NOT NULL,
	`severity` text NOT NULL,
	`score` integer NOT NULL,
	`source` text NOT NULL,
	`reference_id` text,
	`fingerprint` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `risk_event_fingerprint_idx` ON `risk_events` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `risk_event_user_idx` ON `risk_events` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`dispute_id` text,
	`category` text NOT NULL,
	`subject` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`priority` text DEFAULT 'NORMAL' NOT NULL,
	`assigned_to_user_id` text,
	`sla_due_at` integer NOT NULL,
	`resolved_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`dispute_id`) REFERENCES `disputes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `support_ticket_queue_idx` ON `support_tickets` (`status`,`sla_due_at`);