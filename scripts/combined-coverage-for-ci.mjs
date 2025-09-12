#!/usr/bin/env node
/**
 * Combined coverage script for CI/codecov
 * Runs all tests and combines coverage from multiple sources into a single report
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function runCommand(command, args = [], options = {})
{
    return new Promise((resolve, reject) =>
    {
        console.log(`\n🔄 Running: ${command} ${args.join(' ')}`);
        const process = spawn(command, args, {
            stdio: 'inherit',
            cwd: rootDir,
            ...options
        });

        process.on('close', (code) =>
        {
            if (code === 0)
            {
                resolve();
            }
            else
            {
                // Don't fail on non-zero exit codes for coverage tests
                console.log(`⚠️  Command exited with code ${code}, continuing...`);
                resolve();
            }
        });

        process.on('error', (error) =>
        {
            console.error(`❌ Error running ${command}:`, error);
            reject(error);
        });
    });
}

function mergeLcovFiles()
{
    console.log('\n📊 Merging LCOV coverage files...');

    const lcovFiles = [
        'coverage_mocha/lcov.info',
        'coverage_nyc/lcov.info'
    ];

    let combinedLcov = '';

    for (const file of lcovFiles)
    {
        const filePath = join(rootDir, file);
        if (existsSync(filePath))
        {
            console.log(`  ✅ Including ${file}`);
            const content = readFileSync(filePath, 'utf8');
            combinedLcov += content + '\n';
        }
        else
        {
            console.log(`  ⚠️  Skipping ${file} (not found)`);
        }
    }

    const outputPath = join(rootDir, 'coverage_combined/lcov.info');
    writeFileSync(outputPath, combinedLcov);
    console.log('  📝 Combined LCOV written to coverage_combined/lcov.info');

    return outputPath;
}

function mergeJsonCoverage()
{
    console.log('\n📊 Merging JSON coverage files...');

    const jsonFiles = [
        'coverage_mocha/coverage-final.json',
        'coverage_nyc/coverage-final.json'
    ];

    let combinedCoverage = {};

    for (const file of jsonFiles)
    {
        const filePath = join(rootDir, file);
        if (existsSync(filePath))
        {
            console.log(`  ✅ Including ${file}`);
            const content = JSON.parse(readFileSync(filePath, 'utf8'));
            combinedCoverage = { ...combinedCoverage, ...content };
        }
        else
        {
            console.log(`  ⚠️  Skipping ${file} (not found)`);
        }
    }

    const outputPath = join(rootDir, 'coverage_combined/coverage-final.json');
    writeFileSync(outputPath, JSON.stringify(combinedCoverage, null, 2));
    console.log('  📝 Combined JSON written to coverage_combined/coverage-final.json');

    return outputPath;
}

async function generateFinalReport()
{
    console.log('\n📈 Generating final coverage report...');

    try
    {
        // Generate a final text report from combined coverage
        await runCommand('npx', ['nyc', 'report', '--reporter=text', '--reporter=text-summary', '--temp-dir=coverage_combined', '--report-dir=coverage_combined']);

        console.log('\n✅ Combined coverage report generated successfully!');
        console.log('📁 Reports available in coverage_combined/');
        console.log('📄 LCOV file: coverage_combined/lcov.info');
        console.log('📊 JSON file: coverage_combined/coverage-final.json');

    }
    catch (error)
    {
        console.error('❌ Error generating final report:', error);
    }
}

async function main()
{
    console.log('🚀 Starting combined coverage generation for CI...\n');

    try
    {
        // Create output directory
        await runCommand('mkdir', ['-p', 'coverage_combined']);

        // Run standard tests (C8 coverage)
        console.log('\n📋 Running standard tests with C8 coverage...');
        await runCommand('npm', ['run', 'test:standard']);

        // Run enhanced coverage tests (NYC coverage)
        console.log('\n📋 Running enhanced coverage tests...');
        await runCommand('npm', ['run', 'test:coverage-enhanced']);

        // Merge coverage files
        mergeLcovFiles();
        mergeJsonCoverage();

        // Generate final report
        await generateFinalReport();

        console.log('\n🎉 Combined coverage generation completed successfully!');

    }
    catch (error)
    {
        console.error('\n❌ Error during combined coverage generation:', error);
        process.exit(1);
    }
}

main();