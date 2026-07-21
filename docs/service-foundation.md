# Production service foundation

Repository kini memiliki workspace pnpm/Turborepo bertahap:

- `apps/api`: bootstrap NestJS dengan global API prefix, health endpoints, dan graceful shutdown.
- `apps/worker`: worker BullMQ dengan koneksi Redis dan graceful shutdown.
- `packages/database`: factory pool PostgreSQL/Drizzle.
- `packages/config`: validasi environment terpusat.
- `docker-compose.yml`: PostgreSQL, Redis, dan MinIO untuk pengembangan lokal.
- `infrastructure/docker`: multi-stage container untuk API dan worker.

Web Sites yang aktif masih berada di root repository selama service PostgreSQL mencapai feature parity. Ini mencegah migrasi struktur memutus deployment yang sedang digunakan.

Tahap lanjutan adalah memindahkan domain module satu per satu ke NestJS, membuat PostgreSQL schema/migration lengkap, menjalankan contract test terhadap kedua adapter, lalu memindahkan web ke `apps/web`.
