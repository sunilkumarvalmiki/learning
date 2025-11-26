import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/ui',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',

    use: {
        baseURL: 'http://localhost:1420',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Don't start dev server - Tauri dev should already be running
    // webServer: {
    //   command: 'pnpm tauri dev',
    //   url: 'http://localhost:1420',
    //   timeout: 120000,
    //   reuseExistingServer: true,
    // },
});
