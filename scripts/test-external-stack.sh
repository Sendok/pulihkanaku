#!/bin/sh
set -eu
command -v docker >/dev/null 2>&1 || { echo "docker is required" >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "Docker daemon is not running" >&2; exit 1; }

project="pulihkanaku-integration"
export NODE_ENV=test API_PORT="${INTEGRATION_API_PORT:-4400}"
export POSTGRES_PASSWORD="integration-postgres-password-only"
export REDIS_PASSWORD="integration-redis-password-only"
export MINIO_ROOT_USER="pulihkanaku-integration"
export MINIO_ROOT_PASSWORD="integration-minio-password-only"
export SESSION_SECRET="integration-session-secret-at-least-32-characters"
export OTP_SECRET="integration-otp-secret-independent-32-characters"
export PAYOUT_ENCRYPTION_KEY="Y2ktcGF5b3V0LWtleS0zMi1ieXRlcy1sb25nISEhISE"
export CORS_ORIGINS="http://localhost:${API_PORT}"
export METRICS_TOKEN="integration-metrics-token-32-characters"
export PAYOUT_PROVIDER=mock EMAIL_PROVIDER=mock

compose() { docker compose -p "$project" -f docker-compose.prod.yml "$@"; }
cleanup() { compose down --volumes --remove-orphans; }
trap cleanup EXIT INT TERM

compose up -d --build
attempt=0
until curl --fail --silent "http://127.0.0.1:${API_PORT}/api/v1/health/ready" >/dev/null; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 120 ]; then compose ps; compose logs --tail=200 api worker clamav; exit 1; fi
  sleep 2
done
compose exec -T api node apps/api/dist/preflight.js
SERVICE_URL="http://127.0.0.1:${API_PORT}/api/v1" node --test tests/service-integration.mjs
SERVICE_URL="http://127.0.0.1:${API_PORT}/api/v1" node tests/production-smoke.mjs
compose ps
echo "External stack integration passed. Isolated volumes will now be removed."
