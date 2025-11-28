import swaggerJsdoc from 'swagger-jsdoc';
import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import config from './index';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'AI Knowledge Management System API',
            version: '1.0.0',
            description: `
# AI Knowledge Management System API

A comprehensive API for managing documents, search, and user authentication with advanced AI-powered features.

## Features

- Document upload and processing (PDF, DOCX, TXT, MD)
- Full-text search with PostgreSQL
- Semantic search with vector embeddings (Qdrant)
- Hybrid search combining full-text and semantic
- JWT-based authentication
- Document processing queue with NATS
- MinIO object storage integration
- Neo4j graph database for relationships

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

Obtain a token by registering or logging in through the /api/v1/auth endpoints.

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:
- Global: 100 requests per 15 minutes per IP
- Authentication: 5 requests per 15 minutes per IP
- Search: 30 requests per minute per user

## Error Responses

All error responses follow this format:

\`\`\`json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": [] // Optional: validation errors or additional info
}
\`\`\`
            `.trim(),
            contact: {
                name: 'API Support',
                email: 'support@example.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: `http://localhost:${config.port}`,
                description: 'Development server',
            },
            {
                url: 'https://api.example.com',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token obtained from /api/v1/auth/login',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'User unique identifier',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                        fullName: {
                            type: 'string',
                            description: 'User full name',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Account active status',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Account creation timestamp',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update timestamp',
                        },
                    },
                },
                Document: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Document unique identifier',
                        },
                        title: {
                            type: 'string',
                            description: 'Document title',
                        },
                        fileName: {
                            type: 'string',
                            description: 'Original file name',
                        },
                        fileType: {
                            type: 'string',
                            enum: ['pdf', 'docx', 'txt', 'md', 'image', 'video', 'audio', 'other'],
                            description: 'File type/format',
                        },
                        fileSize: {
                            type: 'number',
                            description: 'File size in bytes',
                        },
                        status: {
                            type: 'string',
                            enum: ['uploading', 'processing', 'completed', 'failed'],
                            description: 'Processing status',
                        },
                        content: {
                            type: 'string',
                            description: 'Extracted text content',
                            nullable: true,
                        },
                        tags: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Document tags',
                        },
                        metadata: {
                            type: 'object',
                            description: 'Additional metadata',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                SearchResult: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        title: {
                            type: 'string',
                        },
                        content: {
                            type: 'string',
                        },
                        score: {
                            type: 'number',
                            description: 'Relevance score',
                        },
                        highlight: {
                            type: 'string',
                            description: 'Highlighted matching text',
                        },
                    },
                },
                ValidationError: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            example: 'Validation error',
                        },
                        message: {
                            type: 'string',
                            example: 'Invalid request data',
                        },
                        details: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {
                                        type: 'string',
                                        example: 'body.email',
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Invalid email format',
                                    },
                                    code: {
                                        type: 'string',
                                        example: 'invalid_string',
                                    },
                                },
                            },
                        },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error type',
                        },
                        message: {
                            type: 'string',
                            description: 'Error message',
                        },
                    },
                },
            },
            responses: {
                UnauthorizedError: {
                    description: 'Authentication token is missing or invalid',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse',
                            },
                            example: {
                                error: 'Unauthorized',
                                message: 'Invalid or missing authentication token',
                            },
                        },
                    },
                },
                ValidationError: {
                    description: 'Request validation failed',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ValidationError',
                            },
                        },
                    },
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse',
                            },
                            example: {
                                error: 'Not Found',
                                message: 'The requested resource was not found',
                            },
                        },
                    },
                },
                ServerError: {
                    description: 'Internal server error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse',
                            },
                            example: {
                                error: 'Internal Server Error',
                                message: 'Something went wrong',
                            },
                        },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication and authorization endpoints',
            },
            {
                name: 'Documents',
                description: 'Document management and upload endpoints',
            },
            {
                name: 'Search',
                description: 'Full-text, semantic, and hybrid search endpoints',
            },
            {
                name: 'Health',
                description: 'System health and status endpoints',
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/swagger/*.ts'], // Path to API docs
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
    // Swagger UI
    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'AI Knowledge Management API Docs',
        })
    );

    // Swagger JSON
    app.get('/api-docs.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
};

export default swaggerSpec;
