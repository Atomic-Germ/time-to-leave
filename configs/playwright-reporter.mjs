/**
 * Custom Playwright reporter for human-readable output and lcov coverage generation
 */

import fs from 'fs';
import path from 'path';

class TimeToLeaveReporter
{
    constructor(options = {})
    {
        this.outputDir = options.outputDir || 'coverage_playwright';
        this.startTime = null;
        this.testResults = [];
        this.coverageData = [];

        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir))
        {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    onBegin(config, suite)
    {
        this.startTime = Date.now();
        console.log('\n🎭 Playwright Integration Tests');
        console.log('================================');
        console.log(`Running ${this._countTests(suite)} tests in ${config.projects.length} project(s)`);
    }

    onTestBegin(test, _result)
    {
        const suiteName = test.parent?.title || 'Unknown Suite';
        console.log(`\n📝 ${suiteName}`);
        console.log(`   Testing: ${test.title}`);
    }

    onTestEnd(test, result)
    {
        const duration = result.duration;
        const status = result.status;

        // Store result for summary
        this.testResults.push({
            title: test.title,
            status: status,
            duration: duration
        });

        const emoji = this._getStatusIcon(status);
        console.log(`   ${emoji} ${status.toUpperCase()} (${(duration / 1000).toFixed(1)}s)`);

        // Process coverage data from stdout
        this._processCoverageFromOutput(result.stdout, test.title);
    }

    onEnd(_result)
    {
        const duration = Date.now() - this.startTime;
        const passed = this.testResults.filter(t => t.status === 'passed').length;
        const failed = this.testResults.filter(t => t.status === 'failed').length;
        const skipped = this.testResults.filter(t => t.status === 'skipped').length;

        console.log('\n📊 Test Results Summary');
        console.log('=======================');
        console.log(`✅ Passed: ${passed}`);
        if (failed > 0) console.log(`❌ Failed: ${failed}`);
        if (skipped > 0) console.log(`⏭️  Skipped: ${skipped}`);
        console.log(`⏱️  Duration: ${(duration/1000).toFixed(1)}s`);

        // Generate coverage reports from the summary file
        this._generateCoverageReports();

        // Show coverage summary from the generated file
        this._showCoverageSummaryFromFile();
    }

    _countTests(suite)
    {
        let count = 0;
        if (suite.tests) count += suite.tests.length;
        if (suite.suites)
        {
            for (const subSuite of suite.suites)
            {
                count += this._countTests(subSuite);
            }
        }
        return count;
    }

    _getStatusIcon(status)
    {
        switch (status)
        {
        case 'passed': return '✅';
        case 'failed': return '❌';
        case 'skipped': return '⏭️';
        case 'timedOut': return '⏰';
        default: return '❓';
        }
    }

    _processCoverageFromOutput(stdout, _testName)
    {
        if (!stdout) return;

        const stdoutText = stdout.map(item => item.text).join('\n');

        // Look for coverage data save messages
        const saveMatch = stdoutText.match(/Coverage data saved to (.+)/);
        if (saveMatch)
        {
            const coverageFile = saveMatch[1];
            try
            {
                if (fs.existsSync(coverageFile))
                {
                    const data = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
                    this.coverageData = this.coverageData.concat(data);
                }
            }
            catch (_error)
            {
                console.log(`   ⚠️  Warning: Could not read coverage data from ${coverageFile}`);
            }
        }
    }

    _generateCoverageReports()
    {
        const summaryFile = path.join(this.outputDir, 'coverage-summary.json');

        if (!fs.existsSync(summaryFile))
        {
            console.log('\n📈 Coverage: No summary data available');
            return;
        }

        try
        {
            // Generate LCOV format from summary
            this._generateLcovFromSummary();

            console.log(`\n📁 Coverage reports saved to ${this.outputDir}/`);
        }
        catch (error)
        {
            console.error('❌ Error generating coverage reports:', error.message);
        }
    }

    _generateLcovFromSummary()
    {
        const summaryFile = path.join(this.outputDir, 'coverage-summary.json');
        const lcovPath = path.join(this.outputDir, 'lcov.info');

        try
        {
            const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
            const lcovData = this._convertSummaryToLcov(summary);

            fs.writeFileSync(lcovPath, lcovData);
            console.log(`📄 LCOV report: ${lcovPath}`);
        }
        catch (_error)
        {
            console.log('⚠️  Warning: Could not generate LCOV report');
        }
    }

    _convertSummaryToLcov(summary)
    {
        let lcovOutput = '';

        for (const [filename, data] of Object.entries(summary.files))
        {
            // Extract relative path from URL
            const relativePath = data.url ? data.url.replace('file://', '').replace(/^.*\/test\//, '') : filename;

            lcovOutput += 'TN:\n'; // Test name (empty)
            lcovOutput += `SF:${relativePath}\n`; // Source file

            // Convert character-based coverage to line-based (rough approximation)
            const estimatedLines = Math.max(1, Math.floor(data.totalChars / 50)); // ~50 chars per line
            const estimatedCoveredLines = Math.floor((data.coveredChars / data.totalChars) * estimatedLines);

            lcovOutput += 'FNF:0\n'; // Functions found (we don't track this in playwright)
            lcovOutput += 'FNH:0\n'; // Functions hit
            lcovOutput += `LF:${estimatedLines}\n`;  // Lines found
            lcovOutput += `LH:${estimatedCoveredLines}\n`; // Lines hit
            lcovOutput += 'BRF:0\n'; // Branches found (we don't track this in playwright)
            lcovOutput += 'BRH:0\n'; // Branches hit
            lcovOutput += 'end_of_record\n';
        }

        return lcovOutput;
    }

    _showCoverageSummaryFromFile()
    {
        const summaryFile = path.join(this.outputDir, 'coverage-summary.json');

        try
        {
            if (fs.existsSync(summaryFile))
            {
                const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));

                console.log('\n📈 Coverage Summary');
                console.log('==================');

                if (summary.totalFiles === 0)
                {
                    console.log('📄 Files with coverage: 0 (no relevant files captured)');
                    console.log('💡 Tip: Make sure Electron app loads the files you want to test');
                }
                else
                {
                    console.log(`� Files with coverage: ${summary.totalFiles}`);
                    console.log(`� Overall coverage: ${summary.overall.coveragePercent}%`);
                    console.log(`� Total chars: ${summary.overall.coveredChars}/${summary.overall.totalChars}`);

                    // List covered files
                    const fileList = Object.entries(summary.files);
                    if (fileList.length > 0 && fileList.length <= 10)
                    {
                        console.log('\n📁 Covered files:');
                        for (const [filename, data] of fileList)
                        {
                            console.log(`   ${filename}: ${data.coveragePercent}%`);
                        }
                    }
                    else if (fileList.length > 10)
                    {
                        console.log(`\n📁 Covered ${fileList.length} files (too many to list)`);
                    }
                }
            }
            else
            {
                console.log('\n📈 Coverage: No summary file found');
            }
        }
        catch (_error)
        {
            console.log('\n📈 Coverage: Error reading summary file');
        }
    }
}

export default TimeToLeaveReporter;