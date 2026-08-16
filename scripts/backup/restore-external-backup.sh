#!/usr/bin/env bash

set -euo pipefail

: "${TARGET_ENVIRONMENT:?Falta TARGET_ENVIRONMENT}"
: "${CONFIRM_RESTORE:?Falta CONFIRM_RESTORE}"
: "${TARGET_SUPABASE_DB_URL:?Falta TARGET_SUPABASE_DB_URL}"
: "${TARGET_SUPABASE_URL:?Falta TARGET_SUPABASE_URL}"
: "${TARGET_SUPABASE_SERVICE_ROLE_KEY:?Falta TARGET_SUPABASE_SERVICE_ROLE_KEY}"
: "${RESTIC_REPOSITORY:?Falta RESTIC_REPOSITORY}"
: "${RESTIC_PASSWORD:?Falta RESTIC_PASSWORD}"

if [[ "$TARGET_ENVIRONMENT" != "staging" ]]; then
  echo "La restauración automatizada solo admite staging" >&2
  exit 1
fi
if [[ "$CONFIRM_RESTORE" != "RESTORE_EMPTY_STAGING" ]]; then
  echo "La confirmación de restauración no coincide" >&2
  exit 1
fi

for command in restic psql node sha256sum; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Falta la herramienta requerida: $command" >&2
    exit 1
  fi
done

started_at="$(date +%s)"
restore_directory="$(mktemp -d)"
chmod 700 "$restore_directory"

cleanup() {
  if [[ -n "${restore_directory:-}" && -d "$restore_directory" ]]; then
    find "$restore_directory" -mindepth 1 -delete
    rmdir "$restore_directory"
  fi
}
trap cleanup EXIT

restic restore "${RESTIC_SNAPSHOT:-latest}" \
  --tag crm \
  --target "$restore_directory"

metadata_files=()
while IFS= read -r metadata_file; do
  metadata_files+=("$metadata_file")
done < <(find "$restore_directory" -type f -path '*/database/metadata.json' -print)

if [[ "${#metadata_files[@]}" -ne 1 ]]; then
  echo "El snapshot no contiene una raíz de respaldo única" >&2
  exit 1
fi

database_directory="$(dirname "${metadata_files[0]}")"
backup_root="$(dirname "$database_directory")"
storage_directory="$backup_root/storage"

declare -A expected_checksums=(
  [roles.sql]=1
  [schema.sql]=1
  [data.sql]=1
)
while read -r checksum file_name unexpected; do
  if [[
    ! "$checksum" =~ ^[a-f0-9]{64}$ ||
    -n "${unexpected:-}" ||
    -z "${expected_checksums[$file_name]+present}"
  ]]; then
    echo "El índice de integridad de la base no es válido" >&2
    exit 1
  fi
  unset 'expected_checksums[$file_name]'
done < "$database_directory/checksums.sha256"
if [[ "${#expected_checksums[@]}" -ne 0 ]]; then
  echo "El índice de integridad no contiene los tres dumps esperados" >&2
  exit 1
fi

(
  cd "$database_directory"
  sha256sum --check --strict checksums.sha256
)
node scripts/backup/verify-storage.mjs "$storage_directory"

public_table_count="$(
  PGDATABASE="$TARGET_SUPABASE_DB_URL" \
    psql -X --set ON_ERROR_STOP=1 --tuples-only --no-align \
      --command "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';"
)"
if [[ "$public_table_count" != "0" ]]; then
  echo "La base de staging contiene tablas públicas; se requiere un proyecto vacío" >&2
  exit 1
fi

PGDATABASE="$TARGET_SUPABASE_DB_URL" \
  psql -X --set ON_ERROR_STOP=1 --single-transaction \
    --file "$database_directory/roles.sql"

PGDATABASE="$TARGET_SUPABASE_DB_URL" \
  psql -X --set ON_ERROR_STOP=1 --single-transaction \
    --file "$database_directory/schema.sql" \
    --file "$database_directory/data.sql"

TARGET_ENVIRONMENT="$TARGET_ENVIRONMENT" \
CONFIRM_RESTORE="$CONFIRM_RESTORE" \
TARGET_SUPABASE_URL="$TARGET_SUPABASE_URL" \
TARGET_SUPABASE_SERVICE_ROLE_KEY="$TARGET_SUPABASE_SERVICE_ROLE_KEY" \
  node scripts/backup/restore-storage.mjs "$storage_directory"

PGDATABASE="$TARGET_SUPABASE_DB_URL" \
  psql -X --set ON_ERROR_STOP=1 --command "ANALYZE;" >/dev/null

restored_public_tables="$(
  PGDATABASE="$TARGET_SUPABASE_DB_URL" \
    psql -X --set ON_ERROR_STOP=1 --tuples-only --no-align \
      --command "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';"
)"
restored_storage_objects="$(
  PGDATABASE="$TARGET_SUPABASE_DB_URL" \
    psql -X --set ON_ERROR_STOP=1 --tuples-only --no-align \
      --command "SELECT count(*) FROM storage.objects WHERE bucket_id IN ('documentos', 'backups');"
)"

finished_at="$(date +%s)"
duration_seconds="$((finished_at - started_at))"
if (( duration_seconds > 14400 )); then
  echo "La restauración superó el RTO máximo de cuatro horas" >&2
  exit 1
fi

report="$(printf '{"success":true,"durationSeconds":%s,"publicTables":%s,"storageObjects":%s}\n' \
  "$duration_seconds" "$restored_public_tables" "$restored_storage_objects")"
printf '%s' "$report"
if [[ -n "${RESTORE_REPORT_FILE:-}" ]]; then
  printf '%s' "$report" > "$RESTORE_REPORT_FILE"
fi
