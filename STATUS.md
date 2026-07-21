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

## Sedang dikerjakan berikutnya

- Migrasi module domain dan schema lengkap dari D1 preview ke service NestJS/PostgreSQL hingga contract parity.
- Integrasi queue BullMQ, Redis rate limiting/cache, dan MinIO document adapter ke workflow nyata.
- OTP untuk verifikasi kontak/pemulihan akun dan malware scanner asynchronous.
- Payout provider berizin, webhook production, retry queue, failure handling, dan manual reconciliation UI.

## Belum selesai

- Payment/payout provider nyata, webhook, ledger, rekonsiliasi.
- Messaging realtime, notification adapters, dispute, risk engine penuh.
- E2E Playwright, integration/security tests, Docker production, CI, backup/restore.
- Halaman publik dinamis, CMS, PWA offline, subscription, dan rencana penghasilan.

Hosted preview memiliki backend D1/R2 yang berfungsi. Service PostgreSQL/NestJS mandiri masih dalam migrasi bertahap dan belum diklaim production-complete.
