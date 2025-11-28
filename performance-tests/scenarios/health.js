import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import config from '../config.js';

// Custom metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success');

export const options = {
    stages: config.stages.stress,
    thresholds: {
        http_req_duration: ['p(50)<50', 'p(95)<150', 'p(99)<300'],
        http_req_failed: ['rate<0.001'], // Error rate < 0.1%
        errors: ['rate<0.001'],
        success: ['rate>0.999'],
    },
};

export default function () {
    // Test health endpoint
    const healthRes = http.get(`${config.baseURL}/health`);

    const success = check(healthRes, {
        'health status is 200': (r) => r.status === 200,
        'health has status field': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.status === 'ok';
            } catch {
                return false;
            }
        },
        'health response time < 100ms': (r) => r.timings.duration < 100,
    });

    errorRate.add(!success);
    successRate.add(success);

    // Very short sleep for high RPS
    sleep(0.1);
}

export function handleSummary(data) {
    return {
        'stdout': JSON.stringify(data, null, 2),
        '../results/health-results.json': JSON.stringify(data),
    };
}
