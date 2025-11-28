/**
 * Sentry Error Tracking Configuration
 * Captures errors, performance, and user context
 */
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Request } from 'express';

/**
 * Initialize Sentry
 */
export function initializeSentry(app: any) {
  // Only initialize if DSN is provided
  if (!process.env.SENTRY_DSN) {
    console.log('Sentry is disabled (no DSN provided)');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || '0.1.0',

    // Performance monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

    // Profiling
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),

    // Integrations
    integrations: [
      // HTTP integration
      new Sentry.Integrations.Http({ tracing: true }),

      // Express integration
      new Sentry.Integrations.Express({
        app
      }),

      // Profiling integration
      new ProfilingIntegration(),

      // Database integrations
      new Sentry.Integrations.Postgres(),
      new Sentry.Integrations.Mongo() // if using MongoDB
    ],

    // Error filtering
    beforeSend(event, hint) {
      // Filter out errors based on environment
      if (process.env.NODE_ENV === 'development') {
        console.log('Sentry event:', event);
      }

      // Don't send errors for health checks
      if (event.request?.url?.includes('/health')) {
        return null;
      }

      // Don't send errors for metrics endpoint
      if (event.request?.url?.includes('/metrics')) {
        return null;
      }

      // Filter out specific error types
      if (event.exception?.values?.[0]?.type === 'UnauthorizedError') {
        // You might want to track these separately or not at all
        return null;
      }

      return event;
    },

    // Transaction filtering
    beforeSendTransaction(event) {
      // Sample transactions based on route
      if (event.transaction?.includes('health')) {
        return null;
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser errors (shouldn't happen in Node.js but good to have)
      'Non-Error promise rejection captured',

      // Network errors
      'Network request failed',
      'ECONNREFUSED',
      'ETIMEDOUT',

      // Common HTTP errors
      '401',
      '403'
    ]
  });

  console.log('Sentry initialized');
}

/**
 * Express request handler middleware
 * Must be the first middleware
 */
export const sentryRequestHandler = Sentry.Handlers.requestHandler({
  user: ['id', 'email', 'role']
});

/**
 * Express tracing middleware
 */
export const sentryTracingHandler = Sentry.Handlers.tracingHandler();

/**
 * Express error handler middleware
 * Must be placed after routes and before other error handlers
 */
export const sentryErrorHandler = Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Capture all errors with status code >= 500
    return true;
  }
});

/**
 * Capture exception with context
 */
export function captureException(error: Error, context?: {
  user?: { id: string; email?: string };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: Sentry.SeverityLevel;
}) {
  Sentry.withScope((scope) => {
    // Add user context
    if (context?.user) {
      scope.setUser(context.user);
    }

    // Add tags
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    // Add extra context
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    // Set level
    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture message with context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    user?: { id: string; email?: string };
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  Sentry.withScope((scope) => {
    // Add user context
    if (context?.user) {
      scope.setUser(context.user);
    }

    // Add tags
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    // Add extra context
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureMessage(message, level);
  });
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op
  });
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data
  });
}

/**
 * Set user context globally
 */
export function setUser(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Add tag
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Add context
 */
export function setContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context);
}

/**
 * Capture database error
 */
export function captureDbError(error: Error, operation: string, table: string) {
  captureException(error, {
    tags: {
      error_type: 'database',
      db_operation: operation,
      db_table: table
    },
    extra: {
      operation,
      table
    },
    level: 'error'
  });
}

/**
 * Capture authentication error
 */
export function captureAuthError(error: Error, email?: string) {
  captureException(error, {
    tags: {
      error_type: 'authentication'
    },
    extra: {
      email
    },
    level: 'warning'
  });
}

/**
 * Capture API error
 */
export function captureApiError(
  error: Error,
  req: Request,
  statusCode: number
) {
  captureException(error, {
    tags: {
      error_type: 'api',
      http_method: req.method,
      http_status: statusCode.toString()
    },
    extra: {
      url: req.originalUrl,
      method: req.method,
      statusCode,
      query: req.query,
      body: sanitizeBody(req.body)
    },
    level: statusCode >= 500 ? 'error' : 'warning'
  });
}

/**
 * Sanitize sensitive data from body
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
 * Create performance monitoring decorator
 */
export function monitored(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const transaction = Sentry.startTransaction({
      name: `${target.constructor.name}.${propertyKey}`,
      op: 'function'
    });

    try {
      const result = await originalMethod.apply(this, args);
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      captureException(error as Error);
      throw error;
    } finally {
      transaction.finish();
    }
  };

  return descriptor;
}

// Export Sentry instance for advanced usage
export { Sentry };
