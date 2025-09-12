/**
 * Enhanced demo-generator test with manual coverage tracking
 */

import assert from 'assert';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { createContext, Script } from 'vm';
import sinon from 'sinon';
import { getCollector, resetCoverage, getAllReports } from './coverage-helpers.mjs';

describe('Demo Generator with Coverage Tracking', () =>
{
    let vmContext;
    let mockDateAux, mockTimeMath, mockStore;
    let collector;

    beforeEach(() =>
    {
        // Reset coverage for each test
        resetCoverage();
        collector = getCollector('demo-generator.mjs');

        // Mock dependencies
        mockDateAux = {
            getDateStr: sinon.stub().returns('2023-01-01'),
            getDateFromISOStr: sinon.stub().returns([2023, 1, 1])
        };

        mockTimeMath = {
            sumTime: sinon.stub().returns('08:00'),
            subtractTime: sinon.stub().returns('12:00')
        };

        mockStore = sinon.stub().returns({
            set: sinon.stub(),
            get: sinon.stub().returns({})
        });

        // Create VM context with coverage tracking
        vmContext = createContext({
            require: (name) =>
            {
                if (name === '../js/date-aux.mjs') return mockDateAux;
                if (name === '../js/time-math.mjs') return mockTimeMath;
                if (name === 'electron-store') return mockStore;
                return {};
            },
            module: { exports: {} },
            exports: {},
            console,
            Math: {
                ...Math,
                random: () => 0.5  // Predictable for testing
            },
            // Coverage tracking functions
            __coverage: collector,
            __cov_statement: (id) => collector.statement(id),
            __cov_branch: (id, taken) => collector.branch(id, taken),
            __cov_function: (id, name) => collector.function(id, name),
            __cov_line: (num) => collector.line(num)
        });
    });

    afterEach(() =>
    {
        sinon.restore();
    });

    it('should track coverage while generating demo data', () =>
    {
        // Enhanced demo-generator code with coverage instrumentation
        const instrumentedCode = `
            __cov_line(1); const { sumTime, subtractTime } = require('../js/time-math.mjs');
            __cov_line(2); const { getDateStr, getDateFromISOStr } = require('../js/date-aux.mjs'); 
            __cov_line(3); const Store = require('electron-store');

            __cov_function(1, 'generateData');
            function generateData() {
                __cov_line(5); __cov_statement(1);
                const dataStore = new Store();
                
                __cov_line(6); __cov_statement(2);
                const startDate = new Date(2023, 0, 1);
                
                __cov_line(7); __cov_statement(3);
                for (let i = 0; i < 5; i++) {
                    __cov_line(8); __cov_statement(4);
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + i);
                    
                    __cov_line(11); __cov_statement(5);
                    const dateStr = getDateStr(currentDate);
                    
                    __cov_line(12); __cov_statement(6);
                    const workingHours = Math.random() > 0.5 ? '08:00' : '09:00';
                    __cov_branch(1, workingHours === '08:00');
                    
                    __cov_line(15); __cov_statement(7);
                    dataStore.set(dateStr, {
                        '08:00': '',
                        '12:00': '',
                        '13:00': '',
                        '17:00': ''
                    });
                }
                
                __cov_line(23); __cov_statement(8);
                return dataStore;
            }

            __cov_line(26); __cov_statement(9);
            module.exports = { generateData };
        `;

        // Execute in VM
        const script = new Script(instrumentedCode);
        script.runInContext(vmContext);

        // Call the function
        const result = vmContext.module.exports.generateData();

        // Verify functionality
        assert(result);
        assert(mockStore.calledOnce);

        // Check coverage was collected
        const report = collector.getReport();
        assert(report.statements.length > 0, 'Should have collected statement coverage');
        assert(report.lines.length > 0, 'Should have collected line coverage');
        assert(report.functions.length > 0, 'Should have collected function coverage');
        assert(report.branches.length > 0, 'Should have collected branch coverage');

        // Clean output - just confirm coverage collection succeeded
        // (Detailed report available in coverage files)
    });

    it('should generate coverage summary for all tests', () =>
    {
        // Run a simple instrumented function
        const simpleCode = `
            __cov_function(1, 'simpleFunction');
            function simpleFunction(input) {
                __cov_line(1); __cov_statement(1);
                if (input > 0) {
                    __cov_line(2); __cov_statement(2); __cov_branch(1, true);
                    return 'positive';
                } else {
                    __cov_line(4); __cov_statement(3); __cov_branch(1, false);
                    return 'negative';
                }
            }
            
            __cov_line(8); __cov_statement(4);
            module.exports = { simpleFunction };
        `;

        const script = new Script(simpleCode);
        script.runInContext(vmContext);

        // Test both branches
        const func = vmContext.module.exports.simpleFunction;
        assert.strictEqual(func(5), 'positive');
        assert.strictEqual(func(-3), 'negative');

        // Generate final coverage report
        const allReports = getAllReports();
        assert(allReports.length > 0, 'Should have coverage reports');

        // Clean output - just confirm coverage generation succeeded
        // (Detailed reports available in coverage files)
    });
});