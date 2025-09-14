#!/usr/bin/env python3
"""
Regenerates all logo assets from source files
"""

import subprocess
import sys

def run_npm_script(script_name):
    try:
        result = subprocess.run(['npm', 'run', script_name], 
                              check=True, 
                              capture_output=False)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running {script_name}: {e}")
        return False

def main():
    # Refresh icons
    print("Refreshing icons...")
    if not run_npm_script('refresh-icons'):
        sys.exit(1)
    
    print()

    # Refresh logo
    print("Refreshing logo...")
    if not run_npm_script('refresh-logo'):
        sys.exit(1)

    print()
    print("📁 Updated files:")
    print("   • All icon formats (.png, .ico, .icns)")
    print("   • Logo (timetoleave.png)")
    print()

if __name__ == "__main__":
    main()