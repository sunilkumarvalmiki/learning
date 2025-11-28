/**
 * Enhanced Structured Logging Configuration
 * Supports: JSON format, request tracing, log levels, Loki integration
 */
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan'
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Custom format for adding metadata
const addMetadata = winston.format((info) => {
  info.timestamp = new Date().toISOString();
  info.environment = process.env.NODE_ENV || 'development';
  info.service = 'ai-knowledge-backend';
  info.version = process.env.APP_VERSION || '0.1.0';
  info.hostname = process.env.HOSTNAME || 'localhost';

  return info;
});

// Format for development (human-readable)
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Format for production (JSON for log aggregation)
const productionFormat = winston.format.combine(
  addMetadata(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat
  }),

  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: productionFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: productionFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Add HTTP transport for Loki (if configured)
if (process.env.LOKI_URL) {
  // Note: You would need to install winston-loki package
  // const LokiTransport = require('winston-loki');
  // transports.push(
  //   new LokiTransport({
  //     host: process.env.LOKI_URL,
  //     labels: { app: 'ai-knowledge-backend' },
  //     json: true,
  //     format: productionFormat
  //   })
  // );
}

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false
});

// Request logging context interface
export interface RequestContext {
  requestId: string;
  userId?: string;
  userEmail?: string;
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  [key: string]: any;
}

/**
 * Create a child logger with request context
 */
export const createRequestLogger = (context: Partial<RequestContext>) => {
  return logger.child(context);
};

/**
 * Generate a unique request ID
 */
export const generateRequestId = (): string => {
  return uuidv4();
};

/**
 * Log HTTP request
 */
export const logRequest = (context: RequestContext, additionalInfo?: any) => {
  logger.http('Incoming request', { ...context, ...additionalInfo });
};

/**
 * Log HTTP response
 */
export const logResponse = (
  context: RequestContext,
  statusCode: number,
  duration: number,
  additionalInfo?: any
) => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';
  logger.log(level, 'Outgoing response', {
    ...context,
    statusCode,
    duration,
    ...additionalInfo
  });
};

/**
 * Log database operation
 */
export const logDbOperation = (
  operation: string,
  table: string,
  duration: number,
  success: boolean,
  error?: Error
) => {
  const level = success ? 'debug' : 'error';
  logger.log(level, 'Database operation', {
    operation,
    table,
    duration,
    success,
    error: error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : undefined
  });
};

/**
 * Log authentication event
 */
export const logAuth = (
  event: 'login' | 'logout' | 'register' | 'token_refresh' | 'auth_failed',
  userId?: string,
  email?: string,
  ip?: string,
  additionalInfo?: any
) => {
  const level = event === 'auth_failed' ? 'warn' : 'info';
  logger.log(level, `Authentication: ${event}`, {
    event,
    userId,
    email,
    ip,
    ...additionalInfo
  });
};

/**
 * Log document operation
 */
export const logDocument = (
  operation: 'upload' | 'process' | 'delete' | 'search',
  documentId?: string,
  userId?: string,
  additionalInfo?: any
) => {
  logger.info(`Document operation: ${operation}`, {
    operation,
    documentId,
    userId,
    ...additionalInfo
  });
};

/**
 * Log search operation
 */
export const logSearch = (
  searchType: 'fulltext' | 'semantic' | 'hybrid',
  query: string,
  resultsCount: number,
  duration: number,
  userId?: string
) => {
  logger.info('Search performed', {
    searchType,
    query: query.substring(0, 100), // Truncate for privacy
    resultsCount,
    duration,
    userId
  });
};

/**
 * Log error with full context
 */
export const logError = (
  error: Error,
  context?: any
) => {
  logger.error(error.message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    ...context
  });
};

/**
 * Log security event
 */
export const logSecurity = (
  event: 'unauthorized_access' | 'invalid_token' | 'rate_limit' | 'suspicious_activity',
  ip: string,
  additionalInfo?: any
) => {
  logger.warn(`Security event: ${event}`, {
    event,
    ip,
    timestamp: new Date().toISOString(),
    ...additionalInfo
  });
};

/**
 * Log performance metric
 */
export const logPerformance = (
  metric: string,
  value: number,
  unit: string,
  context?: any
) => {
  logger.debug('Performance metric', {
    metric,
    value,
    unit,
    ...context
  });
};

/**
 * Log queue operation
 */
export const logQueue = (
  operation: 'enqueue' | 'dequeue' | 'process' | 'error',
  queueName: string,
  itemId?: string,
  additionalInfo?: any
) => {
  const level = operation === 'error' ? 'error' : 'debug';
  logger.log(level, `Queue operation: ${operation}`, {
    operation,
    queueName,
    itemId,
    ...additionalInfo
  });
};

// Export logger instance as default
export default logger;
