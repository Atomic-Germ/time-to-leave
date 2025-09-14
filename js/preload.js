// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Allow importing of ESM modules
const { createRequire } = require('module');
global.require = createRequire(import.meta.url);

contextBridge.exposeInMainWorld('preferencesApi', {
    getAvailableThemes: (themesPath) => ipcRenderer.invoke('getAvailableThemes', themesPath),
    getAppPath: () => ipcRenderer.invoke('getAppPath')
});
