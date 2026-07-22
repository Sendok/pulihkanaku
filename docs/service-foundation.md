# Production service foundation

Repository kini memiliki workspace pnpm/Turborepo bertahap:

- `apps/api`: NestJS REST v1 dengan auth aplikasi, DTO validation, request ID, error envelope, OpenAPI, Redis rate limit/cache, MinIO presigned upload, payout webhook inbox, dan RBAC/resource ownership.
- `apps/worker`: BullMQ worker untuk OTP delivery, ClamAV streaming scan, payout dispatch/retry, webhook settlement, ledger, dan rekonsiliasi.
- `packages/database`: schema PostgreSQL/Drizzle 25 tabel, migration SQL, indeks, foreign key, optimistic version, idempotency, dan retry state.
- `packages/config`: validasi environment terpusat.
- `docker-compose.yml`: PostgreSQL, Redis, MinIO privat beserta bucket initializer, dan ClamAV untuk pengembangan lokal.
- `infrastructure/docker`: multi-stage container untuk API dan worker.

Web Sites yang aktif masih berada di root repository selama service PostgreSQL mencapai feature parity. Ini mencegah migrasi struktur memutus deployment yang sedang digunakan.

Web preview D1 tetap tersedia selama cutover. Contract test menjaga surface D1 dan service PostgreSQL; aktivasi production memerlukan database/Redis/object storage terkelola, credential notification, credential merchant Xendit, webhook token, dan verifikasi operasional provider.
