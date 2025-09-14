// preload.mjs
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('preferencesApi', {
    getAvailableThemes: (themesPath) => ipcRenderer.invoke('getAvailableThemes', themesPath),
    getAppPath: () => ipcRenderer.invoke('getAppPath')
});
