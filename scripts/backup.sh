#!/usr/bin/env bash
# ==============================================================================
# ClientDesk Database Backup Script
# Creates a compressed PostgreSQL database dump using pg_dump
# Suitable for automated execution via cron / systemd timer.
#
# Usage:
#   ./scripts/backup.sh
#
# Crontab example (daily backup at 02:00 AM):
#   0 2 * * * /path/to/clientdesk/scripts/backup.sh >> /var/log/clientdesk_backup.log 2>&1
# ==============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-clientdesk}"
DB_USER="${POSTGRES_USER:-clientdesk_user}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"

echo "[$(date -Is)] Starting database backup for '${DB_NAME}' on ${DB_HOST}:${DB_PORT}..."

if [ -n "${PGPASSWORD:-}" ] || [ -n "${POSTGRES_PASSWORD:-}" ]; then
  export PGPASSWORD="${PGPASSWORD:-${POSTGRES_PASSWORD:-clientdesk_secret_2026}}"
fi

# Run pg_dump and gzip
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --no-owner --clean --if-exists | gzip > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date -Is)] Backup completed successfully: ${BACKUP_FILE} (Size: ${FILE_SIZE})"

# Retention policy: remove backups older than RETENTION_DAYS
echo "[$(date -Is)] Cleaning up backups older than ${RETENTION_DAYS} days in ${BACKUP_DIR}..."
find "${BACKUP_DIR}" -name "${DB_NAME}_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -vf {} \;

echo "[$(date -Is)] Backup process finished."
