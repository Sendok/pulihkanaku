#!/bin/sh
set -eu
: "${STORAGE_ENDPOINT:?STORAGE_ENDPOINT is required}" "${STORAGE_ACCESS_KEY:?STORAGE_ACCESS_KEY is required}" "${STORAGE_SECRET_KEY:?STORAGE_SECRET_KEY is required}"
backup_dir=${1:?Usage: backup-object-storage.sh /explicit/backup/directory}
case "$backup_dir" in /|""|.) echo "Refusing broad backup directory" >&2; exit 2;; esac
mkdir -p "$backup_dir"
mc alias set pulihkanaku-backup "$STORAGE_ENDPOINT" "$STORAGE_ACCESS_KEY" "$STORAGE_SECRET_KEY" >/dev/null
mc mirror --overwrite "pulihkanaku-backup/${STORAGE_BUCKET_PRIVATE:-pulihkanaku-private}" "$backup_dir/objects"
