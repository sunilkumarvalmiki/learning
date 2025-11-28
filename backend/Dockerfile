# Multi-stage build for optimized production image
# Stage 1: Build dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install security updates
RUN apk upgrade --no-cache && \
    apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY src ./src

# Build TypeScript
ENV NODE_ENV=production
RUN npm run build && \
    # Remove source maps in production
    find dist -name "*.map" -type f -delete

# Stage 3: Production runtime
FROM node:20-alpine AS runner

# Install security updates and runtime dependencies
RUN apk upgrade --no-cache && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create non-root user with specific UID/GID
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Add labels for metadata
LABEL maintainer="AI Knowledge Team" \
      version="1.0.0" \
      description="AI Knowledge Management System - Backend API"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start server
CMD ["node", "dist/index.js"]
