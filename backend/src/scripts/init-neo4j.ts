import neo4j, { Driver, Session } from 'neo4j-driver';
import config from '../config';
import fs from 'fs/promises';
import path from 'path';

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver {
    if (!driver) {
        driver = neo4j.driver(
            config.neo4j.uri,
            neo4j.auth.basic(config.neo4j.username, config.neo4j.password)
        );
    }
    return driver;
}

export async function closeNeo4jConnection(): Promise<void> {
    if (driver) {
        await driver.close();
        driver = null;
    }
}

export async function initializeNeo4j() {
    console.log('🔄 Initializing Neo4j schema...\n');

    const driver = getNeo4jDriver();
    const session: Session = driver.session();

    try {
        // Read Cypher migration file
        const schemaPath = path.join(__dirname, '../../../migrations/003_neo4j_schema.cypher');
        const cypherScript = await fs.readFile(schemaPath, 'utf-8');

        // Split by statements (separated by semicolons or empty lines)
        const statements = cypherScript
            .split('\n')
            .filter(line => !line.trim().startsWith('//') && line.trim().length > 0)
            .join('\n')
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('/*'));

        console.log(`📄 Executing ${statements.length} Cypher statements...\n`);

        let executed = 0;
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await session.run(statement);
                    executed++;
                } catch (error: any) {
                    // Ignore errors for already existing constraints/indexes
                    if (error.code === 'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists' ||
                        error.code === 'Neo.ClientError.Schema.ConstraintAlreadyExists') {
                        console.log(`⚠️  Skipping (already exists)`);
                    } else {
                        console.error(`❌ Error executing statement:`, error.message);
                        console.error(`Statement: ${statement.substring(0, 100)}...`);
                    }
                }
            }
        }

        console.log(`✅ Executed ${executed} statements\n`);

        // Verify constraints
        const result = await session.run('SHOW CONSTRAINTS');
        console.log('📊 Neo4j constraints:');
        result.records.forEach((record) => {
            const name = record.get('name');
            console.log(`   - ${name}`);
        });

        // Verify indexes
        const indexResult = await session.run('SHOW INDEXES');
        console.log('\n📊 Neo4j indexes:');
        indexResult.records.forEach((record) => {
            const name = record.get('name');
            console.log(`   - ${name}`);
        });

        console.log('\n✅ Neo4j initialization completed!');
    } catch (error) {
        console.error('\n❌ Neo4j initialization failed:', error);
        throw error;
    } finally {
        await session.close();
    }
}

// Run if called directly
if (require.main === module) {
    initializeNeo4j()
        .then(() => closeNeo4jConnection())
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
