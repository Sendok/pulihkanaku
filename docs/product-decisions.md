# Product Assumptions & Decisions

1. Tulungagung menjadi kota default; Kediri dan Blitar aktif sebagai area sekunder.
2. Pekerja tidak dikenai biaya aplikasi pada MVP.
3. Pekerjaan hanya dapat dipublikasikan setelah business minimal `IDENTITY_VERIFIED` dan invoice berstatus `PAID`.
4. Geolocation diminta hanya saat check-in/check-out; tidak ada background tracking.
5. Payout dijadwalkan setelah approval atau auto-approval; dana tetap ditangani provider berizin.
6. Rencana Penghasilan adalah data sensitif dan tidak masuk ranking maupun payload business.
7. Matching MVP deterministic, explainable, dan tidak memakai atribut sensitif.
8. Demo experience memakai data realistis untuk menguji UX; ini bukan pengganti backend production.

## Risiko awal

- Konstruksi managed payment perlu legal review dan kontrak provider sebelum launch.
- KYC/identity documents membutuhkan retention schedule, private storage, signed URL, dan access logging.
- Klaim klasifikasi pekerja, pajak, keselamatan kerja, dan penanganan insiden perlu counsel lokal.
- Auto-approval harus memiliki konfigurasi, notifikasi berlapis, dan jalur dispute.
