CREATE TABLE `verification_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`object_key` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`submission_id`) REFERENCES `verification_submissions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_document_object_idx` ON `verification_documents` (`object_key`);--> statement-breakpoint
CREATE INDEX `verification_document_submission_idx` ON `verification_documents` (`submission_id`);--> statement-breakpoint
CREATE TABLE `verification_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subject_type` text NOT NULL,
	`business_id` text,
	`status` text DEFAULT 'SUBMITTED' NOT NULL,
	`submitted_at` integer NOT NULL,
	`reviewed_at` integer,
	`reviewed_by_user_id` text,
	`review_reason` text,
	`expires_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `verification_status_idx` ON `verification_submissions` (`status`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `verification_user_idx` ON `verification_submissions` (`user_id`,`submitted_at`);--> statement-breakpoint
ALTER TABLE `businesses` ADD `district` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `address` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `representative_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `nib` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `onboarding_status` text DEFAULT 'BASIC_COMPLETE' NOT NULL;--> statement-breakpoint
ALTER TABLE `worker_profiles` ADD `birth_year` integer;--> statement-breakpoint
ALTER TABLE `worker_profiles` ADD `bio` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `worker_profiles` ADD `skills` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `worker_profiles` ADD `availability` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `worker_profiles` ADD `preferred_job_types` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `worker_profiles` ADD `vehicles` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `worker_profiles` ADD `max_distance_km` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `worker_profiles` ADD `emergency_contact_name` text;--> statement-breakpoint
ALTER TABLE `worker_profiles` ADD `emergency_contact_phone` text;--> statement-breakpoint
ALTER TABLE `worker_profiles` ADD `payout_status` text DEFAULT 'MISSING' NOT NULL;
--> statement-breakpoint
INSERT INTO `worker_profiles` (`id`,`user_id`,`full_name`,`city`,`district`,`birth_year`,`bio`,`skills`,`availability`,`preferred_job_types`,`vehicles`,`max_distance_km`,`onboarding_status`,`verification_level`,`profile_completion`,`payout_status`,`created_at`,`updated_at`)
SELECT 'worker_profile_arini','user_worker_arini','Arini Rahma','Tulungagung','Kedungwaru',1996,'Pekerja demo terverifikasi untuk pengujian alur end-to-end.','["Administrasi","Packing"]','["Pagi","Akhir pekan"]','["Shift harian","Proyek"]','["Motor"]',20,'VERIFIED','IDENTITY_VERIFIED',100,'VERIFIED',1784631034577,1784631034577
WHERE EXISTS (SELECT 1 FROM `users` WHERE `id`='user_worker_arini') AND NOT EXISTS (SELECT 1 FROM `worker_profiles` WHERE `user_id`='user_worker_arini');
