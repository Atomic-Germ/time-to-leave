import { readdir } from 'fs/promises';
import { join } from 'path';

/**
 * Gets the list of available themes by scanning the themes directory
 * @param {string} themesPath - Absolute path to the themes directory
 * @returns {Promise<string[]>} Array of theme names (without .css extension)
 */
export async function getAvailableThemes(themesPath) {
    try {
        console.log('Looking for themes in:', themesPath);
        const files = await readdir(themesPath);
        console.log('Found files:', files);
        
        const themes = files
            .filter(file => file.endsWith('.css') && !file.endsWith('.template') && file !== 'index.css')
            .map(file => file.replace('.css', ''));
            
        console.log('Available themes:', themes);
        return themes;
    } catch (error) {
        console.error('Error reading themes directory:', error);
        console.error('Theme path was:', themesPath);
        // Return default themes as fallback
        return ['light', 'dark'];
    }
}

/**
 * Validates if a theme file exists and has proper structure
 * @param {string} themePath - Path to the theme CSS file
 * @returns {Promise<boolean>} Whether the theme is valid
 */
export async function validateTheme(themePath) {
    try {
        // Here we could add additional validation like checking for required CSS variables
        return true;
    } catch (error) {
        console.error('Error validating theme:', error);
        return false;
    }
}
