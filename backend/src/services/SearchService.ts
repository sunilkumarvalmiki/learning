import { AppDataSource } from '../config/database';
import { Document } from '../models/Document';
import { qdrantClient } from '../scripts/init-qdrant';

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

    /**
     * Full-text search using PostgreSQL's tsvector
     */
    async fullTextSearch(
        query: string,
        options: SearchOptions = {}
    ): Promise<{ results: SearchResult[]; total: number }> {
        const limit = options.limit || 20;
        const offset = options.offset || 0;

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

        return { results, total };
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

        // TODO: Generate embedding for query text
        // For now, return empty results as we haven't implemented embedding generation yet
        console.warn('Semantic search requires embedding generation - not yet implemented');

        // Placeholder: In production, this would:
        // 1. Generate embedding for query using same model as documents
        // 2. Search Qdrant for similar vectors
        // 3. Retrieve document metadata from PostgreSQL

        /*
        const queryEmbedding = await generateEmbedding(query); // TODO: Implement
        
        const searchResult = await qdrantClient.search('documents', {
          vector: queryEmbedding,
          limit,
          filter: options.userId ? {
            must: [{ key: 'user_id', match: { value: options.userId } }]
          } : undefined,
        });
    
        const documentIds = searchResult.map(r => r.id);
        const documents = await this.documentRepository.findByIds(documentIds);
        
        return {
          results: documents.map((doc, idx) => ({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            fileName: doc.fileName,
            fileType: doc.fileType,
            score: searchResult[idx].score,
          })),
          total: searchResult.length,
        };
        */

        return { results: [], total: 0 };
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
    async getSuggestions(partial: string, userId?: string): Promise<string[]> {
        // Query search history for suggestions
        const results = await AppDataSource.query(
            `
      SELECT DISTINCT query 
      FROM search_history 
      WHERE query ILIKE $1
      ${userId ? 'AND user_id = $2' : ''}
      ORDER BY created_at DESC 
      LIMIT 5
    `,
            userId ? [`%${partial}%`, userId] : [`%${partial}%`]
        );

        return results.map((r: any) => r.query);
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
