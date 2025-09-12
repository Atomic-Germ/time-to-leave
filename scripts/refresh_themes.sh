#!/usr/bin/env bash

# Script to synchronize theme files with app options
# Usage: ./scripts/refresh_themes.sh

cd "$(dirname "$0")/.." || exit 1

echo "Refreshing themes..."

# Get a list of all the themes with exception of index and template
theme_files=$(find css/themes -name "*.css" -not -name "index.css" -not -name "*.template" -exec basename {} .css \;)
IFS=$'\n' read -r -d '' -a theme_array <<< "$theme_files"
sorted_themes=($(printf "%s\n" "${theme_array[@]}" | sort))
echo "Found themes: ${sorted_themes[*]}"

# Create new theme options array
js_themes="['system-default'"
for theme in "${sorted_themes[@]}"; do
    js_themes="$js_themes, '$theme'"
done
js_themes="$js_themes]"

# Update themes.js
echo "Updating renderer/themes.js..." 
sed -i.bak -E "s/const themeOptions = \[.*\];/const themeOptions = $js_themes;/" renderer/themes.js
rm -f renderer/themes.js.bak

# Generate new index.css content
echo "Updating css/themes/index.css..."
echo "/* Theme imports - AUTO-GENERATED FILE */" > css/themes/index.css 

for theme in "${sorted_themes[@]}"; do echo "@import '${theme}.css';" >> css/themes/index.css ; done

# Update styles.css imports
echo "Updating css/styles.css theme imports..."
# Create the new import section
import_section="/* Import themes */"
for theme in "${sorted_themes[@]}"; do 
    import_section="$import_section\n@import url('themes/${theme}.css');"
done

# Replace the theme import section in styles.css
awk -v new_imports="$import_section" '
BEGIN { in_imports = 0 }
/\/\* Import themes \*\// { 
    print new_imports
    in_imports = 1
    next 
}
in_imports && /^@import url\(.*themes\/.*\.css.*\);/ { next }
in_imports && !/^@import url\(.*themes\/.*\.css.*\);/ { in_imports = 0 }
!in_imports { print }
' css/styles.css > css/styles.css.tmp && mv css/styles.css.tmp css/styles.css

# Update preferences.html with sorted theme names and remove options without matching CSS files
echo "Updating preferences.html..."

# Create a temporary file with the updated theme options
temp_file=$(mktemp)

# Build the theme options section
echo '                    <option value="system-default" data-i18n="$Preferences.systemDefault" selected>System Default</option>' > "$temp_file"

for theme in "${sorted_themes[@]}"; do
    # Convert theme name to a display name (capitalize and replace hyphens with spaces)
    display_name=$(echo "$theme" | sed 's/-/ /g' | sed 's/\b\w/\U&/g')
    # Create a camelCase i18n key
    i18n_key=$(echo "$theme" | sed 's/-\([a-z]\)/\U\1/g')
    echo "                    <option value=\"$theme\" data-i18n=\"\$Preferences.$i18n_key\">$display_name</option>" >> "$temp_file"
done

# Replace the theme options section in preferences.html
awk -v new_options="$temp_file" '
BEGIN { in_theme_select = 0; replaced = 0 }
/<select.*id="theme"/ { in_theme_select = 1; print; next }
in_theme_select && /<option value="system-default"/ {
    if (!replaced) {
        while ((getline line < new_options) > 0) {
            print line
        }
        close(new_options)
        replaced = 1
    }
    # Skip until we find the closing select tag
    while (getline && !/^[[:space:]]*<\/select>/) {
        # Skip existing options
    }
    print  # Print the closing </select> tag
    in_theme_select = 0
    next
}
!in_theme_select { print }
' src/preferences.html > src/preferences.html.tmp && mv src/preferences.html.tmp src/preferences.html

# Clean up
rm -f "$temp_file"

echo "Updated themes: ${sorted_themes[*]}"