# Operations runbook

## Self-host quick start

1. Install Node.js 22, Docker Engine with Compose v2, `curl`, and `openssl` on a Linux host. Put PostgreSQL/Redis/MinIO on non-public Docker networks; only expose the API through TLS.
2. Copy `.env.production.example` to `.env.production`. Replace all `change-me` values. Generate independent secrets with `openssl rand -base64 48` and the payout key with the command documented in the example.
3. Run `npm run validate:production-env`. Keep `GO_LIVE=false`, `PAYOUT_PROVIDER=disabled`, and notification providers disabled for the first infrastructure deployment.
4. Run `DRY_RUN=true npm run deploy:self-host`, then `npm run deploy:self-host`. This builds the exact API/worker images, runs migrations, waits for readiness, validates PostgreSQL/Redis/MinIO/ClamAV/worker heartbeat, and executes safe HTTP smoke checks.
5. Put a host reverse proxy in front of the loopback-only API port. Adapt `infrastructure/nginx/pulihkanaku-api.conf.example`, install a valid TLS certificate, and change `CORS_ORIGINS` to the exact HTTPS frontend origin.

For a disposable local proof using isolated volumes, run `npm run test:external-stack`. It can take several minutes while ClamAV downloads its signatures. The script runs authentication/recovery integration, dependency read/write checks, a harmless antivirus signature check, and removes only the `pulihkanaku-integration` project volumes afterward.

## Provider activation

1. Configure sandbox/test credentials first. Run `npm run probe:providers` for non-mutating Xendit balance, Resend domain, and/or notification gateway health checks.
2. Send one authorized notification with `CONFIRM_PROVIDER_SEND=send-pulihkanaku-test npm run test:provider-send -- destination@example.com` (or an E.164 phone number for the gateway).
3. Configure Xendit's callback URL as `https://api.example.com/api/v1/payments/webhooks/xendit`; the application requires the `x-callback-token` and deduplicates `webhook-id`.
4. Record the provider permission evidence, enable `PAYOUT_PROVIDER=xendit`, then repeat the provider probes. Change `GO_LIVE=true` only after sandbox payout/webhook/reconciliation evidence is approved.
5. Re-run the environment validator and deployment command. Provider secrets are never printed by these scripts.

## Deployment order

1. Verify the payout provider's current Bank Indonesia permission and record the evidence in `PAYOUT_PROVIDER_LICENSE_REFERENCE`.
2. Load secrets through the deployment secret manager; never commit them to an env file.
3. Run `docker compose -f docker-compose.prod.yml config` and review the resolved services.
4. Start PostgreSQL, Redis, MinIO, and ClamAV. The one-shot migration and bucket initializer must succeed before API/worker become healthy.
5. Verify `/api/v1/health/live`, then `/api/v1/health/ready` from the private network.
6. Send signed sandbox webhooks and verify inbox deduplication, payout state, ledger, and reconciliation before enabling live money movement.

## Useful operator commands

- Status: `docker compose --env-file .env.production -f docker-compose.prod.yml ps`
- Follow API/worker logs: `docker compose --env-file .env.production -f docker-compose.prod.yml logs -f --tail=200 api worker`
- Re-run dependency checks: `docker compose --env-file .env.production -f docker-compose.prod.yml exec -T api node apps/api/dist/preflight.js`
- Re-run safe HTTP checks: `npm run test:production-smoke`
- Stop services without deleting data: `docker compose --env-file .env.production -f docker-compose.prod.yml stop`

Do not run `down --volumes` against the production project; that removes persistent service volumes.

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
