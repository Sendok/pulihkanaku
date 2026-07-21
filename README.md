# PulihkanAku

PulihkanAku adalah platform pekerjaan pendek hyperlocal yang membantu pencari penghasilan menemukan pekerjaan terverifikasi dengan bayaran yang terlihat sebelum melamar. Produk ini bukan platform pinjaman.

## Menjalankan lokal

Prasyarat: Node.js 22.13 atau lebih baru.

```bash
npm install
npm run dev:setup
npm run dev
```

Buka `http://localhost:3000`. Demo menyediakan tiga surface terintegrasi: landing/worker, business, dan admin.

Klik **Masuk** membuka form PulihkanAku untuk email/nomor telepon dan kata sandi. Session disimpan server-side dan dashboard dipilih berdasarkan role serta membership di database—tanpa login GPT.

Setelah registrasi, worker dan pemilik bisnis dapat melengkapi onboarding dan mengajukan verifikasi. Dokumen disimpan pada object storage privat; hanya pemilik dan petugas verifikasi yang dapat membukanya. Worker harus lolos verifikasi identitas sebelum melamar, sedangkan bisnis harus berstatus terverifikasi sebelum membuat pekerjaan.

## Validasi

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npm run build
```

API hosted-preview memakai persistent D1 dan domain rules yang sama dengan target service. Akun baru dibuat melalui halaman registrasi. Adapter PostgreSQL/NestJS tetap menjadi target service mandiri; D1 bukan target penyimpanan finansial production.

Dokumentasi pekerjaan dan keputusan ada di [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md), [STATUS.md](./STATUS.md), [alur autentikasi](./docs/authentication.md), [onboarding/verifikasi](./docs/onboarding-verification.md), dan [fondasi service produksi](./docs/service-foundation.md).
