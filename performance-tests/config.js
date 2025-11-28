// k6 performance test configuration
export const config = {
    baseURL: __ENV.BASE_URL || 'http://localhost:8080',

    // Test users for authentication
    testUsers: [
        { email: 'test1@example.com', password: 'Test123456!' },
        { email: 'test2@example.com', password: 'Test123456!' },
        { email: 'test3@example.com', password: 'Test123456!' },
    ],

    // Performance thresholds
    thresholds: {
        api: {
            p50: 100,  // 50th percentile < 100ms
            p95: 300,  // 95th percentile < 300ms
            p99: 500,  // 99th percentile < 500ms
        },
        search: {
            p50: 150,  // 50th percentile < 150ms
            p95: 400,  // 95th percentile < 400ms
            p99: 500,  // 99th percentile < 500ms
        },
    },

    // Load test stages
    stages: {
        // Smoke test
        smoke: [
            { duration: '30s', target: 1 },
        ],

        // Load test
        load: [
            { duration: '1m', target: 50 },   // Ramp up to 50 users
            { duration: '3m', target: 50 },   // Steady state
            { duration: '1m', target: 0 },    // Ramp down
        ],

        // Stress test
        stress: [
            { duration: '2m', target: 100 },  // Ramp up to 100 users
            { duration: '3m', target: 100 },  // Steady state
            { duration: '2m', target: 200 },  // Push to 200
            { duration: '1m', target: 0 },    // Ramp down
        ],

        // Spike test
        spike: [
            { duration: '30s', target: 50 },  // Normal load
            { duration: '1m', target: 500 },  // Spike!
            { duration: '30s', target: 50 },  // Back to normal
            { duration: '30s', target: 0 },   // Ramp down
        ],
    },
};

export default config;
