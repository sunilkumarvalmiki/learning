import { DataSource } from 'typeorm';
import config from './index';

// TypeORM DataSource for PostgreSQL with optimized connection pooling
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: config.postgres.host,
    port: config.postgres.port,
    username: config.postgres.username,
    password: config.postgres.password,
    database: config.postgres.database,
    synchronize: false, // Don't auto-create schema, use migrations
    logging: config.nodeEnv === 'development' ? ['error', 'warn', 'migration'] : false,
    entities: [__dirname + '/../models/*.{js,ts}'],
    migrations: [],
    subscribers: [],

    // Connection Pool Configuration (optimized for production performance)
    extra: {
        // Connection pool size
        max: 20, // Maximum number of connections in pool (increased from default 10)
        min: 2,  // Minimum number of connections to maintain

        // Connection timeouts (in milliseconds)
        connectionTimeoutMillis: 5000,  // Max time to wait for connection
        idleTimeoutMillis: 30000,       // Close idle connections after 30s

        // Query timeout
        statement_timeout: 30000,       // Abort queries taking longer than 30s

        // Connection retry
        max_lifetime: 600000,           // Recycle connections after 10 minutes

        // Performance settings
        application_name: 'knowledge-management-api',

        // Enable prepared statements for better performance
        // Note: TypeORM handles this automatically
    },

    // Connection pool settings for TypeORM
    poolSize: 20,           // Same as max above
    connectTimeoutMS: 5000, // Connection timeout

    // Enable query result caching (uses in-memory cache)
    cache: {
        type: 'database',
        duration: 60000, // 60 seconds default cache duration
        tableName: 'query_result_cache',
    },

    // Enable automatic query result streaming for large datasets
    maxQueryExecutionTime: 1000, // Log slow queries (>1000ms) in development
});

// Connection pool monitoring
let connectionPoolMetrics = {
    activeConnections: 0,
    idleConnections: 0,
    waitingClients: 0,
    totalConnections: 0,
};

// Initialize PostgreSQL connection
export const initializeDatabase = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        console.log('✅ PostgreSQL connected successfully');
        console.log(`   📊 Connection pool: max=${AppDataSource.options.extra?.max || 10}, min=${AppDataSource.options.extra?.min || 2}`);

        // Set up connection pool monitoring
        if (AppDataSource.driver && 'master' in AppDataSource.driver) {
            const pool = (AppDataSource.driver as any).master;

            // Log pool stats periodically in development
            if (config.nodeEnv === 'development') {
                setInterval(() => {
                    if (pool && pool.totalCount !== undefined) {
                        connectionPoolMetrics = {
                            totalConnections: pool.totalCount || 0,
                            activeConnections: pool.totalCount - pool.idleCount || 0,
                            idleConnections: pool.idleCount || 0,
                            waitingClients: pool.waitingCount || 0,
                        };

                        // Only log if there are connections
                        if (connectionPoolMetrics.totalConnections > 0) {
                            console.log('🔌 Connection Pool Status:', connectionPoolMetrics);
                        }
                    }
                }, 60000); // Log every minute
            }
        }

        // Enable query logging for slow queries in production
        if (config.nodeEnv === 'production') {
            // Slow query logging is handled by PostgreSQL configuration
            console.log('   ⚡ Slow query logging enabled (>100ms queries logged)');
        }
    } catch (error) {
        console.error('❌ Error connecting to PostgreSQL:', error);
        throw error;
    }
};

// Get current connection pool metrics
export const getConnectionPoolMetrics = () => {
    return { ...connectionPoolMetrics };
};

// Health check function for database connection
export const checkDatabaseHealth = async (): Promise<{
    healthy: boolean;
    responseTime: number;
    poolStatus: typeof connectionPoolMetrics;
}> => {
    const startTime = Date.now();
    try {
        // Simple query to test connection
        await AppDataSource.query('SELECT 1');
        const responseTime = Date.now() - startTime;

        return {
            healthy: true,
            responseTime,
            poolStatus: getConnectionPoolMetrics(),
        };
    } catch (error) {
        return {
            healthy: false,
            responseTime: Date.now() - startTime,
            poolStatus: getConnectionPoolMetrics(),
        };
    }
};
