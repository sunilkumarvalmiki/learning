import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import config from '../config.js';

// Custom metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success');

export const options = {
    stages: config.stages.load,
    thresholds: {
        http_req_duration: [`p(50)<${config.thresholds.api.p50}`, `p(95)<${config.thresholds.api.p95}`, `p(99)<${config.thresholds.api.p99}`],
        http_req_failed: ['rate<0.01'], // Error rate < 1%
        errors: ['rate<0.01'],
        success: ['rate>0.99'],
    },
};

export default function () {
    const testUser = config.testUsers[Math.floor(Math.random() * config.testUsers.length)];

    // Test login endpoint
    const loginPayload = JSON.stringify({
        email: testUser.email,
        password: testUser.password,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const loginRes = http.post(`${config.baseURL}/api/v1/auth/login`, loginPayload, params);

    const loginSuccess = check(loginRes, {
        'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
        'login has response body': (r) => r.body.length > 0,
        'login response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!loginSuccess);
    successRate.add(loginSuccess);

    if (loginRes.status === 200) {
        const token = JSON.parse(loginRes.body).token;

        // Test authenticated endpoint
        const meParams = {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        };

        const meRes = http.get(`${config.baseURL}/api/v1/auth/me`, meParams);

        const meSuccess = check(meRes, {
            'me status is 200': (r) => r.status === 200,
            'me has user data': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.email !== undefined;
                } catch {
                    return false;
                }
            },
            'me response time < 300ms': (r) => r.timings.duration < 300,
        });

        errorRate.add(!meSuccess);
        successRate.add(meSuccess);
    }

    sleep(1);
}

export function handleSummary(data) {
    return {
        'stdout': JSON.stringify(data, null, 2),
        '../results/auth-results.json': JSON.stringify(data),
    };
}
