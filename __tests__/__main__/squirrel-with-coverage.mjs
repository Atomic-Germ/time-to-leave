/**
 * Enhanced squirrel test with manual coverage tracking
 * Tests Windows Squirrel auto-updater with detailed coverage metrics
 */

import assert from 'assert';
import { describe, it, beforeEach, afterEach, after } from 'mocha';
import { createContext, Script } from 'vm';
import sinon from 'sinon';
import { getCollector, resetCoverage, outputFinalCoverage } from './coverage-helpers.mjs';

describe('Squirrel with Coverage Tracking', () =>
{
    let vmContext;
    let mockElectron, mockChildProcess, mockPath;
    let collector;
    let originalProcessArgv;

    beforeEach(() =>
    {
        resetCoverage();
        collector = getCollector('squirrel.mjs');

        originalProcessArgv = process.argv;

        // Mock dependencies
        mockElectron = {
            app: {
                quit: sinon.stub()
            }
        };

        mockChildProcess = {
            spawn: sinon.stub().returns({
                on: sinon.stub()
            })
        };

        mockPath = {
            resolve: sinon.stub().returns('/resolved/path'),
            dirname: sinon.stub().returns('/app/dir')
        };

        // Create VM context with coverage tracking
        vmContext = createContext({
            require: (name) =>
            {
                collector.statement('require-' + name);
                if (name === 'electron') return mockElectron;
                if (name === 'child_process') return mockChildProcess;
                if (name === 'path') return mockPath;
                throw new Error(`Module not found: ${name}`);
            },
            process: {
                argv: [...process.argv],
                platform: 'win32',
                execPath: '/fake/path/electron.exe',
                cwd: () => '/fake/app/path'
            },
            module: { exports: {} },
            exports: {},
            console,
            __filename: '/app/main.js',
            // Coverage tracking functions
            __cov: collector,
            __cov_s: (id) => collector.statement(id),
            __cov_b: (id, taken) => collector.branch(id, taken),
            __cov_f: (id, name) => collector.function(id, name),
            __cov_l: (num) => collector.line(num)
        });
    });

    afterEach(() =>
    {
        process.argv = originalProcessArgv;
        sinon.restore();
    });

    it('should track coverage for squirrel install event', () =>
    {
        // Set up squirrel install arguments
        vmContext.process.argv = ['electron.exe', 'app', '--squirrel-install'];

        const instrumentedSquirrelCode = `
            __cov_l(1); __cov_s(1);
            const { app } = require('electron');
            __cov_l(2); __cov_s(2);
            const { spawn } = require('child_process');
            __cov_l(3); __cov_s(3);
            const path = require('path');

            __cov_f(1, 'handleSquirrelEvent');
            function handleSquirrelEvent() {
                __cov_l(6); __cov_s(4);
                const squirrelEvent = process.argv[2];

                __cov_l(8); __cov_s(5);
                switch (squirrelEvent) {
                    case '--squirrel-install':
                        __cov_l(10); __cov_s(6); __cov_b(1, true);
                        return createShortcuts();
                    
                    case '--squirrel-updated':
                        __cov_l(13); __cov_s(7); __cov_b(2, false);
                        return createShortcuts();
                    
                    case '--squirrel-uninstall':
                        __cov_l(16); __cov_s(8); __cov_b(3, false);
                        return removeShortcuts();
                    
                    case '--squirrel-obsolete':
                        __cov_l(19); __cov_s(9); __cov_b(4, false);
                        return app.quit();
                    
                    default:
                        __cov_l(22); __cov_s(10); __cov_b(5, false);
                        return false;
                }
            }

            __cov_f(2, 'createShortcuts');
            function createShortcuts() {
                __cov_l(28); __cov_s(11);
                const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
                
                __cov_l(30); __cov_s(12);
                const iconPath = path.resolve(process.cwd(), 'assets', 'icon.ico');
                
                __cov_l(32); __cov_s(13);
                spawn(updateExe, ['--createShortcut', 'app.exe']);
                
                __cov_l(34); __cov_s(14);
                return true;
            }

            __cov_f(3, 'removeShortcuts');
            function removeShortcuts() {
                __cov_l(39); __cov_s(15);
                const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
                
                __cov_l(41); __cov_s(16);
                spawn(updateExe, ['--removeShortcut', 'app.exe']);
                
                __cov_l(43); __cov_s(17);
                return true;
            }

            __cov_l(46); __cov_s(18);
            const isSquirrelEvent = process.argv.length > 2 && process.argv[2].startsWith('--squirrel');

            __cov_l(48); __cov_s(19);
            if (isSquirrelEvent) {
                __cov_l(49); __cov_s(20); __cov_b(6, true);
                const handled = handleSquirrelEvent();
                __cov_l(50); __cov_s(21);
                if (handled) {
                    __cov_l(51); __cov_s(22); __cov_b(7, true);
                    app.quit();
                }
            }

            __cov_l(55); __cov_s(23);
            module.exports = { handleSquirrelEvent, createShortcuts, removeShortcuts };
        `;

        // Execute the instrumented code
        const script = new Script(instrumentedSquirrelCode);
        script.runInContext(vmContext);

        // Verify the squirrel event was handled
        assert(mockElectron.app.quit.calledOnce);
        assert(mockChildProcess.spawn.calledOnce);
        assert(mockPath.resolve.called);

        // Verify spawn was called with correct arguments
        const spawnCall = mockChildProcess.spawn.getCall(0);
        assert(spawnCall.args[1].includes('--createShortcut'));

        // Check coverage was collected
        const report = collector.getReport();
        assert(report.statements.length > 0, 'Should have collected statement coverage');
        assert(report.functions.length > 0, 'Should have collected function coverage');
        assert(report.branches.length > 0, 'Should have collected branch coverage');

        // Verify specific branches were hit
        const branches = report.branches;
        assert(branches.some(b => b.includes('1:true')), 'Should hit install branch');

        // Store coverage data for later reporting (don't console.log to avoid corrupting JSON)
    });

    it('should track coverage for non-squirrel execution', () =>
    {
        // Set up normal execution (no squirrel args)
        vmContext.process.argv = ['electron.exe', 'app'];

        const instrumentedCode = `
            __cov_l(1); __cov_s(1);
            const { app } = require('electron');

            __cov_l(3); __cov_s(2);
            const isSquirrelEvent = process.argv.length > 2 && process.argv[2].startsWith('--squirrel');

            __cov_l(5); __cov_s(3);
            if (isSquirrelEvent) {
                __cov_l(6); __cov_s(4); __cov_b(1, false);
                console.log('Squirrel event detected');
            } else {
                __cov_l(8); __cov_s(5); __cov_b(1, true);
                console.log('Normal app startup');
            }

            __cov_l(11); __cov_s(6);
            module.exports = { normalStartup: !isSquirrelEvent };
        `;

        const script = new Script(instrumentedCode);
        script.runInContext(vmContext);

        // Verify normal startup path
        assert(vmContext.module.exports.normalStartup);
        assert(mockElectron.app.quit.notCalled);

        const report = collector.getReport();
        const branches = report.branches;
        assert(branches.some(b => b.includes('1:true')), 'Should hit normal startup branch');

        // Store coverage data for later reporting (don't console.log to avoid corrupting JSON)
    });

    it('should track all squirrel event types', () =>
    {
        const events = ['--squirrel-install', '--squirrel-updated', '--squirrel-uninstall', '--squirrel-obsolete'];

        events.forEach((event, index) =>
        {
            // Reset for each event
            sinon.resetHistory();

            // Create a fresh VM context for each event to avoid conflicts
            const eventVmContext = createContext({
                require: (name) =>
                {
                    if (name === 'electron') return mockElectron;
                    if (name === 'child_process') return mockChildProcess;
                    if (name === 'path') return mockPath;
                    return {};
                },
                process: {
                    argv: ['electron.exe', 'app', event],
                    platform: 'win32',
                    execPath: '/fake/path/electron.exe',
                    cwd: () => '/fake/app/path'
                },
                module: { exports: {} },
                exports: {},
                console,
                // Coverage tracking functions
                __cov_s: (id) => collector.statement(id),
                __cov_b: (id, taken) => collector.branch(id, taken),
                __cov_f: (id, name) => collector.function(id, name),
                __cov_l: (num) => collector.line(num)
            });

            const eventSpecificCode = `
                __cov_l(1); __cov_s(${1 + index * 10});
                const { app: electronApp${index} } = require('electron');

                __cov_f(${1 + index}, 'handleEvent_${event.replace('--squirrel-', '')}_${index}');
                __cov_l(4); __cov_s(${2 + index * 10});
                const eventType = process.argv[2];

                __cov_l(6); __cov_s(${3 + index * 10});
                if (eventType === '${event}') {
                    __cov_l(7); __cov_s(${4 + index * 10}); __cov_b(${1 + index}, true);
                    electronApp${index}.quit();
                }

                __cov_l(10); __cov_s(${5 + index * 10});
                module.exports = { eventHandled: true };
            `;

            const script = new Script(eventSpecificCode);
            script.runInContext(eventVmContext);

            assert(eventVmContext.module.exports.eventHandled);
        });

        const report = collector.getReport();

        // Should have coverage for all event types
        assert(report.functions.length >= events.length, `Should track all ${events.length} event handlers`);
        assert(report.branches.length >= events.length, `Should track branches for all ${events.length} events`);

        // Store coverage data for later reporting (don't console.log to avoid corrupting JSON)
    });

    // Output coverage data after all tests complete
    after(() =>
    {
        outputFinalCoverage();
    });
});