#!/usr/bin/env tsx

import runMigrations from './migrate';
import { initializeQdrant } from './init-qdrant';
import { initializeNeo4j, closeNeo4jConnection } from './init-neo4j';
import { initializeMinIO } from './init-minio';

async function setupAllDatabases() {
    console.log(`
╔═══════════════════════════════════════════╗
║     Database Initialization Script        ║
╚═══════════════════════════════════════════╝
`);

    try {
        // 1. PostgreSQL Migrations
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1️⃣  PostgreSQL Migrations');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        await runMigrations();

        // 2. Qdrant Collections
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('2️⃣  Qdrant Vector Database');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        await initializeQdrant();

        // 3. Neo4j Schema
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('3️⃣  Neo4j Graph Database');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        await initializeNeo4j();

        // 4. MinIO Storage
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('4️⃣  MinIO Object Storage');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        await initializeMinIO();

        console.log(`
╔═══════════════════════════════════════════╗
║   ✅ All Databases Initialized!           ║
╚═══════════════════════════════════════════╝

Ready to start the backend server:
  npm run dev
`);
    } catch (error) {
        console.error('\n❌ Database setup failed:', error);
        process.exit(1);
    } finally {
        await closeNeo4jConnection();
    }
}

setupAllDatabases();
