#!/bin/sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
backup_dir=${1:?Usage: backup-postgres.sh /explicit/backup/directory}
case "$backup_dir" in /|""|.) echo "Refusing broad backup directory" >&2; exit 2;; esac
mkdir -p "$backup_dir"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
target="$backup_dir/pulihkanaku-$stamp.dump"
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-acl --file="$target"
sha256sum "$target" > "$target.sha256"
printf '%s\n' "$target"
