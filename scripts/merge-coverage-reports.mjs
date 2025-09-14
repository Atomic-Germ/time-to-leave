#!/usr/bin/env node
/**
 * Merge C8 coverage reports from multiple test runs into a single unified report
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function ensureDir(dirPath)
{
    if (!existsSync(dirPath))
    {
        mkdirSync(dirPath, { recursive: true });
    }
}

function mergeCoverageData()
{
    console.log('\n📊 Merging coverage data from multiple test runs...');

    const coverageFiles = [
        'coverage_mocha/coverage-final.json'
    ];

    const mergedCoverage = {};

    for (const file of coverageFiles)
    {
        const filePath = join(rootDir, file);
        if (existsSync(filePath))
        {
            console.log(`  ✅ Including ${file}`);
            const coverage = JSON.parse(readFileSync(filePath, 'utf8'));

            // Merge coverage data, preferring higher coverage values
            for (const [filePath, fileData] of Object.entries(coverage))
            {
                if (!mergedCoverage[filePath])
                {
                    mergedCoverage[filePath] = fileData;
                }
                else
                {
                    // Merge statement, branch, function, and line coverage
                    const existing = mergedCoverage[filePath];
                    const incoming = fileData;

                    // Merge statements
                    if (incoming.s)
                    {
                        existing.s = existing.s || {};
                        for (const [key, value] of Object.entries(incoming.s))
                        {
                            existing.s[key] = Math.max(existing.s[key] || 0, value);
                        }
                    }

                    // Merge branches
                    if (incoming.b)
                    {
                        existing.b = existing.b || {};
                        for (const [key, branches] of Object.entries(incoming.b))
                        {
                            if (!existing.b[key])
                            {
                                existing.b[key] = branches;
                            }
                            else
                            {
                                for (let i = 0; i < branches.length; i++)
                                {
                                    existing.b[key][i] = Math.max(existing.b[key][i] || 0, branches[i] || 0);
                                }
                            }
                        }
                    }

                    // Merge functions
                    if (incoming.f)
                    {
                        existing.f = existing.f || {};
                        for (const [key, value] of Object.entries(incoming.f))
                        {
                            existing.f[key] = Math.max(existing.f[key] || 0, value);
                        }
                    }

                    // Update other metadata from the more recent run
                    if (incoming.statementMap) existing.statementMap = incoming.statementMap;
                    if (incoming.branchMap) existing.branchMap = incoming.branchMap;
                    if (incoming.fnMap) existing.fnMap = incoming.fnMap;
                    if (incoming.path) existing.path = incoming.path;
                }
            }
        }
        else
        {
            console.log(`  ⚠️  Skipping ${file} (not found)`);
        }
    }

    // Now merge the .nyc_output files to get the electron-mocha coverage
    console.log('  📁 Processing .nyc_output files from electron-mocha...');
    const nycOutputDir = join(rootDir, '.nyc_output');
    if (existsSync(nycOutputDir))
    {
        const files = readdirSync(nycOutputDir).filter(f => f.endsWith('.json'));
        for (const file of files)
        {
            const filePath = join(nycOutputDir, file);
            try
            {
                const coverage = JSON.parse(readFileSync(filePath, 'utf8'));

                for (const [filePath, fileData] of Object.entries(coverage))
                {
                    if (!mergedCoverage[filePath])
                    {
                        mergedCoverage[filePath] = fileData;
                        console.log(`  ✅ Added ${filePath.replace(rootDir, '.')}`);
                    }
                    else
                    {
                        // Merge the coverage data
                        const existing = mergedCoverage[filePath];
                        const incoming = fileData;

                        // Merge statements
                        if (incoming.s)
                        {
                            existing.s = existing.s || {};
                            for (const [key, value] of Object.entries(incoming.s))
                            {
                                existing.s[key] = Math.max(existing.s[key] || 0, value);
                            }
                        }

                        // Merge branches
                        if (incoming.b)
                        {
                            existing.b = existing.b || {};
                            for (const [key, branches] of Object.entries(incoming.b))
                            {
                                if (!existing.b[key])
                                {
                                    existing.b[key] = branches;
                                }
                                else
                                {
                                    for (let i = 0; i < branches.length; i++)
                                    {
                                        existing.b[key][i] = Math.max(existing.b[key][i] || 0, branches[i] || 0);
                                    }
                                }
                            }
                        }

                        // Merge functions
                        if (incoming.f)
                        {
                            existing.f = existing.f || {};
                            for (const [key, value] of Object.entries(incoming.f))
                            {
                                existing.f[key] = Math.max(existing.f[key] || 0, value);
                            }
                        }

                        // Update metadata
                        if (incoming.statementMap) existing.statementMap = incoming.statementMap;
                        if (incoming.branchMap) existing.branchMap = incoming.branchMap;
                        if (incoming.fnMap) existing.fnMap = incoming.fnMap;
                        if (incoming.path) existing.path = incoming.path;

                        console.log(`  🔄 Merged ${filePath.replace(rootDir, '.')}`);
                    }
                }
            }
            catch
            {
                console.log(`  ⚠️  Skipping invalid JSON file: ${file}`);
            }
        }
    }

    // Ensure output directory exists
    ensureDir(join(rootDir, 'coverage_merged'));

    // Write merged coverage
    const outputPath = join(rootDir, 'coverage_merged/coverage-final.json');
    writeFileSync(outputPath, JSON.stringify(mergedCoverage, null, 2));
    console.log('  📝 Merged coverage written to coverage_merged/coverage-final.json');
    console.log(`  📊 Total files covered: ${Object.keys(mergedCoverage).length}`);

    return outputPath;
}

function runNycReport()
{
    return new Promise((resolve, reject) =>
    {
        console.log('\n📈 Generating unified coverage report...');

        const args = [
            'nyc', 'report',
            '--reporter=text',
            '--reporter=html',
            '--reporter=lcov',
            '--temp-dir=coverage_merged',
            '--report-dir=coverage_merged'
        ];

        const process = spawn('npx', args, {
            stdio: 'inherit',
            cwd: rootDir
        });

        process.on('close', (code) =>
        {
            if (code === 0)
            {
                resolve();
            }
            else
            {
                reject(new Error(`nyc report failed with code ${code}`));
            }
        });

        process.on('error', (error) =>
        {
            reject(error);
        });
    });
}

async function main()
{
    try
    {
        // Merge the coverage data
        mergeCoverageData();

        // Generate the unified report
        await runNycReport();

        console.log('\n✅ Unified coverage report generated successfully!');
        console.log('📁 View HTML report: coverage_merged/index.html');
        console.log('📄 LCOV file: coverage_merged/lcov.info');

    }
    catch (error)
    {
        console.error('\n❌ Error generating unified coverage report:', error);
        process.exit(1);
    }
}

main();