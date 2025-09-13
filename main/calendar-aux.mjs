'use strict';

import { ipcMain } from 'electron';
import Store from 'electron-store';

import TimeBalance from '../js/time-balance.mjs';
import IpcConstants from '../js/ipc-constants.mjs';

const calendarStore = new Store({name: 'flexible-store'});

// TODO: Add tests for getCalendarStore() function to verify store access
function getCalendarStore()
{
    return calendarStore.store;
}

// TODO: Add tests for setupCalendarStore() function to verify IPC handler registration and functionality
function setupCalendarStore()
{
    ipcMain.handle(IpcConstants.GetStoreContents, () =>
    {
        return getCalendarStore();
    });

    ipcMain.handle(IpcConstants.SetStoreData, (event, key, contents) =>
    {
        calendarStore.set(key, contents);
        return true;
    });

    ipcMain.handle(IpcConstants.DeleteStoreData, (event, key) =>
    {
        calendarStore.delete(key);
        return true;
    });

    ipcMain.handle(IpcConstants.ComputeAllTimeBalanceUntil, (event, targetDate) =>
    {
        return TimeBalance.computeAllTimeBalanceUntilAsync(targetDate);
    });
}

export {
    setupCalendarStore
};
