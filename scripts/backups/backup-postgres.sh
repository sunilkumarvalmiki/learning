#!/bin/bash

# PostgreSQL Backup Script for Knowledge Management System
# Purpose: Create automated backups with compression and retention policy
# Usage: ./backup-postgres.sh [backup_dir]

set -euo pipefail

# Configuration
BACKUP_DIR="${1:-/var/backups/knowledge-db/postgres}"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="postgres_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Database connection settings (from environment or defaults)
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-knowledge_db}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

log "Starting PostgreSQL backup..."
log "Database: ${POSTGRES_DB}@${POSTGRES_HOST}:${POSTGRES_PORT}"
log "Backup path: ${BACKUP_PATH}"

# Check if PostgreSQL is accessible
if ! PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT 1" &>/dev/null; then
    error "Cannot connect to PostgreSQL database"
    exit 1
fi

# Get database size before backup
DB_SIZE=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -c "SELECT pg_size_pretty(pg_database_size('${POSTGRES_DB}'))" | xargs)
log "Database size: ${DB_SIZE}"

# Perform backup with pg_dump
log "Creating backup..."
START_TIME=$(date +%s)

if PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --format=plain \
    --verbose \
    --no-owner \
    --no-acl \
    2>&1 | gzip > "${BACKUP_PATH}"; then

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    # Get backup file size
    BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)

    log "✅ Backup completed successfully!"
    log "Duration: ${DURATION} seconds"
    log "Backup size: ${BACKUP_SIZE}"
    log "Backup location: ${BACKUP_PATH}"

    # Create a "latest" symlink for easy access
    ln -sf "${BACKUP_NAME}" "${BACKUP_DIR}/latest.sql.gz"
    log "Symlink created: ${BACKUP_DIR}/latest.sql.gz -> ${BACKUP_NAME}"
else
    error "Backup failed!"
    # Remove incomplete backup file
    rm -f "${BACKUP_PATH}"
    exit 1
fi

# Retention policy: Remove old backups
log "Applying retention policy (${RETENTION_DAYS} days)..."
DELETED_COUNT=0

find "${BACKUP_DIR}" -name "postgres_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} | while read -r old_backup; do
    log "Deleting old backup: $(basename "${old_backup}")"
    rm -f "${old_backup}"
    ((DELETED_COUNT++)) || true
done

if [ ${DELETED_COUNT} -gt 0 ]; then
    log "Deleted ${DELETED_COUNT} old backup(s)"
else
    log "No old backups to delete"
fi

# Generate backup metadata
cat > "${BACKUP_PATH}.meta" <<EOF
{
  "database": "${POSTGRES_DB}",
  "host": "${POSTGRES_HOST}",
  "port": ${POSTGRES_PORT},
  "timestamp": "${TIMESTAMP}",
  "backup_file": "${BACKUP_NAME}",
  "database_size": "${DB_SIZE}",
  "backup_size": "${BACKUP_SIZE}",
  "duration_seconds": ${DURATION},
  "retention_days": ${RETENTION_DAYS}
}
EOF

log "Metadata saved: ${BACKUP_PATH}.meta"

# Verify backup integrity
log "Verifying backup integrity..."
if gunzip -t "${BACKUP_PATH}" 2>/dev/null; then
    log "✅ Backup verification passed!"
else
    error "Backup verification failed! File may be corrupted."
    exit 1
fi

# Display backup summary
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Backup Summary:"
log "  Database: ${POSTGRES_DB}"
log "  Size: ${DB_SIZE} -> ${BACKUP_SIZE} (compressed)"
log "  Duration: ${DURATION}s"
log "  Location: ${BACKUP_PATH}"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Optional: Upload to S3 or remote backup location
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
    log "Uploading backup to S3: s3://${BACKUP_S3_BUCKET}/postgres/"
    if command -v aws &> /dev/null; then
        aws s3 cp "${BACKUP_PATH}" "s3://${BACKUP_S3_BUCKET}/postgres/${BACKUP_NAME}" \
            --storage-class STANDARD_IA \
            --metadata "database=${POSTGRES_DB},timestamp=${TIMESTAMP}" || warning "S3 upload failed"
        aws s3 cp "${BACKUP_PATH}.meta" "s3://${BACKUP_S3_BUCKET}/postgres/${BACKUP_NAME}.meta" || warning "S3 metadata upload failed"
    else
        warning "AWS CLI not found, skipping S3 upload"
    fi
fi

log "PostgreSQL backup process completed! 🎉"
exit 0
