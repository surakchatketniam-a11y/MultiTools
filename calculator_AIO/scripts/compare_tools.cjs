const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function extractFunction(code, fnName) {
    const idx = code.search(new RegExp('function\\s+' + fnName + '\\s*\\('));
    if (idx === -1) return null;
    const braceStart = code.indexOf('{', idx);
    if (braceStart === -1) return null;
    let depth = 1;
    let i = braceStart + 1;
    let inString = false;
    let stringChar = '';
    while (i < code.length && depth > 0) {
        const c = code[i];
        const prev = code[i - 1];
        if (inString) {
            if (c === stringChar && prev !== '\\') {
                inString = false;
            }
        } else if (c === '"' || c === "'" || c === '`') {
            inString = true;
            stringChar = c;
        } else if (c === '{') {
            depth++;
        } else if (c === '}') {
            depth--;
        }
        i++;
    }
    return code.slice(idx, i);
}

const original = execSync('git show 58f045c~1:calculator_AIO/index.html', { maxBuffer: 50 * 1024 * 1024 }).toString('utf8');

const toolFns = [
  'renderUnitPriceTool',
  'renderStandardCalcTool',
  'renderCurrencyTool',
  'renderUnitConverterTool',
  'renderDiscountTool',
  'renderPercentTool',
  'renderVatTool',
  'renderVatWhtTool',
  'renderFuelCostTool',
  'renderHealthTool',
  'renderTipTool',
  'renderFuelEffTool',
  'renderOvulationTool',
  'renderDateCalcTool',
  'renderWorkdayTool',
  'renderGpaTool',
  'renderLoanTool',
  'renderSavingsTool',
  'renderSalaryTool',
  'renderAreaCostTool',
  'renderHexTool',
  'renderWorldTimeTool'
];

const toolsDir = path.join(__dirname, '../src/tools');
const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.js') && f !== 'lotto.js');

const diffs = [];

for (const fnName of toolFns) {
    const origFn = extractFunction(original, fnName);
    let foundFile = null;
    let currFn = null;
    for (const f of files) {
        const content = fs.readFileSync(path.join(toolsDir, f), 'utf8');
        const extracted = extractFunction(content, fnName);
        if (extracted) {
            foundFile = f;
            currFn = extracted;
            break;
        }
    }
    if (!foundFile) {
        console.log('MISSING:', fnName);
        diffs.push({ fnName, status: 'MISSING' });
    } else {
        const oNorm = origFn.replace(/\s+/g, ' ').trim();
        const cNorm = currFn.replace(/\s+/g, ' ').trim();
        if (oNorm === cNorm) {
            console.log('[OK] PERFECT MATCH:', fnName, '(' + foundFile + ')');
        } else {
            console.log('[DIFF] DIFF in:', fnName, '(' + foundFile + ') OrigLen=' + oNorm.length + ' CurrLen=' + cNorm.length);
            diffs.push({ fnName, file: foundFile, origFn, currFn });
        }
    }
}

console.log('\n--- DIFF REPORT ---');
console.log('Total tools tested: ' + toolFns.length);
console.log('Diff count: ' + diffs.length);

for (const d of diffs) {
    console.log(`\nTool: ${d.fnName} in ${d.file}`);
    const oLines = d.origFn.split('\n').map(l => l.trim());
    const cLines = d.currFn.split('\n').map(l => l.trim());
    let diffShown = 0;
    for (let i = 0; i < Math.max(oLines.length, cLines.length); i++) {
        if (oLines[i] !== cLines[i]) {
            console.log(`  Line ${i}:`);
            console.log(`    ORIG: ${oLines[i] || '<EOF>'}`);
            console.log(`    CURR: ${cLines[i] || '<EOF>'}`);
            diffShown++;
            if (diffShown >= 3) break;
        }
    }
}
