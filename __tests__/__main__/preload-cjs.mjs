'use strict';

import assert from 'assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import vm from 'vm';

// Get the directory of this test file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Preload.cjs', function()
{
    let mockContextBridge;
    let mockIpcRenderer;
    let mockElectron;
    let preloadCode;
    let context;

    beforeEach(function()
    {
        // Mock ipcRenderer
        mockIpcRenderer = {
            invoke: function(channel, ...args)
            {
                // Return a promise for consistency
                return Promise.resolve({ channel, args });
            }
        };

        // Mock contextBridge
        mockContextBridge = {
            exposeInMainWorld: function(name, api)
            {
                // Store the exposed API for testing
                this._exposedAPI = { name, api };
            }
        };

        // Mock electron module
        mockElectron = {
            contextBridge: mockContextBridge,
            ipcRenderer: mockIpcRenderer
        };

        // Read the preload.cjs file
        const preloadPath = join(__dirname, '../../js/preload.cjs');
        preloadCode = readFileSync(preloadPath, 'utf8');

        // Create a VM context with our mocks
        context = vm.createContext({
            require: function(moduleName)
            {
                if (moduleName === 'electron')
                {
                    return mockElectron;
                }
                throw new Error(`Module ${moduleName} not found`);
            }
        });
    });

    describe('Module Execution', function()
    {
        it('should execute without errors', function()
        {
            // Execute the preload script in our controlled context
            assert.doesNotThrow(() =>
            {
                vm.runInContext(preloadCode, context);
            }, 'Preload script should execute without errors');
        });
    });

    describe('Context Bridge Setup', function()
    {
        it('should expose preferencesApi in main world', function()
        {
            // Execute the preload script
            vm.runInContext(preloadCode, context);

            // Verify contextBridge.exposeInMainWorld was called
            assert.strictEqual(typeof mockContextBridge._exposedAPI, 'object', 'Should have exposed an API');
            assert.strictEqual(mockContextBridge._exposedAPI.name, 'preferencesApi', 'Should expose as preferencesApi');

            // Verify the exposed object has the expected methods
            const exposedApi = mockContextBridge._exposedAPI.api;
            assert.strictEqual(typeof exposedApi, 'object', 'Should expose an object');
            assert.strictEqual(typeof exposedApi.getAvailableThemes, 'function', 'Should have getAvailableThemes function');
            assert.strictEqual(typeof exposedApi.getAppPath, 'function', 'Should have getAppPath function');
        });
    });

    describe('getAvailableThemes API', function()
    {
        it('should be a function that accepts a parameter', function()
        {
            // Execute the preload script
            vm.runInContext(preloadCode, context);

            // Get the exposed API
            const exposedApi = mockContextBridge._exposedAPI.api;

            // Verify getAvailableThemes function
            assert.strictEqual(typeof exposedApi.getAvailableThemes, 'function', 'Should be a function');
            assert.strictEqual(exposedApi.getAvailableThemes.length, 1, 'Should accept one parameter');
        });

        it('should call ipcRenderer.invoke with correct parameters', async function()
        {
            let invokeCallArgs = null;

            // Override invoke to capture arguments
            mockIpcRenderer.invoke = function(channel, ...args)
            {
                invokeCallArgs = { channel, args };
                return Promise.resolve(['theme1', 'theme2']);
            };

            // Execute the preload script
            vm.runInContext(preloadCode, context);

            // Get the exposed API and call the function
            const exposedApi = mockContextBridge._exposedAPI.api;
            const testPath = '/test/themes/path';
            await exposedApi.getAvailableThemes(testPath);

            // Verify the invoke call
            assert.strictEqual(invokeCallArgs.channel, 'getAvailableThemes', 'Should call with correct channel');
            assert.strictEqual(invokeCallArgs.args.length, 1, 'Should pass one argument');
            assert.strictEqual(invokeCallArgs.args[0], testPath, 'Should pass the themes path');
        });
    });

    describe('getAppPath API', function()
    {
        it('should be a function that accepts no parameters', function()
        {
            // Execute the preload script
            vm.runInContext(preloadCode, context);

            // Get the exposed API
            const exposedApi = mockContextBridge._exposedAPI.api;

            // Verify getAppPath function
            assert.strictEqual(typeof exposedApi.getAppPath, 'function', 'Should be a function');
            assert.strictEqual(exposedApi.getAppPath.length, 0, 'Should accept no parameters');
        });

        it('should call ipcRenderer.invoke with correct channel', async function()
        {
            let invokeCallArgs = null;

            // Override invoke to capture arguments
            mockIpcRenderer.invoke = function(channel, ...args)
            {
                invokeCallArgs = { channel, args };
                return Promise.resolve('/app/path');
            };

            // Execute the preload script
            vm.runInContext(preloadCode, context);

            // Get the exposed API and call the function
            const exposedApi = mockContextBridge._exposedAPI.api;
            await exposedApi.getAppPath();

            // Verify the invoke call
            assert.strictEqual(invokeCallArgs.channel, 'getAppPath', 'Should call with correct channel');
            assert.strictEqual(invokeCallArgs.args.length, 0, 'Should pass no arguments');
        });
    });

    describe('Return Values', function()
    {
        it('should return promises from ipcRenderer.invoke calls', function()
        {
            // Execute the preload script
            vm.runInContext(preloadCode, context);

            // Get the exposed API
            const exposedApi = mockContextBridge._exposedAPI.api;

            // Test getAvailableThemes return value
            const themesResult = exposedApi.getAvailableThemes('/test/path');
            assert.strictEqual(themesResult instanceof Promise, true, 'getAvailableThemes should return a Promise');

            // Test getAppPath return value
            const appPathResult = exposedApi.getAppPath();
            assert.strictEqual(appPathResult instanceof Promise, true, 'getAppPath should return a Promise');
        });
    });
});