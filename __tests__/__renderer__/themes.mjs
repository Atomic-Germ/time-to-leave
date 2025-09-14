'use strict';

import '../../__mocks__/jquery.mjs';

import assert from 'assert';
import { stub } from 'sinon';

import {
    applyTheme,
    isValidTheme,
    themeOptions
} from '../../renderer/themes.js';

const $_backup = global.$;

describe('Theme Functions', function()
{
    before(() =>
    {
        // Stub $ and window.matchMedia for applyTheme()
        global.$ = stub().returns({'attr': stub()});

        // Create matchMedia if it doesn't exist, then stub it
        if (!global.window.matchMedia)
        {
            global.window.matchMedia = () => ({matches: false});
        }
        stub(global.window, 'matchMedia').returns({matches: true});
    });

    describe('isValidTheme()', function()
    {
        it('should validate', () =>
        {
            // Test all valid themes from themeOptions
            themeOptions.forEach(theme => {
                assert.strictEqual(isValidTheme(theme), true, `Should validate theme: ${theme}`);
            });
        });
    });

    describe('isValidTheme()', function()
    {
        it('should not validate', () =>
        {
            assert.strictEqual(isValidTheme('foo'), false);
            assert.strictEqual(isValidTheme('bar'), false);
        });
    });

    describe('applyTheme()', function()
    {
        beforeEach(() =>
        {
            global.window.matchMedia.resetHistory();
            global.$.resetHistory();
        });

        it('should apply', () =>
        {
            // Test all valid themes from themeOptions
            let expectedCallCount = 0;
            themeOptions.forEach(theme => {
                assert.strictEqual(applyTheme(theme), true, `Should apply theme: ${theme}`);
                expectedCallCount++;
            });

            assert.strictEqual(global.window.matchMedia.callCount, 1);
            assert.strictEqual(global.$.callCount, expectedCallCount);
        });

        it('should not apply', function()
        {
            assert.strictEqual(applyTheme('foo'), false);
            assert.strictEqual(applyTheme('bar'), false);

            assert.strictEqual(global.window.matchMedia.callCount, 0);
            assert.strictEqual(global.$.callCount, 0);
        });
    });

    after(() =>
    {
        global.$ = $_backup;
        if (global.window.matchMedia && global.window.matchMedia.restore)
        {
            global.window.matchMedia.restore();
        }
    });
});
