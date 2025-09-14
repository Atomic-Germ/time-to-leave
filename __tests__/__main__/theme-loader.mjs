'use strict';

import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAvailableThemes } from '../../js/theme-loader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Theme Loader', function()
{
    describe('getAvailableThemes()', function()
    {
        it('should return available themes from themes directory', async function()
        {
            const themesPath = path.join(__dirname, '..', '..', 'css', 'themes');
            const themes = await getAvailableThemes(themesPath);

            // Dynamically discover what theme files should exist
            const fs = await import('fs');
            const actualThemeFiles = fs.readdirSync(themesPath)
                .filter(file => file.endsWith('.css'))
                .filter(file => file !== 'theme.css.template' && file !== 'index.css')
                .map(file => file.replace('.css', ''));

            // Should include all actual theme files
            actualThemeFiles.forEach(expectedTheme => {
                assert.strictEqual(themes.includes(expectedTheme), true, `Should include ${expectedTheme} theme`);
            });

            // Should exclude template and index files
            assert.strictEqual(themes.includes('theme.css'), false, 'Should exclude template file');
            assert.strictEqual(themes.includes('index'), false, 'Should exclude index.css');

            // Should return array of strings
            assert.strictEqual(Array.isArray(themes), true, 'Should return an array');
            themes.forEach(theme =>
            {
                assert.strictEqual(typeof theme, 'string', 'Each theme should be a string');
                assert.strictEqual(theme.endsWith('.css'), false, 'Theme names should not include .css extension');
            });

            // Should have at least some themes (sanity check)
            assert.strictEqual(themes.length > 0, true, 'Should return at least one theme');
        });

        it('should return fallback themes when directory does not exist', async function()
        {
            const nonExistentPath = '/path/that/does/not/exist';
            const themes = await getAvailableThemes(nonExistentPath);

            assert.deepStrictEqual(themes, ['light', 'dark'], 'Should return fallback themes');
        });

        it('should return fallback themes when directory is not accessible', async function()
        {
            // Test with a file instead of directory to trigger an error
            const invalidPath = path.join(__dirname, '..', '..', 'package.json');
            const themes = await getAvailableThemes(invalidPath);

            assert.deepStrictEqual(themes, ['light', 'dark'], 'Should return fallback themes on error');
        });

        it('should filter out non-CSS files', async function()
        {
            // We'll test with the actual themes directory approach
            const themesPath = path.join(__dirname, '..', '..', 'css', 'themes');
            const themes = await getAvailableThemes(themesPath);

            // Verify that actual themes directory filtering works
            themes.forEach(theme =>
            {
                assert.strictEqual(theme.indexOf('.') === -1, true, 'Theme name should not contain file extension');
            });
        });

        it('should handle empty directory gracefully', async function()
        {
            // Test by creating a temporary empty directory
            const os = await import('os');
            const fs = await import('fs/promises');
            const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'theme-test-'));

            try
            {
                const themes = await getAvailableThemes(tmpDir);
                assert.deepStrictEqual(themes, [], 'Should return empty array for empty directory');
            }
            finally
            {
                // Clean up
                await fs.rmdir(tmpDir);
            }
        });

        it('should handle directory with only non-CSS files', async function()
        {
            // Test by creating a temporary directory with non-CSS files
            const os = await import('os');
            const fs = await import('fs/promises');
            const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'theme-test-'));

            try
            {
                // Create non-CSS files
                await fs.writeFile(path.join(tmpDir, 'readme.txt'), 'test');
                await fs.writeFile(path.join(tmpDir, 'script.js'), 'test');
                await fs.writeFile(path.join(tmpDir, 'image.png'), 'test');

                const themes = await getAvailableThemes(tmpDir);
                assert.deepStrictEqual(themes, [], 'Should return empty array when no CSS files found');
            }
            finally
            {
                // Clean up
                await fs.rm(tmpDir, { recursive: true, force: true });
            }
        });

        it('should handle directory with only excluded CSS files', async function()
        {
            // Test by creating a temporary directory with excluded CSS files
            const os = await import('os');
            const fs = await import('fs/promises');
            const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'theme-test-'));

            try
            {
                // Create excluded CSS files
                await fs.writeFile(path.join(tmpDir, 'index.css'), 'test');
                await fs.writeFile(path.join(tmpDir, 'theme.css.template'), 'test');
                await fs.writeFile(path.join(tmpDir, 'style.css.template'), 'test');

                const themes = await getAvailableThemes(tmpDir);
                assert.deepStrictEqual(themes, [], 'Should return empty array when only excluded files found');
            }
            finally
            {
                // Clean up
                await fs.rm(tmpDir, { recursive: true, force: true });
            }
        });

        it('should properly remove .css extension from theme names', async function()
        {
            // Test by creating a temporary directory with CSS files
            const os = await import('os');
            const fs = await import('fs/promises');
            const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'theme-test-'));

            try
            {
                // Create valid CSS theme files
                await fs.writeFile(path.join(tmpDir, 'my-custom-theme.css'), 'test');
                await fs.writeFile(path.join(tmpDir, 'another-theme.css'), 'test');

                const themes = await getAvailableThemes(tmpDir);
                assert.strictEqual(themes.includes('my-custom-theme'), true, 'Should include my-custom-theme');
                assert.strictEqual(themes.includes('another-theme'), true, 'Should include another-theme');
                assert.strictEqual(themes.length, 2, 'Should return exactly 2 themes');

                themes.forEach(theme =>
                {
                    assert.strictEqual(theme.endsWith('.css'), false, 'Theme names should not include .css extension');
                });
            }
            finally
            {
                // Clean up
                await fs.rm(tmpDir, { recursive: true, force: true });
            }
        });
    });
});