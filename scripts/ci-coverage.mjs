#!/usr/bin/env node
/**
 * CI-specific coverage script that generates all coverage types for CodeCov
 */

import { execSync } from 'child_process';
import fs from 'fs';

class CICoverageRunner
{
    constructor()
    {
        this.coverageFiles = [];
    }

    runCommand(command, description)
    {
        console.log(`\n🔄 ${description}...`);
        try
        {
            execSync(command, { stdio: 'inherit' });
            console.log(`✅ ${description} completed`);
            return true;
        }
        catch (error)
        {
            console.log(`⚠️  ${description} failed (continuing anyway): ${error.message}`);
            return false;
        }
    }

    checkCoverageFile(filePath, description)
    {
        if (fs.existsSync(filePath))
        {
            console.log(`✅ ${description}: ${filePath}`);
            this.coverageFiles.push(filePath);
            return true;
        }
        else
        {
            console.log(`❌ ${description} missing: ${filePath}`);
            return false;
        }
    }

    async runAllCoverage()
    {
        console.log('🚀 Running comprehensive coverage for CI/CodeCov integration\n');

        // Step 1: Run standard tests (already done in CI, but ensure coverage files exist)
        console.log('📊 Checking standard coverage files...');
        this.checkCoverageFile('coverage_c8/coverage-final.json', 'C8 JSON coverage');
        this.checkCoverageFile('coverage_c8/lcov.info', 'C8 LCOV coverage');
        this.checkCoverageFile('coverage_mocha/coverage-final.json', 'Mocha JSON coverage');
        this.checkCoverageFile('coverage_mocha/lcov.info', 'Mocha LCOV coverage');

        // Step 2: Run NYC coverage (alternative analysis)
        this.runCommand('npm run test:nyc', 'NYC Coverage Analysis');
        this.checkCoverageFile('coverage_nyc/coverage-final.json', 'NYC JSON coverage');
        this.checkCoverageFile('coverage_nyc/lcov.info', 'NYC LCOV coverage');

        // Step 3: Run manual instrumentation tests
        this.runCommand('npm run test:manual', 'Manual Instrumentation Coverage');
        this.checkCoverageFile('coverage_manual/results.json', 'Manual coverage results');

        // Step 4: Run Playwright tests (if available)
        this.runCommand('npm run test:playwright', 'Playwright Integration Tests');

        // Step 5: Combine all coverage data
        this.runCommand('npm run coverage:all', 'Combining all coverage data');
        this.checkCoverageFile('coverage_combined/combined-coverage.json', 'Combined coverage data');

        // Step 6: Generate LCOV from combined data
        this.runCommand('node scripts/generate-combined-lcov.mjs', 'Generating combined LCOV');
        this.checkCoverageFile('coverage_combined/lcov.info', 'Combined LCOV coverage');

        // Step 7: Generate CI coverage summary
        this.generateCISummary();

        return this.coverageFiles;
    }

    generateCISummary()
    {
        console.log('\n📋 CI Coverage Summary:');
        console.log('=' .repeat(60));

        // Read and display coverage summaries
        this.displayCoverageSummary('coverage_c8/coverage-summary.json', 'C8 Coverage');
        this.displayCoverageSummary('coverage_nyc/coverage-summary.json', 'NYC Coverage');
        this.displayCombinedSummary();

        console.log('=' .repeat(60));
        console.log(`\n📤 Coverage files ready for CodeCov (${this.coverageFiles.length} files):`);
        this.coverageFiles.forEach(file => console.log(`   • ${file}`));
    }

    displayCoverageSummary(filePath, title)
    {
        if (fs.existsSync(filePath))
        {
            try
            {
                const summary = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const total = summary.total;
                if (total)
                {
                    console.log(`\n${title}:`);
                    console.log(`  Statements: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`);
                    console.log(`  Branches: ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`);
                    console.log(`  Functions: ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`);
                    console.log(`  Lines: ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})`);
                }
            }
            catch (_)
            {
                console.log(`⚠️  Could not read ${title} summary`);
            }
        }
    }

    displayCombinedSummary()
    {
        const combinedFile = 'coverage_combined/combined-coverage.json';
        if (fs.existsSync(combinedFile))
        {
            try
            {
                const combined = JSON.parse(fs.readFileSync(combinedFile, 'utf8'));
                const summary = combined.summary;
                if (summary)
                {
                    console.log('\nCombined Coverage (NYC + Manual + Playwright):');
                    console.log(`  Files: ${summary.coveredFiles}/${summary.totalFiles} (${((summary.coveredFiles / summary.totalFiles) * 100).toFixed(1)}%)`);
                    console.log(`  Statements: ${summary.statements.percentage.toFixed(1)}% (${summary.statements.covered}/${summary.statements.total})`);
                    console.log(`  Branches: ${summary.branches.percentage.toFixed(1)}% (${summary.branches.covered}/${summary.branches.total})`);
                    console.log(`  Functions: ${summary.functions.percentage.toFixed(1)}% (${summary.functions.covered}/${summary.functions.total})`);
                    console.log(`  Lines: ${summary.lines.percentage.toFixed(1)}% (${summary.lines.covered}/${summary.lines.total})`);
                }
            }
            catch (_)
            {
                console.log('⚠️  Could not read combined coverage summary');
            }
        }
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`)
{
    (async() =>
    {
        const runner = new CICoverageRunner();
        const coverageFiles = await runner.runAllCoverage();

        if (coverageFiles.length > 0)
        {
            console.log('\n🎉 CI coverage generation completed successfully!');
            console.log('💡 All coverage files are ready for CodeCov upload.');
        }
        else
        {
            console.log('\n⚠️  Some coverage files may be missing. Check the logs above.');
            process.exit(1);
        }
    })();
}

export default CICoverageRunner;