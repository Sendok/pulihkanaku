CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_email` text NOT NULL,
	`actor_role` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`previous_state` text,
	`next_state` text,
	`request_id` text NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`verification_status` text DEFAULT 'DRAFT' NOT NULL,
	`trust_score` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `business_owner_idx` ON `businesses` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `business_verification_idx` ON `businesses` (`verification_status`);--> statement-breakpoint
CREATE TABLE `job_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`worker_user_id` text NOT NULL,
	`status` text DEFAULT 'SUBMITTED' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`worker_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `application_worker_job_idx` ON `job_applications` (`worker_user_id`,`job_id`);--> statement-breakpoint
CREATE INDEX `application_job_idx` ON `job_applications` (`job_id`);--> statement-breakpoint
CREATE TABLE `job_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`application_id` text NOT NULL,
	`worker_user_id` text NOT NULL,
	`status` text DEFAULT 'CONFIRMED' NOT NULL,
	`checked_in_at` integer,
	`checked_out_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`application_id`) REFERENCES `job_applications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`worker_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `assignment_job_idx` ON `job_assignments` (`job_id`);--> statement-breakpoint
CREATE INDEX `assignment_status_idx` ON `job_assignments` (`status`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`created_by_email` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`city` text NOT NULL,
	`district` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`pay_amount` integer NOT NULL,
	`worker_count` integer NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`funding_status` text DEFAULT 'UNFUNDED' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_slug_idx` ON `jobs` (`slug`);--> statement-breakpoint
CREATE INDEX `jobs_status_idx` ON `jobs` (`status`);--> statement-breakpoint
CREATE INDEX `jobs_city_idx` ON `jobs` (`city`);--> statement-breakpoint
CREATE INDEX `jobs_category_idx` ON `jobs` (`category`);--> statement-breakpoint
CREATE INDEX `jobs_starts_at_idx` ON `jobs` (`starts_at`);--> statement-breakpoint
CREATE TABLE `payment_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`provider_reference` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_reference_idx` ON `payment_transactions` (`provider_reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_idempotency_idx` ON `payment_transactions` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`worker_user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`provider_reference` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `job_assignments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`worker_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payout_status_idx` ON `payouts` (`status`);--> statement-breakpoint
CREATE INDEX `payout_worker_idx` ON `payouts` (`worker_user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`phone_e164` text,
	`role` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_idx` ON `users` (`phone_e164`);
--> statement-breakpoint
INSERT INTO `users` (`id`,`email`,`phone_e164`,`role`,`status`,`created_at`,`updated_at`) VALUES
('user_business_kirana','business@pulihkanaku.local','+628123450001','BUSINESS_OWNER','ACTIVE',1784631034577,1784631034577),
('user_worker_arini','worker@pulihkanaku.local','+628123450002','WORKER','ACTIVE',1784631034577,1784631034577),
('user_admin','admin@pulihkanaku.local','+628123450003','SUPER_ADMIN','ACTIVE',1784631034577,1784631034577);
--> statement-breakpoint
INSERT INTO `businesses` (`id`,`owner_user_id`,`name`,`city`,`verification_status`,`trust_score`,`created_at`,`updated_at`) VALUES
('business_kirana','user_business_kirana','Kirana Home Living','Tulungagung','VERIFIED',94,1784631034577,1784631034577),
('business_ruang_rasa','user_business_kirana','Ruang Rasa Event','Tulungagung','VERIFIED',91,1784631034577,1784631034577),
('business_dapur_sri','user_business_kirana','Dapur Mbok Sri','Tulungagung','VERIFIED',89,1784631034577,1784631034577);
--> statement-breakpoint
INSERT INTO `jobs` (`id`,`business_id`,`created_by_email`,`slug`,`title`,`category`,`description`,`city`,`district`,`latitude`,`longitude`,`starts_at`,`ends_at`,`pay_amount`,`worker_count`,`status`,`funding_status`,`version`,`published_at`,`created_at`,`updated_at`) VALUES
('job_tlg_001','business_kirana','business@pulihkanaku.local','admin-marketplace-kedungwaru','Admin Marketplace','Administrasi','Membantu mengelola pesanan dan katalog marketplace selama satu shift.','Tulungagung','Kedungwaru',-8.0436,111.9080,1784710800000,1784739600000,175000,2,'PUBLISHED','FUNDED',4,1784631034577,1784631034577,1784631034577),
('job_tlg_002','business_ruang_rasa','business@pulihkanaku.local','penjaga-booth-festival-kauman','Penjaga Booth Festival','Event','Melayani pengunjung dan menjaga kerapian booth pada festival lokal.','Tulungagung','Kauman',-8.0621,111.9033,1784988000000,1785016800000,200000,2,'PUBLISHED','FUNDED',4,1784631034577,1784631034577,1784631034577),
('job_tlg_003','business_dapur_sri','business@pulihkanaku.local','foto-produk-umkm-boyolangu','Foto Produk UMKM','Kreatif','Mengambil dan menyunting foto sederhana untuk katalog makanan lokal.','Tulungagung','Boyolangu',-8.0954,111.8924,1784898000000,1784912400000,250000,1,'PUBLISHED','FUNDED',4,1784631034577,1784631034577,1784631034577);
