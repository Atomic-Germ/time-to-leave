'use strict';

import assert from 'assert';
import { stub, restore } from 'sinon';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import vm from 'vm';

// Get the directory of this test file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Squirrel.mjs', function()
{
    let mockApplication;
    let originalArgv;
    let originalExecPath;
    let squirrelCode;
    let context;
    let mockChildProcess;
    let mockPath;

    beforeEach(function()
    {
        // Save original values
        originalArgv = process.argv;
        originalExecPath = process.execPath;

        // Mock application object
        mockApplication = {
            quit: stub()
        };

        // Create mock child process
        mockChildProcess = {
            spawn: stub().returns({ pid: 12345 })
        };

        // Create mock path module
        mockPath = {
            resolve: stub(),
            join: stub(),
            basename: stub()
        };

        // Configure default mock behaviors
        mockPath.resolve
            .withArgs('/fake/app/TTL.exe', '..')
            .returns('/fake/app')
            .withArgs('/fake/app', '..')
            .returns('/fake')
            .withArgs('/fake/Update.exe')
            .returns('/fake/Update.exe');

        mockPath.join.withArgs('/fake', 'Update.exe').returns('/fake/Update.exe');
        mockPath.basename.withArgs('/fake/app/TTL.exe').returns('TTL.exe');

        // Read squirrel.mjs and convert to testable format
        const squirrelPath = join(__dirname, '../../js/squirrel.mjs');
        const originalCode = readFileSync(squirrelPath, 'utf8');

        // Replace imports with require calls for VM execution
        squirrelCode = originalCode
            .replace('import ChildProcess from \'child_process\';', 'const ChildProcess = require(\'child_process\');')
            .replace('import path from \'path\';', 'const path = require(\'path\');')
            .replace('export {\n    handleSquirrelEvent\n};', 'module.exports = { handleSquirrelEvent };');

        // Create VM context with mocks
        context = vm.createContext({
            require: function(moduleName)
            {
                if (moduleName === 'child_process')
                {
                    return mockChildProcess;
                }
                if (moduleName === 'path')
                {
                    return mockPath;
                }
                throw new Error(`Module ${moduleName} not found`);
            },
            process: {
                argv: [],
                execPath: '/fake/app/TTL.exe'
            },
            setTimeout: function(callback, delay)
            {
                // Don't actually set timeout in tests, just store the callback
                context._timeoutCallback = callback;
                context._timeoutDelay = delay;
            },
            module: { exports: {} }
        });
    });

    afterEach(function()
    {
        // Restore original values
        process.argv = originalArgv;
        process.execPath = originalExecPath;

        // Restore all stubs
        restore();
    });

    describe('handleSquirrelEvent function', function()
    {
        it('should return false when process.argv.length is 1', function()
        {
            // Set up process.argv with only one argument
            context.process.argv = ['node'];

            // Execute the squirrel script
            vm.runInContext(squirrelCode, context);
            const { handleSquirrelEvent } = context.module.exports;

            const result = handleSquirrelEvent(mockApplication);

            assert.strictEqual(result, false, 'Should return false when no squirrel arguments present');
        });

        it('should return undefined for unrecognized squirrel events', function()
        {
            // Set up process.argv with unrecognized squirrel event
            context.process.argv = ['node', '--unknown-squirrel-event'];

            // Execute the squirrel script
            vm.runInContext(squirrelCode, context);
            const { handleSquirrelEvent } = context.module.exports;

            const result = handleSquirrelEvent(mockApplication);

            assert.strictEqual(result, undefined, 'Should return undefined for unrecognized events');
        });

        describe('--squirrel-install event', function()
        {
            it('should handle squirrel install event correctly', function()
            {
                // Set up process.argv for install event
                context.process.argv = ['node', '--squirrel-install'];

                // Execute the squirrel script
                vm.runInContext(squirrelCode, context);
                const { handleSquirrelEvent } = context.module.exports;

                const result = handleSquirrelEvent(mockApplication);

                assert.strictEqual(result, true, 'Should return true for install event');

                // Verify child process spawn was called for creating shortcuts
                assert.strictEqual(mockChildProcess.spawn.calledOnce, true, 'Should call spawn to create shortcuts');
                const spawnCall = mockChildProcess.spawn.firstCall;
                assert.strictEqual(spawnCall.args[1][0], '--createShortcut', 'Should call with createShortcut argument');

                // Verify setTimeout was called
                assert.strictEqual(typeof context._timeoutCallback, 'function', 'Should set a timeout callback');
                assert.strictEqual(context._timeoutDelay, 1000, 'Should set timeout delay to 1000ms');
            });
        });

        describe('--squirrel-updated event', function()
        {
            it('should handle squirrel updated event correctly', function()
            {
                // Set up process.argv for updated event
                context.process.argv = ['node', '--squirrel-updated'];

                // Execute the squirrel script
                vm.runInContext(squirrelCode, context);
                const { handleSquirrelEvent } = context.module.exports;

                const result = handleSquirrelEvent(mockApplication);

                assert.strictEqual(result, true, 'Should return true for updated event');

                // Verify child process spawn was called
                assert.strictEqual(mockChildProcess.spawn.calledOnce, true, 'Should call spawn to create shortcuts');
                const spawnCall = mockChildProcess.spawn.firstCall;
                assert.strictEqual(spawnCall.args[1][0], '--createShortcut', 'Should call with createShortcut argument');

                // Verify setTimeout was called
                assert.strictEqual(typeof context._timeoutCallback, 'function', 'Should set a timeout callback');
                assert.strictEqual(context._timeoutDelay, 1000, 'Should set timeout delay to 1000ms');
            });
        });

        describe('--squirrel-uninstall event', function()
        {
            it('should handle squirrel uninstall event correctly', function()
            {
                // Set up process.argv for uninstall event
                context.process.argv = ['node', '--squirrel-uninstall'];

                // Execute the squirrel script
                vm.runInContext(squirrelCode, context);
                const { handleSquirrelEvent } = context.module.exports;

                const result = handleSquirrelEvent(mockApplication);

                assert.strictEqual(result, true, 'Should return true for uninstall event');

                // Verify child process spawn was called for removing shortcuts
                assert.strictEqual(mockChildProcess.spawn.calledOnce, true, 'Should call spawn to remove shortcuts');
                const spawnCall = mockChildProcess.spawn.firstCall;
                assert.strictEqual(spawnCall.args[1][0], '--removeShortcut', 'Should call with removeShortcut argument');

                // Verify setTimeout was called
                assert.strictEqual(typeof context._timeoutCallback, 'function', 'Should set a timeout callback');
                assert.strictEqual(context._timeoutDelay, 1000, 'Should set timeout delay to 1000ms');
            });
        });

        describe('--squirrel-obsolete event', function()
        {
            it('should handle squirrel obsolete event correctly', function()
            {
                // Set up process.argv for obsolete event
                context.process.argv = ['node', '--squirrel-obsolete'];

                // Execute the squirrel script
                vm.runInContext(squirrelCode, context);
                const { handleSquirrelEvent } = context.module.exports;

                const result = handleSquirrelEvent(mockApplication);

                assert.strictEqual(result, true, 'Should return true for obsolete event');
                assert.strictEqual(mockApplication.quit.calledOnce, true, 'quit should be called immediately for obsolete event');
            });
        });

        describe('path resolution', function()
        {
            it('should resolve paths correctly for update operations', function()
            {
                // Set up process.argv for install event to trigger path resolution
                context.process.argv = ['node', '--squirrel-install'];

                // Execute the squirrel script
                vm.runInContext(squirrelCode, context);
                const { handleSquirrelEvent } = context.module.exports;

                handleSquirrelEvent(mockApplication);

                // Verify path operations were called
                assert.strictEqual(mockPath.resolve.called, true, 'Should call path.resolve');
                assert.strictEqual(mockPath.basename.called, true, 'Should call path.basename');
            });
        });

        describe('edge cases', function()
        {
            it('should handle empty process.argv gracefully', function()
            {
                // Set up empty process.argv
                context.process.argv = [];

                // Execute the squirrel script
                vm.runInContext(squirrelCode, context);
                const { handleSquirrelEvent } = context.module.exports;

                const result = handleSquirrelEvent(mockApplication);

                // Empty array has length 0, not 1, so it should return undefined (fall through switch)
                assert.strictEqual(result, undefined, 'Should return undefined for empty argv (length 0)');
            });

            it('should handle single argument process.argv', function()
            {
                // Set up process.argv with only one argument (length === 1)
                context.process.argv = ['node'];

                // Execute the squirrel script
                vm.runInContext(squirrelCode, context);
                const { handleSquirrelEvent } = context.module.exports;

                const result = handleSquirrelEvent(mockApplication);

                assert.strictEqual(result, false, 'Should return false when process.argv.length === 1');
            });

            it('should handle null application parameter for non-quit events', function()
            {
                // Set up process.argv for install event (doesn't immediately call quit but schedules it)
                context.process.argv = ['node', '--squirrel-install'];

                // Execute the squirrel script
                vm.runInContext(squirrelCode, context);
                const { handleSquirrelEvent } = context.module.exports;

                // Test with null application - will fail when trying to access application.quit
                assert.throws(() =>
                {
                    handleSquirrelEvent(null);
                }, /Cannot read properties of null/, 'Should throw when application is null even for install event due to setTimeout callback');
            });

            it('should throw when application is null for obsolete event', function()
            {
                // Set up process.argv for obsolete event (immediately calls quit)
                context.process.argv = ['node', '--squirrel-obsolete'];

                // Execute the squirrel script
                vm.runInContext(squirrelCode, context);
                const { handleSquirrelEvent } = context.module.exports;

                // Test with null application - should crash for obsolete event
                assert.throws(() =>
                {
                    handleSquirrelEvent(null);
                }, /Cannot read properties of null/, 'Should throw when application is null for obsolete event');
            });

            it('should handle multiple arguments correctly', function()
            {
                // Set up process.argv with multiple arguments
                context.process.argv = ['node', '--squirrel-install', 'extra-arg'];

                // Execute the squirrel script
                vm.runInContext(squirrelCode, context);
                const { handleSquirrelEvent } = context.module.exports;

                const result = handleSquirrelEvent(mockApplication);

                assert.strictEqual(result, true, 'Should handle install event even with extra arguments');
            });
        });

        describe('spawn error handling', function()
        {
            it('should handle spawn errors gracefully', function()
            {
                // Mock spawn to throw an error
                mockChildProcess.spawn = stub().throws(new Error('Spawn failed'));

                // Set up process.argv for install event
                context.process.argv = ['node', '--squirrel-install'];

                // Execute the squirrel script
                vm.runInContext(squirrelCode, context);
                const { handleSquirrelEvent } = context.module.exports;

                // Should not throw even if spawn fails
                assert.doesNotThrow(() =>
                {
                    const result = handleSquirrelEvent(mockApplication);
                    assert.strictEqual(result, true, 'Should still return true even if spawn fails');
                }, 'Should handle spawn errors gracefully');
            });
        });
    });
});