#!/bin/sh
set -eu
env_file=${1:-.env.production}
[ -f "$env_file" ] || { echo "Environment file not found: $env_file" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "docker is required" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "Docker daemon is not running" >&2; exit 1; }

node --env-file="$env_file" scripts/validate-production-env.mjs
compose() { docker compose --env-file "$env_file" -f docker-compose.prod.yml "$@"; }
compose config >/dev/null
if [ "${DRY_RUN:-false}" = "true" ]; then echo "Dry run passed; no containers changed."; exit 0; fi

compose pull postgres redis minio minio-init clamav
compose build migrate api worker
compose up -d

api_port=$(node --env-file="$env_file" -e 'process.stdout.write(process.env.API_PORT ?? "4000")')
attempt=0
until curl --fail --silent "http://127.0.0.1:${api_port}/api/v1/health/ready" >/dev/null; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 90 ]; then compose ps; compose logs --tail=200 api worker; exit 1; fi
  sleep 2
done
compose exec -T api node apps/api/dist/preflight.js
SERVICE_URL="http://127.0.0.1:${api_port}/api/v1" node tests/production-smoke.mjs
compose ps
echo "Deployment and post-deploy smoke checks passed."
