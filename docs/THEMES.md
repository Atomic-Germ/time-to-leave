# Theme Management

The application supports custom themes through CSS files in the `css/themes/` directory. To create a new theme:

1. Create a new CSS file in the `css/themes/` directory (e.g., `my-theme.css`)
2. Use the `theme.css.template` as a reference for required CSS variables
3. Run `npm run refresh-themes` to add your theme to the application

After running the refresh script:

- Your theme will be automatically added to the theme options in the preferences window
- The theme's CSS will be imported into the application
- The theme name will be derived from the filename (e.g., `my-theme.css` becomes "My Theme")

To remove a theme:

1. Delete the theme's CSS file from `css/themes/`
2. Run `npm run refresh-themes`

Note: The "system-default" theme is always available and cannot be removed.
