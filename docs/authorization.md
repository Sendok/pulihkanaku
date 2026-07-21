# Authorization

Authorization dilakukan pada server melalui kombinasi role, ownership, status resource, dan state workflow. Menyembunyikan tombol di UI bukan kontrol keamanan.

Untuk hosted preview, identitas berasal dari header dispatch Sign in with ChatGPT. Header demo hanya diterima ketika `NODE_ENV` bukan production. Mapping role permanen akan dibaca dari membership database pada milestone autentikasi.

Kebijakan yang tersedia saat ini:

- Business roles dapat membuat pekerjaan.
- Business pemilik resource atau operations admin dapat menjalankan transisi pekerjaan.
- Worker saja dapat melamar.
- Verification agent/operations admin dapat review verifikasi.
- Hanya finance admin dan super admin dapat meminta payout override.

Payout override nominal besar tetap membutuhkan dual confirmation pada implementasi finance berikutnya.
