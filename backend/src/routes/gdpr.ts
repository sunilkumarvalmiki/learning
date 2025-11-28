import { Router } from 'express';
import { GDPRController } from '../controllers/GDPRController';
import { authenticate } from '../middleware/auth';
import { standardLimiter } from '../middleware/rateLimiter';

const router = Router();
const gdprController = new GDPRController();

// All GDPR endpoints require authentication
router.use(authenticate);

// Apply rate limiting
router.use(standardLimiter);

/**
 * GET /api/v1/gdpr/export
 * Export all user data (GDPR Right to Access)
 */
router.get('/export', gdprController.exportData.bind(gdprController));

/**
 * DELETE /api/v1/gdpr/delete-account
 * Delete user account and all data (GDPR Right to be Forgotten)
 */
router.delete('/delete-account', gdprController.deleteAccount.bind(gdprController));

/**
 * GET /api/v1/gdpr/consent
 * Get user consent status
 */
router.get('/consent', gdprController.getConsent.bind(gdprController));

/**
 * POST /api/v1/gdpr/consent
 * Update user consent preferences
 */
router.post('/consent', gdprController.updateConsent.bind(gdprController));

/**
 * GET /api/v1/gdpr/retention-policy
 * Get data retention policy information
 */
router.get('/retention-policy', gdprController.getRetentionPolicy.bind(gdprController));

export default router;
