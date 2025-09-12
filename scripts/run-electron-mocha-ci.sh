#!/bin/bash

# Set Electron flags for CI environment
export ELECTRON_ENABLE_LOGGING=1
export ELECTRON_NO_ATTACH_CONSOLE=1

# Run electron-mocha with CI-specific settings
NODE_OPTIONS='--max-old-space-size=4096 --no-warnings' c8 --config configs/.c8rc.json --reporter=clover --reporter=json --reporter=lcov electron-mocha --config configs/.mocharc.cjs --no-sandbox --disable-setuid-sandbox --headless --disable-gpu --disable-dev-shm-usage