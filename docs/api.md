# REST API v1

Semua respons memakai envelope konsisten dan `requestId`. Endpoint tulis memerlukan identitas server-side, role yang sesuai, ownership, state, serta optimistic version.

## Jobs

- `GET /api/v1/jobs?city=Tulungagung` — daftar publik, maksimal 30 item.
- `POST /api/v1/jobs` — membuat draft; `BUSINESS_OWNER`, `BUSINESS_STAFF`, atau `BUSINESS_HR`.
- `POST /api/v1/jobs/:id/transition` — transisi state legal dengan `expectedVersion`.
- `POST /api/v1/jobs/:id/fund` — membuat invoice idempotent untuk pekerjaan yang menunggu pendanaan.

## Worker-to-payout vertical slice

- `POST /api/v1/jobs/:id/applications`
- `POST /api/v1/applications/:id/accept`
- `POST /api/v1/assignments/:id/check-in`
- `POST /api/v1/assignments/:id/evidence`
- `POST /api/v1/assignments/:id/submit`
- `POST /api/v1/assignments/:id/approve`
- `POST /api/v1/assignments/:id/reviews`

Approval membuat payout berstatus `SCHEDULED` dan ledger entry `WORKER_PAYABLE` pada batch atomik yang sama. Endpoint konfirmasi pembayaran mock hanya tersedia di local development dan tidak dapat dipanggil pada production.

Contoh command transisi:

```json
{
  "to": "PENDING_VERIFICATION",
  "expectedVersion": 1,
  "reason": "Detail pekerjaan sudah lengkap"
}
```

Konflik versi atau state mengembalikan HTTP 409. Audit log ditulis pada batch database yang sama dengan update status.

## Error

```json
{
  "success": false,
  "error": {
    "code": "JOB_INVALID_TRANSITION",
    "message": "Pekerjaan tidak dapat dipindahkan ke status tersebut.",
    "details": null,
    "requestId": "request-uuid"
  }
}
```
