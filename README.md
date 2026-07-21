# PulihkanAku

PulihkanAku adalah platform pekerjaan pendek hyperlocal yang membantu pencari penghasilan menemukan pekerjaan terverifikasi dengan bayaran yang terlihat sebelum melamar. Produk ini bukan platform pinjaman.

## Menjalankan lokal

Prasyarat: Node.js 22.13 atau lebih baru.

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Demo menyediakan tiga surface terintegrasi: landing/worker, business, dan admin.

## Validasi

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Akun demo

- Worker: `worker@pulihkanaku.local`
- Business: `business@pulihkanaku.local`
- Support: `support@pulihkanaku.local`
- Admin: `admin@pulihkanaku.local`

Autentikasi OTP dan koneksi PostgreSQL/NestJS termasuk milestone berikutnya; versi situs ini memvalidasi pengalaman produk dan state interaksi di browser.

Dokumentasi pekerjaan dan keputusan ada di [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md), [STATUS.md](./STATUS.md), dan folder [docs](./docs).
