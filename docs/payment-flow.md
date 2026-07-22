# Payment & Payout Flow

```mermaid
sequenceDiagram
  participant B as Business
  participant API
  participant PG as Payment Provider
  participant W as Worker
  B->>API: Fund job (idempotency key)
  API->>PG: Create invoice
  PG-->>API: Signed paid webhook
  API->>API: Verify, deduplicate, write ledger
  API-->>B: Job funded and published
  W->>API: Submit completed work
  B->>API: Approve work
  API->>API: Schedule BullMQ payout (idempotency key)
  API->>PG: Create payout through provider adapter
  PG-->>API: Token-verified payout webhook
  API->>API: Persist webhook inbox and respond 200
  API->>API: Worker writes status, ledger, and reconciliation
```

Ledger types: `JOB_FUNDING`, `PLATFORM_FEE`, `WORKER_PAYABLE`, `PAYOUT`, `REFUND`, `ADJUSTMENT`, `REVERSAL`.

Adapter Xendit memakai Payouts v2 untuk kanal domestik Indonesia (`ID_<BANK>`), Basic secret-key authentication, dan idempotency key. Error sementara masuk exponential retry maksimal enam percobaan; error validasi terminal menjadi `FAILED`. Webhook dideduplikasi berdasarkan provider/event ID. Ketidaksesuaian nominal atau status masuk `REVIEW_REQUIRED` dan diselesaikan finance/operations admin melalui `/admin/reconciliation` dengan alasan yang diaudit.
