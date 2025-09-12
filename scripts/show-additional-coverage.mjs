#!/usr/bin/env node
/**
 * Display additional coverage information not captured by C8
 */

import fs from 'fs';
import path from 'path';

class AdditionalCoverageReporter
{
    constructor()
    {
        this.hasReports = false;
    }

    async showManualCoverage()
    {
        const manualDir = 'coverage_manual';
        if (fs.existsSync(manualDir))
        {
            const resultsFile = path.join(manualDir, 'results.json');
            if (fs.existsSync(resultsFile))
            {
                try
                {
                    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
                    console.log('\n📊 Manual Instrumentation Coverage:');
                    console.log(`   Tests run: ${results.stats?.tests || 'N/A'}`);
                    console.log(`   Passes: ${results.stats?.passes || 'N/A'}`);
                    console.log(`   Failures: ${results.stats?.failures || 'N/A'}`);
                    console.log(`   Duration: ${results.stats?.duration || 'N/A'}ms`);
                    this.hasReports = true;
                }
                catch (_)
                {
                    console.log('\n📊 Manual Instrumentation Coverage: Unable to parse results');
                }
            }
        }
    }

    async showNYCCoverage()
    {
        const nycDir = 'coverage_nyc';
        if (fs.existsSync(nycDir))
        {
            const summaryFile = path.join(nycDir, 'coverage-summary.json');
            if (fs.existsSync(summaryFile))
            {
                try
                {
                    const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
                    const total = summary.total;
                    if (total)
                    {
                        console.log('\n📈 NYC Alternative Coverage:');
                        console.log(`   Statements: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`);
                        console.log(`   Branches: ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`);
                        console.log(`   Functions: ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`);
                        console.log(`   Lines: ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})`);
                        this.hasReports = true;
                    }
                }
                catch (_)
                {
                    console.log('\n📈 NYC Alternative Coverage: Unable to parse summary');
                }
            }
        }
    }

    async showPlaywrightCoverage()
    {
        // Check for Playwright coverage files
        const playwrightFiles = [
            '__tests__/__main__/demo-generator-with-coverage-playwright.mjs',
            '__tests__/__main__/preload-coverage-playwright.mjs'
        ];

        let hasPlaywrightTests = false;
        for (const file of playwrightFiles)
        {
            if (fs.existsSync(file))
            {
                hasPlaywrightTests = true;
                break;
            }
        }

        if (hasPlaywrightTests)
        {
            console.log('\n🎭 Playwright Coverage Tests: Available but not executed in standard test run');
            console.log('   Run `npm run test:playwright` for Playwright-specific coverage');
            this.hasReports = true;
        }
    }

    async showCombinedCoverage()
    {
        const combinedDir = 'coverage_combined';
        if (fs.existsSync(combinedDir))
        {
            const combinedFile = path.join(combinedDir, 'combined-coverage.json');
            if (fs.existsSync(combinedFile))
            {
                try
                {
                    const combined = JSON.parse(fs.readFileSync(combinedFile, 'utf8'));
                    if (combined.summary)
                    {
                        console.log('\n🔗 Combined Coverage Report:');
                        console.log(`   Total Files: ${combined.summary.totalFiles}`);
                        console.log(`   Covered Files: ${combined.summary.coveredFiles}`);
                        console.log(`   Statements: ${combined.summary.statements.percentage}%`);
                        console.log(`   Branches: ${combined.summary.branches.percentage}%`);
                        console.log(`   Functions: ${combined.summary.functions.percentage}%`);
                        console.log(`   Lines: ${combined.summary.lines.percentage}%`);
                        this.hasReports = true;
                    }
                }
                catch (_)
                {
                    console.log('\n🔗 Combined Coverage Report: Unable to parse data');
                }
            }
        }
    }

    async showTestFileBreakdown()
    {
        console.log('\n🧪 Test Coverage Sources:');

        const mainTests = fs.readdirSync('__tests__/__main__')
            .filter(f => f.endsWith('.mjs'))
            .length;

        const rendererTests = fs.existsSync('__tests__/__renderer__')
            ? fs.readdirSync('__tests__/__renderer__')
                .filter(f => f.endsWith('.mjs'))
                .length
            : 0;

        const coverageTests = fs.readdirSync('__tests__/__main__')
            .filter(f => f.includes('-with-coverage') || f.includes('-coverage-'))
            .length;

        const playwrightTests = fs.readdirSync('__tests__/__main__')
            .filter(f => f.includes('playwright'))
            .length;

        console.log(`   Standard main tests: ${mainTests - coverageTests - playwrightTests}`);
        console.log(`   Renderer tests: ${rendererTests}`);
        console.log(`   Manual coverage tests: ${coverageTests}`);
        console.log(`   Playwright tests: ${playwrightTests}`);

        this.hasReports = true;
    }

    async generateReport()
    {
        console.log('\n🔍 Additional Coverage Information:');

        await this.showTestFileBreakdown();
        await this.showManualCoverage();
        await this.showNYCCoverage();
        await this.showCombinedCoverage();
        await this.showPlaywrightCoverage();

        if (!this.hasReports)
        {
            console.log('\n   No additional coverage data available.');
            console.log('   Run `npm run test:coverage-enhanced` to generate comprehensive coverage reports.');
        }

        console.log('\n💡 Coverage Enhancement Options:');
        console.log('   • `npm run test:coverage-enhanced` - Run all coverage types');
        console.log('   • `npm run coverage:all` - Generate combined coverage reports');
        console.log('   • `npm run coverage:report` - Generate HTML coverage dashboard');
    }
}

// Run the reporter
if (import.meta.url === `file://${process.argv[1]}`)
{
    (async() =>
    {
        const reporter = new AdditionalCoverageReporter();
        await reporter.generateReport();
    })();
}