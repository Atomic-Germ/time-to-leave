import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Electron coverage testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: '../__tests__/__main__',
    testMatch: '*-playwright.mjs',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // Electron tests should run sequentially
    reporter: [
        ['html', { outputFolder: 'coverage_playwright/html-report' }],
        ['json', { outputFile: 'coverage_playwright/results.json' }]
    ],
    use: {
    /* Collect trace when retrying the failed test. */
        trace: 'on-first-retry',
        /* Collect coverage data */
        javaScriptCoverage: true,
    },

    projects: [
        {
            name: 'electron-coverage',
            use: {
                ...devices['Desktop Chrome'],
                channel: 'chrome' // Use system Chrome for Electron testing
            },
        },
    ],

    /* Configure global setup and teardown */
    // globalSetup: require.resolve('./__tests__/__main__/playwright-global-setup.mjs'),
    // globalTeardown: require.resolve('./__tests__/__main__/playwright-global-teardown.mjs'),
});