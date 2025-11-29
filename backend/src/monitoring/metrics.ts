import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
    app: 'ai-knowledge-backend',
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Create custom metrics
export const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.5, 1, 1.5, 2, 5],
});

export const dbQueryDurationMicroseconds = new client.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(dbQueryDurationMicroseconds);

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        httpRequestDurationMicroseconds
            .labels(req.method, req.route ? req.route.path : req.path, res.statusCode.toString())
            .observe(duration / 1000);
    });
    next();
};

export const getMetrics = async (req: Request, res: Response) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
};
