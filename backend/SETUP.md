# Backend Setup Guide

## Quick Setup (Automated)

This runs all database initialization scripts in sequence:

```bash
# 1. Install dependencies
npm install

# 2. Start Docker services
docker-compose up -d

# 3. Wait for health checks (~30 seconds)
docker-compose ps

# 4. Run complete database setup
npm run setup
```

## Manual Setup (Step by Step)

If you prefer to initialize databases individually:

```bash
# PostgreSQL migrations
npm run migrate

# Qdrant collections
npm run init:qdrant

# Neo4j schema
npm run init:neo4j

# MinIO buckets
npm run init:minio
```

## Verification

After setup, verify all databases:

### PostgreSQL

```bash
psql -h localhost -U postgres -d knowledge_db -c "\dt"
```

Expected tables: users, documents, workspaces, tags, etc.

### Qdrant

```bash
curl http://localhost:6333/collections
```

Expected collections: `documents`, `notes`

### Neo4j

Open browser: <http://localhost:7474>
Login: neo4j/password

Run:

```cypher
SHOW CONSTRAINTS
```

### MinIO

Open console: <http://localhost:9001>
Login: minioadmin/minioadmin

Check for `documents` bucket.

## Troubleshooting

### Connection Refused Errors

Ensure Docker services are running:

```bash
docker-compose ps
```

All services should show "healthy" status.

### PostgreSQL Migration Errors

If migrations fail due to existing objects:

```bash
# Drop and recreate database
docker-compose down postgres
docker volume rm backend_postgres_data
docker-compose up -d postgres
npm run migrate
```

### Qdrant Collection Already Exists

This is safe to ignore. The script will skip existing collections.

### Neo4j Constraint Conflicts

This is safe to ignore. Existing constraints won't be recreated.

## Development Workflow

Once setup is complete:

```bash
# Start backend server
npm run dev

# In another terminal, verify
curl http://localhost:8080/health
```

Server should respond with health status.
