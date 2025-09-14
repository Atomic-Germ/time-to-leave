#!/usr/bin/env node
/**
 * Coverage combining script - merges coverage data from multiple sources
 * Combines NYC, Manual Instrumentation, and Playwright coverage data
 */

import fs from 'fs';
import path from 'path';

class CoverageCombiner
{
    constructor()
    {
        this.combinedCoverage = {
            timestamp: new Date().toISOString(),
            sources: {
                nyc: null,
                manual: null,
                playwright: null
            },
            summary: {
                totalFiles: 0,
                coveredFiles: 0,
                statements: { total: 0, covered: 0, percentage: 0 },
                branches: { total: 0, covered: 0, percentage: 0 },
                functions: { total: 0, covered: 0, percentage: 0 },
                lines: { total: 0, covered: 0, percentage: 0 }
            },
            files: {}
        };
    }

    async loadNYCCoverage()
    {
        try
        {
            const nycFile = 'coverage_nyc/coverage-final.json';
            if (fs.existsSync(nycFile))
            {
                const nycData = JSON.parse(fs.readFileSync(nycFile, 'utf8'));
                this.combinedCoverage.sources.nyc = nycData;
                console.log('✅ Loaded NYC coverage data');
                return nycData;
            }
        }
        catch
        {
            console.log('⚠️  No NYC coverage data found');
        }
        return null;
    }

    async loadManualCoverage()
    {
        try
        {
            const manualFile = 'coverage_manual/results.json';
            if (fs.existsSync(manualFile))
            {
                const manualData = JSON.parse(fs.readFileSync(manualFile, 'utf8'));
                this.combinedCoverage.sources.manual = manualData;
                console.log('✅ Loaded manual coverage data');
                return manualData;
            }
        }
        catch
        {
            console.log('⚠️  No manual coverage data found');
        }
        return null;
    }

    async loadPlaywrightCoverage()
    {
        try
        {
            const playwrightFile = 'coverage_playwright/preload-coverage.json';
            if (fs.existsSync(playwrightFile))
            {
                const playwrightData = JSON.parse(fs.readFileSync(playwrightFile, 'utf8'));
                this.combinedCoverage.sources.playwright = playwrightData;
                console.log('✅ Loaded Playwright coverage data');
                return playwrightData;
            }
        }
        catch
        {
            console.log('⚠️  No Playwright coverage data found');
        }
        return null;
    }

    processNYCData(nycData)
    {
        if (!nycData) return;

        for (const [filePath, fileData] of Object.entries(nycData))
        {
            const fileName = path.basename(filePath);

            if (!this.combinedCoverage.files[fileName])
            {
                this.combinedCoverage.files[fileName] = {
                    path: filePath,
                    sources: {},
                    summary: {}
                };
            }

            // Process NYC file data
            const statements = Object.keys(fileData.s || {});
            const branches = Object.keys(fileData.b || {});
            const functions = Object.keys(fileData.f || {});
            const lines = Object.keys(fileData.l || {});

            const coveredStatements = statements.filter(s => fileData.s[s] > 0).length;
            const coveredBranches = branches.filter(b => fileData.b[b].some(count => count > 0)).length;
            const coveredFunctions = functions.filter(f => fileData.f[f] > 0).length;
            const coveredLines = lines.filter(l => fileData.l[l] > 0).length;

            this.combinedCoverage.files[fileName].sources.nyc = {
                statements: { total: statements.length, covered: coveredStatements },
                branches: { total: branches.length, covered: coveredBranches },
                functions: { total: functions.length, covered: coveredFunctions },
                lines: { total: lines.length, covered: coveredLines }
            };
        }
    }

    processManualData(manualData)
    {
        if (!manualData || !manualData.tests) return;

        // Extract coverage data from test results
        manualData.tests.forEach(test =>
        {
            if (test.title && test.title.includes('Coverage'))
            {
                // Look for coverage reports in test output
                // This would need to be adapted based on actual manual test output format
                console.log(`Processing manual test: ${test.title}`);
            }
        });
    }

    processPlaywrightData(playwrightData)
    {
        if (!playwrightData || !Array.isArray(playwrightData)) return;

        playwrightData.forEach(coverage =>
        {
            const fileName = path.basename(coverage.url);

            if (fileName.includes('preload') || fileName.includes('renderer'))
            {
                if (!this.combinedCoverage.files[fileName])
                {
                    this.combinedCoverage.files[fileName] = {
                        path: coverage.url,
                        sources: {},
                        summary: {}
                    };
                }

                // Calculate Playwright coverage metrics
                const totalChars = coverage.source.length;
                const coveredChars = coverage.ranges.reduce((sum, range) =>
                    sum + (range.end - range.start), 0);
                const coveragePercent = totalChars > 0 ? (coveredChars / totalChars) * 100 : 0;

                this.combinedCoverage.files[fileName].sources.playwright = {
                    characters: { total: totalChars, covered: coveredChars },
                    percentage: coveragePercent,
                    ranges: coverage.ranges.length
                };
            }
        });
    }

    calculateSummary()
    {
        let totalStatements = 0, coveredStatements = 0;
        let totalBranches = 0, coveredBranches = 0;
        let totalFunctions = 0, coveredFunctions = 0;
        let totalLines = 0, coveredLines = 0;
        let totalFiles = 0, coveredFiles = 0;

        for (const [, fileData] of Object.entries(this.combinedCoverage.files))
        {
            totalFiles++;

            // Aggregate NYC data
            if (fileData.sources.nyc)
            {
                totalStatements += fileData.sources.nyc.statements.total;
                coveredStatements += fileData.sources.nyc.statements.covered;
                totalBranches += fileData.sources.nyc.branches.total;
                coveredBranches += fileData.sources.nyc.branches.covered;
                totalFunctions += fileData.sources.nyc.functions.total;
                coveredFunctions += fileData.sources.nyc.functions.covered;
                totalLines += fileData.sources.nyc.lines.total;
                coveredLines += fileData.sources.nyc.lines.covered;
            }

            // Count as covered if any source has coverage
            if (fileData.sources.nyc || fileData.sources.manual || fileData.sources.playwright)
            {
                coveredFiles++;
            }
        }

        this.combinedCoverage.summary = {
            totalFiles,
            coveredFiles,
            statements: {
                total: totalStatements,
                covered: coveredStatements,
                percentage: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0
            },
            branches: {
                total: totalBranches,
                covered: coveredBranches,
                percentage: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0
            },
            functions: {
                total: totalFunctions,
                covered: coveredFunctions,
                percentage: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0
            },
            lines: {
                total: totalLines,
                covered: coveredLines,
                percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
            }
        };
    }

    async generateReport()
    {
        console.log('\n🔍 Combining coverage data from all sources...\n');

        // Load data from all sources
        const nycData = await this.loadNYCCoverage();
        const manualData = await this.loadManualCoverage();
        const playwrightData = await this.loadPlaywrightCoverage();

        // Process each data source
        this.processNYCData(nycData);
        this.processManualData(manualData);
        this.processPlaywrightData(playwrightData);

        // Calculate combined summary
        this.calculateSummary();

        // Save combined report
        const outputDir = 'coverage_combined';
        fs.mkdirSync(outputDir, { recursive: true });

        const reportFile = path.join(outputDir, 'combined-coverage.json');
        fs.writeFileSync(reportFile, JSON.stringify(this.combinedCoverage, null, 2));

        console.log(`\n📊 Combined coverage report saved to: ${reportFile}\n`);

        // Generate summary report
        this.printSummary();

        return this.combinedCoverage;
    }

    printSummary()
    {
        const { summary } = this.combinedCoverage;

        console.log('📋 COMBINED COVERAGE SUMMARY');
        console.log('=' .repeat(50));
        console.log(`Files: ${summary.coveredFiles}/${summary.totalFiles} (${((summary.coveredFiles / summary.totalFiles) * 100).toFixed(2)}%)`);
        console.log(`Statements: ${summary.statements.covered}/${summary.statements.total} (${summary.statements.percentage.toFixed(2)}%)`);
        console.log(`Branches: ${summary.branches.covered}/${summary.branches.total} (${summary.branches.percentage.toFixed(2)}%)`);
        console.log(`Functions: ${summary.functions.covered}/${summary.functions.total} (${summary.functions.percentage.toFixed(2)}%)`);
        console.log(`Lines: ${summary.lines.covered}/${summary.lines.total} (${summary.lines.percentage.toFixed(2)}%)`);
        console.log('=' .repeat(50));

        // Show coverage by source
        console.log('\n📊 Coverage by Source:');
        const sources = ['nyc', 'manual', 'playwright'];
        sources.forEach(source =>
        {
            const filesWithSource = Object.values(this.combinedCoverage.files)
                .filter(file => file.sources[source]);
            console.log(`  ${source.toUpperCase()}: ${filesWithSource.length} files`);
        });

        // Show files with multiple coverage sources
        console.log('\n🔗 Files with Multiple Coverage Sources:');
        Object.entries(this.combinedCoverage.files).forEach(([fileName, fileData]) =>
        {
            const sourceCount = Object.keys(fileData.sources).length;
            if (sourceCount > 1)
            {
                const sources = Object.keys(fileData.sources).join(', ');
                console.log(`  ${fileName}: ${sources}`);
            }
        });
    }
}

// Run the coverage combiner
async function main()
{
    const combiner = new CoverageCombiner();
    try
    {
        await combiner.generateReport();
        console.log('\n✅ Coverage combination completed successfully!');
    }
    catch (error)
    {
        console.error('\n❌ Error combining coverage data:', error);
        process.exit(1);
    }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`)
{
    main();
}

export default CoverageCombiner;