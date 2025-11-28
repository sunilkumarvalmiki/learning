#!/bin/bash

# Master Backup Orchestration Script
# Purpose: Coordinate backups of all databases in the Knowledge Management System
# Usage: ./backup-all.sh [backup_base_dir]

set -euo pipefail

# Configuration
BACKUP_BASE_DIR="${1:-/var/backups/knowledge-db}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${BACKUP_BASE_DIR}/backup.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${GREEN}${message}${NC}"
    echo "${message}" >> "${LOG_FILE}"
}

error() {
    local message="[ERROR] $1"
    echo -e "${RED}${message}${NC}" >&2
    echo "${message}" >> "${LOG_FILE}"
}

warning() {
    local message="[WARNING] $1"
    echo -e "${YELLOW}${message}${NC}"
    echo "${message}" >> "${LOG_FILE}"
}

info() {
    local message="[INFO] $1"
    echo -e "${BLUE}${message}${NC}"
    echo "${message}" >> "${LOG_FILE}"
}

# Create backup directories
mkdir -p "${BACKUP_BASE_DIR}"/{postgres,qdrant,neo4j,minio}
mkdir -p "$(dirname "${LOG_FILE}")"

# Backup status tracking
declare -A BACKUP_STATUS
BACKUP_STATUS[postgres]="pending"
BACKUP_STATUS[qdrant]="pending"
BACKUP_STATUS[neo4j]="pending"
BACKUP_STATUS[minio]="pending"

TOTAL_BACKUPS=4
SUCCESSFUL_BACKUPS=0
FAILED_BACKUPS=0

# Start time
BACKUP_START_TIME=$(date +%s)

log "╔════════════════════════════════════════════════════════════╗"
log "║  Knowledge Management System - Database Backup Suite      ║"
log "║  Timestamp: ${TIMESTAMP}                           ║"
log "╚════════════════════════════════════════════════════════════╝"
log ""
log "Backup destination: ${BACKUP_BASE_DIR}"
log "Log file: ${LOG_FILE}"
log ""

# Function to run backup and track status
run_backup() {
    local db_name=$1
    local script_name=$2
    local backup_dir=$3

    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "Starting ${db_name} backup..."
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ -f "${SCRIPT_DIR}/${script_name}" ]; then
        if bash "${SCRIPT_DIR}/${script_name}" "${backup_dir}" 2>&1 | tee -a "${LOG_FILE}"; then
            BACKUP_STATUS[${db_name}]="success"
            ((SUCCESSFUL_BACKUPS++))
            log "✅ ${db_name} backup completed successfully!"
        else
            BACKUP_STATUS[${db_name}]="failed"
            ((FAILED_BACKUPS++))
            error "❌ ${db_name} backup failed!"
        fi
    else
        BACKUP_STATUS[${db_name}]="skipped"
        warning "⚠️  Backup script not found: ${script_name}"
        ((FAILED_BACKUPS++))
    fi

    log ""
}

# Execute backups sequentially (can be parallelized if needed)
run_backup "postgres" "backup-postgres.sh" "${BACKUP_BASE_DIR}/postgres"
run_backup "qdrant" "backup-qdrant.sh" "${BACKUP_BASE_DIR}/qdrant"
run_backup "neo4j" "backup-neo4j.sh" "${BACKUP_BASE_DIR}/neo4j"

# MinIO backup (optional - copy bucket contents)
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Starting MinIO backup..."
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# MinIO backup uses mc (MinIO Client) to mirror buckets
if command -v mc &> /dev/null; then
    MINIO_BACKUP_DIR="${BACKUP_BASE_DIR}/minio/backup_${TIMESTAMP}"
    mkdir -p "${MINIO_BACKUP_DIR}"

    # Configure mc alias (if not already configured)
    mc alias set local http://localhost:9000 minioadmin minioadmin 2>&1 | tee -a "${LOG_FILE}" || true

    # Mirror documents bucket
    if mc mirror local/documents "${MINIO_BACKUP_DIR}/documents" 2>&1 | tee -a "${LOG_FILE}"; then
        BACKUP_STATUS[minio]="success"
        ((SUCCESSFUL_BACKUPS++))
        log "✅ MinIO backup completed successfully!"

        # Compress MinIO backup
        tar -czf "${MINIO_BACKUP_DIR}.tar.gz" -C "${BACKUP_BASE_DIR}/minio" "backup_${TIMESTAMP}" 2>&1 | tee -a "${LOG_FILE}"
        rm -rf "${MINIO_BACKUP_DIR}"
        log "MinIO backup compressed: ${MINIO_BACKUP_DIR}.tar.gz"
    else
        BACKUP_STATUS[minio]="failed"
        ((FAILED_BACKUPS++))
        error "❌ MinIO backup failed!"
    fi
else
    BACKUP_STATUS[minio]="skipped"
    warning "⚠️  MinIO client (mc) not found, skipping MinIO backup"
    ((FAILED_BACKUPS++))
fi

log ""

# Calculate total time
BACKUP_END_TIME=$(date +%s)
TOTAL_DURATION=$((BACKUP_END_TIME - BACKUP_START_TIME))
DURATION_MIN=$((TOTAL_DURATION / 60))
DURATION_SEC=$((TOTAL_DURATION % 60))

# Calculate total backup size
TOTAL_SIZE=$(du -sh "${BACKUP_BASE_DIR}" 2>/dev/null | cut -f1 || echo "unknown")

# Generate summary report
log "╔════════════════════════════════════════════════════════════╗"
log "║                    BACKUP SUMMARY                          ║"
log "╚════════════════════════════════════════════════════════════╝"
log ""
log "Timestamp: ${TIMESTAMP}"
log "Duration: ${DURATION_MIN}m ${DURATION_SEC}s"
log "Total backup size: ${TOTAL_SIZE}"
log ""
log "Backup Status:"
log "  PostgreSQL:  ${BACKUP_STATUS[postgres]}"
log "  Qdrant:      ${BACKUP_STATUS[qdrant]}"
log "  Neo4j:       ${BACKUP_STATUS[neo4j]}"
log "  MinIO:       ${BACKUP_STATUS[minio]}"
log ""
log "Results: ${SUCCESSFUL_BACKUPS}/${TOTAL_BACKUPS} successful"

if [ ${FAILED_BACKUPS} -eq 0 ]; then
    log "Status: ✅ ALL BACKUPS COMPLETED SUCCESSFULLY!"
    EXIT_CODE=0
else
    error "Status: ⚠️  ${FAILED_BACKUPS} backup(s) failed or skipped"
    EXIT_CODE=1
fi

# Create backup summary JSON
cat > "${BACKUP_BASE_DIR}/backup_summary_${TIMESTAMP}.json" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "duration_seconds": ${TOTAL_DURATION},
  "total_size": "${TOTAL_SIZE}",
  "backup_status": {
    "postgres": "${BACKUP_STATUS[postgres]}",
    "qdrant": "${BACKUP_STATUS[qdrant]}",
    "neo4j": "${BACKUP_STATUS[neo4j]}",
    "minio": "${BACKUP_STATUS[minio]}"
  },
  "successful_backups": ${SUCCESSFUL_BACKUPS},
  "failed_backups": ${FAILED_BACKUPS},
  "total_backups": ${TOTAL_BACKUPS}
}
EOF

log ""
log "Summary saved: ${BACKUP_BASE_DIR}/backup_summary_${TIMESTAMP}.json"
log "Full log: ${LOG_FILE}"
log ""

# Send notification (optional - integrate with email, Slack, etc.)
if [ -n "${BACKUP_NOTIFICATION_WEBHOOK:-}" ]; then
    log "Sending backup notification..."
    curl -X POST "${BACKUP_NOTIFICATION_WEBHOOK}" \
        -H "Content-Type: application/json" \
        -d "{
            \"status\": \"${EXIT_CODE}\",
            \"successful\": ${SUCCESSFUL_BACKUPS},
            \"failed\": ${FAILED_BACKUPS},
            \"duration\": \"${DURATION_MIN}m ${DURATION_SEC}s\",
            \"timestamp\": \"${TIMESTAMP}\"
        }" 2>&1 | tee -a "${LOG_FILE}" || warning "Failed to send notification"
fi

log "╔════════════════════════════════════════════════════════════╗"
log "║            Backup Process Completed!                       ║"
log "╚════════════════════════════════════════════════════════════╝"

exit ${EXIT_CODE}
