// preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('preferencesApi', {
    getAvailableThemes: (themesPath) => ipcRenderer.invoke('getAvailableThemes', themesPath),
    getAppPath: () => ipcRenderer.invoke('getAppPath')
});
