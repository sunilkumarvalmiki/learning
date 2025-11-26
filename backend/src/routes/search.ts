import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';

const router = Router();
const searchController = new SearchController();

/**
 * GET /api/v1/search?q=query
 * Full-text search using PostgreSQL
 */
router.get(
    '/',
    searchController.fullText.bind(searchController)
);

/**
 * GET /api/v1/search/semantic?q=query
 * Semantic search using vector embeddings (Qdrant)
 */
router.get(
    '/semantic',
    searchController.semantic.bind(searchController)
);

/**
 * GET /api/v1/search/hybrid?q=query
 * Hybrid search combining full-text and semantic
 */
router.get(
    '/hybrid',
    searchController.hybrid.bind(searchController)
);

/**
 * GET /api/v1/search/suggestions?q=partial
 * Get search suggestions based on query history
 */
router.get(
    '/suggestions',
    searchController.suggestions.bind(searchController)
);

export default router;
