import { AppDataSource } from '../config/database';
import { Document } from '../models/Document';
import { embeddingService } from './EmbeddingService';
import { getCacheService } from './CacheService';

export interface SearchResult {
    id: string;
    title: string;
    content?: string;
    fileName?: string;
    fileType?: string;
    score: number;
    highlights?: string[];
}

export interface SearchOptions {
    limit?: number;
    offset?: number;
    userId?: string;
}

export class SearchService {
    private documentRepository = AppDataSource.getRepository(Document);
    private cache = getCacheService();

    /**
     * Full-text search using PostgreSQL's tsvector
     */
    async fullTextSearch(
        query: string,
        options: SearchOptions = {}
    ): Promise<{ results: SearchResult[]; total: number }> {
        const limit = options.limit || 20;
        const offset = options.offset || 0;

        // Create cache key
        const cacheKey = `search:fulltext:${query}:${limit}:${offset}:${options.userId || 'all'}`;

        // Try to get from cache
        const cached = await this.cache.get<{ results: SearchResult[]; total: number }>(cacheKey);
        if (cached) {
            return cached;
        }

        // Use PostgreSQL full-text search with ts_rank
        const qb = this.documentRepository
            .createQueryBuilder('document')
            .select([
                'document.id',
                'document.title',
                'document.content',
                'document.fileName',
                'document.fileType',
            ])
            .where('document.deletedAt IS NULL')
            .andWhere(
                `to_tsvector('english', document.title || ' ' || COALESCE(document.content, '')) @@ plainto_tsquery('english', :query)`,
                { query }
            );

        if (options.userId) {
            qb.andWhere('document.userId = :userId', { userId: options.userId });
        }

        // Add ranking
        qb.addSelect(
            `ts_rank(to_tsvector('english', document.title || ' ' || COALESCE(document.content, '')), plainto_tsquery('english', :query))`,
            'rank'
        );

        qb.orderBy('rank', 'DESC');

        // Get total count
        const total = await qb.getCount();

        // Get paginated results
        const documents = await qb.skip(offset).take(limit).getRawMany();

        const results: SearchResult[] = documents.map((doc) => ({
            id: doc.document_id,
            title: doc.document_title,
            content: doc.document_content,
            fileName: doc.document_fileName,
            fileType: doc.document_fileType,
            score: parseFloat(doc.rank || '0'),
            highlights: this.extractHighlights(doc.document_content, query),
        }));

        const result = { results, total };

        // Cache for 5 minutes (300 seconds)
        await this.cache.set(cacheKey, result, { ttl: 300 });

        return result;
    }

    /**
     * Semantic search using Qdrant vector similarity
     * Note: Requires documents to have embeddings
     */
    async semanticSearch(
        query: string,
        options: SearchOptions = {}
    ): Promise<{ results: SearchResult[]; total: number }> {
        const limit = options.limit || 20;

        // Create cache key
        const cacheKey = `search:semantic:${query}:${limit}:${options.userId || 'all'}`;

        // Try to get from cache
        const cached = await this.cache.get<{ results: SearchResult[]; total: number }>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // Use embedding service to search for similar documents
            const similarResults = await embeddingService.searchSimilar(
                query,
                options.userId,
                limit * 2 // Get more results to deduplicate by document
            );

            if (similarResults.length === 0) {
                return { results: [], total: 0 };
            }

            // Deduplicate by document ID and get highest scoring chunk per document
            const documentScores = new Map<string, { score: number; chunkContent: string; title?: string }>();

            for (const result of similarResults) {
                const existing = documentScores.get(result.documentId);
                if (!existing || result.score > existing.score) {
                    documentScores.set(result.documentId, {
                        score: result.score,
                        chunkContent: result.chunkContent,
                        title: result.title,
                    });
                }
            }

            // Get document metadata from PostgreSQL
            const documentIds = Array.from(documentScores.keys());
            const documents = await this.documentRepository
                .createQueryBuilder('document')
                .where('document.id IN (:...ids)', { ids: documentIds })
                .andWhere('document.deletedAt IS NULL')
                .getMany();

            // Map documents with scores
            const results: SearchResult[] = documents
                .map((doc) => {
                    const scoreData = documentScores.get(doc.id);
                    return {
                        id: doc.id,
                        title: doc.title || 'Untitled',
                        content: doc.content,
                        fileName: doc.fileName,
                        fileType: doc.fileType,
                        score: scoreData?.score || 0,
                        highlights: scoreData?.chunkContent ? [scoreData.chunkContent.slice(0, 200)] : [],
                    };
                })
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

            const result = { results, total: documentScores.size };

            // Cache for 5 minutes (300 seconds)
            await this.cache.set(cacheKey, result, { ttl: 300 });

            return result;
        } catch (error) {
            console.error('Semantic search error:', error);
            // Fall back to empty results on error
            return { results: [], total: 0 };
        }
    }

    /**
     * Hybrid search combining full-text and semantic search
     */
    async hybridSearch(
        query: string,
        options: SearchOptions = {}
    ): Promise<{ results: SearchResult[]; total: number }> {
        // Get results from both search methods
        const [fullTextResults, semanticResults] = await Promise.all([
            this.fullTextSearch(query, { ...options, limit: 50 }),
            this.semanticSearch(query, { ...options, limit: 50 }),
        ]);

        // Merge and re-rank results
        // Simple approach: combine and sort by score
        const mergedResults = new Map<string, SearchResult>();

        // Add full-text results with weight
        fullTextResults.results.forEach((result) => {
            mergedResults.set(result.id, {
                ...result,
                score: result.score * 0.6, // 60% weight for full-text
            });
        });

        // Add/merge semantic results with weight
        semanticResults.results.forEach((result) => {
            const existing = mergedResults.get(result.id);
            if (existing) {
                // Boost score if found in both
                existing.score += result.score * 0.4; // 40% weight for semantic
            } else {
                mergedResults.set(result.id, {
                    ...result,
                    score: result.score * 0.4,
                });
            }
        });

        // Sort by combined score
        const results = Array.from(mergedResults.values())
            .sort((a, b) => b.score - a.score)
            .slice(options.offset || 0, (options.offset || 0) + (options.limit || 20));

        return {
            results,
            total: mergedResults.size,
        };
    }

    /**
     * Extract text snippets around search terms
     */
    private extractHighlights(text: string | null, query: string, maxSnippets = 3): string[] {
        if (!text) return [];

        const words = query.toLowerCase().split(' ');
        const highlights: string[] = [];
        const lines = text.split('\n');

        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            if (words.some((word) => lowerLine.includes(word))) {
                // Extract snippet around the match
                const snippet = line.length > 150 ? line.substring(0, 150) + '...' : line;
                highlights.push(snippet);

                if (highlights.length >= maxSnippets) break;
            }
        }

        return highlights;
    }

    /**
     * Search suggestions based on recent searches or popular terms
     */
    async getSearchSuggestions(partialQuery: string, limit: number = 5): Promise<string[]> {
        try {
            // Assuming 'this.pool' is available, e.g., from a database connection pool
            // If not, you might need to use AppDataSource.query or inject a pool.
            // For this example, I'll assume AppDataSource.query can be used directly.
            const result = await AppDataSource.query(
                `
        SELECT query, COUNT(*) as count
        FROM search_history
        WHERE query ILIKE $1
        GROUP BY query
        ORDER BY count DESC, query
        LIMIT $2
      `,
                [`%${partialQuery}%`, limit]
            );

            return result.map((row: any) => row.query);
        } catch (error) {
            console.error('Error getting search suggestions:', error);
            return [];
        }
    }

    /**
     * Log search query for analytics
     */
    async logSearch(
        userId: string,
        query: string,
        queryType: 'keyword' | 'semantic' | 'hybrid',
        resultsCount: number
    ): Promise<void> {
        await AppDataSource.query(
            `INSERT INTO search_history (user_id, query, query_type, results_count) 
       VALUES ($1, $2, $3, $4)`,
            [userId, query, queryType, resultsCount]
        );
    }
}
