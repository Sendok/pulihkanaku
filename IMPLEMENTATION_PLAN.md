# Implementation Plan

## Prinsip keputusan

- Alur worker, business, dan admin berbagi satu bahasa visual dan model status.
- Transparansi bayaran dan safety notice selalu terlihat sebelum tindakan melamar.
- Operasi finansial dan perubahan status pekerjaan akan bersifat idempotent, transactional, dan diaudit.
- Integrasi vendor berada di balik adapter; tidak ada istilah legal `escrow` tanpa dukungan provider.

## Fase

1. **Discovery & architecture** — asumsi produk, route map, state machines, risiko, dan vertical slice.
2. **Experience foundation** — design tokens, landing, worker, business, admin, responsive, accessibility, metadata.
3. **Platform foundation** — pnpm/Turborepo, NestJS, PostgreSQL, Redis, MinIO, shared packages, CI.
4. **Identity & verification** — OTP, session, RBAC, onboarding, document review.
5. **Marketplace vertical slice** — create/fund/publish/apply/accept/check-in/evidence/approve/payout/review.
6. **Operations** — messaging, notifications, dispute, risk, audit, CMS, feature flags.
7. **Hardening** — tests, observability, performance, security audit, backup/restore, deployment.

## Vertical slice acceptance

Business terverifikasi dapat membuat dan mendanai pekerjaan; worker terverifikasi dapat melamar dan menyelesaikan assignment; approval membuat payout terjadwal; semua transisi memiliki audit event dan test.
