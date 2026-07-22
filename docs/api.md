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
- `POST /api/v1/assignments/:id/check-out`
- `POST /api/v1/assignments/:id/evidence`
- `POST /api/v1/assignments/:id/submit`
- `POST /api/v1/assignments/:id/approve`
- `POST /api/v1/assignments/:id/request-revision`
- `POST /api/v1/assignments/:id/disputes`
- `POST /api/v1/assignments/:id/reviews`

## Dispute dan payout operations

- `POST /api/v1/disputes/:id/messages`
- `POST /api/v1/disputes/:id/resolve`
- `POST /api/v1/payouts/:id/mock-process` — local development only.
- `POST /api/v1/payouts/:id/mock-complete` — local development only.

Membuka sengketa menempatkan payout ke `ON_HOLD`. Keputusan admin wajib memiliki alasan; resolusi worker/parsial menjadwalkan payout kembali, sementara resolusi business membalikkan payout. Payout selesai menulis ledger `PAYOUT` dan reconciliation record `MATCHED` secara atomik.

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

## Messaging, notification, risk, support, dan content

- `POST /api/v1/conversations` dan `GET /api/v1/conversations` — conversation berbasis assignment dengan participant authorization.
- `GET|POST /api/v1/conversations/:id/messages` — cursor pagination, idempotency key, moderation, notification fan-out.
- `GET /api/v1/conversations/stream` — SSE realtime yang didistribusikan melalui Redis pub/sub.
- `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, dan notification preferences.
- `GET /api/v1/admin/risk-cases`, `POST /api/v1/admin/risk-cases/:id/resolve`.
- `GET|POST /api/v1/support/tickets` — support queue dengan SLA escalation.
- `GET /api/v1/content`, `GET /api/v1/content/:slug`, serta admin create/update dengan optimistic version.
- `GET /api/v1/subscription-plans` — katalog read-only. Checkout tidak tersedia sampai billing provider disetujui.
