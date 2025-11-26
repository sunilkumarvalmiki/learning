// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const config = {
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
};

// Default user ID for MVP (will be replaced with auth)
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';
