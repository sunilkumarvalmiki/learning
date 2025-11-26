import { DataSource } from 'typeorm';
import config from './index';

// TypeORM DataSource for PostgreSQL
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: config.postgres.host,
    port: config.postgres.port,
    username: config.postgres.username,
    password: config.postgres.password,
    database: config.postgres.database,
    synchronize: false, // Don't auto-create schema, use migrations
    logging: config.nodeEnv === 'development',
    entities: ['src/models/**/*.ts'],
    migrations: ['../migrations/**/*.sql'],
    subscribers: [],
});

// Initialize PostgreSQL connection
export const initializeDatabase = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        console.log('✅ PostgreSQL connected successfully');
    } catch (error) {
        console.error('❌ Error connecting to PostgreSQL:', error);
        throw error;
    }
};
