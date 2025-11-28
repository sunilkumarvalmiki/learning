import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import config from '../config.js';

// Custom metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success');
const searchLatency = new Trend('search_latency');
const semanticSearchLatency = new Trend('semantic_search_latency');
const hybridSearchLatency = new Trend('hybrid_search_latency');

export const options = {
    stages: config.stages.load,
    thresholds: {
        http_req_duration: [`p(50)<${config.thresholds.search.p50}`, `p(95)<${config.thresholds.search.p95}`, `p(99)<${config.thresholds.search.p99}`],
        http_req_failed: ['rate<0.01'],
        errors: ['rate<0.01'],
        success: ['rate>0.99'],
        search_latency: ['p(99)<500'],
        semantic_search_latency: ['p(99)<500'],
        hybrid_search_latency: ['p(99)<500'],
    },
};

// Search queries to test
const searchQueries = [
    'machine learning',
    'artificial intelligence',
    'data science',
    'neural networks',
    'deep learning',
    'natural language processing',
    'computer vision',
    'python programming',
    'javascript framework',
    'database optimization',
];

export default function () {
    // Get a random query
    const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];

    // Test full-text search
    const searchRes = http.get(`${config.baseURL}/api/v1/search?q=${encodeURIComponent(query)}`);

    const searchSuccess = check(searchRes, {
        'search status is 200': (r) => r.status === 200,
        'search has results': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.results !== undefined;
            } catch {
                return false;
            }
        },
        'search response time < 500ms': (r) => r.timings.duration < 500,
    });

    searchLatency.add(searchRes.timings.duration);
    errorRate.add(!searchSuccess);
    successRate.add(searchSuccess);

    sleep(0.5);

    // Test semantic search
    const semanticRes = http.get(`${config.baseURL}/api/v1/search/semantic?q=${encodeURIComponent(query)}`);

    const semanticSuccess = check(semanticRes, {
        'semantic search status is 200': (r) => r.status === 200,
        'semantic search has results': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.results !== undefined;
            } catch {
                return false;
            }
        },
        'semantic search response time < 500ms': (r) => r.timings.duration < 500,
    });

    semanticSearchLatency.add(semanticRes.timings.duration);
    errorRate.add(!semanticSuccess);
    successRate.add(semanticSuccess);

    sleep(0.5);

    // Test hybrid search
    const hybridRes = http.get(`${config.baseURL}/api/v1/search/hybrid?q=${encodeURIComponent(query)}`);

    const hybridSuccess = check(hybridRes, {
        'hybrid search status is 200': (r) => r.status === 200,
        'hybrid search has results': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.results !== undefined;
            } catch {
                return false;
            }
        },
        'hybrid search response time < 500ms': (r) => r.timings.duration < 500,
    });

    hybridSearchLatency.add(hybridRes.timings.duration);
    errorRate.add(!hybridSuccess);
    successRate.add(hybridSuccess);

    sleep(1);
}

export function handleSummary(data) {
    return {
        'stdout': JSON.stringify(data, null, 2),
        '../results/search-results.json': JSON.stringify(data),
    };
}
