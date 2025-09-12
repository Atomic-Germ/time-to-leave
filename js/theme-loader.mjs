import { readdir } from 'fs/promises';

/**
 * Gets the list of available themes by scanning the themes directory
 * @param {string} themesPath - Absolute path to the themes directory
 * @returns {Promise<string[]>} Array of theme names (without .css extension)
 */
export async function getAvailableThemes(themesPath)
{
    try
    {
        const files = await readdir(themesPath);

        const themes = files
            .filter(file => file.endsWith('.css') && !file.endsWith('.template') && file !== 'index.css')
            .map(file => file.replace('.css', ''));

        return themes;
    }
    catch (_error)
    {
        // Return default themes as fallback
        return ['light', 'dark'];
    }
}