# Onboarding dan Verifikasi

## Alur worker

1. Worker mendaftar dan mendapat profil dasar.
2. Worker melengkapi tahun lahir, kemampuan, ketersediaan, minat kerja, kendaraan, serta preferensi jarak.
3. Worker mengunggah dokumen identitas ke object storage privat.
4. Petugas verifikasi menyetujui, menolak, atau meminta revisi.
5. Hanya worker dengan level minimal `IDENTITY_VERIFIED` yang dapat melamar pekerjaan.

## Alur bisnis

1. Pemilik bisnis melengkapi penanggung jawab, kecamatan, alamat, dan NIB opsional.
2. Pemilik menyetujui aturan lowongan tanpa biaya dan tanpa deposit.
3. Dokumen identitas dan bukti bisnis disimpan privat.
4. Petugas verifikasi melakukan review dengan optimistic locking dan alasan tercatat.
5. Hanya bisnis berstatus `VERIFIED` yang dapat membuat pekerjaan.

## Keamanan dokumen

- Format dibatasi ke JPG, PNG, dan PDF; MIME serta signature file harus sesuai.
- Ukuran maksimal 5 MB per dokumen.
- Nama file dibersihkan dan object key dibuat acak.
- Bucket tidak memiliki URL publik.
- Dokumen hanya dikirim melalui endpoint yang memeriksa pemilik atau role petugas verifikasi.
- Respons dokumen memakai `private, no-store`, `nosniff`, dan Content Security Policy sandbox.
- Kegagalan transaksi membersihkan object yang sudah sempat diunggah.
- Setiap submit dan keputusan review ditulis ke audit log.

Integrasi malware scanner asynchronous tetap diperlukan sebelum menerima dokumen dari publik pada deployment mandiri.
