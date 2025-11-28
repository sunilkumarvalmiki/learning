```typescript
import { RedisClientType } from 'redis';
import { redisClient } from '../config/redis';
import { logCache, logError } from '../utils/structuredLogger';

export interface CacheOptions {
    ttl?: number; // Time to live in seconds
}

export class CacheService {
    private client: RedisClientType | null;
    private hits: number = 0;
    private misses: number = 0;

    constructor() {
        this.client = redisClient;
    }

    /**
     * Get a value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.client?.isReady) {
            logCache('warn', 'Redis client not available for get operation', { key });
            this.misses++;
            return null;
        }

        try {
            const value = await this.client.get(key);
            if (value) {
                this.hits++;
                return JSON.parse(value) as T;
            }
            this.misses++;
            return null;
        } catch (error) {
            logError('Cache get failed', error, { key });
            this.misses++;
            return null;
        }
    }

    /**
     * Set a value in cache
     */
    async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
        if (!this.client?.isReady) {
            logCache('warn', 'Redis client not available for set operation', { key });
            return false;
        }

        try {
            const serialized = JSON.stringify(value);
            if (options?.ttl) {
                await this.client.setEx(key, options.ttl, serialized);
            } else {
                await this.client.set(key, serialized);
            }
            return true;
        } catch (error) {
            logError('Cache set failed', error, { key });
            return false;
        }
    }

    /**
     * Delete a value from cache
     */
    async delete(key: string): Promise<boolean> {
        if (!this.client?.isReady) {
            logCache('warn', 'Redis client not available for delete operation', { key });
            return false;
        }

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logError('Cache delete failed', error, { key });
            return false;
        }
    }

    /**
     * Delete multiple keys matching a pattern
     */
    async deletePattern(pattern: string): Promise<number> {
        if (!this.client?.isReady) {
            logCache('warn', 'Redis client not available for deletePattern operation', { pattern });
            return 0;
        }

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
                return keys.length;
            }
            return 0;
        } catch (error) {
            logError('Cache delete pattern failed', error, { pattern });
            return 0;
        }
    }

    /**
     * Check if a key exists
     */
    async exists(key: string): Promise<boolean> {
        if (!this.client?.isReady) {
            logCache('warn', 'Redis client not available for exists operation', { key });
            return false;
        }

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            logError('Cache exists failed', error, { key });
            return false;
        }
    }

    /**
     * Get or set pattern (cache-aside)
     */
    async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        options?: CacheOptions
    ): Promise<T> {
        // Try to get from cache
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Fetch from source
        const value = await fetcher();

        // Store in cache
        await this.set(key, value, options);

        return value;
    }

    /**
     * Get cache statistics
     */
    getStats(): { hits: number; misses: number; hitRate: number } {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: Math.round(hitRate * 100) / 100,
        };
    }

    /**
     * Reset cache statistics
     */
    resetStats(): void {
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Flush all cache
     */
    async flush(): Promise<boolean> {
        if (!this.client?.isReady) {
            logCache('warn', 'Redis client not available for flush operation');
            return false;
        }

        try {
            await this.client.flushDb();
            return true;
        } catch (error) {
            logError('Cache flush failed', error);
            return false;
        }
    }
}

// Singleton instance
let cacheServiceInstance: CacheService | null = null;

export const getCacheService = (): CacheService => {
    if (!cacheServiceInstance) {
        cacheServiceInstance = new CacheService();
    }
    return cacheServiceInstance;
};
