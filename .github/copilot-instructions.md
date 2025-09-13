# Copilot Instructions for Time to Leave

These instructions help AI coding agents understand the Time to Leave codebase, its architecture, conventions, and key workflows.

## 1. Project Overview

- Electron-based desktop app for logging work hours and notifications (entry: `main.mjs`).
- Main process code under `js/`, UI under `src/` and `renderer/`.
- Styles and themes under `css/themes/`.
- Languages and translations under `locales/`.

## 2. Architecture & Components

- **Main process:**
    - Entry: `main.mjs` loads `js/main-window.mjs`.
    - IPC listeners in `js/ipc-constants.mjs` drive communication.
    - Tray and menu templates in `js/menus.mjs`.
    - Store handlers and auxiliary functions in `main/` (e.g., `calendar-aux.mjs`, `workday-waiver-aux.mjs`).
    - Mixed ES module support: imports from `.mjs`, requires from `.cjs` (e.g., `js/app-config.cjs`).
- **Renderer process:**
    - HTML views in `src/calendar.html`, `src/preferences.html`.
    - Preload bridges in `renderer/preload-scripts/` (e.g., `calendar-bridge.mjs`).
    - UI logic in `renderer/` classes and modules.

## 3. IPC & Preload Patterns

- All channels defined as constants in `js/ipc-constants.mjs`.
- In main: `ipcMain.on(IpcConstants.X, ...)` or `ipcMain.handle(IpcConstants.X, ...)`.
- In renderer: `ipcRenderer.send/invoke(IpcConstants.X)`.
- Preload scripts use `contextBridge.exposeInMainWorld` to forward APIs.
- Pattern: API modules (e.g., `calendar-api.mjs`) → Bridge modules (e.g., `calendar-bridge.mjs`).

## 4. Localization

- Config in `src/configs/i18next.config.mjs` with backend for file loading.
- Resource JSON under `locales/<lang>/<namespace>.json`.
- HTML uses `data-i18n` attributes for dynamic translation.
- Language map in `src/configs/app.config.mjs`.
- Translation helper: `i18NextConfig.getCurrentTranslation()`.

## 5. Theming System

- CSS variables define all colors: `--page-bground`, `--table-border`, etc.
- Themes in `css/themes/` with `html[data-theme="X"]` selectors.
- Theme template at `css/themes/theme.css.template` with accessibility guidelines.
- Runtime theme switching via `renderer/themes.js`.

## 6. Preferences & Storage

- Uses `electron-store` via `js/user-preferences.mjs`.
- Default window size logic in `js/user-preferences.mjs#getDefaultWidthHeight`.
- Preference-driven behaviors: minimize-to-tray, close-to-tray, theme selection.

## 7. Testing & Coverage

- Unit tests (jsdom) in `__tests__/__renderer__`, `__tests__/__main__`.
- Run headless: `npm test:mocha` (C8 + Mocha).
- Run in-app: `npm run test:electron-mocha` (C8 + electron-mocha).
- Multiple coverage systems: C8, NYC, Playwright with merge scripts.
- Coverage config in `configs/.c8rc.json` - targets only `js/`, `src/`, `main.mjs`.

## 8. Build, Lint & Debug Workflows

- Install: `npm ci` (honors `preinstall: force-resolutions`).
- Start dev: `npm start` (uses `electronmon`).
- Debug main: `npm run debug:main`; debug UI: `npm run debug:render`.
- Lint checks: `npm run lint` (ESLint, Stylelint, Prettier); fix: `npm run lint-fix`.
- Clean workspace: `npm run clean`.
- Monitor CI: `gh run view` (latest run details), `gh run watch <run-id>` (live CI monitoring with specific run ID).

## 9. Packaging & Releases

- Package for macOS: `npm run package:mac`, Windows: `npm run package:win`, Linux: `npm run package:deb`.
- Icons in `assets/`.
- Release notes automated via `scripts/update-changelog.py`.

## 10. Code Conventions & Patterns

- **ES Modules only:** All files use `.mjs` extensions, `import`/`export`.
- **Mixed module support:** ES wrapper files (e.g., `js/app-config.mjs`) bridge to legacy CommonJS.
- **Utility modules:** Date handling (`date-aux.mjs`), time math (`time-math.mjs`), validation (`validate-json.mjs`).
- **Menu patterns:** Functions return Electron menu templates.
- **IPC Constants:** Always use `IpcConstants` enum, never hard-coded strings.
- **Data validation:** Import/export uses schema validation (`validateJSON()`).

## 11. Key Development Patterns

- **Store access:** `new Store({name: 'store-name'})` for electron-store.
- **Internationalization:** HTML elements use `data-i18n="$Namespace.key"` pattern.
- **Theme variables:** Always use CSS custom properties, never hardcoded colors.
- **Error handling:** Return `{result: false, failed: N}` objects for validation failures.

## 12. Testing & Documentation Standards

- **Test-driven development:** Comprehensive test suites with `describe`/`it` structure using Mocha.
- **Test patterns:** Each function has multiple test cases covering edge cases, invalid inputs, and expected behavior.
- **Heavy commenting:** Functions use JSDoc-style comments with `@param` and `@return` annotations.
- **Inline documentation:** Complex logic includes explanatory comments (e.g., `//The main database uses a JS-based month index (0-11)`).
- **Comment patterns:** Use `/* block comments */` for function descriptions, `//` for inline explanations.

## 13. Accessibility & Semantic HTML Standards

- **Semantic HTML:** Use proper semantic elements (`<main>`, `<section>`, `<dialog>`, etc.) and ARIA attributes.
- **WAI guidelines compliance:** Ensure color contrast ratios (4.5:1 minimum, 7:1 preferred), keyboard navigation, and screen reader support.
- **Theme accessibility:** CSS themes include contrast ratio comments (e.g., `/* >7:1 contrast ratio */`) and support `prefers-reduced-motion`.
- **ARIA patterns:** Use `role`, `aria-label`, `aria-describedby`, `aria-live="polite"` for dynamic content.
- **Focus management:** Implement skip links, focus trapping in dialogs, and visible focus indicators with `outline: 3px solid`.
- **Keyboard navigation:** All interactive elements must be keyboard accessible with proper `tabindex` and focus styles.

## 14. AI Agent Guidance

- **File discovery:** Use `semantic_search` and `grep_search` to understand patterns before making changes.
- **Context gathering:** Always read related files (tests, configs, examples) before modifying core functionality.
- **Pattern consistency:** Look for similar implementations in the codebase before creating new solutions.
- **Validation approach:** Run tests after changes with `npm test:mocha` for quick validation.
- **CI Monitoring:** Use GitHub CLI commands to monitor CI runs:
    - `sleep 15 && gh run list --branch accessability --limit 1 --repo Atomic-Germ/time-to-leave` - Find specific run after push
    - `gh run view` - View details of the latest CI run
    - `gh run watch <run-id>` - Live monitoring of specific CI run (requires run ID from `gh run list`)
    - `gh run list --limit 5` - Show recent CI runs with status
    - `gh run view <run-id> --log` - View logs for specific run
    - **Example workflow:** After push, use `sleep 15 && gh run list --branch accessability --limit 1 --repo Atomic-Germ/time-to-leave` to get run ID, then `sleep 180 && gh run view 17688285277 --repo Atomic-Germ/time-to-leave` (where 17688285277 is the ID from previous step)
- **Commit discipline:** Make one commit per logical grouping of changes before moving to the next task. Each commit should represent a complete, working feature or fix that can stand alone. Examples:
    - ✅ "feat: add theme switching functionality" (includes CSS, JS, and HTML changes for complete feature)
    - ✅ "fix: resolve IPC communication timeout issues" (includes all related fixes for specific bug)
    - ✅ "improve: enhance test coverage for calendar module" (includes test files and any test utilities)
    - ❌ Don't mix unrelated changes like "fix bugs and add new feature and update docs"
- **Key files for context:**
    - `js/ipc-constants.mjs` - for IPC channel naming
    - `configs/.c8rc.json` - for understanding test coverage scope
    - `src/configs/app.config.mjs` - for language/localization patterns
    - `css/themes/theme.css.template` - for theme development guidelines
- **Documentation updates:** When adding new patterns, update this file with concrete examples from the codebase.

## 15. Common Mistakes to Avoid

- **Don't hardcode IPC channel strings** - Always use `IpcConstants.CHANNEL_NAME` from `js/ipc-constants.mjs`
- **Don't mix module systems** - Use `.mjs` for ES modules, create wrapper files like `js/app-config.mjs` for CommonJS bridges
- **Don't hardcode colors** - Always use CSS custom properties like `var(--page-color)`, never hex/rgb values
- **Don't skip JSDoc** - All functions need `@param` and `@return` documentation
- **Don't forget accessibility** - Every interactive element needs keyboard support and proper ARIA attributes
- **Don't break localization** - Use `data-i18n="$Namespace.key"` pattern, never hardcoded text in HTML

## 16. File Path Templates

- **New themes:** `css/themes/theme-name.css` following `css/themes/theme.css.template`
- **New IPC channels:** Add to `js/ipc-constants.mjs`, implement handlers in `main/` if needed
- **New languages:** `locales/{lang-code}/translation.json` + add to `src/configs/app.config.mjs`
- **Main process utilities:** `js/utility-name.mjs` (use ES modules)
- **Renderer preload:** `renderer/preload-scripts/feature-api.mjs` and `renderer/preload-scripts/feature-bridge.mjs`
- **Tests:** `__tests__/__main__/` for main process, `__tests__/__renderer__/` for renderer process

## 17. Decision Trees

- **Adding IPC communication:**
    1. Check `js/ipc-constants.mjs` for existing channels
    2. Add new constant if needed: `NewFeature: 'NEW_FEATURE'`
    3. Implement handler in `main/` directory or `js/main-window.mjs`
    4. Create preload API in `renderer/preload-scripts/`
    5. Bridge to renderer with `contextBridge.exposeInMainWorld`

- **Adding new theme:**
    1. Copy `css/themes/theme.css.template`
    2. Follow accessibility guidelines (contrast ratios, focus indicators)
    3. Add theme option to `src/preferences.html`
    4. Test with `prefers-reduced-motion` and high contrast

- **Adding localization:**
    1. Add strings to `locales/en/translation.json` first
    2. Add language code to `src/configs/app.config.mjs`
    3. Use `data-i18n="$translation.key"` in HTML
    4. Test with `i18NextConfig.getCurrentTranslation()`

## 18. External Documentation References

- **Electron API:** https://www.electronjs.org/docs/latest/api
- **WAI-ARIA Guidelines:** https://www.w3.org/WAI/ARIA/apg/
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **CSS Custom Properties:** https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **Mocha Testing:** https://mochajs.org/
- **i18next Documentation:** https://www.i18next.com/
- **Bootstrap 5 Components:** https://getbootstrap.com/docs/5.0/components/
- **Contrast Ratio Checker:** https://webaim.org/resources/contrastchecker/

---

_Please review and suggest any missing or unclear sections._
