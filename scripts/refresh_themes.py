#!/usr/bin/env python3
"""
Multi-platform theme refresh script for Time to Leave
Synchronizes theme files with app options
Updates renderer/themes.js, css/themes/index.css, css/styles.css, and src/preferences.html
"""

import os
import re
import tempfile
from pathlib import Path
import glob

def find_theme_files():
    """Find all theme CSS files excluding index.css and template files."""
    theme_dir = Path("css/themes")
    theme_files = []
    
    for css_file in theme_dir.glob("*.css"):
        filename = css_file.stem
        if filename != "index" and not filename.endswith(".template"):
            theme_files.append(filename)
    
    return sorted(theme_files)

def update_themes_js(themes):
    """Update renderer/themes.js with the theme options array."""
    themes_js_path = Path("renderer/themes.js")
    
    if not themes_js_path.exists():
        print(f"Warning: {themes_js_path} not found, skipping...")
        return
    
    # Create the new theme options array
    js_themes = "['system-default'"
    for theme in themes:
        js_themes += f", '{theme}'"
    js_themes += "]"
    
    # Read the file
    content = themes_js_path.read_text(encoding='utf-8')
    
    # Replace the themeOptions array
    pattern = r'const themeOptions = \[.*?\];'
    replacement = f'const themeOptions = {js_themes};'
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    # Write back
    themes_js_path.write_text(new_content, encoding='utf-8')
    print(f"✅ Updated {themes_js_path}")

def update_themes_index_css(themes):
    """Generate new css/themes/index.css with theme imports."""
    index_css_path = Path("css/themes/index.css")
    
    content = "/* Theme imports - AUTO-GENERATED FILE */\n"
    for theme in themes:
        content += f"@import '{theme}.css';\n"
    
    index_css_path.write_text(content, encoding='utf-8')
    print(f"✅ Updated {index_css_path}")

def update_styles_css_imports(themes):
    """Update the theme import section in css/styles.css."""
    styles_css_path = Path("css/styles.css")
    
    if not styles_css_path.exists():
        print(f"Warning: {styles_css_path} not found, skipping...")
        return
    
    # Read the file
    lines = styles_css_path.read_text(encoding='utf-8').split('\n')
    
    # Find the theme import section and replace it
    new_lines = []
    in_imports = False
    imports_replaced = False
    
    for line in lines:
        if "/* Import themes */" in line:
            # Add the new import section
            new_lines.append("/* Import themes */")
            for theme in themes:
                new_lines.append(f"@import url('themes/{theme}.css');")
            in_imports = True
            imports_replaced = True
        elif in_imports and re.match(r"^@import url\(.*themes\/.*\.css.*\);", line):
            # Skip existing theme imports
            continue
        elif in_imports and not re.match(r"^@import url\(.*themes\/.*\.css.*\);", line):
            # End of import section
            in_imports = False
            new_lines.append(line)
        else:
            new_lines.append(line)
    
    # Write back
    styles_css_path.write_text('\n'.join(new_lines), encoding='utf-8')
    print(f"✅ Updated {styles_css_path} theme imports")

def camel_case(text):
    """Convert kebab-case to camelCase."""
    components = text.split('-')
    return components[0] + ''.join(word.capitalize() for word in components[1:])

def title_case(text):
    """Convert kebab-case to Title Case."""
    return ' '.join(word.capitalize() for word in text.split('-'))

def update_preferences_html(themes):
    """Update src/preferences.html with sorted theme names."""
    preferences_path = Path("src/preferences.html")
    
    if not preferences_path.exists():
        print(f"Warning: {preferences_path} not found, skipping...")
        return
    
    # Read the file
    content = preferences_path.read_text(encoding='utf-8')
    
    # Build the new theme options
    new_options = []
    new_options.append('                    <option value="system-default" data-i18n="$Preferences.systemDefault" selected>System Default</option>')
    
    for theme in themes:
        display_name = title_case(theme)
        i18n_key = camel_case(theme)
        new_options.append(f'                    <option value="{theme}" data-i18n="$Preferences.{i18n_key}">{display_name}</option>')
    
    # Use regex to replace the theme select options
    pattern = r'(<select[^>]*id="theme"[^>]*>)\s*(<option value="system-default"[^>]*>.*?</option>)(.*?)(\s*</select>)'
    
    def replace_options(match):
        select_open = match.group(1)
        closing_select = match.group(4)
        return select_open + '\n' + '\n'.join(new_options) + closing_select
    
    new_content = re.sub(pattern, replace_options, content, flags=re.DOTALL)
    
    # If that didn't work, try a simpler approach
    if new_content == content:
        # Look for the theme select section more broadly
        lines = content.split('\n')
        new_lines = []
        in_theme_select = False
        replaced = False
        
        for line in lines:
            if '<select' in line and 'id="theme"' in line:
                new_lines.append(line)
                in_theme_select = True
            elif in_theme_select and '<option value="system-default"' in line and not replaced:
                # Replace all options until closing select
                new_lines.extend(new_options)
                replaced = True
                # Skip until closing select
                while True:
                    try:
                        next_line = next(iter([lines.pop(lines.index(line)+1) for _ in range(1)]))
                        if '</select>' in next_line:
                            new_lines.append(next_line)
                            break
                    except:
                        break
                in_theme_select = False
            elif not in_theme_select or replaced:
                new_lines.append(line)
        
        new_content = '\n'.join(new_lines)
    
    # Write back
    preferences_path.write_text(new_content, encoding='utf-8')
    print(f"✅ Updated {preferences_path}")

def main():
    """Main function to refresh all theme-related files."""
    # Change to script directory's parent
    script_dir = Path(__file__).parent
    os.chdir(script_dir.parent)
    
    print("🎨 Refreshing themes...")
    
    # Find all theme files
    themes = find_theme_files()
    
    if not themes:
        print("No theme files found!")
        return
    
    print(f"Found themes: {', '.join(themes)}")
    
    # Update all files
    update_themes_js(themes)
    update_themes_index_css(themes)
    update_styles_css_imports(themes)
    update_preferences_html(themes)
    
    print()
    print("🎉 Theme refresh complete!")
    print(f"📁 Updated themes: {', '.join(themes)}")
    print()

if __name__ == "__main__":
    main()