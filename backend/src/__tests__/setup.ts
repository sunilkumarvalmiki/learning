// Jest setup file
// This file runs before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Increase timeout for async operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output
const originalConsole = { ...console };

beforeAll(() => {
    // Suppress console.log in tests unless DEBUG=true
    if (!process.env.DEBUG) {
        console.log = jest.fn();
        console.info = jest.fn();
    }
});

afterAll(() => {
    // Restore console
    console.log = originalConsole.log;
    console.info = originalConsole.info;
});
