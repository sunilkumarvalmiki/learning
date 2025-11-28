/**
 * Request Logging Middleware
 * Adds request ID, logs requests/responses with context
 */
import { Request, Response, NextFunction } from 'express';
import {
  generateRequestId,
  logRequest,
  logResponse,
  RequestContext
} from '../config/logger';

// Extend Express Request to include custom properties
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
      context?: RequestContext;
    }
  }
}

/**
 * Middleware to add request ID and logging
 */
export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate unique request ID
  req.requestId = req.get('X-Request-ID') || generateRequestId();

  // Set request start time
  req.startTime = Date.now();

  // Create request context
  req.context = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('user-agent')
  };

  // Add user info if authenticated
  if (req.user) {
    req.context.userId = (req.user as any).id;
    req.context.userEmail = (req.user as any).email;
  }

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);

  // Log incoming request
  logRequest(req.context, {
    query: req.query,
    body: sanitizeBody(req.body),
    headers: sanitizeHeaders(req.headers)
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - (req.startTime || Date.now());

    // Log outgoing response
    logResponse(req.context!, res.statusCode, duration, {
      responseSize: Buffer.byteLength(JSON.stringify(data || ''))
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Sanitize headers to remove sensitive data
 */
function sanitizeHeaders(headers: any): any {
  if (!headers || typeof headers !== 'object') {
    return headers;
  }

  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Error logging middleware (should be placed after routes)
 */
export const errorLoggerMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const context = req.context || {
    requestId: req.requestId || 'unknown',
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || 'unknown'
  };

  const duration = Date.now() - (req.startTime || Date.now());

  // Log error with full context
  logResponse(
    context,
    res.statusCode || 500,
    duration,
    {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name
      }
    }
  );

  next(err);
};
