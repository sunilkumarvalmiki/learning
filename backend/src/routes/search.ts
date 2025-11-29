import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';
import { validate } from '../middleware/validation';
import { searchLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';
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
 * @swagger
 * tags:
 *   name: Search
 *   description: Search functionality
 */

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Full-text search
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/',
    authenticate,
    validate(searchQuerySchema),
    searchController.fullText.bind(searchController)
);

/**
 * @swagger
 * /search/semantic:
 *   get:
 *     summary: Semantic search
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/semantic',
    authenticate,
    validate(semanticSearchQuerySchema),
    searchController.semantic.bind(searchController)
);

/**
 * @swagger
 * /search/hybrid:
 *   get:
 *     summary: Hybrid search
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/hybrid',
    authenticate,
    validate(hybridSearchQuerySchema),
    searchController.hybrid.bind(searchController)
);

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of suggestions
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/suggestions',
    authenticate,
    validate(suggestionsQuerySchema),
    searchController.suggestions.bind(searchController)
);

export default router;
