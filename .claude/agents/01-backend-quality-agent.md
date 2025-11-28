# Backend Quality Agent

## Mission
Ensure the Node.js/TypeScript backend achieves production-grade quality through comprehensive testing, security hardening, performance optimization, and code excellence.

## Scope
- `/backend/` directory
- API endpoints (Express.js)
- Services layer
- Database models (TypeORM)
- Middleware
- Configuration
- Tests

## Current State Assessment

### Strengths
- TypeScript with strict mode
- Express.js framework
- 4 databases integrated (PostgreSQL, Qdrant, Neo4j, MinIO)
- JWT authentication
- Basic error handling
- Docker compose setup

### Gaps Identified
- Only 3 test files (low coverage)
- No integration tests
- No API documentation (Swagger)
- No rate limiting
- No request validation schemas
- Limited error monitoring
- 1 TODO comment in code
- No performance monitoring

## Research Areas

### 1. API Best Practices (2024-2025)
**Sources to research:**
- Express.js Best Practices Guide
- Node.js Best Practices (goldbergyoni/nodebestpractices repo)
- Stripe API Design Guide
- Google Cloud API Design Guide
- RESTful API Design (Microsoft)

**Focus areas:**
- Request validation (Zod, Joi, class-validator)
- Response formatting consistency
- Error handling patterns
- API versioning strategies
- Rate limiting (express-rate-limit, rate-limiter-flexible)
- Request logging (morgan, pino)
- CORS configuration
- Security headers (helmet)

### 2. Testing Strategies
**Sources:**
- Jest documentation
- Supertest for API testing
- Testing Node.js applications (Kent C. Dodds)
- Martin Fowler - Test Pyramid

**Focus areas:**
- Unit tests (services, utilities)
- Integration tests (API endpoints)
- Database mocking (jest-mock-extended, pg-mem)
- Test fixtures and factories
- Coverage targets (80%+)
- Test organization patterns

### 3. Security Hardening
**Sources:**
- OWASP Top 10 2021
- OWASP API Security Top 10
- Snyk security best practices
- npm audit best practices

**Focus areas:**
- Input sanitization
- SQL injection prevention
- XSS prevention
- CSRF protection
- JWT best practices
- Password policy enforcement
- Secrets management
- Dependency scanning

### 4. Performance Optimization
**Sources:**
- Node.js Performance Best Practices
- PostgreSQL Query Optimization
- Database connection pooling
- Caching strategies (Redis)

**Focus areas:**
- API response time monitoring
- Database query optimization
- N+1 query prevention
- Connection pooling configuration
- Caching layer implementation
- Async/await best practices
- Memory leak detection

### 5. Error Handling & Monitoring
**Sources:**
- Sentry documentation
- Winston logging best practices
- Error handling in Express (official docs)

**Focus areas:**
- Centralized error handler
- Structured logging (JSON format)
- Error tracking (Sentry, optional)
- Request ID tracking
- Stack trace sanitization

## Improvement Tasks

### Priority 1: Critical (Security & Stability)

#### Task 1.1: Implement Request Validation
**Research:**
- Compare Zod vs Joi vs class-validator
- Find best practices for Express validation middleware
- Review TypeScript integration patterns

**Implementation:**
- Create validation schemas for all API endpoints
- Add validation middleware
- Return proper 400 errors with details
- Update API tests

**Files to modify:**
- Create `src/validation/schemas/`
- Update `src/routes/*.ts`
- Add `src/middleware/validation.ts`

**Acceptance criteria:**
- All POST/PATCH endpoints validated
- User-friendly error messages
- Schema reuse across endpoints
- TypeScript types derived from schemas

#### Task 1.2: Add Rate Limiting
**Research:**
- express-rate-limit vs rate-limiter-flexible
- Rate limiting strategies (per-IP, per-user, per-endpoint)
- Redis-backed rate limiting for distributed systems

**Implementation:**
- Add rate limiting middleware
- Configure different limits per endpoint type
- Add rate limit headers to responses
- Document rate limits in API docs

**Files to modify:**
- Create `src/middleware/rateLimiter.ts`
- Update `src/index.ts`
- Update `src/routes/*.ts`

**Acceptance criteria:**
- Global rate limit: 100 req/15min per IP
- Auth endpoints: 5 req/15min per IP
- Search endpoints: 30 req/min per user
- Proper 429 responses with Retry-After header

#### Task 1.3: Security Audit & Hardening
**Research:**
- Run `npm audit` and analyze
- Review OWASP API Security Top 10
- Check helmet.js configuration
- Review JWT implementation

**Implementation:**
- Fix all npm vulnerabilities
- Enhance helmet.js config
- Add input sanitization
- Implement CSRF protection (if needed)
- Add security.txt file
- Review CORS configuration

**Files to modify:**
- `package.json` (update dependencies)
- `src/index.ts` (helmet config)
- Add `src/middleware/sanitize.ts`
- Create `public/.well-known/security.txt`

**Acceptance criteria:**
- Zero high/critical vulnerabilities
- Security headers properly configured
- XSS prevention enabled
- SQL injection impossible (parameterized queries)
- JWT secrets strong and env-based

### Priority 2: High (Testing & Quality)

#### Task 2.1: Comprehensive Integration Tests
**Research:**
- Supertest best practices
- Database test isolation strategies
- Test fixtures and factories
- Test coverage tools

**Implementation:**
- Create integration tests for ALL API endpoints
- Set up test database
- Create test fixtures
- Add pre/post test cleanup
- Configure coverage reporting

**Files to create:**
- `src/__tests__/integration/auth.integration.test.ts`
- `src/__tests__/integration/documents.integration.test.ts`
- `src/__tests__/integration/search.integration.test.ts`
- `src/__tests__/fixtures/`
- `src/__tests__/helpers/testDb.ts`

**Acceptance criteria:**
- All 13+ endpoints tested
- Happy path and error cases covered
- Test coverage >80%
- Tests run isolated
- CI integration

#### Task 2.2: Unit Test Expansion
**Research:**
- Jest mocking best practices
- Testing TypeORM entities
- Testing async services

**Implementation:**
- Add unit tests for all services
- Test all middleware
- Test utility functions
- Mock external dependencies (databases, APIs)

**Files to create:**
- `src/__tests__/services/DocumentService.test.ts`
- `src/__tests__/services/SearchService.test.ts`
- `src/__tests__/services/AuthService.test.ts`
- `src/__tests__/middleware/*.test.ts`

**Acceptance criteria:**
- Each service has comprehensive tests
- External dependencies mocked
- Edge cases covered
- Fast test execution (<10s total)

#### Task 2.3: API Documentation (OpenAPI/Swagger)
**Research:**
- swagger-jsdoc vs tsoa vs @nestjs/swagger
- OpenAPI 3.1 specification
- API documentation best practices

**Implementation:**
- Add Swagger/OpenAPI documentation
- Generate from code annotations
- Add interactive API explorer
- Include request/response examples

**Files to create:**
- `src/swagger/swagger.config.ts`
- `src/swagger/swagger.ts`
- Update route files with annotations

**Files to modify:**
- `src/index.ts` (add swagger endpoint)
- `package.json` (add swagger dependencies)

**Acceptance criteria:**
- All endpoints documented
- Request/response schemas defined
- Interactive UI at `/api-docs`
- Export OpenAPI JSON spec

### Priority 3: Medium (Performance & Monitoring)

#### Task 3.1: Performance Monitoring
**Research:**
- prom-client for Prometheus metrics
- Response time tracking
- Database query performance
- Memory profiling

**Implementation:**
- Add Prometheus metrics endpoint
- Track API response times
- Monitor database query performance
- Add health check with database status

**Files to create:**
- `src/monitoring/metrics.ts`
- `src/monitoring/healthCheck.ts`

**Files to modify:**
- `src/index.ts` (add metrics middleware)
- `src/routes/index.ts` (enhance health endpoint)

**Acceptance criteria:**
- `/metrics` endpoint with Prometheus format
- Request duration histogram
- Database connection pool metrics
- Memory usage tracking
- `/health` shows all database statuses

#### Task 3.2: Structured Logging
**Research:**
- Winston vs Pino performance
- JSON structured logging
- Log correlation (request IDs)
- Log levels best practices

**Implementation:**
- Enhance Winston configuration
- Add request ID middleware
- Structured JSON logging
- Log rotation configuration
- Environment-based log levels

**Files to modify:**
- `src/config/logger.ts`
- Create `src/middleware/requestId.ts`
- Update all services to use structured logs

**Acceptance criteria:**
- All logs in JSON format
- Request ID in all logs
- Appropriate log levels used
- PII data excluded from logs
- Production logs to file + stdout

#### Task 3.3: Database Query Optimization
**Research:**
- TypeORM query optimization
- PostgreSQL EXPLAIN ANALYZE
- N+1 query detection
- Connection pooling best practices

**Implementation:**
- Review all database queries
- Add missing indexes
- Eliminate N+1 queries
- Configure connection pooling
- Add query logging in development

**Files to modify:**
- `src/config/database.ts` (connection pooling)
- Update entity relations for eager loading
- Add database indexes in migrations

**Acceptance criteria:**
- No N+1 queries
- All foreign keys indexed
- Full-text search indexes optimized
- Connection pool configured (min: 2, max: 10)
- Slow query logging enabled

### Priority 4: Low (Code Quality & Maintenance)

#### Task 4.1: Code Quality Improvements
**Research:**
- SonarQube Node.js rules
- Cyclomatic complexity thresholds
- Code duplication detection

**Implementation:**
- Fix TODO comment
- Extract duplicated code
- Reduce function complexity
- Add JSDoc comments
- Consistent naming conventions

**Files to review:**
- All files in `src/services/`
- All files in `src/controllers/`

**Acceptance criteria:**
- No TODO comments
- Functions <50 lines
- Cyclomatic complexity <10
- JSDoc on public APIs
- ESLint passing with no warnings

#### Task 4.2: Error Handling Enhancement
**Research:**
- Custom error classes
- Error serialization
- HTTP status code mapping

**Implementation:**
- Create custom error classes
- Centralized error handler
- Consistent error responses
- Error codes for debugging

**Files to create:**
- `src/errors/CustomErrors.ts`
- `src/middleware/errorHandler.ts`

**Files to modify:**
- All services (throw custom errors)
- `src/index.ts` (use error handler)

**Acceptance criteria:**
- All errors extend base error class
- Consistent error response format
- Error codes for all error types
- Stack traces only in development

## Implementation Checklist

For each task above:
- [ ] Research best practices and find 3+ authoritative sources
- [ ] Document research findings
- [ ] Create implementation plan
- [ ] Write tests FIRST (TDD when possible)
- [ ] Implement changes
- [ ] Run all tests (must pass)
- [ ] Update documentation
- [ ] Code review (self-review checklist)
- [ ] Commit with descriptive message

## Research Template

For each research area:

```markdown
### Research: [Topic]

**Date**: YYYY-MM-DD

**Sources**:
1. [Source 1 name + URL]
2. [Source 2 name + URL]
3. [Source 3 name + URL]

**Key Findings**:
- [Finding 1]
- [Finding 2]
- [Finding 3]

**Best Practices**:
1. [Practice 1]
2. [Practice 2]
3. [Practice 3]

**Implementation Approach**:
- [Chosen approach based on research]
- [Rationale for choice]

**Example Code** (from research):
```typescript
// Example from [Source]
```

**Adaptation for Our Project**:
- [How to apply to our specific case]
```

## Testing Strategy

### Unit Tests
- Mock all external dependencies
- Test each service method independently
- Test edge cases and error conditions
- Fast execution (<1ms per test)

### Integration Tests
- Use test database (isolated)
- Test full request/response cycle
- Test authentication flows
- Test database interactions
- Clean up after each test

### Test Coverage Goals
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

## Validation Checklist

Before marking agent execution complete:
- [ ] All tests passing (npm test)
- [ ] No ESLint errors (npm run lint)
- [ ] No TypeScript errors (npm run type-check)
- [ ] Test coverage >80%
- [ ] No security vulnerabilities (npm audit)
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] No breaking changes (or documented)

## Success Metrics

Track improvements:

### Before
- Test files: 3
- Test cases: 48
- Coverage: ~40% (estimated)
- Vulnerabilities: 0 (good!)
- API docs: None
- Rate limiting: None
- Request validation: Minimal

### Target
- Test files: 15+
- Test cases: 200+
- Coverage: >80%
- Vulnerabilities: 0
- API docs: Complete (Swagger)
- Rate limiting: Implemented
- Request validation: All endpoints

## Output

At completion, generate:

```markdown
## Backend Quality Agent Report

### Execution Date
YYYY-MM-DD

### Tasks Completed
- [List of completed tasks with status]

### Research Summary
- [Key insights from research]

### Improvements Implemented
1. [Improvement 1 - file paths affected]
2. [Improvement 2 - file paths affected]
...

### Tests Added
- Integration tests: N files, M test cases
- Unit tests: N files, M test cases
- Total coverage: XX%

### Metrics Improvements
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Test Coverage | 40% | 85% | +45% |
| Test Files | 3 | 18 | +15 |
| API Endpoints Documented | 0 | 13 | +13 |
| Vulnerabilities | 0 | 0 | 0 |

### Next Iteration Priorities
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

### Blockers
- [Any blockers encountered]
```

---

**Status**: Ready to execute
**Priority**: P1 - Critical
**Estimated Time**: 4-6 hours
**Dependencies**: None
**Version**: 1.0
