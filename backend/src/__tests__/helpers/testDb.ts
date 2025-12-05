import { DataSource } from 'typeorm';

// Optional pg-mem import - for in-memory database testing
let newDb: any;
let IMemoryDb: any;

try {
    const pgMem = require('pg-mem');
    newDb = pgMem.newDb;
    IMemoryDb = pgMem.IMemoryDb;
} catch {
    // pg-mem is optional - integration tests requiring it will be skipped
    newDb = null;
    IMemoryDb = null;
}

let db: typeof IMemoryDb;
let dataSource: DataSource | null = null;

export const initializeTestDb = async (): Promise<DataSource | null> => {
    if (!newDb) {
        console.warn('pg-mem is not installed. Skipping in-memory database initialization.');
        console.warn('Install with: npm install -D pg-mem');
        return null;
    }

    try {
        // Dynamic imports to avoid issues if models are not available
        const { User } = await import('../../models/User');
        const { Document } = await import('../../models/Document');
        const { Task } = await import('../../models/Task');
        const { Sprint } = await import('../../models/Sprint');
        const { Project } = await import('../../models/Project');
        const { Comment } = await import('../../models/Comment');
        const { Attachment } = await import('../../models/Attachment');

        db = newDb();

        // Register current entities
        db.public.registerFunction({
            implementation: () => 'test',
            name: 'current_database',
        });

        db.public.registerFunction({
            implementation: () => 'version',
            name: 'version',
        });

        // Create a TypeORM connection
        dataSource = await db.adapters.createTypeormDataSource({
            type: 'postgres',
            entities: [User, Document, Task, Sprint, Project, Comment, Attachment],
            synchronize: true, // Auto-create schema
        });

        if (dataSource) {
            await dataSource.initialize();
        }
        return dataSource;
    } catch (error) {
        console.warn('Failed to initialize test database:', error);
        return null;
    }
};

export const closeTestDb = async () => {
    if (dataSource) {
        await dataSource.destroy();
        dataSource = null;
    }
};

export const getDataSource = () => dataSource;

export const isTestDbAvailable = () => newDb !== null;
