# Job State Machine

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> PENDING_VERIFICATION
  PENDING_VERIFICATION --> PENDING_FUNDING
  PENDING_FUNDING --> PUBLISHED: payment confirmed
  PUBLISHED --> APPLICATION_CLOSED
  APPLICATION_CLOSED --> IN_PROGRESS
  IN_PROGRESS --> AWAITING_APPROVAL
  AWAITING_APPROVAL --> COMPLETED
  PUBLISHED --> CANCELLED
  IN_PROGRESS --> DISPUTED
  AWAITING_APPROVAL --> DISPUTED
  DISPUTED --> COMPLETED
  PUBLISHED --> SUSPENDED
  PUBLISHED --> EXPIRED
```

Setiap command memeriksa role, ownership, status bisnis/worker, versi optimistic lock, dan idempotency key bila berdampak finansial. Transisi ilegal mengembalikan `409 JOB_INVALID_TRANSITION`; transisi berhasil menulis audit event pada transaksi yang sama.
