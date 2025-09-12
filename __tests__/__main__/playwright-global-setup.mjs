/**
 * Playwright global setup for Electron coverage testing
 */

import path from 'path';

async function globalSetup()
{
    console.log('Starting Playwright global setup for Electron coverage...');

    // Store Electron app path for tests
    process.env.ELECTRON_APP_PATH = path.join(process.cwd(), 'main.mjs');

    console.log('Playwright setup complete');
}

export default globalSetup;