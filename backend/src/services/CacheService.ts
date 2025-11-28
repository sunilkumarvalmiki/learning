import { RedisClientType } from 'redis';
import { getRedisClient } from '../config/redis';

export interface CacheOptions {
    ttl?: number; // Time to live in seconds
}

export class CacheService {
    private client: RedisClientType | null;
    private hits: number = 0;
    private misses: number = 0;

    constructor() {
        this.client = getRedisClient();
    }

    /**
     * Get a value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.client) {
            console.warn('Redis client not available');
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
            console.error(`Cache get error for key ${key}:`, error);
            this.misses++;
            return null;
        }
    }

    /**
     * Set a value in cache
     */
    async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
        if (!this.client) {
            console.warn('Redis client not available');
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
            console.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete a value from cache
     */
    async delete(key: string): Promise<boolean> {
        if (!this.client) {
            console.warn('Redis client not available');
            return false;
        }

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete multiple keys matching a pattern
     */
    async deletePattern(pattern: string): Promise<number> {
        if (!this.client) {
            console.warn('Redis client not available');
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
            console.error(`Cache delete pattern error for pattern ${pattern}:`, error);
            return 0;
        }
    }

    /**
     * Check if a key exists
     */
    async exists(key: string): Promise<boolean> {
        if (!this.client) {
            return false;
        }

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`Cache exists error for key ${key}:`, error);
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
        if (!this.client) {
            console.warn('Redis client not available');
            return false;
        }

        try {
            await this.client.flushDb();
            return true;
        } catch (error) {
            console.error('Cache flush error:', error);
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
