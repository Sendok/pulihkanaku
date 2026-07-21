# Status

Terakhir diperbarui: 21 Juli 2026 (Asia/Jakarta)

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

## Sedang dikerjakan berikutnya

- Migrasi domain core ke monorepo pnpm/Turborepo dan service NestJS.
- Adapter PostgreSQL, BullMQ, Redis, MinIO, serta Docker Compose.
- OTP/session, membership-backed role, onboarding, dan verification submission.
- Payout provider berizin, webhook production, retry queue, failure handling, dan manual reconciliation UI.

## Belum selesai

- Payment/payout provider nyata, webhook, ledger, rekonsiliasi.
- Messaging realtime, notification adapters, dispute, risk engine penuh.
- E2E Playwright, integration/security tests, Docker production, CI, backup/restore.
- Halaman publik dinamis, CMS, PWA offline, subscription, dan rencana penghasilan.

Tidak ada fitur backend yang diklaim selesai pada milestone experience ini.
