# Performance Tests

This directory contains k6 load tests for the AI Knowledge Management System.

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Running Tests

### Health Check Test
```bash
k6 run scenarios/health.js
```

### Authentication Load Test
```bash
k6 run scenarios/auth.js
```

### Search Performance Test
```bash
k6 run scenarios/search.js
```

### Custom Configuration
```bash
# Override base URL
BASE_URL=http://api.example.com k6 run scenarios/search.js

# Run with custom VUs and duration
k6 run --vus 100 --duration 30s scenarios/health.js
```

## Test Scenarios

### 1. Health Check (health.js)
- **Purpose**: Test system availability and basic response time
- **Load**: Stress test with up to 200 concurrent users
- **Thresholds**: p99 < 300ms, error rate < 0.1%

### 2. Authentication (auth.js)
- **Purpose**: Test login and authentication endpoints
- **Load**: Load test with 50 concurrent users
- **Thresholds**: p99 < 500ms, error rate < 1%

### 3. Search (search.js)
- **Purpose**: Test search endpoints (full-text, semantic, hybrid)
- **Load**: Load test with 50 concurrent users
- **Thresholds**: p99 < 500ms per search type

## Performance Targets

### API Endpoints
- p50 (median): < 100ms
- p95: < 300ms
- p99: < 500ms
- Error rate: < 1%
- Throughput: > 1000 req/s

### Search Endpoints
- p50: < 150ms
- p95: < 400ms
- p99: < 500ms
- Error rate: < 1%

## Results

Test results are saved in the `results/` directory as JSON files:
- `health-results.json`
- `auth-results.json`
- `search-results.json`

## Interpreting Results

Key metrics to monitor:
- `http_req_duration`: Request duration percentiles
- `http_req_failed`: Failed requests rate
- `http_reqs`: Total requests per second
- `iterations`: Completed iterations per second
- Custom metrics (search_latency, etc.)

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run Performance Tests
  run: |
    k6 run --out json=results.json scenarios/health.js
    k6 run --out json=results.json scenarios/search.js
```
