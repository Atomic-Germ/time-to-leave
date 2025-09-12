#!/usr/bin/env node
/**
 * Coverage report generator - creates HTML dashboard from combined coverage data
 */

import fs from 'fs';
import path from 'path';

class CoverageReporter
{
    constructor()
    {
        this.reportData = null;
    }

    async loadCombinedCoverage()
    {
        try
        {
            const combinedFile = 'coverage_combined/combined-coverage.json';
            if (fs.existsSync(combinedFile))
            {
                this.reportData = JSON.parse(fs.readFileSync(combinedFile, 'utf8'));
                console.log('✅ Loaded combined coverage data');
                return true;
            }
        }
        catch (error)
        {
            console.error('❌ Error loading combined coverage:', error);
        }
        return false;
    }

    generateHTMLReport()
    {
        if (!this.reportData)
        {
            throw new Error('No coverage data loaded');
        }

        const { summary, files, sources, timestamp } = this.reportData;

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Combined Coverage Report - Time to Leave</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; border-left: 4px solid #667eea; }
        .metric h3 { margin: 0 0 10px 0; color: #333; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
        .metric .value { font-size: 2em; font-weight: bold; color: #333; }
        .metric .percentage { font-size: 1.2em; color: #666; }
        .section { padding: 0 30px 30px 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
        .sources { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .source-card { background: #f8f9fa; border-radius: 8px; padding: 20px; border: 1px solid #dee2e6; }
        .source-card h3 { margin: 0 0 15px 0; color: #495057; }
        .source-status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; }
        .source-available { background: #d4edda; color: #155724; }
        .source-missing { background: #f8d7da; color: #721c24; }
        .files-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .files-table th, .files-table td { text-align: left; padding: 12px; border-bottom: 1px solid #dee2e6; }
        .files-table th { background: #f8f9fa; font-weight: 600; color: #495057; }
        .files-table tr:hover { background: #f8f9fa; }
        .coverage-bar { background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden; margin: 5px 0; }
        .coverage-fill { height: 100%; transition: width 0.3s ease; }
        .coverage-high { background: #28a745; }
        .coverage-medium { background: #ffc107; }
        .coverage-low { background: #dc3545; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75em; font-weight: bold; }
        .badge-nyc { background: #e3f2fd; color: #1976d2; }
        .badge-manual { background: #f3e5f5; color: #7b1fa2; }
        .badge-playwright { background: #e8f5e8; color: #388e3c; }
        .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
        .timestamp { font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Combined Coverage Report</h1>
            <p>Time to Leave - Enhanced Coverage Analysis</p>
            <p class="timestamp">Generated: ${new Date(timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Files</h3>
                <div class="value">${summary.coveredFiles}</div>
                <div class="percentage">of ${summary.totalFiles} files</div>
            </div>
            <div class="metric">
                <h3>Statements</h3>
                <div class="value">${summary.statements.percentage.toFixed(1)}%</div>
                <div class="percentage">${summary.statements.covered}/${summary.statements.total}</div>
            </div>
            <div class="metric">
                <h3>Branches</h3>
                <div class="value">${summary.branches.percentage.toFixed(1)}%</div>
                <div class="percentage">${summary.branches.covered}/${summary.branches.total}</div>
            </div>
            <div class="metric">
                <h3>Functions</h3>
                <div class="value">${summary.functions.percentage.toFixed(1)}%</div>
                <div class="percentage">${summary.functions.covered}/${summary.functions.total}</div>
            </div>
            <div class="metric">
                <h3>Lines</h3>
                <div class="value">${summary.lines.percentage.toFixed(1)}%</div>
                <div class="percentage">${summary.lines.covered}/${summary.lines.total}</div>
            </div>
        </div>

        <div class="section">
            <h2>📊 Coverage Sources</h2>
            <div class="sources">
                ${this.generateSourceCards(sources)}
            </div>
        </div>

        <div class="section">
            <h2>📁 File Coverage Details</h2>
            <table class="files-table">
                <thead>
                    <tr>
                        <th>File</th>
                        <th>Sources</th>
                        <th>NYC Coverage</th>
                        <th>Playwright Coverage</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.generateFileRows(files)}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>Combined coverage from NYC, Manual Instrumentation, and Playwright</p>
            <p>🚀 Enhanced coverage analysis for VM-executed and preload scripts</p>
        </div>
    </div>
</body>
</html>`;

        return html;
    }

    generateSourceCards(sources)
    {
        const sourceInfo = {
            nyc: { name: 'NYC', description: 'Standard Node.js coverage with VM hooks' },
            manual: { name: 'Manual Instrumentation', description: 'VM-executed code with manual tracking' },
            playwright: { name: 'Playwright', description: 'Real Electron renderer process coverage' }
        };

        return Object.entries(sourceInfo).map(([key, info]) =>
        {
            const hasData = sources[key] !== null;
            const statusClass = hasData ? 'source-available' : 'source-missing';
            const statusText = hasData ? 'Available' : 'No Data';

            return `
                <div class="source-card">
                    <h3>${info.name}</h3>
                    <p>${info.description}</p>
                    <span class="source-status ${statusClass}">${statusText}</span>
                    ${hasData ? this.getSourceStats(sources[key], key) : ''}
                </div>
            `;
        }).join('');
    }

    getSourceStats(sourceData, sourceType)
    {
        if (sourceType === 'nyc' && sourceData)
        {
            const fileCount = Object.keys(sourceData).length;
            return `<p><strong>${fileCount}</strong> files analyzed</p>`;
        }
        if (sourceType === 'playwright' && Array.isArray(sourceData))
        {
            return `<p><strong>${sourceData.length}</strong> coverage entries</p>`;
        }
        if (sourceType === 'manual' && sourceData && sourceData.tests)
        {
            return `<p><strong>${sourceData.tests.length}</strong> test results</p>`;
        }
        return '';
    }

    generateFileRows(files)
    {
        return Object.entries(files).map(([fileName, fileData]) =>
        {
            const sources = Object.keys(fileData.sources).map(source =>
                `<span class="badge badge-${source}">${source.toUpperCase()}</span>`
            ).join(' ');

            const nycCoverage = this.getNYCCoverageBar(fileData.sources.nyc);
            const playwrightCoverage = this.getPlaywrightCoverageBar(fileData.sources.playwright);

            return `
                <tr>
                    <td><strong>${fileName}</strong><br><small>${fileData.path}</small></td>
                    <td>${sources}</td>
                    <td>${nycCoverage}</td>
                    <td>${playwrightCoverage}</td>
                </tr>
            `;
        }).join('');
    }

    getNYCCoverageBar(nycData)
    {
        if (!nycData) return '<span style="color: #666;">No data</span>';

        const stmtPercent = nycData.statements.total > 0 ?
            (nycData.statements.covered / nycData.statements.total) * 100 : 0;

        const coverageClass = stmtPercent >= 80 ? 'coverage-high' :
            stmtPercent >= 60 ? 'coverage-medium' : 'coverage-low';

        return `
            <div>${stmtPercent.toFixed(1)}% statements</div>
            <div class="coverage-bar">
                <div class="coverage-fill ${coverageClass}" style="width: ${stmtPercent}%"></div>
            </div>
            <small>${nycData.statements.covered}/${nycData.statements.total}</small>
        `;
    }

    getPlaywrightCoverageBar(playwrightData)
    {
        if (!playwrightData) return '<span style="color: #666;">No data</span>';

        const percent = playwrightData.percentage || 0;
        const coverageClass = percent >= 80 ? 'coverage-high' :
            percent >= 60 ? 'coverage-medium' : 'coverage-low';

        return `
            <div>${percent.toFixed(1)}% characters</div>
            <div class="coverage-bar">
                <div class="coverage-fill ${coverageClass}" style="width: ${percent}%"></div>
            </div>
            <small>${playwrightData.characters?.covered || 0}/${playwrightData.characters?.total || 0}</small>
        `;
    }

    async generateReport()
    {
        console.log('\n📊 Generating combined coverage report...\n');

        const loaded = await this.loadCombinedCoverage();
        if (!loaded)
        {
            console.error('❌ No combined coverage data found. Run coverage:all first.');
            return false;
        }

        const html = this.generateHTMLReport();

        const outputDir = 'coverage_combined';
        fs.mkdirSync(outputDir, { recursive: true });

        const reportFile = path.join(outputDir, 'index.html');
        fs.writeFileSync(reportFile, html);

        console.log(`✅ HTML report generated: ${reportFile}`);
        console.log(`🌐 Open file://${path.resolve(reportFile)} in your browser\n`);

        return true;
    }
}

// Run the report generator
async function main()
{
    const reporter = new CoverageReporter();
    try
    {
        const success = await reporter.generateReport();
        if (success)
        {
            console.log('✅ Coverage report generation completed successfully!');
        }
        else
        {
            process.exit(1);
        }
    }
    catch (error)
    {
        console.error('\n❌ Error generating coverage report:', error);
        process.exit(1);
    }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`)
{
    main();
}

export default CoverageReporter;