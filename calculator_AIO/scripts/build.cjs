// ==============================================================
// Multitools Calculator - Static Asset Bundler
// Combines modular src files into src/bundle.js for high-speed,
// zero-latency, single-request PWA execution.
// ==============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseDir = path.join(__dirname, '../');
const sourceFiles = [
    'src/catalog.js',
    'src/core/formatters.js',
    'src/core/dates.js',
    'src/core/rates.js',
    'src/core/export.js',
    'src/core/history.js',
    'src/core/compare.js',
    'src/core/lotto.js',
    'src/ui/theme.js',
    'src/ui/drawer.js',
    'src/ui/keypad.js',
    'src/ui/charts.js',
    'src/ui/whatif.js',
    'src/tools/shop.js',
    'src/tools/biz.js',
    'src/tools/finance.js',
    'src/tools/work.js',
    'src/tools/special.js',
    'src/tools/lotto.js',
    'src/tools/tax_property.js',
    'src/tools/lifestyle_thai.js',
    'src/tools/finance_thai.js',
    'src/tools/legal_labor.js',
    'src/ui/actions.js',
    'src/ui/modals.js'
];

function build() {
    console.log('[BUILD] Bundling ' + sourceFiles.length + ' modules...');
    const chunks = [];
    chunks.push('// ==============================================================');
    chunks.push('// Multitools Calculator - Unified Application Bundle');
    chunks.push('// Generated automatically by scripts/build.cjs');
    chunks.push('// ==============================================================\n');

    for (const relPath of sourceFiles) {
        const fullPath = path.join(baseDir, relPath);
        if (!fs.existsSync(fullPath)) {
            throw new Error('Module file not found: ' + fullPath);
        }
        const content = fs.readFileSync(fullPath, 'utf8');
        chunks.push('// >>> ' + relPath + ' >>>');
        chunks.push(content);
        chunks.push('// <<< ' + relPath + ' <<<\n');
    }

    const bundleContent = chunks.join('\n');
    // Verify syntax in a sandbox
    new vm.Script(bundleContent);

    const outPath = path.join(baseDir, 'src/bundle.js');
    fs.writeFileSync(outPath, bundleContent, 'utf8');
    console.log('[BUILD] Successfully created ' + outPath + ' (' + bundleContent.length + ' bytes)');
}

if (require.main === module) {
    build();
}

module.exports = { build, sourceFiles };
