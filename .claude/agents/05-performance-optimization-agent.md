# Performance Optimization Agent

## Mission
Achieve production-grade performance across all system components: API latency <500ms, search <500ms, UI interactions <300ms, and efficient resource utilization.

## Scope
- Backend API performance
- Database query optimization
- Frontend rendering performance
- Network optimization
- Caching strategies
- Load testing
- Performance monitoring

## Current State Assessment

### Strengths
- Async processing for documents
- Qdrant for fast vector search
- Modern tech stack (React 19, TypeScript)

### Performance Gaps
- No performance benchmarks
- No caching layer
- No CDN for static assets
- No database query optimization
- No connection pooling tuning
- No load testing
- No performance monitoring
- Bundle size unknown
- No compression enabled

## Research Areas

### 1. API Performance Optimization
**Sources:**
- Node.js Performance Best Practices
- Express.js performance tips
- Google Cloud Performance Guide
- High Performance Browser Networking (Ilya Grigorik)

**Focus areas:**
- Response time optimization
- Compression (gzip, brotli)
- Connection keep-alive
- HTTP/2 support
- Async/await best practices
- Event loop optimization
- Memory management

### 2. Caching Strategies
**Sources:**
- Redis caching patterns
- HTTP caching headers
- Cache invalidation strategies
- CDN best practices

**Focus areas:**
- Application-level caching (Redis)
- Database query result caching
- HTTP caching headers
- CDN configuration
- Cache invalidation
- Stale-while-revalidate

### 3. Database Performance
**Sources:**
- PostgreSQL Performance Tuning
- Qdrant optimization guide
- Database indexing strategies
- Query optimization techniques

**Focus areas:**
- Query execution plans
- Index optimization
- N+1 query elimination
- Connection pooling
- Read replicas
- Query result caching

### 4. Frontend Performance
**Sources:**
- Web Vitals documentation
- React Performance Optimization
- Lighthouse performance guide
- Chrome DevTools profiling

**Focus areas:**
- Bundle size optimization
- Code splitting
- Lazy loading
- Image optimization
- CSS optimization
- Runtime performance
- Core Web Vitals

### 5. Load Testing
**Sources:**
- Artillery.io documentation
- k6 load testing guide
- Apache JMeter best practices
- Load testing strategies

**Focus areas:**
- Load test scenarios
- Performance baselines
- Scalability testing
- Stress testing
- Spike testing
- Endurance testing

## Improvement Tasks

### Priority 1: Critical (Response Time & Throughput)

#### Task 1.1: API Performance Baseline
**Research:**
- Performance testing tools (Artillery, k6, Apache Bench)
- Metrics to track (latency percentiles, throughput)
- Baseline establishment methodology

**Implementation:**
- Install performance testing tool (k6 recommended)
- Create load test scenarios for all endpoints
- Establish performance baselines
- Document current performance metrics

**Files to create:**
- `performance-tests/api-load-tests.js`
- `performance-tests/scenarios/auth.js`
- `performance-tests/scenarios/documents.js`
- `performance-tests/scenarios/search.js`

**Acceptance criteria:**
- All endpoints benchmarked
- p50, p95, p99 latencies measured
- Throughput (req/sec) measured
- Baselines documented
- CI integration for regression testing

#### Task 1.2: Response Compression
**Research:**
- gzip vs brotli compression
- Compression middleware (compression package)
- Optimal compression levels
- Performance impact

**Implementation:**
- Add compression middleware
- Configure brotli for modern browsers
- Fallback to gzip for older browsers
- Exclude already-compressed content
- Measure compression ratio

**Files to modify:**
- `backend/src/index.ts` (add compression)
- `package.json` (add compression package)

**Acceptance criteria:**
- Brotli compression enabled
- Compression level: 6 (balanced)
- Response size reduced >60%
- Latency impact <10ms
- Proper Content-Encoding headers

#### Task 1.3: Database Query Optimization
**Research:**
- TypeORM query optimization
- EXPLAIN ANALYZE usage
- Query result caching
- Eager vs lazy loading

**Implementation:**
- Analyze slow queries (>100ms)
- Optimize N+1 queries
- Add selective eager loading
- Implement query result caching
- Add database query logging

**Files to modify:**
- All repository files
- `backend/src/config/database.ts` (logging)
- Update entity relations

**Acceptance criteria:**
- No N+1 queries
- All queries <100ms
- Eager loading where beneficial
- Query cache hit rate >50%
- Slow query logging enabled

### Priority 2: High (Caching & Resource Optimization)

#### Task 2.1: Implement Redis Caching
**Research:**
- Redis caching patterns
- Cache-aside pattern
- Time-to-live (TTL) strategies
- Cache invalidation patterns

**Implementation:**
- Add Redis to docker-compose
- Implement cache service
- Cache frequently accessed data (user profiles, search results)
- Implement cache invalidation
- Add cache hit/miss metrics

**Files to create:**
- `backend/src/services/CacheService.ts`
- `backend/src/config/redis.ts`

**Files to modify:**
- `docker-compose.yml` (add Redis)
- `backend/src/services/SearchService.ts` (cache search results)
- `backend/src/services/DocumentService.ts` (cache documents)

**Acceptance criteria:**
- Redis running in docker-compose
- CacheService with get/set/delete
- Search results cached (5 min TTL)
- User data cached (30 min TTL)
- Cache hit rate >40%
- Cache invalidation on updates

#### Task 2.2: HTTP Caching Headers
**Research:**
- HTTP caching best practices
- Cache-Control directives
- ETag vs Last-Modified
- Stale-while-revalidate

**Implementation:**
- Add proper Cache-Control headers
- Implement ETags for static content
- Configure browser caching
- Add Vary header for content negotiation

**Files to modify:**
- `backend/src/index.ts` (caching middleware)
- Static file serving configuration

**Acceptance criteria:**
- Static assets: Cache-Control max-age=31536000
- API responses: appropriate caching
- ETags on GET responses
- Vary header configured
- Lighthouse caching score >90

#### Task 2.3: Connection Pooling Optimization
**Research:**
- Database connection pool sizing
- Pool size calculation formulas
- Connection leak detection
- Pool monitoring

**Implementation:**
- Optimize PostgreSQL pool size
- Configure timeout settings
- Add pool monitoring
- Detect connection leaks
- Configure Redis connection pooling

**Files to modify:**
- `backend/src/config/database.ts`
- `backend/src/config/redis.ts`

**Acceptance criteria:**
- Pool size optimized (min: 5, max: 20)
- Connection timeout: 10s
- Idle timeout: 60s
- Pool saturation alerts
- No connection leaks

### Priority 3: Medium (Frontend & Network Optimization)

#### Task 3.1: Bundle Size Optimization
**Research:**
- Vite bundle analysis
- Tree shaking
- Code splitting strategies
- Dynamic imports

**Implementation:**
- Analyze bundle size
- Implement code splitting
- Lazy load routes and components
- Remove unused dependencies
- Optimize imports

**Files to modify:**
- `ai-knowledge-ui/vite.config.ts` (bundle analysis)
- `ai-knowledge-system/vite.config.ts`
- Add dynamic imports for routes

**Acceptance criteria:**
- Main bundle <150KB (gzipped)
- Code splitting implemented
- Lazy loading for routes
- Tree shaking verified
- Dependencies pruned

#### Task 3.2: Image Optimization
**Research:**
- WebP format advantages
- Responsive images (srcset)
- Lazy loading images
- Image CDN

**Implementation:**
- Convert images to WebP
- Implement lazy loading
- Add responsive images
- Optimize image sizes
- Consider image CDN

**Files to modify:**
- Replace all image assets
- Update image components

**Acceptance criteria:**
- Images in WebP format
- Lazy loading implemented
- Proper alt text (a11y)
- Lighthouse image score >90
- Loading="lazy" attribute used

#### Task 3.3: Frontend Performance Monitoring
**Research:**
- Core Web Vitals
- React Profiler
- Performance API
- User-centric metrics

**Implementation:**
- Measure Core Web Vitals
- Add performance monitoring
- Track component render time
- Monitor bundle loading
- Send metrics to backend (optional)

**Files to create:**
- `ai-knowledge-system/src/utils/performance.ts`

**Acceptance criteria:**
- Core Web Vitals tracked
- LCP <2.5s
- FID <100ms
- CLS <0.1
- Performance dashboard (optional)

### Priority 4: Low (Advanced Optimization)

#### Task 4.1: HTTP/2 Support
**Research:**
- HTTP/2 advantages
- Server Push
- Multiplexing benefits
- TLS requirement

**Implementation:**
- Configure HTTP/2 support
- Update reverse proxy (if used)
- Test with modern browsers
- Measure performance improvement

**Files to modify:**
- Server configuration or reverse proxy

**Acceptance criteria:**
- HTTP/2 enabled
- No server push (deprecated)
- Multiplexing working
- Performance improvement measured

#### Task 4.2: CDN Integration (Optional)
**Research:**
- CDN providers (Cloudflare, AWS CloudFront)
- Edge caching strategies
- Static asset serving
- Cost-benefit analysis

**Implementation:**
- Evaluate CDN options
- Configure CDN for static assets
- Implement cache invalidation
- Monitor CDN performance

**Files to modify:**
- Build scripts for CDN deployment

**Acceptance criteria:**
- Static assets served from CDN
- Cache hit ratio >80%
- Global latency <100ms
- Cost effective

#### Task 4.3: Database Read Replicas (Future)
**Research:**
- PostgreSQL replication
- Read replica strategies
- Load balancing
- Replication lag monitoring

**Implementation:**
- Set up read replica
- Configure read/write routing
- Monitor replication lag
- Implement failover

**Files to modify:**
- `backend/src/config/database.ts` (multi-host)

**Acceptance criteria:**
- Read replica operational
- Read queries routed to replica
- Replication lag <1s
- Automatic failover tested

## Load Testing Scenarios

### Scenario 1: Authentication Load
```javascript
// k6 script
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up
    { duration: '3m', target: 50 },   // Steady state
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% < 500ms
  },
};

export default function () {
  let res = http.post('http://localhost:8080/api/v1/auth/login', {
    email: 'test@example.com',
    password: 'password123',
  });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

### Scenario 2: Search Load
```javascript
// Test semantic search under load
export default function () {
  let res = http.get('http://localhost:8080/api/v1/search/semantic?q=machine+learning', {
    headers: { 'Authorization': `Bearer ${__ENV.TOKEN}` },
  });
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(2);
}
```

### Scenario 3: Document Upload
```javascript
// Test file upload performance
import http from 'k6/http';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

export default function () {
  const formData = new FormData();
  formData.append('file', http.file(open('/path/to/test.pdf'), 'test.pdf'));
  formData.append('title', 'Test Document');

  let res = http.post('http://localhost:8080/api/v1/documents/upload', formData.body(), {
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + formData.boundary,
      'Authorization': `Bearer ${__ENV.TOKEN}`,
    },
  });
  check(res, { 'status is 201': (r) => r.status === 201 });
}
```

## Performance Budget

Set and enforce performance budgets:

### Backend API
- p50 latency: <100ms
- p95 latency: <300ms
- p99 latency: <500ms
- Throughput: >1000 req/sec
- Error rate: <0.1%

### Database
- Query p99: <100ms
- Connection pool usage: <80%
- Cache hit ratio: >50%
- Replication lag: <1s (if applicable)

### Frontend
- Bundle size: <150KB (gzipped)
- LCP: <2.5s
- FID: <100ms
- CLS: <0.1
- Time to Interactive: <3s

### Network
- Response size reduction: >60% (compressed)
- Cache hit ratio: >40%
- CDN hit ratio: >80% (if applicable)

## Monitoring & Alerting

### Metrics to Track
- Response time percentiles (p50, p95, p99)
- Throughput (requests per second)
- Error rate
- Cache hit ratio
- Database query time
- Connection pool usage
- Memory usage
- CPU usage
- Disk I/O

### Alert Thresholds
- p99 latency >500ms
- Error rate >1%
- Cache hit ratio <30%
- Connection pool saturation >90%
- Memory usage >80%

## Validation Checklist

- [ ] Performance baselines established
- [ ] Load tests passing
- [ ] Compression enabled
- [ ] Caching implemented
- [ ] Query optimization complete
- [ ] Bundle size optimized
- [ ] Core Web Vitals meet targets
- [ ] Performance monitoring in place

## Success Metrics

### Before (Estimated)
- API p99: Unknown
- Search p99: Unknown
- Bundle size: Unknown
- Cache: None
- Compression: None

### Target
- API p99: <500ms
- Search p99: <500ms
- Bundle size: <150KB
- Cache hit ratio: >40%
- Compression: >60% reduction
- Throughput: >1000 req/sec

## Output Report

```markdown
## Performance Optimization Agent Report

### Performance Improvements
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| API p99 | XXms | YYms | -NN% |
| Search p99 | XXms | YYms | -NN% |
| Bundle Size | XXkB | YYkB | -NN% |
| Response Size | XXkB | YYkB | -NN% (compressed) |
| Throughput | XX req/s | YY req/s | +NN% |

### Optimizations Implemented
- Response compression: ✓ (brotli/gzip)
- Caching layer: ✓ (Redis)
- Query optimization: ✓
- Bundle optimization: ✓
- Image optimization: ✓
- Connection pooling: ✓

### Load Testing Results
- Authentication: ✓ (p99 <500ms)
- Search: ✓ (p99 <500ms)
- Document upload: ✓ (p99 <2s)
- Concurrent users tested: N
- Throughput achieved: N req/s

### Core Web Vitals
- LCP: <2.5s ✓
- FID: <100ms ✓
- CLS: <0.1 ✓
- Lighthouse Performance: XX

### Next Priorities
1. CDN integration
2. Read replicas
3. Further bundle optimization
```

---

**Status**: Ready to execute
**Priority**: P1 - Critical
**Estimated Time**: 5-7 hours
**Dependencies**: Backend, Database agents
**Version**: 1.0
