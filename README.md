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

Klik **Masuk** tidak membuka dashboard secara langsung. Identitas harus terverifikasi, akun harus terdaftar, dan dashboard dipilih berdasarkan role di database.

## Validasi

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npm run build
```

## Akun demo

- Worker: `worker@pulihkanaku.local`
- Business: `business@pulihkanaku.local`
- Support: `support@pulihkanaku.local`
- Admin: `admin@pulihkanaku.local`

API hosted-preview memakai persistent D1 dan domain rules yang sama dengan target service. Autentikasi OTP dan adapter PostgreSQL/NestJS termasuk milestone berikutnya; D1 bukan target penyimpanan finansial production.

Dokumentasi pekerjaan dan keputusan ada di [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md), [STATUS.md](./STATUS.md), dan folder [docs](./docs).
