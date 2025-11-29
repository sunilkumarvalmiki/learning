import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { uploadSingle, handleUploadError } from '../middleware/upload';
import { validate, documentListQuerySchema } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { documentProcessingQueue } from '../services/DocumentProcessingQueue';
import { uploadLimiter, standardLimiter } from '../middleware/rateLimiter';
import {
    documentListQuerySchema as newDocumentListQuerySchema,
    documentIdParamSchema,
    documentUpdateSchema,
} from '../validation/schemas';

const router = Router();
const documentController = new DocumentController();

// Require authentication for all document operations
router.use(authenticate);

// Apply standard rate limiting to all document endpoints
router.use(standardLimiter);

/**
 * GET /api/v1/documents/queue/status
 * Get processing queue status
 */
router.get('/queue/status', (_req, res) => {
    res.json(documentProcessingQueue.getStatus());
});

/**
 * POST /api/v1/documents/upload
 * Upload a new document
 */
/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Document management
 */

/**
 * @swagger
 * /documents/upload:
 *   post:
 *     summary: Upload a new document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid file or upload error
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/upload',
    authenticate,
    uploadLimiter,
    uploadSingle,
    handleUploadError,
    documentController.upload.bind(documentController)
);

/**
 * GET /api/v1/documents
 * List documents with pagination and filters
 */
/**
 * @swagger
 * /documents:
 *   get:
 *     summary: List documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of documents
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/',
    authenticate,
    standardLimiter,
    validate(newDocumentListQuerySchema),
    documentController.list.bind(documentController)
);

/**
 * GET /api/v1/documents/:id
 * Get a single document by ID
 */
/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     summary: Get a document by ID
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document details
 *       404:
 *         description: Document not found
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/:id',
    authenticate,
    standardLimiter,
    validate(documentIdParamSchema),
    documentController.getById.bind(documentController)
);

/**
 * PATCH /api/v1/documents/:id
 * Update document metadata
 */
/**
 * @swagger
 * /documents/{id}:
 *   patch:
 *     summary: Update a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       404:
 *         description: Document not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
    '/:id',
    authenticate,
    standardLimiter,
    validate(documentUpdateSchema),
    documentController.update.bind(documentController)
);

/**
 * DELETE /api/v1/documents/:id
 * Delete a document (soft delete)
 */
/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
    '/:id',
    authenticate,
    standardLimiter,
    validate(documentIdParamSchema),
    documentController.delete.bind(documentController)
);

export default router;
