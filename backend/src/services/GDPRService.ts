import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Document } from '../models/Document';
import { auditLogger } from './AuditLogger';
import { qdrantClient, minioClient, bucketName } from '../config'; // Import qdrantClient, minioClient, and bucketName directly

/**
 * GDPR Compliance Service
 * Handles right to access, right to be forgotten, and data portability
 */

export interface UserDataExport {
    profile: {
        id: string;
        email: string;
        name: string | null;
        role: string;
        createdAt: Date;
        lastLoginAt: Date | null;
    };
    documents: Array<{
        id: string;
        title: string;
        fileName: string;
        fileType: string;
        uploadedAt: Date;
        status: string;
    }>;
    searchHistory: Array<{
        query: string;
        queryType: string;
        timestamp: Date;
    }>;
    auditLogs: Array<{
        eventType: string;
        timestamp: Date;
        action: string;
        success: boolean;
    }>;
    exportMetadata: {
        exportDate: Date;
        dataRetentionPolicy: string;
        contactEmail: string;
    };
}

export class GDPRService {
    private userRepository = AppDataSource.getRepository(User);
    private documentRepository = AppDataSource.getRepository(Document);

    /**
     * Export all user data (GDPR Right to Access)
     * Returns comprehensive user data in machine-readable format
     */
    async exportUserData(userId: string, ipAddress: string): Promise<UserDataExport> {
        try {
            // Log GDPR export request
            await auditLogger.logGDPRExport(userId, ipAddress);

            // Fetch user profile
            const user = await this.userRepository.findOne({
                where: { id: userId },
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Fetch all user documents
            const documents = await this.documentRepository.find({
                where: { userId },
                select: ['id', 'title', 'fileName', 'fileType', 'uploadedAt', 'status'],
            });

            // Fetch search history
            const searchHistory = await AppDataSource.query(
                `SELECT query, query_type, created_at as timestamp
                 FROM search_history
                 WHERE user_id = $1
                 ORDER BY created_at DESC
                 LIMIT 1000`,
                [userId]
            );

            // Fetch audit logs related to this user
            const auditLogs = await AppDataSource.query(
                `SELECT event_type, timestamp, action, success
                 FROM audit_logs
                 WHERE user_id = $1
                 ORDER BY timestamp DESC
                 LIMIT 1000`,
                [userId]
            );

            // Compile export data
            const exportData: UserDataExport = {
                profile: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    createdAt: user.createdAt,
                    lastLoginAt: user.lastLoginAt,
                },
                documents: documents.map(doc => ({
                    id: doc.id,
                    title: doc.title || 'Untitled',
                    fileName: doc.fileName || 'Unknown',
                    fileType: doc.fileType || 'Unknown',
                    uploadedAt: doc.uploadedAt,
                    status: doc.status,
                })),
                searchHistory: searchHistory.map((sh: any) => ({
                    query: sh.query,
                    queryType: sh.query_type,
                    timestamp: sh.timestamp,
                })),
                auditLogs: auditLogs.map((log: any) => ({
                    eventType: log.event_type,
                    timestamp: log.timestamp,
                    action: log.action || 'N/A',
                    success: log.success,
                })),
                exportMetadata: {
                    exportDate: new Date(), // Changed from ISOString to Date to match interface
                    dataRetentionPolicy: this.getDataRetentionPolicy().userProfiles, // Example, could be more detailed
                    contactEmail: process.env.GDPR_CONTACT_EMAIL || process.env.SUPPORT_EMAIL || 'privacy@company.com',
                },
            };

            return exportData;
        } catch (error) {
            console.error('Error exporting user data:', error);
            throw new Error('Failed to export user data');
        }
    }

    /**
     * Delete all user data (GDPR Right to be Forgotten)
     * Performs hard delete with retention of audit logs
     */
    async deleteUserData(userId: string, ipAddress: string): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();

        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            // Log GDPR deletion request
            await auditLogger.logGDPRDeletion(userId, ipAddress);

            // 1. Delete user documents from storage and database
            const documents = await this.documentRepository.find({
                where: { userId },
            });

            for (const doc of documents) {
                // Delete from MinIO storage (S3-compatible)
                try {
                    if (minioClient && bucketName && doc.storageKey) {
                        await minioClient.removeObject(bucketName, doc.storageKey);
                    }
                } catch (error) {
                    // Log but don't fail - continue with deletion
                    console.error(`Failed to delete MinIO object for document ${doc.id}:`, error);
                }

                // Delete from Qdrant (vector embeddings)
                try {
                    if (qdrantClient) {
                        await qdrantClient.delete('documents', {
                            filter: {
                                must: [
                                    {
                                        key: 'document_id',
                                        match: { value: doc.id }
                                    }
                                ]
                            }
                        });
                    }
                } catch (error) {
                    // Log but don't fail - continue with deletion
                    console.error(`Failed to delete Qdrant embeddings for document ${doc.id}:`, error);
                }

                // Delete from PostgreSQL
                await queryRunner.manager.delete(Document, { id: doc.id });
            }

            // 2. Anonymize search history (retain for analytics but remove PII)
            await queryRunner.query(
                `UPDATE search_history
                 SET user_id = NULL
                 WHERE user_id = $1`,
                [userId]
            );

            // 3. Anonymize audit logs (retain for compliance but remove PII)
            await queryRunner.query(
                `UPDATE audit_logs
                 SET user_name = 'DELETED_USER',
                     user_agent = NULL,
                     metadata = '{}'
                 WHERE user_id = $1`,
                [userId]
            );

            // 4. Delete user account
            await queryRunner.manager.delete(User, { id: userId });

            await queryRunner.commitTransaction();

            console.log(`Successfully deleted all data for user ${userId}`);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Error deleting user data:', error);
            throw new Error('Failed to delete user data');
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get user consent status
     */
    async getUserConsent(userId: string): Promise<{
        dataProcessing: boolean;
        analytics: boolean;
        marketing: boolean;
        updatedAt: Date;
    }> {
        const result = await AppDataSource.query(
            `SELECT data_processing, analytics, marketing, updated_at
             FROM user_consents
             WHERE user_id = $1`,
            [userId]
        );

        if (result.length === 0) {
            // Default consents
            return {
                dataProcessing: true, // Required for service
                analytics: false,
                marketing: false,
                updatedAt: new Date(),
            };
        }

        return {
            dataProcessing: result[0].data_processing,
            analytics: result[0].analytics,
            marketing: result[0].marketing,
            updatedAt: result[0].updated_at,
        };
    }

    /**
     * Update user consent preferences
     */
    async updateUserConsent(
        userId: string,
        consents: {
            dataProcessing?: boolean;
            analytics?: boolean;
            marketing?: boolean;
        },
        ipAddress: string
    ): Promise<void> {
        try {
            await AppDataSource.query(
                `INSERT INTO user_consents (user_id, data_processing, analytics, marketing)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (user_id)
                 DO UPDATE SET
                     data_processing = COALESCE($2, user_consents.data_processing),
                     analytics = COALESCE($3, user_consents.analytics),
                     marketing = COALESCE($4, user_consents.marketing),
                     updated_at = NOW()`,
                [
                    userId,
                    consents.dataProcessing ?? null,
                    consents.analytics ?? null,
                    consents.marketing ?? null,
                ]
            );

            // Log consent change
            await auditLogger.log({
                eventType: consents.marketing === false || consents.analytics === false
                    ? 'gdpr.consent_withdrawn' as any
                    : 'gdpr.consent_given' as any,
                severity: 'info' as any,
                userId,
                ipAddress,
                success: true,
                message: `User updated consent preferences`,
                metadata: consents,
                timestamp: new Date(),
            });
        } catch (error) {
            console.error('Error updating user consent:', error);
            throw new Error('Failed to update consent preferences');
        }
    }

    /**
     * Get data retention information
     */
    getDataRetentionPolicy(): {
        userProfiles: string;
        documents: string;
        searchHistory: string;
        auditLogs: string;
    } {
        return {
            userProfiles: 'Retained until account deletion',
            documents: 'Retained until user deletion or manual removal',
            searchHistory: '1 year, then anonymized',
            auditLogs: '7 years for compliance (anonymized after account deletion)',
        };
    }
}

export const gdprService = new GDPRService();
