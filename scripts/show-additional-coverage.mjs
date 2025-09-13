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
            // First try to parse Mocha test results
            const resultsFile = path.join(manualDir, 'results.json');
            const coverageFile = path.join(manualDir, 'coverage-data.log');

            let testStats = null;
            let coverageData = null;

            // Parse test results if available
            if (fs.existsSync(resultsFile))
            {
                try
                {
                    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
                    testStats = results.stats;
                }
                catch (_)
                {
                    // Ignore parsing errors for test results
                }
            }

            // Parse coverage data if available
            if (fs.existsSync(coverageFile))
            {
                try
                {
                    const coverageLog = fs.readFileSync(coverageFile, 'utf8');
                    const coverageMatches = coverageLog.match(/MANUAL_COVERAGE_DATA: (.+)/g);
                    if (coverageMatches && coverageMatches.length > 0)
                    {
                        // Collect all coverage data from multiple test files
                        const allCoverageResults = [];
                        let totalFiles = 0;

                        for (const match of coverageMatches)
                        {
                            const dataMatch = match.match(/MANUAL_COVERAGE_DATA: (.+)/);
                            if (dataMatch)
                            {
                                const data = JSON.parse(dataMatch[1]);
                                allCoverageResults.push(...data.manualCoverageResults);
                                totalFiles += data.totalFiles;
                            }
                        }

                        coverageData = {
                            manualCoverageResults: allCoverageResults,
                            totalFiles: totalFiles
                        };
                    }
                }
                catch (_)
                {
                    // Ignore parsing errors
                }
            }

            // Display the information we have
            console.log('\n📊 Manual Instrumentation Coverage:');
            if (testStats)
            {
                console.log(`   Tests run: ${testStats.tests || 'N/A'}`);
                console.log(`   Passes: ${testStats.passes || 'N/A'}`);
                console.log(`   Failures: ${testStats.failures || 'N/A'}`);
                console.log(`   Duration: ${testStats.duration || 'N/A'}ms`);
            }

            if (coverageData)
            {
                console.log(`   Files with coverage: ${coverageData.totalFiles}`);
                coverageData.manualCoverageResults.forEach(result =>
                {
                    console.log(`   ${result.file}: ${result.summary.statements} statements, ${result.summary.functions} functions, ${result.summary.branches} branches`);
                });
            }

            if (testStats || coverageData)
            {
                this.hasReports = true;
            }
            else
            {
                console.log('   No valid coverage data found');
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
        const c8Dir = 'coverage_mocha';

        console.log('\n🔗 Combined Coverage Report:');

        // Check manual instrumentation coverage
        let hasManualCoverage = false;
        if (fs.existsSync(combinedDir))
        {
            const combinedFile = path.join(combinedDir, 'combined-coverage.json');
            if (fs.existsSync(combinedFile))
            {
                try
                {
                    const combined = JSON.parse(fs.readFileSync(combinedFile, 'utf8'));

                    // Show manual coverage files
                    if (combined.sources && Object.keys(combined.sources).length > 0)
                    {
                        console.log('\n   Manual Instrumentation Coverage:');
                        for (const [filename, fileData] of Object.entries(combined.sources))
                        {
                            console.log(`   📄 ${filename}`);

                            if (fileData.sources)
                            {
                                for (const [, metrics] of Object.entries(fileData.sources))
                                {
                                    if (metrics.statements)
                                    {
                                        const stmtPct = ((metrics.statements.covered / metrics.statements.total) * 100).toFixed(1);
                                        console.log(`      Statements: ${metrics.statements.covered}/${metrics.statements.total} (${stmtPct}%)`);
                                    }
                                    if (metrics.functions)
                                    {
                                        const funcPct = ((metrics.functions.covered / metrics.functions.total) * 100).toFixed(1);
                                        console.log(`      Functions: ${metrics.functions.covered}/${metrics.functions.total} (${funcPct}%)`);
                                    }
                                    if (metrics.branches)
                                    {
                                        const branchPct = ((metrics.branches.covered / metrics.branches.total) * 100).toFixed(1);
                                        console.log(`      Branches: ${metrics.branches.covered}/${metrics.branches.total} (${branchPct}%)`);
                                    }
                                }
                            }
                        }
                        hasManualCoverage = true;
                    }

                    if (combined.summary)
                    {
                        console.log('\n   Combined Summary:');
                        console.log(`   Total Files: ${combined.summary.totalFiles}`);
                        console.log(`   Covered Files: ${combined.summary.coveredFiles}`);
                        console.log(`   Statements: ${combined.summary.statements.percentage}%`);
                        console.log(`   Branches: ${combined.summary.branches.percentage}%`);
                        console.log(`   Functions: ${combined.summary.functions.percentage}%`);
                        console.log(`   Lines: ${combined.summary.lines.percentage}%`);
                    }
                }
                catch (_)
                {
                    console.log('   Unable to parse manual coverage data');
                }
            }
        }

        // Check C8 coverage
        let hasC8Coverage = false;
        if (fs.existsSync(c8Dir))
        {
            const c8File = path.join(c8Dir, 'coverage-final.json');
            if (fs.existsSync(c8File))
            {
                try
                {
                    const c8Data = JSON.parse(fs.readFileSync(c8File, 'utf8'));

                    if (Object.keys(c8Data).length > 0)
                    {
                        console.log('\n   C8 Mocha Test Coverage:');

                        let totalStatements = 0, coveredStatements = 0;
                        let totalFunctions = 0, coveredFunctions = 0;
                        let totalBranches = 0, coveredBranches = 0;

                        for (const [filepath, fileData] of Object.entries(c8Data))
                        {
                            const filename = filepath.split('/').pop();

                            // Calculate coverage for this file
                            const statements = fileData.s || {};
                            const functions = fileData.f || {};
                            const branches = fileData.b || {};

                            const fileStatements = Object.keys(statements).length;
                            const fileCoveredStatements = Object.values(statements).filter(count => count > 0).length;

                            const fileFunctions = Object.keys(functions).length;
                            const fileCoveredFunctions = Object.values(functions).filter(count => count > 0).length;

                            const fileBranches = Object.keys(branches).length;
                            const fileCoveredBranches = Object.values(branches).filter(branchArray =>
                                Array.isArray(branchArray) ? branchArray.some(count => count > 0) : branchArray > 0
                            ).length;

                            // Add to totals
                            totalStatements += fileStatements;
                            coveredStatements += fileCoveredStatements;
                            totalFunctions += fileFunctions;
                            coveredFunctions += fileCoveredFunctions;
                            totalBranches += fileBranches;
                            coveredBranches += fileCoveredBranches;

                            // Show individual file stats if they have coverage data
                            if (fileStatements > 0 || fileFunctions > 0 || fileBranches > 0)
                            {
                                console.log(`   📄 ${filename}`);
                                if (fileStatements > 0)
                                {
                                    const stmtPct = ((fileCoveredStatements / fileStatements) * 100).toFixed(1);
                                    console.log(`      Statements: ${fileCoveredStatements}/${fileStatements} (${stmtPct}%)`);
                                }
                                if (fileFunctions > 0)
                                {
                                    const funcPct = ((fileCoveredFunctions / fileFunctions) * 100).toFixed(1);
                                    console.log(`      Functions: ${fileCoveredFunctions}/${fileFunctions} (${funcPct}%)`);
                                }
                                if (fileBranches > 0)
                                {
                                    const branchPct = ((fileCoveredBranches / fileBranches) * 100).toFixed(1);
                                    console.log(`      Branches: ${fileCoveredBranches}/${fileBranches} (${branchPct}%)`);
                                }
                            }
                        }

                        // Show C8 totals
                        if (totalStatements > 0 || totalFunctions > 0 || totalBranches > 0)
                        {
                            console.log('\n   C8 Summary:');
                            if (totalStatements > 0)
                            {
                                const stmtPct = ((coveredStatements / totalStatements) * 100).toFixed(1);
                                console.log(`   Statements: ${coveredStatements}/${totalStatements} (${stmtPct}%)`);
                            }
                            if (totalFunctions > 0)
                            {
                                const funcPct = ((coveredFunctions / totalFunctions) * 100).toFixed(1);
                                console.log(`   Functions: ${coveredFunctions}/${totalFunctions} (${funcPct}%)`);
                            }
                            if (totalBranches > 0)
                            {
                                const branchPct = ((coveredBranches / totalBranches) * 100).toFixed(1);
                                console.log(`   Branches: ${coveredBranches}/${totalBranches} (${branchPct}%)`);
                            }
                        }

                        hasC8Coverage = true;
                    }
                }
                catch (error)
                {
                    console.log('   Unable to parse C8 coverage data:', error.message);
                }
            }
        }

        if (hasManualCoverage || hasC8Coverage)
        {
            this.hasReports = true;
        }
        else
        {
            console.log('   No coverage data found');
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