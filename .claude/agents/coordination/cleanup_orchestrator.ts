/**
 * Cleanup Orchestrator
 * 
 * Automated cleanup system that ensures no orphan files are left behind
 * after agent execution. Tracks all file creation and implements failsafe
 * mechanisms for data integrity.
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { Pool } from 'pg';

export interface FileRegistration {
    filepath: string;
    purpose: string;
    createdAt: Date;
    ttl?: number; // Time to live in milliseconds
    agentId: string;
    dataInDatabase: boolean;
}

export interface OrphanFile {
    filepath: string;
    size: number;
    modifiedAt: Date;
    reason: string;
}

export class CleanupOrchestrator {
    private createdFiles: Map<string, FileRegistration>;
    private database: Pool;
    private cleanupInterval?: NodeJS.Timeout;

    constructor(databaseUrl: string) {
        this.createdFiles = new Map();
        this.database = new Pool({
            connectionString: databaseUrl,
        });
        this.initializeDatabase();
    }

    private async initializeDatabase(): Promise<void> {
        await this.database.query(`
      CREATE TABLE IF NOT EXISTS file_registry (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filepath TEXT NOT NULL UNIQUE,
        purpose TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        ttl INTEGER,
        agent_id VARCHAR(100),
        data_in_database BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMP,
        CONSTRAINT valid_filepath CHECK (filepath != '')
      );

      CREATE INDEX IF NOT EXISTS idx_file_registry_agent ON file_registry(agent_id);
      CREATE INDEX IF NOT EXISTS idx_file_registry_deleted ON file_registry(deleted_at);
    `);
    }

    /**
     * Register file creation for tracking
     * Files registered here will be tracked and cleaned up automatically
     */
    async registerFile(
        filepath: string,
        purpose: string,
        agentId: string,
        ttl?: number
    ): Promise<void> {
        const registration: FileRegistration = {
            filepath,
            purpose,
            createdAt: new Date(),
            ttl,
            agentId,
            dataInDatabase: false,
        };

        this.createdFiles.set(filepath, registration);

        // Persist to database
        await this.database.query(`
      INSERT INTO file_registry (filepath, purpose, ttl, agent_id, data_in_database)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (filepath) DO UPDATE SET
        purpose = EXCLUDED.purpose,
        ttl = EXCLUDED.ttl,
        agent_id = EXCLUDED.agent_id
    `, [filepath, purpose, ttl, agentId, false]);

        // Schedule deletion if TTL provided
        if (ttl) {
            setTimeout(async () => {
                await this.deleteFile(filepath, 'TTL expired');
            }, ttl);
        }
    }

    /**
     * Mark that file data has been migrated to database
     * This allows safe deletion of the file
     */
    async markDataInDatabase(filepath: string): Promise<void> {
        const registration = this.createdFiles.get(filepath);
        if (registration) {
            registration.dataInDatabase = true;
            this.createdFiles.set(filepath, registration);
        }

        await this.database.query(`
      UPDATE file_registry 
      SET data_in_database = TRUE 
      WHERE filepath = $1
    `, [filepath]);
    }

    /**
     * Delete a tracked file
     */
    async deleteFile(filepath: string, reason: string): Promise<void> {
        try {
            await fs.unlink(filepath);
            console.log(`✓ Deleted file: ${filepath} (${reason})`);

            // Update registry
            await this.database.query(`
        UPDATE file_registry 
        SET deleted_at = NOW() 
        WHERE filepath = $1
      `, [filepath]);

            this.createdFiles.delete(filepath);
        } catch (error: any) {
            if (error.code !== 'ENOENT') { // Ignore if file doesn't exist
                console.error(`Failed to delete ${filepath}:`, error.message);
            }
        }
    }

    /**
     * Detect orphan files - files that exist but aren't tracked
     * in database or in-memory registry
     */
    async detectOrphanFiles(searchPath: string): Promise<OrphanFile[]> {
        const orphans: OrphanFile[] = [];

        try {
            const files = await this.getAllFiles(searchPath);

            for (const filepath of files) {
                const isTracked = await this.isFileTracked(filepath);

                if (!isTracked) {
                    const stats = await fs.stat(filepath);
                    orphans.push({
                        filepath,
                        size: stats.size,
                        modifiedAt: stats.mtime,
                        reason: 'Not tracked in registry',
                    });
                }
            }
        } catch (error) {
            console.error('Error detecting orphan files:', error);
        }

        return orphans;
    }

    private async getAllFiles(dirPath: string): Promise<string[]> {
        const files: string[] = [];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    // Skip certain directories
                    if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
                        continue;
                    }
                    const subFiles = await this.getAllFiles(fullPath);
                    files.push(...subFiles);
                } else if (entry.isFile()) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Ignore permission errors
        }

        return files;
    }

    private async isFileTracked(filepath: string): Promise<boolean> {
        // Check in-memory registry
        if (this.createdFiles.has(filepath)) {
            return true;
        }

        // Check database registry
        const result = await this.database.query(
            'SELECT 1 FROM file_registry WHERE filepath = $1 AND deleted_at IS NULL',
            [filepath]
        );

        return result.rows.length > 0;
    }

    /**
     * Cleanup after data migration
     * Deletes files whose data has been successfully migrated to database
     */
    async cleanupAfterMigration(agentId?: string): Promise<number> {
        let query = `
      SELECT filepath FROM file_registry 
      WHERE data_in_database = TRUE 
      AND deleted_at IS NULL
    `;
        const params: any[] = [];

        if (agentId) {
            query += ' AND agent_id = $1';
            params.push(agentId);
        }

        const result = await this.database.query(query, params);
        let deletedCount = 0;

        for (const row of result.rows) {
            await this.deleteFile(row.filepath, 'Data migrated to database');
            deletedCount++;
        }

        return deletedCount;
    }

    /**
     * Verify data integrity before deletion
     * Ensures file data exists in database before allowing deletion
     */
    async verifyDataInDatabase(filepath: string): Promise<boolean> {
        const registration = this.createdFiles.get(filepath);
        if (!registration) {
            return false;
        }

        // Query database to verify data exists
        // This is a placeholder - actual implementation depends on data structure
        const result = await this.database.query(`
      SELECT COUNT(*) as count FROM agent_execution_states 
      WHERE temporary_files && $1::TEXT[]
    `, [[filepath]]);

        return result.rows[0].count > 0;
    }

    /**
     * Start periodic cleanup job
     * Runs every specified interval to cleanup expired files
     */
    startPeriodicCleanup(intervalMs: number = 3600000): void { // Default: 1 hour
        this.cleanupInterval = setInterval(async () => {
            await this.runCleanupCycle();
        }, intervalMs);

        console.log(`✓ Periodic cleanup started (interval: ${intervalMs}ms)`);
    }

    /**
     * Stop periodic cleanup
     */
    stopPeriodicCleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
            console.log('✓ Periodic cleanup stopped');
        }
    }

    /**
     * Run a cleanup cycle
     */
    private async runCleanupCycle(): Promise<void> {
        console.log('\n🧹 Running cleanup cycle...');

        // Delete files with expired TTL
        const expiredFiles = await this.database.query(`
      SELECT filepath FROM file_registry 
      WHERE ttl IS NOT NULL 
      AND created_at + (ttl || ' milliseconds')::INTERVAL < NOW()
      AND deleted_at IS NULL
    `);

        for (const row of expiredFiles.rows) {
            await this.deleteFile(row.filepath, 'TTL expired');
        }

        // Delete files with data in database
        const migratedCount = await this.cleanupAfterMigration();

        console.log(`✓ Cleanup cycle complete (deleted ${migratedCount} migrated files)`);
    }

    /**
     * Generate cleanup report
     */
    async generateCleanupReport(): Promise<string> {
        const trackedFiles = await this.database.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted,
        COUNT(*) FILTER (WHERE data_in_database = TRUE) as migrated,
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as active
      FROM file_registry
    `);

        const stats = trackedFiles.rows[0];

        let report = `# Cleanup Orchestrator Report\n\n`;
        report += `**Generated**: ${new Date().toISOString()}\n\n`;
        report += `## File Registry Statistics\n\n`;
        report += `- **Total files tracked**: ${stats.total}\n`;
        report += `- **Active files**: ${stats.active}\n`;
        report += `- **Deleted files**: ${stats.deleted}\n`;
        report += `- **Migrated to database**: ${stats.migrated}\n\n`;

        // List active files
        const activeFiles = await this.database.query(`
      SELECT filepath, purpose, agent_id, created_at 
      FROM file_registry 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 20
    `);

        if (activeFiles.rows.length > 0) {
            report += `## Active Files (Latest 20)\n\n`;
            for (const file of activeFiles.rows) {
                report += `- \`${file.filepath}\`\n`;
                report += `  - Purpose: ${file.purpose}\n`;
                report += `  - Agent: ${file.agent_id}\n`;
                report += `  - Created: ${file.created_at}\n\n`;
            }
        }

        return report;
    }

    /**
     * Emergency cleanup - delete all orphan files
     * Use with caution!
     */
    async emergencyCleanup(searchPath: string, dryRun: boolean = true): Promise<OrphanFile[]> {
        console.log(`\n⚠️  Running emergency cleanup (dry-run: ${dryRun})...`);

        const orphans = await this.detectOrphanFiles(searchPath);

        if (orphans.length === 0) {
            console.log('✓ No orphan files detected');
            return [];
        }

        console.log(`Found ${orphans.length} orphan files:`);
        for (const orphan of orphans) {
            console.log(`  - ${orphan.filepath} (${orphan.size} bytes)`);

            if (!dryRun) {
                await this.deleteFile(orphan.filepath, orphan.reason);
            }
        }

        if (dryRun) {
            console.log('\n⚠️  This was a dry run. Use emergencyCleanup(path, false) to actually delete files.');
        }

        return orphans;
    }

    async close(): Promise<void> {
        this.stopPeriodicCleanup();
        await this.database.end();
    }
}
