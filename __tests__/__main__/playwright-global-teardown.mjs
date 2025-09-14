/**
 * Playwright global teardown for Electron coverage testing
 */

async function globalTeardown()
{
    console.log('Playwright global teardown complete');
}

export default globalTeardown;