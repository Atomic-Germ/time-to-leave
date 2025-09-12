
function isTestFile(arg)
{
    return arg.match(/\.[m]js?$/);
}

let mochaSpecs = {};
let allTestFiles = [];

const isElectronMocha = process.argv[0].indexOf('electron') !== -1;
if (isElectronMocha)
{
    // For electron-mocha, explicitly list test files to avoid exclusion warnings
    allTestFiles = [
        '__tests__/__main__/date-aux.mjs',
        '__tests__/__main__/demo-generator-with-coverage.mjs',
        '__tests__/__main__/demo-generator.mjs',
        '__tests__/__main__/import-export.mjs',
        '__tests__/__main__/main-window.mjs',
        '__tests__/__main__/menus.mjs',
        '__tests__/__main__/notification.mjs',
        '__tests__/__main__/preload-cjs.mjs',
        '__tests__/__main__/preload-mjs.mjs',
        '__tests__/__main__/preload.mjs',
        '__tests__/__main__/squirrel.mjs',
        '__tests__/__main__/theme-loader.mjs',
        '__tests__/__main__/time-balance.mjs',
        '__tests__/__main__/time-math.mjs',
        '__tests__/__main__/update-manager.mjs',
        '__tests__/__main__/user-preferences.mjs',
        '__tests__/__main__/validate-json.mjs',
        '__tests__/__main__/windows.mjs',
        '__tests__/__renderer__/*.mjs',
        '__tests__/__renderer__/classes/*.mjs'
    ];
}
else
{
    // Regular mocha - only specific test files
    allTestFiles = [
        'tests/main-window.mjs'
    ];
    mochaSpecs = {
        checkLeaks: true,
        parallel: true
    };
}

module.exports = {
    color: true,
    ...mochaSpecs,
    // This allows overriding the test on the cmd line when using this .cjs config file
    ...(process.argv.slice(2).some(isTestFile) ? {} : {spec: allTestFiles})
};
