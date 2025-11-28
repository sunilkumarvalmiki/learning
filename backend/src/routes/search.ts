import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';
import { validate } from '../middleware/validation';
import { searchLimiter } from '../middleware/rateLimiter';
import {
    searchQuerySchema,
    semanticSearchQuerySchema,
    hybridSearchQuerySchema,
    suggestionsQuerySchema,
} from '../validation/schemas';

const router = Router();
const searchController = new SearchController();

// Apply rate limiting to all search endpoints
router.use(searchLimiter);

/**
 * GET /api/v1/search?q=query
 * Full-text search using PostgreSQL
 */
router.get(
    '/',
    validate(searchQuerySchema),
    searchController.fullText.bind(searchController)
);

/**
 * GET /api/v1/search/semantic?q=query
 * Semantic search using vector embeddings (Qdrant)
 */
router.get(
    '/semantic',
    validate(semanticSearchQuerySchema),
    searchController.semantic.bind(searchController)
);

/**
 * GET /api/v1/search/hybrid?q=query
 * Hybrid search combining full-text and semantic
 */
router.get(
    '/hybrid',
    validate(hybridSearchQuerySchema),
    searchController.hybrid.bind(searchController)
);

/**
 * GET /api/v1/search/suggestions?q=partial
 * Get search suggestions based on query history
 */
router.get(
    '/suggestions',
    validate(suggestionsQuerySchema),
    searchController.suggestions.bind(searchController)
);

export default router;
