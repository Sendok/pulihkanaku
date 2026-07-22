#!/bin/sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${CONFIRM_RESTORE:?Set CONFIRM_RESTORE=restore-pulihkanaku after reviewing the target}"
[ "$CONFIRM_RESTORE" = "restore-pulihkanaku" ] || { echo "Invalid restore confirmation" >&2; exit 2; }
backup_file=${1:?Usage: restore-postgres.sh /explicit/backup.dump}
[ -f "$backup_file" ] || { echo "Backup file not found" >&2; exit 2; }
[ -f "$backup_file.sha256" ] && (cd "$(dirname "$backup_file")" && sha256sum -c "$(basename "$backup_file").sha256")
pg_restore --dbname="$DATABASE_URL" --clean --if-exists --no-owner --no-acl --exit-on-error "$backup_file"
