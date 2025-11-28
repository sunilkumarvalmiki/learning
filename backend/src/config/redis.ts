import { createClient, RedisClientType } from 'redis';
import config from './index';

let redisClient: RedisClientType | null = null;

export const initializeRedis = async (): Promise<RedisClientType> => {
    if (redisClient) {
        return redisClient;
    }

    redisClient = createClient({
        url: config.redisUrl || 'redis://localhost:6379',
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    console.error('Redis: Max reconnection attempts reached');
                    return new Error('Max reconnection attempts reached');
                }
                // Exponential backoff
                return Math.min(retries * 100, 3000);
            },
        },
    });

    redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
        console.log('✓ Redis connected successfully');
    });

    redisClient.on('ready', () => {
        console.log('✓ Redis is ready to accept commands');
    });

    redisClient.on('reconnecting', () => {
        console.log('Redis reconnecting...');
    });

    await redisClient.connect();

    return redisClient;
};

export const getRedisClient = (): RedisClientType | null => {
    return redisClient;
};

export const closeRedis = async (): Promise<void> => {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        console.log('✓ Redis connection closed');
    }
};
