import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/SearchService';

const searchService = new SearchService();

export class SearchController {
    /**
     * Full-text search endpoint
     * GET /api/v1/search?q=query&limit=20&offset=0
     */
    async fullText(req: Request, res: Response, next: NextFunction) {
        try {
            const { q, limit, offset, userId } = req.query;

            if (!q || typeof q !== 'string') {
                return res.status(400).json({
                    error: 'Missing query parameter',
                    message: 'Please provide a search query using ?q=your_search_term',
                });
            }

            const results = await searchService.fullTextSearch(q, {
                limit: limit ? parseInt(limit as string) : 20,
                offset: offset ? parseInt(offset as string) : 0,
                userId: userId as string,
            });

            // Log search
            if (userId) {
                await searchService.logSearch(
                    userId as string,
                    q,
                    'keyword',
                    results.total
                );
            }

            res.json({
                query: q,
                type: 'full-text',
                results: results.results,
                total: results.total,
                took_ms: 0, // TODO: Add timing
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Semantic search endpoint
     * GET /api/v1/search/semantic?q=query
     */
    async semantic(req: Request, res: Response, next: NextFunction) {
        try {
            const { q, limit, offset, userId } = req.query;

            if (!q || typeof q !== 'string') {
                return res.status(400).json({
                    error: 'Missing query parameter',
                    message: 'Please provide a search query using ?q=your_search_term',
                });
            }

            const results = await searchService.semanticSearch(q, {
                limit: limit ? parseInt(limit as string) : 20,
                offset: offset ? parseInt(offset as string) : 0,
                userId: userId as string,
            });

            // Log search
            if (userId) {
                await searchService.logSearch(
                    userId as string,
                    q,
                    'semantic',
                    results.total
                );
            }

            res.json({
                query: q,
                type: 'semantic',
                results: results.results,
                total: results.total,
                note: results.total === 0 ? 'Semantic search requires document embeddings to be generated first' : undefined,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Hybrid search endpoint
     * GET /api/v1/search/hybrid?q=query
     */
    async hybrid(req: Request, res: Response, next: NextFunction) {
        try {
            const { q, limit, offset, userId } = req.query;

            if (!q || typeof q !== 'string') {
                return res.status(400).json({
                    error: 'Missing query parameter',
                    message: 'Please provide a search query using ?q=your_search_term',
                });
            }

            const results = await searchService.hybridSearch(q, {
                limit: limit ? parseInt(limit as string) : 20,
                offset: offset ? parseInt(offset as string) : 0,
                userId: userId as string,
            });

            // Log search
            if (userId) {
                await searchService.logSearch(
                    userId as string,
                    q,
                    'hybrid',
                    results.total
                );
            }

            res.json({
                query: q,
                type: 'hybrid',
                results: results.results,
                total: results.total,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get search suggestions
     * GET /api/v1/search/suggestions?q=partial
     */
    async suggestions(req: Request, res: Response, next: NextFunction) {
        try {
            const { q, userId } = req.query;

            if (!q || typeof q !== 'string') {
                return res.status(400).json({
                    error: 'Missing query parameter',
                    message: 'Please provide a partial query using ?q=partial_term',
                });
            }

            const suggestions = await searchService.getSuggestions(q, userId as string);

            res.json({
                suggestions,
            });
        } catch (error) {
            next(error);
        }
    }
}
