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
        
        // Listen for console errors
        window.on('console', msg => {
            console.log('BROWSER CONSOLE:', msg.type(), msg.text());
        });
        
        window.on('pageerror', err => {
            console.log('PAGE ERROR:', err);
        });
        
    console.log('3. Got first window, checking if it loaded...');
    
    // Set up console and error logging first
    window.on('console', msg => console.log('PAGE LOG:', msg.text()));
    window.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    const title = await window.title();
    console.log('4. Window title:', title);
    
    console.log('5. Getting page content to see what loaded...');
    const bodyText = await window.locator('body').textContent();
    console.log('6. Full body text:', bodyText);
    
    console.log('7. Getting HTML to see structure...');
    const htmlContent = await window.content();
    console.log('8. HTML content preview:', htmlContent.substring(0, 500));
    
    console.log('9. Looking for month-year element...');
    const monthYearElements = await window.locator('#month-year').count();
    console.log(`10. Number of #month-year elements found: ${monthYearElements}`);
    
    // Check if rendererApi is available
    const rendererApiExists = await window.evaluate(() => {
        return typeof window.rendererApi !== 'undefined';
    });
    console.log(`11. window.rendererApi exists: ${rendererApiExists}`);
    
    // Check if jQuery is available
    const jqueryExists = await window.evaluate(() => {
        return typeof window.$ !== 'undefined';
    });
    console.log(`12. jQuery ($) exists: ${jqueryExists}`);
    
    // Check specific rendererApi methods
    if (rendererApiExists) {
        const apiMethods = await window.evaluate(() => {
            return Object.keys(window.rendererApi);
        });
        console.log(`13. rendererApi methods: ${apiMethods.join(', ')}`);
    }
    
    // Wait for potential calendar initialization
    console.log('14. Waiting 3 seconds for calendar initialization...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for calendar elements after waiting
    const monthYearElementsAfter = await window.locator('#month-year').count();
    console.log(`15. Number of #month-year elements found after wait: ${monthYearElementsAfter}`);        if (monthYearExists > 0) {
            const monthYearText = await monthYearLocator.evaluate(node => node.innerText);
            console.log('12. Month-year text:', monthYearText);
        } else {
            console.log('12. Month-year element not found - checking for non-working day message...');
            if (bodyText.includes('Not a working day')) {
                console.log('13. Found "Not a working day" message - this is expected on Sunday');
            } else {
                console.log('13. No working day message found either - calendar may not be loading');
            }
        }
        
        console.log('14. Cleaning up...');
        await window.close();
        await electronApp.close();
        
        console.log('15. Test completed successfully!');
        
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
}

debugTest();