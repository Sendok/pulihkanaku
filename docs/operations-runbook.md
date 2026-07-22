# Operations runbook

## Deployment order

1. Verify the payout provider's current Bank Indonesia permission and record the evidence in `PAYOUT_PROVIDER_LICENSE_REFERENCE`.
2. Load secrets through the deployment secret manager; never commit them to an env file.
3. Run `docker compose -f docker-compose.prod.yml config` and review the resolved services.
4. Start PostgreSQL, Redis, MinIO, and ClamAV. The one-shot migration and bucket initializer must succeed before API/worker become healthy.
5. Verify `/api/v1/health/live`, then `/api/v1/health/ready` from the private network.
6. Send signed sandbox webhooks and verify inbox deduplication, payout state, ledger, and reconciliation before enabling live money movement.

## Backup and restore

- Run `scripts/backup-postgres.sh` and `scripts/backup-object-storage.sh` to an explicit encrypted backup mount. Copy checksum files with the database dumps.
- Retain daily backups for 14 days and monthly backups for 12 months unless the approved retention policy says otherwise.
- Test restoration in an isolated environment at least quarterly. Restore scripts require `CONFIRM_RESTORE=restore-pulihkanaku` because they can replace existing data.
- After restore, run integrity counts for users, assignments, payouts, ledger entries, and object keys; then rotate session, webhook, and provider secrets if compromise is suspected.

## Incident controls

- Pause the worker before financial reconciliation or provider outages; the API webhook inbox may continue accepting idempotent events.
- Never manually mark a payout `PAID`. Use provider evidence and the reconciliation workflow.
- Malware-positive objects are removed from private storage and remain represented by their scan record for audit.
- Escalated disputes, overdue support tickets, and critical risk cases require an operations owner and written resolution.
