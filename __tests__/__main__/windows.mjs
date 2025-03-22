'use strict';

import assert from 'assert';
import sinon from 'sinon';
import { BrowserWindow } from 'electron';
import Windows from '../../js/windows.mjs';
import { getUserPreferences } from '../../js/user-preferences.mjs';
import * as dateAux from '../../js/date-aux.mjs';

describe('Windows', () =>
{
    let mainWindowMock;

    beforeEach(() =>
    {
        global.waiverWindow = null;
        global.prefWindow = null;
        global.tray = null;
        global.contextMenu = null;

        mainWindowMock = {
            webContents: {
                send: sinon.stub(),
            },
            getBounds: sinon.stub().returns({ x: 0, y: 0, width: 800, height: 600 }),
        };

        sinon.stub(BrowserWindow.prototype, 'loadURL');
        sinon.stub(BrowserWindow.prototype, 'show');
        sinon.stub(BrowserWindow.prototype, 'setMenu');
        sinon.stub(BrowserWindow.prototype.webContents, 'ipc');
        sinon.stub(BrowserWindow.prototype.webContents, 'on');
        sinon.stub(BrowserWindow.prototype, 'on');
    });

    afterEach(() =>
    {
        if (global.waiverWindow)
        {
            global.waiverWindow.destroy();
        }
        if (global.prefWindow)
        {
            global.prefWindow.destroy();
        }
        sinon.restore();
    });

    describe('openWaiverManagerWindow', () =>
    {
        it('should show existing waiver window', () =>
        {
            global.waiverWindow = { show: sinon.stub(), destroy: sinon.stub() };
            Windows.openWaiverManagerWindow(mainWindowMock);
            assert(global.waiverWindow.show.calledOnce);
        });

        it('should create a new waiver window', () =>
        {
            sinon.stub(dateAux, 'getDateStr').returns('mock-date');
            sinon.stub(getUserPreferences, 'default').returns({ theme: 'dark' });

            Windows.openWaiverManagerWindow(mainWindowMock, true);

            assert.strictEqual(global.waiverWindow instanceof BrowserWindow, true);
            assert(BrowserWindow.prototype.loadURL.calledOnce);
        });
    });

    describe('openPreferencesWindow', () =>
    {
        it('should show existing preferences window', () =>
        {
            global.prefWindow = { show: sinon.stub(), destroy: sinon.stub() };
            Windows.openPreferencesWindow(mainWindowMock);
            assert(global.prefWindow.show.calledOnce);
        });

        it('should create a new preferences window', () =>
        {
            sinon.stub(getUserPreferences, 'default').returns({ theme: 'dark' });

            Windows.openPreferencesWindow(mainWindowMock);

            assert.strictEqual(global.prefWindow instanceof BrowserWindow, true);
            assert(BrowserWindow.prototype.loadURL.calledOnce);
        });
    });

    describe('getDialogCoordinates', () =>
    {
        it('should return correct dialog coordinates', () =>
        {
            const coords = Windows.getDialogCoordinates(200, 150, mainWindowMock);
            assert.deepStrictEqual(coords, { x: 300, y: 225 });
        });
    });

    describe('getWaiverWindow', () =>
    {
        it('should return waiver window', () =>
        {
            global.waiverWindow = { mock: 'waiver' };
            assert.strictEqual(Windows.getWaiverWindow(), global.waiverWindow);
        });
    });

    describe('getPreferencesWindow', () =>
    {
        it('should return preferences window', () =>
        {
            global.prefWindow = { mock: 'pref' };
            assert.strictEqual(Windows.getPreferencesWindow(), global.prefWindow);
        });
    });

    describe('resetWindowsElements', () =>
    {
        it('should reset all global window elements', () =>
        {
            global.waiverWindow = { mock: 'waiver' };
            global.prefWindow = { mock: 'pref' };
            global.tray = { mock: 'tray' };
            global.contextMenu = { mock: 'context' };

            Windows.resetWindowsElements();

            assert.strictEqual(global.waiverWindow, null);
            assert.strictEqual(global.prefWindow, null);
            assert.strictEqual(global.tray, null);
            assert.strictEqual(global.contextMenu, null);
        });
    });
});