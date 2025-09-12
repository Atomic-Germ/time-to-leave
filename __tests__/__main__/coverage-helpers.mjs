/**
 * Manual coverage collection for VM-executed code
 * This helps track coverage for code that C8 can't reach
 */

export class CoverageCollector
{
    constructor(filename)
    {
        this.filename = filename;
        this.coverage = {
            statements: new Set(),
            branches: new Set(),
            functions: new Set(),
            lines: new Set()
        };
    }

    // Track statement execution
    statement(id)
    {
        this.coverage.statements.add(id);
        return true; // Always return true to not affect code flow
    }

    // Track branch execution
    branch(id, taken)
    {
        this.coverage.branches.add(`${id}:${taken}`);
        return taken;
    }

    // Track function execution
    function(id, name)
    {
        this.coverage.functions.add(`${id}:${name}`);
        return true;
    }

    // Track line execution
    line(num)
    {
        this.coverage.lines.add(num);
        return true;
    }

    // Generate coverage report
    getReport()
    {
        return {
            file: this.filename,
            statements: Array.from(this.coverage.statements),
            branches: Array.from(this.coverage.branches),
            functions: Array.from(this.coverage.functions),
            lines: Array.from(this.coverage.lines),
            summary: {
                statements: this.coverage.statements.size,
                branches: this.coverage.branches.size,
                functions: this.coverage.functions.size,
                lines: this.coverage.lines.size
            }
        };
    }
}

// Global collector registry
const collectors = new Map();

export function getCollector(filename)
{
    if (!collectors.has(filename))
    {
        collectors.set(filename, new CoverageCollector(filename));
    }
    return collectors.get(filename);
}

export function getAllReports()
{
    const reports = [];
    for (const collector of collectors.values())
    {
        reports.push(collector.getReport());
    }
    return reports;
}

export function resetCoverage()
{
    collectors.clear();
}