// Run: node --test calculator_AIO/tests/correctness.test.cjs
// Execute the shipped inline functions, with no copied calculation formulas.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const moduleFiles = [
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
    'src/ui/desktop_layout.js',
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
const moduleContents = moduleFiles.map(file => fs.readFileSync(path.join(__dirname, '../', file), 'utf8'));

function source(name) {
    const match = html.match(new RegExp(`        (?:async )?function ${name}\\([^]*?\\n        }`));
    if (match) return match[0];
    for (const code of moduleContents) {
        const m = code.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}`));
        if (m) return m[0];
    }
    assert.fail(`Missing shipped function: ${name}`);
}

function context(extra = {}) {
    const memoryStore = {};
    const mockStorage = {
        getItem(k) { return Object.prototype.hasOwnProperty.call(memoryStore, k) ? memoryStore[k] : null; },
        setItem(k, v) { memoryStore[k] = String(v); },
        removeItem(k) { delete memoryStore[k]; }
    };
    const ctx = vm.createContext({
        persistAppState() {},
        localStorage: mockStorage,
        ...extra
    });
    for (const code of moduleContents) {
        vm.runInContext(code, ctx);
    }
    return ctx;
}

function calculation(ctx, name, state, result) {
    // Renderers currently contain the calculations before their first DOM write.
    const prefix = source(name).split(/\s*container\.innerHTML\s*=/)[0];
    return vm.runInContext(`(${prefix}\nreturn (${result});\n})`, ctx)();
}

test('all shipped modular and inline scripts have valid syntax', () => {
    for (const code of moduleContents) new vm.Script(code);
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
});

test('numbers: grouping, Thai digits, decimals, signs and invalid/empty input', () => {
    const ctx = context();
    for (const [raw, expected] of [['1,000', 1000], ['๑๒,๓๔๕.๖๗', 12345.67], [' -1,234.50 ', -1234.5], ['.5', .5], ['0', 0]]) {
        assert.equal(ctx.parseNumericInput(raw), expected);
    }
    for (const raw of ['', ' ', '1,00', '100abc', '1 000', '1.2.3', 'Infinity', '1e3', null]) {
        assert.ok(Number.isNaN(ctx.parseNumericInput(raw)), String(raw));
    }
    assert.equal(ctx.numberOrDefault('', 7), 7);
    assert.equal(ctx.numberOrDefault('0', 7), 0);
    assert.ok(Number.isNaN(ctx.numberOrDefault('bad', 7)));
    assert.equal(ctx.integerOrDefault('๑,๒๐๐'), 1200);
    assert.ok(Number.isNaN(ctx.integerOrDefault('12.5')));
    assert.equal(ctx.formatInputDisplay('๑,๐๐๐.50'), '1,000.50');
    assert.equal(ctx.formatInputDisplay('1000'), '1,000');
    assert.equal(ctx.formatInputDisplay('1500.5'), '1,500.5');
    assert.equal(ctx.formatInputDisplay('10000'), '10,000');
    assert.equal(ctx.formatInputDisplay('-1500'), '-1,500');
    assert.equal(ctx.formatInputDisplay('1,00000000'), '100,000,000');
    assert.equal(ctx.formatInputDisplay('1,0000'), '10,000');
    assert.equal(ctx.formatInputDisplay('10,00'), '1,000');
    assert.equal(ctx.formatCalcExpr('1250×12'), '1,250×12');
    assert.equal(ctx.formatCalcExpr('1000+2500.50-300'), '1,000+2,500.50-300');
    assert.equal(ctx.formatMoney(NaN), '—');
    assert.equal(ctx.formatUnitPrice(18), '18.00');
    assert.equal(ctx.formatUnitPrice(17.28), '17.28');
    assert.equal(ctx.formatUnitPrice(17.285), '17.285');
    assert.equal(ctx.formatUnitPrice(NaN), '—');
    assert.equal(ctx.evaluateArithmeticExpression('๑,๐๐๐/๕๐'), 20);
    assert.ok(Number.isNaN(ctx.evaluateArithmeticExpression('1,00/50')));
});

test('date policy: two-digit BE/CE, leap days and invalid dates', () => {
    const ctx = context();
    for (const [raw, era, expected] of [
        ['14/10/69', 'BE', '2026-10-14'], ['14/10/2569', 'BE', '2026-10-14'],
        ['๑๔/๑๐/๖๙', 'BE', '2026-10-14'], ['14/10/26', 'CE', '2026-10-14'],
        ['29022567', 'BE', '2024-02-29'], ['29/02/2569', 'BE', ''], ['31/04/2026', 'CE', ''],
        ['14/10/269', 'BE', '']
    ]) assert.equal(ctx.parseDateInputThai(raw, era), expected);
});

test('calendar dates survive Bangkok midnight, month/year changes and DST', () => {
    const previous = process.env.TZ;
    try {
        for (const timezone of ['Asia/Bangkok', 'UTC', 'America/New_York']) {
            process.env.TZ = timezone;
            const ctx = context({ Date });
            const date = new Date('2026-10-14T00:00:00');
            assert.equal(ctx.formatLocalDate(date), '2026-10-14', timezone);
            assert.equal(ctx.formatLocalDate(ctx.addCalendarDays(new Date('2026-12-31T00:00:00'), 1)), '2027-01-01');
            assert.equal(ctx.formatLocalDate(ctx.addCalendarDays(new Date('2026-03-08T00:00:00'), 1)), '2026-03-09');
            assert.equal(ctx.formatLocalDate(ctx.addCalendarDays(new Date('2024-03-01T00:00:00'), -1)), '2024-02-29');
        }
    } finally {
        if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
    }
});

test('ovulation renderer uses local dates for every displayed result', () => {
    const previous = process.env.TZ;
    process.env.TZ = 'Asia/Bangkok';
    try {
        const ctx = context({ Date, appState: { ovulation: { lastPeriodDate: '2026-10-01', cycleLength: 28 } } });
        const result = calculation(ctx, 'renderOvulationTool', null, '[toISO(ovulationDate),toISO(fertileStart),toISO(fertileEnd),toISO(nextPeriod)]');
        assert.deepEqual(Array.from(result), ['2026-10-15', '2026-10-10', '2026-10-16', '2026-10-29']);
    } finally {
        if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
    }
});

const savings = { initial: '0', monthly: '1,000', interestRate: '0', years: '5', annualIncrease: '0', inflationRate: '0',
    mode: 'retirement', retirementAge: '60', currentAge: '30', retirementMonthly: '10000' };
test('retirement ages control balance, required savings and inflation horizon', () => {
    const ctx = context({ appState: { savings } });
    let result = calculation(ctx, 'renderSavingsTool', null, '({months,totalBalance,requiredMonthly,realValue})');
    assert.equal(result.months, 360);
    assert.equal(result.totalBalance, 360000);
    assert.ok(Math.abs(result.requiredMonthly - 3000000 / 360) < .001);
    ctx.appState.savings = { ...savings, currentAge: '50', inflationRate: '2' };
    result = calculation(ctx, 'renderSavingsTool', null, '({months,totalBalance,requiredMonthly,realValue})');
    assert.equal(result.months, 120);
    assert.equal(result.totalBalance, 120000);
    assert.ok(Math.abs(result.requiredMonthly - 25000) < .001);
    assert.ok(Math.abs(result.realValue - 120000 / 1.02 ** 10) < .001);
    ctx.appState.savings = { ...savings, mode: 'growth' };
    assert.equal(calculation(ctx, 'renderSavingsTool', null, 'totalBalance'), 60000);
    ctx.appState.savings = { ...savings, currentAge: '60' };
    assert.equal(calculation(ctx, 'renderSavingsTool', null, 'months'), 0);
    ctx.appState.savings = { ...savings, mode: 'goal', goalTarget: '100000', annualIncrease: '-10' };
    const required = calculation(ctx, 'renderSavingsTool', null, 'requiredMonthly');
    const achieved = required * 12 * (1 + .9 + .9 ** 2 + .9 ** 3 + .9 ** 4);
    assert.ok(Math.abs(achieved - 100000) < .01, 'Required deposit must actually reach the target even when deposits decrease');
});

test('step loan supports a zero-percent later period for reducing and flat rates', () => {
    const loan = { principal: '120,000', interestRate: '5', months: '24', extra: '0', rateType: 'step', promoMonths: '12', rateAfter: '0' };
    const ctx = context({ appState: { loan } });
    for (const calcMethod of ['reducing', 'flat']) {
        ctx.appState.loan = { ...loan, calcMethod };
        const schedule = calculation(ctx, 'renderLoanTool', null, 'schedule');
        assert.equal(schedule.length, 24);
        assert.ok(schedule[11].interest > 0);
        assert.equal(schedule[12].rate, 0);
        assert.equal(schedule[12].interest, 0);
        assert.equal(schedule[23].balance, 0);
    }
});

test('Frankfurter v2 validates complete pairs, reciprocal rates and observation dates', () => {
    const ctx = context();
    const usd = { base: 'THB', quote: 'USD', rate: .025, date: '2026-10-14' };
    const eur = { base: 'THB', quote: 'EUR', rate: .02, date: '2026-10-13' };
    const result = ctx.parseFrankfurterRates([usd, eur], ['USD', 'EUR']);
    assert.equal(result.rates.USD, 40);
    assert.equal(result.rates.EUR, 50);
    assert.equal(result.dates.EUR, '2026-10-13');
    for (const payload of [{ rates: { USD: .025 } }, [], [usd], [usd, usd, eur],
        [usd, { ...eur, rate: 0 }], [usd, { ...eur, rate: '0.02' }],
        [usd, { ...eur, date: '2026-02-30' }], [usd, { ...eur, base: 'USD' }]]) {
        assert.throws(() => ctx.parseFrankfurterRates(payload, ['USD', 'EUR']));
    }
});

test('currency loader commits only valid snapshots and preserves rates/date after failures', async () => {
    const currency = { ratesInTHB: { THB: 1, USD: 35 }, lastUpdated: '2026-10-01T00:00:00Z' };
    const ctx = context({ appState: { activeToolId: 'calc', currency }, persistAppState() {},
        fetch: async () => ({ ok: true, json: async () => [] }) });
    vm.runInContext('let currencyFetchInFlight = false;\n' + source('loadFrankfurterRates'), ctx);
    await ctx.loadFrankfurterRates(true);
    assert.equal(currency.ratesInTHB.USD, 35);
    assert.equal(currency.lastUpdated, '2026-10-01T00:00:00Z');
    assert.match(currency.rateSource, /ไม่สำเร็จ/);
    ctx.fetch = async () => ({ ok: true, json: async () => [{ base: 'THB', quote: 'USD', rate: .025, date: '2026-10-14' }] });
    await ctx.loadFrankfurterRates(true);
    assert.equal(currency.ratesInTHB.USD, 40);
    assert.equal(currency.rateSource, 'Frankfurter');
    assert.equal(currency.rateDates.USD, '2026-10-14');
    const updated = currency.lastUpdated;
    ctx.fetch = async () => { throw new Error('offline'); };
    await ctx.loadFrankfurterRates(true);
    assert.equal(currency.ratesInTHB.USD, 40);
    assert.equal(currency.lastUpdated, updated);
});

test('working days support reverse ranges, holidays and signed offsets', () => {
    const ctx = context();
    const friday = new Date('2026-10-16T00:00:00'), monday = new Date('2026-10-19T00:00:00');
    const weekday = date => date.getDay() !== 0 && date.getDay() !== 6;
    assert.equal(ctx.countWorkingDays(friday, monday, weekday), 2);
    assert.equal(ctx.countWorkingDays(monday, friday, weekday), 2);
    assert.equal(ctx.formatLocalDate(ctx.offsetWorkingDays(friday, 1, weekday)), '2026-10-19');
    assert.equal(ctx.formatLocalDate(ctx.offsetWorkingDays(monday, -1, weekday)), '2026-10-16');
    const withHoliday = date => weekday(date) && ctx.formatLocalDate(date) !== '2026-10-19';
    assert.equal(ctx.formatLocalDate(ctx.offsetWorkingDays(friday, 1, withHoliday)), '2026-10-20');
    assert.equal(ctx.formatLocalDate(ctx.offsetWorkingDays(friday, 0, () => false)), '2026-10-16');
});

test('working day search terminates with invalid offsets or no matching days', () => {
    const ctx = context(), start = new Date('2026-10-16T00:00:00');
    assert.throws(() => ctx.offsetWorkingDays(start, 1, () => false, 7), /ไม่พบวันทำการ/);
    for (const amount of [NaN, Infinity, .5, 1000000]) assert.throws(() => ctx.offsetWorkingDays(start, amount, () => true));
    assert.throws(() => ctx.offsetWorkingDays(new Date(NaN), 1, () => true));
    assert.throws(() => ctx.countWorkingDays(start, new Date('2027-01-01T00:00:00'), () => true, 7));
});

test('restored empty/invalid weekdays recover before a workday renderer searches', () => {
    const ctx = context({ appState: { date_work: { startDate: '2026-10-16', endDate: '2026-10-19', mode: 'add',
        offset: 1, workDays: [], includeThaiHolidays: false, customHolidays: '', calendarEra: 'CE' } } });
    assert.deepEqual(Array.from(ctx.normalizeWorkDays(['1', 8, -1])), [1, 2, 3, 4, 5]);
    assert.deepEqual(Array.from(ctx.normalizeWorkDays([0, 0, 2])), [0, 2]);
    const result = calculation(ctx, 'renderWorkdayTool', null, '({target:formatLocalDate(target),recoveredDays,calculationError})');
    assert.equal(result.target, '2026-10-19');
    assert.equal(result.recoveredDays, true);
    assert.equal(result.calculationError, '');
    ctx.appState.date_work.offset = '1.5';
    assert.match(calculation(ctx, 'renderWorkdayTool', null, 'calculationError'), /จำนวนเต็ม/);
});

test('meeting reference dates use the selected timezone across midnight', () => {
    const ctx = context();
    const date = new Date('2026-10-14T18:00:00Z');
    assert.equal(ctx.formatDateInTimezone(date, 'Asia/Bangkok'), '2026-10-15');
    assert.equal(ctx.formatDateInTimezone(date, 'America/New_York'), '2026-10-14');
});

test('undo restores the cleared tool and a second empty clear preserves the snapshot', () => {
    const undoButton = { disabled: true };
    let renders = 0;
    const ctx = context({ appState: { activeToolId: 'unit_price', activeFieldIndex: 1,
        unit_price: { rows: [{ id: 'A', price: '864', qty: '50' }, { id: 'B', price: '900', qty: '50' }] },
        currency: { amount: '100' } }, document: { getElementById: () => undoButton },
        renderSidebarMenu() {}, renderActiveTool() { renders++; } });
    vm.runInContext(['captureToolSnapshot', 'rememberToolClear', 'undoLastClear'].map(source).join('\n'), ctx);
    const snapshot = ctx.captureToolSnapshot();
    ctx.appState.unit_price.rows[0].qty = '';
    ctx.rememberToolClear(snapshot);
    assert.equal(undoButton.disabled, false);
    ctx.rememberToolClear(ctx.captureToolSnapshot()); // clearing an empty field is a no-op
    ctx.appState.activeToolId = 'currency';
    ctx.undoLastClear();
    assert.equal(ctx.appState.unit_price.rows[0].qty, '50');
    assert.equal(ctx.appState.unit_price.rows[1].price, '900');
    assert.equal(ctx.appState.activeToolId, 'unit_price');
    assert.equal(ctx.appState.activeFieldIndex, 1);
    assert.equal(ctx.appState.currency.amount, '100');
    assert.equal(undoButton.disabled, true);
    ctx.undoLastClear();
    assert.equal(renders, 1);
});

test('catalog contains exactly 36 tools classified into 5 valid groups with search keywords', () => {
    const { TOOL_GROUPS, TOOLS_CATALOG } = require('../src/catalog.js');
    assert.ok(Array.isArray(TOOL_GROUPS) && Array.isArray(TOOLS_CATALOG), 'Missing TOOL_GROUPS or TOOLS_CATALOG definitions');
    assert.equal(TOOL_GROUPS.length, 5);
    assert.equal(TOOLS_CATALOG.length, 36);
    const validGroupIds = new Set(TOOL_GROUPS.map(g => g.id));
    for (const tool of TOOLS_CATALOG) {
        assert.ok(tool.id && typeof tool.id === 'string', 'Tool id must be non-empty string');
        assert.ok(validGroupIds.has(tool.group), `Tool ${tool.id} has invalid group: ${tool.group}`);
        assert.ok(tool.menuTitle && typeof tool.menuTitle === 'string', `Tool ${tool.id} missing menuTitle`);
        assert.ok(tool.keywords && typeof tool.keywords === 'string' && tool.keywords.length > 5, `Tool ${tool.id} missing search keywords`);
    }
});

test('getToolSummaryText formats context-rich summary for key tools, and discount caps over 100%', () => {
    const ctx = context({
        appState: {
            vat_wht: { amount: '10000', vatRate: '7', whtRate: '3' },
            discount: { price: '1000', discountPct: '150', extraPct: '0' },
            unit_price: { rows: [{ id: 'A', price: '864', qty: '50' }, { id: 'B', price: '900', qty: '50' }] },
            loan: { principal: '500000', interestRate: '4.5', months: '36', extra: '0', calcMethod: 'reducing' },
            savings: { initial: '10000', monthly: '3000', interestRate: '2.5', years: '5', annualIncrease: '0', mode: 'growth' }
        }
    });
    vm.runInContext(source('getToolSummaryText'), ctx);

    // 1. VAT + WHT summary
    const vatWhtText = ctx.getToolSummaryText('vat_wht');
    assert.match(vatWhtText, /สรุปยอด VAT \+ หัก ณ ที่จ่าย/);
    assert.match(vatWhtText, /10,000\.00 บาท/);
    assert.match(vatWhtText, /\+700\.00 บาท/);
    assert.match(vatWhtText, /\-300\.00 บาท/);
    assert.match(vatWhtText, /10,400\.00 บาท/);

    // 2. Unit price comparison summary
    const unitPriceText = ctx.getToolSummaryText('unit_price');
    assert.match(unitPriceText, /เปรียบเทียบราคาต่อหน่วย/);
    assert.match(unitPriceText, /17\.28 บาท\/หน่วย/);
    assert.match(unitPriceText, /18\.00 บาท\/หน่วย/);
    assert.match(unitPriceText, /ตัวเลือก A/);

    // 3. Loan summary
    const loanText = ctx.getToolSummaryText('loan');
    assert.match(loanText, /สรุปยอดผ่อนเงินกู้/);
    assert.match(loanText, /500,000\.00 บาท/);
    assert.match(loanText, /ค่างวด:/);

    // 4. Savings summary
    const savingsText = ctx.getToolSummaryText('savings');
    assert.match(savingsText, /สรุปการวางแผนเงินออม/);
    assert.match(savingsText, /ยอดเงินออมสุทธิ:/);

    // 4b. Salary summary (Net mode)
    const salaryNetText = ctx.getToolSummaryText('salary', {
        salary: {
            mode: 'net',
            baseSalary: '35000',
            otAmount: '3500',
            allowance: '2000',
            bonusMonthly: '0',
            hasSocialSecurity: 'yes',
            pvdPct: '3',
            customDeduction: '0'
        }
    });
    assert.match(salaryNetText, /สรุปเงินเดือนสุทธิรับจริง/);
    assert.match(salaryNetText, /35,000\.00 บาท/);
    assert.match(salaryNetText, /40,500\.00 บาท/);
    assert.match(salaryNetText, /38,038\.00 บาท/);

    // 5. Discount capping
    const discountRes = calculation(ctx, 'renderDiscountTool', null, '({finalPrice, saved, isOver100})');
    assert.equal(discountRes.finalPrice, 0);
    assert.equal(discountRes.saved, 1000);
    assert.equal(discountRes.isOver100, true);
});

test('unit price: cross-unit normalization, cheapest selection, and incompatible families', () => {
    const ctx = context({
        appState: {
            activeToolId: 'unit_price',
            unit_price: {
                rows: [
                    { id: 'A', price: '80', qty: '500', unit: 'g' },
                    { id: 'B', price: '150', qty: '1', unit: 'kg' }
                ]
            }
        }
    });
    vm.runInContext(source('getToolSummaryText'), ctx);

    // 1. Cross-unit weight comparison: 500g @ 80 THB (= 160 THB/kg) vs 1kg @ 150 THB (= 150 THB/kg)
    const summaryWeight = ctx.getToolSummaryText('unit_price');
    assert.match(summaryWeight, /80\.00 บาท \/ 500\.00 g = 160\.00 บาท\/กก\./);
    assert.match(summaryWeight, /150\.00 บาท \/ 1\.00 kg = 150\.00 บาท\/กก\./);
    assert.match(summaryWeight, /ตัวเลือกที่คุ้มที่สุด: ตัวเลือก B \(150\.00 บาท\/กก\.\)/);
    assert.match(summaryWeight, /ประหยัดกว่าตัวเลือก A 6\.3%/);

    // 2. Count comparison: 120 THB / 1 doz (= 10 THB/pcs) vs 11 THB / 1 pcs
    ctx.appState.unit_price.rows = [
        { id: 'A', price: '120', qty: '1', unit: 'doz' },
        { id: 'B', price: '11', qty: '1', unit: 'pcs' }
    ];
    const summaryCount = ctx.getToolSummaryText('unit_price');
    assert.match(summaryCount, /120\.00 บาท \/ 1\.00 โหล = 10\.00 บาท\/ชิ้น/);
    assert.match(summaryCount, /11\.00 บาท \/ 1\.00 ชิ้น = 11\.00 บาท\/ชิ้น/);
    assert.match(summaryCount, /ตัวเลือกที่คุ้มที่สุด: ตัวเลือก A \(10\.00 บาท\/ชิ้น\)/);
    assert.match(summaryCount, /ประหยัดกว่าตัวเลือก B 9\.1%/);

    // 3. Volume comparison: 30 THB / 250 ml (= 120 THB/L) vs 100 THB / 1 L
    ctx.appState.unit_price.rows = [
        { id: 'A', price: '30', qty: '250', unit: 'ml' },
        { id: 'B', price: '100', qty: '1', unit: 'L' }
    ];
    const summaryVolume = ctx.getToolSummaryText('unit_price');
    assert.match(summaryVolume, /30\.00 บาท \/ 250\.00 ml = 120\.00 บาท\/ลิตร/);
    assert.match(summaryVolume, /100\.00 บาท \/ 1\.00 L = 100\.00 บาท\/ลิตร/);
    assert.match(summaryVolume, /ตัวเลือกที่คุ้มที่สุด: ตัวเลือก B \(100\.00 บาท\/ลิตร\)/);
    assert.match(summaryVolume, /ประหยัดกว่าตัวเลือก A 16\.7%/);

    // 4. Incompatible families warning: weight vs volume
    ctx.appState.unit_price.rows = [
        { id: 'A', price: '80', qty: '500', unit: 'g' },
        { id: 'B', price: '100', qty: '1', unit: 'L' }
    ];
    const summaryMismatch = ctx.getToolSummaryText('unit_price');
    assert.match(summaryMismatch, /ไม่สามารถเปรียบเทียบข้ามชนิดหน่วยได้/);
});

test('thai official holidays: Songkran, fixed holidays and lunar Buddhist observations (2025-2027)', () => {
    const ctx = context();
    // Songkran 13-15 April
    assert.equal(ctx.isThaiOfficialHoliday(new Date('2026-04-13T00:00:00')), true);
    assert.equal(ctx.isThaiOfficialHoliday(new Date('2026-04-14T00:00:00')), true);
    assert.equal(ctx.isThaiOfficialHoliday(new Date('2026-04-15T00:00:00')), true);

    // Chatramongkol 4 May
    assert.equal(ctx.isThaiOfficialHoliday(new Date('2026-05-04T00:00:00')), true);

    // Lunar Buddhist holidays & Substitutions
    assert.equal(ctx.isThaiOfficialHoliday(new Date('2026-03-03T00:00:00')), true); // Makha Bucha 2026
    assert.equal(ctx.isThaiOfficialHoliday(new Date('2026-06-01T00:00:00')), true); // Visakha Bucha sub 2026
    assert.equal(ctx.isThaiOfficialHoliday(new Date('2025-02-12T00:00:00')), true); // Makha Bucha 2025

    // Regular working day
    assert.equal(ctx.isThaiOfficialHoliday(new Date('2026-10-14T00:00:00')), false);
});

test('all 36 tools have complete and valid clear and demo data mappings', () => {
    const rawAppStateMatch = html.match(/const appState = \{[\s\S]*?\n        \};/);
    assert.ok(rawAppStateMatch, 'appState must be defined');

    // Run in a mock context that provides clearCurrentTool, loadDemoForCurrentTool, and renderActiveTool
    const ctx = context();
    vm.runInContext(rawAppStateMatch[0].replace(/const /g, 'var '), ctx);
    vm.runInContext(`
        function captureToolSnapshot() {
            return { toolId: appState.activeToolId, fieldIndex: appState.activeFieldIndex,
                state: JSON.parse(JSON.stringify(appState[appState.activeToolId])) };
        }
        function rememberToolClear() {}
        function renderActiveTool() {}
    ` + '\n' + source('clearCurrentTool') + '\n' + source('loadDemoForCurrentTool'), ctx);

    assert.equal(ctx.TOOLS_CATALOG.length, 36);

    for (const tool of ctx.TOOLS_CATALOG) {
        ctx.appState.activeToolId = tool.id;
        // 1. Verify demo loads without throwing
        ctx.loadDemoForCurrentTool();
        const demoState = ctx.appState[tool.id];
        assert.ok(demoState, `Tool ${tool.id} should have populated state after loadDemo`);

        // 2. Verify clear runs without throwing
        ctx.clearCurrentTool();
        const clearedState = ctx.appState[tool.id];
        assert.ok(clearedState, `Tool ${tool.id} should have state after clear`);
    }
});

test('loan amortization schedule generates accurate monthly/yearly breakdown and valid CSV with UTF-8 BOM', () => {
    const ctx = context();

    // 1. 30-year mortgage test (360 months)
    const mortgage = { principal: '1,000,000', interestRate: '3.6', months: '360', extra: '0', calcMethod: 'reducing', rateType: 'fixed' };
    const schedule = ctx.generateLoanSchedule(mortgage);
    assert.equal(schedule.length, 360);
    assert.equal(schedule[0].month, 1);
    assert.equal(schedule[0].year, 1);
    assert.ok(schedule[0].interest > 0);
    assert.ok(schedule[0].principal > 0);
    assert.equal(schedule[359].month, 360);
    assert.equal(schedule[359].year, 30);
    assert.equal(schedule[359].balance, 0);

    // 2. Yearly schedule aggregation
    const yearly = ctx.aggregateLoanScheduleByYear(schedule);
    assert.equal(yearly.length, 30);
    assert.equal(yearly[0].year, 1);
    assert.equal(yearly[0].paymentsCount, 12);
    assert.equal(yearly[0].balance, schedule[11].balance);
    assert.equal(yearly[29].year, 30);
    assert.equal(yearly[29].balance, 0);

    // 3. Monthly CSV export
    const csvMonthly = ctx.buildLoanAmortizationCSV(schedule, 'monthly');
    assert.ok(csvMonthly.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM for Microsoft Excel');
    assert.ok(csvMonthly.includes('งวดที่,ปีที่,ค่างวด (บาท),ดอกเบี้ย (บาท),ตัดเงินต้น (บาท),หนี้คงเหลือ (บาท),อัตราดอกเบี้ย (% ต่อปี)'));
    const monthlyLines = csvMonthly.split('\r\n').filter(Boolean);
    assert.equal(monthlyLines.length, 362); // Header + 360 rows + Total
    assert.ok(monthlyLines[monthlyLines.length - 1].startsWith('รวมทั้งหมด'));

    // 4. Yearly CSV export
    const csvYearly = ctx.buildLoanAmortizationCSV(schedule, 'yearly');
    assert.ok(csvYearly.startsWith('\uFEFF'));
    assert.ok(csvYearly.includes('ปีที่,จำนวนงวดในปี,ยอดผ่อนทั้งปี (บาท),ดอกเบี้ยทั้งปี (บาท),ตัดเงินต้นทั้งปี (บาท),หนี้คงเหลือปลายปี (บาท)'));
    const yearlyLines = csvYearly.split('\r\n').filter(Boolean);
    assert.equal(yearlyLines.length, 32); // Header + 30 rows + Total
    assert.ok(yearlyLines[yearlyLines.length - 1].startsWith('รวมทั้งหมด,360'));

    // 5. Prepayment / Extra payment reduces duration
    const extraLoan = { principal: '500,000', interestRate: '5', months: '60', extra: '5000', calcMethod: 'reducing' };
    const extraSchedule = ctx.generateLoanSchedule(extraLoan);
    assert.ok(extraSchedule.length < 60, 'Extra payment must shorten total loan duration');
    assert.equal(extraSchedule[extraSchedule.length - 1].balance, 0);

    // 6. Filename generator
    const fnMonthly = ctx.getCSVFilename('loan_amortization', 'monthly');
    assert.match(fnMonthly, /^loan_amortization_monthly_\d{8}\.csv$/);
});

test('savings schedule generates accurate monthly/yearly growth breakdown and valid CSV with UTF-8 BOM', () => {
    const ctx = context();

    // 1. Compound savings test (5 years, 60 months)
    const savings = { initial: '50,000', monthly: '5,000', interestRate: '4', years: '5', annualIncrease: '0', inflationRate: '2', mode: 'growth' };
    const data = ctx.generateSavingsSchedule(savings);
    assert.equal(data.monthlyRows.length, 60);
    assert.equal(data.yearlyRows.length, 5);
    assert.equal(data.totalPrincipal, 50000 + 60 * 5000);
    assert.ok(data.totalBalance > data.totalPrincipal, 'Balance must exceed principal from compound interest');
    assert.ok(data.interestEarned > 0);

    // Sum of annual deposits equals total principal
    const sumAnnualDeposits = data.yearlyRows.reduce((sum, r) => sum + r.depositThisYear, 0);
    assert.equal(sumAnnualDeposits, data.totalPrincipal);

    // 2. Monthly CSV export
    const csvMonthly = ctx.buildSavingsScheduleCSV(data, 'monthly');
    assert.ok(csvMonthly.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM for Microsoft Excel');
    assert.ok(csvMonthly.includes('งวดที่,ปีที่,เงินฝากในงวด (บาท),ดอกเบี้ยในงวด (บาท),เงินต้นสะสม (บาท),ดอกเบี้ยสะสม (บาท),ยอดเงินรวมสะสม (บาท)'));
    const monthlyLines = csvMonthly.split('\r\n').filter(Boolean);
    assert.equal(monthlyLines.length, 62); // Header + 60 rows + Total
    assert.ok(monthlyLines[monthlyLines.length - 1].startsWith('รวมทั้งหมด'));

    // 3. Yearly CSV export
    const csvYearly = ctx.buildSavingsScheduleCSV(data, 'yearly');
    assert.ok(csvYearly.startsWith('\uFEFF'));
    assert.ok(csvYearly.includes('ปีที่,เงินฝากในปี (บาท),ดอกเบี้ยในปี (บาท),เงินต้นสะสม (บาท),ดอกเบี้ยสะสม (บาท),ยอดเงินรวมสะสม (บาท),มูลค่าหลังเงินเฟ้อ (บาท)'));
    const yearlyLines = csvYearly.split('\r\n').filter(Boolean);
    assert.equal(yearlyLines.length, 7); // Header + 5 rows + Total
    assert.ok(yearlyLines[yearlyLines.length - 1].startsWith('รวมทั้งหมด,350000.00'));

    // 4. Filename generator
    const fnYearly = ctx.getCSVFilename('savings_schedule', 'yearly');
    assert.match(fnYearly, /^savings_schedule_yearly_\d{8}\.csv$/);
});

test('standard calculator restores the latest expression for editing', () => {
    const calc = { expr: '9', result: '9', history: [{ expr: '12+3', res: '15' }] };
    let restoreClick;
    let renders = 0;
    const ctx = context({
        appState: { calc },
        document: { getElementById: () => null },
        renderActiveTool: () => { renders++; }
    });
    const container = {
        innerHTML: '',
        querySelectorAll: () => [],
        querySelector: selector => selector === '#restoreLatestCalcBtn'
            ? { addEventListener: (event, handler) => { if (event === 'click') restoreClick = handler; } }
            : null
    };

    ctx.renderStandardCalcTool(container);
    assert.match(container.innerHTML, /id="restoreLatestCalcBtn"/);
    assert.equal(typeof restoreClick, 'function');
    restoreClick();
    assert.equal(calc.expr, '12+3');
    assert.equal(calc.result, '15');
    assert.equal(calc.history.length, 1);
    assert.equal(renders, 1);
});

test('calculation history and saved sets: auto-recording, pinning, renaming, FIFO cap and restoration', () => {
    const rawAppStateMatch = html.match(/const appState = \{[\s\S]*?\n        \};/);
    assert.ok(rawAppStateMatch);
    const ctx = context();
    vm.runInContext(rawAppStateMatch[0].replace(/const /g, 'var '), ctx);

    // 1. Summary Extraction Helpers
    const loanSummary = `สรุปยอดผ่อนเงินกู้ & ผ่อนชำระ
----------------------------------
• วงเงินกู้: 2,500,000 บาท
• ดอกเบี้ย: 3.5% ต่อปี (ลดต้นลดดอก)
• ระยะเวลา: 360 เดือน
----------------------------------
ค่างวด: 11,226.12 บาท/เดือน
• ดอกเบี้ยรวม: +1,541,402.89 บาท
• ยอดชำระรวม: 4,041,402.89 บาท
(คำนวณโดย Multitools Calculator)`;

    assert.equal(ctx.extractShortSummary(loanSummary), 'ค่างวด: 11,226.12 บาท/เดือน');
    assert.equal(ctx.extractDetailText(loanSummary), 'วงเงินกู้: 2,500,000 บาท · ดอกเบี้ย: 3.5% ต่อปี (ลดต้นลดดอก)');

    // 2. Record new calculation history entry
    ctx.appState.loan = { principal: '2,500,000', interestRate: '3.5', months: '360', extra: '0', rateType: 'fixed', calcMethod: 'reducing' };
    const entry1 = ctx.recordCalculationHistory(ctx.appState, 'loan', false, '', loanSummary);
    assert.ok(entry1);
    assert.equal(entry1.toolId, 'loan');
    assert.equal(entry1.shortSummary, 'ค่างวด: 11,226.12 บาท/เดือน');
    assert.equal(entry1.isSaved, false);

    let allHist = ctx.getCalculationHistory();
    assert.equal(allHist.length, 1);

    // 3. Pin calculation to Saved Sets with custom label
    const pinned = ctx.pinCalculationHistory(entry1.id, 'บ้านโครงการ A (2.5 ล้าน)');
    assert.equal(pinned.isSaved, true);
    assert.equal(pinned.label, 'บ้านโครงการ A (2.5 ล้าน)');

    allHist = ctx.getCalculationHistory();
    assert.equal(allHist[0].isSaved, true);
    assert.equal(allHist[0].label, 'บ้านโครงการ A (2.5 ล้าน)');

    // 4. Rename saved set
    ctx.renameCalculationHistory(entry1.id, 'บ้านโครงการ พฤกษา');
    allHist = ctx.getCalculationHistory();
    assert.equal(allHist[0].label, 'บ้านโครงการ พฤกษา');

    // 5. Test FIFO 20-item cap on unpinned items
    for (let i = 0; i < 25; i++) {
        ctx.appState.loan.principal = `${i + 1},000,000`;
        ctx.recordCalculationHistory(ctx.appState, 'loan', false, '', `ค่างวด: ${i + 1}0,000 บาท/เดือน\n• วงเงินกู้: ${i + 1} ล้าน`);
    }

    allHist = ctx.getCalculationHistory();
    const savedItems = allHist.filter(h => h.isSaved);
    const unpinnedItems = allHist.filter(h => !h.isSaved);
    assert.equal(savedItems.length, 1, 'Pinned items must be preserved indefinitely');
    assert.equal(unpinnedItems.length, 20, 'Unpinned history must be capped at 20');

    // 6. Restore history item into active state
    ctx.appState.loan.principal = '0';
    const restored = ctx.restoreCalculationHistory(entry1.id, ctx.appState);
    assert.ok(restored);
    assert.equal(restored.id, entry1.id);
    assert.equal(ctx.appState.loan.principal, '2,500,000');
    assert.equal(ctx.appState.activeToolId, 'loan');

    // 7. Clear history (unpinned only)
    ctx.clearCalculationHistory(true);
    allHist = ctx.getCalculationHistory();
    assert.equal(allHist.length, 1, 'Only saved items must remain after clearing unpinned history');
    assert.equal(allHist[0].id, entry1.id);

    // 8. Delete saved item
    ctx.deleteCalculationHistory(entry1.id);
    allHist = ctx.getCalculationHistory();
    assert.equal(allHist.length, 0);
});

test('formal print-to-pdf: generates accurate Thai receipt documents for loan, savings, vat_wht, and salary', () => {
    const ctx = context();

    // 1. Thai Buddhist Era formal date formatting
    const sampleDate = new Date('2026-10-15T11:45:00+07:00');
    const formattedDate = ctx.formatThaiFormalDate(sampleDate);
    assert.ok(formattedDate.includes('15 ตุลาคม พ.ศ. 2569'), 'Date must include Thai day, month, and BE year (2569)');
    assert.ok(formattedDate.includes('น.'), 'Time must end with Thai minute abbreviation (น.)');

    // 2. Loan Formal Receipt
    const loanState = {
        activeToolId: 'loan',
        loan: {
            principal: '2,000,000',
            interestRate: '5.0',
            months: '360',
            extra: '2,000',
            rateType: 'fixed',
            calcMethod: 'reducing'
        }
    };
    const loanDoc = ctx.generateFormalPrintHTML('loan', loanState);
    assert.ok(loanDoc.includes('MULTITOOLS AIO'));
    assert.ok(loanDoc.includes('เอกสารสรุปผลการคำนวณสินเชื่อและตารางผ่อนชำระ'));
    assert.ok(loanDoc.includes('2,000,000.00 บาท'), 'Must list loan principal');
    assert.ok(loanDoc.includes('ยอดผ่อนชำระต่อเดือน'));
    assert.ok(loanDoc.includes('ตารางแจกแจงสรุปยอดผ่อนและลดหนี้รายปี'), 'Must contain yearly amortization table');
    assert.ok(loanDoc.includes('ปีที่ 1'));

    // 3. Savings Formal Receipt
    const savingsState = {
        activeToolId: 'savings',
        savings: {
            initial: '50,000',
            monthly: '5,000',
            interestRate: '4.0',
            years: '10',
            annualIncrease: '0',
            inflationRate: '2.0',
            mode: 'growth'
        }
    };
    const savingsDoc = ctx.generateFormalPrintHTML('savings', savingsState);
    assert.ok(savingsDoc.includes('รายงานแผนการออมเงินและดอกเบี้ยทบต้น'));
    assert.ok(savingsDoc.includes('50,000.00 บาท'), 'Must list initial deposit');
    assert.ok(savingsDoc.includes('มูลค่าเงินออมรวมในอนาคต'));
    assert.ok(savingsDoc.includes('ตารางการเติบโตของเงินออมรายปี'));
    assert.ok(savingsDoc.includes('ปีที่ 10'));

    // 4. VAT & WHT Formal Receipt
    const vatWhtState = {
        activeToolId: 'vat_wht',
        vat_wht: {
            amount: '10,000',
            mode: 'before',
            vatRate: '7',
            whtRate: '3'
        }
    };
    const vatDoc = ctx.generateFormalPrintHTML('vat_wht', vatWhtState);
    assert.ok(vatDoc.includes('ใบสรุปรายการภาษีมูลค่าเพิ่มและภาษีหัก ณ ที่จ่าย'));
    assert.ok(vatDoc.includes('10,000.00 บาท'), 'Base amount');
    assert.ok(vatDoc.includes('700.00 บาท'), 'VAT amount (7%)');
    assert.ok(vatDoc.includes('10,700.00 บาท'), 'Gross amount with VAT');
    assert.ok(vatDoc.includes('300.00 บาท'), 'WHT deduction (3%)');
    assert.ok(vatDoc.includes('10,400.00 บาท'), 'Net payable amount');

    // 5. Salary Formal Receipt
    const salaryState = {
        activeToolId: 'salary',
        salary: {
            income: '40,000',
            needsPct: '50',
            wantsPct: '30',
            savingsPct: '20',
            emergencyPct: '10',
            debtPct: '10'
        }
    };
    const salaryDoc = ctx.generateFormalPrintHTML('salary', salaryState);
    assert.ok(salaryDoc.includes('แผนการจัดสรรเงินเดือนและงบประมาณการเงิน (50/30/20)'));
    assert.ok(salaryDoc.includes('40,000.00 บาท/เดือน'));
    assert.ok(salaryDoc.includes('20,000.00 บาท'), 'Needs 50% = 20,000');
    assert.ok(salaryDoc.includes('12,000.00 บาท'), 'Wants 30% = 12,000');
    assert.ok(salaryDoc.includes('8,000.00 บาท'), 'Savings 20% = 8,000');

    // 5b. Salary Net Mode Formal Receipt (Simulated Pay Slip)
    const salaryNetState = {
        activeToolId: 'salary',
        salary: {
            mode: 'net',
            baseSalary: '35,000',
            otAmount: '3,500',
            allowance: '2,000',
            bonusMonthly: '0',
            hasSocialSecurity: 'yes',
            pvdPct: '3',
            customDeduction: '0'
        }
    };
    const salaryNetDoc = ctx.generateFormalPrintHTML('salary', salaryNetState);
    assert.ok(salaryNetDoc.includes('ใบแจ้งเงินเดือนและรายการหักภาษีจำลอง (Pay Slip)'));
    assert.ok(salaryNetDoc.includes('40,500.00 บาท'), 'Gross salary 40,500');
    assert.ok(salaryNetDoc.includes('-750.00'), 'SSO -750.00');
    assert.ok(salaryNetDoc.includes('-1,050.00'), 'PVD -1,050.00');
    assert.ok(salaryNetDoc.includes('38,038.00 บาท'), 'Net monthly 38,038');

    // 6. Tax Personal Formal Receipt
    const taxState = {
        activeToolId: 'tax_personal',
        tax_personal: {
            salaryMonthly: '50,000',
            bonusYearly: '50,000',
            withholdingTax: '12,000',
            socialSecurity: '9,000',
            lifeInsurance: '30,000'
        }
    };
    const taxDoc = ctx.generateFormalPrintHTML('tax_personal', taxState);
    assert.ok(taxDoc.includes('ใบสรุปการคำนวณภาษีเงินได้บุคคลธรรมดาและวางแผนลดหย่อน (ภ.ง.ด. 90/91)'));
    assert.ok(taxDoc.includes('650,000.00 บาท'));
    assert.ok(taxDoc.includes('ตารางแจกแจงภาษีอัตราก้าวหน้า 7 ขั้น'));

    // 7. Property Transfer Formal Receipt
    const propState = {
        activeToolId: 'property_transfer',
        property_transfer: {
            appraisedValue: '3,000,000',
            salePrice: '3,200,000',
            mortgageAmount: '2,500,000',
            holdingYears: '3',
            exemptSBT: 'no',
            splitMode: 'custom'
        }
    };
    const propDoc = ctx.generateFormalPrintHTML('property_transfer', propState);
    assert.ok(propDoc.includes('เอกสารประมาณการค่าธรรมเนียมและภาษีการโอนกรรมสิทธิ์อสังหาริมทรัพย์ สำนักงานที่ดิน'));
    assert.ok(propDoc.includes('3,000,000.00 บาท'));
    assert.ok(propDoc.includes('ฝั่งผู้ซื้อต้องเตรียมชำระ'));
    assert.ok(propDoc.includes('ฝั่งผู้ขายต้องเตรียมชำระ'));

    // 8. Gold Thai Formal Receipt
    const goldState = {
        activeToolId: 'gold_thai',
        gold_thai: {
            mode: 'buy',
            goldType: 'ornament',
            weightUnit: 'baht',
            weightValue: '2',
            craftFee: '1200',
            priceBarBuy: '43900',
            priceBarSell: '44000',
            priceOrnamentBuy: '43115',
            priceOrnamentSell: '44500'
        }
    };
    const goldDoc = ctx.generateFormalPrintHTML('gold_thai', goldState);
    assert.ok(goldDoc.includes('เอกสารประมาณการราคาทองคำแท่งและทองรูปพรรณ'));
    assert.ok(goldDoc.includes('ทองรูปพรรณ (96.5%)'));
    assert.ok(goldDoc.includes('ราคาซื้อสุทธิที่หน้าร้าน'));
    assert.ok(goldDoc.includes('เกณฑ์ราคากลางสมาคมค้าทองคำแห่งประเทศไทย'));

    // 9. Electricity Bill Formal Receipt
    const elecState = {
        activeToolId: 'electricity_bill',
        electricity_bill: {
            mode: 'bill',
            tariffType: 'type1_2',
            units: '350',
            ftRate: '0.3972'
        }
    };
    const elecDoc = ctx.generateFormalPrintHTML('electricity_bill', elecState);
    assert.ok(elecDoc.includes('เอกสารประมาณการค่าไฟฟ้าบ้านอยู่อาศัยตามอัตราก้าวหน้า'));
    assert.ok(elecDoc.includes('350 หน่วย (kWh)'));
    assert.ok(elecDoc.includes('ค่าไฟฟ้ารวมสุทธิ (Total Bill)'));
    assert.ok(elecDoc.includes('ตารางแจกแจงค่าพลังงานไฟฟ้าตามขั้นบันไดอัตราก้าวหน้า'));

    // 10. Car Loan Formal Receipt
    const carLoanState = {
        activeToolId: 'car_loan',
        car_loan: {
            vehicleType: 'car',
            condition: 'new',
            price: '850000',
            downPaymentType: 'percent',
            downPaymentValue: '20',
            interestRate: '2.59',
            periodMonths: '60',
            payoffMonth: '30'
        }
    };
    const carLoanDoc = ctx.generateFormalPrintHTML('car_loan', carLoanState);
    assert.ok(carLoanDoc.includes('เอกสารประมาณการสินเชื่อเช่าซื้อรถยนต์และตารางปิดบัญชีล่วงหน้า'));
    assert.ok(carLoanDoc.includes('850,000.00 บาท'));
    assert.ok(carLoanDoc.includes('ค่างวดผ่อนชำระรายเดือน'));
    assert.ok(carLoanDoc.includes('สรุปโครงสร้างสินเชื่อเช่าซื้อและเกณฑ์ส่วนลดปิดบัญชี สคบ.'));

    // 11. Social Security Formal Receipt
    const ssState = {
        activeToolId: 'social_security',
        social_security: {
            section: 'm33',
            wageMonthly: '35000',
            contributionMonths: '240',
            m40Plan: 'plan2',
            m40ExtraSavings: '0'
        }
    };
    const ssDoc = ctx.generateFormalPrintHTML('social_security', ssState);
    assert.ok(ssDoc.includes('เอกสารประมาณการสิทธิประโยชน์เงินบำนาญและเงินชราภาพประกันสังคม'));
    assert.ok(ssDoc.includes('เงินบำนาญชราภาพรายเดือน'));
    assert.ok(ssDoc.includes('เกณฑ์สิทธิประโยชน์ชราภาพและการจัดสรรเงินสมทบ'));

    // 12. Labor Severance Formal Receipt
    const laborState = {
        activeToolId: 'labor_severance',
        labor_severance: {
            salaryMonthly: '45,000',
            mode: 'duration',
            serviceYears: '5',
            serviceMonths: '8',
            serviceDays: '15',
            noticeGiven: 'no',
            noticeMonths: '1',
            unusedLeaveDays: '6'
        }
    };
    const laborDoc = ctx.generateFormalPrintHTML('labor_severance', laborState);
    assert.ok(laborDoc.includes('หนังสือแสดงรายการคำนวณเงินชดเชยการเลิกจ้างตามกฎหมายแรงงาน'));
    assert.ok(laborDoc.includes('45,000.00 บาท/เดือน'));
    assert.ok(laborDoc.includes('เงินชดเชยเลิกจ้างตามอายุงาน'));
    assert.ok(laborDoc.includes('พ.ร.บ. คุ้มครองแรงงาน ม.118'));

    // 13. Legal Interest Formal Receipt
    const legState = {
        activeToolId: 'legal_interest',
        legal_interest: {
            principal: '250,000',
            ratePreset: 'default_5',
            customRate: '5.0',
            calcMode: 'days',
            overdueDays: '120'
        }
    };
    const legDoc = ctx.generateFormalPrintHTML('legal_interest', legState);
    assert.ok(legDoc.includes('หนังสือแสดงรายการคำนวณดอกเบี้ยผิดนัดชำระหนี้ตามประมวลกฎหมายแพ่งและพาณิชย์'));
    assert.ok(legDoc.includes('250,000.00 บาท'));
    assert.ok(legDoc.includes('ป.พ.พ. ม.224'));
    assert.ok(legDoc.includes('ยอดหนี้รวมทั้งสิ้นที่ลูกหนี้ต้องชำระ'));

    // 14. Overtime & Holiday Pay Formal Receipt
    const otState = {
        activeToolId: 'ot_calc',
        ot_calc: {
            wageType: 'monthly',
            wageBase: '28,000',
            workHoursPerDay: '8',
            otWeekdayHours: '16',
            holidayWorkHours: '8',
            holidayOtHours: '4',
            shiftAllowance: '1,200'
        }
    };
    const otDoc = ctx.generateFormalPrintHTML('ot_calc', otState);
    assert.ok(otDoc.includes('หนังสือแสดงรายการคำนวณค่าล่วงเวลาและค่าทำงานในวันหยุด'));
    assert.ok(otDoc.includes('28,000.00 บาท'));
    assert.ok(otDoc.includes('พ.ร.บ. คุ้มครองแรงงาน พ.ศ. 2541'));
    assert.ok(otDoc.includes('รวมค่าล่วงเวลา OT สุทธิ'));
    assert.ok(otDoc.includes('ล่วงเวลาวันทำงานปกติ (ม.61)'));

    // 15. E-Commerce Net Profit Formal Receipt
    const ecomState = {
        activeToolId: 'ecommerce_profit',
        ecommerce_profit: {
            platform: 'shopee',
            sellingPrice: '390',
            productCost: '140',
            packagingCost: '12',
            shopVoucher: '20',
            customerShipping: '35',
            sellerShipping: '35',
            adSpendPerOrder: '35',
            commissionRatePct: '5.0',
            serviceFeePct: '4.0',
            transactionRatePct: '3.0',
            isVatApplied: 'yes'
        }
    };
    const ecomDoc = ctx.generateFormalPrintHTML('ecommerce_profit', ecomState);
    assert.ok(ecomDoc.includes('ใบวิเคราะห์โครงสร้างต้นทุน กำไรสุทธิ และค่าธรรมเนียมขายของออนไลน์'));
    assert.ok(ecomDoc.includes('390.00 บาท'));
    assert.ok(ecomDoc.includes('Shopee Thailand'));
    assert.ok(ecomDoc.includes('รวมค่าธรรมเนียมแพลตฟอร์มทั้งสิ้น'));

    // 16. Mortgage Refinance vs Retention Formal Receipt (Bank of Thailand BOT guidelines)
    const refiState = {
        activeToolId: 'loan',
        loan: {
            tab: 'refinance',
            principal: '2,000,000',
            months: '240',
            currentRate: '5.50',
            retentionRate: '3.80',
            retentionFee: '0',
            refinanceRate: '2.99',
            isGovReducedMortgage: 'no',
            appraisalFee: '2800',
            insuranceFee: '2000'
        }
    };
    const refiDoc = ctx.generateFormalPrintHTML('loan', refiState);
    assert.ok(refiDoc.includes('เอกสารสรุปผลวิเคราะห์การรีไฟแนนซ์บ้าน vs ขอลดดอกเบี้ย (Retention)'));
    assert.ok(refiDoc.includes('2,000,000.00 บาท'));
    assert.ok(refiDoc.includes('เปรียบเทียบ 3 ทางเลือกในรอบ 3 ปี (36 งวดแรก อิงเกณฑ์ ธปท.)'));
    assert.ok(refiDoc.includes('ประมาณการค่าใช้จ่ายในการย้ายธนาคาร (Refinance Closing Costs)'));
    assert.ok(refiDoc.includes('คำแนะนำความคุ้มค่า (ธปท.)'));

    // 17. Generic Calculator Fallback
    const genericDoc = ctx.generateFormalPrintHTML('tip', { activeToolId: 'tip' });
    assert.ok(genericDoc.includes('MULTITOOLS AIO'));
    assert.ok(genericDoc.includes('เอกสารสรุปผลการคำนวณ'));
    assert.ok(genericDoc.includes('ข้อมูลและเงื่อนไขการคำนวณ'));
});

test('quick compare engine: side-by-side metrics, delta calculation, winner identification, and presets', () => {
    const ctx = context();

    // 1. Presets availability
    for (const toolId of ['loan', 'savings', 'vat_wht', 'salary', 'tax_personal', 'property_transfer', 'gold_thai', 'electricity_bill', 'car_loan', 'social_security', 'labor_severance', 'legal_interest', 'ot_calc', 'ecommerce_profit']) {
        const presets = ctx.getComparisonPresets(toolId);
        assert.ok(Array.isArray(presets) && presets.length >= 3, `Presets for ${toolId} must have at least 3 items`);
        assert.ok(presets[0].label && presets[0].state, `Preset item must have label and state`);
    }

    // 2. Loan comparison
    const loanA = {
        label: 'ธนาคาร A (5.0%)',
        state: { principal: '2,000,000', interestRate: '5.0', months: '360', extra: '0', rateType: 'fixed', calcMethod: 'reducing' }
    };
    const loanB = {
        label: 'ธนาคาร B (3.8%)',
        state: { principal: '2,000,000', interestRate: '3.8', months: '360', extra: '0', rateType: 'fixed', calcMethod: 'reducing' }
    };
    const loanComp = ctx.compareCalculations('loan', [loanA, loanB]);
    assert.ok(loanComp);
    assert.equal(loanComp.items.length, 2);
    assert.equal(loanComp.winnerIndex, 1, 'Bank B with 3.8% must win over Bank A with 5.0% due to lower interest');
    assert.ok(loanComp.deltaSummary.includes('ธนาคาร B (3.8%)'));
    assert.ok(loanComp.deltaSummary.includes('ประหยัดดอกเบี้ยได้สูงสุด'));
    assert.ok(loanComp.rows.length >= 7);

    // 3. Savings comparison
    const savingsA = {
        label: 'เงินฝากประจำ 2.5%',
        state: { initial: '10,000', monthly: '3,000', interestRate: '2.5', years: '5', annualIncrease: '0', inflationRate: '2.0', mode: 'growth' }
    };
    const savingsB = {
        label: 'กองทุนรวมหุ้น 6.0%',
        state: { initial: '10,000', monthly: '3,000', interestRate: '6.0', years: '5', annualIncrease: '0', inflationRate: '2.0', mode: 'growth' }
    };
    const savingsComp = ctx.compareCalculations('savings', [savingsA, savingsB]);
    assert.ok(savingsComp);
    assert.equal(savingsComp.winnerIndex, 1, 'Option B with 6% interest must win over Option A with 2.5%');
    assert.ok(savingsComp.deltaSummary.includes('กองทุนรวมหุ้น 6.0%'));
    assert.ok(savingsComp.deltaSummary.includes('มากกว่าถึง'));

    // 4. VAT & WHT comparison
    const vatA = {
        label: 'ไม่หัก ณ ที่จ่าย',
        state: { amount: '20,000', mode: 'before', vatRate: '7', whtRate: '0' }
    };
    const vatB = {
        label: 'หัก ณ ที่จ่าย 3%',
        state: { amount: '20,000', mode: 'before', vatRate: '7', whtRate: '3' }
    };
    const vatComp = ctx.compareCalculations('vat_wht', [vatA, vatB]);
    assert.ok(vatComp);
    assert.equal(vatComp.items.length, 2);

    // 5. Salary comparison
    const salaryA = {
        label: 'แผนปกติ 50/30/20',
        state: { income: '50,000', needsPct: '50', wantsPct: '30', savingsPct: '20' }
    };
    const salaryB = {
        label: 'แผนออมหนัก 40/20/40',
        state: { income: '50,000', needsPct: '40', wantsPct: '20', savingsPct: '40' }
    };
    const salaryComp = ctx.compareCalculations('salary', [salaryA, salaryB]);
    assert.ok(salaryComp);
    assert.equal(salaryComp.winnerIndex, 1, 'Salary plan B with 40% savings must win for highest savings');

    // 5b. Salary Net Mode comparison
    const salaryNetA = {
        label: 'งานเดิม 35k ไม่มี PVD',
        state: { mode: 'net', baseSalary: '35,000', otAmount: '0', allowance: '0', pvdPct: '0', savingsPct: '20' }
    };
    const salaryNetB = {
        label: 'งานใหม่ 45k มี PVD 5%',
        state: { mode: 'net', baseSalary: '45,000', otAmount: '0', allowance: '0', pvdPct: '5', savingsPct: '20' }
    };
    const salaryNetComp = ctx.compareCalculations('salary', [salaryNetA, salaryNetB]);
    assert.ok(salaryNetComp);
    assert.equal(salaryNetComp.winnerIndex, 1, 'Salary Net B with higher income must win on absolute savings');

    // 6. Tax Personal comparison
    const taxA = {
        label: 'ไม่ลดหย่อนเพิ่ม',
        state: { salaryMonthly: '50,000', bonusYearly: '0', socialSecurity: '9,000', lifeInsurance: '0', ssf: '0' }
    };
    const taxB = {
        label: 'ลดหย่อนประกัน 50k',
        state: { salaryMonthly: '50,000', bonusYearly: '0', socialSecurity: '9,000', lifeInsurance: '50,000', ssf: '0' }
    };
    const taxComp = ctx.compareCalculations('tax_personal', [taxA, taxB]);
    assert.ok(taxComp);
    assert.equal(taxComp.winnerIndex, 1, 'Plan with deductions must yield lower tax');
    assert.ok(taxComp.deltaSummary.includes('ประหยัดภาษีได้สูงสุด'));

    // 7. Property Transfer comparison
    const propA = {
        label: 'ถือครอง 3 ปี (SBT 3.3%)',
        state: { appraisedValue: '3,000,000', salePrice: '3,000,000', mortgageAmount: '0', holdingYears: '3', exemptSBT: 'no', isGovMeasure: 'standard' }
    };
    const propB = {
        label: 'ถือครอง 5 ปี (อากร 0.5%)',
        state: { appraisedValue: '3,000,000', salePrice: '3,000,000', mortgageAmount: '0', holdingYears: '5', exemptSBT: 'yes', isGovMeasure: 'standard' }
    };
    const propComp = ctx.compareCalculations('property_transfer', [propA, propB]);
    assert.ok(propComp);
    assert.equal(propComp.winnerIndex, 1, 'Option with 0.5% stamp duty must win over 3.3% SBT');
    assert.ok(propComp.deltaSummary.includes('ค่าใช้จ่ายวันโอนรวมต่ำที่สุด'));

    // 8. Gold Thai comparison
    const goldA = {
        label: 'ทองรูปพรรณ 1 บาท',
        state: { mode: 'buy', goldType: 'ornament', weightUnit: 'baht', weightValue: '1', craftFee: '800', priceOrnamentSell: '44500' }
    };
    const goldB = {
        label: 'ทองคำแท่ง 1 บาท',
        state: { mode: 'buy', goldType: 'bar', weightUnit: 'baht', weightValue: '1', craftFee: '0', priceBarSell: '44000' }
    };
    const goldComp = ctx.compareCalculations('gold_thai', [goldA, goldB]);
    assert.ok(goldComp);
    assert.equal(goldComp.winnerIndex, 1, 'Gold bar without craft fee must have lower total buy price');
    assert.ok(goldComp.deltaSummary.includes('ทองคำแท่ง 1 บาท'));

    // 9. Electricity Bill comparison
    const elecA = {
        label: 'ปกติ 250 หน่วย',
        state: { mode: 'bill', tariffType: 'type1_2', units: '250', ftRate: '0.3972' }
    };
    const elecB = {
        label: 'เปิดแอร์ 400 หน่วย',
        state: { mode: 'bill', tariffType: 'type1_2', units: '400', ftRate: '0.3972' }
    };
    const elecComp = ctx.compareCalculations('electricity_bill', [elecA, elecB]);
    assert.ok(elecComp);
    assert.equal(elecComp.winnerIndex, 0, '250 units must yield lower total bill than 400 units');
    assert.ok(elecComp.deltaSummary.includes('ปกติ 250 หน่วย'));

    // 10. Car Loan comparison
    const carA = {
        label: 'ผ่อน 48 งวด (2.39%)',
        state: { vehicleType: 'car', condition: 'new', price: '850000', downPaymentType: 'percent', downPaymentValue: '25', interestRate: '2.39', periodMonths: '48', payoffMonth: '24' }
    };
    const carB = {
        label: 'ผ่อน 72 งวด (2.99%)',
        state: { vehicleType: 'car', condition: 'new', price: '850000', downPaymentType: 'percent', downPaymentValue: '25', interestRate: '2.99', periodMonths: '72', payoffMonth: '36' }
    };
    const carComp = ctx.compareCalculations('car_loan', [carA, carB]);
    assert.ok(carComp);
    assert.equal(carComp.winnerIndex, 0, '48 months term with lower rate must have lower total repayment');
    assert.ok(carComp.deltaSummary.includes('ผ่อน 48 งวด (2.39%)'));

    // 11. Social Security comparison
    const ssA = {
        label: 'ม.33 ส่ง 15 ปี (180 งวด)',
        state: { section: 'm33', wageMonthly: '35000', contributionMonths: '180', m40Plan: 'plan2', m40ExtraSavings: '0' }
    };
    const ssB = {
        label: 'ม.33 ส่ง 25 ปี (300 งวด)',
        state: { section: 'm33', wageMonthly: '35000', contributionMonths: '300', m40Plan: 'plan2', m40ExtraSavings: '0' }
    };
    const ssComp = ctx.compareCalculations('social_security', [ssA, ssB]);
    assert.ok(ssComp);
    assert.equal(ssComp.winnerIndex, 1, '25 years contribution must yield higher monthly pension than 15 years');
    assert.ok(ssComp.deltaSummary.includes('ม.33 ส่ง 25 ปี (300 งวด)'));

    // 12. Labor Severance comparison
    const laborA = {
        label: 'อายุงาน 2 ปี (ชดเชย 90 วัน)',
        state: { salaryMonthly: '35000', mode: 'duration', serviceYears: '2', serviceMonths: '0', noticeGiven: 'yes', noticeMonths: '1', unusedLeaveDays: '0' }
    };
    const laborB = {
        label: 'อายุงาน 5 ปี (ชดเชย 180 วัน) + ค่าตกใจ 1 ด.',
        state: { salaryMonthly: '35000', mode: 'duration', serviceYears: '5', serviceMonths: '0', noticeGiven: 'no', noticeMonths: '1', unusedLeaveDays: '5' }
    };
    const laborComp = ctx.compareCalculations('labor_severance', [laborA, laborB]);
    assert.ok(laborComp);
    assert.equal(laborComp.winnerIndex, 1, '5 years with notice pay must yield higher severance package');
    assert.ok(laborComp.deltaSummary.includes('อายุงาน 5 ปี'));

    // 13. Legal Interest comparison
    const legA = {
        label: 'ดอกเบี้ย ป.พ.พ. 5.0%',
        state: { principal: '200000', ratePreset: 'default_5', customRate: '5.0', calcMode: 'days', overdueDays: '60' }
    };
    const legB = {
        label: 'ดอกเบี้ย ป.พ.พ. ม.7 3.0%',
        state: { principal: '200000', ratePreset: 'statutory_3', customRate: '3.0', calcMode: 'days', overdueDays: '60' }
    };
    const legComp = ctx.compareCalculations('legal_interest', [legA, legB]);
    assert.ok(legComp);
    assert.equal(legComp.winnerIndex, 1, '3.0% interest must yield lower debt than 5.0%');
    assert.ok(legComp.deltaSummary.includes('ดอกเบี้ย ป.พ.พ. ม.7 3.0%'));

    // 14. Overtime comparison
    const otA = {
        label: 'ทางเลือก A (OT วันธรรมดา 10 ชม.)',
        state: { wageType: 'monthly', wageBase: '25000', workHoursPerDay: '8', otWeekdayHours: '10', holidayWorkHours: '0', holidayOtHours: '0', shiftAllowance: '0' }
    };
    const otB = {
        label: 'ทางเลือก B (OT วันธรรมดา 15 ชม. + วันหยุด 8 ชม.)',
        state: { wageType: 'monthly', wageBase: '25000', workHoursPerDay: '8', otWeekdayHours: '15', holidayWorkHours: '8', holidayOtHours: '0', shiftAllowance: '500' }
    };
    const otComp = ctx.compareCalculations('ot_calc', [otA, otB]);
    assert.ok(otComp);
    assert.equal(otComp.winnerIndex, 1, 'More OT hours and holiday work must yield higher OT pay');
    assert.ok(otComp.deltaSummary.includes('ทางเลือก B'));

    // 15. E-commerce comparison
    const ecomA = {
        label: 'Shopee (ราคา 350 บ.)',
        state: { platform: 'shopee', sellingPrice: '350', productCost: '150', packagingCost: '10', shopVoucher: '0', customerShipping: '35', sellerShipping: '35', adSpendPerOrder: '30', commissionRatePct: '5.0', serviceFeePct: '4.0', transactionRatePct: '3.0', isVatApplied: 'yes' }
    };
    const ecomB = {
        label: 'ขายตรง LINE Shop (ราคา 320 บ.)',
        state: { platform: 'direct', sellingPrice: '320', productCost: '150', packagingCost: '10', shopVoucher: '0', customerShipping: '35', sellerShipping: '35', adSpendPerOrder: '15', commissionRatePct: '0.0', serviceFeePct: '0.0', transactionRatePct: '0.0', isVatApplied: 'no' }
    };
    const ecomComp = ctx.compareCalculations('ecommerce_profit', [ecomA, ecomB]);
    assert.ok(ecomComp);
    assert.ok(ecomComp.deltaSummary.includes('ทางเลือกที่สร้างกำไรสุทธิสูงสุด'));

    // 16. Print Comparison Sheet Generator
    const printHTML = ctx.generateComparePrintHTML(loanComp);
    assert.ok(printHTML.includes('MULTITOOLS AIO'));
    assert.ok(printHTML.includes('ตารางวิเคราะห์และเปรียบเทียบชุดคำนวณ'));
    assert.ok(printHTML.includes('ธนาคาร A (5.0%)'));
    assert.ok(printHTML.includes('ธนาคาร B (3.8%)'));
    assert.ok(printHTML.includes('คุ้มค่าที่สุด'));
});

test('all 36 tool renderers are modularized and exported across the 5 tool groups', () => {
    const ctx = context();
    const rendererMap = {
        unit_price:        'renderUnitPriceTool',
        discount:          'renderDiscountTool',
        tip:               'renderTipTool',
        unit:              'renderUnitConverterTool',
        construction_calc: 'renderConstructionTool',
        vat:               'renderVatTool',
        vat_wht:           'renderVatWhtTool',
        percent:           'renderPercentTool',
        salary:            'renderSalaryTool',
        loan:              'renderLoanTool',
        savings:           'renderSavingsTool',
        currency:          'renderCurrencyTool',
        date_work:         'renderWorkdayTool',
        date_calc:         'renderDateCalcTool',
        world_time:        'renderWorldTimeTool',
        gpa:               'renderGpaTool',
        health:            'renderHealthTool',
        ovulation:         'renderOvulationTool',
        fuel_cost:         'renderFuelCostTool',
        fuel_eff:          'renderFuelEffTool',
        area_cost:         'renderAreaCostTool',
        hex:               'renderHexTool',
        calc:              'renderStandardCalcTool',
        lotto_calc:        'renderLottoTool',
        tax_personal:      'renderTaxPersonalTool',
        property_transfer: 'renderPropertyTransferTool',
        gold_thai:         'renderGoldThaiTool',
        electricity_bill:  'renderElectricityBillTool',
        car_loan:          'renderCarLoanTool',
        social_security:   'renderSocialSecurityTool',
        labor_severance:   'renderLaborSeveranceTool',
        legal_interest:    'renderLegalInterestTool',
        ot_calc:           'renderOvertimeTool',
        ecommerce_profit:  'renderEcommerceProfitTool',
        debt_payoff:       'renderDebtPayoffTool',
        food_costing:      'renderFoodCostingTool'
    };

    assert.equal(Object.keys(rendererMap).length, 36);

    for (const [toolId, fnName] of Object.entries(rendererMap)) {
        assert.equal(typeof ctx[fnName], 'function', `Tool renderer function ${fnName} for ${toolId} must be exported and callable`);
    }
});

test('actions and modals modules export all expected functions', () => {
    const ctx = context();
    const actionFns = [
        'captureToolSnapshot',
        'rememberToolClear',
        'undoLastClear',
        'clearCurrentTool',
        'loadDemoForCurrentTool',
        'triggerPrintReceipt',
        'setStatusBanner',
        'sanitizeSavedNumericValues'
    ];
    for (const fn of actionFns) {
        assert.equal(typeof ctx[fn], 'function', `Action function ${fn} must be exported and callable`);
    }

    const modalFns = [
        'openModal',
        'closeModal',
        'createAppIconDataURL',
        'setupPWA',
        'triggerInstallFlow',
        'initDropdownListeners',
        'initModalListeners',
        'initCompareModalListeners',
        'initPwaListeners',
        'initAppListeners'
    ];
    for (const fn of modalFns) {
        assert.equal(typeof ctx[fn], 'function', `Modal function ${fn} must be exported and callable`);
    }
});

test('thai lottery engine: permutations, payouts, GLO prize claim, stats and savings simulation', () => {
    const ctx = context();

    // 1. 6-doors permutations (3-digit)
    const perm6 = ctx.expand6Doors('579');
    assert.equal(perm6.length, 6);
    assert.equal(perm6.join(','), '579,597,759,795,957,975');
    const permDouble = ctx.expand6Doors('787');
    assert.equal(permDouble.length, 3);
    assert.equal(permDouble.join(','), '778,787,877');
    const permTriple = ctx.expand6Doors('999');
    assert.equal(permTriple.length, 1);
    assert.equal(permTriple.join(','), '999');

    // 2. 19-doors expansion (digit 8)
    const doors19 = ctx.expand19Doors('8');
    assert.equal(doors19.length, 19);
    assert.ok(doors19.includes('08'));
    assert.ok(doors19.includes('80'));
    assert.ok(doors19.includes('88'));
    assert.ok(doors19.includes('98'));

    // 3. 2-doors reverse
    const rev2 = ctx.expandTwoDigitReverse('28');
    assert.equal(rev2.join(','), '28,82');
    assert.equal(ctx.expandTwoDigitReverse('55').join(','), '55');

    // 4. Double numbers & Runs
    const doubles = ctx.expandDoubleNumbers();
    assert.equal(doubles.length, 10);
    assert.equal(doubles[0], '00');
    assert.equal(doubles[9], '99');

    const frontRun = ctx.expandFrontRun('7');
    assert.equal(frontRun.length, 10);
    assert.equal(frontRun[0], '70');
    assert.equal(frontRun[9], '79');

    // 5. Bet calculation
    const bet = ctx.calculateLottoBet(6, 20, 900);
    assert.equal(bet.count, 6);
    assert.equal(bet.totalCost, 120);
    assert.equal(bet.winningPayout, 18000);
    assert.equal(bet.netProfit, 17880);
    assert.equal(bet.roiPercent, 14900);

    // 6. Prize claim & deduction
    // 1st prize at bank (1.5% fee)
    const claim1 = ctx.calculatePrizeClaim('first', 1, 'bank');
    assert.equal(claim1.totalGrossPrize, 6000000);
    assert.equal(claim1.deductionRate, 1.5);
    assert.equal(claim1.deductionAmount, 90000);
    assert.equal(claim1.netPrize, 5910000);

    // 2-digit at GLO regular (0.5% duty stamp)
    const claim2 = ctx.calculatePrizeClaim('back2', 5, 'glo_regular');
    assert.equal(claim2.totalGrossPrize, 10000);
    assert.equal(claim2.deductionRate, 0.5);
    assert.equal(claim2.deductionAmount, 50);
    assert.equal(claim2.netPrize, 9950);

    // 7. GLO statistics & expected value
    const stats = ctx.calculateLottoStats(80);
    assert.equal(stats.expectedValue, 48);
    assert.equal(stats.winChancePercent.toFixed(4), '1.4168');
    assert.equal(stats.loseChancePercent.toFixed(4), '98.5832');

    // 8. Lotto to wealth compound savings simulation
    const sim = ctx.calculateLottoSavingsSimulation(500, 10, 7);
    assert.equal(sim.spendPerDraw, 500);
    assert.equal(sim.monthlyDeposit, 1000);
    assert.equal(sim.totalPrincipal, 120000); // 1,000 * 120 months
    assert.ok(sim.futureValue > 170000 && sim.futureValue < 175000);
    assert.ok(sim.totalInterest > 50000);

    // 9. Tool summary generation for drawer / history
    const summaryBet = ctx.getToolSummaryText('lotto_calc', {
        lotto_calc: { activeTab: 'bet', numbersList: ['579', '597'], pricePerNumber: '20', payoutRate: '900' }
    });
    assert.match(summaryBet, /สรุปคำนวณต้นทุน & หวยชุด/);
    assert.match(summaryBet, /2 หาง/);
    assert.match(summaryBet, /40\.00 บาท/);

    const summaryClaim = ctx.getToolSummaryText('lotto_calc', {
        lotto_calc: { activeTab: 'claim', claimPrize: 'first', claimTicketCount: '1', claimChannel: 'bank' }
    });
    assert.match(summaryClaim, /สรุปขึ้นเงินรางวัลสลากกินแบ่ง/);
    assert.match(summaryClaim, /รางวัลที่ 1/);
    assert.match(summaryClaim, /5,910,000\.00 บาท/);
});

test('personal income tax engine (ภ.ง.ด. 90/91): bracket steps, deduction caps, refund vs payable, savings simulator', () => {
    const ctx = context();

    // 1. Zero income
    const zeroRes = ctx.calculatePersonalTax({ salaryMonthly: 0, bonusYearly: 0 });
    assert.equal(zeroRes.grossIncome, 0);
    assert.equal(zeroRes.totalTax, 0);
    assert.equal(zeroRes.netTaxableIncome, 0);

    // 2. Typical middle-income earner: 30,000 THB/month (360k/year)
    // Expenses 50% capped at 100k -> 100k
    // Deductions: self 60k + social security 9k = 69k
    // Net taxable: 360k - 100k - 69k = 191,000 THB
    // Tax: 150k @ 0% + 41k @ 5% = 2,050 THB
    const midRes = ctx.calculatePersonalTax({
        salaryMonthly: '30,000',
        bonusYearly: '0',
        socialSecurity: '9,000',
        withholdingTax: '3,000'
    });
    assert.equal(midRes.grossIncome, 360000);
    assert.equal(midRes.expenses, 100000);
    assert.equal(midRes.incomeAfterExpenses, 260000);
    assert.equal(midRes.totalDeductions, 69000);
    assert.equal(midRes.netTaxableIncome, 191000);
    assert.equal(midRes.totalTax, 2050);
    assert.equal(midRes.marginalRate, 5);
    assert.equal(midRes.isRefund, true);
    assert.equal(midRes.refundAmount, 950);
    assert.equal(midRes.savingsPer10k, 500); // 10k * 5%

    // 3. Higher-income earner with family, insurance, PVD, SSF, Thai ESG, and donations
    // Gross: 100k/mo (1.2M) + 200k bonus = 1,400,000
    // Expenses: 100k (cap) -> incomeAfterExpenses = 1,300,000
    // Personal deductions: self 60k + spouse 60k + 1 child pre-2018 (30k) + 1 child 2018+ (60k) + 1 parent (30k) = 240,000
    // Savings: SS 9k + life 100k + health 15k (combo capped at 100k) + PVD 100k + SSF 100k (retirement combo 200k <= 500k) + Thai ESG 50k = 459,000
    // Net before donation: 1,300,000 - 240,000 - 459,000 = 601,000
    // Education donation 10k (x2 = 20k <= 10% limit of 60,100) -> 20,000
    // Net taxable: 601,000 - 20,000 = 581,000
    const highRes = ctx.calculatePersonalTax({
        salaryMonthly: '100000',
        bonusYearly: '200000',
        hasSpouse: 'yes',
        childCount: 1,
        child2018Count: 1,
        parentCount: 1,
        socialSecurity: '9000',
        lifeInsurance: '100000',
        healthInsurance: '15000',
        pvdGpf: '100000',
        ssf: '100000',
        thaiEsg: '50000',
        donationEducation: '10000',
        withholdingTax: '50000'
    });
    assert.equal(highRes.grossIncome, 1400000);
    assert.equal(highRes.expenses, 100000);
    assert.equal(highRes.personalTotal, 240000);
    assert.equal(highRes.savingsTotal, 359000); // 9k SS + 100k Life/Health + 200k PVD/SSF + 50k Thai ESG
    assert.equal(highRes.netTaxableIncome, 681000);
    assert.equal(highRes.marginalRate, 15);
    // Tax breakdown:
    // 0-150k @ 0% = 0
    // 150k-300k @ 5% = 7,500
    // 300k-500k @ 10% = 20,000
    // 500k-681k (181k) @ 15% = 27,150
    // Total = 54,650
    assert.equal(highRes.totalTax, 54650);
    assert.equal(highRes.isRefund, false);
    assert.equal(highRes.payableAmount, 4650); // 54,650 - 50,000
    assert.equal(highRes.savingsPer10k, 1500); // 10k * 15%

    // 4. Drawer summary check
    const summary = ctx.getToolSummaryText('tax_personal', { tax_personal: { salaryMonthly: '30,000', bonusYearly: '0', socialSecurity: '9000', withholdingTax: '3000' } });
    assert.match(summary, /สรุปภาษีเงินได้บุคคลธรรมดา/);
    assert.match(summary, /360,000\.00 บาท/);
    assert.match(summary, /191,000\.00 บาท/);
    assert.match(summary, /ได้เงินคืนภาษี/);
});

test('property transfer fee and land department taxes engine: transfer fee, SBT vs stamp duty, section 50(5) withholding, split allocation', () => {
    const ctx = context();

    // 1. Standard calculation: Appraised 3M, Sale 3.2M, Mortgage 2.5M, 3 years holding (Specific Business Tax 3.3%)
    const prop = {
        appraisedValue: '3,000,000',
        salePrice: '3,200,000',
        mortgageAmount: '2,500,000',
        holdingYears: '3',
        exemptSBT: 'no',
        isGovMeasure: 'standard',
        splitMode: 'custom'
    };
    const res = ctx.calculatePropertyTransfer(prop);

    // Transfer fee: 2% of 3M = 60,000
    assert.equal(res.transferFee, 60000);
    // Mortgage fee: 1% of 2.5M = 25,000
    assert.equal(res.mortgageFee, 25000);
    // SBT: 3.3% of max(3M, 3.2M) = 3.3% of 3.2M = 105,600
    assert.equal(res.isSBT, true);
    assert.equal(res.sbtTax, 105600);
    assert.equal(res.stampDuty, 0);

    // Withholding tax Section 50(5):
    // 3 years holding -> 77% expense deduction -> net 23% = 690,000
    // Yearly average income = 690,000 / 3 = 230,000
    // Tax per year: 100k @ 5% (5,000) + 130k @ 10% (13,000) = 18,000
    // Total withholding tax = 18,000 * 3 = 54,000
    assert.equal(res.withholdingExpensePercent, 77);
    assert.equal(res.withholdingTax, 54000);

    // Total Land Office Cost: 60,000 + 25,000 + 105,600 + 54,000 = 244,600
    assert.equal(res.totalLandCost, 244600);

    // Custom Split:
    // Buyer: transfer * 0.5 (30k) + mortgage (25k) = 55,000
    // Seller: transfer * 0.5 (30k) + SBT (105.6k) + withholding (54k) = 189,600
    assert.equal(res.buyerCost, 55000);
    assert.equal(res.sellerCost, 189600);
    assert.equal(res.buyerCost + res.sellerCost, res.totalLandCost);

    // 2. Exempt SBT (holding 5 years) -> Stamp duty 0.5%
    const prop5yrs = { ...prop, holdingYears: '5', exemptSBT: 'yes' };
    const res5yrs = ctx.calculatePropertyTransfer(prop5yrs);
    assert.equal(res5yrs.isSBT, false);
    assert.equal(res5yrs.sbtTax, 0);
    assert.equal(res5yrs.stampDuty, 16000); // 0.5% of 3.2M

    // 3. Government Reduction Measure (0.01% transfer & 0.01% mortgage)
    const propGov = { ...prop, isGovMeasure: 'reduced' };
    const resGov = ctx.calculatePropertyTransfer(propGov);
    assert.equal(resGov.transferFee, 300); // 3M * 0.01%
    assert.equal(resGov.mortgageFee, 250); // 2.5M * 0.01%

    // 4. Split modes: half, seller, buyer
    const resHalf = ctx.calculatePropertyTransfer({ ...prop, splitMode: 'half' });
    assert.equal(resHalf.buyerCost, ((res.transferFee + res.sbtTax + res.withholdingTax) * 0.5) + res.mortgageFee);

    const resSeller = ctx.calculatePropertyTransfer({ ...prop, splitMode: 'seller' });
    assert.equal(resSeller.buyerCost, res.mortgageFee);
    assert.equal(resSeller.sellerCost, res.transferFee + res.sbtTax + res.withholdingTax);

    const resBuyer = ctx.calculatePropertyTransfer({ ...prop, splitMode: 'buyer' });
    assert.equal(resBuyer.buyerCost, res.totalLandCost);
    assert.equal(resBuyer.sellerCost, 0);

    // 5. Drawer summary check
    const summaryProp = ctx.getToolSummaryText('property_transfer', { property_transfer: prop });
    assert.match(summaryProp, /สรุปค่าธรรมเนียมโอนที่ดิน/);
    assert.match(summaryProp, /3,000,000\.00 บาท/);
    assert.match(summaryProp, /244,600\.00 บาท/);
});

test('bundle: src/bundle.js is up to date with modular source files and getSafeDateStr works safely', () => {
    const bundlePath = path.join(__dirname, '../src/bundle.js');
    assert.ok(fs.existsSync(bundlePath), 'src/bundle.js must exist');
    const bundleContent = fs.readFileSync(bundlePath, 'utf8');

    for (const relPath of moduleFiles) {
        assert.ok(bundleContent.includes('// >>> ' + relPath + ' >>>'), `bundle.js must contain ${relPath}`);
    }

    const ctx = context();
    const todayStr = ctx.getSafeDateStr(0);
    assert.match(todayStr, /^\d{4}-\d{2}-\d{2}$/);
    const futureStr = ctx.getSafeDateStr(30);
    assert.match(futureStr, /^\d{4}-\d{2}-\d{2}$/);
    assert.notEqual(todayStr, futureStr);
});

test('thai gold price & buyback engine: 96.5% purity, bar vs ornament, weight units, OCPB buyback rules and savings simulation', () => {
    const ctx = context();

    // 1. Buy gold ornament: 1 Baht with 800 THB craft fee
    const buyOrnament = ctx.calculateGoldThai({
        mode: 'buy',
        goldType: 'ornament',
        weightUnit: 'baht',
        weightValue: '1',
        craftFee: '800',
        priceOrnamentSell: '44500',
        priceOrnamentBuy: '43115'
    });
    assert.equal(buyOrnament.bahtWeight, 1);
    assert.equal(buyOrnament.salungWeight, 4);
    assert.equal(buyOrnament.totalGrams, 15.16);
    assert.equal(buyOrnament.rawGoldValue, 44500);
    assert.equal(buyOrnament.craftFee, 800);
    assert.equal(buyOrnament.totalBuyPrice, 45300);

    // 2. Buy gold bar: 1 Baht without craft fee
    const buyBar = ctx.calculateGoldThai({
        mode: 'buy',
        goldType: 'bar',
        weightUnit: 'baht',
        weightValue: '1',
        craftFee: '0',
        priceBarSell: '44000',
        priceBarBuy: '43900'
    });
    assert.equal(buyBar.bahtWeight, 1);
    assert.equal(buyBar.salungWeight, 4);
    assert.equal(buyBar.totalGrams, 15.244);
    assert.equal(buyBar.totalBuyPrice, 44000);

    // 3. Weight conversion: 2 Salung ornament
    const salung2 = ctx.calculateGoldThai({
        mode: 'buy',
        goldType: 'ornament',
        weightUnit: 'salung',
        weightValue: '2',
        craftFee: '500',
        priceOrnamentSell: '44000'
    });
    assert.equal(salung2.bahtWeight, 0.5);
    assert.equal(salung2.salungWeight, 2);
    assert.equal(salung2.totalGrams, 7.58); // 0.5 * 15.16
    assert.equal(salung2.rawGoldValue, 22000);
    assert.equal(salung2.totalBuyPrice, 22500);

    // 4. Gram weight input: 15.244g gold bar
    const gramInput = ctx.calculateGoldThai({
        mode: 'buy',
        goldType: 'bar',
        weightUnit: 'gram',
        weightValue: '15.244'
    });
    assert.equal(gramInput.bahtWeight, 1);

    // 5. Sell back OCPB rules
    const sellBack = ctx.calculateGoldThai({
        mode: 'sell',
        goldType: 'ornament',
        weightUnit: 'baht',
        weightValue: '2',
        priceOrnamentBuy: '43115'
    });
    assert.equal(sellBack.sellBackValue, 86230); // 2 * 43,115

    // 6. Savings and Investment Simulator
    const savingsProfit = ctx.calculateGoldThai({
        mode: 'savings',
        goldType: 'bar',
        weightUnit: 'baht',
        weightValue: '5',
        savingsCostPerBaht: '40000',
        priceBarBuy: '44000'
    });
    assert.equal(savingsProfit.totalInvested, 200000); // 5 * 40k
    assert.equal(savingsProfit.currentMarketValue, 220000); // 5 * 44k
    assert.equal(savingsProfit.profitLoss, 20000);
    assert.equal(savingsProfit.profitLossPercent, 10);
    assert.equal(savingsProfit.isProfit, true);

    // 7. Drawer summary text check
    const summaryGold = ctx.getToolSummaryText('gold_thai', {
        gold_thai: { mode: 'buy', goldType: 'ornament', weightUnit: 'baht', weightValue: '1', craftFee: '800', priceOrnamentSell: '44500' }
    });
    assert.match(summaryGold, /สรุปราคาซื้อทองคำหน้าร้าน/);
    assert.match(summaryGold, /45,300\.00 บาท/);
});

test('progressive electricity tariff & appliance energy engine: MEA/PEA type 1.1 vs 1.2, Ft rate, VAT 7%, tiered blocks and appliance kWh calculation', () => {
    const ctx = context();

    // 1. Type 1.1 (Small residence <= 150 units): 100 units
    // Tier 1: 15 @ 2.3488 = 35.232
    // Tier 2: 10 @ 2.9882 = 29.882
    // Tier 3: 10 @ 3.2405 = 32.405
    // Tier 4: 65 @ 3.6237 = 235.5405
    // Base energy: 35.232 + 29.882 + 32.405 + 235.5405 = 333.0595
    // Service: 8.19
    // Ft @ 0.3972: 100 * 0.3972 = 39.72
    // Pre-VAT: 333.0595 + 8.19 + 39.72 = 380.9695
    // VAT 7%: 26.667865
    // Total: 407.637365 -> ~407.64
    const bill1_1 = ctx.calculateElectricityBill({
        tariffType: 'type1_1',
        units: '100',
        ftRate: '0.3972'
    });
    assert.equal(bill1_1.tariffType, 'type1_1');
    assert.equal(bill1_1.units, 100);
    assert.equal(bill1_1.serviceFee, 8.19);
    assert.ok(Math.abs(bill1_1.baseEnergyCharge - 333.0595) < 0.01);
    assert.equal(bill1_1.ftCharge, 39.72);
    assert.ok(Math.abs(bill1_1.totalBill - 407.64) < 0.05);

    // 2. Type 1.2 (Regular residence > 150 units): 350 units
    // Tier 1: 150 @ 3.2484 = 487.26
    // Tier 2: 200 @ 4.2218 = 844.36
    // Base: 487.26 + 844.36 = 1331.62
    // Service: 24.62
    // Ft: 350 * 0.3972 = 139.02
    // Pre-VAT: 1331.62 + 24.62 + 139.02 = 1495.26
    // VAT: 1495.26 * 0.07 = 104.6682
    // Total: 1599.9282 -> ~1599.93
    const bill1_2 = ctx.calculateElectricityBill({
        tariffType: 'type1_2',
        units: '350',
        ftRate: '0.3972'
    });
    assert.equal(bill1_2.tariffType, 'type1_2');
    assert.equal(bill1_2.units, 350);
    assert.equal(bill1_2.serviceFee, 24.62);
    assert.ok(Math.abs(bill1_2.baseEnergyCharge - 1331.62) < 0.01);
    assert.ok(Math.abs(bill1_2.ftCharge - 139.02) < 0.01);
    assert.ok(Math.abs(bill1_2.totalBill - 1599.93) < 0.05);
    assert.ok(bill1_2.avgRatePerUnit > 4.5 && bill1_2.avgRatePerUnit < 4.6);

    // 3. Appliance Energy Calculator (kWh & Monthly Cost)
    const appliances = [
        { id: 'air', name: 'แอร์ 12,000 BTU', watts: 1000, qty: 1, hoursPerDay: 8 },
        { id: 'fan', name: 'พัดลม', watts: 50, qty: 2, hoursPerDay: 10 }
    ];
    // Air: (1000 * 1 * 8) / 1000 = 8 kWh/day
    // Fan: (50 * 2 * 10) / 1000 = 1 kWh/day
    // Total daily: 9 kWh/day
    // Total monthly: 9 * 30 = 270 kWh/month
    // Cost @ 4.5 THB: 270 * 4.5 = 1,215 THB
    const appRes = ctx.calculateApplianceEnergy(appliances, 4.5);
    assert.equal(appRes.totalDailyKwh, 9);
    assert.equal(appRes.totalMonthlyKwh, 270);
    assert.equal(appRes.totalMonthlyCost, 1215);
    assert.equal(appRes.items.length, 2);
    assert.equal(appRes.items[0].dailyKwh, 8);
    assert.equal(appRes.items[1].dailyKwh, 1);

    // 4. Drawer summary text check
    const summaryElec = ctx.getToolSummaryText('electricity_bill', {
        electricity_bill: { mode: 'bill', tariffType: 'type1_2', units: '350', ftRate: '0.3972' }
    });
    assert.match(summaryElec, /สรุปค่าไฟฟ้าบ้าน/);
    assert.match(summaryElec, /350 หน่วย/);
    assert.match(summaryElec, /1,599\.93 บาท/);
});

test('thai gold live API parser and loader validates payload structure, updates rates, and handles network failures gracefully', async () => {
    const ctx = context();

    // 1. Valid API payload parsing
    const samplePayload = {
        status: 'success',
        response: {
            update_date: '15/10/2569',
            update_time: 'เวลา 16:22 น. (ครั้งที่ 18)',
            price: {
                gold: {
                    buy: '64,430.00',
                    sell: '66,750.00'
                },
                gold_bar: {
                    buy: '65,750.00',
                    sell: '65,950.00'
                }
            }
        }
    };
    const parsed = ctx.parseThaiGoldApiResponse(samplePayload);
    assert.equal(parsed.priceBarBuy, 65750);
    assert.equal(parsed.priceBarSell, 65950);
    assert.equal(parsed.priceOrnamentBuy, 64430);
    assert.equal(parsed.priceOrnamentSell, 66750);
    assert.equal(parsed.updateDate, '15/10/2569');
    assert.equal(parsed.updateTime, 'เวลา 16:22 น. (ครั้งที่ 18)');

    // 2. Invalid or missing fields rejection
    assert.throws(() => ctx.parseThaiGoldApiResponse(null), /Invalid Thai Gold API response/);
    assert.throws(() => ctx.parseThaiGoldApiResponse({ status: 'error' }), /Invalid Thai Gold API response/);
    assert.throws(() => ctx.parseThaiGoldApiResponse({
        status: 'success',
        response: { price: { gold: { buy: '0', sell: '0' }, gold_bar: { buy: '0', sell: '0' } } }
    }), /Missing or invalid gold rates/);

    // 3. Gold loader commits live rates on success
    const gold_thai = {
        mode: 'buy',
        goldType: 'ornament',
        weightUnit: 'baht',
        weightValue: '1',
        craftFee: '800',
        priceBarBuy: '43900',
        priceBarSell: '44000',
        priceOrnamentBuy: '43115',
        priceOrnamentSell: '44500'
    };
    const mockCtx = context({
        appState: { activeToolId: 'gold_thai', gold_thai },
        persistAppState() {},
        fetch: async () => ({
            ok: true,
            status: 200,
            json: async () => samplePayload
        })
    });
    await mockCtx.loadThaiGoldRates(true);
    assert.equal(mockCtx.appState.gold_thai.priceBarSell, '65950');
    assert.equal(mockCtx.appState.gold_thai.priceOrnamentSell, '66750');
    assert.equal(mockCtx.appState.gold_thai.rateSource, 'สมาคมค้าทองคำ (สดจาก API)');
    assert.ok(mockCtx.appState.gold_thai.lastUpdated);

    // 4. Gold loader falls back safely on network error without corrupting existing rates
    mockCtx.fetch = async () => { throw new Error('Offline / Network Error'); };
    await mockCtx.loadThaiGoldRates(true);
    assert.equal(mockCtx.appState.gold_thai.priceBarSell, '65950'); // Preserves previous valid rates
    assert.equal(mockCtx.appState.gold_thai.rateSource, 'ค่าเดิมในเครื่อง (เชื่อมต่อ API ไม่สำเร็จ)');
});

test('auto hire-purchase loan engine (car_loan): new vs used car, VAT 7%, flat rate, EIR approximation and OCPB 2023 early payoff tiers', () => {
    const ctx = context();

    // 1. New Car Loan: 850,000 THB, 20% down, 2.59% flat rate, 60 months (5 yrs)
    const newCar = ctx.calculateCarLoan({
        vehicleType: 'car',
        condition: 'new',
        price: 850000,
        downPaymentType: 'percent',
        downPaymentValue: 20,
        interestRate: 2.59,
        periodMonths: 60,
        payoffMonth: 30
    });
    assert.equal(newCar.downPaymentAmount, 170000);
    assert.equal(newCar.principal, 680000);
    assert.equal(newCar.years, 5);
    assert.equal(Math.round(newCar.totalInterest), 88060); // 680,000 * 0.0259 * 5
    assert.equal(Math.round(newCar.monthlyPaymentPreVat), 12801); // 768,060 / 60
    assert.equal(newCar.isVatAdded, false);
    assert.equal(newCar.vatMonthly, 0);
    assert.equal(Math.round(newCar.monthlyPayment), 12801);
    assert.equal(Math.round(newCar.totalRepayment), 768060);
    assert.equal(Math.round(newCar.totalCostOfCar), 938060); // 170k + 768,060
    assert.ok(newCar.effectiveRateApprox > 5.0 && newCar.effectiveRateApprox < 5.2, 'EIR approx should be around 5.1%');

    // Early Payoff at Month 30 (between 20 and 40 months -> 70% discount)
    assert.equal(newCar.oneThirdMonths, 20);
    assert.equal(newCar.twoThirdMonths, 40);
    assert.equal(newCar.discountTierPercent, 70);
    assert.ok(newCar.unearnedInterest > 0);
    assert.ok(newCar.interestDiscount > 0);
    assert.ok(newCar.totalPayoffAmount < newCar.remainingMonths * newCar.monthlyPayment);

    // Early Payoff at Month 10 (< 20 months -> 100% discount tier)
    const newCarEarly = ctx.calculateCarLoan({
        vehicleType: 'car',
        condition: 'new',
        price: 850000,
        downPaymentType: 'percent',
        downPaymentValue: 20,
        interestRate: 2.59,
        periodMonths: 60,
        payoffMonth: 10
    });
    assert.equal(newCarEarly.discountTierPercent, 100);
    assert.equal(newCarEarly.interestDiscount, newCarEarly.unearnedInterest);

    // Early Payoff at Month 45 (> 40 months -> 60% discount tier)
    const newCarLate = ctx.calculateCarLoan({
        vehicleType: 'car',
        condition: 'new',
        price: 850000,
        downPaymentType: 'percent',
        downPaymentValue: 20,
        interestRate: 2.59,
        periodMonths: 60,
        payoffMonth: 45
    });
    assert.equal(newCarLate.discountTierPercent, 60);

    // 2. Used Car Loan: 400,000 THB, down 40,000 THB (fixed amount), 4.5% flat rate, 48 months (4 yrs)
    const usedCar = ctx.calculateCarLoan({
        vehicleType: 'car',
        condition: 'used',
        price: 400000,
        downPaymentType: 'amount',
        downPaymentValue: 40000,
        interestRate: 4.5,
        periodMonths: 48,
        payoffMonth: 24
    });
    assert.equal(usedCar.downPaymentAmount, 40000);
    assert.equal(usedCar.downPaymentPercent, 10);
    assert.equal(usedCar.principal, 360000);
    assert.equal(usedCar.totalInterest, 64800); // 360,000 * 0.045 * 4
    assert.equal(usedCar.monthlyPaymentPreVat, 8850); // (360,000 + 64,800) / 48
    assert.equal(usedCar.isVatAdded, true);
    assert.ok(Math.abs(usedCar.vatMonthly - 619.5) < 1e-6);
    assert.ok(Math.abs(usedCar.monthlyPayment - 9469.5) < 1e-6);
    assert.ok(Math.abs(usedCar.totalRepayment - 454536) < 1e-4);

    // 3. Summary text check
    const summaryCar = ctx.getToolSummaryText('car_loan', {
        car_loan: {
            vehicleType: 'car',
            condition: 'new',
            price: '850000',
            downPaymentType: 'percent',
            downPaymentValue: '20',
            interestRate: '2.59',
            periodMonths: '60',
            payoffMonth: '30'
        }
    });
    assert.match(summaryCar, /สรุปสินเชื่อเช่าซื้อยานพาหนะ/);
    assert.match(summaryCar, /850,000\.00 บาท/);
    assert.match(summaryCar, /60 งวด/);
    assert.match(summaryCar, /12,801\.00 บาท\/งวด/);
});

test('social security engine (social_security): Section 33, 39, 40, wage ceilings, pension formulas and lump sum returns', () => {
    const ctx = context();

    // 1. Section 33 (ม.33) with wage above ceiling (35,000 THB -> capped at 15,000 THB)
    // 240 months (20 years) = 20% + 5 * 1.5% = 27.5% pension
    const s33_20yrs = ctx.calculateSocialSecurity({
        section: 'm33',
        wageMonthly: 35000,
        contributionMonths: 240
    });
    assert.equal(s33_20yrs.cappedWage, 15000);
    assert.equal(s33_20yrs.monthlyContribution, 750);
    assert.equal(s33_20yrs.employerContribution, 750);
    assert.equal(s33_20yrs.oldAgeSavingsMonthly, 450); // 3%
    assert.equal(s33_20yrs.isPension, true);
    assert.equal(s33_20yrs.pensionRatePercent, 27.5);
    assert.equal(s33_20yrs.monthlyPension, 4125); // 15,000 * 27.5%
    assert.equal(s33_20yrs.yearlyPension, 49500); // 4,125 * 12
    assert.equal(s33_20yrs.totalWorkerContributed, 180000); // 750 * 240

    // Exactly 180 months (15 years) = 20% base
    const s33_15yrs = ctx.calculateSocialSecurity({
        section: 'm33',
        wageMonthly: 20000,
        contributionMonths: 180
    });
    assert.equal(s33_15yrs.isPension, true);
    assert.equal(s33_15yrs.pensionRatePercent, 20);
    assert.equal(s33_15yrs.monthlyPension, 3000); // 15,000 * 20%

    // 300 months (25 years) = 20% + 10 * 1.5% = 35%
    const s33_25yrs = ctx.calculateSocialSecurity({
        section: 'm33',
        wageMonthly: 50000,
        contributionMonths: 300
    });
    assert.equal(s33_25yrs.pensionRatePercent, 35);
    assert.equal(s33_25yrs.monthlyPension, 5250); // 15,000 * 35%

    // Section 33 with minimum wage floor (1,200 THB -> floor at 1,650 THB)
    const s33_floor = ctx.calculateSocialSecurity({
        section: 'm33',
        wageMonthly: 1200,
        contributionMonths: 180
    });
    assert.equal(s33_floor.cappedWage, 1650);
    assert.equal(s33_floor.monthlyContribution, 82.5);

    // Section 33 Lump Sum: < 12 months (e.g. 8 months -> only employee 3%)
    const s33_lump_short = ctx.calculateSocialSecurity({
        section: 'm33',
        wageMonthly: 15000,
        contributionMonths: 8
    });
    assert.equal(s33_lump_short.isPension, false);
    assert.equal(s33_lump_short.lumpSumTotal, 450 * 8); // 3,600 THB

    // Section 33 Lump Sum: 120 months (10 years) -> employee (3%) + employer (3%) + interest returns
    const s33_lump_long = ctx.calculateSocialSecurity({
        section: 'm33',
        wageMonthly: 15000,
        contributionMonths: 120
    });
    assert.equal(s33_lump_long.isPension, false);
    assert.ok(s33_lump_long.lumpSumTotal > (450 * 2 * 120)); // Base (108,000) + interest

    // 2. Section 39 (ม.39) fixed statutory wage 4,800 THB, 432 THB monthly contribution
    const s39 = ctx.calculateSocialSecurity({
        section: 'm39',
        contributionMonths: 240
    });
    assert.equal(s39.cappedWage, 4800);
    assert.equal(s39.monthlyContribution, 432);
    assert.equal(s39.oldAgeSavingsMonthly, 288); // 6% of 4,800
    assert.equal(s39.isPension, true);
    assert.equal(s39.pensionRatePercent, 27.5);
    assert.equal(s39.monthlyPension, 1320); // 4,800 * 27.5%

    // 3. Section 40 (ม.40) Plan 2 (100 THB/mo, 50 THB savings) + 500 THB voluntary savings
    const s40 = ctx.calculateSocialSecurity({
        section: 'm40',
        m40Plan: 'plan2',
        m40ExtraSavings: 500,
        contributionMonths: 120
    });
    assert.equal(s40.monthlyContribution, 600);
    assert.equal(s40.oldAgeSavingsMonthly, 550); // 50 + 500
    assert.equal(s40.isPension, false);
    assert.ok(s40.lumpSumTotal > (550 * 120)); // Total savings + returns

    // 4. Summary text check
    const summarySS = ctx.getToolSummaryText('social_security', {
        social_security: {
            section: 'm33',
            wageMonthly: '35000',
            contributionMonths: '240'
        }
    });
    assert.match(summarySS, /สรุปสิทธิประโยชน์ประกันสังคม/);
    assert.match(summarySS, /มาตรา 33/);
    assert.match(summarySS, /240 งวด/);
    assert.match(summarySS, /เงินบำนาญชราภาพตลอดชีพ: 4,125\.00 บาท\/เดือน/);
});

test('pure engine calculateLaborSeverance: Section 118 tiers, notice pay, leave compensation, and tax exemptions', () => {
    const ctx = context();

    // 1. Tier 0: < 120 days worked (e.g. 90 days) -> 0 days severance
    const t0 = ctx.calculateLaborSeverance({
        salaryMonthly: 30000,
        mode: 'duration',
        serviceYears: 0,
        serviceMonths: 2,
        serviceDays: 25,
        noticeGiven: 'yes'
    });
    assert.equal(t0.severanceDays, 0);
    assert.equal(t0.severancePay, 0);

    // 2. Tier 1: 120 days to < 1 year (e.g. 6 months) -> 30 days severance
    const t1 = ctx.calculateLaborSeverance({
        salaryMonthly: 30000,
        mode: 'duration',
        serviceYears: 0,
        serviceMonths: 6,
        noticeGiven: 'yes'
    });
    assert.equal(t1.dailyWage, 1000);
    assert.equal(t1.severanceDays, 30);
    assert.equal(t1.severancePay, 30000);

    // 3. Tier 2: 1 year to < 3 years (e.g. 2 years) -> 90 days severance
    const t2 = ctx.calculateLaborSeverance({
        salaryMonthly: 30000,
        mode: 'duration',
        serviceYears: 2,
        serviceMonths: 0,
        noticeGiven: 'yes'
    });
    assert.equal(t2.severanceDays, 90);
    assert.equal(t2.severancePay, 90000);

    // 4. Tier 3: 3 years to < 6 years (e.g. 4 years) -> 180 days severance
    const t3 = ctx.calculateLaborSeverance({
        salaryMonthly: 30000,
        mode: 'duration',
        serviceYears: 4,
        serviceMonths: 3,
        noticeGiven: 'yes'
    });
    assert.equal(t3.severanceDays, 180);
    assert.equal(t3.severancePay, 180000);

    // 5. Tier 4: 6 years to < 10 years (e.g. 7 years) -> 240 days severance
    const t4 = ctx.calculateLaborSeverance({
        salaryMonthly: 30000,
        mode: 'duration',
        serviceYears: 7,
        serviceMonths: 0,
        noticeGiven: 'yes'
    });
    assert.equal(t4.severanceDays, 240);
    assert.equal(t4.severancePay, 240000);

    // 6. Tier 5: 10 years to < 20 years (e.g. 15 years) -> 300 days severance
    const t5 = ctx.calculateLaborSeverance({
        salaryMonthly: 30000,
        mode: 'duration',
        serviceYears: 15,
        serviceMonths: 0,
        noticeGiven: 'yes'
    });
    assert.equal(t5.severanceDays, 300);
    assert.equal(t5.severancePay, 300000);

    // 7. Tier 6: 20 years or more (e.g. 22 years) -> 400 days severance
    const t6 = ctx.calculateLaborSeverance({
        salaryMonthly: 30000,
        mode: 'duration',
        serviceYears: 22,
        serviceMonths: 0,
        noticeGiven: 'yes'
    });
    assert.equal(t6.severanceDays, 400);
    assert.equal(t6.severancePay, 400000);

    // 8. Notice Pay (Section 17) & Unused Leave Pay (Section 67)
    const withExtras = ctx.calculateLaborSeverance({
        salaryMonthly: 45000,
        mode: 'duration',
        serviceYears: 5,
        serviceMonths: 0,
        noticeGiven: 'no',
        noticeMonths: 1,
        unusedLeaveDays: 6
    });
    assert.equal(withExtras.dailyWage, 1500); // 45,000 / 30
    assert.equal(withExtras.severanceDays, 180);
    assert.equal(withExtras.severancePay, 270000); // 1,500 * 180
    assert.equal(withExtras.noticePay, 45000); // 1 month
    assert.equal(withExtras.leavePay, 9000); // 6 * 1,500
    assert.equal(withExtras.totalSeverancePackage, 270000 + 45000 + 9000); // 324,000

    // 9. Tax Exemption under Ministerial Regulation 126 (capped at 300 days and 300,000 THB)
    // Case A: Severance 270,000 <= 300,000 -> full 270,000 exempt
    assert.equal(withExtras.taxExemptAmount, 270000);
    assert.equal(withExtras.taxableSeverance, 45000 + 9000); // Notice and leave are taxable

    // Case B: High earner severance exceeds 300,000 THB cap
    const highEarner = ctx.calculateLaborSeverance({
        salaryMonthly: 90000,
        mode: 'duration',
        serviceYears: 10, // 300 days = 900,000 THB
        noticeGiven: 'yes',
        unusedLeaveDays: 0
    });
    assert.equal(highEarner.dailyWage, 3000);
    assert.equal(highEarner.severanceDays, 300);
    assert.equal(highEarner.severancePay, 900000);
    assert.equal(highEarner.taxExemptAmount, 300000); // Capped at 300,000 THB
    assert.equal(highEarner.taxableSeverance, 600000); // 900,000 - 300,000

    // 10. Date mode: start and end date calculation
    const dateMode = ctx.calculateLaborSeverance({
        salaryMonthly: 30000,
        mode: 'dates',
        startDate: '2020-01-01',
        endDate: '2024-01-01'
    });
    assert.ok(dateMode.serviceYears >= 4);
    assert.equal(dateMode.severanceDays, 180);

    // 11. Summary Text
    const summaryLabor = ctx.getToolSummaryText('labor_severance', {
        labor_severance: {
            salaryMonthly: '35000',
            mode: 'duration',
            serviceYears: '3',
            serviceMonths: '6'
        }
    });
    assert.match(summaryLabor, /สรุปเงินชดเชยเลิกจ้างตามกฎหมายแรงงาน/);
    assert.match(summaryLabor, /ชดเชย 180 วัน/);
    assert.match(summaryLabor, /210,000\.00 บาท/);
});

test('pure engine calculateLegalInterest: Section 224 (5%), Section 7 (3%), day count, and daily interest', () => {
    const ctx = context();

    // 1. Statutory default interest under CCC Section 224: 5.0% per annum
    const def5 = ctx.calculateLegalInterest({
        principal: 100000,
        ratePreset: 'default_5',
        calcMode: 'days',
        overdueDays: 73 // 73 days = 73 / 365 = exactly 0.2 year
    });
    assert.equal(def5.principal, 100000);
    assert.equal(def5.interestRate, 5.0);
    assert.equal(def5.overdueDays, 73);
    // 100,000 * 5% * 0.2 = 1,000 THB
    assert.equal(Math.round(def5.totalInterest), 1000);
    assert.equal(Math.round(def5.totalPayable), 101000);
    assert.ok(Math.abs(def5.dailyInterest - (100000 * 0.05 / 365)) < 0.01);

    // 2. Statutory interest under CCC Section 7: 3.0% per annum
    const stat3 = ctx.calculateLegalInterest({
        principal: 365000,
        ratePreset: 'statutory_3',
        calcMode: 'days',
        overdueDays: 100
    });
    assert.equal(stat3.interestRate, 3.0);
    // 365,000 * 3% * (100 / 365) = 10,950 * (100/365) = 3,000 THB
    assert.equal(Math.round(stat3.totalInterest), 3000);
    assert.equal(Math.round(stat3.totalPayable), 368000);

    // 3. Custom rate
    const custom = ctx.calculateLegalInterest({
        principal: 50000,
        ratePreset: 'custom',
        customRate: 7.5,
        calcMode: 'days',
        overdueDays: 365
    });
    assert.equal(custom.interestRate, 7.5);
    assert.equal(Math.round(custom.totalInterest), 3750);
    assert.equal(Math.round(custom.totalPayable), 53750);

    // 4. Date range mode
    const dateRange = ctx.calculateLegalInterest({
        principal: 100000,
        ratePreset: 'default_5',
        calcMode: 'dates',
        startDate: '2026-01-01',
        endDate: '2026-03-02' // 60 days
    });
    assert.equal(dateRange.overdueDays, 60);
    assert.ok(dateRange.totalInterest > 0);

    // 5. Summary Text
    const summaryLeg = ctx.getToolSummaryText('legal_interest', {
        legal_interest: {
            principal: '100000',
            ratePreset: 'default_5',
            calcMode: 'days',
            overdueDays: '60'
        }
    });
    assert.match(summaryLeg, /สรุปดอกเบี้ยผิดนัดชำระหนี้ \(ป\.พ\.พ\.\)/);
    assert.match(summaryLeg, /100,000\.00 บาท/);
    assert.match(summaryLeg, /5% ต่อปี/);
    assert.match(summaryLeg, /60 วัน/);
});

test('pure engine calculateOvertimePay: Section 61 (1.5x), Section 62 (1x/2x), Section 63 (3x), shift allowances and summary text', () => {
    const ctx = context();

    // 1. Monthly Employee: 24,000 THB / month (hourly rate = 24,000 / (30 * 8) = 100 THB/hr)
    const monthlyCalc = ctx.calculateOvertimePay({
        wageType: 'monthly',
        wageBase: 24000,
        workHoursPerDay: 8,
        otWeekdayHours: 10,
        holidayWorkHours: 8,
        holidayOtHours: 4,
        shiftAllowance: 500
    });
    assert.equal(monthlyCalc.hourlyRate, 100);
    // Section 61: 10 hrs * 100 * 1.5 = 1,500 THB
    assert.equal(monthlyCalc.otWeekdayPay, 1500);
    // Section 62: Monthly employee gets 1.0x extra = 8 hrs * 100 * 1.0 = 800 THB
    assert.equal(monthlyCalc.holidayWorkPay, 800);
    // Section 63: 4 hrs * 100 * 3.0 = 1,200 THB
    assert.equal(monthlyCalc.holidayOtPay, 1200);
    assert.equal(monthlyCalc.shiftAllowance, 500);
    // Total OT Pay (including allowance) = 1,500 + 800 + 1,200 + 500 = 4,000 THB
    assert.equal(monthlyCalc.totalOtPay, 4000);
    // Total Earnings = 24,000 + 4,000 = 28,000 THB
    assert.equal(monthlyCalc.totalEarnings, 28000);

    // 2. Daily Employee: 400 THB / day (hourly rate = 400 / 8 = 50 THB/hr)
    const dailyCalc = ctx.calculateOvertimePay({
        wageType: 'daily',
        wageBase: 400,
        workHoursPerDay: 8,
        otWeekdayHours: 10,
        holidayWorkHours: 8,
        holidayOtHours: 4,
        shiftAllowance: 200
    });
    assert.equal(dailyCalc.hourlyRate, 50);
    // Section 61: 10 hrs * 50 * 1.5 = 750 THB
    assert.equal(dailyCalc.otWeekdayPay, 750);
    // Section 62: Daily employee gets 2.0x = 8 hrs * 50 * 2.0 = 800 THB
    assert.equal(dailyCalc.holidayWorkPay, 800);
    // Section 63: 4 hrs * 50 * 3.0 = 600 THB
    assert.equal(dailyCalc.holidayOtPay, 600);
    assert.equal(dailyCalc.shiftAllowance, 200);
    // Total OT Pay (including allowance) = 750 + 800 + 600 + 200 = 2,350 THB
    assert.equal(dailyCalc.totalOtPay, 2350);
    // Estimated monthly earnings = (400 * 26) + 2,350 = 10,400 + 2,350 = 12,750 THB
    assert.equal(dailyCalc.totalEarnings, 12750);

    // 3. Hourly Employee: 100 THB / hr
    const hourlyCalc = ctx.calculateOvertimePay({
        wageType: 'hourly',
        wageBase: 100,
        workHoursPerDay: 8,
        otWeekdayHours: 5,
        holidayWorkHours: 8,
        holidayOtHours: 2,
        shiftAllowance: 0
    });
    assert.equal(hourlyCalc.hourlyRate, 100);
    // Section 61: 5 * 100 * 1.5 = 750 THB
    assert.equal(hourlyCalc.otWeekdayPay, 750);
    // Section 62: Hourly employee gets 2.0x = 8 * 100 * 2.0 = 1,600 THB
    assert.equal(hourlyCalc.holidayWorkPay, 1600);
    // Section 63: 2 * 100 * 3.0 = 600 THB
    assert.equal(hourlyCalc.holidayOtPay, 600);
    assert.equal(hourlyCalc.totalOtPay, 2950);

    // 4. Summary text verification
    const summaryOt = ctx.getToolSummaryText('ot_calc', {
        ot_calc: {
            wageType: 'monthly',
            wageBase: '28000',
            workHoursPerDay: '8',
            otWeekdayHours: '16',
            holidayWorkHours: '8',
            holidayOtHours: '4',
            shiftAllowance: '1200'
        }
    });
    assert.match(summaryOt, /สรุปค่าล่วงเวลา \(OT\) & ทำงานวันหยุด/);
    assert.match(summaryOt, /28,000\.00 บ\./);
    assert.match(summaryOt, /OT วันทำงานปกติ/);
    assert.match(summaryOt, /ทำงานในวันหยุด/);
    assert.match(summaryOt, /รวมค่าล่วงเวลา OT พิเศษ/);
});

test('pure engine calculateEcommerceProfit: platform fee breakdown, VAT 7%, breakeven price, margin and summary text', () => {
    const ctx = context();

    // 1. Shopee standard sale: sellingPrice 350, cost 150, pack 10, voucher 0, shipping 35/35, ads 30
    // commission 5%, service 4%, transaction 3% on (350+35=385), VAT 7%
    // commission = 350 * 5% = 17.50
    // service = 350 * 4% = 14.00
    // transaction = 385 * 3% = 11.55
    // preVat = 17.50 + 14.00 + 11.55 = 43.05
    // vat = 43.05 * 7% = 3.0135
    // totalPlatformFee = 43.05 + 3.0135 = 46.0635
    // totalCosts = 150 + 10 + 0 + 30 + 46.0635 = 236.0635
    // netProfit = 350 - 236.0635 = 113.9365 (round ~113.94)
    // netPayout = 385 - 46.0635 - 35 = 303.9365
    const shopeeCalc = ctx.calculateEcommerceProfit({
        platform: 'shopee',
        sellingPrice: 350,
        productCost: 150,
        packagingCost: 10,
        shopVoucher: 0,
        customerShipping: 35,
        sellerShipping: 35,
        adSpendPerOrder: 30,
        commissionRatePct: 5.0,
        serviceFeePct: 4.0,
        transactionRatePct: 3.0,
        isVatApplied: true
    });
    assert.equal(shopeeCalc.commissionFeePreVat, 17.5);
    assert.equal(shopeeCalc.serviceFeePreVat, 14.0);
    assert.ok(Math.abs(shopeeCalc.transactionFeePreVat - 11.55) < 0.01);
    assert.ok(Math.abs(shopeeCalc.totalPlatformFees - 46.06) < 0.02);
    assert.ok(Math.abs(shopeeCalc.netProfit - 113.94) < 0.02);
    assert.ok(shopeeCalc.isProfit);
    assert.ok(shopeeCalc.breakevenPrice > 190 && shopeeCalc.breakevenPrice < 230);

    // 2. Direct Sales (No platform fees, no VAT)
    const directCalc = ctx.calculateEcommerceProfit({
        platform: 'direct',
        sellingPrice: 300,
        productCost: 120,
        packagingCost: 10,
        shopVoucher: 0,
        customerShipping: 35,
        sellerShipping: 35,
        adSpendPerOrder: 20,
        commissionRatePct: 0,
        serviceFeePct: 0,
        transactionRatePct: 0,
        isVatApplied: false
    });
    assert.equal(directCalc.totalPlatformFees, 0);
    // netProfit = 300 - (120 + 10 + 20) = 150
    assert.equal(directCalc.netProfit, 150);
    assert.equal(directCalc.profitMarginPct, 50.0);
    assert.equal(directCalc.breakevenPrice, 150);

    // 3. Loss scenario: high costs, breakeven indicator
    const lossCalc = ctx.calculateEcommerceProfit({
        platform: 'shopee',
        sellingPrice: 100,
        productCost: 90,
        packagingCost: 10,
        adSpendPerOrder: 20
    });
    assert.equal(lossCalc.isProfit, false);
    assert.ok(lossCalc.netProfit < 0);

    // 4. Summary text check
    const summaryEcom = ctx.getToolSummaryText('ecommerce_profit', {
        ecommerce_profit: {
            platform: 'shopee',
            sellingPrice: '350',
            productCost: '150',
            packagingCost: '10',
            shopVoucher: '0',
            customerShipping: '35',
            sellerShipping: '35',
            adSpendPerOrder: '30'
        }
    });
    assert.match(summaryEcom, /สรุปกำไรขายของออนไลน์ \(Shopee\)/);
    assert.match(summaryEcom, /350\.00 บาท/);
    assert.match(summaryEcom, /ต้นทุนสินค้า/);
    assert.match(summaryEcom, /ค่าธรรมเนียมแพลตฟอร์ม/);
    assert.match(summaryEcom, /กำไรสุทธิต่อชิ้น/);
});

test('pure engine calculateHomeRefinance: Bank of Thailand 3-year horizon, closing costs, breakeven month, and recommendations', () => {
    const ctx = context();

    // 1. Standard Refinance Scenario:
    // Loan: 2,000,000 THB, 240 months
    // Current rate: 5.50%
    // Retention rate: 3.80%, retention fee: 0 THB
    // Refinance rate: 2.99%
    // Closing costs:
    //   - mortgageFee: 1.0% of 2M = 20,000
    //   - appraisalFee: 2,800
    //   - stampDuty: 0.05% of 2M = 1,000
    //   - insuranceFee: 2,000
    //   - totalRefinanceFees: 20,000 + 2,800 + 1,000 + 2,000 = 25,800
    const calcRefi = ctx.calculateHomeRefinance({
        principal: 2000000,
        months: 240,
        currentRate: 5.50,
        retentionRate: 3.80,
        retentionFee: 0,
        refinanceRate: 2.99,
        isGovReducedMortgage: false,
        appraisalFee: 2800,
        insuranceFee: 2000,
        otherRefinanceFees: 0
    });

    assert.equal(calcRefi.principal, 2000000);
    assert.equal(calcRefi.months, 240);
    assert.equal(calcRefi.mortgageFee, 20000);
    assert.equal(calcRefi.stampDuty, 1000);
    assert.equal(calcRefi.appraisalFee, 2800);
    assert.equal(calcRefi.insuranceFee, 2000);
    assert.equal(calcRefi.totalRefinanceFees, 25800);

    // Amortization 3 years checks
    assert.ok(calcRefi.currentPlan.monthlyPay > calcRefi.retentionPlan.monthlyPay);
    assert.ok(calcRefi.retentionPlan.monthlyPay > calcRefi.refinancePlan.monthlyPay);
    assert.ok(calcRefi.refinanceInterestSaved > calcRefi.retentionInterestSaved);
    assert.ok(calcRefi.refinanceNetSavings > 0);
    assert.ok(calcRefi.breakevenMonth > 0 && calcRefi.breakevenMonth <= 36);
    assert.equal(calcRefi.isRefinanceBetter, true);
    assert.match(calcRefi.recommendation, /รีไฟแนนซ์/);

    // 2. Government Reduced Mortgage Incentive (0.01% mortgage registration fee)
    const calcGov = ctx.calculateHomeRefinance({
        principal: 2000000,
        months: 240,
        currentRate: 5.50,
        retentionRate: 3.80,
        retentionFee: 0,
        refinanceRate: 2.99,
        isGovReducedMortgage: true,
        appraisalFee: 2800,
        insuranceFee: 2000,
        otherRefinanceFees: 0
    });
    // Mortgage fee: 2M * 0.01% = 200 THB
    assert.equal(calcGov.mortgageFee, 200);
    assert.equal(calcGov.totalRefinanceFees, 6000); // 200 + 2800 + 1000 + 2000
    assert.ok(calcGov.refinanceNetSavings > calcRefi.refinanceNetSavings);
    assert.ok(calcGov.breakevenMonth < calcRefi.breakevenMonth);
    assert.equal(calcGov.isRefinanceBetter, true);

    // 3. Retention Superior Scenario (Bank gives competitive retention e.g. 3.05% vs refinance 2.99%)
    const calcRetention = ctx.calculateHomeRefinance({
        principal: 2000000,
        months: 240,
        currentRate: 5.50,
        retentionRate: 3.05,
        retentionFee: 0,
        refinanceRate: 2.99,
        isGovReducedMortgage: false,
        appraisalFee: 2800,
        insuranceFee: 2000,
        otherRefinanceFees: 0
    });
    // Refinance costs 25,800, but only saves ~0.06% interest over 3 years (~3,000 THB), so closing costs far exceed extra savings
    assert.equal(calcRetention.isRefinanceBetter, false);
    assert.ok(calcRetention.retentionNetSavings > calcRetention.refinanceNetSavings);
    assert.match(calcRetention.recommendation, /Retention/);
});

test('pure engine calculateNetSalary: statutory deductions, PVD, ภ.ง.ด.1 withholding tax, and take-home pay', () => {
    const ctx = context();

    // 1. Standard Thai employee: Base 35,000 + OT 3,500 + Allowance 2,000, PVD 3%, SSO yes
    const emp1 = ctx.calculateNetSalary({
        baseSalary: 35000,
        otAmount: 3500,
        allowance: 2000,
        bonusMonthly: 0,
        hasSocialSecurity: 'yes',
        pvdPct: 3,
        customDeduction: 0
    });
    assert.equal(emp1.grossMonthly, 40500);
    assert.equal(emp1.annualGross, 486000);
    assert.equal(emp1.ssoMonthly, 750); // capped at 15,000 * 5%
    assert.equal(emp1.pvdMonthly, 1050); // 35,000 * 3%
    assert.equal(emp1.annualTax, 7940);
    assert.equal(emp1.taxMonthly, 662);
    assert.equal(emp1.totalDeductions, 2462); // 750 + 1050 + 662
    assert.equal(emp1.netMonthly, 38038);
    assert.ok(emp1.effectiveDeductionPct > 6 && emp1.effectiveDeductionPct < 6.2);

    // 2. Custom deduction (Student Loan กยศ 1,500 THB)
    const empWithLoan = ctx.calculateNetSalary({
        baseSalary: 35000,
        otAmount: 3500,
        allowance: 2000,
        bonusMonthly: 0,
        hasSocialSecurity: 'yes',
        pvdPct: 3,
        customDeduction: 1500
    });
    assert.equal(empWithLoan.customDeduction, 1500);
    assert.equal(empWithLoan.totalDeductions, 3962);
    assert.equal(empWithLoan.netMonthly, 36538);

    // 3. Low salary under tax threshold: Base 15,000, no OT, no PVD
    const empLow = ctx.calculateNetSalary({
        baseSalary: 15000,
        otAmount: 0,
        allowance: 0,
        hasSocialSecurity: 'yes',
        pvdPct: 0,
        customDeduction: 0
    });
    assert.equal(empLow.grossMonthly, 15000);
    assert.equal(empLow.ssoMonthly, 750);
    assert.equal(empLow.taxMonthly, 0); // net taxable 21,000 <= 150,000 (0% bracket)
    assert.equal(empLow.totalDeductions, 750);
    assert.equal(empLow.netMonthly, 14250);

    // 4. Executive tier: Base 120,000, Allowance 10,000, Bonus 20,000, PVD 10%
    const exec = ctx.calculateNetSalary({
        baseSalary: 120000,
        allowance: 10000,
        bonusMonthly: 20000,
        hasSocialSecurity: 'yes',
        pvdPct: 10,
        customDeduction: 0
    });
    assert.equal(exec.grossMonthly, 150000);
    assert.equal(exec.annualGross, 1800000);
    assert.equal(exec.ssoMonthly, 750);
    assert.equal(exec.pvdMonthly, 12000); // 120,000 * 10%
    assert.ok(exec.taxMonthly > 15000); // progressive tax brackets up to 25%
    assert.ok(exec.netMonthly < exec.grossMonthly);
    assert.ok(exec.effectiveDeductionPct > 15);

    // 5. Zero / empty state safety
    const emptyState = ctx.calculateNetSalary({});
    assert.equal(emptyState.baseSalary, 0);
    assert.equal(emptyState.grossMonthly, 0);
    assert.equal(emptyState.totalDeductions, 0);
    assert.equal(emptyState.netMonthly, 0);
    assert.equal(emptyState.effectiveDeductionPct, 0);
});

test('pure engine calculateDebtPayoff: Avalanche vs Snowball, minimums, rollover and underfunded debt trap', () => {
    const ctx = context();

    // 1. Standard Multi-account debt portfolio:
    // Debt 1: Balance 25,000, Rate 25%, Min 1,250
    // Debt 2: Balance 45,000, Rate 16%, Min 2,250
    // Debt 3: Balance 80,000, Rate 18%, Min 3,500
    // Extra monthly: 3,000 (Total monthly budget = 7,000 + 3,000 = 10,000)
    const standardPlan = ctx.calculateDebtPayoff({
        strategy: 'avalanche',
        extraMonthly: 3000,
        debts: [
            { id: '1', name: 'บัตรกดเงินสด A', balance: 25000, rate: 25, minPayment: 1250 },
            { id: '2', name: 'บัตรเครดิต B', balance: 45000, rate: 16, minPayment: 2250 },
            { id: '3', name: 'สินเชื่อบุคคล C', balance: 80000, rate: 18, minPayment: 3500 }
        ]
    });

    assert.equal(standardPlan.initialTotalDebt, 150000);
    assert.equal(standardPlan.initialTotalMinPayment, 7000);
    assert.equal(standardPlan.totalMonthlyBudget, 10000);
    assert.equal(standardPlan.isUnderfunded, false);
    assert.equal(standardPlan.isPayable, true);

    // Avalanche must pay off highest interest (Debt 1 @ 25%) first
    assert.equal(standardPlan.avalanche.debtPayoffOrder[0].id, '1');
    assert.ok(standardPlan.avalanche.completed);
    assert.ok(standardPlan.avalanche.months > 0 && standardPlan.avalanche.months < 36);

    // Snowball must pay off lowest balance (Debt 1 @ 25k) first
    assert.equal(standardPlan.snowball.debtPayoffOrder[0].id, '1');
    assert.ok(standardPlan.snowball.completed);

    // In a scenario where highest rate != lowest balance:
    // Debt A: Balance 10,000, Rate 10%, Min 500
    // Debt B: Balance 50,000, Rate 28%, Min 2,500
    const diffPlan = ctx.calculateDebtPayoff({
        strategy: 'avalanche',
        extraMonthly: 2000,
        debts: [
            { id: 'A', name: 'หนี้ดอกเบี้ยต่ำยอดน้อย', balance: 10000, rate: 10, minPayment: 500 },
            { id: 'B', name: 'หนี้ดอกเบี้ยสูงยอดเยอะ', balance: 50000, rate: 28, minPayment: 2500 }
        ]
    });
    // Avalanche targets B (28%) first, Snowball targets A (10k) first
    assert.equal(diffPlan.avalanche.debtPayoffOrder[0].id, 'B');
    assert.equal(diffPlan.snowball.debtPayoffOrder[0].id, 'A');
    // Avalanche mathematically saves more interest than Snowball
    assert.ok(diffPlan.avalanche.totalInterest <= diffPlan.snowball.totalInterest);
    // Snowball achieves the first debt payoff victory earlier
    assert.ok(diffPlan.snowball.firstPaidOffMonth <= diffPlan.avalanche.firstPaidOffMonth);

    // 2. Extra payment reduces total payoff time compared to baseline (paying only minimums)
    assert.ok(standardPlan.summary.months < standardPlan.baseline.months);
    assert.ok(standardPlan.summary.totalInterest < standardPlan.baseline.totalInterest);
    assert.ok(standardPlan.summary.interestSavedVsBaseline > 0);

    // 3. Underfunded debt trap: monthly budget cannot cover initial monthly interest
    // Debt: 1,000,000 at 24% interest -> interest is 20,000/month. Min payment = 5,000, extra = 0
    const underfunded = ctx.calculateDebtPayoff({
        strategy: 'avalanche',
        extraMonthly: 0,
        debts: [{ id: 'trap', name: 'หนี้ดอกเบี้ยทับเงินต้น', balance: 1000000, rate: 24, minPayment: 5000 }]
    });
    assert.equal(underfunded.isUnderfunded, true);
    assert.equal(underfunded.isPayable, false);

    // 4. Empty / zero debts safety
    const emptyPlan = ctx.calculateDebtPayoff({});
    assert.equal(emptyPlan.initialTotalDebt, 0);
    assert.equal(emptyPlan.summary.months, 0);
    assert.equal(emptyPlan.summary.totalInterest, 0);
    assert.equal(emptyPlan.isPayable, true);

    // 5. Drawer summary text formatting
    const summaryText = ctx.getToolSummaryText('debt_payoff', {
        debt_payoff: {
            strategy: 'avalanche',
            extraMonthly: '3000',
            debts: [
                { id: '1', name: 'บัตรกดเงินสด A', balance: '25000', rate: '25', minPayment: '1250' }
            ]
        }
    });
    assert.match(summaryText, /สรุปแผนปลดหนี้หลายบัญชี/);
    assert.match(summaryText, /Debt Avalanche/);
    assert.match(summaryText, /ยอดหนี้รวมเริ่มต้น:/);
    assert.match(summaryText, /ระยะเวลาปลดหนี้:/);

    // 6. Same-month minimum payment rollover test (Review Point 3)
    // Debt 1: 100, 0%, min 500
    // Debt 2: 1000, 0%, min 100
    // Total budget = 600, extra = 0
    // Month 1: Debt 1 is paid off with 100 baht. The unused 400 baht rolls into Debt 2 immediately (+100 min = 500 paid on Debt 2, balance drops to 500).
    // Month 2: Remaining 500 is paid off. Total payoff time must be exactly 2 months.
    const rolloverPlan = ctx.calculateDebtPayoff({
        strategy: 'avalanche',
        extraMonthly: 0,
        debts: [
            { id: '1', name: 'หนี้ 1', balance: 100, rate: 0, minPayment: 500 },
            { id: '2', name: 'หนี้ 2', balance: 1000, rate: 0, minPayment: 100 }
        ]
    });
    assert.equal(rolloverPlan.summary.months, 2);
    assert.equal(rolloverPlan.avalanche.completed, true);
    assert.equal(rolloverPlan.avalanche.debtPayoffOrder.length, 2);
    assert.equal(rolloverPlan.avalanche.debtPayoffOrder[0].month, 1);
    assert.equal(rolloverPlan.avalanche.debtPayoffOrder[1].month, 2);

    // 7. Unpayable plan when budget is 0 or payments are 0 (Review Point 1)
    const zeroPayPlan = ctx.calculateDebtPayoff({
        strategy: 'avalanche',
        extraMonthly: 0,
        debts: [
            { id: '1', name: 'หนี้ไม่จ่าย', balance: 50000, rate: 15, minPayment: 0 }
        ]
    });
    assert.equal(zeroPayPlan.isUnderfunded, true);
    assert.equal(zeroPayPlan.isPayable, false);
    assert.equal(zeroPayPlan.avalanche.completed, false);
    assert.equal(zeroPayPlan.snowball.completed, false);

    // 8. Drawer summary text formatting for unpayable plan
    const unpayableSummary = ctx.getToolSummaryText('debt_payoff', {
        debt_payoff: {
            strategy: 'avalanche',
            extraMonthly: '0',
            debts: [
                { id: '1', name: 'หนี้ไม่จ่าย', balance: '50000', rate: '15', minPayment: '0' }
            ]
        }
    });
    assert.match(unpayableSummary, /ยังชำระไม่สำเร็จ/);

    // 9. Formal print document formatting for unpayable plan
    const unpayableDoc = ctx.generateFormalPrintHTML('debt_payoff', {
        debt_payoff: {
            strategy: 'avalanche',
            extraMonthly: '0',
            debts: [
                { id: '1', name: 'หนี้ไม่จ่าย', balance: '50000', rate: '15', minPayment: '0' }
            ]
        }
    });
    assert.ok(unpayableDoc.includes('ยังชำระไม่สำเร็จ'));
});

test('calculateFoodCosting: recipe costing engine, yield %, hidden cost buffer, packaging, and target profit analysis', () => {
    const ctx = context();

    // 1. Single serving recipe test
    // Pork: 160 THB for 1000g, use 120g, 100% yield => 160 * (120/1000) = 19.20 THB
    // Rice: 45 THB for 2500g, use 200g, 100% yield => 45 * (200/2500) = 3.60 THB
    // Egg: 120 THB for 30 pieces, use 1 piece => 120 / 30 = 4.00 THB
    // Basil/Chili: 50 THB for 500g, use 30g, 90% yield => (30 * (50/500)) / 0.90 = 3.00 / 0.9 = 3.3333... THB
    // Sauce/Oil: 65 THB for 1000ml, use 25ml => 65 * (25/1000) = 1.625 THB
    // Total raw batch cost = 19.20 + 3.60 + 4.00 + 3.3333 + 1.625 = 31.7583 THB
    // Batch yield = 1 => Raw cost per portion = 31.7583 THB
    // Hidden cost buffer 5% => 31.7583 * 0.05 = 1.5879 THB
    // Packaging = 4.50 THB
    // Total cost per portion = 31.7583 + 1.5879 + 4.50 = 37.8462 THB
    // Target food cost % = 30% => Suggested selling price = 37.8462 / 0.30 = 126.154 THB
    // Commercial rounded price (nearest 5) = ceil(126.154 / 5) * 5 = 130 THB
    const singleRecipe = ctx.calculateFoodCosting({
        recipeName: 'ข้าวกะเพราหมูสับไข่ดาว',
        batchYield: '1',
        targetFoodCostPct: '30',
        sellingPrice: '65',
        packagingCost: '4.5',
        hiddenCostBufferPct: '5',
        ingredients: [
            { id: '1', name: 'หมูสับ', packPrice: '160', packSize: '1000', packUnit: 'g', useAmount: '120', useUnit: 'g', yieldPct: '100' },
            { id: '2', name: 'ข้าวสวย', packPrice: '45', packSize: '2500', packUnit: 'g', useAmount: '200', useUnit: 'g', yieldPct: '100' },
            { id: '3', name: 'ไข่ไก่', packPrice: '120', packSize: '30', packUnit: 'piece', useAmount: '1', useUnit: 'piece', yieldPct: '100' },
            { id: '4', name: 'ใบกะเพรา', packPrice: '50', packSize: '500', packUnit: 'g', useAmount: '30', useUnit: 'g', yieldPct: '90' },
            { id: '5', name: 'น้ำมัน&ซอส', packPrice: '65', packSize: '1000', packUnit: 'ml', useAmount: '25', useUnit: 'ml', yieldPct: '100' }
        ]
    });

    assert.equal(singleRecipe.batchYield, 1);
    assert.equal(singleRecipe.ingredients.length, 5);
    assert.equal(Math.round(singleRecipe.ingredients[0].lineCost * 100) / 100, 19.20);
    assert.equal(Math.round(singleRecipe.ingredients[1].lineCost * 100) / 100, 3.60);
    assert.equal(Math.round(singleRecipe.ingredients[2].lineCost * 100) / 100, 4.00);
    assert.equal(Math.round(singleRecipe.ingredients[3].lineCost * 100) / 100, 3.33);
    assert.equal(Math.round(singleRecipe.ingredients[4].lineCost * 100) / 100, 1.63);

    assert.equal(Math.round(singleRecipe.summary.rawCostPerPortion * 100) / 100, 31.76);
    assert.equal(Math.round(singleRecipe.summary.hiddenCostBuffer * 100) / 100, 1.59);
    assert.equal(singleRecipe.summary.packagingCost, 4.5);
    assert.equal(Math.round(singleRecipe.summary.totalCostPerPortion * 100) / 100, 37.85);

    assert.equal(Math.round(singleRecipe.summary.suggestedSellingPrice * 100) / 100, 126.17);
    assert.equal(singleRecipe.summary.suggestedPriceRounded, 130);

    // Actual selling price analysis at 65 THB
    // Gross Profit = 65 - 37.8462 = 27.1538 THB
    // Actual Food Cost % = (37.8462 / 65) * 100 = 58.22%
    // Gross Margin % = (27.1538 / 65) * 100 = 41.78%
    assert.equal(singleRecipe.summary.hasActualPrice, true);
    assert.equal(singleRecipe.summary.isProfit, true);
    assert.equal(Math.round(singleRecipe.summary.grossProfit * 100) / 100, 27.15);
    assert.equal(singleRecipe.summary.actualFoodCostPct, 58.2);
    assert.equal(singleRecipe.summary.grossMarginPct, 41.8);

    // 2. Batch Recipe: 10 portions of Thai Tea
    // Tea leaves: 350 THB for 500g, use 200g (pack 500g, use 200g) => 350 * (200/500) = 140 THB
    // Milk: 95 THB for 2000ml, use 1200ml => 95 * (1200/2000) = 57 THB
    // Condensed milk: 55 THB for 1000g, use 300g => 55 * (300/1000) = 16.5 THB
    // Ice: 20 THB for 10kg, use 2kg (2000g with pack 10kg) => unit conversion kg to g
    // 10kg = 10,000g => 20 * (2000/10000) = 4.00 THB
    // Total raw batch cost = 140 + 57 + 16.5 + 4 = 217.50 THB
    // Batch yield = 10 portions => Raw cost per portion = 21.75 THB
    // Hidden cost buffer 5% => 21.75 * 0.05 = 1.0875 THB
    // Packaging = 3.50 THB per cup
    // Total cost per cup = 21.75 + 1.0875 + 3.50 = 26.3375 THB
    // Target food cost % = 25% => Suggested price = 26.3375 / 0.25 = 105.35 THB
    // Commercial rounded = 110 THB
    const batchRecipe = ctx.calculateFoodCosting({
        recipeName: 'ชาไทยเย็น Batch 10 แก้ว',
        batchYield: '10',
        targetFoodCostPct: '25',
        sellingPrice: '50',
        packagingCost: '3.5',
        hiddenCostBufferPct: '5',
        ingredients: [
            { id: '1', name: 'ผงชา', packPrice: '350', packSize: '500', packUnit: 'g', useAmount: '200', useUnit: 'g', yieldPct: '100' },
            { id: '2', name: 'นมสด', packPrice: '95', packSize: '2000', packUnit: 'ml', useAmount: '1200', useUnit: 'ml', yieldPct: '100' },
            { id: '3', name: 'นมข้น', packPrice: '55', packSize: '1000', packUnit: 'g', useAmount: '300', useUnit: 'g', yieldPct: '100' },
            { id: '4', name: 'น้ำแข็ง', packPrice: '20', packSize: '10', packUnit: 'kg', useAmount: '2000', useUnit: 'g', yieldPct: '100' }
        ]
    });

    assert.equal(batchRecipe.batchYield, 10);
    assert.equal(Math.round(batchRecipe.summary.rawBatchCost * 100) / 100, 217.50);
    assert.equal(Math.round(batchRecipe.summary.rawCostPerPortion * 100) / 100, 21.75);
    assert.equal(Math.round(batchRecipe.summary.hiddenCostBuffer * 100) / 100, 1.09);
    assert.equal(Math.round(batchRecipe.summary.totalCostPerPortion * 100) / 100, 26.34);
    assert.equal(Math.round(batchRecipe.summary.suggestedSellingPrice * 100) / 100, 105.36);
    assert.equal(batchRecipe.summary.suggestedPriceRounded, 110);

    // Selling at 50 THB:
    // Profit = 50 - 26.3375 = 23.6625 THB
    assert.equal(batchRecipe.summary.isProfit, true);
    assert.equal(Math.round(batchRecipe.summary.grossProfit * 100) / 100, 23.66);

    // 3. Loss scenario test (selling below total cost)
    const lossRecipe = ctx.calculateFoodCosting({
        recipeName: 'เมนูขายขาดทุน',
        batchYield: '1',
        targetFoodCostPct: '30',
        sellingPrice: '20',
        packagingCost: '5',
        hiddenCostBufferPct: '0',
        ingredients: [
            { id: '1', name: 'เนื้อสเต็ก', packPrice: '500', packSize: '1000', packUnit: 'g', useAmount: '200', useUnit: 'g', yieldPct: '100' }
        ]
    });
    // Raw cost = 100 THB + packaging 5 = 105 THB
    // Selling price = 20 THB => Loss = -85 THB
    assert.equal(lossRecipe.summary.totalCostPerPortion, 105);
    assert.equal(lossRecipe.summary.grossProfit, -85);
    assert.equal(lossRecipe.summary.isProfit, false);

    // 4. Drawer summary test
    const summaryText = ctx.getToolSummaryText('food_costing', {
        food_costing: {
            recipeName: 'ข้าวกะเพราหมูสับไข่ดาว',
            batchYield: '1',
            targetFoodCostPct: '30',
            sellingPrice: '65',
            packagingCost: '4.5',
            hiddenCostBufferPct: '5',
            ingredients: [
                { id: '1', name: 'หมูสับ', packPrice: '160', packSize: '1000', packUnit: 'g', useAmount: '120', useUnit: 'g', yieldPct: '100' }
            ]
        }
    });
    assert.match(summaryText, /สรุปต้นทุนสูตรอาหาร & เครื่องดื่ม/);
    assert.match(summaryText, /ต้นทุนรวมต่อเสิร์ฟ:/);
    assert.match(summaryText, /ราคาแนะนำ/);

    // 5. Formal print sheet test
    const printDoc = ctx.generateFormalPrintHTML('food_costing', {
        food_costing: {
            recipeName: 'ข้าวกะเพราหมูสับไข่ดาว',
            batchYield: '1',
            targetFoodCostPct: '30',
            sellingPrice: '65',
            packagingCost: '4.5',
            hiddenCostBufferPct: '5',
            ingredients: [
                { id: '1', name: 'หมูสับ', packPrice: '160', packSize: '1000', packUnit: 'g', useAmount: '120', useUnit: 'g', yieldPct: '100' }
            ]
        }
    });
    assert.ok(printDoc.includes('ใบสรุปต้นทุนสูตรมาตรฐานอาหารและเครื่องดื่ม'));
    assert.ok(printDoc.includes('Standard Recipe Cost & Pricing Sheet'));
    assert.ok(printDoc.includes('ตารางแจกแจงต้นทุนวัตถุดิบตามสูตร'));

    // 6. Compare calculations test
    const presets = ctx.getComparisonPresets('food_costing');
    assert.equal(presets.length, 3);
    const compResult = ctx.compareCalculations('food_costing', presets);
    assert.ok(compResult);
    assert.ok(compResult.rows.length >= 5);
    assert.ok(compResult.deltaSummary.includes('ทางเลือกที่'));
});

test('fuel_cost: fuel consumption and EV charging comparison', () => {
    const ctx = context();

    // 1. Pure calculation: ICE Fuel Mode
    const fuelRes = ctx.calculateFuelCost({
        distance: '150',
        efficiency: '15',
        oilPrice: '36.50',
        tollFee: '100',
        passengers: '2'
    });
    assert.equal(fuelRes.distance, 150);
    assert.equal(fuelRes.efficiency, 15);
    assert.equal(fuelRes.liters, 10);
    assert.equal(fuelRes.fuelCost, 365);
    assert.equal(fuelRes.tollFee, 100);
    assert.equal(fuelRes.totalTripCost, 465);
    assert.equal(fuelRes.costPerKm, 2.43);
    assert.equal(fuelRes.costPerPerson, 232.5);

    // 2. Pure calculation: EV Charging Mode (Home TOU Off-Peak)
    const evHomeRes = ctx.calculateEvCost({
        distance: '200',
        evEfficiency: '6.5',
        electricityRate: '2.90',
        chargingLossPct: '10',
        batteryCapacity: '60',
        compareIceEfficiency: '15',
        compareFuelPrice: '36.50',
        yearlyKm: '20000'
    });
    assert.equal(evHomeRes.distance, 200);
    assert.equal(evHomeRes.evEfficiency, 6.5);
    assert.equal(evHomeRes.ev.netKwh, 30.77);
    assert.equal(evHomeRes.ev.billedKwh, 33.85);
    assert.equal(evHomeRes.ev.totalCost, 98.15);
    assert.equal(evHomeRes.ev.costPerKm, 0.49);
    assert.equal(evHomeRes.ice.litersNeeded, 13.33);
    assert.equal(evHomeRes.ice.totalCost, 486.67);
    assert.equal(evHomeRes.ice.costPerKm, 2.43);
    assert.equal(evHomeRes.savings.tripSavings, 388.51);
    assert.equal(evHomeRes.savings.savingsPct, 79.8);
    assert.equal(evHomeRes.savings.isSavings, true);
    assert.equal(evHomeRes.annual.evYearlyCost, 9815);
    assert.equal(evHomeRes.annual.iceYearlyCost, 48667);
    assert.equal(evHomeRes.annual.yearlySavings, 38851);
    assert.equal(evHomeRes.annual.fiveYearSavings, 194256);

    // 3. Pure calculation: EV Charging Mode (DC Fast Charge Peak)
    const evDcRes = ctx.calculateEvCost({
        distance: '200',
        evEfficiency: '6.5',
        electricityRate: '7.80',
        chargingLossPct: '10',
        batteryCapacity: '60',
        compareIceEfficiency: '15',
        compareFuelPrice: '36.50',
        yearlyKm: '20000'
    });
    assert.equal(evDcRes.ev.totalCost, 264);
    assert.equal(evDcRes.ev.costPerKm, 1.32);
    assert.equal(evDcRes.savings.tripSavings, 222.67);
    assert.equal(evDcRes.savings.savingsPct, 45.8);

    // 4. Drawer summary test
    const fuelSummary = ctx.getToolSummaryText('fuel_cost', {
        fuel_cost: { mode: 'fuel', distance: '150', efficiency: '15', oilPrice: '36.50', tollFee: '0', passengers: '1' }
    });
    assert.match(fuelSummary, /สรุปค่าน้ำมันเดินทาง/);
    assert.match(fuelSummary, /ค่าน้ำมันรวม:/);

    const evSummary = ctx.getToolSummaryText('fuel_cost', {
        fuel_cost: {
            mode: 'ev',
            distance: '200',
            evEfficiency: '6.5',
            electricityRate: '2.90',
            chargingLossPct: '10',
            batteryCapacity: '60',
            compareIceEfficiency: '15',
            compareFuelPrice: '36.50',
            yearlyKm: '20000'
        }
    });
    assert.match(evSummary, /สรุปค่าชาร์จรถไฟฟ้า EV & เทียบรถน้ำมัน/);
    assert.match(evSummary, /ค่าชาร์จรถ EV/);
    assert.match(evSummary, /ประหยัดได้/);

    // 5. Formal print sheet test
    const fuelPrint = ctx.generateFormalPrintHTML('fuel_cost', {
        fuel_cost: { mode: 'fuel', distance: '150', efficiency: '15', oilPrice: '36.50', tollFee: '0', passengers: '1' }
    });
    assert.ok(fuelPrint.includes('ใบสรุปต้นทุนค่าน้ำมันและค่าเดินทาง'));

    const evPrint = ctx.generateFormalPrintHTML('fuel_cost', {
        fuel_cost: {
            mode: 'ev',
            distance: '200',
            evEfficiency: '6.5',
            electricityRate: '2.90',
            chargingLossPct: '10',
            batteryCapacity: '60',
            compareIceEfficiency: '15',
            compareFuelPrice: '36.50',
            yearlyKm: '20000'
        }
    });
    assert.ok(evPrint.includes('ใบสรุปต้นทุนค่าชาร์จรถยนต์ไฟฟ้า EV และเปรียบเทียบรถน้ำมัน'));
    assert.ok(evPrint.includes('Electric Vehicle (EV) Charging Cost'));
    assert.ok(evPrint.includes('ตารางเปรียบเทียบความคุ้มค่า EV vs รถน้ำมันเดิม'));

    // 6. Compare calculations matrix test
    const presets = ctx.getComparisonPresets('fuel_cost');
    assert.equal(presets.length, 3);
    const compResult = ctx.compareCalculations('fuel_cost', presets);
    assert.ok(compResult);
    assert.ok(compResult.rows.length >= 6);
    assert.ok(compResult.deltaSummary.includes('ทางเลือกที่ประหยัดต้นทุนพลังงานที่สุดคือ'));
    assert.equal(compResult.winnerIndex, 0); // Home TOU Off-Peak is cheapest per km

    // 7. Input validation test
    assert.equal(ctx.hasInvalidNumericInput('fuel_cost', { fuel_cost: { mode: 'fuel', distance: '100', efficiency: '15', oilPrice: '36.50', tollFee: '0', passengers: '1' } }), false);
    assert.equal(ctx.hasInvalidNumericInput('fuel_cost', { fuel_cost: { mode: 'fuel', distance: 'abc', efficiency: '15', oilPrice: '36.50', tollFee: '0', passengers: '1' } }), true);
    assert.equal(ctx.hasInvalidNumericInput('fuel_cost', { fuel_cost: { mode: 'ev', distance: '100', evEfficiency: '6.5', electricityRate: '2.90', chargingLossPct: '10', batteryCapacity: '60', compareIceEfficiency: '15', compareFuelPrice: '36.50', yearlyKm: '20000' } }), false);
    assert.equal(ctx.hasInvalidNumericInput('fuel_cost', { fuel_cost: { mode: 'ev', distance: '100', evEfficiency: 'notanumber', electricityRate: '2.90', chargingLossPct: '10', batteryCapacity: '60', compareIceEfficiency: '15', compareFuelPrice: '36.50', yearlyKm: '20000' } }), true);
});

test('construction_calc: tiles, paint, and concrete calculations', () => {
    const ctx = context();

    // 1. Tiles calculation
    const tilesRes = ctx.calculateConstructionMaterials({
        tab: 'tiles',
        tileWidth: '4',
        tileLength: '5',
        tileSizePreset: '60x60',
        tilePiecesPerBox: '4',
        tileWastagePct: '10',
        tilePricePerBox: '350',
        adhesivePricePerBag: '160',
        groutPricePerBag: '50',
        tileLaborPerSqm: '250'
    });
    assert.equal(tilesRes.widthM, 4);
    assert.equal(tilesRes.lengthM, 5);
    assert.equal(tilesRes.areaSqm, 20);
    assert.equal(tilesRes.grossAreaSqm, 22);
    assert.equal(tilesRes.tileAreaSqm, 0.36);
    assert.equal(tilesRes.boxCoverageSqm, 1.44);
    assert.equal(tilesRes.boxesNeeded, 16); // ceil(22 / 1.44) = 16
    assert.equal(tilesRes.totalPurchasedPieces, 64); // 16 * 4
    assert.equal(tilesRes.adhesiveBags, 5); // ceil(22 / 4.5) = 5
    assert.equal(tilesRes.groutBags, 7); // ceil(22 / 3.5) = 7
    assert.equal(tilesRes.costs.tileCost, 5600); // 16 * 350
    assert.equal(tilesRes.costs.adhesiveCost, 800); // 5 * 160
    assert.equal(tilesRes.costs.groutCost, 350); // 7 * 50
    assert.equal(tilesRes.costs.laborCost, 5000); // 20 * 250
    assert.equal(tilesRes.costs.totalEstimatedBudget, 11750);

    // 2. Paint calculation
    const paintRes = ctx.calculateConstructionMaterials({
        tab: 'paint',
        paintWallWidth: '12',
        paintWallHeight: '2.8',
        paintDeductArea: '4',
        paintCoats: '2',
        paintWastagePct: '10',
        paintPrimerPrice5Gal: '1800',
        paintPrimerPrice1Gal: '450',
        paintTopcoatPrice5Gal: '2400',
        paintTopcoatPrice1Gal: '600',
        paintLaborPerSqm: '60'
    });
    assert.equal(paintRes.wallWidthM, 12);
    assert.equal(paintRes.wallHeightM, 2.8);
    assert.equal(paintRes.deductAreaSqm, 4);
    assert.equal(paintRes.wallAreaSqm, 29.6); // 12 * 2.8 - 4 = 33.6 - 4 = 29.6
    assert.equal(paintRes.effectiveAreaSqm, 32.56); // 29.6 * 1.10 = 32.56
    assert.equal(paintRes.primer.coats, 1);
    assert.ok(Math.abs(paintRes.primer.litersNeeded - 3.83) <= 0.05); // 32.56 / 8.5 ~= 3.83 L
    assert.equal(paintRes.topcoat.coats, 2);
    assert.ok(Math.abs(paintRes.topcoat.litersNeeded - 8.14) <= 0.05); // (32.56 * 2) / 8.0 = 8.14 L
    assert.equal(paintRes.costs.laborCost, 1776); // 29.6 * 60

    // 3. Concrete calculation: Ready-mix
    const concreteRes = ctx.calculateConstructionMaterials({
        tab: 'concrete',
        slabWidth: '4',
        slabLength: '6',
        slabThickness: '10',
        concreteWastagePct: '5',
        concreteType: 'ready_mix',
        concretePricePerCubic: '2000',
        wireMeshPricePerSqm: '35',
        concreteLaborPerSqm: '80'
    });
    assert.equal(concreteRes.slabWidthM, 4);
    assert.equal(concreteRes.slabLengthM, 6);
    assert.equal(concreteRes.slabThicknessCm, 10);
    assert.equal(concreteRes.slabAreaSqm, 24);
    assert.equal(concreteRes.netVolumeCubicM, 2.4);
    assert.equal(concreteRes.grossVolumeCubicM, 2.52); // 2.4 * 1.05 = 2.52
    assert.equal(concreteRes.readyMixOrderCubicM, 2.75); // ceil(2.52 * 4) / 4 = 2.75
    assert.equal(concreteRes.wireMeshSqm, 26.4); // 24 * 1.10 = 26.4
    assert.equal(concreteRes.costs.concreteMaterialCost, 5500); // 2.75 * 2000
    assert.equal(concreteRes.costs.wireMeshCost, 924); // 26.4 * 35
    assert.equal(concreteRes.costs.laborCost, 1920); // 24 * 80
    assert.equal(concreteRes.costs.totalEstimatedBudget, 8344); // 5500 + 924 + 1920

    // 4. Concrete calculation: Site-mix
    const siteMixRes = ctx.calculateConstructionMaterials({
        tab: 'concrete',
        slabWidth: '4',
        slabLength: '6',
        slabThickness: '10',
        concreteWastagePct: '5',
        concreteType: 'site_mix',
        cementBagPrice: '145',
        sandPricePerCubic: '450',
        gravelPricePerCubic: '500',
        wireMeshPricePerSqm: '35',
        concreteLaborPerSqm: '80'
    });
    assert.equal(siteMixRes.siteMix.cementBags50kg, 18); // ceil(2.52 * 6.8) = ceil(17.136) = 18
    assert.equal(siteMixRes.siteMix.sandCubicM, 1.26); // 2.52 * 0.50 = 1.26
    assert.equal(siteMixRes.siteMix.gravelCubicM, 2.14); // 2.52 * 0.85 = 2.142 -> round2 = 2.14

    // 5. Drawer summary text test
    const tilesSummary = ctx.getToolSummaryText('construction_calc', {
        construction_calc: { tab: 'tiles', tileWidth: '4', tileLength: '5', tileSizePreset: '60x60', tilePiecesPerBox: '4', tileWastagePct: '10', tilePricePerBox: '350', adhesivePricePerBag: '160', groutPricePerBag: '50', tileLaborPerSqm: '250' }
    });
    assert.match(tilesSummary, /สรุปคำนวณกระเบื้องปูพื้น & ผนัง/);
    assert.match(tilesSummary, /16 กล่อง/);

    const paintSummary = ctx.getToolSummaryText('construction_calc', {
        construction_calc: { tab: 'paint', paintWallWidth: '12', paintWallHeight: '2.8', paintDeductArea: '4', paintCoats: '2', paintWastagePct: '10', paintPrimerPrice5Gal: '1800', paintPrimerPrice1Gal: '450', paintTopcoatPrice5Gal: '2400', paintTopcoatPrice1Gal: '600', paintLaborPerSqm: '60' }
    });
    assert.match(paintSummary, /สรุปคำนวณสีทาอาคาร & ผนัง/);
    assert.match(paintSummary, /สีรองพื้น/);

    const concreteSummary = ctx.getToolSummaryText('construction_calc', {
        construction_calc: { tab: 'concrete', slabWidth: '4', slabLength: '6', slabThickness: '10', concreteWastagePct: '5', concreteType: 'ready_mix', concretePricePerCubic: '2000', wireMeshPricePerSqm: '35', concreteLaborPerSqm: '80' }
    });
    assert.match(concreteSummary, /สรุปคำนวณคอนกรีตเทพื้น & ปูน/);
    assert.match(concreteSummary, /2\.75 คิว/);

    // 6. Formal print sheet test
    const printDoc = ctx.generateFormalPrintHTML('construction_calc', {
        construction_calc: { tab: 'tiles', tileWidth: '4', tileLength: '5', tileSizePreset: '60x60', tilePiecesPerBox: '4', tileWastagePct: '10', tilePricePerBox: '350', adhesivePricePerBag: '160', groutPricePerBag: '50', tileLaborPerSqm: '250' }
    });
    assert.ok(printDoc.includes('ใบประมาณการวัสดุก่อสร้างและปรับปรุงบ้าน'));
    assert.ok(printDoc.includes('Construction & Renovation Material Estimation Sheet'));
    assert.ok(printDoc.includes('ตารางแจกแจงรายการวัสดุกระเบื้อง'));

    // 7. Compare calculations test
    const presets = ctx.getComparisonPresets('construction_calc');
    assert.equal(presets.length, 3);
    const compResult = ctx.compareCalculations('construction_calc', presets);
    assert.ok(compResult);
    assert.ok(compResult.rows.length >= 5);
    assert.ok(compResult.deltaSummary.includes('ทางเลือกที่ประหยัดงบประมาณที่สุด'));

    // 8. Input validation test
    assert.equal(ctx.hasInvalidNumericInput('construction_calc', { construction_calc: { tab: 'tiles', tileWidth: '4', tileLength: '5', tileWastagePct: '10', tilePricePerBox: '350', adhesivePricePerBag: '160', groutPricePerBag: '50', tileLaborPerSqm: '0' } }), false);
    assert.equal(ctx.hasInvalidNumericInput('construction_calc', { construction_calc: { tab: 'tiles', tileWidth: 'abc', tileLength: '5', tileWastagePct: '10', tilePricePerBox: '350', adhesivePricePerBag: '160', groutPricePerBag: '50', tileLaborPerSqm: '0' } }), true);
    assert.equal(ctx.hasInvalidNumericInput('construction_calc', { construction_calc: { tab: 'paint', paintWallWidth: '10', paintWallHeight: '3', paintDeductArea: '2', paintCoats: '2', paintWastagePct: '10', paintPrimerPrice5Gal: '1800', paintPrimerPrice1Gal: '450', paintTopcoatPrice5Gal: '2400', paintTopcoatPrice1Gal: '600', paintLaborPerSqm: '0' } }), false);
    assert.equal(ctx.hasInvalidNumericInput('construction_calc', { construction_calc: { tab: 'paint', paintWallWidth: '10', paintWallHeight: '3', paintDeductArea: 'notanumber', paintCoats: '2', paintWastagePct: '10', paintPrimerPrice5Gal: '1800', paintPrimerPrice1Gal: '450', paintTopcoatPrice5Gal: '2400', paintTopcoatPrice1Gal: '600', paintLaborPerSqm: '0' } }), true);
    assert.equal(ctx.hasInvalidNumericInput('construction_calc', { construction_calc: { tab: 'concrete', slabWidth: '4', slabLength: '6', slabThickness: '10', concreteWastagePct: '5', concretePricePerCubic: '2000', wireMeshPricePerSqm: '35', concreteLaborPerSqm: '0' } }), false);
    assert.equal(ctx.hasInvalidNumericInput('construction_calc', { construction_calc: { tab: 'concrete', slabWidth: '4', slabLength: '6', slabThickness: 'bad_input', concreteWastagePct: '5', concretePricePerCubic: '2000', wireMeshPricePerSqm: '35', concreteLaborPerSqm: '0' } }), true);
});

test('desktop charts: loan chart data totals, downsampling, and panel shell', () => {
    const ctx = context();
    const empty = ctx.buildLoanChartData([]);
    assert.equal(empty.totalPaid, 0);
    assert.equal(empty.points.length, 0);
    assert.equal(ctx.renderLoanChartPanel([]), '');

    const schedule = ctx.generateLoanSchedule({ principal: '120000', interestRate: '6', months: '12' });
    const data = ctx.buildLoanChartData(schedule);
    assert.ok(Math.abs(data.totalPrincipal - 120000) < 0.01, 'principal repaid equals loan amount');
    assert.ok(data.totalInterest > 0 && data.interestSharePct > 0 && data.interestSharePct < 100);
    assert.ok(Math.abs(data.totalPaid - (data.totalPrincipal + data.totalInterest)) < 0.01);
    assert.equal(data.points[0].month, 0);
    assert.ok(Math.abs(data.points[0].balance - 120000) < 0.01);
    assert.equal(data.points[data.points.length - 1].month, 12);
    assert.ok(data.points[data.points.length - 1].balance < 0.01);

    const long = ctx.generateLoanSchedule({ principal: '3000000', interestRate: '4', months: '360' });
    const longData = ctx.buildLoanChartData(long, 60);
    assert.ok(longData.points.length <= 62, 'long schedules are downsampled');
    assert.equal(longData.points[longData.points.length - 1].month, 360, 'last month is always kept');

    const panel = ctx.renderLoanChartPanel(schedule);
    assert.ok(panel.includes('desktop-chart') && panel.includes('hidden lg:block'), 'panel is desktop-only');
    assert.ok(panel.includes('<svg'));
    assert.ok(!/#[0-9a-fA-F]{3,6}\b/.test(panel), 'charts use theme variables, not hex colours');
});

test('desktop charts: tax waterfall, bracket gauge, and calculator bracket fields', () => {
    const ctx = context();
    assert.deepEqual(Array.from(ctx.buildTaxWaterfallSteps(null)), []);
    assert.deepEqual(Array.from(ctx.buildTaxWaterfallSteps(ctx.calculatePersonalTax({ salaryMonthly: 0 }))), []);
    assert.equal(ctx.renderTaxChartPanel(ctx.calculatePersonalTax({ salaryMonthly: 0 })), '');

    const calc = ctx.calculatePersonalTax({ salaryMonthly: 65000, bonusYearly: 80000, otherIncomeYearly: 20000 });
    const steps = ctx.buildTaxWaterfallSteps(calc);
    assert.equal(steps[0].amount, calc.grossIncome);
    const last = steps[steps.length - 1];
    assert.ok(Math.abs(last.amount - calc.netTaxableIncome) < 0.01, 'waterfall ends at net taxable income');
    const minusTotal = steps.filter(s => s.kind === 'minus').reduce((sum, s) => sum + s.amount, 0);
    assert.ok(Math.abs(calc.grossIncome - minusTotal - last.amount) < 0.01, 'steps reconcile');
    assert.ok(calc.bracketStart <= calc.netTaxableIncome);
    assert.ok(calc.nextBracketStart === null || calc.netTaxableIncome <= calc.nextBracketStart);

    // Deductions larger than income clamp to zero instead of going negative
    const low = ctx.calculatePersonalTax({ salaryMonthly: 10000 });
    const lowSteps = ctx.buildTaxWaterfallSteps(low);
    assert.equal(lowSteps[lowSteps.length - 1].amount, 0);
    assert.ok(lowSteps.every(s => s.amount >= 0));

    const gauge = ctx.buildTaxBracketGauge({ netTaxableIncome: 600000, marginalRate: 15, bracketStart: 500000, nextBracketStart: 750000, nextRatePercent: 20 });
    assert.equal(gauge.amountToNext, 150000);
    assert.ok(Math.abs(gauge.progress - 0.4) < 1e-9);
    assert.equal(gauge.nextRatePercent, 20);

    const top = ctx.buildTaxBracketGauge({ netTaxableIncome: 6000000, marginalRate: 35, bracketStart: 5000000, nextBracketStart: null, nextRatePercent: null });
    assert.equal(top.amountToNext, null);
    assert.equal(top.progress, 1);

    const rich = ctx.calculatePersonalTax({ salaryMonthly: 1000000 });
    assert.equal(rich.nextBracketStart, null, 'top bracket has no next bracket');
    assert.ok(ctx.renderTaxChartPanel(rich).includes('ฐานภาษีสูงสุด'));
});

test('desktop charts: salary 50/30/20 split and pie panel', () => {
    const ctx = context();
    const full = ctx.buildSalarySplitData({ income: 40000, needsPct: 50, wantsPct: 30, savingsPct: 20 });
    assert.equal(full.slices.length, 3, 'no leftover slice when percents total 100');
    assert.deepEqual(Array.from(full.slices.map(s => s.amount)), [20000, 12000, 8000]);
    assert.equal(full.overAllocated, false);

    const partial = ctx.buildSalarySplitData({ income: 40000, needsPct: 50, wantsPct: 30, savingsPct: 10 });
    assert.equal(partial.slices.length, 4);
    assert.equal(partial.slices[3].pct, 10);
    assert.equal(partial.slices[3].amount, 4000);

    const over = ctx.buildSalarySplitData({ income: 40000, needsPct: 60, wantsPct: 40, savingsPct: 20 });
    assert.equal(over.overAllocated, true);
    assert.equal(over.slices.length, 3);

    assert.equal(ctx.renderSalaryChartPanel({ income: 0, needsPct: 50, wantsPct: 30, savingsPct: 20 }), '');
    assert.equal(ctx.renderSalaryChartPanel({ income: 40000, needsPct: 0, wantsPct: 0, savingsPct: 0 }), '');
    const panel = ctx.renderSalaryChartPanel({ income: 40000, needsPct: 50, wantsPct: 30, savingsPct: 20 });
    assert.ok(panel.includes('hidden lg:block') && panel.includes('<svg'));
    assert.ok(panel.includes('20,000.00'));
    assert.equal(ctx.renderDonutChart([{ value: 0, tone: 'accent' }]), '');
});

test('what-if: loan extra payment saves interest and months, zero delta changes nothing', () => {
    const ctx = context();
    const params = { principal: '1000000', interestRate: '6', months: '120', extra: '0' };
    const none = ctx.computeLoanWhatIf(params, 0);
    assert.equal(none.interestSaved, 0);
    assert.equal(none.monthsSaved, 0);
    assert.equal(none.baseMonths, 120);

    const more = ctx.computeLoanWhatIf(params, 5000);
    assert.ok(more.interestSaved > 0);
    assert.ok(more.monthsSaved > 0);
    assert.equal(more.newMonths, more.baseMonths - more.monthsSaved);
    assert.ok(more.newInterest < more.baseInterest);

    const bigger = ctx.computeLoanWhatIf(params, 10000);
    assert.ok(bigger.interestSaved > more.interestSaved, 'bigger extra saves more');

    // existing extra is kept; negative/invalid deltas are ignored; empty loan is safe
    assert.equal(ctx.computeLoanWhatIf({ ...params, extra: '2000' }, -500).interestSaved, 0);
    assert.equal(ctx.computeLoanWhatIf(params, 'abc').monthsSaved, 0);
    const empty = ctx.computeLoanWhatIf({ principal: '', interestRate: '5', months: '12' }, 1000);
    assert.equal(empty.baseMonths, 0);
    assert.equal(empty.interestSaved, 0);
    assert.equal(ctx.renderLoanWhatIfSection([]), '');
});

test('what-if: salary shift moves lifestyle percent into savings, clamped to lifestyle share', () => {
    const ctx = context();
    const base = { income: 40000, wantsPct: 30, savingsPct: 20 };
    const r = ctx.computeSalaryWhatIf(base, 10);
    assert.equal(r.newWantsPct, 20);
    assert.equal(r.newSavingsPct, 30);
    assert.equal(r.extraMonthly, 4000);
    assert.equal(r.extraYearly, 48000);

    const clamped = ctx.computeSalaryWhatIf(base, 99);
    assert.equal(clamped.shift, 30);
    assert.equal(clamped.newWantsPct, 0);
    assert.equal(ctx.computeSalaryWhatIf(base, -5).extraMonthly, 0);
    assert.equal(ctx.computeSalaryWhatIf({ income: 0, wantsPct: 30, savingsPct: 20 }, 10).extraMonthly, 0);

    assert.equal(ctx.renderSalaryWhatIfSection({ income: 0, wantsPct: 30, savingsPct: 20 }), '');
    assert.equal(ctx.renderSalaryWhatIfSection({ income: 40000, wantsPct: 0, savingsPct: 20 }), '');
    assert.ok(ctx.renderSalaryWhatIfSection({ income: 40000, wantsPct: 30, savingsPct: 20 }).includes('data-whatif="salary"'));
});

test('what-if: tax insights report remaining quota and refund, capped by shared retirement limit', () => {
    const ctx = context();
    const params = { salaryMonthly: '65000', bonusYearly: '80000', otherIncomeYearly: '20000', withholdingTax: '25000', pvdGpf: '30000', socialSecurity: '9000' };
    const insights = ctx.computeTaxInsights(params);
    const byKey = Object.fromEntries(insights.map(i => [i.key, i]));
    assert.equal(byKey.ssf.remaining, 200000, 'SSF capped at 200k (30% of income is higher)');
    assert.ok(byKey.rmf.remaining <= 500000 - 30000, 'RMF shares the 500k retirement cap with PVD');
    assert.ok(byKey.ssf.cashBack > 0 && byKey.thaiEsg.cashBack > 0);

    const w = ctx.computeTaxWhatIf(params, 'ssf', 100000);
    assert.ok(w.taxSaved > 0 && w.newTax < w.baseTax);
    assert.equal(ctx.computeTaxWhatIf(params, 'ssf', 0).taxSaved, 0);
    assert.equal(ctx.computeTaxWhatIf(params, 'ssf', -100).taxSaved, 0);

    // buying more never refunds more than the tax actually owed
    assert.ok(byKey.ssf.cashBack <= ctx.calculatePersonalTax(params).totalTax + 0.01);

    // quota already used up -> no remaining, section says so
    const maxed = ctx.computeTaxInsights({ ...params, ssf: '200000', rmf: '270000', thaiEsg: '300000' });
    assert.ok(maxed.every(i => i.remaining === 0 && i.cashBack === 0));
    assert.ok(ctx.renderTaxInsightsSection({ ...params, ssf: '200000', rmf: '270000', thaiEsg: '300000' }).includes('ครบตามเพดานแล้ว'));

    // zero income: nothing to unlock
    assert.ok(ctx.computeTaxInsights({ salaryMonthly: '0' }).every(i => i.remaining === 0));

    const html = ctx.renderTaxInsightsSection(params);
    assert.ok(html.includes('data-whatif="tax"') && html.includes('type="range"'));
});

test('car loan: full early-payoff schedule covers every installment and matches the single-month simulation', () => {
    const ctx = context();
    const params = { vehicleType: 'car', condition: 'new', price: '850000', downPaymentType: 'percent', downPaymentValue: '20', interestRate: '2.59', periodMonths: '60', payoffMonth: '30' };
    const rows = ctx.buildCarLoanPayoffSchedule(params);
    assert.equal(rows.length, 60, 'one row per installment, 1 through 60');
    assert.equal(rows[0].month, 1);
    assert.equal(rows[59].month, 60);

    // Every row agrees with the existing single-month calculator
    for (const r of [rows[0], rows[19], rows[29], rows[39], rows[58]]) {
        const single = ctx.calculateCarLoan({ ...params, payoffMonth: String(r.month) });
        assert.ok(Math.abs(single.totalPayoffAmount - r.payoffAmount) < 0.005, `payoff matches at month ${r.month}`);
        assert.ok(Math.abs(single.totalSavedByEarlyPayoff - r.saved) < 0.01, `saving matches at month ${r.month}`);
    }

    // Tier boundaries for a 60-month contract: <20 -> 100%, 20..40 -> 70%, >40 -> 60%
    assert.equal(rows[18].discountTierPercent, 100);
    assert.equal(rows[19].discountTierPercent, 70);
    assert.equal(rows[39].discountTierPercent, 70);
    assert.equal(rows[40].discountTierPercent, 60);

    // Final installment: nothing left to pay, nothing saved
    assert.equal(rows[59].remainingMonths, 0);
    assert.equal(rows[59].payoffAmount, 0);
    assert.equal(rows[59].saved, 0);
    assert.ok(rows.every(r => r.payoffAmount <= r.fullRemaining + 0.005 && r.saved >= 0));

    // Used car adds VAT consistently
    const used = ctx.buildCarLoanPayoffSchedule({ ...params, condition: 'used', interestRate: '4.5' });
    assert.equal(used.length, 60);
    assert.ok(used[29].fullRemaining > 0 && used[29].payoffAmount < used[29].fullRemaining);

    // Short and invalid contracts
    assert.equal(ctx.buildCarLoanPayoffSchedule({ ...params, periodMonths: '24' }).length, 24);
    assert.deepEqual(Array.from(ctx.buildCarLoanPayoffSchedule({ ...params, price: '0' })), []);
    assert.equal(ctx.renderCarLoanPayoffTable([], 1), '');

    const html = ctx.renderCarLoanPayoffTable(rows, 30);
    assert.ok(html.includes('hidden lg:block'), 'desktop-only');
    assert.equal((html.match(/<tr /g) || []).length, 61, 'header plus 60 rows');
    assert.equal((html.match(/aria-current="true"/g) || []).length, 1, 'only the selected month is highlighted');
    assert.ok(!/#[0-9a-fA-F]{3,6}\b/.test(html), 'theme variables only');
});

test('electricity: appliance ranking sorts by consumption, shares add to 100, and renders desktop-only', () => {
    const ctx = context();
    const appCalc = ctx.calculateApplianceEnergy([
        { id: 'fan', name: 'พัดลม', watts: 50, qty: 2, hoursPerDay: 8 },
        { id: 'air', name: 'แอร์', watts: 900, qty: 1, hoursPerDay: 8 },
        { id: 'fridge', name: 'ตู้เย็น', watts: 100, qty: 1, hoursPerDay: 24 },
        { id: 'off', name: 'เครื่องปิด', watts: 500, qty: 1, hoursPerDay: 0 }
    ], 4.5);
    const ranking = ctx.buildApplianceRanking(appCalc);
    assert.deepEqual(Array.from(ranking.map(r => r.name)), ['แอร์', 'ตู้เย็น', 'พัดลม', 'เครื่องปิด']);
    assert.deepEqual(Array.from(ranking.map(r => r.rank)), [1, 2, 3, 4]);
    assert.ok(Math.abs(ranking.reduce((s, r) => s + r.sharePct, 0) - 100) < 1e-9);
    assert.ok(Math.abs(ranking[0].monthlyKwh - 900 * 8 * 30 / 1000) < 1e-9);
    assert.equal(ranking[3].sharePct, 0);
    assert.ok(Math.abs(ranking.reduce((s, r) => s + r.monthlyCost, 0) - appCalc.totalMonthlyCost) < 1e-6);

    // Equal consumption keeps the user's original order
    const ties = ctx.buildApplianceRanking(ctx.calculateApplianceEnergy([
        { name: 'A', watts: 100, qty: 1, hoursPerDay: 5 },
        { name: 'B', watts: 100, qty: 1, hoursPerDay: 5 }
    ]));
    assert.deepEqual(Array.from(ties.map(r => r.name)), ['A', 'B']);

    // Empty list / all zero usage are safe
    assert.deepEqual(Array.from(ctx.buildApplianceRanking(ctx.calculateApplianceEnergy([]))), []);
    assert.deepEqual(Array.from(ctx.buildApplianceRanking(null)), []);
    assert.equal(ctx.renderApplianceRankingTable([]), '');
    const zero = ctx.buildApplianceRanking(ctx.calculateApplianceEnergy([{ name: 'Z', watts: 100, qty: 1, hoursPerDay: 0 }]));
    assert.equal(zero[0].sharePct, 0);
    assert.ok(ctx.renderApplianceRankingTable(zero).includes('ยังไม่มีเครื่องใช้ไฟฟ้า'));

    const html = ctx.renderApplianceRankingTable(ranking);
    assert.ok(html.includes('hidden lg:block'));
    assert.equal((html.match(/<tr /g) || []).length, 5, 'header plus 4 rows');
    assert.ok(html.includes('แอร์ กินไฟมากที่สุด'));
    assert.ok(!/#[0-9a-fA-F]{3,6}\b/.test(html), 'theme variables only');

    // Names are escaped
    const xss = ctx.renderApplianceRankingTable(ctx.buildApplianceRanking(ctx.calculateApplianceEnergy([{ name: '<img onerror=x>', watts: 100, qty: 1, hoursPerDay: 1 }])));
    assert.ok(!xss.includes('<img onerror'));
});

test('property transfer: split comparison keeps the total constant and agrees with each single-mode result', () => {
    const ctx = context();
    const params = { appraisedValue: '3000000', salePrice: '3200000', mortgageAmount: '2500000', holdingYears: '3', isGovMeasure: 'standard', exemptSBT: 'no', splitMode: 'half' };
    const rows = ctx.buildTransferSplitComparison(params);
    assert.deepEqual(Array.from(rows.map(r => r.mode)), ['custom', 'half', 'seller', 'buyer']);
    assert.equal(rows.filter(r => r.isSelected).length, 1);
    assert.equal(rows.find(r => r.isSelected).mode, 'half');

    for (const r of rows) {
        const single = ctx.calculatePropertyTransfer({ ...params, splitMode: r.mode });
        assert.ok(Math.abs(r.buyerCost - single.buyerCost) < 0.005, `${r.mode} buyer matches`);
        assert.ok(Math.abs(r.sellerCost - single.sellerCost) < 0.005, `${r.mode} seller matches`);
        assert.ok(Math.abs(r.buyerCost + r.sellerCost - r.totalCost) < 0.01, `${r.mode} buyer + seller = total`);
    }
    assert.ok(rows.every(r => Math.abs(r.totalCost - rows[0].totalCost) < 0.01), 'total is the same under every split');

    const seller = rows.find(r => r.mode === 'seller');
    const buyer = rows.find(r => r.mode === 'buyer');
    const mortgageFee = 2500000 * 0.01;
    assert.ok(Math.abs(seller.buyerCost - mortgageFee) < 0.005, 'buyer still pays mortgage registration when seller covers the rest');
    assert.equal(buyer.sellerCost, 0);
    assert.ok(Math.abs(buyer.buyerSharePct - 100) < 1e-9);
    assert.equal(rows.find(r => r.isSelected).buyerDelta, 0);
    assert.ok(buyer.buyerDelta > 0 && seller.buyerDelta < 0);

    // Cash purchase (no mortgage) and government reduced-fee measure
    const cash = ctx.buildTransferSplitComparison({ ...params, mortgageAmount: '0' });
    assert.equal(cash.find(r => r.mode === 'seller').buyerCost, 0);
    const reduced = ctx.buildTransferSplitComparison({ ...params, isGovMeasure: 'reduced' });
    assert.ok(reduced[0].totalCost < rows[0].totalCost);

    // Missing appraisal -> no comparison; default split mode is custom
    assert.deepEqual(Array.from(ctx.buildTransferSplitComparison({ appraisedValue: '' })), []);
    assert.equal(ctx.renderTransferSplitComparison([]), '');
    const dflt = ctx.buildTransferSplitComparison({ ...params, splitMode: undefined });
    assert.equal(dflt.find(r => r.isSelected).mode, 'custom');

    const html = ctx.renderTransferSplitComparison(rows);
    assert.ok(html.includes('hidden lg:block'));
    assert.equal((html.match(/<tr /g) || []).length, 5, 'header plus 4 scenarios');
    assert.equal((html.match(/aria-current="true"/g) || []).length, 1);
    assert.ok(!/#[0-9a-fA-F]{3,6}\b/.test(html), 'theme variables only');
});

test('social security: extra-years insight matches the calculator, flags pension transition, and renders desktop-only', () => {
    const ctx = context();
    const m33 = { section: 'm33', wageMonthly: '15000', contributionMonths: '240' };
    const rows = ctx.buildSocialSecurityExtraYears(m33);
    assert.deepEqual(Array.from(rows.map(r => r.extraYears)), [0, 1, 2, 3, 4, 5]);
    assert.equal(rows[0].delta, 0);
    assert.equal(rows[0].extraContributed, 0);
    assert.equal(rows[0].benefit, 4125, '27.5% of 15,000 at 240 months');
    assert.equal(rows[1].benefit, 4350, '29% at 252 months');
    assert.equal(rows[1].delta, 225);
    assert.equal(rows[1].extraContributed, 9000, '750 baht x 12 extra months');
    assert.equal(rows[1].paybackMonths, 40);
    for (const r of rows) {
        const single = ctx.calculateSocialSecurity({ ...m33, contributionMonths: String(240 + r.extraYears * 12) });
        assert.equal(r.benefit, single.monthlyPension, `row +${r.extraYears} matches calculator`);
    }
    assert.ok(rows.every((r, i) => i === 0 || r.benefit > rows[i - 1].benefit), 'more years never lowers the pension');

    // 14 years: one more year crosses 180 months and becomes a pension
    const near = ctx.buildSocialSecurityExtraYears({ section: 'm33', wageMonthly: '15000', contributionMonths: '168' });
    assert.equal(near[0].isPension, false);
    assert.equal(near[1].becomesPension, true);
    assert.equal(near[1].delta, null, 'lump sum vs pension is not comparable');
    assert.equal(near[1].paybackMonths, null);
    assert.equal(near[2].becomesPension, true);
    assert.equal(near[1].benefit, 3000, '20% of 15,000');

    // Section 40 stays a lump sum and grows
    const m40 = ctx.buildSocialSecurityExtraYears({ section: 'm40', m40Plan: 'plan2', contributionMonths: '120' });
    assert.ok(m40.every(r => !r.isPension && !r.becomesPension && r.paybackMonths === null));
    assert.ok(m40[5].delta > 0);

    // Invalid months is safe; shorter horizon is honoured
    assert.deepEqual(Array.from(ctx.buildSocialSecurityExtraYears({ section: 'm33', contributionMonths: 'abc' })), []);
    assert.equal(ctx.buildSocialSecurityExtraYears(m33, 3).length, 4);
    assert.equal(ctx.renderSocialSecurityInsight([]), '');

    const html = ctx.renderSocialSecurityInsight(rows);
    assert.ok(html.includes('hidden lg:block'));
    assert.equal((html.match(/<tr /g) || []).length, 7, 'header plus 6 rows');
    assert.equal((html.match(/aria-current="true"/g) || []).length, 1);
    assert.ok(html.includes('บำนาญเพิ่มขึ้นเดือนละ'), 'headline describes the pension increase');
    assert.ok(ctx.renderSocialSecurityInsight(near).includes('เปลี่ยนจากเงินก้อนเป็นบำนาญ'));
    assert.ok(!/#[0-9a-fA-F]{3,6}\b/.test(html), 'theme variables only');
});

test('desktop layout: planner groups full-width, form and result items without losing any element', () => {
    const ctx = context();
    const F = { full: true, result: false }, C = { full: false, result: false }, R = { full: false, result: true };
    const all = plan => [...plan.leading, ...plan.form, ...plan.results, ...plan.trailing].sort((a, b) => a - b);

    // salary-like: mode switch + intro on top, cards, then the result
    const salary = ctx.planDesktopColumns([F, F, C, C, R]);
    assert.deepEqual(Array.from(salary.leading), [0, 1]);
    assert.deepEqual(Array.from(salary.form), [2, 3]);
    assert.deepEqual(Array.from(salary.results), [4]);
    assert.deepEqual(Array.from(salary.trailing), []);

    // loan-like: tabs on top, fields, chart, wide table at the bottom
    const loan = ctx.planDesktopColumns([F, C, C, C, R, F]);
    assert.deepEqual(Array.from(loan.leading), [0]);
    assert.deepEqual(Array.from(loan.form), [1, 2, 3]);
    assert.deepEqual(Array.from(loan.results), [4]);
    assert.deepEqual(Array.from(loan.trailing), [5]);

    // result in the middle, several results, wide table in the middle stays in the form column
    const mixed = ctx.planDesktopColumns([C, R, C, F, C, R, F]);
    assert.deepEqual(Array.from(mixed.form), [0, 2, 3, 4]);
    assert.deepEqual(Array.from(mixed.results), [1, 5]);
    assert.deepEqual(Array.from(mixed.trailing), [6]);

    // every element is placed exactly once
    for (const p of [salary, loan, mixed]) {
        const placed = all(p);
        assert.deepEqual(Array.from(placed), Array.from({ length: placed.length }, (_, i) => i));
    }

    // nothing to split: no results, no form items, or empty input
    assert.equal(ctx.planDesktopColumns([F, C, C]), null);
    assert.equal(ctx.planDesktopColumns([F, R]), null);
    assert.equal(ctx.planDesktopColumns([R]), null);
    assert.equal(ctx.planDesktopColumns([F, F]), null);
    assert.equal(ctx.planDesktopColumns([]), null);
    assert.equal(ctx.planDesktopColumns(null), null);

    // arranging without a DOM or on a narrow screen is a safe no-op
    assert.equal(ctx.isDesktopLayout(), false);
    assert.doesNotThrow(() => ctx.arrangeDesktopColumns(null));
});

test('car loan: chart data, panel, and down-payment what-if agree with the calculator', () => {
    const ctx = context();
    const params = { vehicleType: 'car', condition: 'new', price: '850000', downPaymentType: 'percent', downPaymentValue: '20', interestRate: '2.59', periodMonths: '60', payoffMonth: '30' };
    const calc = ctx.calculateCarLoan(params);
    const rows = ctx.buildCarLoanPayoffSchedule(params);
    const data = ctx.buildCarLoanChartData(calc, rows);
    assert.equal(data.points.length, 61, 'month 0 plus 60 installments');
    assert.equal(data.points[0].month, 0);
    assert.ok(Math.abs(data.points[0].balance - calc.totalRepayment) < 0.01);
    assert.equal(data.points[60].month, 60);
    assert.equal(data.points[60].balance, 0);
    assert.equal(data.payoffPoints.length, 61);
    assert.ok(data.payoffPoints.every((p, i) => p.balance <= data.points[i].balance + 0.005), 'payoff never above the scheduled balance');
    assert.ok(Math.abs(data.interestSharePct - (calc.totalInterest / (calc.principal + calc.totalInterest)) * 100) < 1e-9);
    assert.equal(data.vat, 0);
    assert.ok(data.maxSaved > 0);

    const used = ctx.calculateCarLoan({ ...params, condition: 'used', interestRate: '4.5' });
    const usedData = ctx.buildCarLoanChartData(used, ctx.buildCarLoanPayoffSchedule({ ...params, condition: 'used', interestRate: '4.5' }));
    assert.ok(usedData.vat > 0, 'used car shows VAT');

    assert.equal(ctx.buildCarLoanChartData(ctx.calculateCarLoan({ ...params, price: '0' }), []), null);
    assert.equal(ctx.buildCarLoanChartData(null, rows), null);
    assert.equal(ctx.renderCarLoanChartPanel(ctx.calculateCarLoan({ ...params, price: '0' }), [], params), '');

    const html = ctx.renderCarLoanChartPanel(calc, rows, params);
    assert.ok(html.includes('hidden lg:block') && html.includes('<svg'));
    assert.ok(html.includes('stroke-dasharray'), 'second (payoff) series is drawn dashed');
    assert.ok(html.includes('data-whatif="car"'));
    assert.ok(!ctx.renderCarLoanChartPanel(calc, rows).includes('data-whatif'), 'no what-if without params');
    assert.ok(!/#[0-9a-fA-F]{3,6}\b/.test(html), 'theme variables only');

    // down-payment what-if
    const none = ctx.computeCarLoanWhatIf(params, 0);
    assert.equal(none.monthlySaved, 0);
    assert.equal(none.interestSaved, 0);
    assert.ok(Math.abs(none.newMonthly - calc.monthlyPayment) < 1e-9);

    const more = ctx.computeCarLoanWhatIf(params, 100000);
    const direct = ctx.calculateCarLoan({ ...params, downPaymentType: 'amount', downPaymentValue: calc.downPaymentAmount + 100000 });
    assert.ok(Math.abs(more.newMonthly - direct.monthlyPayment) < 1e-9);
    assert.ok(Math.abs(more.interestSaved - (calc.totalInterest - direct.totalInterest)) < 1e-9);
    assert.ok(more.monthlySaved > 0 && more.interestSaved > 0 && more.newPrincipal === calc.principal - 100000);
    assert.ok(ctx.computeCarLoanWhatIf(params, 200000).interestSaved > more.interestSaved);

    // clamps to the vehicle price, ignores negative/invalid, works for used cars (VAT included)
    const huge = ctx.computeCarLoanWhatIf(params, 99999999);
    assert.equal(huge.newPrincipal, 0);
    assert.equal(huge.extraDown, calc.price - calc.downPaymentAmount);
    assert.equal(ctx.computeCarLoanWhatIf(params, -5000).monthlySaved, 0);
    assert.equal(ctx.computeCarLoanWhatIf(params, 'abc').monthlySaved, 0);
    const usedMore = ctx.computeCarLoanWhatIf({ ...params, condition: 'used', interestRate: '4.5' }, 100000);
    assert.ok(usedMore.monthlySaved > more.monthlySaved * 0.99, 'VAT scales the monthly saving for used cars');

    // slider section only appears when there is room to add down payment
    assert.ok(ctx.renderCarLoanWhatIfSection(params).includes('type="range"'));
    assert.equal(ctx.renderCarLoanWhatIfSection({ ...params, price: '0' }), '');
    assert.equal(ctx.renderCarLoanWhatIfSection({ ...params, price: '10000' }), '');
});

test('electricity what-if: reducing air-conditioner hours saves the right kWh and baht, other appliances untouched', () => {
    const ctx = context();
    const appliances = [
        { id: 'air12k', name: 'แอร์ Inverter 12,000 BTU', watts: 900, qty: 1, hoursPerDay: 8 },
        { id: 'fridge', name: 'ตู้เย็น 2 ประตู', watts: 100, qty: 1, hoursPerDay: 24 },
        { id: 'fan', name: 'พัดลม 16 นิ้ว', watts: 50, qty: 2, hoursPerDay: 8 }
    ];
    const none = ctx.computeApplianceWhatIf(appliances, 4.5, 0);
    assert.equal(none.savedKwh, 0);
    assert.equal(none.savedBaht, 0);
    assert.equal(none.acCount, 1);
    assert.equal(none.maxHours, 8);

    const two = ctx.computeApplianceWhatIf(appliances, 4.5, 2);
    assert.ok(Math.abs(two.savedKwh - 54) < 1e-9, '900 W x 2 h x 30 days');
    assert.ok(Math.abs(two.savedBaht - 243) < 1e-9);
    assert.ok(Math.abs(two.savedBahtYearly - 2916) < 1e-9);
    const baseCost = ctx.calculateApplianceEnergy(appliances, 4.5).totalMonthlyCost;
    assert.ok(Math.abs(two.newMonthlyCost - (baseCost - 243)) < 1e-9);

    // clamps at zero hours: saving equals the whole air-conditioner cost, never more
    const all = ctx.computeApplianceWhatIf(appliances, 4.5, 20);
    assert.ok(Math.abs(all.savedKwh - 900 * 8 * 30 / 1000) < 1e-9);
    assert.ok(all.savedBaht <= baseCost);

    // several air conditioners, name-only detection, invalid input
    const multi = ctx.computeApplianceWhatIf([
        { id: 'x1', name: 'แอร์ห้องนอน', watts: 600, qty: 1, hoursPerDay: 6 },
        { id: 'air18k', name: 'ห้องนั่งเล่น', watts: 1400, qty: 1, hoursPerDay: 4 }
    ], 4, 1);
    assert.equal(multi.acCount, 2);
    assert.ok(Math.abs(multi.savedKwh - (600 + 1400) * 1 * 30 / 1000) < 1e-9);
    assert.equal(ctx.computeApplianceWhatIf(appliances, 4.5, -3).savedBaht, 0);
    assert.equal(ctx.computeApplianceWhatIf(appliances, 4.5, 'abc').savedBaht, 0);
    assert.equal(ctx.isAirConditionerItem({ id: 'fan', name: 'พัดลม' }), false);
    assert.equal(ctx.isAirConditionerItem({ id: 'AIR9K', name: '' }), true);
    assert.equal(ctx.isAirConditionerItem(null), false);

    // no air conditioner (or never switched on) -> no slider
    const noAc = [appliances[1], appliances[2]];
    assert.equal(ctx.computeApplianceWhatIf(noAc, 4.5, 2).acCount, 0);
    assert.equal(ctx.renderApplianceWhatIfSection(noAc, 4.5), '');
    assert.equal(ctx.renderApplianceWhatIfSection([{ ...appliances[0], hoursPerDay: 0 }], 4.5), '');
    assert.equal(ctx.renderApplianceWhatIfSection([], 4.5), '');
    const section = ctx.renderApplianceWhatIfSection(appliances, 4.5);
    assert.ok(section.includes('data-whatif="ac"') && section.includes('type="range"') && section.includes('max="8"'));

    // the section is embedded in the (desktop-only) ranking panel
    const ranking = ctx.buildApplianceRanking(ctx.calculateApplianceEnergy(appliances, 4.5));
    const panel = ctx.renderApplianceRankingTable(ranking, section);
    assert.ok(panel.includes('hidden lg:block') && panel.includes('data-whatif="ac"'));
    assert.ok(!ctx.renderApplianceRankingTable(ranking).includes('data-whatif'));
});

test('refinance print: 3-year interest comes from interestPaid3Y (never 0.00) and monthly payments are separated', () => {
    const ctx = context();
    const loan = { tab: 'refinance', principal: '2000000', months: '240', currentRate: '5.50', retentionRate: '3.80', retentionFee: '0', refinanceRate: '2.99', isGovReducedMortgage: 'no', appraisalFee: '2800', insuranceFee: '2000', otherRefinanceFees: '0' };
    const calc = ctx.calculateHomeRefinance({ ...loan, isGovReducedMortgage: false });
    for (const plan of [calc.currentPlan, calc.retentionPlan, calc.refinancePlan]) {
        assert.equal(plan.totalInterest, undefined, 'engine exposes interestPaid3Y, not totalInterest');
        assert.ok(plan.interestPaid3Y > 1000);
    }

    const doc = ctx.generateFormalPrintHTML('loan', { activeToolId: 'loan', loan });
    assert.ok(doc.includes('เอกสารสรุปผลวิเคราะห์การรีไฟแนนซ์บ้าน'), 'refinance document, not the amortization one');
    for (const plan of [calc.currentPlan, calc.retentionPlan, calc.refinancePlan]) {
        assert.ok(doc.includes(`>${ctx.formatMoney(plan.interestPaid3Y)}</td>`), `table shows ${ctx.formatMoney(plan.interestPaid3Y)}`);
    }
    // the 3-year interest column (4th cell of each comparison row) holds the real, non-zero figures
    const rowInterest = [...doc.matchAll(/<tr style="border-bottom: 1px solid #e2e8f0;[^"]*">([\s\S]*?)<\/tr>/g)]
        .map(m => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c => c[1].trim()))
        .filter(cells => cells.length === 6)
        .map(cells => cells[3]);
    assert.deepEqual(rowInterest, [calc.currentPlan, calc.retentionPlan, calc.refinancePlan].map(plan => ctx.formatMoney(plan.interestPaid3Y)));
    assert.ok(rowInterest.every(value => value !== '0.00'));

    const arrow = `${ctx.formatMoney(calc.currentPlan.monthlyPay)} → ${ctx.formatMoney(calc.refinancePlan.monthlyPay)} บาท`;
    assert.ok(doc.includes(arrow), 'monthly payments are separated by an arrow');
    assert.ok(!doc.includes(`${ctx.formatMoney(calc.currentPlan.monthlyPay)} ${ctx.formatMoney(calc.refinancePlan.monthlyPay)} บาท`));
});

test('loan demo data keeps the refinance tab and fills both tabs', () => {
    const rawAppStateMatch = html.match(/const appState = \{[\s\S]*?\n        \};/);
    const ctx = context();
    vm.runInContext(rawAppStateMatch[0].replace(/const /g, 'var '), ctx);
    vm.runInContext('function renderActiveTool() {}\n' + source('loadDemoForCurrentTool'), ctx);
    const refinanceKeys = ['currentRate', 'retentionRate', 'retentionFee', 'refinanceRate', 'isGovReducedMortgage', 'appraisalFee', 'insuranceFee', 'otherRefinanceFees'];
    const amortKeys = ['interestRate', 'extra', 'rateType', 'promoMonths', 'rateAfter', 'calcMethod'];

    // On the refinance tab: stay there and load refinance-sized shared values
    ctx.appState.activeToolId = 'loan';
    ctx.appState.loan = { tab: 'refinance', principal: '1', months: '12', currentRate: '9', refinanceRate: '9' };
    ctx.loadDemoForCurrentTool();
    assert.equal(ctx.appState.loan.tab, 'refinance');
    assert.equal(ctx.appState.loan.principal, '2000000');
    assert.equal(ctx.appState.loan.months, '240');
    for (const key of [...refinanceKeys, ...amortKeys]) assert.ok(ctx.appState.loan[key] !== undefined, `refinance demo fills ${key}`);
    assert.equal(ctx.appState.loan.currentRate, '5.50');
    const refi = ctx.calculateHomeRefinance({ ...ctx.appState.loan, isGovReducedMortgage: ctx.appState.loan.isGovReducedMortgage === 'yes' });
    assert.ok(refi.principal === 2000000 && refi.months === 240 && refi.refinanceInterestSaved > 0, 'demo feeds the refinance engine');
    const doc = ctx.generateFormalPrintHTML('loan', { activeToolId: 'loan', loan: ctx.appState.loan });
    assert.ok(doc.includes(ctx.formatMoney(refi.currentPlan.interestPaid3Y)));

    // On the amortization tab: stays amortization, original demo numbers, refinance fields also filled
    ctx.appState.loan = { tab: 'amortization' };
    ctx.loadDemoForCurrentTool();
    assert.equal(ctx.appState.loan.tab, 'amortization');
    assert.equal(ctx.appState.loan.principal, '600000');
    assert.equal(ctx.appState.loan.months, '48');
    assert.equal(ctx.appState.loan.interestRate, '3.85');
    for (const key of refinanceKeys) assert.ok(ctx.appState.loan[key] !== undefined, `amortization demo fills ${key}`);

    // No loan state yet (or no tab) defaults to the amortization tab
    ctx.appState.loan = undefined;
    ctx.loadDemoForCurrentTool();
    assert.equal(ctx.appState.loan.tab, 'amortization');
});

test('ot_calc hands base wage, overtime and shift pay to salary net mode without double counting', () => {
    const ctx = context();
    const monthly = { wageType: 'monthly', wageBase: '25000', workHoursPerDay: '8', otWeekdayHours: '10', holidayWorkHours: '8', holidayOtHours: '4', shiftAllowance: '500' };
    const calc = ctx.calculateOvertimePay(monthly);
    const handoff = ctx.buildOtToSalaryHandoff(monthly);
    assert.equal(handoff.baseSalary, '25000');
    assert.equal(handoff.allowance, '500');
    assert.equal(handoff.otAmount, String(Math.round(calc.totalOtPay - 500)), 'shift pay is not counted twice');
    assert.equal(handoff.hasAmount, true);

    // salary net mode sees the same gross as the OT tool's total earnings
    const net = ctx.calculateNetSalary({ baseSalary: handoff.baseSalary, otAmount: handoff.otAmount, allowance: handoff.allowance });
    assert.ok(Math.abs(net.grossMonthly - calc.totalEarnings) <= 1, `gross ${net.grossMonthly} vs ${calc.totalEarnings}`);

    // daily and hourly wages are converted to a monthly base (26 working days)
    const daily = ctx.buildOtToSalaryHandoff({ ...monthly, wageType: 'daily', wageBase: '500', shiftAllowance: '0' });
    assert.equal(daily.baseSalary, '13000');
    const hourly = ctx.buildOtToSalaryHandoff({ ...monthly, wageType: 'hourly', wageBase: '65', shiftAllowance: '0' });
    assert.equal(hourly.baseSalary, '13520');
    assert.equal(hourly.allowance, '0');

    // applying it switches salary to net mode and keeps unrelated salary fields
    const salary = { mode: 'budget', income: '30000', bonusMonthly: '1000', pvdPct: '3' };
    const stored = [];
    const ctx2 = context({ appState: { salary }, persistAppState: () => stored.push(1) });
    assert.equal(ctx2.applyOtToSalaryHandoff(monthly), true);
    assert.equal(salary.mode, 'net');
    assert.equal(salary.baseSalary, '25000');
    assert.equal(salary.allowance, '500');
    assert.equal(salary.otAmount, handoff.otAmount);
    assert.equal(salary.bonusMonthly, '1000');
    assert.equal(salary.pvdPct, '3');
    assert.equal(salary.income, '30000');

    // nothing to send -> no change
    const idle = { mode: 'budget' };
    const ctx3 = context({ appState: { salary: idle } });
    const none = { wageType: 'hourly', wageBase: '0', workHoursPerDay: '8', otWeekdayHours: '0', holidayWorkHours: '0', holidayOtHours: '0', shiftAllowance: '0' };
    assert.equal(ctx3.applyOtToSalaryHandoff(none), false);
    assert.equal(idle.mode, 'budget');
});

test('ot_calc renders the handoff button and it opens salary with a toast', () => {
    let selected = null;
    const toasts = [];
    const handlers = {};
    const appState = { ot_calc: { wageType: 'monthly', wageBase: '30000', workHoursPerDay: '8', otWeekdayHours: '10', holidayWorkHours: '0', holidayOtHours: '0', shiftAllowance: '0' }, salary: { mode: 'budget' } };
    const ctx = context({ appState, setStatusBanner() {}, renderActiveTool() {}, triggerPrintReceipt() {} });
    ctx.selectTool = id => { selected = id; };
    ctx.showHistoryToast = message => { toasts.push(message); };
    const container = {
        innerHTML: '',
        querySelectorAll: () => [],
        querySelector: selector => ({ addEventListener: (event, handler) => { if (event === 'click') handlers[selector] = handler; } })
    };
    ctx.renderOvertimeTool(container);
    assert.ok(container.innerHTML.includes('id="btnOtToSalary"'), 'handoff button is rendered');
    assert.ok(container.innerHTML.includes('id="btnPrintOvertimeSummary"'), 'print button is still there');
    assert.equal(typeof handlers['#btnOtToSalary'], 'function');

    handlers['#btnOtToSalary']();
    assert.equal(selected, 'salary');
    assert.equal(appState.salary.mode, 'net');
    assert.equal(appState.salary.baseSalary, '30000');
    assert.ok(toasts.some(t => t.includes('ส่งยอดฐานเงินเดือนและค่าล่วงเวลาไปคำนวณเงินได้สุทธิแล้ว')));
});

test('scientific calculator evaluates angles, precedence, powers and invalid domains safely', () => {
    const ctx = context();
    const calc = (expr, opts = {}) => ctx.evaluateScientificExpression(expr, opts);
    assert.ok(Math.abs(calc('sin(90)', { angle: 'deg' }) - 1) < 1e-12);
    assert.ok(Math.abs(calc('sin(pi/2)', { angle: 'rad' }) - 1) < 1e-12);
    assert.ok(Math.abs(calc('asin(1)', { angle: 'deg' }) - 90) < 1e-12);
    assert.equal(calc('-2^2'), -4);
    assert.equal(calc('2^3^2'), 512);
    assert.equal(calc('2(3+4)'), 14);
    assert.equal(calc('5!+log(100)+sqrt(9)'), 125);
    assert.equal(calc('1E3+Ans', { ans: 2 }), 1002);
    assert.equal(ctx.formatScientificResult(calc('1E-13')), '1E-13');
    assert.equal(calc('sin(180)', { angle: 'deg' }), 0);
    assert.equal(calc('cos(90)', { angle: 'deg' }), 0);
    assert.equal(calc('sin(pi)', { angle: 'rad' }), 0);
    assert.equal(calc('pi×e'), Math.PI * Math.E);
    assert.equal(calc('200+10%'), 220);
    assert.equal(calc('200-10%'), 180);
    assert.equal(calc('200×10%'), 20);
    assert.equal(calc('50%'), 0.5);
    assert.equal(calc('(2)3'), 6);
    assert.equal(calc('(1+1)(3)4'), 24);
    for (const expr of ['1/0', 'sqrt(-1)', 'log(0)', '171!', 'sin(', 'globalThis']) assert.throws(() => calc(expr));
});


test('calculator sign switch handles a negative starting value and the last operand', () => {
    const ctx = context();
    const toggle = ctx.toggleCalculatorSign;
    assert.equal(toggle(''), '-');
    assert.equal(toggle('-'), '');
    assert.equal(toggle('5+'), '5+-');
    assert.equal(toggle('5+-'), '5+');
    assert.equal(toggle('5-'), '5--');
    assert.equal(toggle('5--'), '5-');
    assert.equal(ctx.evaluateScientificExpression('5--3'), 8);
    assert.equal(toggle('5+3'), '5+(-3)');
    assert.equal(toggle('5+(-3)'), '5+3');
    assert.equal(ctx.evaluateScientificExpression(toggle('5+3')), 2);
    assert.equal(toggle('-1E-13'), '1E-13');
});

test('unit converter engine: area, length, weight, volume, temperature formulas, Thai land breakdown, and label parsing', () => {
    const ctx = context();

    // 1. splitUnitLabel extracts title and parenthetical symbol
    assert.deepEqual({ ...ctx.splitUnitLabel('ตารางเมตร (ตร.ม.)') }, { title: 'ตารางเมตร', symbol: 'ตร.ม.', full: 'ตารางเมตร (ตร.ม.)' });
    assert.deepEqual({ ...ctx.splitUnitLabel({ name: 'เซลเซียส (°C)', code: 'C' }) }, { title: 'เซลเซียส', symbol: '°C', full: 'เซลเซียส (°C)' });
    assert.deepEqual({ ...ctx.splitUnitLabel('ไร่') }, { title: 'ไร่', symbol: '', full: 'ไร่' });

    // 2. Area conversions (0: Rai, 1: Ngan, 2: Sq.Wa, 3: Sq.m) & Thai land breakdown
    assert.equal(ctx.convertUnitValue('area', 1, 0, 1), 4);
    assert.equal(ctx.convertUnitValue('area', 1, 0, 2), 400);
    assert.equal(ctx.convertUnitValue('area', 1, 0, 3), 1600);
    assert.ok(Math.abs(ctx.convertUnitValue('area', 1600, 3, 0) - 1) < 1e-9);

    const breakdown = ctx.calculateThaiAreaBreakdown(2150, ctx.UNIT_CATEGORIES.area.units[3]);
    assert.equal(breakdown.totalSqm, 2150);
    assert.equal(breakdown.rai, 1);
    assert.equal(breakdown.ngan, 1);
    assert.ok(Math.abs(breakdown.sqWa - 37.5) < 1e-9);
    assert.deepEqual({ ...ctx.calculateThaiAreaBreakdown(0, ctx.UNIT_CATEGORIES.area.units[3]) }, { totalSqm: 0, rai: 0, ngan: 0, sqWa: 0 });
    assert.deepEqual({ ...ctx.calculateThaiAreaBreakdown(-10, ctx.UNIT_CATEGORIES.area.units[3]) }, { totalSqm: 0, rai: 0, ngan: 0, sqWa: 0 });

    // 3. Length (0: km, 1: m, 2: cm), weight (0: kg, 1: g, 5: baht gold 15.244g), and volume (0: L, 1: mL)
    assert.equal(ctx.convertUnitValue('length', 2.5, 0, 1), 2500);
    assert.equal(ctx.convertUnitValue('length', 1.5, 1, 2), 150);
    assert.ok(Math.abs(ctx.convertUnitValue('weight', 1, 5, 1) - 15.244) < 1e-9);
    assert.ok(Math.abs(ctx.convertUnitValue('weight', 2, 0, 1) - 2000) < 1e-9);
    assert.equal(ctx.convertUnitValue('volume', 1.5, 0, 1), 1500);

    // 4. Special temperature formulas (0: C, 1: F, 2: K) including negative and zero values
    assert.ok(Math.abs(ctx.convertUnitValue('temp', 0, 0, 1) - 32) < 1e-9);
    assert.ok(Math.abs(ctx.convertUnitValue('temp', 100, 0, 1) - 212) < 1e-9);
    assert.ok(Math.abs(ctx.convertUnitValue('temp', -40, 0, 1) - (-40)) < 1e-9);
    assert.ok(Math.abs(ctx.convertUnitValue('temp', 0, 0, 2) - 273.15) < 1e-9);
    assert.ok(Math.abs(ctx.convertUnitValue('temp', 273.15, 2, 0) - 0) < 1e-9);
    assert.ok(Math.abs(ctx.convertUnitValue('temp', 32, 1, 2) - 273.15) < 1e-9);
    assert.ok(Math.abs(ctx.convertUnitValue('temp', 373.15, 2, 1) - 212) < 1e-9);
    assert.equal(ctx.convertUnitValue('temp', 37, 0, 0), 37);

    // 5. Invalid numeric input returns NaN safely
    assert.ok(Number.isNaN(ctx.convertUnitValue('area', NaN, 0, 3)));
});

test('unit wheel picker UI: 2-column & 1-column markup, accessibility attributes, theme compliance, and interactions', () => {
    const appState = {
        activeToolId: 'unit',
        activeFieldIndex: 0,
        unit: { cat: 'area', val: '2', fromIdx: 0, targetIdx: 3 }
    };
    const banners = [];
    let renderCalls = 0;
    const ctx = context({
        window: { matchMedia: () => ({ matches: false }) },
        appState,
        setStatusBanner(type, msg) { banners.push({ type, msg }); },
        renderActiveTool() { renderCalls++; },
        attachFieldClickListeners() {}
    });

    // 1. Verify reusable 1-column and 2-column wheel generator functions
    const singleWheel = ctx.createWheelPickerHTML({
        columns: [{
            wheelId: 'testSingleWheel',
            selectId: 'testSingleSel',
            badgeId: 'testSingleBadge',
            label: 'หน่วยทดสอบ',
            items: [{ name: 'กิโลกรัม (kg)' }, { name: 'กรัม (g)' }],
            selectedIndex: 0
        }]
    });
    assert.ok(singleWheel.includes('is-single-col'), '1-column mode uses is-single-col class');
    assert.ok(singleWheel.includes('role="listbox"'));
    assert.ok(singleWheel.includes('role="option"'));
    assert.ok(singleWheel.includes('aria-selected="true"'));
    assert.ok(singleWheel.includes('id="testSingleSel"'), 'accessible select fallback is rendered');
    assert.equal((singleWheel.match(/class="unit-wheel-band"/g) || []).length, 1, 'one shared highlight band');
    const twoCol = ctx.createWheelPickerHTML({ columns: [
        { wheelId: 'a', bandId: 'bandA', valueText: '12', items: [{ name: 'กรัม (g)' }], selectedIndex: 0 },
        { wheelId: 'b', bandId: 'bandB', valueText: '0.012', items: [{ name: 'กิโลกรัม (kg)' }], selectedIndex: 0 }
    ] });
    assert.equal((twoCol.match(/class="unit-wheel-band"/g) || []).length, 1, 'two columns still share a single band');
    assert.ok(twoCol.includes('id="bandAValue"') && twoCol.includes('>12<') && twoCol.includes('>0.012<'), 'band shows each column value');

    // 2. Build a lightweight DOM harness to test renderUnitConverterTool + bindWheelColumn interactions
    function createMockElement(tag, attrs = {}) {
        const listeners = {};
        const classes = new Set((attrs.className || '').split(/\s+/).filter(Boolean));
        const attributes = { ...(attrs.attributes || {}) };
        const el = {
            tagName: tag.toUpperCase(),
            id: attrs.id || '',
            value: attrs.value !== undefined ? String(attrs.value) : '',
            textContent: attrs.textContent || '',
            innerHTML: '',
            scrollTop: 0,
            attributes,
            classList: {
                add(...names) { names.forEach(n => classes.add(n)); },
                remove(...names) { names.forEach(n => classes.delete(n)); },
                toggle(name, force) {
                    if (force === undefined) {
                        if (classes.has(name)) { classes.delete(name); return false; }
                        classes.add(name); return true;
                    }
                    if (force) classes.add(name); else classes.delete(name);
                    return Boolean(force);
                },
                contains(name) { return classes.has(name); }
            },
            setAttribute(k, v) { this.attributes[k] = String(v); },
            getAttribute(k) { return this.attributes[k]; },
            addEventListener(type, fn) {
                if (!listeners[type]) listeners[type] = [];
                listeners[type].push(fn);
            },
            dispatch(type, eventInit = {}) {
                const ev = {
                    type,
                    target: this,
                    currentTarget: this,
                    preventDefault() { this.defaultPrevented = true; },
                    ...eventInit
                };
                for (const fn of (listeners[type] || [])) fn(ev);
                return ev;
            },
            closest(sel) {
                if (sel === '[data-unit-index]' && this.attributes['data-unit-index'] !== undefined) return this;
                if (sel === '[data-related-unit-idx]' && this.attributes['data-related-unit-idx'] !== undefined) return this;
                return null;
            },
            querySelector() { return null; },
            querySelectorAll() { return []; }
        };
        return el;
    }

    function createHarnessContainer() {
        const bySelector = {};
        const units = ctx.UNIT_CATEGORIES[appState.unit.cat].units;
        const makeWheelOptionList = (wheelId) => units.map((_, idx) => createMockElement('button', {
            id: wheelId + '-item-' + idx,
            attributes: {
                'data-unit-index': String(idx),
                'aria-selected': idx === 0 ? 'true' : 'false'
            }
        }));

        const fromOpts = makeWheelOptionList('unitFromWheel');
        const toOpts = makeWheelOptionList('unitToWheel');

        const fromWheel = createMockElement('div', { id: 'unitFromWheel' });
        fromWheel.querySelectorAll = (sel) => sel === '[data-unit-index]' ? fromOpts : [];
        const toWheel = createMockElement('div', { id: 'unitToWheel' });
        toWheel.querySelectorAll = (sel) => sel === '[data-unit-index]' ? toOpts : [];

        const suffixSpan = createMockElement('span', { className: 'text-xs' });
        const inputBox = createMockElement('div');
        inputBox.querySelector = (sel) => sel === 'span.text-xs' ? suffixSpan : null;

        bySelector['[data-field-index="0"]'] = inputBox;
        bySelector['#unitCatSel'] = createMockElement('select', { id: 'unitCatSel', value: appState.unit.cat });
        bySelector['#unitSwapBtn'] = createMockElement('button', { id: 'unitSwapBtn' });
        bySelector['#unitFromWheel'] = fromWheel;
        bySelector['#unitToWheel'] = toWheel;
        bySelector['#unitFromSel'] = createMockElement('select', { id: 'unitFromSel', value: appState.unit.fromIdx });
        bySelector['#unitToSel'] = createMockElement('select', { id: 'unitToSel', value: appState.unit.targetIdx });
        bySelector['#unitFromActiveBadge'] = createMockElement('div', { id: 'unitFromActiveBadge' });
        bySelector['#unitToActiveBadge'] = createMockElement('div', { id: 'unitToActiveBadge' });
        bySelector['#unitPairSummary'] = createMockElement('span', { id: 'unitPairSummary' });
        bySelector['#unitSourceSummary'] = createMockElement('div', { id: 'unitSourceSummary' });
        bySelector['#unitToBandValue'] = createMockElement('span', { id: 'unitToBandValue' });
        bySelector['#unitTargetName'] = createMockElement('span', { id: 'unitTargetName' });
        bySelector['#unitRateSummary'] = createMockElement('div', { id: 'unitRateSummary' });
        bySelector['#unitAreaSummary'] = createMockElement('div', { id: 'unitAreaSummary' });
        bySelector['#unitRelatedList'] = createMockElement('div', { id: 'unitRelatedList' });

        return {
            innerHTML: '',
            querySelector(sel) { return bySelector[sel] || null; },
            querySelectorAll() { return []; },
            elements: bySelector,
            fromOpts,
            toOpts,
            suffixSpan
        };
    }

    const container = createHarnessContainer();
    ctx.renderUnitConverterTool(container);

    // 3. Theme & design system check: no hardcoded hex/rgb colors or banned classes in generated markup
    assert.ok(container.innerHTML.includes('unit-converter-tool'));
    assert.ok(container.innerHTML.includes('id="unitFromWheel"'));
    assert.ok(container.innerHTML.includes('id="unitToWheel"'));
    assert.ok(container.innerHTML.includes('id="unitFromSel"'));
    assert.ok(container.innerHTML.includes('id="unitToSel"'));
    assert.ok(container.innerHTML.includes('id="numeric-field-0"'));
    assert.ok(container.innerHTML.includes('3,200'), '2 rai = 3,200 sq.m. rendered initially');
    assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(container.innerHTML), 'No hardcoded HEX colors in unit converter markup');
    assert.ok(!/\b(bg-white|text-gray-|border-gray-|dark:)\b/.test(container.innerHTML), 'No banned Tailwind color classes');

    // 4. Keyboard navigation on source wheel (0: Rai -> 1: Ngan via ArrowDown)
    container.elements['#unitFromWheel'].dispatch('keydown', { key: 'ArrowDown' });
    assert.equal(appState.unit.fromIdx, 1, 'ArrowDown moves source unit from Rai (0) to Ngan (1)');
    assert.equal(container.elements['#unitFromSel'].value, '1', 'Accessible select fallback stays synced');
    assert.equal(container.elements['#unitToBandValue'].textContent, '800', '2 Ngan = 800 Sq.m updated immediately');
    assert.equal(container.suffixSpan.textContent, 'งาน', 'Keypad field suffix shows the Thai unit name');
    assert.equal(renderCalls, 0, 'Wheel selection updates in-place without full re-render');

    // 5. Mouse wheel on target wheel (3: Sq.m -> 2: Sq.Wa)
    container.elements['#unitToWheel'].dispatch('wheel', { deltaY: -40 });
    assert.equal(appState.unit.targetIdx, 2, 'Negative wheel delta steps target unit up from Sq.m (3) to Sq.Wa (2)');
    assert.equal(container.elements['#unitToSel'].value, '2');
    assert.equal(container.elements['#unitToBandValue'].textContent, '200', '2 Ngan = 200 Sq.Wa');

    // 6. Native accessible <select> fallback updates wheel and calculation
    container.elements['#unitFromSel'].value = '0';
    container.elements['#unitFromSel'].dispatch('change', { target: container.elements['#unitFromSel'] });
    assert.equal(appState.unit.fromIdx, 0);
    assert.equal(container.elements['#unitToBandValue'].textContent, '800', '2 Rai = 800 Sq.Wa');

    // 7. Tap/click on a wheel option item (target -> 3: Sq.m)
    container.elements['#unitToWheel'].dispatch('click', { target: container.toOpts[3] });
    assert.equal(appState.unit.targetIdx, 3);
    assert.equal(container.elements['#unitToBandValue'].textContent, '3,200', '2 Rai = 3,200 Sq.m');

    // 8. Swap button swaps source and target units in-place
    container.elements['#unitSwapBtn'].dispatch('click');
    assert.equal(appState.unit.fromIdx, 3);
    assert.equal(appState.unit.targetIdx, 0);
    assert.equal(container.elements['#unitToBandValue'].textContent, '0.00125', '2 Sq.m = 0.00125 Rai');

    // 9. Related unit row click selects target unit
    const relatedRow = createMockElement('button', { attributes: { 'data-related-unit-idx': '2' } });
    container.elements['#unitRelatedList'].dispatch('click', { target: relatedRow });
    assert.equal(appState.unit.targetIdx, 2);
    assert.equal(container.elements['#unitToBandValue'].textContent, '0.5', '2 Sq.m = 0.5 Sq.Wa');

    // 10. Category change resets default units for the selected category (temp: 0 -> 1) and triggers renderActiveTool
    container.elements['#unitCatSel'].value = 'temp';
    container.elements['#unitCatSel'].dispatch('change', { target: container.elements['#unitCatSel'] });
    assert.equal(appState.unit.cat, 'temp');
    assert.equal(appState.unit.fromIdx, 0);
    assert.equal(appState.unit.targetIdx, 1);
    assert.equal(renderCalls, 1);
});

test('wheel ignores layout-driven scrolls but honours user scrolls', () => {
    const ctx = context({});
    const listeners = {};
    const wheelEl = {
        id: 'w', scrollTop: 0,
        querySelectorAll: () => [],
        setAttribute() {},
        addEventListener(type, fn) { listeners[type] = fn; }
    };
    const selected = [];
    const ctrl = ctx.bindWheelColumn(wheelEl, { itemCount: 8, initialIndex: 3, itemHeight: 56, onSelect: (idx) => selected.push(idx) });
    assert.equal(ctrl.getIndex(), 3);
    // A scroll to 0 with no touch/mouse interaction (e.g. layout not ready after a re-render) must not reset the index.
    wheelEl.scrollTop = 0;
    listeners.scroll();
    assert.deepEqual(selected, [], 'stray scroll does not select');
    assert.equal(ctrl.getIndex(), 3);
    // After a real touch, scrolling selects normally.
    listeners.touchstart();
    wheelEl.scrollTop = 5 * 56;
    listeners.scroll();
    assert.deepEqual(selected, [5]);
    assert.equal(ctrl.getIndex(), 5);
});
