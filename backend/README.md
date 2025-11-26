# AI Knowledge Management System - Backend

Backend API server for the AI Knowledge Management System, built with Node.js, TypeScript, and Express.

## Features

- **REST API** with Express.js
- **PostgreSQL** for relational data
- **Qdrant** for vector similarity search
- **Neo4j** for knowledge graph
- **MinIO** for object storage (S3-compatible)
- **TypeScript** for type safety
- **Docker Compose** for local development

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start databases with Docker Compose
docker-compose up -d

# Wait for databases to be ready (check health)
docker-compose ps

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

The API will be available at `http://localhost:8080`.

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration and database setup
│   ├── controllers/      # Request handlers
│   ├── models/           # TypeORM entities
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Helper functions
│   └── index.ts          # Entry point
├── tests/                # Test files
├── docker-compose.yml    # Local dev stack
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run migrate` | Run database migrations |
| `npm test` | Run tests |
| `npm run lint` | Lint code |

## API Endpoints

### Health Check

```
GET /health
```

### Documents

```
POST   /api/v1/documents/upload       # Upload document
GET    /api/v1/documents               # List documents
GET    /api/v1/documents/:id           # Get document
DELETE /api/v1/documents/:id           # Delete document
```

### Search

```
GET /api/v1/search?q=query              # Full-text search
GET /api/v1/search/semantic?q=query     # Semantic search
GET /api/v1/search/hybrid?q=query       # Hybrid search
```

## Database Services

### PostgreSQL

- **URL**: `localhost:5432`
- **Database**: `knowledge_db`
- **User/Password**: `postgres/postgres`

### Qdrant (Vector DB)

- **API**: `http://localhost:6333`
- **Dashboard**: `http://localhost:6333/dashboard`

### Neo4j (Graph DB)

- **Bolt**: `bolt://localhost:7687`
- **Browser**: `http://localhost:7474`
- **User/Password**: `neo4j/password`

### MinIO (Object Storage)

- **API**: `http://localhost:9000`
- **Console**: `http://localhost:9001`
- **User/Password**: `minioadmin/minioadmin`

## Development

### Running Tests

```bash
npm test
npm run test:watch
npm run test:coverage
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Reset all data
docker-compose down -v
```

### Database Migrations

```bash
# Run migrations
npm run migrate

# Connect to PostgreSQL
psql -h localhost -U postgres -d knowledge_db
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:

- `PORT` - API server port (default: 8080)
- `POSTGRES_HOST` - PostgreSQL host
- `QDRANT_URL` - Qdrant API URL
- `NEO4J_URI` - Neo4j connection string
- `MINIO_ENDPOINT` - MinIO endpoint
- `JWT_SECRET` - JWT signing secret

## License

MIT
