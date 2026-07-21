# Database

Milestone ini menyediakan schema adapter hosted preview untuk delapan tabel inti: `users`, `businesses`, `jobs`, `job_applications`, `job_assignments`, `payment_transactions`, `payouts`, dan `audit_logs`.

Migration `drizzle/0000_careful_caretaker.sql` membuat index pencarian/status dan seed tiga pekerjaan Tulungagung. Semua nilai uang disimpan sebagai integer IDR. Entitas workflow kritis memiliki `version` untuk optimistic locking.

Target production tetap PostgreSQL sesuai arsitektur utama. Domain rules tidak bergantung pada dialect; adapter PostgreSQL akan mengganti repository D1 ketika service NestJS dipisahkan. Adapter hosted preview tidak boleh dipakai sebagai bukti kesiapan compliance pembayaran.

## Aturan data

- Record transaksi tidak diubah setelah final; koreksi memakai reversal/adjustment.
- Dokumen sensitif tidak disimpan di database atau public URL.
- Audit log tidak boleh memuat OTP, token, rekening penuh, atau URL dokumen privat.
- Nomor telepon dinormalisasi E.164 sebelum persist.
