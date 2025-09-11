#!/bin/bash

# Script to synchronize theme files with application theme options
# Searches css/themes/ directory and updates the application code accordingly

# Change to repository root directory (where package.json is located)
cd "$(dirname "$0")/.." || exit 1

echo "Refreshing theme configuration..."

# Get list of theme files (excluding index.css and template files)
theme_files=$(find css/themes -name "*.css" -not -name "index.css" -not -name "*.template" -exec basename {} .css \;)

# Convert theme files to array and sort
IFS=$'\n' read -r -d '' -a theme_array <<< "$theme_files"
sorted_themes=($(printf "%s\n" "${theme_array[@]}" | sort))

echo "Found themes: ${sorted_themes[*]}"

# Create new theme options array for JavaScript
js_themes="['system-default', '$(printf "%s', '" "${sorted_themes[@]}")']"

# Update themes.js
echo "Updating renderer/themes.js..."
sed -i.bak -E "
/const themeOptions = \[.*\];/ c\\
const themeOptions = $js_themes;
" renderer/themes.js
rm -f renderer/themes.js.bak

# Generate new index.css content
echo "Updating css/themes/index.css..."
{
    echo "/* Theme imports - AUTO-GENERATED FILE */"
    for theme in "${sorted_themes[@]}"; do
        echo "@import '${theme}.css';"
    done
    echo ""
} > css/themes/index.css

echo "Theme refresh complete!"
echo "Updated themes: ${sorted_themes[*]}"
