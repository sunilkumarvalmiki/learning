/**
 * Prometheus Metrics Middleware
 * Collects RED (Rate, Errors, Duration) and USE (Utilization, Saturation, Errors) metrics
 */
import { Request, Response, NextFunction } from 'express';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Enable default metrics collection (CPU, Memory, Event Loop, etc.)
collectDefaultMetrics({
  prefix: 'api_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// === RED Metrics (Rate, Errors, Duration) ===

// HTTP Request Counter (Rate)
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status', 'status_class']
});

// HTTP Request Duration (Duration)
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

// HTTP Request Size
export const httpRequestSize = new Histogram({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000, 10000000]
});

// HTTP Response Size
export const httpResponseSize = new Histogram({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000, 10000000]
});

// === Database Metrics ===

// Database Query Duration
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table', 'status'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Database Connections
export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  labelNames: ['pool']
});

export const dbConnectionsIdle = new Gauge({
  name: 'db_connections_idle',
  help: 'Number of idle database connections',
  labelNames: ['pool']
});

export const dbConnectionsTotal = new Gauge({
  name: 'db_connections_total',
  help: 'Total number of database connections',
  labelNames: ['pool']
});

// Database Errors
export const dbErrorsTotal = new Counter({
  name: 'db_errors_total',
  help: 'Total number of database errors',
  labelNames: ['operation', 'error_type']
});

// === Business Metrics ===

// Document Operations
export const documentsUploaded = new Counter({
  name: 'documents_uploaded_total',
  help: 'Total number of documents uploaded',
  labelNames: ['file_type', 'user_id']
});

export const documentsProcessed = new Counter({
  name: 'documents_processed_total',
  help: 'Total number of documents processed',
  labelNames: ['status']
});

export const documentsDeleted = new Counter({
  name: 'documents_deleted_total',
  help: 'Total number of documents deleted'
});

// Document Processing Time
export const documentProcessingDuration = new Histogram({
  name: 'document_processing_duration_seconds',
  help: 'Document processing duration in seconds',
  labelNames: ['file_type', 'stage'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

// Search Operations
export const searchesPerformed = new Counter({
  name: 'searches_performed_total',
  help: 'Total number of searches performed',
  labelNames: ['search_type', 'user_id']
});

export const searchDuration = new Histogram({
  name: 'search_duration_seconds',
  help: 'Search duration in seconds',
  labelNames: ['search_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const searchResultsCount = new Histogram({
  name: 'search_results_count',
  help: 'Number of search results returned',
  labelNames: ['search_type'],
  buckets: [0, 1, 5, 10, 20, 50, 100]
});

// User Operations
export const userRegistrations = new Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['role']
});

export const userLogins = new Counter({
  name: 'user_logins_total',
  help: 'Total number of user logins',
  labelNames: ['status']
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of currently active users'
});

// === Cache Metrics ===

export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name']
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name']
});

export const cacheRequests = new Counter({
  name: 'cache_requests_total',
  help: 'Total number of cache requests',
  labelNames: ['cache_name']
});

// === Vector Database Metrics ===

export const vectorSearchDuration = new Histogram({
  name: 'vector_search_duration_seconds',
  help: 'Vector search duration in seconds',
  labelNames: ['collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
});

export const embeddingGenerationDuration = new Histogram({
  name: 'embedding_generation_duration_seconds',
  help: 'Embedding generation duration in seconds',
  labelNames: ['model'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// === Queue Metrics ===

export const queueDepth = new Gauge({
  name: 'queue_depth',
  help: 'Number of items in queue',
  labelNames: ['queue_name']
});

export const queueProcessingDuration = new Histogram({
  name: 'queue_processing_duration_seconds',
  help: 'Queue item processing duration',
  labelNames: ['queue_name', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

// === Middleware Function ===

/**
 * Express middleware to track HTTP metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Capture request size
  const requestSize = parseInt(req.get('content-length') || '0', 10);

  // Track response
  const originalSend = res.send;
  res.send = function(data: any) {
    const responseSize = Buffer.byteLength(JSON.stringify(data || ''));

    // Normalize route path
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const status = res.statusCode;
    const statusClass = `${Math.floor(status / 100)}xx`;

    // Record metrics
    httpRequestsTotal.labels(method, route, status.toString(), statusClass).inc();

    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(method, route, status.toString()).observe(duration);

    if (requestSize > 0) {
      httpRequestSize.labels(method, route).observe(requestSize);
    }

    if (responseSize > 0) {
      httpResponseSize.labels(method, route).observe(responseSize);
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Metrics endpoint handler
 */
export const metricsHandler = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error collecting metrics');
  }
};

/**
 * Helper function to track database operations
 */
export const trackDbOperation = async <T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = (Date.now() - start) / 1000;
    dbQueryDuration.labels(operation, table, 'success').observe(duration);
    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    dbQueryDuration.labels(operation, table, 'error').observe(duration);
    dbErrorsTotal.labels(operation, (error as Error).name).inc();
    throw error;
  }
};

/**
 * Helper function to track search operations
 */
export const trackSearch = async <T>(
  searchType: string,
  userId: string | undefined,
  fn: () => Promise<T & { results?: any[] }>
): Promise<T> => {
  const start = Date.now();
  searchesPerformed.labels(searchType, userId || 'anonymous').inc();

  try {
    const result = await fn();
    const duration = (Date.now() - start) / 1000;
    searchDuration.labels(searchType).observe(duration);

    if (result.results) {
      searchResultsCount.labels(searchType).observe(result.results.length);
    }

    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    searchDuration.labels(searchType).observe(duration);
    throw error;
  }
};

// Export the registry for external use
export { register };
