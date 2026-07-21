CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`reference` text NOT NULL,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_reference_idx` ON `notifications` (`reference`);--> statement-breakpoint
CREATE INDEX `notification_user_read_idx` ON `notifications` (`user_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `worker_payment_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bank_code` text NOT NULL,
	`account_name` text NOT NULL,
	`account_number_encrypted` text NOT NULL,
	`encryption_iv` text NOT NULL,
	`last_four` text NOT NULL,
	`status` text DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	`provider_reference` text,
	`verified_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_account_user_idx` ON `worker_payment_accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `payment_account_status_idx` ON `worker_payment_accounts` (`status`);