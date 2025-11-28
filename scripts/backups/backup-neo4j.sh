#!/bin/bash

# Neo4j Backup Script for Knowledge Management System
# Purpose: Create automated backups of Neo4j graph database
# Usage: ./backup-neo4j.sh [backup_dir]

set -euo pipefail

# Configuration
BACKUP_DIR="${1:-/var/backups/knowledge-db/neo4j}"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="neo4j_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Neo4j connection settings
NEO4J_URI="${NEO4J_URI:-bolt://localhost:7687}"
NEO4J_USER="${NEO4J_USER:-neo4j}"
NEO4J_PASSWORD="${NEO4J_PASSWORD:-password}"
NEO4J_DATABASE="${NEO4J_DATABASE:-neo4j}"

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

log "Starting Neo4j backup..."
log "Neo4j URI: ${NEO4J_URI}"
log "Database: ${NEO4J_DATABASE}"
log "Backup path: ${BACKUP_PATH}"

# Check if cypher-shell is available
if ! command -v cypher-shell &> /dev/null; then
    warning "cypher-shell not found, using docker exec instead"
    USE_DOCKER=true
else
    USE_DOCKER=false
fi

# Function to run Cypher query
run_cypher() {
    local query="$1"
    if [ "${USE_DOCKER}" = true ]; then
        docker exec knowledge-neo4j cypher-shell -u "${NEO4J_USER}" -p "${NEO4J_PASSWORD}" -d "${NEO4J_DATABASE}" "${query}" 2>/dev/null || true
    else
        echo "${query}" | cypher-shell -a "${NEO4J_URI}" -u "${NEO4J_USER}" -p "${NEO4J_PASSWORD}" -d "${NEO4J_DATABASE}" --format plain 2>/dev/null || true
    fi
}

# Check Neo4j connectivity
log "Checking Neo4j connection..."
if ! run_cypher "RETURN 1" > /dev/null; then
    error "Cannot connect to Neo4j"
    exit 1
fi

# Get database statistics
log "Fetching database statistics..."
NODE_COUNT=$(run_cypher "MATCH (n) RETURN count(n) as count" | tail -n 1 | xargs)
REL_COUNT=$(run_cypher "MATCH ()-[r]->() RETURN count(r) as count" | tail -n 1 | xargs)

log "Database statistics:"
log "  Nodes: ${NODE_COUNT:-0}"
log "  Relationships: ${REL_COUNT:-0}"

# Create backup using Cypher export
log "Creating Neo4j backup..."
START_TIME=$(date +%s)

# Export all nodes and relationships as Cypher statements
EXPORT_DIR="${BACKUP_PATH}"
mkdir -p "${EXPORT_DIR}"

# Export schema (indexes and constraints)
log "Exporting schema..."
run_cypher "SHOW INDEXES" > "${EXPORT_DIR}/schema_indexes.cypher" || warning "Failed to export indexes"
run_cypher "SHOW CONSTRAINTS" > "${EXPORT_DIR}/schema_constraints.cypher" || warning "Failed to export constraints"

# Export data using APOC if available, otherwise use manual export
log "Exporting data..."

# Try using APOC export (if available)
if run_cypher "RETURN apoc.version()" > /dev/null 2>&1; then
    log "Using APOC export procedures..."

    # Export to Cypher format
    run_cypher "CALL apoc.export.cypher.all('${BACKUP_NAME}.cypher', {format: 'cypher-shell', useOptimizations: {type: 'UNWIND_BATCH', unwindBatchSize: 20}})" > /dev/null 2>&1 || warning "APOC export failed"

    # Copy exported file from Neo4j container
    if [ "${USE_DOCKER}" = true ]; then
        docker cp "knowledge-neo4j:/var/lib/neo4j/import/${BACKUP_NAME}.cypher" "${EXPORT_DIR}/data.cypher" 2>/dev/null || warning "Failed to copy APOC export"
    fi
else
    warning "APOC not available, using basic Cypher export"

    # Manual export: Get all node labels
    LABELS=$(run_cypher "CALL db.labels()" | tail -n +2 | head -n -1)

    # Export nodes by label
    echo "// Node export" > "${EXPORT_DIR}/data.cypher"
    while IFS= read -r label; do
        if [ -n "${label}" ]; then
            log "Exporting nodes with label: ${label}"
            run_cypher "MATCH (n:${label}) RETURN n" >> "${EXPORT_DIR}/data.cypher" || warning "Failed to export ${label} nodes"
        fi
    done <<< "${LABELS}"

    # Export relationships
    log "Exporting relationships..."
    echo "// Relationship export" >> "${EXPORT_DIR}/data.cypher"
    run_cypher "MATCH (a)-[r]->(b) RETURN a, r, b" >> "${EXPORT_DIR}/data.cypher" || warning "Failed to export relationships"
fi

# Compress the backup
log "Compressing backup..."
tar -czf "${BACKUP_PATH}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}" 2>/dev/null

# Remove uncompressed directory
rm -rf "${EXPORT_DIR}"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_PATH}.tar.gz" | cut -f1)

log "✅ Backup completed successfully!"
log "Duration: ${DURATION} seconds"
log "Backup size: ${BACKUP_SIZE}"
log "Location: ${BACKUP_PATH}.tar.gz"

# Create metadata
cat > "${BACKUP_PATH}.tar.gz.meta" <<EOF
{
  "database": "${NEO4J_DATABASE}",
  "uri": "${NEO4J_URI}",
  "timestamp": "${TIMESTAMP}",
  "backup_file": "${BACKUP_NAME}.tar.gz",
  "node_count": ${NODE_COUNT:-0},
  "relationship_count": ${REL_COUNT:-0},
  "backup_size": "${BACKUP_SIZE}",
  "duration_seconds": ${DURATION},
  "retention_days": ${RETENTION_DAYS}
}
EOF

log "Metadata saved: ${BACKUP_PATH}.tar.gz.meta"

# Create symlink to latest
ln -sf "${BACKUP_NAME}.tar.gz" "${BACKUP_DIR}/latest.tar.gz"
log "Symlink created: ${BACKUP_DIR}/latest.tar.gz"

# Apply retention policy
log "Applying retention policy (${RETENTION_DAYS} days)..."
DELETED_COUNT=0

find "${BACKUP_DIR}" -name "neo4j_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} | while read -r old_backup; do
    log "Deleting old backup: $(basename "${old_backup}")"
    rm -f "${old_backup}" "${old_backup}.meta"
    ((DELETED_COUNT++)) || true
done

if [ ${DELETED_COUNT} -gt 0 ]; then
    log "Deleted ${DELETED_COUNT} old backup(s)"
else
    log "No old backups to delete"
fi

# Verify backup
log "Verifying backup integrity..."
if tar -tzf "${BACKUP_PATH}.tar.gz" > /dev/null 2>&1; then
    log "✅ Backup verification passed!"
else
    error "Backup verification failed!"
    exit 1
fi

# Display summary
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Neo4j Backup Summary:"
log "  Database: ${NEO4J_DATABASE}"
log "  Nodes: ${NODE_COUNT:-0}"
log "  Relationships: ${REL_COUNT:-0}"
log "  Size: ${BACKUP_SIZE}"
log "  Duration: ${DURATION}s"
log "  Location: ${BACKUP_PATH}.tar.gz"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Optional: Upload to S3
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
    log "Uploading backup to S3: s3://${BACKUP_S3_BUCKET}/neo4j/"
    if command -v aws &> /dev/null; then
        aws s3 cp "${BACKUP_PATH}.tar.gz" "s3://${BACKUP_S3_BUCKET}/neo4j/${BACKUP_NAME}.tar.gz" \
            --storage-class STANDARD_IA || warning "S3 upload failed"
        aws s3 cp "${BACKUP_PATH}.tar.gz.meta" "s3://${BACKUP_S3_BUCKET}/neo4j/${BACKUP_NAME}.tar.gz.meta" || warning "S3 metadata upload failed"
    else
        warning "AWS CLI not found, skipping S3 upload"
    fi
fi

log "Neo4j backup process completed! 🎉"
exit 0
