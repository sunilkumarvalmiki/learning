import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { gdprService } from '../services/GDPRService';

/**
 * GDPR Controller
 * Handles GDPR compliance endpoints
 */

export class GDPRController {
    /**
     * Export all user data (GDPR Right to Access)
     * GET /api/v1/gdpr/export
     */
    async exportData(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

            const exportData = await gdprService.exportUserData(userId, ipAddress);

            // Set headers for file download
            res.setHeader('Content-Type', 'application/json');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="user_data_export_${userId}_${Date.now()}.json"`
            );

            res.json({
                success: true,
                data: exportData,
                message: 'User data exported successfully',
            });
        } catch (error: any) {
            console.error('Error in exportData:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: error.message || 'Failed to export user data',
            });
        }
    }

    /**
     * Delete all user data (GDPR Right to be Forgotten)
     * DELETE /api/v1/gdpr/delete-account
     */
    async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

            // Require explicit confirmation
            const { confirm } = req.body;

            if (confirm !== 'DELETE MY ACCOUNT') {
                res.status(400).json({
                    success: false,
                    error: 'Confirmation Required',
                    message: 'Please confirm account deletion by sending { "confirm": "DELETE MY ACCOUNT" }',
                });
                return;
            }

            await gdprService.deleteUserData(userId, ipAddress);

            res.json({
                success: true,
                message: 'Account and all associated data have been permanently deleted',
            });
        } catch (error: any) {
            console.error('Error in deleteAccount:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: error.message || 'Failed to delete user data',
            });
        }
    }

    /**
     * Get user consent status
     * GET /api/v1/gdpr/consent
     */
    async getConsent(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.userId!;

            const consent = await gdprService.getUserConsent(userId);

            res.json({
                success: true,
                data: consent,
            });
        } catch (error: any) {
            console.error('Error in getConsent:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: error.message || 'Failed to retrieve consent status',
            });
        }
    }

    /**
     * Update user consent preferences
     * POST /api/v1/gdpr/consent
     */
    async updateConsent(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
            const { dataProcessing, analytics, marketing } = req.body;

            await gdprService.updateUserConsent(
                userId,
                {
                    dataProcessing,
                    analytics,
                    marketing,
                },
                ipAddress
            );

            res.json({
                success: true,
                message: 'Consent preferences updated successfully',
            });
        } catch (error: any) {
            console.error('Error in updateConsent:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: error.message || 'Failed to update consent preferences',
            });
        }
    }

    /**
     * Get data retention policy
     * GET /api/v1/gdpr/retention-policy
     */
    async getRetentionPolicy(_req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const policy = gdprService.getDataRetentionPolicy();

            res.json({
                success: true,
                data: policy,
            });
        } catch (error: any) {
            console.error('Error in getRetentionPolicy:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: error.message || 'Failed to retrieve retention policy',
            });
        }
    }
}
