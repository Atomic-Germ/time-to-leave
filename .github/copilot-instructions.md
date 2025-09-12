# Copilot Instructions for Time to Leave

These instructions help AI coding agents understand the Time to Leave codebase, its architecture, conventions, and key workflows.

## 1. Project Overview

- Electron-based desktop app for logging work hours and notifications (entry: `main.mjs`).
- Main process code under `js/`, UI under `src/` and `renderer/`.
- Styles and themes under `css/themes/`.
- Languages and translations under `locales/`.

## 2. Architecture & Components

- Main process:
    - Entry: `main.mjs` loads `js/main-window.mjs`.
    - IPC listeners in `js/ipc-constants.mjs` drive communication.
    - Tray and menu templates in `js/menus.mjs`.
- Renderer process:
    - HTML views in `src/calendar.html`, `src/preferences.html`.
    - Preload bridges in `renderer/preload-scripts/` (e.g., `calendar-bridge.mjs`).
    - UI logic in `renderer/` classes and modules.

## 3. IPC & Preload Patterns

- All channels defined as constants in `js/ipc-constants.mjs`.
- In main: `ipcMain.on(IpcConstants.X, ...)`; in renderer: `ipcRenderer.send/invoke(IpcConstants.X)`.
- Preload scripts use `contextBridge.exposeInMainWorld` to forward APIs.

## 4. Localization

- Config in `configs/i18next.config.mjs`.
- Resource JSON under `locales/<lang>/<namespace>.json`.
- Translation helper `i18NextConfig.getCurrentTranslation()`.

## 5. Preferences & Storage

- Uses `electron-store` via `js/user-preferences.mjs`.
- Default window size logic in `js/user-preferences.mjs#getDefaultWidthHeight`.
- Preference-driven behaviors: minimize-to-tray, close-to-tray, theme selection.

## 6. Testing & Coverage

- Unit tests (jsdom) in `__tests__/__renderer__`, `__tests__/__main__`.
- Run headless: `npm test:mocha` (C8 + Mocha).
- Run in-app: `npm run test:electron-mocha` (C8 + electron-mocha).
- Coverage output in `coverage_mocha/` and `coverage_c8/`.

## 7. Build, Lint & Debug Workflows

- Install: `npm ci` (honors `preinstall: force-resolutions`).
- Start dev: `npm start` (uses `electronmon`).
- Debug main: `npm run debug:main`; debug UI: `npm run debug:render`.
- Lint checks: `npm run lint`; fix issues: `npm run lint-fix`.
- Clean workspace: `npm run clean`.

## 8. Packaging & Releases

- Package for macOS: `npm run package:mac`, Windows: `npm run package:win`, Linux: `npm run package:deb`.
- Icons in `assets/`.
- Release notes automated via `scripts/update-changelog.py`.

## 9. Code Conventions & Patterns

- Pure ES modules (`.mjs`), no CommonJS.
- Utility modules in `js/` (e.g., `date-aux.mjs`, `time-math.mjs`).
- Menu templates and context menus generated via functions returning Electron templates.
- Consistent use of IpcConstants to avoid hard-coded channel strings.

---

_Please review and suggest any missing or unclear sections._
