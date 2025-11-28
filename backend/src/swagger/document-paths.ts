/**
 * @swagger
 * /api/v1/documents/upload:
 *   post:
 *     tags:
 *       - Documents
 *     summary: Upload a new document
 *     description: Upload a document file for processing (PDF, DOCX, TXT, MD supported)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Document uploaded successfully
 *                 document:
 *                   $ref: '#/components/schemas/Document'
 *       400:
 *         description: Validation error (file missing or invalid type)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/documents:
 *   get:
 *     tags:
 *       - Documents
 *     summary: List documents with pagination and filters
 *     description: Retrieve a paginated list of documents with optional filtering
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [uploading, processing, completed, failed]
 *         description: Filter by processing status
 *       - in: query
 *         name: fileType
 *         schema:
 *           type: string
 *           enum: [pdf, docx, txt, md, image, video, audio, other]
 *         description: Filter by file type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 500
 *         description: Search in document titles and content
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 documents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Document'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of documents
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                     limit:
 *                       type: integer
 *                       description: Items per page
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   get:
 *     tags:
 *       - Documents
 *     summary: Get a single document by ID
 *     description: Retrieve detailed information about a specific document
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document UUID
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 document:
 *                   $ref: '#/components/schemas/Document'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   patch:
 *     tags:
 *       - Documents
 *     summary: Update document metadata
 *     description: Update document title, tags, or metadata
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 example: Updated Document Title
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 50
 *                 example: ["machine-learning", "ai", "research"]
 *               metadata:
 *                 type: object
 *                 description: Custom metadata object
 *                 example: { "author": "John Doe", "department": "Engineering" }
 *     responses:
 *       200:
 *         description: Document updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Document updated successfully
 *                 document:
 *                   $ref: '#/components/schemas/Document'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   delete:
 *     tags:
 *       - Documents
 *     summary: Delete a document
 *     description: Soft delete a document (marks as deleted but keeps in database)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document UUID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Document deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/documents/queue/status:
 *   get:
 *     tags:
 *       - Documents
 *     summary: Get processing queue status
 *     description: Retrieve current status of the document processing queue
 *     responses:
 *       200:
 *         description: Queue status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pending:
 *                   type: integer
 *                   description: Number of pending documents
 *                 processing:
 *                   type: integer
 *                   description: Number of documents being processed
 *                 completed:
 *                   type: integer
 *                   description: Number of completed documents
 *                 failed:
 *                   type: integer
 *                   description: Number of failed documents
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

export {};
