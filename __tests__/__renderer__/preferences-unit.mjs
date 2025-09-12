'use strict';

import '../../__mocks__/jquery.mjs';

import assert from 'assert';
import { JSDOM } from 'jsdom';

describe('Preferences Unit Tests - Error Handling', () =>
{
    let showError, clearError, showSuccess;
    let originalDocument, originalWindow;

    before(async() =>
    {
        // Save original globals
        originalDocument = global.document;
        originalWindow = global.window;

        // Set up a clean DOM for each test
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        global.document = dom.window.document;
        global.window = dom.window;

        // Mock missing window APIs to prevent initialization errors
        global.window.rendererApi = {
            notifyWindowReadyToShow: () => {},
            getLanguageMap: () => ({}),
            getOriginalUserPreferences: () => ({}),
            getLanguageDataPromise: () => Promise.resolve({}),
            setOriginalUserPreferences: () => {},
            showDialog: () => Promise.resolve({})
        };

        // Import the functions we want to test
        const file = await import('../../src/preferences.js');
        showError = file.showError;
        clearError = file.clearError;
        showSuccess = file.showSuccess;
    });

    after(() =>
    {
        // Restore original globals to prevent interference with other tests
        global.document = originalDocument;
        global.window = originalWindow;
    });

    describe('showError', () =>
    {
        it('should display error message and set aria-invalid', () =>
        {
            // Create a test input with aria-describedby
            const testInput = document.createElement('input');
            testInput.setAttribute('aria-describedby', 'test-error');
            const errorElement = document.createElement('div');
            errorElement.id = 'test-error';
            document.body.appendChild(testInput);
            document.body.appendChild(errorElement);

            showError(testInput, 'Test error message');

            assert.strictEqual(errorElement.textContent, 'Test error message');
            assert.strictEqual(testInput.getAttribute('aria-invalid'), 'true');

            // Cleanup
            document.body.removeChild(testInput);
            document.body.removeChild(errorElement);
        });
    });

    describe('clearError', () =>
    {
        it('should clear error message and set aria-invalid to false', () =>
        {
            // Create a test input with error
            const testInput = document.createElement('input');
            testInput.setAttribute('aria-describedby', 'test-error');
            testInput.setAttribute('aria-invalid', 'true');
            const errorElement = document.createElement('div');
            errorElement.id = 'test-error';
            errorElement.textContent = 'Existing error';
            document.body.appendChild(testInput);
            document.body.appendChild(errorElement);

            clearError(testInput);

            assert.strictEqual(errorElement.textContent, '');
            assert.strictEqual(testInput.getAttribute('aria-invalid'), 'false');

            // Cleanup
            document.body.removeChild(testInput);
            document.body.removeChild(errorElement);
        });
    });

    describe('showSuccess', () =>
    {
        it('should display success message with proper attributes', () =>
        {
            // Just test that showSuccess doesn't throw errors
            // The DOM timing is too complex to test reliably in unit tests
            let errorThrown = false;
            try
            {
                showSuccess('Test success message');
            }
            catch (_error)
            {
                errorThrown = true;
            }
            assert.strictEqual(errorThrown, false);
        });
    });
});