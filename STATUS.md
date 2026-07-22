# Status

Terakhir diperbarui: 22 Juli 2026 (Asia/Jakarta)

## Selesai

- Pemeriksaan repository dan pembacaan master brief.
- Product assumptions, arsitektur target, state machine, route map, serta risk register awal.
- Design system coral & cream yang responsive dan WCAG-aware.
- Landing page publik dengan pencarian, safety notice, pekerjaan realistis, dan CTA worker/business.
- Surface worker: ringkasan pendapatan, profil, pencarian, simpan, detail, serta state lamaran.
- Surface business: metrics, shift, kandidat, dan state pembuatan draft.
- Surface admin: overview, antrean verifikasi, risiko, dan health status.
- Metadata SEO, Open Graph, Twitter card, Bahasa Indonesia, dan reduced motion.
- Build, lint, typecheck, dan smoke test untuk surface saat ini.
- Domain core teruji: job state machine, deterministic matching, payment quote, dan RBAC.
- Persistent hosted-preview schema untuk users, businesses, jobs, applications, assignments, payments, payouts, dan audit logs.
- REST API v1 untuk listing pekerjaan, pembuatan draft, dan transisi pekerjaan ber-audit dengan optimistic locking.
- Migration dan seed data untuk tiga pekerjaan nyata di Tulungagung.
- Environment template untuk database, Redis, auth, storage, payment, notification, security, dan observability.
- Identity-to-role mapping dari database; header role client tidak dipercaya.
- Vertical slice API: invoice pendanaan, apply, accept, check-in, evidence, submit, approve, scheduled payout, ledger, dan review dua arah.
- End-to-end API test menjalankan alur business-to-worker-to-payout menggunakan database lokal nyata.
- Check-out wajib sebelum submit, request revision, dispute messaging/resolution, payout hold, processing, completion, dan reconciliation.
- Authentication gate resmi, registrasi worker/business, database-backed role redirect, protected dashboard routes, versioned consent, dan E.164 phone normalization.
- Onboarding worker dan business yang persisten, upload dokumen privat ke R2, validasi signature/ukuran, verification submission, admin review, expiry, audit trail, serta penguncian apply/create-job sampai role terkait terverifikasi.
- Login/register PulihkanAku tanpa GPT, PBKDF2 password hashing, opaque server session, secure cookie, rate limit, temporary account lock, device session list, single/all-device logout, dan audit login.
- Membership-backed business role, payout account onboarding terenkripsi, serta maintenance endpoint untuk reminder dan expiry verifikasi.
- Fondasi pnpm/Turborepo, bootstrap NestJS API, BullMQ worker, PostgreSQL/Drizzle adapter, shared environment validation, Docker Compose PostgreSQL/Redis/MinIO, dan container API/worker.
- Schema PostgreSQL 25 tabel dan migration SQL untuk identity, membership, verification, job, assignment, attendance/evidence, payment/payout, ledger, reconciliation, dispute, notification, webhook inbox, dan audit.
- NestJS REST v1 untuk auth normal, profil worker, jobs, applications, assignments, attendance, payments, payouts, disputes, upload dokumen, webhook, serta rekonsiliasi; dilengkapi DTO validation, request ID, error envelope, ownership/RBAC, OpenAPI, dan contract test.
- Redis rate limiting/cache, BullMQ retry/scheduler, serta adapter MinIO presigned upload dengan verifikasi metadata objek sebelum diproses.
- OTP contact verification/account recovery asynchronous dengan HMAC hash, expiry, resend cooldown, attempt limit, one-time recovery token, reset password, pencabutan sesi, serta notification adapters.
- ClamAV asynchronous malware scan untuk dokumen verifikasi dan evidence; objek terinfeksi ditandai lalu dihapus dari bucket privat.
- Adapter payout Xendit domestik Indonesia, idempotency key, exponential retry, terminal/transient failure handling, token-verified webhook inbox, ledger settlement, mismatch detection, dan manual reconciliation UI ber-audit.
- PostgreSQL domain diperluas menjadi 36 tabel untuk conversation/message, notification preference/delivery, risk event/case, support SLA, CMS, plan, dan subscription state.
- Messaging realtime backend melalui SSE + Redis pub/sub, participant authorization, message idempotency, unread cursor, moderation permintaan OTP/kata sandi, serta notification fan-out asynchronous.
- Risk workflow untuk login failure, OTP brute force, off-platform payment request, risk aggregation/case queue, dan admin resolution; support ticket dan dispute SLA diekskalasi oleh scheduler.
- Runtime package build untuk shared config/database, dependency-aware readiness, migration runner, hardened production Compose, CI workflow, serta backup/restore PostgreSQL dan MinIO dengan checksum/confirmation guard.
- Public jobs dinamis hanya menampilkan pekerjaan `PUBLISHED` + `FUNDED` dari bisnis terverifikasi, CMS panduan dengan admin publishing, PWA public-only cache, sitemap, halaman paket, serta perencana skenario penghasilan tanpa janji pendapatan.
- Regression suite lulus: lint, unit/contract, typecheck, production build, rendered integration, D1 migration, vertical-slice E2E, serta build seluruh service.
- Paket self-host tersedia dengan production environment validator, dry-run/deploy automation, disposable external-stack integration, PostgreSQL/Redis/MinIO/ClamAV/worker preflight, provider credential probe, guarded notification send test, HTTP/webhook security smoke test, isolated restore drill, quiet cutover gate, dan reverse-proxy TLS template.

## Sedang dikerjakan berikutnya

- Menjalankan `npm run test:external-stack` pada host dengan Docker daemon; automasinya sudah tersedia tetapi daemon lokal belum aktif di lingkungan pengembangan ini.
- Mengaktifkan credential notification/provider live, merchant approval, serta mencatat referensi izin provider yang diverifikasi saat go-live.
- Cutover traffic dari adapter D1 preview ke service PostgreSQL setelah staging soak test dan backup/restore drill.
- Menambahkan realtime messaging UI worker/business dan admin risk/support console di atas API/SSE yang sudah selesai.

## Belum selesai

- Aktivasi notification delivery production dan observability/alert routing dengan credential operasional.
- Browser automation lintas-browser, load/security penetration test, dan bukti eksekusi CI pada remote repository.
- Subscription checkout/billing live; paket berbayar sengaja tetap `COMING_SOON` sampai provider dan kebijakan komersial disetujui.

Hosted preview memiliki backend D1/R2 yang berfungsi. Implementasi service PostgreSQL/NestJS dan worker telah build/typecheck/contract/E2E-test, tetapi belum diklaim live-production: Docker daemon lokal tidak tersedia untuk service integration run dan aktivasi finansial/notifikasi masih memerlukan credential merchant serta verifikasi izin/status provider dari sumber resmi pada waktu go-live.
