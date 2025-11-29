import { newDb, IMemoryDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { User } from '../../models/User';
import { Document } from '../../models/Document';
import { Task } from '../../models/Task';
import { Sprint } from '../../models/Sprint';
import { Project } from '../../models/Project';
import { Comment } from '../../models/Comment';
import { Attachment } from '../../models/Attachment';

let db: IMemoryDb;
let dataSource: DataSource;

export const initializeTestDb = async () => {
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

    await dataSource.initialize();
    return dataSource;
};

export const closeTestDb = async () => {
    if (dataSource) {
        await dataSource.destroy();
    }
};

export const getDataSource = () => dataSource;
