# Authorization

Authorization dilakukan pada server melalui kombinasi role, ownership, status resource, dan state workflow. Menyembunyikan tombol di UI bukan kontrol keamanan.

Identitas browser berasal dari session PulihkanAku yang tersimpan server-side. Header demo hanya diterima ketika `NODE_ENV` bukan production. Akses bisnis diperiksa melalui `business_members`, bukan role yang dikirim client.

Kebijakan yang tersedia saat ini:

- Business roles dapat membuat pekerjaan.
- Business pemilik resource atau operations admin dapat menjalankan transisi pekerjaan.
- Worker saja dapat melamar.
- Verification agent/operations admin dapat review verifikasi.
- Hanya finance admin dan super admin dapat meminta payout override.

Payout override nominal besar tetap membutuhkan dual confirmation pada implementasi finance berikutnya.
