#!/bin/sh
set -eu
backup_file=${1:?Usage: restore-drill.sh /absolute/database.dump [/absolute/object-backup-directory]}
object_backup=${2:-}
case "$backup_file" in /*) ;; *) echo "Use an absolute database backup path" >&2; exit 2;; esac
[ -f "$backup_file" ] || { echo "Database backup not found: $backup_file" >&2; exit 2; }
command -v docker >/dev/null 2>&1 || { echo "docker is required" >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "Docker daemon is not running" >&2; exit 1; }

if [ -f "$backup_file.sha256" ]; then
  if command -v sha256sum >/dev/null 2>&1; then (cd "$(dirname "$backup_file")" && sha256sum -c "$(basename "$backup_file").sha256")
  else (cd "$(dirname "$backup_file")" && shasum -a 256 -c "$(basename "$backup_file").sha256"); fi
fi

suffix=$$
postgres_container="pulihkanaku-restore-drill-postgres-$suffix"
minio_container="pulihkanaku-restore-drill-minio-$suffix"
network="pulihkanaku-restore-drill-$suffix"
cleanup() {
  docker rm -f "$postgres_container" "$minio_container" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker network create "$network" >/dev/null
docker run -d --name "$postgres_container" --network "$network" -e POSTGRES_DB=pulihkanaku -e POSTGRES_USER=pulihkanaku -e POSTGRES_PASSWORD=restore-drill-only postgres:17-alpine >/dev/null
attempt=0
until docker exec "$postgres_container" pg_isready -U pulihkanaku -d pulihkanaku >/dev/null 2>&1; do
  attempt=$((attempt + 1)); [ "$attempt" -lt 60 ] || { docker logs "$postgres_container"; exit 1; }; sleep 1
done
docker run --rm --network "$network" -e PGPASSWORD=restore-drill-only -v "$(dirname "$backup_file"):/backup:ro" postgres:17-alpine pg_restore -h "$postgres_container" -U pulihkanaku -d pulihkanaku --no-owner --no-acl --exit-on-error "/backup/$(basename "$backup_file")"
docker exec "$postgres_container" psql -U pulihkanaku -d pulihkanaku -v ON_ERROR_STOP=1 -c "select 'users' entity,count(*) from users union all select 'jobs',count(*) from jobs union all select 'payouts',count(*) from payouts union all select 'ledger_entries',count(*) from ledger_entries;"

if [ -n "$object_backup" ]; then
  case "$object_backup" in /*) ;; *) echo "Use an absolute object backup path" >&2; exit 2;; esac
  [ -d "$object_backup/objects" ] || { echo "Expected $object_backup/objects" >&2; exit 2; }
  docker run -d --name "$minio_container" --network "$network" -e MINIO_ROOT_USER=restore-drill -e MINIO_ROOT_PASSWORD=restore-drill-password-only minio/minio:latest server /data >/dev/null
  attempt=0
  until docker run --rm --network "$network" --entrypoint /bin/sh minio/mc:latest -c "mc alias set drill http://$minio_container:9000 restore-drill restore-drill-password-only >/dev/null 2>&1 && mc ready drill >/dev/null 2>&1"; do
    attempt=$((attempt + 1)); [ "$attempt" -lt 60 ] || { docker logs "$minio_container"; exit 1; }; sleep 1
  done
  docker run --rm --network "$network" --entrypoint /bin/sh -v "$object_backup/objects:/backup:ro" minio/mc:latest -c "mc alias set drill http://$minio_container:9000 restore-drill restore-drill-password-only >/dev/null && mc mb --ignore-existing drill/pulihkanaku-private >/dev/null && mc mirror /backup drill/pulihkanaku-private && mc du drill/pulihkanaku-private"
fi
echo "Restore drill passed in isolated disposable containers. Production data was not modified."
