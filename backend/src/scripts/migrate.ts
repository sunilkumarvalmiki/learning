import fs from 'fs/promises';
import path from 'path';
import { Pool } from 'pg';
import config from '../config';

const pool = new Pool({
    host: config.postgres.host,
    port: config.postgres.port,
    database: config.postgres.database,
    user: config.postgres.username,
    password: config.postgres.password,
});

async function runMigrations() {
    console.log('🔄 Starting database migrations...\n');

    const migrationsDir = path.join(__dirname, '../../../migrations');

    try {
        // Read migration files in order
        const migrations = [
            '001_initial_schema.sql',
            // '005_documents_simple.sql', // Skip if using full schema
            '004_seed_data.sql',
        ];

        for (const migrationFile of migrations) {
            const filePath = path.join(migrationsDir, migrationFile);

            try {
                console.log(`📄 Running migration: ${migrationFile}`);
                const sql = await fs.readFile(filePath, 'utf-8');

                // Execute migration
                await pool.query(sql);
                console.log(`✅ Completed: ${migrationFile}\n`);
            } catch (error: any) {
                // Check if error is because objects already exist
                if (error.code === '42P07' || error.code === '42710') {
                    console.log(`⚠️  Skipping ${migrationFile} (already exists)\n`);
                } else {
                    console.error(`❌ Error in ${migrationFile}:`, error.message);
                    throw error;
                }
            }
        }

        // Verify tables were created
        const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

        console.log('📊 Database tables:');
        result.rows.forEach((row: any) => {
            console.log(`   - ${row.table_name}`);
        });

        console.log('\n✅ All migrations completed successfully!');
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run migrations if called directly
if (require.main === module) {
    runMigrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default runMigrations;
