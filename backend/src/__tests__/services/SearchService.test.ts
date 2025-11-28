import { SearchService } from '../../services/SearchService';
import { AppDataSource } from '../../config/database';
import { embeddingService } from '../../services/EmbeddingService';
import { getCacheService } from '../../services/CacheService';

// Mock dependencies
jest.mock('../../config/database', () => ({
    AppDataSource: {
        getRepository: jest.fn(),
        query: jest.fn(),
    },
}));

jest.mock('../../services/EmbeddingService', () => ({
    embeddingService: {
        searchSimilar: jest.fn(),
    },
}));

jest.mock('../../services/CacheService', () => ({
    getCacheService: jest.fn(),
}));

describe('SearchService', () => {
    let searchService: SearchService;
    let mockDocumentRepository: any;
    let mockQueryBuilder: any;
    let mockCache: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockQueryBuilder = {
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getCount: jest.fn(),
            getRawMany: jest.fn(),
            getMany: jest.fn(),
        };

        mockDocumentRepository = {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
        };

        mockCache = {
            get: jest.fn(),
            set: jest.fn(),
        };

        (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockDocumentRepository);
        (getCacheService as jest.Mock).mockReturnValue(mockCache);

        searchService = new SearchService();
    });

    describe('fullTextSearch', () => {
        it('should return search results from full-text search', async () => {
            const mockResults = [
                {
                    document_id: 'doc-1',
                    document_title: 'Test Document',
                    document_content: 'This is test content',
                    document_fileName: 'test.pdf',
                    document_fileType: 'pdf',
                    rank: '0.5',
                },
            ];

            mockCache.get.mockResolvedValue(null);
            mockQueryBuilder.getCount.mockResolvedValue(1);
            mockQueryBuilder.getRawMany.mockResolvedValue(mockResults);

            const result = await searchService.fullTextSearch('test');

            expect(result.results).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.results[0]).toMatchObject({
                id: 'doc-1',
                title: 'Test Document',
                score: 0.5,
            });
        });

        it('should return cached results if available', async () => {
            const cachedData = {
                results: [{ id: 'doc-1', title: 'Cached', score: 0.8 }],
                total: 1,
            };

            mockCache.get.mockResolvedValue(cachedData);

            const result = await searchService.fullTextSearch('test');

            expect(result).toEqual(cachedData);
            expect(mockQueryBuilder.getRawMany).not.toHaveBeenCalled();
        });

        it('should filter by userId when provided', async () => {
            mockCache.get.mockResolvedValue(null);
            mockQueryBuilder.getCount.mockResolvedValue(0);
            mockQueryBuilder.getRawMany.mockResolvedValue([]);

            await searchService.fullTextSearch('test', { userId: 'user-123' });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'document.userId = :userId',
                { userId: 'user-123' }
            );
        });

        it('should apply pagination', async () => {
            mockCache.get.mockResolvedValue(null);
            mockQueryBuilder.getCount.mockResolvedValue(0);
            mockQueryBuilder.getRawMany.mockResolvedValue([]);

            await searchService.fullTextSearch('test', { limit: 10, offset: 20 });

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        });

        it('should extract highlights from content', async () => {
            const mockResults = [
                {
                    document_id: 'doc-1',
                    document_title: 'Test',
                    document_content: 'This is a test document.\nIt contains test keywords.',
                    document_fileName: 'test.pdf',
                    document_fileType: 'pdf',
                    rank: '0.5',
                },
            ];

            mockCache.get.mockResolvedValue(null);
            mockQueryBuilder.getCount.mockResolvedValue(1);
            mockQueryBuilder.getRawMany.mockResolvedValue(mockResults);

            const result = await searchService.fullTextSearch('test');

            expect(result.results[0].highlights).toBeDefined();
            expect(result.results[0].highlights!.length).toBeGreaterThan(0);
        });

        it('should cache results after search', async () => {
            mockCache.get.mockResolvedValue(null);
            mockQueryBuilder.getCount.mockResolvedValue(0);
            mockQueryBuilder.getRawMany.mockResolvedValue([]);

            await searchService.fullTextSearch('test');

            expect(mockCache.set).toHaveBeenCalledWith(
                expect.stringContaining('search:fulltext:'),
                expect.objectContaining({ results: [], total: 0 }),
                { ttl: 300 }
            );
        });

        it('should use default limit of 20', async () => {
            mockCache.get.mockResolvedValue(null);
            mockQueryBuilder.getCount.mockResolvedValue(0);
            mockQueryBuilder.getRawMany.mockResolvedValue([]);

            await searchService.fullTextSearch('test');

            expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
        });
    });

    describe('semanticSearch', () => {
        it('should return semantic search results', async () => {
            const mockEmbeddingResults = [
                {
                    documentId: 'doc-1',
                    score: 0.9,
                    chunkContent: 'Test content',
                    title: 'Test Doc',
                },
            ];

            const mockDocuments = [
                {
                    id: 'doc-1',
                    title: 'Test Document',
                    content: 'Full content',
                    fileName: 'test.pdf',
                    fileType: 'pdf',
                },
            ];

            mockCache.get.mockResolvedValue(null);
            (embeddingService.searchSimilar as jest.Mock).mockResolvedValue(mockEmbeddingResults);
            mockQueryBuilder.getMany.mockResolvedValue(mockDocuments);

            const result = await searchService.semanticSearch('test query');

            expect(result.results).toHaveLength(1);
            expect(result.results[0]).toMatchObject({
                id: 'doc-1',
                title: 'Test Document',
                score: 0.9,
            });
        });

        it('should return cached results if available', async () => {
            const cachedData = {
                results: [{ id: 'doc-1', title: 'Cached', score: 0.9 }],
                total: 1,
            };

            mockCache.get.mockResolvedValue(cachedData);

            const result = await searchService.semanticSearch('test');

            expect(result).toEqual(cachedData);
            expect(embeddingService.searchSimilar).not.toHaveBeenCalled();
        });

        it('should deduplicate documents by highest score', async () => {
            const mockEmbeddingResults = [
                {
                    documentId: 'doc-1',
                    score: 0.8,
                    chunkContent: 'Chunk 1',
                    title: 'Test Doc',
                },
                {
                    documentId: 'doc-1',
                    score: 0.9,
                    chunkContent: 'Chunk 2',
                    title: 'Test Doc',
                },
            ];

            const mockDocuments = [
                {
                    id: 'doc-1',
                    title: 'Test Document',
                    content: 'Full content',
                },
            ];

            mockCache.get.mockResolvedValue(null);
            (embeddingService.searchSimilar as jest.Mock).mockResolvedValue(mockEmbeddingResults);
            mockQueryBuilder.getMany.mockResolvedValue(mockDocuments);

            const result = await searchService.semanticSearch('test');

            expect(result.results).toHaveLength(1);
            expect(result.results[0].score).toBe(0.9);
        });

        it('should return empty results if no embeddings found', async () => {
            mockCache.get.mockResolvedValue(null);
            (embeddingService.searchSimilar as jest.Mock).mockResolvedValue([]);

            const result = await searchService.semanticSearch('test');

            expect(result.results).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('should handle errors gracefully', async () => {
            mockCache.get.mockResolvedValue(null);
            (embeddingService.searchSimilar as jest.Mock).mockRejectedValue(
                new Error('Qdrant error')
            );

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await searchService.semanticSearch('test');

            expect(result.results).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('should sort results by score descending', async () => {
            const mockEmbeddingResults = [
                { documentId: 'doc-1', score: 0.7, chunkContent: 'C1', title: 'D1' },
                { documentId: 'doc-2', score: 0.9, chunkContent: 'C2', title: 'D2' },
                { documentId: 'doc-3', score: 0.8, chunkContent: 'C3', title: 'D3' },
            ];

            const mockDocuments = [
                { id: 'doc-1', title: 'Doc 1', content: '' },
                { id: 'doc-2', title: 'Doc 2', content: '' },
                { id: 'doc-3', title: 'Doc 3', content: '' },
            ];

            mockCache.get.mockResolvedValue(null);
            (embeddingService.searchSimilar as jest.Mock).mockResolvedValue(mockEmbeddingResults);
            mockQueryBuilder.getMany.mockResolvedValue(mockDocuments);

            const result = await searchService.semanticSearch('test');

            expect(result.results[0].id).toBe('doc-2');
            expect(result.results[1].id).toBe('doc-3');
            expect(result.results[2].id).toBe('doc-1');
        });
    });

    describe('hybridSearch', () => {
        it('should combine full-text and semantic search results', async () => {
            const fullTextData = {
                results: [{ id: 'doc-1', title: 'FT Doc', score: 1.0 }],
                total: 1,
            };

            const semanticData = {
                results: [{ id: 'doc-2', title: 'Sem Doc', score: 0.9 }],
                total: 1,
            };

            mockCache.get.mockResolvedValue(null);

            // Mock full-text search
            mockQueryBuilder.getCount.mockResolvedValue(1);
            mockQueryBuilder.getRawMany.mockResolvedValue([
                {
                    document_id: 'doc-1',
                    document_title: 'FT Doc',
                    document_content: '',
                    rank: '1.0',
                },
            ]);

            // Mock semantic search
            (embeddingService.searchSimilar as jest.Mock).mockResolvedValue([
                {
                    documentId: 'doc-2',
                    score: 0.9,
                    chunkContent: 'Test',
                    title: 'Sem Doc',
                },
            ]);

            mockQueryBuilder.getMany.mockResolvedValue([
                { id: 'doc-2', title: 'Sem Doc', content: '' },
            ]);

            const result = await searchService.hybridSearch('test');

            expect(result.results.length).toBeGreaterThan(0);
            expect(result.total).toBeGreaterThan(0);
        });

        it('should boost documents found in both searches', async () => {
            mockCache.get.mockResolvedValue(null);

            // Document found in both searches
            mockQueryBuilder.getCount.mockResolvedValue(1);
            mockQueryBuilder.getRawMany.mockResolvedValue([
                {
                    document_id: 'doc-1',
                    document_title: 'Doc 1',
                    document_content: '',
                    rank: '1.0',
                },
            ]);

            (embeddingService.searchSimilar as jest.Mock).mockResolvedValue([
                {
                    documentId: 'doc-1',
                    score: 0.8,
                    chunkContent: 'Test',
                    title: 'Doc 1',
                },
            ]);

            mockQueryBuilder.getMany.mockResolvedValue([
                { id: 'doc-1', title: 'Doc 1', content: '' },
            ]);

            const result = await searchService.hybridSearch('test');

            // Score should be boosted (0.6 * 1.0 + 0.4 * 0.8 = 0.92)
            expect(result.results[0].score).toBeGreaterThan(0.6);
        });
    });

    describe('getSearchSuggestions', () => {
        it('should return search suggestions', async () => {
            const mockSuggestions = [
                { query: 'test query' },
                { query: 'test document' },
            ];

            (AppDataSource.query as jest.Mock).mockResolvedValue(mockSuggestions);

            const result = await searchService.getSearchSuggestions('test');

            expect(result).toEqual(['test query', 'test document']);
        });

        it('should handle errors gracefully', async () => {
            (AppDataSource.query as jest.Mock).mockRejectedValue(new Error('DB error'));

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await searchService.getSearchSuggestions('test');

            expect(result).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('should apply limit to suggestions', async () => {
            (AppDataSource.query as jest.Mock).mockResolvedValue([]);

            await searchService.getSearchSuggestions('test', 3);

            expect(AppDataSource.query).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining(['%test%', 3])
            );
        });
    });

    describe('logSearch', () => {
        it('should log search query', async () => {
            (AppDataSource.query as jest.Mock).mockResolvedValue(undefined);

            await searchService.logSearch('user-123', 'test query', 'keyword', 5);

            expect(AppDataSource.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO search_history'),
                ['user-123', 'test query', 'keyword', 5]
            );
        });

        it('should support all query types', async () => {
            (AppDataSource.query as jest.Mock).mockResolvedValue(undefined);

            const queryTypes: Array<'keyword' | 'semantic' | 'hybrid'> = ['keyword', 'semantic', 'hybrid'];

            for (const type of queryTypes) {
                await searchService.logSearch('user-123', 'test', type, 0);

                expect(AppDataSource.query).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.arrayContaining([type])
                );
            }
        });
    });
});
