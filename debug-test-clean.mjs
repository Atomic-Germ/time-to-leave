import { _electron as electron } from 'playwright';
import { rootDir } from './js/app-config.mjs';

async function debugTest() {
    console.log('1. Starting debug test...');
    
    try {
        console.log('2. Launching Electron app...');
        const electronApp = await electron.launch({
            args: ['main.mjs'],
            env: process.env,
            cwd: rootDir
        });
        
        console.log('3. App launched successfully, getting first window...');
        const window = await electronApp.firstWindow();
        
        // Set up console and error logging first
        window.on('console', msg => console.log('PAGE LOG:', msg.text()));
        window.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        
        // Also listen for unhandled promises and errors
        await window.evaluate(() => {
            window.addEventListener('error', (event) => {
                console.log('GLOBAL ERROR:', event.error?.message || event.message);
            });
            window.addEventListener('unhandledrejection', (event) => {
                console.log('UNHANDLED PROMISE REJECTION:', event.reason?.message || event.reason);
            });
        });
        
        console.log('4. Got first window, checking if it loaded...');
        
        const title = await window.title();
        console.log('5. Window title:', title);
        
        console.log('6. Getting page content to see what loaded...');
        const bodyText = await window.locator('body').textContent();
        console.log('7. Full body text:', bodyText);
        
        console.log('8. Getting HTML to see structure...');
        const htmlContent = await window.content();
        console.log('9. HTML content preview:', htmlContent.substring(0, 500));
        
        console.log('10. Looking for month-year element...');
        const monthYearElements = await window.locator('#month-year').count();
        console.log(`11. Number of #month-year elements found: ${monthYearElements}`);
        
        // Check if rendererApi is available
        const rendererApiExists = await window.evaluate(() => {
            return typeof window.rendererApi !== 'undefined';
        });
        console.log(`12. window.rendererApi exists: ${rendererApiExists}`);
        
        // Check if jQuery is available
        const jqueryExists = await window.evaluate(() => {
            return typeof window.$ !== 'undefined';
        });
        console.log(`13. jQuery ($) exists: ${jqueryExists}`);
        
        // Check specific rendererApi methods
        if (rendererApiExists) {
            const apiMethods = await window.evaluate(() => {
                return Object.keys(window.rendererApi);
            });
            console.log(`14. rendererApi methods: ${apiMethods.join(', ')}`);
        }
        
        // Wait for potential calendar initialization
        console.log('15. Waiting 3 seconds for calendar initialization...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for calendar elements after waiting
        const monthYearElementsAfter = await window.locator('#month-year').count();
        console.log(`16. Number of #month-year elements found after wait: ${monthYearElementsAfter}`);
        
        // Try waiting even longer and check again
        console.log('16.5. Waiting additional 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const monthYearElementsLonger = await window.locator('#month-year').count();
        console.log(`16.7. Number of #month-year elements found after 8 seconds total: ${monthYearElementsLonger}`);
        
        // Try to manually check calendar initialization
        console.log('17. Attempting to manually check calendar initialization...');
        const setupResult = await window.evaluate(() => {
            try {
                // Check if setupCalendar function exists
                if (typeof window.setupCalendar === 'function') {
                    return { hasSetupCalendar: true, setupCalled: 'Available but not called yet' };
                } else {
                    return { hasSetupCalendar: false, setupCalled: 'Function not available' };
                }
            } catch (error) {
                return { error: error.message };
            }
        });
        console.log('18. Calendar setup check:', JSON.stringify(setupResult, null, 2));
        
        // Check if the document ready function was called
        const documentReadyCheck = await window.evaluate(() => {
            return {
                readyState: document.readyState,
                jqueryReady: typeof $ !== 'undefined',
                hasCalendarContainer: document.querySelector('#calendar') !== null,
                hasMonthYear: document.querySelector('#month-year') !== null,
                hasMainContent: document.querySelector('#main-content') !== null
            };
        });
        console.log('19. Document state:', JSON.stringify(documentReadyCheck, null, 2));
        
        // Try to call getOriginalUserPreferences to see if that works
        const preferencesTest = await window.evaluate(async () => {
            try {
                const prefs = await window.rendererApi.getOriginalUserPreferences();
                return { 
                    success: true, 
                    prefsKeys: Object.keys(prefs || {}),
                    view: prefs?.view,
                    theme: prefs?.theme
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        console.log('20. Preferences test:', JSON.stringify(preferencesTest, null, 2));
        
        // Check if CalendarFactory is available (since calendar.js is a module)
        const calendarFactoryCheck = await window.evaluate(() => {
            return {
                hasCalendarFactory: typeof window.CalendarFactory !== 'undefined',
                hasGlobalCalendar: typeof window.calendar !== 'undefined',
                moduleLoadError: window.moduleLoadError || null
            };
        });
        console.log('21. Calendar module check:', JSON.stringify(calendarFactoryCheck, null, 2));
        
        // Check actual file paths and URL to debug module resolution
        const pathDebugInfo = await window.evaluate(() => {
            return {
                currentURL: window.location.href,
                baseURI: document.baseURI,
                documentURL: document.URL,
                origin: window.location.origin,
                pathname: window.location.pathname
            };
        });
        console.log('22. Path debug info:', JSON.stringify(pathDebugInfo, null, 2));
        
        // Try to manually trigger what the jQuery ready should do
        const manualTriggerTest = await window.evaluate(async () => {
            try {
                // Make setupCalendar available globally for testing
                if (typeof setupCalendar === 'undefined') {
                    window.manualTest = 'setupCalendar not available in global scope';
                    return { available: false, message: 'setupCalendar not in global scope' };
                } else {
                    return { available: true, message: 'setupCalendar is available' };
                }
            } catch (error) {
                return { available: false, error: error.message };
            }
        });
        console.log('23. Manual trigger test:', JSON.stringify(manualTriggerTest, null, 2));
        
        console.log('24. Cleaning up...');
        await window.close();
        await electronApp.close();
        
        console.log('25. Test completed successfully!');
        
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
}

debugTest();