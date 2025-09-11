// TODO: this is duplicated in preferences.html.
// Please concentrate it in a single place, probably a JSON.
const themeOptions = ['system-default', 'business-dress', 'dark', 'light', ''];

/**
 * Checks whether the provided theme is valid. This list should be reflected in the `styles.css` file.
 * @param {string} testTheme
 * @return {boolean}
 */
function isValidTheme(testTheme)
{
    return themeOptions.indexOf(testTheme) >= 0;
}

/**
 * Takes the provided theme key, and loads into a data-attribute on the DOM
 * @param {string} theme
 * @return {boolean} If the theme application was successful
 */
function applyTheme(theme)
{
    if (!isValidTheme(theme))
    {
        return false;
    }

    if (theme === 'system-default')
    {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;

        if (prefersHighContrast && !prefersDark)
        {
            theme = 'high-contrast-light';
        }
        else
        {
            theme = prefersDark ? 'dark' : 'light';
        }
    }

    document.documentElement.setAttribute('data-theme', theme);
    return true;
}

export { applyTheme, isValidTheme };
