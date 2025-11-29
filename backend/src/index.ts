import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import config from './config';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { configureSecurityHeaders, corsOptions, devCorsOptions } from './middleware/securityHeaders';
import { setupSwagger } from './config/swagger';
import { standardLimiter, authLimiter } from './middleware/rateLimiter';

const app: Application = express();

// Apply global rate limiter to all requests
app.use(standardLimiter);

// Performance monitoring middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 1000) {
            console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
        }
    });
    next();
});

// Compression middleware - compress all responses
app.use(
    compression({
        filter: (req, res) => {
            // Don't compress if client doesn't support it
            if (req.headers['x-no-compression']) {
                return false;
            }
            // Use compression for all responses
            return compression.filter(req, res);
        },
        // Compression level (0-9): 6 is balanced between speed and compression ratio
        level: 6,
        // Only compress responses larger than 1KB
        threshold: 1024,
    })
);

// Enhanced security headers (Helmet.js with custom config)
configureSecurityHeaders(app as any);

// CORS configuration
const corsConfig = config.nodeEnv === 'production' ? corsOptions : devCorsOptions;
app.use(cors(corsConfig));

// Parse JSON bodies with size limit
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup Swagger/OpenAPI documentation
setupSwagger(app);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
    });
});

// API routes
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import searchRoutes from './routes/search';
import gdprRoutes from './routes/gdpr';
import taskRoutes from './routes/tasks';

import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger/swagger.config';

import { metricsMiddleware, getMetrics } from './monitoring/metrics';

app.use(metricsMiddleware);
app.get('/metrics', getMetrics);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/gdpr', gdprRoutes);
app.use('/api/v1/tasks', taskRoutes);

app.get('/api/v1', (_req: Request, res: Response) => {
    res.json({
        message: 'AI Knowledge Management System API',
        version: '1.0.0',
        documentation: '/api-docs',
        endpoints: {
            health: '/health',
            auth: {
                register: '/api/v1/auth/register',
                login: '/api/v1/auth/login',
                me: '/api/v1/auth/me',
                profile: '/api/v1/auth/profile',
            },
            documents: '/api/v1/documents',
            upload: '/api/v1/documents/upload',
            search: '/api/v1/search?q=query',
            searchSemantic: '/api/v1/search/semantic?q=query',
            searchHybrid: '/api/v1/search/hybrid?q=query',
            suggestions: '/api/v1/search/suggestions?q=partial',
        },
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
    });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
    });
});

// Start server
const startServer = async () => {
    try {
        // Initialize database connection
        await initializeDatabase();

        // Initialize Redis connection (non-blocking)
        try {
            await initializeRedis();
        } catch (error) {
            console.warn('Redis initialization failed (caching disabled):', error);
        }

        // Start Express server
        app.listen(config.port, () => {
            console.log(`
╔════════════════════════════════════════════╗
║  AI Knowledge Management System - Backend  ║
╠════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(30)} ║
║  Port:        ${String(config.port).padEnd(30)} ║
║  API:         http://localhost:${config.port}${' '.repeat(14)} ║
║  Compression: Enabled (gzip/brotli)${' '.repeat(8)} ║
║  Caching:     Redis                        ║
╚════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();

export default app;
