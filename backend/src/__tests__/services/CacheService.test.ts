import { CacheService, getCacheService } from '../../services/CacheService';

// Mock the redis config
jest.mock('../../config/redis', () => ({
    getRedisClient: jest.fn(),
}));

import { getRedisClient } from '../../config/redis';

describe('CacheService', () => {
    let cacheService: CacheService;
    let mockRedisClient: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock Redis client
        mockRedisClient = {
            get: jest.fn(),
            set: jest.fn(),
            setEx: jest.fn(),
            del: jest.fn(),
            keys: jest.fn(),
            exists: jest.fn(),
            flushDb: jest.fn(),
        };

        (getRedisClient as jest.Mock).mockReturnValue(mockRedisClient);
        cacheService = new CacheService();
    });

    describe('get', () => {
        it('should return parsed JSON value when key exists', async () => {
            const testData = { id: 1, name: 'test' };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

            const result = await cacheService.get('test-key');

            expect(result).toEqual(testData);
            expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
        });

        it('should return null when key does not exist', async () => {
            mockRedisClient.get.mockResolvedValue(null);

            const result = await cacheService.get('non-existent-key');

            expect(result).toBeNull();
        });

        it('should return null when redis client is not available', async () => {
            (getRedisClient as jest.Mock).mockReturnValue(null);
            const service = new CacheService();

            const result = await service.get('test-key');

            expect(result).toBeNull();
        });

        it('should handle errors gracefully', async () => {
            mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

            const result = await cacheService.get('test-key');

            expect(result).toBeNull();
        });

        it('should track cache hits', async () => {
            mockRedisClient.get.mockResolvedValue(JSON.stringify({ data: 'test' }));

            await cacheService.get('key1');
            await cacheService.get('key2');

            const stats = cacheService.getStats();
            expect(stats.hits).toBe(2);
        });

        it('should track cache misses', async () => {
            mockRedisClient.get.mockResolvedValue(null);

            await cacheService.get('key1');
            await cacheService.get('key2');

            const stats = cacheService.getStats();
            expect(stats.misses).toBe(2);
        });
    });

    describe('set', () => {
        it('should set value in cache', async () => {
            mockRedisClient.set.mockResolvedValue('OK');
            const testData = { id: 1, name: 'test' };

            const result = await cacheService.set('test-key', testData);

            expect(result).toBe(true);
            expect(mockRedisClient.set).toHaveBeenCalledWith(
                'test-key',
                JSON.stringify(testData)
            );
        });

        it('should set value with TTL', async () => {
            mockRedisClient.setEx.mockResolvedValue('OK');
            const testData = { id: 1 };

            const result = await cacheService.set('test-key', testData, { ttl: 3600 });

            expect(result).toBe(true);
            expect(mockRedisClient.setEx).toHaveBeenCalledWith(
                'test-key',
                3600,
                JSON.stringify(testData)
            );
        });

        it('should return false when redis client is not available', async () => {
            (getRedisClient as jest.Mock).mockReturnValue(null);
            const service = new CacheService();

            const result = await service.set('test-key', { data: 'test' });

            expect(result).toBe(false);
        });

        it('should handle errors gracefully', async () => {
            mockRedisClient.set.mockRejectedValue(new Error('Redis error'));

            const result = await cacheService.set('test-key', { data: 'test' });

            expect(result).toBe(false);
        });
    });

    describe('delete', () => {
        it('should delete key from cache', async () => {
            mockRedisClient.del.mockResolvedValue(1);

            const result = await cacheService.delete('test-key');

            expect(result).toBe(true);
            expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
        });

        it('should return false when redis client is not available', async () => {
            (getRedisClient as jest.Mock).mockReturnValue(null);
            const service = new CacheService();

            const result = await service.delete('test-key');

            expect(result).toBe(false);
        });

        it('should handle errors gracefully', async () => {
            mockRedisClient.del.mockRejectedValue(new Error('Redis error'));

            const result = await cacheService.delete('test-key');

            expect(result).toBe(false);
        });
    });

    describe('deletePattern', () => {
        it('should delete all keys matching pattern', async () => {
            mockRedisClient.keys.mockResolvedValue(['key:1', 'key:2', 'key:3']);
            mockRedisClient.del.mockResolvedValue(3);

            const result = await cacheService.deletePattern('key:*');

            expect(result).toBe(3);
            expect(mockRedisClient.keys).toHaveBeenCalledWith('key:*');
            expect(mockRedisClient.del).toHaveBeenCalledWith(['key:1', 'key:2', 'key:3']);
        });

        it('should return 0 when no keys match', async () => {
            mockRedisClient.keys.mockResolvedValue([]);

            const result = await cacheService.deletePattern('nonexistent:*');

            expect(result).toBe(0);
        });

        it('should return 0 when redis client is not available', async () => {
            (getRedisClient as jest.Mock).mockReturnValue(null);
            const service = new CacheService();

            const result = await service.deletePattern('key:*');

            expect(result).toBe(0);
        });

        it('should handle errors gracefully', async () => {
            mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));

            const result = await cacheService.deletePattern('key:*');

            expect(result).toBe(0);
        });
    });

    describe('exists', () => {
        it('should return true when key exists', async () => {
            mockRedisClient.exists.mockResolvedValue(1);

            const result = await cacheService.exists('test-key');

            expect(result).toBe(true);
        });

        it('should return false when key does not exist', async () => {
            mockRedisClient.exists.mockResolvedValue(0);

            const result = await cacheService.exists('test-key');

            expect(result).toBe(false);
        });

        it('should return false when redis client is not available', async () => {
            (getRedisClient as jest.Mock).mockReturnValue(null);
            const service = new CacheService();

            const result = await service.exists('test-key');

            expect(result).toBe(false);
        });

        it('should handle errors gracefully', async () => {
            mockRedisClient.exists.mockRejectedValue(new Error('Redis error'));

            const result = await cacheService.exists('test-key');

            expect(result).toBe(false);
        });
    });

    describe('getOrSet', () => {
        it('should return cached value when it exists', async () => {
            const cachedData = { id: 1, name: 'cached' };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));

            const fetcher = jest.fn().mockResolvedValue({ id: 2, name: 'fetched' });
            const result = await cacheService.getOrSet('test-key', fetcher);

            expect(result).toEqual(cachedData);
            expect(fetcher).not.toHaveBeenCalled();
        });

        it('should fetch and cache value when not in cache', async () => {
            mockRedisClient.get.mockResolvedValue(null);
            mockRedisClient.set.mockResolvedValue('OK');

            const fetchedData = { id: 1, name: 'fetched' };
            const fetcher = jest.fn().mockResolvedValue(fetchedData);

            const result = await cacheService.getOrSet('test-key', fetcher);

            expect(result).toEqual(fetchedData);
            expect(fetcher).toHaveBeenCalled();
            expect(mockRedisClient.set).toHaveBeenCalledWith(
                'test-key',
                JSON.stringify(fetchedData)
            );
        });

        it('should use TTL option when caching', async () => {
            mockRedisClient.get.mockResolvedValue(null);
            mockRedisClient.setEx.mockResolvedValue('OK');

            const fetcher = jest.fn().mockResolvedValue({ data: 'test' });
            await cacheService.getOrSet('test-key', fetcher, { ttl: 3600 });

            expect(mockRedisClient.setEx).toHaveBeenCalledWith(
                'test-key',
                3600,
                expect.any(String)
            );
        });
    });

    describe('getStats', () => {
        it('should return correct hit/miss statistics', async () => {
            // Simulate hits
            mockRedisClient.get.mockResolvedValue(JSON.stringify({ data: 'test' }));
            await cacheService.get('key1');
            await cacheService.get('key2');

            // Simulate misses
            mockRedisClient.get.mockResolvedValue(null);
            await cacheService.get('key3');

            const stats = cacheService.getStats();

            expect(stats.hits).toBe(2);
            expect(stats.misses).toBe(1);
            expect(stats.hitRate).toBeCloseTo(66.67, 1);
        });

        it('should return 0 hit rate when no operations', () => {
            const stats = cacheService.getStats();

            expect(stats.hitRate).toBe(0);
        });
    });

    describe('resetStats', () => {
        it('should reset hit/miss counters', async () => {
            mockRedisClient.get.mockResolvedValue(JSON.stringify({ data: 'test' }));
            await cacheService.get('key1');
            await cacheService.get('key2');

            cacheService.resetStats();

            const stats = cacheService.getStats();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
        });
    });

    describe('flush', () => {
        it('should flush all cache', async () => {
            mockRedisClient.flushDb.mockResolvedValue('OK');

            const result = await cacheService.flush();

            expect(result).toBe(true);
            expect(mockRedisClient.flushDb).toHaveBeenCalled();
        });

        it('should return false when redis client is not available', async () => {
            (getRedisClient as jest.Mock).mockReturnValue(null);
            const service = new CacheService();

            const result = await service.flush();

            expect(result).toBe(false);
        });

        it('should handle errors gracefully', async () => {
            mockRedisClient.flushDb.mockRejectedValue(new Error('Redis error'));

            const result = await cacheService.flush();

            expect(result).toBe(false);
        });
    });
});
