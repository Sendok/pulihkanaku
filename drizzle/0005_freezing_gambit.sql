CREATE TABLE `auth_rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`key_hash` text NOT NULL,
	`action` text NOT NULL,
	`window_started_at` integer NOT NULL,
	`attempts` integer DEFAULT 1 NOT NULL,
	`blocked_until` integer,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_rate_key_idx` ON `auth_rate_limits` (`key_hash`,`action`);--> statement-breakpoint
CREATE INDEX `auth_rate_block_idx` ON `auth_rate_limits` (`blocked_until`);--> statement-breakpoint
CREATE TABLE `business_members` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`invited_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invited_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `business_member_user_idx` ON `business_members` (`business_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `business_member_role_idx` ON `business_members` (`user_id`,`role`);--> statement-breakpoint
CREATE TABLE `user_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`password_iterations` integer NOT NULL,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`password_updated_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credential_user_idx` ON `user_credentials` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`device_name` text NOT NULL,
	`ip_hash` text NOT NULL,
	`user_agent_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_idx` ON `user_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `user_sessions` (`user_id`,`expires_at`);
--> statement-breakpoint
INSERT INTO `business_members` (`id`,`business_id`,`user_id`,`role`,`status`,`created_at`,`updated_at`)
SELECT 'membership_' || `id`,`id`,`owner_user_id`,'BUSINESS_OWNER','ACTIVE',`created_at`,`updated_at` FROM `businesses`
WHERE NOT EXISTS (SELECT 1 FROM `business_members` m WHERE m.`business_id`=`businesses`.`id` AND m.`user_id`=`businesses`.`owner_user_id`);
