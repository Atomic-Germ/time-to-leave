#!/usr/bin/env bash

# Script to synchronize theme files with app options
# Usage: ./scripts/refresh_themes.sh

cd "$(dirname "$0")/.." || exit 1

echo "Refreshing themes..."

# Get a list of all the themes with exception of index and template
theme_files=$(find css/themes -name "*.css" -not -name "index.css" -not -name "*.template" -exec basename {} .css \;)

# Convert files into an array and sort it
IFS=$'\n' read -r -d '' -a theme_array <<< "$theme_files" 
sorted_themes=($(printf "%s\n" "${theme_array[@]}" | sort))

echo "Found themes: ${sorted_themes[*]}"

# Create new theme options array
js_themes="['system-default', '$(printf "%s', '" "${sorted_themes[@]}")']"

# Update themes.js
echo "Updating renderer/themes.js..." 
sed -i.bak -E "/const themeOptions = \[.*\];/ c\\const themeOptions = $js_themes;" renderer/themes.js 
rm -f renderer/themes.js.bak

# Generate new index.css content 
echo "Updating css/themes/index.css..."
echo "/* Theme imports - AUTO-GENERATED FILE */" > css/themes/index.css 

for theme in "${sorted_themes[@]}"; do echo "@import '${theme}.css';" >> css/themes/index.css ; done

echo "Themes refreshed successfully."
echo "Updated themes: ${sorted_themes[*]}"