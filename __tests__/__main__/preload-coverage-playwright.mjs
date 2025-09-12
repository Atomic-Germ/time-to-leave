/**
 * Enhanced Playwright-based coverage test for preload scripts
 * This captures coverage from the actual Electron renderer process
 */

import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import fs from 'fs';

test.describe('Enhanced Preload Script Coverage with Playwright', () =>
{
    let electronApp;
    let page;
    const coverageData = [];

    test.beforeEach(async() =>
    {
        // Launch Electron app with coverage enabled
        electronApp = await electron.launch({
            args: [path.join(process.cwd(), 'main.mjs')],
            env: {
                ...process.env,
                NODE_ENV: 'test',
                COVERAGE_ENABLED: 'true'
            }
        });

        page = await electronApp.firstWindow();

        // Enable JavaScript coverage with detailed options
        await page.coverage.startJSCoverage({
            includeRawScriptCoverage: true,
            reportAnonymousScripts: true,
            resetOnNavigation: false
        });

        // Wait for preload scripts to initialize
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000); // Give preload scripts time to execute
    });

    test.afterEach(async() =>
    {
        if (page)
        {
            // Collect coverage data
            const jsCoverage = await page.coverage.stopJSCoverage();

            // Filter and process preload script coverage
            const preloadCoverage = jsCoverage.filter(entry =>
                entry.url.includes('preload') ||
                entry.url.includes('renderer') ||
                entry.url.includes('bridge')
            );

            // Store coverage data for reporting
            coverageData.push(...preloadCoverage.map(coverage => ({
                url: coverage.url,
                source: coverage.text,
                ranges: coverage.ranges,
                timestamp: new Date().toISOString(),
                testName: test.info().title
            })));

            // Calculate and log coverage metrics
            preloadCoverage.forEach(coverage =>
            {
                // Handle cases where text might be undefined
                const totalChars = coverage.text ? coverage.text.length : 0;
                const ranges = coverage.ranges || [];
                const coveredChars = ranges.reduce((sum, range) =>
                    sum + (range.end - range.start), 0);
                const coveragePercent = totalChars > 0 ? ((coveredChars / totalChars) * 100).toFixed(2) : 0;

                console.log(`Coverage for ${coverage.url}: ${coveragePercent}% (${coveredChars}/${totalChars})`);

                // Log uncovered sections for debugging
                if (coveragePercent < 100)
                {
                    const uncoveredRanges = findUncoveredRanges(coverage.text, coverage.ranges);
                    console.log(`Uncovered sections: ${uncoveredRanges.length}`);
                }
            });

            // Save detailed coverage data
            await saveCoverageData(coverageData);
        }

        if (electronApp)
        {
            await electronApp.close();
        }
    });

    test('should capture comprehensive preload script execution coverage', async() =>
    {
        // Test calendar API exposed by preload
        const calendarApiResult = await page.evaluate(() =>
        {
            const results = {};

            if (window.calendarApi)
            {
                results.calendarApiAvailable = true;

                // Test various API methods to trigger coverage
                if (window.calendarApi.getLanguage)
                {
                    try
                    {
                        results.getLanguageResult = window.calendarApi.getLanguage();
                    }
                    catch (e)
                    {
                        results.getLanguageError = e.message;
                    }
                }

                if (window.calendarApi.changeLanguage)
                {
                    try
                    {
                        window.calendarApi.changeLanguage('en');
                        results.changeLanguageCalled = true;
                    }
                    catch (e)
                    {
                        results.changeLanguageError = e.message;
                    }
                }

                if (window.calendarApi.getUserPreferences)
                {
                    try
                    {
                        results.getUserPreferencesResult = window.calendarApi.getUserPreferences();
                    }
                    catch (e)
                    {
                        results.getUserPreferencesError = e.message;
                    }
                }
            }

            return results;
        });

        console.log('Calendar API Test Results:', calendarApiResult);
        expect(calendarApiResult.calendarApiAvailable).toBeTruthy();
    });

    test('should exercise preferences API through preload', async() =>
    {
        const preferencesResult = await page.evaluate(() =>
        {
            const results = {};

            if (window.preferencesApi)
            {
                results.preferencesApiAvailable = true;

                // Test preferences API methods
                if (window.preferencesApi.getUserPreferences)
                {
                    try
                    {
                        results.getUserPreferences = window.preferencesApi.getUserPreferences();
                    }
                    catch (e)
                    {
                        results.getUserPreferencesError = e.message;
                    }
                }

                if (window.preferencesApi.savePreferences)
                {
                    try
                    {
                        window.preferencesApi.savePreferences({
                            theme: 'light',
                            language: 'en',
                            notifications: true
                        });
                        results.savePreferencesCalled = true;
                    }
                    catch (e)
                    {
                        results.savePreferencesError = e.message;
                    }
                }

                // Test other API methods if available
                const apiMethods = Object.keys(window.preferencesApi);
                results.availableMethods = apiMethods;

                // Call each method to maximize coverage
                apiMethods.forEach(method =>
                {
                    if (typeof window.preferencesApi[method] === 'function' && method !== 'savePreferences')
                    {
                        try
                        {
                            window.preferencesApi[method]();
                            results[method + 'Called'] = true;
                        }
                        catch (e)
                        {
                            results[method + 'Error'] = e.message;
                        }
                    }
                });
            }

            return results;
        });

        console.log('Preferences API Test Results:', preferencesResult);
        expect(preferencesResult.preferencesApiAvailable).toBeTruthy();
    });

    test('should test IPC communication patterns', async() =>
    {
        const ipcResults = await page.evaluate(() =>
        {
            const results = {
                ipcCallsMade: 0,
                errors: []
            };

            // Test various IPC patterns that might be in preload scripts
            const testIpcCalls = [
                ['getLanguage'],
                ['getUserPreferences'],
                ['changeLanguage', 'es'],
                ['savePreferences', { test: true }],
                ['showDay', 2023, 11, 25],
                ['hasWaiver', '2023-12-25']
            ];

            testIpcCalls.forEach(([method, ...args]) =>
            {
                try
                {
                    // Try calendar API first
                    if (window.calendarApi && window.calendarApi[method])
                    {
                        window.calendarApi[method](...args);
                        results.ipcCallsMade++;
                    }
                    // Try preferences API
                    else if (window.preferencesApi && window.preferencesApi[method])
                    {
                        window.preferencesApi[method](...args);
                        results.ipcCallsMade++;
                    }
                    // Try workday waiver API if available
                    else if (window.workdayWaiverApi && window.workdayWaiverApi[method])
                    {
                        window.workdayWaiverApi[method](...args);
                        results.ipcCallsMade++;
                    }
                }
                catch (error)
                {
                    results.errors.push({ method, error: error.message });
                }
            });

            return results;
        });

        console.log('IPC Communication Results:', ipcResults);
        expect(ipcResults.ipcCallsMade).toBeGreaterThan(0);
    });

    test('should capture renderer bridge functionality', async() =>
    {
        const bridgeResults = await page.evaluate(() =>
        {
            const results = {
                availableAPIs: [],
                rendererApiAvailable: false
            };

            // Check for renderer API
            if (window.rendererApi)
            {
                results.rendererApiAvailable = true;
                results.availableAPIs.push('rendererApi');

                // Test renderer API methods
                const rendererMethods = Object.keys(window.rendererApi);
                results.rendererMethods = rendererMethods;

                rendererMethods.forEach(method =>
                {
                    if (typeof window.rendererApi[method] === 'function')
                    {
                        try
                        {
                            // Call methods that don't require parameters
                            if (method === 'getLanguage' || method === 'getUserPreferences')
                            {
                                window.rendererApi[method]();
                            }
                        }
                        catch
                        {
                            // Expected for some methods without proper context
                        }
                    }
                });
            }

            // Check for other exposed APIs
            ['calendarApi', 'preferencesApi', 'workdayWaiverApi'].forEach(apiName =>
            {
                if (window[apiName])
                {
                    results.availableAPIs.push(apiName);
                }
            });

            return results;
        });

        console.log('Bridge Functionality Results:', bridgeResults);
        expect(bridgeResults.availableAPIs.length).toBeGreaterThan(0);
    });
});

// Helper function to find uncovered ranges
function findUncoveredRanges(source, coveredRanges)
{
    const uncovered = [];
    let lastEnd = 0;

    coveredRanges.sort((a, b) => a.start - b.start);

    for (const range of coveredRanges)
    {
        if (range.start > lastEnd)
        {
            uncovered.push({ start: lastEnd, end: range.start });
        }
        lastEnd = Math.max(lastEnd, range.end);
    }

    if (lastEnd < source.length)
    {
        uncovered.push({ start: lastEnd, end: source.length });
    }

    return uncovered;
}

// Helper function to save coverage data
async function saveCoverageData(coverageData)
{
    const coverageDir = 'coverage_playwright';
    const coverageFile = path.join(coverageDir, 'preload-coverage.json');

    try
    {
        await fs.promises.mkdir(coverageDir, { recursive: true });
        await fs.promises.writeFile(coverageFile, JSON.stringify(coverageData, null, 2));
        console.log(`Coverage data saved to ${coverageFile}`);
    }
    catch (error)
    {
        console.error('Error saving coverage data:', error);
    }
}