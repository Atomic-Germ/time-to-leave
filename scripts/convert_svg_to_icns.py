#!/usr/bin/env python3
"""
Icon generation script
Converts assets/ttl.svg to various icon formats (.png, .ico, .icns)
Requires: ImageMagick
"""

import subprocess
import tempfile
import shutil
import sys
import os
import platform
from pathlib import Path

def check_command(command):
    """Check if a command is available."""
    return shutil.which(command) is not None

def run_command(cmd, capture_output=True):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=capture_output, 
                              text=True, check=True)
        return result.stdout.strip() if capture_output else True
    except subprocess.CalledProcessError as e:
        if capture_output:
            print(f"Command failed: {cmd}")
            if e.stderr:
                print(f"Error: {e.stderr}")
        return None

def generate_png(svg_source, output_path, width, height):
    cmd = f'npx svg2png "{svg_source}" --output="{output_path}" --width={width} --height={height}'
    return run_command(cmd, capture_output=False)

def main():
    # Source files
    svg_source = "assets/ttl.svg"
    
    if not os.path.exists(svg_source):
        print(f"Error: Source {svg_source} not found!")
        sys.exit(1)
    
    # Check dependencies
    if not check_command("magick"):
        print("Error: ImageMagick is not installed.")
        system = platform.system().lower()
        if system == "darwin":
            print("Install it with: brew install imagemagick")
        elif system == "linux":
            print("Install it with: sudo apt install imagemagick")
        elif system == "windows":
            print("Download from: https://imagemagick.org/script/download.php#windows")
        sys.exit(1)
    
    print(f"Generating icons from {svg_source}...")
    print()
    
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_dir = Path(tmp_dir)
        
        print("📱 Generating PNG files ...")
        sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
        icon_files = {}
        
        for size in sizes:
            output_path = tmp_dir / f"icon-{size}.png"
            if not generate_png(svg_source, output_path, size, size):
                print(f"❌ Failed to generate {size}x{size} icon")
                sys.exit(1)
            icon_files[size] = output_path
        
        # Copy main icon (256x256)
        shutil.copy2(icon_files[256], "assets/ttl.png")
        print("✅ Generated assets/ttl.png (256×256)")
        
        # Copy Debian icon (512x512)
        shutil.copy2(icon_files[512], "assets/icon-deb.png")
        print("✅ Generated assets/icon-deb.png (512×512)")
        
        # Generate tray icons
        print("Generating tray icons...")
        tray_icon_path = Path("assets/ttl-tray-icon.png")
        tray_icon_2x_path = Path("assets/ttl-tray-icon@2x.png")
        if tray_icon_path.exists():
            tray_icon_path.unlink()
        if tray_icon_2x_path.exists():
            tray_icon_2x_path.unlink()
        
        if not generate_png(svg_source, "assets/ttl-tray-icon.png", 16, 16):
            print("❌ Failed to generate tray icon")
            sys.exit(1)
        if not generate_png(svg_source, "assets/ttl-tray-icon@2x.png", 32, 32):
            print("❌ Failed to generate high-DPI tray icon")
            sys.exit(1)
        print("✅ Generated tray icons")
        
        system = platform.system().lower()
        print("Generating macOS .icns file...")
        
        icns_sizes = [16, 32, 64, 128, 256, 512, 1024]
        icns_files = [str(icon_files[size]) for size in icns_sizes]
        icns_cmd = f'magick {" ".join(icns_files)} "assets/icon-mac.icns"'
        if not run_command(icns_cmd, capture_output=False):
            print("❌ Failed to generate .icns file")
            sys.exit(1)
        print("✅ Generated assets/icon-mac.icns")
        
        print("Generating Windows .ico file...")
        ico_sizes = [16, 32, 48, 64, 128, 256]
        ico_files = [str(icon_files[size]) for size in ico_sizes]
        ico_cmd = f'magick {" ".join(ico_files)} "assets/icon-win.ico"'
        if not run_command(ico_cmd, capture_output=False):
            print("❌ Failed to generate .ico file")
            sys.exit(1)
        print("✅ Generated assets/icon-win.ico")
        
        print()
        print("icons generated:")
        print("   • assets/ttl.png (256×256 - General use)")
        print("   • assets/icon-deb.png (512×512 - Debian packages)")
        print("   • assets/icon-mac.icns (Multi-resolution - macOS)")
        print("   • assets/icon-win.ico (Multi-resolution - Windows)")
        print("   • assets/ttl-tray-icon.png (16×16 - System tray)")
        print("   • assets/ttl-tray-icon@2x.png (32×32 - High-DPI tray)")
        print()

if __name__ == "__main__":
    main()