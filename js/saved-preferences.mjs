'use strict';

import { app, ipcMain } from 'electron';

import i18NextConfig from '../src/configs/i18next.config.mjs';
import IpcConstants from './ipc-constants.mjs';

let savedPreferences = null;

// TODO: Add tests for getSavedPreferences() function to verify state management
function getSavedPreferences()
{
    return savedPreferences;
}

// TODO: Add tests for IPC handler to verify preferences saving, login item settings, and language changes
ipcMain.on(IpcConstants.PreferenceSaveDataNeeded, (event, preferences) =>
{
    savedPreferences = preferences;
    app.setLoginItemSettings({
        openAtLogin: preferences['start-at-login']
    });
    i18NextConfig.changeLanguage(preferences.language).catch((err) =>
    {
        if (err) return console.log('something went wrong loading', err);
    });
});

export {
    getSavedPreferences
};
