'use strict';

import '../../__mocks__/jquery.mjs';

import assert from 'assert';
import { JSDOM } from 'jsdom';

describe('Preferences Unit Tests - Time Format Conversion', () =>
{
    let convertTimeFormat;
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
            getOriginalUserPreferences: () => ({})
        };

        // Import the function we want to test
        const file = await import('../../src/preferences.js');
        convertTimeFormat = file.convertTimeFormat;
    });

    after(() =>
    {
        // Restore original globals to prevent interference with other tests
        global.document = originalDocument;
        global.window = originalWindow;
    });

    describe('convertTimeFormat', () =>
    {
        it('should convert single digit hour to HH:MM format', () =>
        {
            assert.strictEqual(convertTimeFormat('5'), '05:00');
        });

        it('should convert double digit hour to HH:MM format', () =>
        {
            assert.strictEqual(convertTimeFormat('13'), '13:00');
        });

        it('should convert H.M format to HH:MM format', () =>
        {
            assert.strictEqual(convertTimeFormat('5.3'), '05:18');
        });

        it('should convert H.MM format to HH:MM format', () =>
        {
            assert.strictEqual(convertTimeFormat('8.30'), '08:18');
        });

        it('should convert HH.M format to HH:MM format', () =>
        {
            assert.strictEqual(convertTimeFormat('13.5'), '13:30');
        });

        it('should convert HH.MM format to HH:MM format', () =>
        {
            assert.strictEqual(convertTimeFormat('13.30'), '13:18');
        });

        it('should convert H:MM format to HH:MM format', () =>
        {
            assert.strictEqual(convertTimeFormat('5:30'), '05:30');
        });

        it('should convert HH:MM format to HH:MM format', () =>
        {
            assert.strictEqual(convertTimeFormat('13:30'), '13:30');
        });
    });
});