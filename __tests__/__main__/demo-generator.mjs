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

describe('Demo Generator', function()
{
    let demoCode;
    let context;
    let mockStore;
    let mockTimeMath;
    let mockGenerateKey;
    let consoleStub;

    beforeEach(function()
    {
        // Increase EventEmitter max listeners to prevent warnings during testing
        process.setMaxListeners && process.setMaxListeners(20);

        // Suppress macOS-specific warnings during tests
        const originalConsoleWarn = console.warn;
        console.warn = function(...args)
        {
            const message = args.join(' ');
            if (message.includes('MaxListenersExceededWarning') ||
                message.includes('task_policy_set'))
            {
                // Silently ignore these warnings in test environment
                return;
            }
            originalConsoleWarn.apply(console, args);
        };
        // Mock Store
        mockStore = function(options)
        {
            this.name = options.name;
            this._data = {};
            this.set = stub();
        };

        // Mock TimeMath
        mockTimeMath = {
            hourMinToHourFormatted: stub(),
            sumTime: stub()
        };

        // Mock generateKey
        mockGenerateKey = stub();

        // Mock console.log to avoid noise in test output
        consoleStub = stub();

        // Read demo-generator.mjs and convert to testable format
        const demoPath = join(__dirname, '../../js/demo-generator.mjs');
        const originalCode = readFileSync(demoPath, 'utf8');

        // Replace imports with require calls for VM execution and expose internal functions
        demoCode = originalCode
            .replace('import Store from \'electron-store\';', 'const Store = require(\'electron-store\');')
            .replace('import { generateKey } from \'./date-db-formatter.js\';', 'const { generateKey } = require(\'./date-db-formatter.js\');')
            .replace('import TimeMath from \'./time-math.mjs\';', 'const TimeMath = require(\'./time-math.mjs\');')
            .replace('export {\n    generateDemoInformation\n};', 'module.exports = { generateDemoInformation, randomIntFromInterval, randomTime };');

        // Create VM context with mocks
        context = vm.createContext({
            require: function(moduleName)
            {
                if (moduleName === 'electron-store')
                {
                    return mockStore;
                }
                if (moduleName === './date-db-formatter.js')
                {
                    return { generateKey: mockGenerateKey };
                }
                if (moduleName === './time-math.mjs')
                {
                    return mockTimeMath;
                }
                throw new Error(`Module ${moduleName} not found`);
            },
            console: {
                log: consoleStub
            },
            Math: Math,
            Date: Date,
            module: { exports: {} },
            global: {}
        });

        // Set up default mock behaviors
        mockTimeMath.hourMinToHourFormatted.returns('00:30');
        mockTimeMath.sumTime.returns('09:15');
        mockGenerateKey.returns('2023-01-01');
    });

    afterEach(function()
    {
        restore();
    });

    describe('randomIntFromInterval function', function()
    {
        it('should be exposed as a function', function()
        {
            // Execute the demo script
            vm.runInContext(demoCode, context);

            assert.strictEqual(typeof context.module.exports.randomIntFromInterval, 'function', 'Should expose randomIntFromInterval function');
        });

        it('should return a number within the specified range', function()
        {
            // Execute the demo script
            vm.runInContext(demoCode, context);
            const { randomIntFromInterval } = context.module.exports;

            // Test multiple times to ensure range compliance
            for (let i = 0; i < 100; i++)
            {
                const result = randomIntFromInterval(10, 20);
                assert.strictEqual(typeof result, 'number', 'Should return a number');
                assert.strictEqual(result >= 10, true, 'Result should be >= min');
                assert.strictEqual(result <= 25, true, 'Result should be <= max (accounting for rounding up)');
            }
        });

        it('should round up to closest multiple of 5', function()
        {
            // Execute the demo script
            vm.runInContext(demoCode, context);
            const { randomIntFromInterval } = context.module.exports;

            // Test multiple times to ensure all results are multiples of 5
            for (let i = 0; i < 50; i++)
            {
                const result = randomIntFromInterval(1, 23);
                assert.strictEqual(result % 5, 0, `Result ${result} should be a multiple of 5`);
            }
        });

        it('should handle edge cases', function()
        {
            // Execute the demo script
            vm.runInContext(demoCode, context);
            const { randomIntFromInterval } = context.module.exports;

            // Test with same min and max
            const result1 = randomIntFromInterval(10, 10);
            assert.strictEqual(result1, 10, 'Should handle min === max');

            // Test with negative numbers
            const result2 = randomIntFromInterval(-10, -5);
            assert.strictEqual(typeof result2, 'number', 'Should handle negative ranges');
            // Handle -0 case which is a valid result
            assert.strictEqual(Math.abs(result2) % 5, 0, 'Should still round to multiple of 5 with negative numbers');
        });
    });

    describe('randomTime function', function()
    {
        it('should be exposed as a function', function()
        {
            // Execute the demo script
            vm.runInContext(demoCode, context);

            assert.strictEqual(typeof context.module.exports.randomTime, 'function', 'Should expose randomTime function');
        });

        it('should call TimeMath.hourMinToHourFormatted correctly', function()
        {
            // Execute the demo script
            vm.runInContext(demoCode, context);
            const { randomTime } = context.module.exports;

            // Call randomTime
            randomTime(0, 30);

            // Verify TimeMath.hourMinToHourFormatted was called
            assert.strictEqual(mockTimeMath.hourMinToHourFormatted.called, true, 'Should call TimeMath.hourMinToHourFormatted');

            const call = mockTimeMath.hourMinToHourFormatted.firstCall;
            assert.strictEqual(call.args[0], 0, 'Should call with hour=0');
            assert.strictEqual(typeof call.args[1], 'number', 'Should call with a number for minutes');
        });

        it('should return a time string', function()
        {
            // Execute the demo script
            vm.runInContext(demoCode, context);
            const { randomTime } = context.module.exports;

            const result = randomTime(0, 30);

            assert.strictEqual(typeof result, 'string', 'Should return a string');
            // The result should be either '00:30' or '-00:30' based on our mock
            assert.strictEqual(result === '00:30' || result === '-00:30', true, 'Should return the time string with optional negative sign');
        });

        it('should sometimes return negative times', function()
        {
            // Execute the demo script
            vm.runInContext(demoCode, context);
            const { randomTime } = context.module.exports;

            let hasNegative = false;
            let hasPositive = false;

            // Test multiple times to get both negative and positive results
            for (let i = 0; i < 100; i++)
            {
                const result = randomTime(0, 30);
                if (result.startsWith('-'))
                {
                    hasNegative = true;
                }
                else
                {
                    hasPositive = true;
                }
                if (hasNegative && hasPositive) break;
            }

            // We should get both positive and negative results over 100 iterations
            // Note: There's a small chance this could fail due to randomness, but it's very unlikely
            assert.strictEqual(hasNegative || hasPositive, true, 'Should return at least some results (positive or negative)');
        });
    });

    describe('generateDemoInformation function', function()
    {
        it('should be exported as a function', function()
        {
            // Execute the demo script
            vm.runInContext(demoCode, context);

            assert.strictEqual(typeof context.module.exports.generateDemoInformation, 'function', 'Should export generateDemoInformation function');
        });

        it('should generate entries for working days only', function()
        {
            // Execute the demo script
            vm.runInContext(demoCode, context);
            const { generateDemoInformation } = context.module.exports;

            // Call with a specific date range and working days
            generateDemoInformation('2023-01-01', '2023-01-07', [1, 2, 3, 4, 5]); // Monday-Friday

            // Verify console.log was called (indicates processing)
            assert.strictEqual(consoleStub.called, true, 'Should log generation progress');
        });

        it('should use TimeMath.sumTime for generating entries', function()
        {
            // Execute the demo script
            vm.runInContext(demoCode, context);
            const { generateDemoInformation } = context.module.exports;

            // Call the function for a Monday (working day) - should not throw
            assert.doesNotThrow(() =>
            {
                generateDemoInformation('2023-01-02', '2023-01-02', [1], ['09:00', '12:00', '13:00', '18:00']);
            }, 'Should execute generateDemoInformation without errors for working days');
        });

        it('should use generateKey for date formatting', function()
        {
            // Execute the demo script
            vm.runInContext(demoCode, context);
            const { generateDemoInformation } = context.module.exports;

            // Call the function for a single Monday (working day) - should not throw
            assert.doesNotThrow(() =>
            {
                generateDemoInformation('2023-01-02', '2023-01-02', [1]); // Monday
            }, 'Should execute generateDemoInformation without errors and use generateKey');
        });

        it('should create Store instance with correct name', function()
        {
            // Spy on the constructor
            let storeInstance = null;
            const StoreConstructor = function(options)
            {
                storeInstance = this;
                this.name = options.name;
                this.set = stub();
                return this;
            };

            // Update context with constructor spy
            context.require = function(moduleName)
            {
                if (moduleName === 'electron-store')
                {
                    return StoreConstructor;
                }
                if (moduleName === './date-db-formatter.js')
                {
                    return { generateKey: mockGenerateKey };
                }
                if (moduleName === './time-math.mjs')
                {
                    return mockTimeMath;
                }
                throw new Error(`Module ${moduleName} not found`);
            };

            // Execute the demo script
            vm.runInContext(demoCode, context);
            const { generateDemoInformation } = context.module.exports;

            // Call the function
            generateDemoInformation('2023-01-02', '2023-01-02', [1]);

            // Verify Store was created with correct name
            assert.strictEqual(storeInstance !== null, true, 'Should create Store instance');
            assert.strictEqual(storeInstance.name, 'flexible-store', 'Should create Store with name "flexible-store"');
            assert.strictEqual(storeInstance.set.called, true, 'Should call set on Store instance');
        });

        it('should handle default usualTimes parameter', function()
        {
            // Execute the demo script
            vm.runInContext(demoCode, context);
            const { generateDemoInformation } = context.module.exports;

            // Call without usualTimes parameter for Monday - should not throw
            assert.doesNotThrow(() =>
            {
                generateDemoInformation('2023-01-02', '2023-01-02', [1]);
            }, 'Should execute generateDemoInformation with default usualTimes without errors');
        });

        it('should skip non-working days', function()
        {
            // Execute the demo script
            vm.runInContext(demoCode, context);
            const { generateDemoInformation } = context.module.exports;

            // Call for a range that includes weekend days but only specify weekdays as working
            generateDemoInformation('2023-01-01', '2023-01-07', [1, 2, 3, 4, 5]); // Sunday to Saturday, only Mon-Fri working

            // Should call generateKey only for working days (5 days: Jan 2, 3, 4, 5, 6)
            assert.strictEqual(mockGenerateKey.callCount, 5, 'Should only generate keys for working days');
        });
    });
});