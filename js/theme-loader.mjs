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
        console.log('Looking for themes in:', themesPath);
        const files = await readdir(themesPath);
        console.log('Found files:', files);

        const themes = files
            .filter(file => file.endsWith('.css') && !file.endsWith('.template') && file !== 'index.css')
            .map(file => file.replace('.css', ''));

        console.log('Available themes:', themes);
        return themes;
    }
    catch (error)
    {
        console.error('Error reading themes directory:', error);
        console.error('Theme path was:', themesPath);
        // Return default themes as fallback
        return ['light', 'dark'];
    }
}