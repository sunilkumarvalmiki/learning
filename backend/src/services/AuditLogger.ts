import { AppDataSource } from '../config/database';
import winston from 'winston';

/**
 * Audit Logger Service
 * Comprehensive security event logging for compliance and monitoring
 */

export enum AuditEventType {
    // Authentication Events
    AUTH_LOGIN_SUCCESS = 'auth.login.success',
    AUTH_LOGIN_FAILED = 'auth.login.failed',
    AUTH_LOGOUT = 'auth.logout',
    AUTH_REGISTER = 'auth.register',
    AUTH_PASSWORD_CHANGE = 'auth.password_change',
    AUTH_TOKEN_REFRESH = 'auth.token_refresh',

    // Authorization Events
    ACCESS_GRANTED = 'access.granted',
    ACCESS_DENIED = 'access.denied',
    PRIVILEGE_ESCALATION_ATTEMPT = 'access.privilege_escalation',

    // Data Events
    DATA_CREATE = 'data.create',
    DATA_READ = 'data.read',
    DATA_UPDATE = 'data.update',
    DATA_DELETE = 'data.delete',
    DATA_EXPORT = 'data.export',

    // GDPR Events
    GDPR_DATA_EXPORT_REQUEST = 'gdpr.data_export',
    GDPR_DATA_DELETE_REQUEST = 'gdpr.data_delete',
    GDPR_CONSENT_GIVEN = 'gdpr.consent_given',
    GDPR_CONSENT_WITHDRAWN = 'gdpr.consent_withdrawn',

    // Security Events
    SECURITY_RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
    SECURITY_SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
    SECURITY_CONFIG_CHANGE = 'security.config_change',

    // System Events
    SYSTEM_ERROR = 'system.error',
    SYSTEM_CONFIG_CHANGE = 'system.config_change',
}

export enum AuditSeverity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical',
}

export interface AuditLogEntry {
    eventType: AuditEventType;
    severity: AuditSeverity;
    userId?: string;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
    resourceType?: string;
    resourceId?: string;
    action?: string;
    success: boolean;
    metadata?: Record<string, any>;
    message: string;
    timestamp: Date;
}

class AuditLoggerService {
    private logger: winston.Logger;

    constructor() {
        // Configure Winston logger for audit logs
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                // Write to audit.log file
                new winston.transports.File({
                    filename: 'logs/audit.log',
                    maxsize: 10485760, // 10MB
                    maxFiles: 90, // 90 days retention
                }),
                // Also log to console in development
                ...(process.env.NODE_ENV === 'development'
                    ? [new winston.transports.Console({
                          format: winston.format.combine(
                              winston.format.colorize(),
                              winston.format.simple()
                          ),
                      })]
                    : []),
            ],
        });
    }

    /**
     * Log an audit event
     */
    async log(entry: AuditLogEntry): Promise<void> {
        try {
            // Remove sensitive data from metadata
            const sanitizedMetadata = this.sanitizeMetadata(entry.metadata);

            const logData = {
                ...entry,
                metadata: sanitizedMetadata,
                timestamp: entry.timestamp || new Date(),
            };

            // Log to Winston (file and console)
            this.logger.log({
                level: this.mapSeverityToLevel(entry.severity),
                message: entry.message,
                ...logData,
            });

            // Also store in database for queryable audit trail
            await this.storeInDatabase(logData);
        } catch (error) {
            console.error('Failed to log audit event:', error);
            // Don't throw - audit logging should not break application flow
        }
    }

    /**
     * Log authentication success
     */
    async logAuthSuccess(userId: string, userName: string, ipAddress: string, userAgent: string): Promise<void> {
        await this.log({
            eventType: AuditEventType.AUTH_LOGIN_SUCCESS,
            severity: AuditSeverity.INFO,
            userId,
            userName,
            ipAddress,
            userAgent,
            success: true,
            message: `User ${userName} logged in successfully`,
            timestamp: new Date(),
        });
    }

    /**
     * Log authentication failure
     */
    async logAuthFailure(email: string, ipAddress: string, userAgent: string, reason: string): Promise<void> {
        await this.log({
            eventType: AuditEventType.AUTH_LOGIN_FAILED,
            severity: AuditSeverity.WARNING,
            ipAddress,
            userAgent,
            success: false,
            message: `Failed login attempt for ${email}: ${reason}`,
            metadata: { email, reason },
            timestamp: new Date(),
        });
    }

    /**
     * Log access denied event
     */
    async logAccessDenied(
        userId: string,
        resource: string,
        action: string,
        ipAddress: string
    ): Promise<void> {
        await this.log({
            eventType: AuditEventType.ACCESS_DENIED,
            severity: AuditSeverity.WARNING,
            userId,
            ipAddress,
            resourceType: resource,
            action,
            success: false,
            message: `Access denied: User ${userId} attempted ${action} on ${resource}`,
            timestamp: new Date(),
        });
    }

    /**
     * Log data access
     */
    async logDataAccess(
        userId: string,
        resourceType: string,
        resourceId: string,
        action: 'read' | 'create' | 'update' | 'delete',
        ipAddress: string
    ): Promise<void> {
        const eventTypeMap = {
            read: AuditEventType.DATA_READ,
            create: AuditEventType.DATA_CREATE,
            update: AuditEventType.DATA_UPDATE,
            delete: AuditEventType.DATA_DELETE,
        };

        await this.log({
            eventType: eventTypeMap[action],
            severity: action === 'delete' ? AuditSeverity.WARNING : AuditSeverity.INFO,
            userId,
            ipAddress,
            resourceType,
            resourceId,
            action,
            success: true,
            message: `User ${userId} performed ${action} on ${resourceType} ${resourceId}`,
            timestamp: new Date(),
        });
    }

    /**
     * Log GDPR data export request
     */
    async logGDPRExport(userId: string, ipAddress: string): Promise<void> {
        await this.log({
            eventType: AuditEventType.GDPR_DATA_EXPORT_REQUEST,
            severity: AuditSeverity.INFO,
            userId,
            ipAddress,
            success: true,
            message: `User ${userId} requested GDPR data export`,
            timestamp: new Date(),
        });
    }

    /**
     * Log GDPR data deletion request
     */
    async logGDPRDeletion(userId: string, ipAddress: string): Promise<void> {
        await this.log({
            eventType: AuditEventType.GDPR_DATA_DELETE_REQUEST,
            severity: AuditSeverity.WARNING,
            userId,
            ipAddress,
            success: true,
            message: `User ${userId} requested GDPR data deletion`,
            timestamp: new Date(),
        });
    }

    /**
     * Log rate limit exceeded
     */
    async logRateLimitExceeded(ipAddress: string, endpoint: string): Promise<void> {
        await this.log({
            eventType: AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
            severity: AuditSeverity.WARNING,
            ipAddress,
            success: false,
            message: `Rate limit exceeded from IP ${ipAddress} on endpoint ${endpoint}`,
            metadata: { endpoint },
            timestamp: new Date(),
        });
    }

    /**
     * Remove sensitive data from metadata
     */
    private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
        if (!metadata) return undefined;

        const sanitized = { ...metadata };
        const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

        for (const key of Object.keys(sanitized)) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
                sanitized[key] = '[REDACTED]';
            }
        }

        return sanitized;
    }

    /**
     * Map severity to Winston log level
     */
    private mapSeverityToLevel(severity: AuditSeverity): string {
        const mapping = {
            [AuditSeverity.INFO]: 'info',
            [AuditSeverity.WARNING]: 'warn',
            [AuditSeverity.ERROR]: 'error',
            [AuditSeverity.CRITICAL]: 'error',
        };
        return mapping[severity];
    }

    /**
     * Store audit log in database for queryable audit trail
     */
    private async storeInDatabase(entry: AuditLogEntry): Promise<void> {
        try {
            await AppDataSource.query(
                `INSERT INTO audit_logs (
                    event_type, severity, user_id, user_name, ip_address,
                    user_agent, resource_type, resource_id, action, success,
                    metadata, message, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    entry.eventType,
                    entry.severity,
                    entry.userId || null,
                    entry.userName || null,
                    entry.ipAddress || null,
                    entry.userAgent || null,
                    entry.resourceType || null,
                    entry.resourceId || null,
                    entry.action || null,
                    entry.success,
                    JSON.stringify(entry.metadata || {}),
                    entry.message,
                    entry.timestamp,
                ]
            );
        } catch (error) {
            // If database insert fails, at least we have file logs
            console.error('Failed to store audit log in database:', error);
        }
    }
}

export const auditLogger = new AuditLoggerService();
