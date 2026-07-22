#!/bin/sh
set -eu
: "${STORAGE_ENDPOINT:?STORAGE_ENDPOINT is required}" "${STORAGE_ACCESS_KEY:?STORAGE_ACCESS_KEY is required}" "${STORAGE_SECRET_KEY:?STORAGE_SECRET_KEY is required}"
: "${CONFIRM_RESTORE:?Set CONFIRM_RESTORE=restore-pulihkanaku after reviewing the target}"
[ "$CONFIRM_RESTORE" = "restore-pulihkanaku" ] || { echo "Invalid restore confirmation" >&2; exit 2; }
backup_dir=${1:?Usage: restore-object-storage.sh /explicit/backup/directory}
[ -d "$backup_dir/objects" ] || { echo "Object backup directory not found" >&2; exit 2; }
mc alias set pulihkanaku-restore "$STORAGE_ENDPOINT" "$STORAGE_ACCESS_KEY" "$STORAGE_SECRET_KEY" >/dev/null
mc mirror --overwrite "$backup_dir/objects" "pulihkanaku-restore/${STORAGE_BUCKET_PRIVATE:-pulihkanaku-private}"
