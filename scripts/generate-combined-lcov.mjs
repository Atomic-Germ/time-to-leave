#!/usr/bin/env node
/**
 * Convert combined coverage to LCOV format for CodeCov integration
 */

import fs from 'fs';
import path from 'path';

class LCOVGenerator
{
    constructor()
    {
        this.lcovData = '';
    }

    convertToLCOV(combinedCoverage)
    {
        let lcovContent = '';

        // Process each file in the combined coverage
        Object.entries(combinedCoverage.files).forEach(([fileName, fileData]) =>
        {
            // Start file record
            lcovContent += 'TN:\n'; // Test name (empty)
            lcovContent += `SF:${fileName}\n`; // Source file

            // Combine data from all sources for this file
            let totalStatements = 0;
            let coveredStatements = 0;
            let totalBranches = 0;
            let coveredBranches = 0;
            let totalFunctions = 0;
            let coveredFunctions = 0;
            let totalLines = 0;
            let coveredLines = 0;

            // Aggregate data from all sources (NYC, manual, playwright)
            Object.values(fileData.sources).forEach(sourceData =>
            {
                if (sourceData.statements)
                {
                    totalStatements = Math.max(totalStatements, sourceData.statements.total || 0);
                    coveredStatements = Math.max(coveredStatements, sourceData.statements.covered || 0);
                }
                if (sourceData.branches)
                {
                    totalBranches = Math.max(totalBranches, sourceData.branches.total || 0);
                    coveredBranches = Math.max(coveredBranches, sourceData.branches.covered || 0);
                }
                if (sourceData.functions)
                {
                    totalFunctions = Math.max(totalFunctions, sourceData.functions.total || 0);
                    coveredFunctions = Math.max(coveredFunctions, sourceData.functions.covered || 0);
                }
                if (sourceData.lines)
                {
                    totalLines = Math.max(totalLines, sourceData.lines.total || 0);
                    coveredLines = Math.max(coveredLines, sourceData.lines.covered || 0);
                }
            });

            // Generate simplified LCOV records
            // Function coverage
            if (totalFunctions > 0)
            {
                for (let i = 1; i <= totalFunctions; i++)
                {
                    lcovContent += `FN:${i},func${i}\n`;
                }
                lcovContent += `FNF:${totalFunctions}\n`;
                lcovContent += `FNH:${coveredFunctions}\n`;
            }

            // Line coverage
            if (totalLines > 0)
            {
                for (let i = 1; i <= totalLines; i++)
                {
                    const hits = i <= coveredLines ? 1 : 0;
                    lcovContent += `DA:${i},${hits}\n`;
                }
                lcovContent += `LF:${totalLines}\n`;
                lcovContent += `LH:${coveredLines}\n`;
            }

            // Branch coverage
            if (totalBranches > 0)
            {
                for (let i = 0; i < totalBranches; i++)
                {
                    const taken = i < coveredBranches ? 1 : 0;
                    lcovContent += `BDA:${Math.floor(i/2) + 1},${i % 2},${taken}\n`;
                }
                lcovContent += `BRF:${totalBranches}\n`;
                lcovContent += `BRH:${coveredBranches}\n`;
            }

            // End file record
            lcovContent += 'end_of_record\n';
        });

        return lcovContent;
    }

    async generateLCOV()
    {
        const combinedFile = 'coverage_combined/combined-coverage.json';

        if (!fs.existsSync(combinedFile))
        {
            console.log('⚠️  No combined coverage file found. Run `npm run coverage:all` first.');
            return false;
        }

        try
        {
            const combinedCoverage = JSON.parse(fs.readFileSync(combinedFile, 'utf8'));
            const lcovContent = this.convertToLCOV(combinedCoverage);

            // Ensure output directory exists
            const outputDir = 'coverage_combined';
            fs.mkdirSync(outputDir, { recursive: true });

            // Write LCOV file
            const lcovFile = path.join(outputDir, 'lcov.info');
            fs.writeFileSync(lcovFile, lcovContent);

            console.log(`✅ Generated LCOV file: ${lcovFile}`);
            console.log('📊 Included coverage from: NYC, Manual, and Playwright sources');

            return true;
        }
        catch (error)
        {
            console.error('❌ Error generating LCOV file:', error);
            return false;
        }
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`)
{
    (async() =>
    {
        const generator = new LCOVGenerator();
        await generator.generateLCOV();
    })();
}

export default LCOVGenerator;