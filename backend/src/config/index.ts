import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;

    // PostgreSQL
    postgres: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
    };

    // Redis
    redisUrl: string;

    // Qdrant
    qdrant: {
        url: string;
        apiKey?: string;
    };

    // Neo4j
    neo4j: {
        uri: string;
        username: string;
        password: string;
    };

    // MinIO
    minio: {
        endPoint: string;
        port: number;
        accessKey: string;
        secretKey: string;
        bucket: string;
        useSSL: boolean;
    };

    // Security
    jwt: {
        secret: string;
        expiresIn: string;
    };

    // File Upload
    upload: {
        maxFileSizeMB: number;
        allowedFileTypes: string[];
    };

    // Logging
    logLevel: string;

    // Hugging Face (optional - free tier works without key)
    huggingface?: {
        apiKey?: string;
    };
}

const config: Config = {
    port: parseInt(process.env.PORT || '8080', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    postgres: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        database: process.env.POSTGRES_DB || 'knowledge_db',
        username: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
    },

    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

    qdrant: {
        url: process.env.QDRANT_URL || 'http://localhost:6333',
        apiKey: process.env.QDRANT_API_KEY,
    },

    neo4j: {
        uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
        username: process.env.NEO4J_USER || 'neo4j',
        password: process.env.NEO4J_PASSWORD || 'password',
    },

    minio: {
        endPoint: process.env.MINIO_ENDPOINT || 'localhost',
        port: parseInt(process.env.MINIO_PORT || '9000', 10),
        accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
        bucket: process.env.MINIO_BUCKET || 'documents',
        useSSL: process.env.MINIO_USE_SSL === 'true',
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },

    upload: {
        maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10),
        allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,docx,txt,md,png,jpg,jpeg').split(','),
    },

    logLevel: process.env.LOG_LEVEL || 'info',

    huggingface: process.env.HF_TOKEN ? {
        apiKey: process.env.HF_TOKEN,
    } : undefined,
};

export default config;
