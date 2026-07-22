CREATE TABLE `content_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`published_at` integer,
	`author_user_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_slug_idx` ON `content_entries` (`slug`);--> statement-breakpoint
CREATE INDEX `content_status_idx` ON `content_entries` (`status`,`published_at`);--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`audience` text NOT NULL,
	`price_amount` integer NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`interval` text NOT NULL,
	`features` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_plan_code_idx` ON `subscription_plans` (`code`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`business_id` text,
	`plan_id` text NOT NULL,
	`status` text NOT NULL,
	`provider_reference` text,
	`current_period_start` integer NOT NULL,
	`current_period_end` integer NOT NULL,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `subscription_owner_idx` ON `subscriptions` (`user_id`,`business_id`,`status`);
--> statement-breakpoint
INSERT OR IGNORE INTO `content_entries` (`id`,`slug`,`type`,`title`,`summary`,`body`,`status`,`published_at`,`author_user_id`,`version`,`created_at`,`updated_at`) VALUES
('content_safety','keamanan-kerja','GUIDE','Kerja aman tanpa biaya tersembunyi','Kenali tanda bahaya sebelum menerima pekerjaan.','Periksa identitas bisnis dan detail lokasi sebelum berangkat.\n\nJangan pernah membayar biaya pendaftaran, deposit, atau biaya pencairan.\n\nJangan berikan kode OTP, PIN, atau kata sandi kepada siapa pun. Tim PulihkanAku tidak pernah meminta informasi tersebut.\n\nGunakan percakapan di dalam aplikasi agar bukti komunikasi tersimpan. Laporkan permintaan transfer di luar platform melalui dukungan.','PUBLISHED',1784682000000,'user_admin',1,1784682000000,1784682000000),
('content_business','panduan-bisnis-terverifikasi','GUIDE','Panduan bisnis terverifikasi','Cara membuat peluang kerja yang jelas, aman, dan adil.','Tuliskan tugas, jadwal, lokasi, jumlah pekerja, dan bayaran yang diterima secara lengkap.\n\nSediakan dana pekerjaan sebelum publikasi dan jangan meminta worker membayar biaya apa pun.\n\nGunakan check-in, evidence, review, dan dispute di PulihkanAku untuk menjaga jejak transaksi.','PUBLISHED',1784682000000,'user_admin',1,1784682000000,1784682000000);
--> statement-breakpoint
INSERT OR IGNORE INTO `subscription_plans` (`id`,`code`,`name`,`audience`,`price_amount`,`currency`,`interval`,`features`,`status`,`created_at`,`updated_at`) VALUES
('plan_worker_free','WORKER_FREE','Worker Gratis','WORKER',0,'IDR','MONTH','["Melamar tanpa biaya","Riwayat pekerjaan","Perlindungan dispute"]','ACTIVE',1784682000000,1784682000000),
('plan_business_basic','BUSINESS_BASIC','Bisnis Dasar','BUSINESS',0,'IDR','MONTH','["Publikasi pekerjaan terdanai","Manajemen kandidat","Rekonsiliasi transaksi"]','ACTIVE',1784682000000,1784682000000),
('plan_business_plus','BUSINESS_PLUS','Bisnis Plus','BUSINESS',99000,'IDR','MONTH','["Prioritas dukungan","Analitik operasional","Ekspor laporan"]','COMING_SOON',1784682000000,1784682000000);
