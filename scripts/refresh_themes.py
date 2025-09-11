#!/usr/bin/env python3
"""
Searches for new theme CSS files in the css/themes directory,
updates the themes.js file with the new list of themes,
and regenerates the index.css file to include imports for all themes.
"""

import os

# Change to repository root directory (where package.json is located)
root_dir = os.path.dirname(os.path.abspath(__file__)) + '/..'
os.chdir(root_dir)

print("Refreshing theme configuration...")

# Get list of theme files (excluding index.css and template files)
theme_files = []
for file in os.listdir('css/themes'):
    if file.endswith('.css') and file != 'index.css':
        theme_files.append(file)

# Convert theme files to array and sort
sorted_themes = sorted(theme_files)

print("Found themes:", sorted_themes)

# Create new theme options array for JavaScript
js_themes = ['system-default'] + sorted_themes

# Update themes.js
with open('renderer/themes.js', 'r+', encoding="utf-8") as f:
    lines = f.readlines()
    f.seek(0)
    f.write('const themeOptions = [\n')
    for line in js_themes:
        f.write(f'  "{line}",\n')
    f.write('];\n')
    f.truncate()

# Generate new index.css content
with open('css/themes/index.css', 'w', encoding="utf-8") as f:
    f.write("/* Theme imports - AUTO-GENERATED FILE */")
    for theme in sorted_themes:
        f.write(f"@import '{theme}.css';\n")

print("Theme refresh complete!")
print("Updated themes:", sorted_themes)
