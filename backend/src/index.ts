import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import { initializeDatabase } from './config/database';

const app: Application = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

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
import documentRoutes from './routes/documents';
import searchRoutes from './routes/search';

app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/search', searchRoutes);

app.get('/api/v1', (_req: Request, res: Response) => {
    res.json({
        message: 'AI Knowledge Management System API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
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

        // Start Express server
        app.listen(config.port, () => {
            console.log(`
╔════════════════════════════════════════════╗
║  AI Knowledge Management System - Backend  ║
╠════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(30)} ║
║  Port:        ${String(config.port).padEnd(30)} ║
║  API:         http://localhost:${config.port}${' '.repeat(14)} ║
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
