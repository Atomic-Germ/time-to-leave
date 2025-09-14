'use strict';

import '../../__mocks__/jquery.mjs';

import assert from 'assert';
import { stub } from 'sinon';
import fs from 'fs';
import path from 'path';

import {
    applyTheme,
    isValidTheme,
    themeOptions
} from '../../renderer/themes.js';

const $_backup = global.$;
const availableThemes = themeOptions.filter(theme => theme !== 'system-default');
const invalidThemes = ['non_existent'];

describe('Theme Functions', function()
{
    before(() =>
    {
        // Stub $ and window.matchMedia for applyTheme()
        global.$ = stub().returns({'attr': stub()});
        stub(global.window, 'matchMedia').returns({matches: true});
    });

    describe('isValidTheme()', function()
    {
        it('should validate all available themes', () =>
        {
            // Test system-default
            assert.strictEqual(isValidTheme('system-default'), true);
            
            // Test all discovered themes
            availableThemes.forEach(theme => {
                assert.strictEqual(isValidTheme(theme), true, `Theme '${theme}' should be valid`);
            });
        });
    });

    describe('isValidTheme()', function()
    {
        it('should not validate invalid themes', () =>
        {
            invalidThemes.forEach(theme => {
                assert.strictEqual(isValidTheme(theme), false, `Theme '${theme}' should be invalid`);
            });
        });
    });

    describe('applyTheme()', function()
    {
        beforeEach(() =>
        {
            global.window.matchMedia.resetHistory();
            global.$.resetHistory();
        });

        it('should apply all available themes', () =>
        {
            // Test system-default
            assert.strictEqual(applyTheme('system-default'), true);
            
            // Test all available themes
            availableThemes.forEach(theme => {
                assert.strictEqual(applyTheme(theme), true, `Theme '${theme}' should apply successfully`);
            });

            // system-default calls matchMedia once and jQuery once
            // Each other theme just calls jQuery once
            const expectedMatchMediaCalls = 1; // Only system-default calls matchMedia
            const expectedJQueryCalls = 1 + availableThemes.length;
            
            assert.strictEqual(global.window.matchMedia.callCount, expectedMatchMediaCalls);
            assert.strictEqual(global.$.callCount, expectedJQueryCalls);
        });

        it('should not apply invalid themes', function()
        {
            invalidThemes.forEach(theme => {
                assert.strictEqual(applyTheme(theme), false, `Theme '${theme}' should not apply`);
            });

            assert.strictEqual(global.window.matchMedia.callCount, 0);
            assert.strictEqual(global.$.callCount, 0);
        });
    });

    describe('Theme Filenames', function()
    {
        it('should have kebab-case file names for theme css files', () =>
        {
            const themesDir = path.join(process.cwd(), 'css', 'themes');
            const files = fs.readdirSync(themesDir);
            
            const themeFiles = files
                .filter(file => file.endsWith('.css'))
                .filter(file => !file.includes('template') && !file.includes('index'));
            
            const kebabCasePattern = /^[a-z]+(-[a-z]+)*\.css$/;
            
            themeFiles.forEach(file => {
                assert.match(file, kebabCasePattern, 
                    `Theme file '${file}' should use kebab-case ('my-theme.css', not 'my_theme.css' or 'MyTheme.css')`);
            });
        });

        it('should have corresponding theme names that match file names', () =>
        {
            const themesDir = path.join(process.cwd(), 'css', 'themes');
            const files = fs.readdirSync(themesDir);
            
            const themeFiles = files
                .filter(file => file.endsWith('.css'))
                .filter(file => !file.includes('template') && !file.includes('index'))
                .map(file => path.basename(file, '.css'));
            
            // Check that each theme file has a corresponding dropdown option
            themeFiles.forEach(themeName => {
                assert.ok(themeOptions.includes(themeName), 
                    `should have a corresponding entry in theme array '${themeName}.css'`);
            });
            
            // Check that each theme option has a corresponding file
            availableThemes.forEach(themeName => {
                assert.ok(themeFiles.includes(themeName), 
                    `Should have a file '${themeName}.css' for theme '${themeName}'`);
            });
        });
    });

    after(() =>
    {
        global.$ = $_backup;
        window.matchMedia.restore();
    });
});
