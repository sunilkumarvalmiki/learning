# Database Recovery Procedures

## Knowledge Management System - Disaster Recovery Guide

**Version:** 1.0
**Last Updated:** 2025-01-28
**Owner:** Database Operations Team

---

## Table of Contents

1. [Overview](#overview)
2. [Recovery Objectives](#recovery-objectives)
3. [Prerequisites](#prerequisites)
4. [PostgreSQL Recovery](#postgresql-recovery)
5. [Qdrant Recovery](#qdrant-recovery)
6. [Neo4j Recovery](#neo4j-recovery)
7. [MinIO Recovery](#minio-recovery)
8. [Full System Recovery](#full-system-recovery)
9. [Verification Procedures](#verification-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This document provides step-by-step procedures for recovering the Knowledge Management System databases from backups. Follow these procedures in the event of:

- Data corruption
- Hardware failure
- Accidental data deletion
- Disaster recovery scenarios
- Migration to new infrastructure

### Backup Schedule

- **Frequency:** Daily at 2:00 AM UTC
- **Retention:** 30 days
- **Location:** `/var/backups/knowledge-db/`
- **Off-site:** S3 bucket (optional)

---

## Recovery Objectives

### RPO (Recovery Point Objective)

- **Target:** 24 hours
- **Achievable:** Yes, with daily backups
- **Real-time alternative:** Point-in-time recovery (PITR) for PostgreSQL

### RTO (Recovery Time Objective)

- **Target:** 4 hours
- **Breakdown:**
  - PostgreSQL: 30-60 minutes
  - Qdrant: 15-30 minutes
  - Neo4j: 30-45 minutes
  - MinIO: 30-60 minutes
  - Verification: 30-60 minutes

---

## Prerequisites

### Required Tools

```bash
# PostgreSQL
psql (PostgreSQL 15+)
pg_restore

# Qdrant
curl or wget
jq (JSON processor)

# Neo4j
cypher-shell
docker (if using containerized Neo4j)

# MinIO
mc (MinIO Client)

# General
tar, gzip
```

### Access Requirements

- Database administrator credentials
- Backup directory access
- Network connectivity to database servers
- Sufficient disk space (2x backup size recommended)

### Environment Variables

Create a `.env.recovery` file:

```bash
# PostgreSQL
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=knowledge_db
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres

# Qdrant
export QDRANT_URL=http://localhost:6333
export QDRANT_API_KEY=  # Optional

# Neo4j
export NEO4J_URI=bolt://localhost:7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=password

# MinIO
export MINIO_ENDPOINT=localhost:9000
export MINIO_ACCESS_KEY=minioadmin
export MINIO_SECRET_KEY=minioadmin

# Backup directory
export BACKUP_DIR=/var/backups/knowledge-db
```

Load environment:
```bash
source .env.recovery
```

---

## PostgreSQL Recovery

### 1. Stop Application

```bash
# Stop the backend API to prevent new connections
docker-compose stop api
# or
systemctl stop knowledge-api
```

### 2. Locate Backup

```bash
# Find latest backup
ls -lht ${BACKUP_DIR}/postgres/

# Or use the latest symlink
BACKUP_FILE="${BACKUP_DIR}/postgres/latest.sql.gz"

# Verify backup integrity
gunzip -t ${BACKUP_FILE}
echo "Backup verification: $?"  # Should return 0
```

### 3. Drop and Recreate Database (Full Recovery)

**⚠️ WARNING: This will delete all existing data!**

```bash
# Connect to PostgreSQL
PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d postgres

# Drop existing database (if needed)
DROP DATABASE IF EXISTS knowledge_db;

# Recreate database
CREATE DATABASE knowledge_db;

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE knowledge_db TO postgres;

# Exit psql
\q
```

### 4. Restore from Backup

```bash
# Method 1: Direct restore from compressed backup
gunzip -c ${BACKUP_FILE} | PGPASSWORD=${POSTGRES_PASSWORD} psql \
  -h ${POSTGRES_HOST} \
  -p ${POSTGRES_PORT} \
  -U ${POSTGRES_USER} \
  -d ${POSTGRES_DB}

# Method 2: Restore from specific backup
BACKUP_DATE="20250128_140000"
BACKUP_FILE="${BACKUP_DIR}/postgres/postgres_backup_${BACKUP_DATE}.sql.gz"

gunzip -c ${BACKUP_FILE} | PGPASSWORD=${POSTGRES_PASSWORD} psql \
  -h ${POSTGRES_HOST} \
  -p ${POSTGRES_PORT} \
  -U ${POSTGRES_USER} \
  -d ${POSTGRES_DB} \
  2>&1 | tee restore.log
```

### 5. Verify Restoration

```bash
# Connect to database
PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB}

-- Check tables exist
\dt

-- Check row counts
SELECT 'users' AS table_name, COUNT(*) FROM users
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'notes', COUNT(*) FROM notes;

-- Check extensions
\dx

-- Check indexes
\di

-- Exit
\q
```

### 6. Update Statistics

```bash
PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "VACUUM ANALYZE;"
```

### Point-in-Time Recovery (PITR)

If WAL archiving is enabled (future enhancement):

```bash
# 1. Stop PostgreSQL
docker-compose stop postgres

# 2. Restore base backup
# 3. Copy WAL files to pg_wal directory
# 4. Create recovery.conf with target time
# 5. Start PostgreSQL
# 6. Verify recovery

# See PostgreSQL documentation for detailed PITR steps
```

---

## Qdrant Recovery

### 1. Stop Qdrant Services

```bash
# Stop Qdrant container
docker-compose stop qdrant

# Or stop Qdrant service
systemctl stop qdrant
```

### 2. Locate Backup

```bash
# Find latest backup
ls -lht ${BACKUP_DIR}/qdrant/

BACKUP_FILE="${BACKUP_DIR}/qdrant/latest.snapshot"

# Verify backup
[ -f "${BACKUP_FILE}" ] && echo "Backup found" || echo "Backup not found"
```

### 3. Restore Collection

```bash
# Start Qdrant
docker-compose start qdrant

# Wait for Qdrant to be ready
until curl -sf ${QDRANT_URL}/health > /dev/null; do
    echo "Waiting for Qdrant..."
    sleep 2
done

# Delete existing collection (optional)
curl -X DELETE "${QDRANT_URL}/collections/documents"

# Upload snapshot
curl -X POST "${QDRANT_URL}/collections/documents/snapshots/upload" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @${BACKUP_FILE}

# Recover from snapshot
SNAPSHOT_NAME=$(basename ${BACKUP_FILE})
curl -X PUT "${QDRANT_URL}/collections/documents/snapshots/${SNAPSHOT_NAME}/recover"
```

### 4. Verify Recovery

```bash
# Check collection info
curl -s "${QDRANT_URL}/collections/documents" | jq '.result'

# Verify point count
curl -s "${QDRANT_URL}/collections/documents" | jq '.result.points_count'

# Test search
curl -X POST "${QDRANT_URL}/collections/documents/points/search" \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, ...],  # Sample vector
    "limit": 5
  }' | jq
```

---

## Neo4j Recovery

### 1. Stop Neo4j

```bash
# Stop Neo4j container
docker-compose stop neo4j

# Or stop service
systemctl stop neo4j
```

### 2. Locate Backup

```bash
# Find latest backup
ls -lht ${BACKUP_DIR}/neo4j/

BACKUP_FILE="${BACKUP_DIR}/neo4j/latest.tar.gz"

# Verify backup integrity
tar -tzf ${BACKUP_FILE} > /dev/null
echo "Backup verification: $?"
```

### 3. Extract Backup

```bash
# Extract to temporary directory
TEMP_DIR="/tmp/neo4j_restore_$(date +%s)"
mkdir -p ${TEMP_DIR}

tar -xzf ${BACKUP_FILE} -C ${TEMP_DIR}
```

### 4. Restore Data

```bash
# Start Neo4j
docker-compose start neo4j

# Wait for Neo4j to be ready
until docker exec knowledge-neo4j cypher-shell -u ${NEO4J_USER} -p ${NEO4J_PASSWORD} "RETURN 1" &>/dev/null; do
    echo "Waiting for Neo4j..."
    sleep 2
done

# Clear existing data (optional)
docker exec knowledge-neo4j cypher-shell -u ${NEO4J_USER} -p ${NEO4J_PASSWORD} \
    "MATCH (n) DETACH DELETE n"

# Restore schema
if [ -f "${TEMP_DIR}/*/schema_indexes.cypher" ]; then
    cat ${TEMP_DIR}/*/schema_indexes.cypher | docker exec -i knowledge-neo4j cypher-shell \
        -u ${NEO4J_USER} -p ${NEO4J_PASSWORD}
fi

if [ -f "${TEMP_DIR}/*/schema_constraints.cypher" ]; then
    cat ${TEMP_DIR}/*/schema_constraints.cypher | docker exec -i knowledge-neo4j cypher-shell \
        -u ${NEO4J_USER} -p ${NEO4J_PASSWORD}
fi

# Restore data
if [ -f "${TEMP_DIR}/*/data.cypher" ]; then
    cat ${TEMP_DIR}/*/data.cypher | docker exec -i knowledge-neo4j cypher-shell \
        -u ${NEO4J_USER} -p ${NEO4J_PASSWORD}
fi

# Cleanup
rm -rf ${TEMP_DIR}
```

### 5. Verify Recovery

```bash
# Check node count
docker exec knowledge-neo4j cypher-shell -u ${NEO4J_USER} -p ${NEO4J_PASSWORD} \
    "MATCH (n) RETURN count(n) as node_count"

# Check relationship count
docker exec knowledge-neo4j cypher-shell -u ${NEO4J_USER} -p ${NEO4J_PASSWORD} \
    "MATCH ()-[r]->() RETURN count(r) as rel_count"

# Check indexes
docker exec knowledge-neo4j cypher-shell -u ${NEO4J_USER} -p ${NEO4J_PASSWORD} \
    "SHOW INDEXES"
```

---

## MinIO Recovery

### 1. Locate Backup

```bash
# Find latest backup
ls -lht ${BACKUP_DIR}/minio/

BACKUP_FILE="${BACKUP_DIR}/minio/latest.tar.gz"  # If using compressed backups
# or
BACKUP_DIR_MINIO="${BACKUP_DIR}/minio/backup_YYYYMMDD_HHMMSS"  # If using mc mirror
```

### 2. Restore Objects

```bash
# Configure MinIO client
mc alias set local http://${MINIO_ENDPOINT} ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY}

# Method 1: Restore from compressed backup
TEMP_DIR="/tmp/minio_restore_$(date +%s)"
mkdir -p ${TEMP_DIR}
tar -xzf ${BACKUP_FILE} -C ${TEMP_DIR}

# Mirror back to MinIO
mc mirror ${TEMP_DIR}/documents local/documents

# Cleanup
rm -rf ${TEMP_DIR}

# Method 2: Restore from uncompressed mirror
mc mirror ${BACKUP_DIR_MINIO}/documents local/documents
```

### 3. Verify Recovery

```bash
# List buckets
mc ls local/

# Count objects in documents bucket
mc ls --recursive local/documents | wc -l

# Check bucket size
mc du local/documents
```

---

## Full System Recovery

Complete recovery of all databases in order:

### Recovery Script

Create `/scripts/recovery/full-recovery.sh`:

```bash
#!/bin/bash

set -euo pipefail

# Source environment
source .env.recovery

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/recovery_${TIMESTAMP}.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a ${LOG_FILE}
}

log "Starting full system recovery..."

# 1. Stop all services
log "Stopping all services..."
docker-compose stop

# 2. Recover PostgreSQL
log "Recovering PostgreSQL..."
# ... PostgreSQL recovery steps ...

# 3. Recover Qdrant
log "Recovering Qdrant..."
# ... Qdrant recovery steps ...

# 4. Recover Neo4j
log "Recovering Neo4j..."
# ... Neo4j recovery steps ...

# 5. Recover MinIO
log "Recovering MinIO..."
# ... MinIO recovery steps ...

# 6. Start services
log "Starting services..."
docker-compose up -d

# 7. Verify
log "Verifying recovery..."
# ... Verification steps ...

log "Full system recovery completed!"
```

---

## Verification Procedures

### Automated Verification Script

```bash
#!/bin/bash

# Verify all databases are healthy

# PostgreSQL
PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "SELECT COUNT(*) FROM users"

# Qdrant
curl -s ${QDRANT_URL}/collections/documents | jq '.result.points_count'

# Neo4j
docker exec knowledge-neo4j cypher-shell -u ${NEO4J_USER} -p ${NEO4J_PASSWORD} "MATCH (n) RETURN count(n)"

# MinIO
mc ls local/documents
```

### Manual Verification Checklist

- [ ] All databases are accessible
- [ ] Row/node/vector counts match backup metadata
- [ ] Sample queries return expected results
- [ ] Application can connect to all databases
- [ ] No error logs from database services
- [ ] Performance metrics are normal

---

## Troubleshooting

### PostgreSQL Issues

**Problem:** "Database already exists" error

```bash
# Solution: Drop database first
PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d postgres -c "DROP DATABASE knowledge_db;"
```

**Problem:** Permission denied errors

```bash
# Solution: Grant permissions
PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d postgres -c "ALTER DATABASE knowledge_db OWNER TO postgres;"
```

### Qdrant Issues

**Problem:** Snapshot not found

```bash
# Solution: List available snapshots
curl -s ${QDRANT_URL}/collections/documents/snapshots | jq
```

**Problem:** Collection recovery fails

```bash
# Solution: Delete and recreate collection
curl -X DELETE ${QDRANT_URL}/collections/documents
# Then restore from snapshot
```

### Neo4j Issues

**Problem:** "Unable to connect" error

```bash
# Solution: Check Neo4j status
docker logs knowledge-neo4j
# Wait for "Started" message
```

**Problem:** Cypher script errors

```bash
# Solution: Import data in batches
# Split large Cypher files into smaller chunks
```

### MinIO Issues

**Problem:** mc command not found

```bash
# Solution: Install MinIO client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
```

---

## Emergency Contacts

- **Database Administrator:** admin@example.com
- **DevOps Team:** devops@example.com
- **On-Call:** +1-555-0100

## Backup Storage Locations

- **Primary:** `/var/backups/knowledge-db/`
- **Secondary:** S3 bucket: `s3://knowledge-db-backups/`
- **Off-site:** Remote datacenter (if configured)

## Change Log

| Version | Date       | Author | Changes                           |
|---------|------------|--------|-----------------------------------|
| 1.0     | 2025-01-28 | System | Initial recovery procedures       |

---

**Document Status:** Active
**Review Frequency:** Quarterly
**Next Review:** 2025-04-28
