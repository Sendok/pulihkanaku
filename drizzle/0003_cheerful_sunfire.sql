CREATE TABLE `user_consents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`version` text NOT NULL,
	`granted` integer NOT NULL,
	`granted_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `consent_user_type_version_idx` ON `user_consents` (`user_id`,`type`,`version`);--> statement-breakpoint
CREATE TABLE `worker_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`full_name` text NOT NULL,
	`city` text NOT NULL,
	`district` text NOT NULL,
	`onboarding_status` text DEFAULT 'BASIC_COMPLETE' NOT NULL,
	`verification_level` text DEFAULT 'BASIC' NOT NULL,
	`profile_completion` integer DEFAULT 35 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `worker_profile_user_idx` ON `worker_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `worker_profile_city_idx` ON `worker_profiles` (`city`);--> statement-breakpoint
ALTER TABLE `businesses` ADD `category` text DEFAULT 'Lainnya' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `full_name` text DEFAULT '' NOT NULL;