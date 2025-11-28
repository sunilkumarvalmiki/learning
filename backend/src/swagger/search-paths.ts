/**
 * @swagger
 * /api/v1/search:
 *   get:
 *     tags:
 *       - Search
 *     summary: Full-text search
 *     description: Search documents using PostgreSQL full-text search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *         description: Search query
 *         example: machine learning
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SearchResult'
 *                 total:
 *                   type: integer
 *                   description: Total number of matching documents
 *                 query:
 *                   type: string
 *                   description: Original search query
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/search/semantic:
 *   get:
 *     tags:
 *       - Search
 *     summary: Semantic search
 *     description: Search documents using vector embeddings (Qdrant) for semantic similarity
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *         description: Search query
 *         example: artificial intelligence applications
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of results
 *       - in: query
 *         name: scoreThreshold
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           default: 0.7
 *         description: Minimum similarity score threshold (0-1)
 *     responses:
 *       200:
 *         description: Semantic search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/SearchResult'
 *                       - type: object
 *                         properties:
 *                           similarity:
 *                             type: number
 *                             description: Semantic similarity score
 *                 query:
 *                   type: string
 *                   description: Original search query
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/search/hybrid:
 *   get:
 *     tags:
 *       - Search
 *     summary: Hybrid search
 *     description: Search documents combining full-text and semantic search for best results
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *         description: Search query
 *         example: deep learning neural networks
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of results
 *       - in: query
 *         name: semanticWeight
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           default: 0.5
 *         description: Weight for semantic vs full-text (0=full-text only, 1=semantic only)
 *     responses:
 *       200:
 *         description: Hybrid search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/SearchResult'
 *                       - type: object
 *                         properties:
 *                           combinedScore:
 *                             type: number
 *                             description: Combined relevance score
 *                 query:
 *                   type: string
 *                   description: Original search query
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/search/suggestions:
 *   get:
 *     tags:
 *       - Search
 *     summary: Get search suggestions
 *     description: Get autocomplete suggestions based on query history and popular searches
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Query prefix
 *         example: mach
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Maximum number of suggestions
 *     responses:
 *       200:
 *         description: Search suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       query:
 *                         type: string
 *                         description: Suggested search query
 *                       count:
 *                         type: integer
 *                         description: Number of times this query was searched
 *                   example:
 *                     - query: "machine learning"
 *                       count: 45
 *                     - query: "machine vision"
 *                       count: 23
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

export {};
