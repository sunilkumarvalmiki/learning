/**
 * Structured Console Logger Wrapper
 * Replaces console.log/error/warn with structured logging
 * Use this for development until full logger integration
 */

import { logger } from '../config/logger';

/**
 * Structured log with document context
 */
export const logDocument = (
    level: 'info' | 'error' | 'warn' | 'debug',
    message: string,
    context?: {
        documentId?: string;
        userId?: string;
        fileName?: string;
        status?: string;
        [key: string]: any;
    }
) => {
    logger.log(level, message, { category: 'document', ...context });
};

/**
 * Structured log for queue operations
 */
export const logQueue = (
    level: 'info' | 'error' | 'warn' | 'debug',
    message: string,
    context?: {
        queueName?: string;
        jobId?: string;
        retryCount?: number;
        [key: string]: any;
    }
) => {
    logger.log(level, message, { category: 'queue', ...context });
};

/**
 * Structured log for embedding operations
 */
export const logEmbedding = (
    level: 'info' | 'error' | 'warn' | 'debug',
    message: string,
    context?: {
        documentId?: string;
        chunks?: number;
        tokens?: number;
        [key: string]: any;
    }
) => {
    logger.log(level, message, { category: 'embedding', ...context });
};

/**
 * Structured log for search operations  
 */
export const logSearch = (
    level: 'info' | 'error' | 'warn' | 'debug',
    message: string,
    context?: {
        query?: string;
        type?: string;
        results?: number;
        duration?: number;
        [key: string]: any;
    }
) => {
    logger.log(level, message, { category: 'search', ...context });
};

/**
 * Structured log for cache operations
 */
export const logCache = (
    level: 'info' | 'error' | 'warn' | 'debug',
    message: string,
    context?: {
        key?: string;
        operation?: string;
        [key: string]: any;
    }
) => {
    logger.log(level, message, { category: 'cache', ...context });
};

/**
 * Structured log for general operations
 */
export const logInfo = (message: string, context?: any) => {
    logger.info(message, context);
};

export const logError = (message: string, error?: Error | any, context?: any) => {
    logger.error(message, {
        error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : error,
        ...context
    });
};

export const logWarn = (message: string, context?: any) => {
    logger.warn(message, context);
};

export const logDebug = (message: string, context?: any) => {
    logger.debug(message, context);
};

// Export all
export default {
    logDocument,
    logQueue,
    logEmbedding,
    logSearch,
    logCache,
    logInfo,
    logError,
    logWarn,
    logDebug
};
