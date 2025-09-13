import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    timeout: process.env.CI ? 30000 : 10000, // Increased timeout for CI
    reporter: [
        [path.resolve(__dirname, 'playwright-reporter.mjs'), { outputDir: 'coverage_playwright' }],
        ['json', { outputFile: 'coverage_playwright/results.json' }]
    ],
    use: {
    /* Collect trace when retrying the failed test. */
        trace: 'on-first-retry',
        /* Collect coverage data */
        javaScriptCoverage: true,
        /* CI-specific settings */
        headless: !!process.env.CI,
        screenshot: 'only-on-failure',
        video: process.env.CI ? 'retain-on-failure' : 'off'
    },

    projects: [
        {
            name: 'electron-coverage',
            use: {
                ...devices['Desktop Chrome'],
                // Use Playwright's Chromium in CI, system Chrome locally
                ...(process.env.CI ? {} : { channel: 'chrome' })
            },
        },
    ],

    /* Configure global setup and teardown */
    // globalSetup: require.resolve('./__tests__/__main__/playwright-global-setup.mjs'),
    // globalTeardown: require.resolve('./__tests__/__main__/playwright-global-teardown.mjs'),
});