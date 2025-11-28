#!/bin/bash

# Qdrant Backup Script for Knowledge Management System
# Purpose: Create automated snapshots of Qdrant vector database
# Usage: ./backup-qdrant.sh [backup_dir]

set -euo pipefail

# Configuration
BACKUP_DIR="${1:-/var/backups/knowledge-db/qdrant}"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="qdrant_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Qdrant connection settings
QDRANT_URL="${QDRANT_URL:-http://localhost:6333}"
QDRANT_API_KEY="${QDRANT_API_KEY:-}"
COLLECTION_NAME="${QDRANT_COLLECTION:-documents}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backup directory
mkdir -p "${BACKUP_DIR}"

log "Starting Qdrant backup..."
log "Qdrant URL: ${QDRANT_URL}"
log "Collection: ${COLLECTION_NAME}"
log "Backup path: ${BACKUP_PATH}"

# Prepare curl headers
CURL_HEADERS=(-H "Content-Type: application/json")
if [ -n "${QDRANT_API_KEY}" ]; then
    CURL_HEADERS+=(-H "api-key: ${QDRANT_API_KEY}")
fi

# Check Qdrant health
log "Checking Qdrant connection..."
if ! curl -sf "${CURL_HEADERS[@]}" "${QDRANT_URL}/health" > /dev/null; then
    error "Cannot connect to Qdrant at ${QDRANT_URL}"
    exit 1
fi

# Get collection info
log "Fetching collection information..."
COLLECTION_INFO=$(curl -sf "${CURL_HEADERS[@]}" "${QDRANT_URL}/collections/${COLLECTION_NAME}")

if [ -z "${COLLECTION_INFO}" ]; then
    error "Collection '${COLLECTION_NAME}' not found"
    exit 1
fi

# Extract collection statistics
VECTOR_COUNT=$(echo "${COLLECTION_INFO}" | jq -r '.result.points_count // 0')
COLLECTION_STATUS=$(echo "${COLLECTION_INFO}" | jq -r '.result.status // "unknown"')

log "Collection statistics:"
log "  Vectors: ${VECTOR_COUNT}"
log "  Status: ${COLLECTION_STATUS}"

# Create snapshot via Qdrant API
log "Creating Qdrant snapshot..."
START_TIME=$(date +%s)

SNAPSHOT_RESPONSE=$(curl -sf "${CURL_HEADERS[@]}" \
    -X POST "${QDRANT_URL}/collections/${COLLECTION_NAME}/snapshots" \
    2>&1)

if [ -z "${SNAPSHOT_RESPONSE}" ]; then
    error "Failed to create snapshot"
    exit 1
fi

# Extract snapshot name from response
SNAPSHOT_NAME=$(echo "${SNAPSHOT_RESPONSE}" | jq -r '.result.name')

if [ -z "${SNAPSHOT_NAME}" ] || [ "${SNAPSHOT_NAME}" = "null" ]; then
    error "Invalid snapshot response"
    exit 1
fi

log "Snapshot created: ${SNAPSHOT_NAME}"

# Download the snapshot
log "Downloading snapshot..."
SNAPSHOT_FILE="${BACKUP_PATH}.snapshot"

if curl -sf "${CURL_HEADERS[@]}" \
    -o "${SNAPSHOT_FILE}" \
    "${QDRANT_URL}/collections/${COLLECTION_NAME}/snapshots/${SNAPSHOT_NAME}"; then

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    # Get backup size
    BACKUP_SIZE=$(du -h "${SNAPSHOT_FILE}" | cut -f1)

    log "✅ Snapshot downloaded successfully!"
    log "Duration: ${DURATION} seconds"
    log "Snapshot size: ${BACKUP_SIZE}"
    log "Location: ${SNAPSHOT_FILE}"
else
    error "Failed to download snapshot"
    exit 1
fi

# Create metadata file
cat > "${SNAPSHOT_FILE}.meta" <<EOF
{
  "collection": "${COLLECTION_NAME}",
  "qdrant_url": "${QDRANT_URL}",
  "timestamp": "${TIMESTAMP}",
  "snapshot_name": "${SNAPSHOT_NAME}",
  "vector_count": ${VECTOR_COUNT},
  "collection_status": "${COLLECTION_STATUS}",
  "backup_size": "${BACKUP_SIZE}",
  "duration_seconds": ${DURATION},
  "retention_days": ${RETENTION_DAYS}
}
EOF

log "Metadata saved: ${SNAPSHOT_FILE}.meta"

# Create symlink to latest backup
ln -sf "$(basename "${SNAPSHOT_FILE}")" "${BACKUP_DIR}/latest.snapshot"
log "Symlink created: ${BACKUP_DIR}/latest.snapshot"

# Clean up old snapshots from Qdrant (optional, keep only latest 5)
log "Cleaning up old Qdrant snapshots..."
SNAPSHOTS_LIST=$(curl -sf "${CURL_HEADERS[@]}" \
    "${QDRANT_URL}/collections/${COLLECTION_NAME}/snapshots" | jq -r '.result[].name')

SNAPSHOT_COUNT=0
while IFS= read -r snapshot; do
    ((SNAPSHOT_COUNT++)) || true
done <<< "${SNAPSHOTS_LIST}"

if [ ${SNAPSHOT_COUNT} -gt 5 ]; then
    log "Found ${SNAPSHOT_COUNT} snapshots in Qdrant, keeping only 5 most recent"
    echo "${SNAPSHOTS_LIST}" | head -n -5 | while IFS= read -r old_snapshot; do
        log "Deleting old snapshot from Qdrant: ${old_snapshot}"
        curl -sf "${CURL_HEADERS[@]}" \
            -X DELETE "${QDRANT_URL}/collections/${COLLECTION_NAME}/snapshots/${old_snapshot}" > /dev/null || warning "Failed to delete ${old_snapshot}"
    done
fi

# Apply retention policy to local backups
log "Applying retention policy (${RETENTION_DAYS} days)..."
DELETED_COUNT=0

find "${BACKUP_DIR}" -name "qdrant_backup_*.snapshot" -type f -mtime +${RETENTION_DAYS} | while read -r old_backup; do
    log "Deleting old backup: $(basename "${old_backup}")"
    rm -f "${old_backup}" "${old_backup}.meta"
    ((DELETED_COUNT++)) || true
done

if [ ${DELETED_COUNT} -gt 0 ]; then
    log "Deleted ${DELETED_COUNT} old backup(s)"
else
    log "No old backups to delete"
fi

# Verify snapshot integrity
log "Verifying snapshot integrity..."
if [ -f "${SNAPSHOT_FILE}" ] && [ -s "${SNAPSHOT_FILE}" ]; then
    log "✅ Snapshot verification passed!"
else
    error "Snapshot verification failed!"
    exit 1
fi

# Display summary
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Qdrant Backup Summary:"
log "  Collection: ${COLLECTION_NAME}"
log "  Vectors: ${VECTOR_COUNT}"
log "  Size: ${BACKUP_SIZE}"
log "  Duration: ${DURATION}s"
log "  Location: ${SNAPSHOT_FILE}"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Optional: Upload to S3
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
    log "Uploading backup to S3: s3://${BACKUP_S3_BUCKET}/qdrant/"
    if command -v aws &> /dev/null; then
        aws s3 cp "${SNAPSHOT_FILE}" "s3://${BACKUP_S3_BUCKET}/qdrant/${BACKUP_NAME}.snapshot" \
            --storage-class STANDARD_IA || warning "S3 upload failed"
        aws s3 cp "${SNAPSHOT_FILE}.meta" "s3://${BACKUP_S3_BUCKET}/qdrant/${BACKUP_NAME}.snapshot.meta" || warning "S3 metadata upload failed"
    else
        warning "AWS CLI not found, skipping S3 upload"
    fi
fi

log "Qdrant backup process completed! 🎉"
exit 0
