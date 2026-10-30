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
    'src/tools/engineering.js',
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

test('catalog contains exactly 47 tools classified into 6 valid groups with search keywords', () => {
    const { TOOL_GROUPS, TOOLS_CATALOG } = require('../src/catalog.js');
    assert.ok(Array.isArray(TOOL_GROUPS) && Array.isArray(TOOLS_CATALOG), 'Missing TOOL_GROUPS or TOOLS_CATALOG definitions');
    assert.equal(TOOL_GROUPS.length, 6);
    assert.equal(TOOLS_CATALOG.length, 47);
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

    assert.equal(ctx.TOOLS_CATALOG.length, 47);

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

test('all 47 tool renderers are modularized and exported across the 6 tool groups', () => {
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
        food_costing:      'renderFoodCostingTool',
        btu_calc:          'renderBtuTool',
        land_fill_calc: 'renderLandFillTool',
        wall_ceiling_calc: 'renderWallCeilingTool',
        roof_steel_calc: 'renderRoofSteelTool',
        contractor_payment: 'renderContractorPaymentTool',
        plumbing_pump: 'renderPlumbingTool',
        inch_fraction: 'renderInchFractionTool',
        shape_calc: 'renderShapeTool',
        wire_breaker: 'renderWireBreakerTool',
        conduit_fill: 'renderConduitFillTool',
        wire_data: 'renderWireDataTool'
    };

    assert.equal(Object.keys(rendererMap).length, 47);

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

test('btu_calc: room load, standard size selection and fixed vs inverter electricity cost', () => {
    const ctx = context();
    const base = { width: '4', length: '4', height: '2.8', btuPerSqm: '750', hoursPerDay: '8', ratePerKwh: '4.5', fixedSeer: '11', inverterSeer: '20' };

    // 4x4 m bedroom at 750 BTU/sqm = 12,000 BTU -> exactly a 12,000 BTU unit
    const bedroom = ctx.calculateBtu(base);
    assert.equal(bedroom.valid, true);
    assert.equal(bedroom.areaSqm, 16);
    assert.equal(bedroom.requiredBtu, 12000);
    assert.equal(bedroom.recommendedBtu, 12000);
    assert.equal(bedroom.units, 1);
    assert.equal(bedroom.exceedsStandard, false);

    // Electricity: watts = BTU / SEER, 8 h/day x 30 days x 4.5 THB/kWh
    assert.ok(Math.abs(bedroom.inverter.watts - 600) < 1e-9);
    assert.ok(Math.abs(bedroom.inverter.kwhPerMonth - 144) < 1e-9);
    assert.ok(Math.abs(bedroom.inverter.costPerMonth - 648) < 1e-9);
    assert.ok(Math.abs(bedroom.fixed.costPerMonth - (12000 / 11 / 1000) * 240 * 4.5) < 1e-9);
    assert.ok(Math.abs(bedroom.inverter.costPerYear - 648 * 12) < 1e-9);
    assert.ok(bedroom.savingsPerMonth > 0);

    // Required load just above a size rounds up to the next standard size
    assert.equal(ctx.calculateBtu({ ...base, width: '4', length: '5', btuPerSqm: '850' }).recommendedBtu, 18000);

    // Ceiling above 2.8 m scales the load linearly: 12,000 x 3.5/2.8 = 15,000
    const tall = ctx.calculateBtu({ ...base, height: '3.5' });
    assert.equal(tall.requiredBtu, 15000);
    assert.equal(tall.recommendedBtu, 15000);
    // Ceiling at or below 2.8 m does not reduce the load
    assert.equal(ctx.calculateBtu({ ...base, height: '2.4' }).requiredBtu, 12000);

    // Beyond the largest standard unit, report several 36,000 BTU units
    const shop = ctx.calculateBtu({ ...base, width: '10', length: '10', btuPerSqm: '1350' });
    assert.equal(shop.requiredBtu, 135000);
    assert.equal(shop.exceedsStandard, true);
    assert.equal(shop.recommendedBtu, 36000);
    assert.equal(shop.units, 4);

    // Thai digits and thousands separators are accepted
    assert.equal(ctx.calculateBtu({ ...base, width: '๔', length: '๔', btuPerSqm: '๗๕๐' }).requiredBtu, 12000);

    // Missing or invalid input is not calculated
    assert.equal(ctx.calculateBtu({ ...base, width: '' }).valid, false);
    assert.equal(ctx.calculateBtu({ ...base, length: '0' }).valid, false);
    assert.equal(ctx.calculateBtu({ ...base, btuPerSqm: 'abc' }).valid, false);
    assert.equal(ctx.calculateBtu({ ...base, hoursPerDay: '25' }).valid, false);
    assert.equal(ctx.calculateBtu({ ...base, inverterSeer: '0' }).valid, false);

    // Defaults apply when optional fields are left blank
    const defaults = ctx.calculateBtu({ width: '4', length: '4', btuPerSqm: '750' });
    assert.equal(defaults.valid, true);
    assert.equal(defaults.hoursPerDay, 8);
    assert.equal(defaults.ratePerKwh, 4.5);
});

test('wire_breaker: pure engine calculation according to EIT 2021 standards', () => {
    const ctx = context();

    // 1. Water Heater 3,500W, Conduit (THW), 15m, 230V, PF 1.0 (resistive)
    // I = 3500 / 230 = 15.22 A. Non-continuous -> designCurrent = 15.22 A
    // Breaker >= 15.22 -> 16 A
    // Wire: Conduit (THW) ampacity >= 16 A -> 2.5 sq.mm. (21 A)
    // VD = (18 mV/A/m * 15.22 * 15) / 1000 = 4.11 V -> 1.79% (<= 3%)
    const wh3500 = ctx.calculateWireBreaker({
        watts: '3500',
        voltage: '230',
        powerFactor: '1.0',
        wireLengthM: '15',
        installMethod: 'conduit',
        isContinuous: false
    });
    assert.equal(wh3500.valid, true);
    assert.equal(wh3500.loadCurrent, 15.22);
    assert.equal(wh3500.recommendedBreaker, 16);
    assert.equal(wh3500.wireSizeSqmm, 2.5);
    assert.equal(wh3500.wireAmpacity, 21);
    assert.equal(wh3500.wireType, 'IEC 01 (THW)');
    assert.equal(wh3500.isVdExceeded, false);

    // 2. EV Charger 7.4 kW (32A), continuous (x1.25), Conduit (THW), 20m, 230V, PF 1.0
    // I = 7400 / 230 = 32.17 A. Continuous -> designCurrent = 32.17 * 1.25 = 40.22 A
    // Breaker >= 40.22 -> 50 A
    // Wire: Conduit ampacity >= 50 A -> 10.0 sq.mm. (50 A)
    const evCharger = ctx.calculateWireBreaker({
        watts: '7400',
        voltage: '230',
        powerFactor: '1.0',
        wireLengthM: '20',
        installMethod: 'conduit',
        isContinuous: true
    });
    assert.equal(evCharger.valid, true);
    assert.equal(evCharger.recommendedBreaker, 50);
    assert.equal(evCharger.wireSizeSqmm, 10.0);
    assert.equal(evCharger.wireAmpacity, 50);

    // 3. Surface installation (VAF): 4,500W water heater
    // I = 4500 / 230 = 19.57 A -> Breaker 20 A
    // Surface (VAF) table: 2.5 sq.mm. is 23 A >= 20 A -> 2.5 sq.mm.
    const whSurface = ctx.calculateWireBreaker({
        watts: '4500',
        voltage: '230',
        powerFactor: '1.0',
        wireLengthM: '10',
        installMethod: 'surface',
        isContinuous: false
    });
    assert.equal(whSurface.valid, true);
    assert.equal(whSurface.recommendedBreaker, 20);
    assert.equal(whSurface.wireSizeSqmm, 2.5);
    assert.equal(whSurface.wireAmpacity, 23);
    assert.equal(whSurface.wireType, 'VAF / VAF-G');

    // 4. Voltage drop upgrade check (long distance: 60m with 15A load)
    // Normally 2.5 sq.mm. handles 16A breaker, but with 60m:
    // 2.5 sq.mm.: VD = (18 * 15 * 60) / 1000 = 16.2 V -> 7.04% (> 3%)
    // Must upgrade wire size until VD <= 3.0%
    const longDist = ctx.calculateWireBreaker({
        watts: '3450', // 15A at 230V
        voltage: '230',
        powerFactor: '1.0',
        wireLengthM: '60',
        installMethod: 'conduit',
        isContinuous: false
    });
    assert.equal(longDist.valid, true);
    assert.equal(longDist.upgradedForVoltageDrop, true);
    assert.ok(longDist.wireSizeSqmm > 2.5);
    assert.ok(longDist.vdPct <= 3.0);

    // 5. Invalid / blank input safety
    assert.equal(ctx.calculateWireBreaker({ watts: '' }).valid, false);
    assert.equal(ctx.calculateWireBreaker({ watts: '0' }).valid, false);
    assert.equal(ctx.calculateWireBreaker({ watts: '-500' }).valid, false);
    assert.equal(ctx.calculateWireBreaker({ watts: '1000', powerFactor: '1.5' }).valid, false);
    assert.equal(ctx.calculateWireBreaker({ watts: '1000', voltage: 'abc' }).valid, false);

    // 6. Load beyond the largest standard breaker (100 A) must not be answered with a 100 A breaker
    const tooBig = ctx.calculateWireBreaker({ watts: '30000', voltage: '230', powerFactor: '1.0', wireLengthM: '10', installMethod: 'conduit' });
    assert.equal(tooBig.valid, true);
    assert.equal(tooBig.selectionStatus, 'breaker_out_of_range');
    assert.equal(tooBig.recommendedBreaker, null);
    assert.equal(tooBig.wireSizeSqmm, null);

    // 7. VAF goes up to 16 sq.mm. (74 A): a 63 A breaker is served by 16 sq.mm. VAF, while an 80 A breaker has no VAF wire.
    // In conduit the 63 A load uses 16 sq.mm. (66 A)
    const surfaceBig = ctx.calculateWireBreaker({ watts: '14000', voltage: '230', powerFactor: '1.0', wireLengthM: '10', installMethod: 'surface' });
    assert.equal(surfaceBig.selectionStatus, 'ok');
    assert.equal(surfaceBig.recommendedBreaker, 63);
    assert.equal(surfaceBig.wireSizeSqmm, 16);
    assert.equal(surfaceBig.wireAmpacity, 74);
    const surfaceHuge = ctx.calculateWireBreaker({ watts: '18000', voltage: '230', powerFactor: '1.0', wireLengthM: '10', installMethod: 'surface' });
    assert.equal(surfaceHuge.selectionStatus, 'no_suitable_wire');
    assert.equal(surfaceHuge.recommendedBreaker, 80);
    assert.equal(surfaceHuge.wireSizeSqmm, null);
    assert.equal(surfaceHuge.wireAmpacity, null);
    const conduitBig = ctx.calculateWireBreaker({ watts: '14000', voltage: '230', powerFactor: '1.0', wireLengthM: '10', installMethod: 'conduit' });
    assert.equal(conduitBig.selectionStatus, 'ok');
    assert.equal(conduitBig.recommendedBreaker, 63);
    assert.equal(conduitBig.wireSizeSqmm, 16);
    assert.equal(conduitBig.wireAmpacity, 66);

    // 8. Voltage drop cannot be fixed by any table size: use the largest wire and keep the warning
    const farConduit = ctx.calculateWireBreaker({ watts: '3450', voltage: '230', powerFactor: '1.0', wireLengthM: '500', installMethod: 'conduit' });
    assert.equal(farConduit.selectionStatus, 'ok');
    assert.equal(farConduit.wireSizeSqmm, 35);
    assert.equal(farConduit.upgradedForVoltageDrop, true);
    assert.equal(farConduit.isVdExceeded, true);
    const farSurface = ctx.calculateWireBreaker({ watts: '4500', voltage: '230', powerFactor: '1.0', wireLengthM: '100', installMethod: 'surface' });
    assert.equal(farSurface.selectionStatus, 'ok');
    assert.equal(farSurface.wireSizeSqmm, 16);
    assert.equal(farSurface.isVdExceeded, false);
    assert.equal(farSurface.upgradedForVoltageDrop, true);
    assert.ok(farSurface.wireAmpacity > 0);
    const farSurface2 = ctx.calculateWireBreaker({ watts: '4500', voltage: '230', powerFactor: '1.0', wireLengthM: '200', installMethod: 'surface' });
    assert.equal(farSurface2.wireSizeSqmm, 16);
    assert.equal(farSurface2.isVdExceeded, true);

    // 9. Resistive presets carry PF 1.0, so a 3,500 W heater needs a 16 A breaker (not 20 A at PF 0.95)
    const heater = ctx.WIRE_APPLIANCE_PRESETS.find(p => p.key === 'water_3500');
    assert.equal(heater.powerFactor, 1.0);
    const fromPreset = ctx.calculateWireBreaker({ watts: String(heater.watts), powerFactor: String(heater.powerFactor), voltage: '230', wireLengthM: '15' });
    assert.equal(fromPreset.recommendedBreaker, 16);
    assert.ok(ctx.WIRE_APPLIANCE_PRESETS.every(p => p.powerFactor > 0 && p.powerFactor <= 1));

    // 10. Data checked against the manufacturer reproductions of the EIT tables (Yazaki, BCC): no row is flagged unverified
    assert.equal(ctx.WIRE_VD_DATA_VERIFIED, true);
    assert.equal(wh3500.ampacityUnverified, false);
    assert.equal(wh3500.voltageDropDataUnverified, false);
    assert.equal(conduitBig.ampacityUnverified, false);
    assert.deepEqual(Array.from(ctx.WIRE_SPEC_TABLE.filter(w => !w.ampacityVerified).map(w => w.sizeSqmm)), []);
    // Table 5-20 (conduit, group 2, 2 loaded conductors, single-core) and 5-21 (VAF, group 3) values as printed
    assert.deepEqual(Array.from(ctx.WIRE_SPEC_TABLE, w => w.conduitAmp), [0, 15, 21, 28, 36, 50, 66, 88, 109]);
    assert.deepEqual(Array.from(ctx.WIRE_SPEC_TABLE, w => w.surfaceAmp), [14, 17, 23, 32, 41, 56, 74, 0, 0]);
    // mV/A/m for single-core 70C cable, single phase, group 1-2
    assert.deepEqual(Array.from(ctx.WIRE_SPEC_TABLE, w => w.mVPerAmpMeter), [44, 29, 18, 11, 7.3, 4.4, 2.8, 1.81, 1.33]);
    const wire25 = ctx.calculateWireBreaker({ watts: '18000', voltage: '230', powerFactor: '1.0', wireLengthM: '10', installMethod: 'conduit' });
    assert.equal(wire25.recommendedBreaker, 80);
    assert.equal(wire25.wireSizeSqmm, 25);
    assert.equal(wire25.ampacityUnverified, false);
    assert.equal(wire25.wireAmpacity, 88);
    assert.equal(farConduit.ampacityUnverified, false);
    assert.equal(tooBig.voltageDropDataUnverified, false);
    assert.equal(surfaceBig.voltageDropDataUnverified, false);

});

test('btu_calc: catalog entry, keypad fields and invalid-input detection are wired up', () => {
    const { TOOL_GROUPS, TOOLS_CATALOG } = require('../src/catalog.js');
    assert.ok(TOOL_GROUPS.some(g => g.id === 'engineering'));
    assert.equal(TOOLS_CATALOG.find(t => t.id === 'btu_calc').group, 'engineering');
    assert.equal(TOOLS_CATALOG.find(t => t.id === 'construction_calc').group, 'engineering');

    const ctx = context();
    const state = { btu_calc: { width: '4', length: '4', height: '2.8', btuPerSqm: '750', hoursPerDay: '8', ratePerKwh: '4.5', fixedSeer: '11', inverterSeer: '20' } };
    assert.equal(ctx.hasInvalidNumericInput('btu_calc', state), false);
    assert.equal(ctx.hasInvalidNumericInput('btu_calc', { btu_calc: { ...state.btu_calc, width: '4x' } }), true);
    assert.equal(ctx.hasInvalidNumericInput('btu_calc', { btu_calc: { ...state.btu_calc, inverterSeer: 'abc' } }), true);
});

test('land_fill_calc: Thai land units, compaction multiplier, truck trips and costs', () => {
    const ctx = context();
    const base = { mode: 'land', rai: '1', ngan: '0', wa: '0', heightCm: '50', shrinkPct: '25', truck6Cap: '5.5', truck10Cap: '11', pricePerM3: '', spreadPerM3: '' };

    // 1 rai = 1,600 sqm x 0.5 m = 800 m3 compacted; multiplier 1/(1-0.25) = 4/3 -> 1,066.67 m3 loose
    const rai = ctx.calculateLandFill(base);
    assert.equal(rai.valid, true);
    assert.equal(rai.areaSqm, 1600);
    assert.equal(rai.areaWa, 400);
    assert.equal(rai.compactedM3, 800);
    assert.ok(Math.abs(rai.multiplier - 4 / 3) < 1e-12);
    assert.ok(Math.abs(rai.looseM3 - 800 * 4 / 3) < 1e-9);
    assert.equal(rai.truck6.trips, Math.ceil(800 * 4 / 3 / 5.5));
    assert.equal(rai.truck10.trips, Math.ceil(800 * 4 / 3 / 11));

    // rai + ngan + wa: 2 rai 1 ngan 50 wa = 3,200 + 400 + 200 = 3,800 sqm
    assert.equal(ctx.calculateLandFill({ ...base, rai: '2', ngan: '1', wa: '50' }).areaSqm, 3800);
    // Blank rai/ngan/wa count as zero as long as one part is given
    assert.equal(ctx.calculateLandFill({ ...base, rai: '', ngan: '', wa: '100' }).areaSqm, 400);

    // Width x length mode ignores the rai fields
    const dim = ctx.calculateLandFill({ ...base, mode: 'dim', width: '20', length: '40', rai: '99' });
    assert.equal(dim.areaSqm, 800);
    assert.equal(dim.compactedM3, 400);

    // Exact multiples of truck capacity do not add a phantom trip: 16 m3 loose / 8 = 2 trips
    const exact = ctx.calculateLandFill({ ...base, mode: 'dim', width: '4', length: '4', heightCm: '100', shrinkPct: '0', truck10Cap: '8' });
    assert.equal(exact.looseM3, 16);
    assert.equal(exact.truck10.trips, 2);

    // Costs: soil on loose volume, spreading on compacted volume
    const cost = ctx.calculateLandFill({ ...base, mode: 'dim', width: '10', length: '10', heightCm: '100', shrinkPct: '20', pricePerM3: '150', spreadPerM3: '40' });
    assert.ok(Math.abs(cost.looseM3 - 125) < 1e-9);
    assert.ok(Math.abs(cost.soilCost - 125 * 150) < 1e-6);
    assert.ok(Math.abs(cost.spreadCost - 100 * 40) < 1e-6);
    assert.ok(Math.abs(cost.totalCost - (18750 + 4000)) < 1e-6);

    // Invalid input
    assert.equal(ctx.calculateLandFill({ ...base, heightCm: '' }).valid, false);
    assert.equal(ctx.calculateLandFill({ ...base, rai: '0', ngan: '0', wa: '0' }).valid, false);
    assert.equal(ctx.calculateLandFill({ ...base, shrinkPct: '90' }).valid, false);
    assert.equal(ctx.calculateLandFill({ ...base, shrinkPct: '-5' }).valid, false);
    assert.equal(ctx.calculateLandFill({ ...base, truck6Cap: '0' }).valid, false);
    assert.equal(ctx.calculateLandFill({ ...base, rai: 'abc' }).valid, false);
    assert.equal(ctx.calculateLandFill({ mode: 'dim', width: '', length: '5', heightCm: '50' }).valid, false);

    // Presets use the documented mid-range values and stay below the 90% limit
    assert.deepEqual(Array.from(ctx.LAND_FILL_SOIL_PRESETS, p => p.shrinkPct), [25, 30, 32.5]);

    // Invalid-input detection follows the active mode only
    const st = { mode: 'dim', width: '4x', length: '5', rai: '1', heightCm: '50', shrinkPct: '25', truck6Cap: '5.5', truck10Cap: '11', pricePerM3: '', spreadPerM3: '' };
    assert.equal(ctx.hasInvalidNumericInput('land_fill_calc', { land_fill_calc: st }), true);
    assert.equal(ctx.hasInvalidNumericInput('land_fill_calc', { land_fill_calc: { ...st, width: '4', rai: 'bad' } }), false);
});

test('wall_ceiling_calc: masonry bricks and plaster, ceiling panels, presets and validation', () => {
    const ctx = context();
    const wall = { wallLength: '5', wallHeight: '3', deductArea: '0', bricksPerSqm: '8.33', masonryWastePct: '5', plasterSides: '2', plasterCoverage: '2', brickPrice: '', plasterBagPrice: '', masonryLaborPerSqm: '', plasterLaborPerSqm: '' };

    // 5 x 3 m wall = 15 sqm; 15 x 8.33 x 1.05 = 131.2 -> 132 bricks; plaster 30 sqm / 2 = 15 bags
    const m = ctx.calculateMasonry(wall);
    assert.equal(m.valid, true);
    assert.equal(m.netAreaSqm, 15);
    assert.equal(m.bricks, Math.ceil(15 * 8.33 * 1.05));
    assert.equal(m.bricks, 132);
    assert.equal(m.plasterAreaSqm, 30);
    assert.equal(m.plasterBags, 15);
    assert.equal(m.totalCost, 0);

    // Deducting openings, one-sided plaster and no plaster
    const deducted = ctx.calculateMasonry({ ...wall, deductArea: '3.6', plasterSides: '1' });
    assert.ok(Math.abs(deducted.netAreaSqm - 11.4) < 1e-9);
    assert.equal(deducted.plasterBags, Math.ceil(11.4 / 2));
    const none = ctx.calculateMasonry({ ...wall, plasterSides: '0' });
    assert.equal(none.plasterAreaSqm, 0);
    assert.equal(none.plasterBags, 0);

    // Exact brick counts do not round up by floating-point noise: 10 sqm x 10 per sqm, no waste
    assert.equal(ctx.calculateMasonry({ ...wall, wallLength: '5', wallHeight: '2', bricksPerSqm: '10', masonryWastePct: '0' }).bricks, 100);

    // Costs: bricks + plaster bags + labor on wall area and plaster area
    const cost = ctx.calculateMasonry({ ...wall, brickPrice: '25', plasterBagPrice: '120', masonryLaborPerSqm: '180', plasterLaborPerSqm: '120' });
    assert.equal(cost.brickCost, 132 * 25);
    assert.equal(cost.plasterMaterialCost, 15 * 120);
    assert.equal(cost.laborCost, 15 * 180 + 30 * 120);
    assert.equal(cost.totalCost, 132 * 25 + 15 * 120 + 15 * 180 + 30 * 120);

    // Invalid masonry input
    assert.equal(ctx.calculateMasonry({ ...wall, wallLength: '' }).valid, false);
    assert.equal(ctx.calculateMasonry({ ...wall, deductArea: '15' }).valid, false);
    assert.equal(ctx.calculateMasonry({ ...wall, deductArea: '20' }).valid, false);
    assert.equal(ctx.calculateMasonry({ ...wall, plasterSides: '3' }).valid, false);
    assert.equal(ctx.calculateMasonry({ ...wall, bricksPerSqm: '0' }).valid, false);
    assert.equal(ctx.calculateMasonry({ ...wall, plasterCoverage: '0' }).valid, false);

    // Ceiling: 16 sqm / 2.88 x 1.10 = 6.11 -> 7 sheets; T-bar 0.36 sqm panels
    const ceil = { ceilingArea: '16', panelAreaSqm: '2.88', ceilingWastePct: '10', panelPrice: '', ceilingLaborPerSqm: '' };
    const c = ctx.calculateCeiling(ceil);
    assert.equal(c.valid, true);
    assert.ok(Math.abs(c.panelsExact - 16 / 2.88) < 1e-12);
    assert.equal(c.panels, 7);
    assert.equal(ctx.calculateCeiling({ ...ceil, ceilingArea: '36', panelAreaSqm: '0.36', ceilingWastePct: '0' }).panels, 100);
    const cc = ctx.calculateCeiling({ ...ceil, panelPrice: '190', ceilingLaborPerSqm: '180' });
    assert.equal(cc.totalCost, 7 * 190 + 16 * 180);
    assert.equal(ctx.calculateCeiling({ ...ceil, ceilingArea: '' }).valid, false);
    assert.equal(ctx.calculateCeiling({ ...ceil, panelAreaSqm: '0' }).valid, false);
    assert.equal(ctx.calculateCeiling({ ...ceil, ceilingWastePct: '-1' }).valid, false);

    // Presets: derived sizes and the unverified flag on masonry red brick counts
    assert.equal(ctx.CEILING_PANEL_PRESETS.find(p => p.key === 'gypsum').areaSqm, 2.88);
    assert.equal(ctx.CEILING_PANEL_PRESETS.find(p => p.key === 'tbar').areaSqm, 0.36);
    assert.ok(Math.abs(1 / (0.2 * 0.6) - 8.33) < 0.01);
    assert.deepEqual(Array.from(ctx.MASONRY_BRICK_PRESETS.filter(p => p.source === 'unverified'), p => p.key), ['red_half', 'red_full']);

    // Invalid-input detection follows the active tab only
    const st = { ...wall, tab: 'masonry', ...ceil, ceilingArea: 'x1' };
    assert.equal(ctx.hasInvalidNumericInput('wall_ceiling_calc', { wall_ceiling_calc: st }), false);
    assert.equal(ctx.hasInvalidNumericInput('wall_ceiling_calc', { wall_ceiling_calc: { ...st, tab: 'ceiling' } }), true);
    assert.equal(ctx.hasInvalidNumericInput('wall_ceiling_calc', { wall_ceiling_calc: { ...st, wallHeight: '3m' } }), true);
});

test('roof_steel_calc: roof geometry, steel cutting plan, rebar weight and concrete volume', () => {
    const ctx = context();
    const roof = { roofRun: '4', roofLength: '6', roofAngle: '15', roofOverhang: '0.5', roofSides: '1', sheetWidth: '0.76', purlinSpacing: '1', screwsPerSqm: '5', roofPricePerSqm: '' };

    // Rafter = run / cos(angle); sheet length = rafter + overhang; rise = run x tan(angle)
    const r = ctx.calculateRoof(roof);
    const rad = 15 * Math.PI / 180;
    assert.equal(r.valid, true);
    assert.ok(Math.abs(r.rafterM - 4 / Math.cos(rad)) < 1e-12);
    assert.ok(Math.abs(r.riseM - 4 * Math.tan(rad)) < 1e-12);
    assert.ok(Math.abs(r.slopeLengthM - (4 / Math.cos(rad) + 0.5)) < 1e-12);
    assert.ok(Math.abs(r.areaSqm - r.slopeLengthM * 6) < 1e-9);
    assert.equal(r.sheets, Math.ceil(6 / 0.76));
    assert.equal(r.sheets, 8);
    assert.equal(r.purlinRows, Math.ceil(r.slopeLengthM / 1) + 1);
    assert.equal(r.purlinStock, Math.ceil(r.purlinRows * 6 / 6));
    assert.equal(r.screws, Math.ceil(r.areaSqm * 5));

    // Flat roof and gable (two sides double area, sheets and purlin rows)
    const flat = ctx.calculateRoof({ ...roof, roofAngle: '0', roofOverhang: '0' });
    assert.equal(flat.rafterM, 4);
    assert.equal(flat.riseM, 0);
    const gable = ctx.calculateRoof({ ...roof, roofSides: '2' });
    assert.ok(Math.abs(gable.areaSqm - r.areaSqm * 2) < 1e-9);
    assert.equal(gable.sheets, r.sheets * 2);
    assert.equal(gable.purlinRows, r.purlinRows * 2);
    assert.equal(ctx.calculateRoof({ ...roof, roofPricePerSqm: '350' }).totalCost, r.areaSqm * 350);

    // Invalid roof input
    assert.equal(ctx.calculateRoof({ ...roof, roofRun: '' }).valid, false);
    assert.equal(ctx.calculateRoof({ ...roof, roofAngle: '80' }).valid, false);
    assert.equal(ctx.calculateRoof({ ...roof, roofAngle: '-1' }).valid, false);
    assert.equal(ctx.calculateRoof({ ...roof, sheetWidth: '0' }).valid, false);
    assert.equal(ctx.calculateRoof({ ...roof, purlinSpacing: '0' }).valid, false);

    // Cutting: 2.4 x4, 1.2 x6 from 6 m bars. Total 9.6 + 7.2 = 16.8 m -> 3 bars (18 m), waste 1.2 m
    const cut = { stockLen: '6', kerfMm: '0', pieces: [{ id: '1', length: '2.4', qty: '4' }, { id: '2', length: '1.2', qty: '6' }] };
    const c = ctx.calculateCutting(cut);
    assert.equal(c.valid, true);
    assert.equal(c.pieceCount, 10);
    assert.ok(Math.abs(c.pieceTotalM - 16.8) < 1e-9);
    assert.equal(c.barCount, 3);
    assert.ok(Math.abs(c.wasteM - 1.2) < 1e-9);
    assert.ok(Math.abs(c.wastePct - (1.2 / 18) * 100) < 1e-9);
    assert.equal(c.bars.reduce((n, b) => n + b.pieces.length, 0), 10);
    assert.ok(c.bars.every(b => b.usedM <= 6 + 1e-9));

    // Kerf is charged between pieces in the same bar: 3 x 2.0 m fits in 6 m only without kerf
    const noKerf = ctx.calculateCutting({ stockLen: '6', kerfMm: '0', pieces: [{ id: '1', length: '2', qty: '3' }] });
    assert.equal(noKerf.barCount, 1);
    const kerf = ctx.calculateCutting({ stockLen: '6', kerfMm: '3', pieces: [{ id: '1', length: '2', qty: '3' }] });
    assert.equal(kerf.barCount, 2);

    // Blank rows are ignored, oversize pieces and bad input are reported
    assert.equal(ctx.calculateCutting({ ...cut, pieces: cut.pieces.concat([{ id: '3', length: '', qty: '' }]) }).pieceCount, 10);
    const tooLong = ctx.calculateCutting({ ...cut, pieces: [{ id: '1', length: '6.5', qty: '1' }] });
    assert.equal(tooLong.valid, false);
    assert.equal(tooLong.reason, 'piece_too_long');
    assert.equal(ctx.calculateCutting({ ...cut, pieces: [] }).reason, 'no_pieces');
    assert.equal(ctx.calculateCutting({ ...cut, pieces: [{ id: '1', length: 'x', qty: '1' }] }).reason, 'invalid_piece');
    assert.equal(ctx.calculateCutting({ ...cut, pieces: [{ id: '1', length: '1', qty: '1.5' }] }).reason, 'invalid_piece');
    assert.equal(ctx.calculateCutting({ ...cut, pieces: [{ id: '1', length: '0.001', qty: '2001' }] }).reason, 'too_many_pieces');
    assert.equal(ctx.calculateCutting({ ...cut, stockLen: '' }).valid, false);

    // Rebar: table weights agree with d^2/162 within rounding, DB12 x 10 bars x 6 m = 60 m x 0.888 = 53.28 kg
    for (const bar of ctx.REBAR_TABLE) assert.ok(Math.abs(bar.kgPerM - bar.diameterMm ** 2 / 162) < 0.01, bar.key);
    const rebar = ctx.calculateRebar({ rebarType: 'DB12', rebarBars: '10', rebarLength: '6', rebarPricePerKg: '25' });
    assert.equal(rebar.valid, true);
    assert.equal(rebar.totalLengthM, 60);
    assert.ok(Math.abs(rebar.weightKg - 53.28) < 1e-9);
    assert.equal(rebar.stockBars, 6);
    assert.ok(Math.abs(rebar.totalCost - 53.28 * 25) < 1e-9);
    assert.equal(ctx.calculateRebar({ rebarType: 'DB12', rebarBars: '7', rebarLength: '6' }).stockBars, 5);
    assert.equal(ctx.calculateRebar({ rebarType: 'XX', rebarBars: '10', rebarLength: '6' }).valid, false);
    assert.equal(ctx.calculateRebar({ rebarType: 'DB12', rebarBars: '2.5', rebarLength: '6' }).valid, false);
    assert.equal(ctx.calculateRebar({ rebarType: 'DB12', rebarBars: '10', rebarLength: '0' }).valid, false);

    // Concrete: 0.2 x 0.3 x 4 x 4 = 0.96 m3, +5% = 1.008
    const con = ctx.calculateConcreteVolume({ conWidth: '0.2', conDepth: '0.3', conLength: '4', conQty: '4', conWastePct: '5', conPricePerM3: '2000' });
    assert.equal(con.valid, true);
    assert.ok(Math.abs(con.netM3 - 0.96) < 1e-9);
    assert.ok(Math.abs(con.orderM3 - 1.008) < 1e-9);
    assert.ok(Math.abs(con.totalCost - 2016) < 1e-9);
    assert.equal(ctx.calculateConcreteVolume({ conWidth: '0.2', conDepth: '0', conLength: '4', conQty: '4' }).valid, false);
    assert.equal(ctx.calculateConcreteVolume({ conWidth: '0.2', conDepth: '0.3', conLength: '4', conQty: '0' }).valid, false);

    // Invalid-input detection follows the active tab, including cutting rows
    const base = { ...roof, ...cut, rebarType: 'DB12', rebarBars: '10', rebarLength: '6', conWidth: '0.2', conDepth: '0.3', conLength: '4', conQty: '4', conWastePct: '5' };
    assert.equal(ctx.hasInvalidNumericInput('roof_steel_calc', { roof_steel_calc: { ...base, tab: 'roof' } }), false);
    assert.equal(ctx.hasInvalidNumericInput('roof_steel_calc', { roof_steel_calc: { ...base, tab: 'roof', roofRun: '4m' } }), true);
    assert.equal(ctx.hasInvalidNumericInput('roof_steel_calc', { roof_steel_calc: { ...base, tab: 'cut', roofRun: '4m' } }), false);
    assert.equal(ctx.hasInvalidNumericInput('roof_steel_calc', { roof_steel_calc: { ...base, tab: 'cut', pieces: [{ id: '1', length: '2.4x', qty: '1' }] } }), true);
    assert.equal(ctx.hasInvalidNumericInput('roof_steel_calc', { roof_steel_calc: { ...base, tab: 'rebar', conDepth: 'abc' } }), true);
});

test('contractor_payment: installments, retention, VAT, withholding tax and validation', () => {
    const ctx = context();
    const rows = pcts => pcts.map((p, i) => ({ id: String(i + 1), pct: String(p) }));
    const base = { contractValue: '1200000', retentionPct: '5', whtPct: '3', vatRate: '7', applyVat: false, applyWht: false, installments: rows([30, 30, 30, 10]) };

    // No tax: gross 360k/360k/360k/120k, retention 5% each, net = gross - retention
    const plain = ctx.calculateContractorPayment(base);
    assert.equal(plain.valid, true);
    assert.deepEqual(Array.from(plain.items, i => i.gross), [360000, 360000, 360000, 120000]);
    assert.deepEqual(Array.from(plain.items, i => i.retention), [18000, 18000, 18000, 6000]);
    assert.deepEqual(Array.from(plain.items, i => i.net), [342000, 342000, 342000, 114000]);
    assert.equal(plain.totalGross, 1200000);
    assert.equal(plain.totalRetention, 60000);
    assert.equal(plain.retentionReleased, 60000);
    assert.equal(plain.totalNet, 1140000);
    assert.equal(plain.totalVat, 0);
    assert.equal(plain.totalWht, 0);

    // VAT and 3% withholding are computed on the installment value before VAT
    const taxed = ctx.calculateContractorPayment({ ...base, applyVat: true, applyWht: true });
    const first = taxed.items[0];
    assert.equal(first.vat, 25200);
    assert.equal(first.wht, 10800);
    assert.equal(first.net, 360000 + 25200 - 18000 - 10800);
    assert.equal(taxed.totalVat, 84000);
    assert.equal(taxed.totalWht, 36000);
    assert.equal(taxed.totalNet, 1200000 + 84000 - 60000 - 36000);

    // Rounding: the last installment absorbs the rounding difference so gross adds up exactly
    const odd = ctx.calculateContractorPayment({ ...base, contractValue: '100000', installments: rows([33.33, 33.33, 33.34]), retentionPct: '0' });
    assert.equal(odd.valid, true);
    assert.equal(odd.totalGross, 100000);
    assert.equal(odd.items[0].gross, 33330);
    assert.equal(odd.items[2].gross, 33340);
    const thirds = ctx.calculateContractorPayment({ ...base, contractValue: '100', installments: rows([33.3333, 33.3333, 33.3334]), retentionPct: '0' });
    assert.equal(thirds.totalGross, 100);

    // Zero retention and a single installment
    const single = ctx.calculateContractorPayment({ ...base, retentionPct: '0', installments: rows([100]) });
    assert.equal(single.items.length, 1);
    assert.equal(single.items[0].net, 1200000);

    // Percentages must add up to 100
    const short = ctx.calculateContractorPayment({ ...base, installments: rows([30, 30, 30]) });
    assert.equal(short.valid, false);
    assert.equal(short.reason, 'pct_sum');
    assert.equal(short.pctSum, 90);
    assert.equal(ctx.calculateContractorPayment({ ...base, installments: rows([60, 60]) }).reason, 'pct_sum');

    // Invalid input
    assert.equal(ctx.calculateContractorPayment({ ...base, contractValue: '' }).valid, false);
    assert.equal(ctx.calculateContractorPayment({ ...base, contractValue: '0' }).valid, false);
    assert.equal(ctx.calculateContractorPayment({ ...base, retentionPct: '101' }).valid, false);
    assert.equal(ctx.calculateContractorPayment({ ...base, installments: [] }).valid, false);
    assert.equal(ctx.calculateContractorPayment({ ...base, installments: rows([50, 'x', 50]) }).reason, 'invalid_installment');
    assert.equal(ctx.calculateContractorPayment({ ...base, installments: rows([-10, 110]) }).reason, 'invalid_installment');

    // Templates each add up to 100
    for (const tpl of ctx.CONTRACTOR_TEMPLATES) assert.equal(tpl.pcts.reduce((s, p) => s + p, 0), 100, tpl.key);

    // Invalid-input detection includes installment rows
    assert.equal(ctx.hasInvalidNumericInput('contractor_payment', { contractor_payment: base }), false);
    assert.equal(ctx.hasInvalidNumericInput('contractor_payment', { contractor_payment: { ...base, installments: rows([30, 'x', 30, 10]) } }), true);
    assert.equal(ctx.hasInvalidNumericInput('contractor_payment', { contractor_payment: { ...base, vatRate: '7%' } }), true);
});

test('plumbing_pump: tank sizing, standard sizes, pump ranges and validation', () => {
    const ctx = context();
    const base = { people: '4', litersPerPerson: '200', reserveDays: '1', houseType: 'two' };

    // 4 people x 200 L x 1 day = 800 L -> next standard tank is 1,000 L
    const a = ctx.calculatePlumbing(base);
    assert.equal(a.valid, true);
    assert.equal(a.dailyLiters, 800);
    assert.equal(a.requiredLiters, 800);
    assert.equal(a.tankSizeL, 1000);
    assert.equal(a.tankCount, 1);
    assert.equal(a.exceedsStandard, false);
    assert.equal(a.monthlyM3, 24);
    assert.equal(a.pumpMinW, 200);
    assert.equal(a.pumpMaxW, 250);

    // Exact standard size is not rounded up: 5 people x 200 x 1 = 1,000 L
    assert.equal(ctx.calculatePlumbing({ ...base, people: '5' }).tankSizeL, 1000);
    // 2 days reserve: 4 x 200 x 2 = 1,600 L -> 2,000 L
    assert.equal(ctx.calculatePlumbing({ ...base, reserveDays: '2' }).tankSizeL, 2000);
    // 1-2 people x 200 x 1 = 200-400 L -> 500 L
    assert.equal(ctx.calculatePlumbing({ ...base, people: '2' }).tankSizeL, 500);

    // Beyond the largest standard tank: several 3,000 L tanks
    const big = ctx.calculatePlumbing({ ...base, people: '20', reserveDays: '2' });
    assert.equal(big.requiredLiters, 8000);
    assert.equal(big.exceedsStandard, true);
    assert.equal(big.tankSizeL, 3000);
    assert.equal(big.tankCount, 3);
    assert.equal(big.installedLiters, 9000);

    // Pump ranges per house type match the reference document
    assert.deepEqual(Array.from(ctx.PLUMBING_HOUSE_TYPES, h => [h.minW, h.maxW]), [[100, 150], [200, 250], [300, 400]]);
    assert.equal(ctx.calculatePlumbing({ ...base, houseType: 'large' }).pumpMaxW, 400);

    // Blank liters/days use the 200 L and 1 day defaults
    const defaults = ctx.calculatePlumbing({ people: '4', litersPerPerson: '', reserveDays: '', houseType: 'single' });
    assert.equal(defaults.requiredLiters, 800);

    // Invalid input
    assert.equal(ctx.calculatePlumbing({ ...base, people: '' }).valid, false);
    assert.equal(ctx.calculatePlumbing({ ...base, people: '0' }).valid, false);
    assert.equal(ctx.calculatePlumbing({ ...base, people: '3.5' }).valid, false);
    assert.equal(ctx.calculatePlumbing({ ...base, people: '1001' }).valid, false);
    assert.equal(ctx.calculatePlumbing({ ...base, litersPerPerson: '0' }).valid, false);
    assert.equal(ctx.calculatePlumbing({ ...base, reserveDays: '8' }).valid, false);
    assert.equal(ctx.calculatePlumbing({ ...base, houseType: 'castle' }).valid, false);
    assert.equal(ctx.hasInvalidNumericInput('plumbing_pump', { plumbing_pump: base }), false);
    assert.equal(ctx.hasInvalidNumericInput('plumbing_pump', { plumbing_pump: { ...base, people: '4p' } }), true);
});

test('inch_fraction: inch, hun and millimetre conversion, fraction rounding and validation', () => {
    const ctx = context();
    const base = { mode: 'inch', whole: '1', num: '3', den: '8', mm: '', hun: '' };

    // 1 3/8 inch = 1.375 in = 34.925 mm = 11 hun
    const a = ctx.calculateInchConversion(base);
    assert.equal(a.valid, true);
    assert.equal(a.inches, 1.375);
    assert.ok(Math.abs(a.mm - 34.925) < 1e-9);
    assert.ok(Math.abs(a.cm - 3.4925) < 1e-9);
    assert.equal(a.hun, 11);

    // hun table: 1 hun = 1/8" = 3.175 mm ... 8 hun = 1" = 25.4 mm
    const hun4 = ctx.calculateInchConversion({ ...base, mode: 'hun', hun: '4' });
    assert.equal(hun4.inches, 0.5);
    assert.ok(Math.abs(hun4.mm - 12.7) < 1e-9);
    assert.equal(ctx.formatInchFraction(hun4.fraction), '1/2 นิ้ว');
    assert.ok(Math.abs(ctx.calculateInchConversion({ ...base, mode: 'hun', hun: '1' }).mm - 3.175) < 1e-9);
    assert.ok(Math.abs(ctx.calculateInchConversion({ ...base, mode: 'hun', hun: '8' }).mm - 25.4) < 1e-9);
    assert.equal(ctx.calculateInchConversion({ ...base, mode: 'hun', hun: '6' }).inches, 0.75);

    // mm -> nearest fraction: 12.7 mm is exactly 1/2"; 35 mm is 1 3/8" within 0.1 mm at 1/16 or finer
    const half = ctx.calculateInchConversion({ ...base, mode: 'mm', mm: '12.7', den: '16' });
    assert.equal(half.fraction.exact, true);
    assert.equal(ctx.formatInchFraction(half.fraction), '1/2 นิ้ว');
    assert.ok(half.errorMm < 1e-9);
    const m35 = ctx.calculateInchConversion({ ...base, mode: 'mm', mm: '35', den: '16' });
    assert.equal(ctx.formatInchFraction(m35.fraction), '1 3/8 นิ้ว');
    assert.equal(m35.fraction.exact, false);
    assert.ok(Math.abs(m35.errorMm - Math.abs(35 - 34.925)) < 1e-9);

    // Whole inches and reduced fractions
    assert.equal(ctx.formatInchFraction(ctx.inchesToFraction(2, 8)), '2 นิ้ว');
    assert.equal(ctx.formatInchFraction(ctx.inchesToFraction(0.75, 16)), '3/4 นิ้ว');
    assert.equal(ctx.formatInchFraction(ctx.inchesToFraction(1.25, 64)), '1 1/4 นิ้ว');
    assert.equal(ctx.formatInchFraction(ctx.inchesToFraction(0.5, 8)), '1/2 นิ้ว');

    // Coarser denominators change the rounding: 35 mm at 1/2" steps rounds to 1 1/2"
    assert.equal(ctx.formatInchFraction(ctx.calculateInchConversion({ ...base, mode: 'mm', mm: '35', den: '2' }).fraction), '1 1/2 นิ้ว');
    // Very small values round to zero at the chosen denominator and are flagged
    assert.equal(ctx.calculateInchConversion({ ...base, mode: 'mm', mm: '0.2', den: '4' }).fractionIsZero, true);

    // Fraction-only input (no whole inches) and blank parts default to zero
    assert.equal(ctx.calculateInchConversion({ ...base, whole: '', num: '3', den: '4' }).inches, 0.75);
    assert.equal(ctx.calculateInchConversion({ ...base, whole: '2', num: '', den: '4' }).inches, 2);

    // Invalid input
    assert.equal(ctx.calculateInchConversion({ ...base, whole: '', num: '' }).valid, false);
    assert.equal(ctx.calculateInchConversion({ ...base, den: '7' }).valid, false);
    assert.equal(ctx.calculateInchConversion({ ...base, whole: '-1' }).valid, false);
    assert.equal(ctx.calculateInchConversion({ ...base, mode: 'mm', mm: '0' }).valid, false);
    assert.equal(ctx.calculateInchConversion({ ...base, mode: 'mm', mm: '' }).valid, false);
    assert.equal(ctx.calculateInchConversion({ ...base, mode: 'hun', hun: 'abc' }).valid, false);

    // Invalid-input detection follows the active mode
    assert.equal(ctx.hasInvalidNumericInput('inch_fraction', { inch_fraction: base }), false);
    assert.equal(ctx.hasInvalidNumericInput('inch_fraction', { inch_fraction: { ...base, mode: 'mm', mm: '12x' } }), true);
    assert.equal(ctx.hasInvalidNumericInput('inch_fraction', { inch_fraction: { ...base, mode: 'inch', mm: '12x' } }), false);
});

test('shape_calc: areas, perimeters, volumes, Heron triangles and Thai land split', () => {
    const ctx = context();
    const base = { shape: 'rect', width: '5', length: '8', top: '3', bottom: '5', height: '2', base: '4', sideA: '3', sideB: '4', sideC: '5', diameter: '2', depth: '' };
    const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

    const rect = ctx.calculateShape(base);
    assert.equal(rect.valid, true);
    assert.equal(rect.areaSqm, 40);
    assert.equal(rect.perimeterM, 26);
    assert.equal(rect.areaWa, 10);
    assert.equal(rect.volumeM3, undefined);

    // Optional depth turns a flat area into a volume (slab 40 sqm x 0.1 m = 4 m3)
    near(ctx.calculateShape({ ...base, depth: '0.1' }).volumeM3, 4);
    assert.equal(ctx.calculateShape({ ...base, depth: '0' }).valid, false);
    assert.equal(ctx.calculateShape({ ...base, depth: 'x' }).valid, false);

    // Trapezoid (3 + 5) / 2 x 2 = 8; triangle base x height / 2 = 4 x 2 / 2 = 4
    assert.equal(ctx.calculateShape({ ...base, shape: 'trapezoid' }).areaSqm, 8);
    assert.equal(ctx.calculateShape({ ...base, shape: 'triangle_bh' }).areaSqm, 4);

    // Heron: 3-4-5 right triangle has area 6, perimeter 12
    const heron = ctx.calculateShape({ ...base, shape: 'triangle_sides' });
    near(heron.areaSqm, 6);
    assert.equal(heron.perimeterM, 12);
    // 2-3-6 cannot form a triangle, and a degenerate 1-2-3 is rejected as well
    assert.equal(ctx.calculateShape({ ...base, shape: 'triangle_sides', sideA: '2', sideB: '3', sideC: '6' }).reason, 'triangle_inequality');
    assert.equal(ctx.calculateShape({ ...base, shape: 'triangle_sides', sideA: '1', sideB: '2', sideC: '3' }).reason, 'triangle_inequality');

    // Circle d = 2: area pi, circumference 2 pi; semicircle: area pi/2, perimeter pi + 2
    const circle = ctx.calculateShape({ ...base, shape: 'circle' });
    near(circle.areaSqm, Math.PI);
    near(circle.perimeterM, 2 * Math.PI);
    const semi = ctx.calculateShape({ ...base, shape: 'semicircle' });
    near(semi.areaSqm, Math.PI / 2);
    near(semi.perimeterM, Math.PI + 2);

    // Cylinder d = 2, h = 2: volume 2 pi, lateral area 4 pi
    const cyl = ctx.calculateShape({ ...base, shape: 'cylinder' });
    near(cyl.volumeM3, 2 * Math.PI);
    near(cyl.lateralAreaSqm, 4 * Math.PI);
    near(cyl.areaSqm, Math.PI);

    // Trapezoid prism: cross-section 8 sqm x length 8 m = 64 m3
    const prism = ctx.calculateShape({ ...base, shape: 'prism_trap' });
    assert.equal(prism.areaSqm, 8);
    assert.equal(prism.volumeM3, 64);

    // Thai land split: 2,000 sqm = 1 rai 1 ngan 0 wa; 3,805 sqm = 2 rai 1 ngan 51.25 wa
    const split = ctx.splitRaiNganWa(2000);
    assert.deepEqual([split.rai, split.ngan, split.wa], [1, 1, 0]);
    const split2 = ctx.splitRaiNganWa(3805);
    assert.deepEqual([split2.rai, split2.ngan, split2.wa], [2, 1, 51.25]);
    assert.deepEqual(Object.values(ctx.splitRaiNganWa(399)).slice(0, 2), [0, 0]);

    // Field keys per shape drive both the keypad and the invalid-input check
    assert.deepEqual(Array.from(ctx.shapeFieldKeys('rect')), ['width', 'length', 'depth']);
    assert.deepEqual(Array.from(ctx.shapeFieldKeys('prism_trap')), ['top', 'bottom', 'height', 'length']);
    assert.deepEqual(Array.from(ctx.shapeFieldKeys('nope')), []);

    // Invalid input
    assert.equal(ctx.calculateShape({ ...base, width: '' }).valid, false);
    assert.equal(ctx.calculateShape({ ...base, length: '-3' }).valid, false);
    assert.equal(ctx.calculateShape({ ...base, shape: 'nope' }).valid, false);
    assert.equal(ctx.calculateShape({ ...base, shape: 'circle', diameter: '0' }).valid, false);
    assert.equal(ctx.hasInvalidNumericInput('shape_calc', { shape_calc: base }), false);
    assert.equal(ctx.hasInvalidNumericInput('shape_calc', { shape_calc: { ...base, width: '5m' } }), true);
    assert.equal(ctx.hasInvalidNumericInput('shape_calc', { shape_calc: { ...base, shape: 'circle', width: '5m' } }), false);
});

test('wire_breaker UI wiring: catalog, summary warnings, keypad fields and invalid-input detection', () => {
    const { TOOLS_CATALOG } = require('../src/catalog.js');
    assert.equal(TOOLS_CATALOG.find(t => t.id === 'wire_breaker').group, 'engineering');

    const ctx = context();
    const ok = { watts: '3500', voltage: '230', powerFactor: '1', wireLengthM: '15', installMethod: 'conduit', isContinuous: false };

    // The summary always carries the unverified-data caution and the engine result
    const summary = ctx.getToolSummaryText('wire_breaker', { wire_breaker: ok });
    assert.ok(summary.includes('เบรกเกอร์ 16 A สาย 2.5 ตร.มม.'));
    assert.ok(summary.includes('ยังไม่ได้เทียบกับหนังสือ วสท. โดยตรง'));
    assert.ok(summary.includes('IEC 01'));

    // No numbers are offered when the engine has no safe answer
    const tooBig = ctx.getToolSummaryText('wire_breaker', { wire_breaker: { ...ok, watts: '30000' } });
    assert.ok(tooBig.includes('ไม่มีคำตอบจากตาราง'));
    assert.ok(!tooBig.includes('ตร.มม.'));
    assert.ok(tooBig.includes('ยังไม่ได้เทียบกับหนังสือ วสท. โดยตรง'));
    const noWire = ctx.getToolSummaryText('wire_breaker', { wire_breaker: { ...ok, watts: '18000', installMethod: 'surface' } });
    assert.ok(noWire.includes('ไม่มีคำตอบจากตาราง'));
    assert.ok(noWire.includes('เบรกเกอร์ที่คำนวณได้ 80 A'));

    // Empty input still shows the caution
    const empty = ctx.getToolSummaryText('wire_breaker', { wire_breaker: { ...ok, watts: '' } });
    assert.ok(empty.includes('ยังไม่ได้เทียบกับหนังสือ วสท. โดยตรง'));

    // Voltage-drop wording in the summary
    const far = ctx.getToolSummaryText('wire_breaker', { wire_breaker: { ...ok, watts: '3450', wireLengthM: '500' } });
    assert.ok(far.includes('เกินเกณฑ์ 3%'));
    const upgraded = ctx.getToolSummaryText('wire_breaker', { wire_breaker: { ...ok, watts: '3450', wireLengthM: '60' } });
    assert.ok(upgraded.includes('ขยายสายเพื่อลดแรงดันตก'));

    // Invalid-input detection covers all four keypad fields
    assert.equal(ctx.hasInvalidNumericInput('wire_breaker', { wire_breaker: ok }), false);
    for (const key of ['watts', 'voltage', 'powerFactor', 'wireLengthM']) {
        assert.equal(ctx.hasInvalidNumericInput('wire_breaker', { wire_breaker: { ...ok, [key]: '1x' } }), true, key);
    }

    // Presets carry watts, power factor and continuous-load flags that the engine accepts
    for (const p of ctx.WIRE_APPLIANCE_PRESETS) {
        const res = ctx.calculateWireBreaker({ watts: String(p.watts), powerFactor: String(p.powerFactor), phases: String(p.phases || 1), voltage: p.phases === 3 ? '400' : '230', wireLengthM: '10', isContinuous: p.continuous });
        assert.equal(res.valid, true, p.key);
        assert.equal(res.selectionStatus, 'ok', p.key);
        assert.equal(res.voltageDropDataUnverified, false, p.key);
    }
    assert.equal(ctx.WIRE_VD_LIMIT_PCT, 3);
});

test('wire_breaker: ambient and grouping factors (tables 5-43, 5-8), the 2564 manual worked example, and maximum cable length', () => {
    const ctx = context();
    const base = { voltage: '230', powerFactor: '1', wireLengthM: '5', installMethod: 'conduit', isContinuous: false };
    const calc = extra => ctx.calculateWireBreaker({ ...base, ...extra });

    // Factor tables as printed (PVC 70C column of 5-43, raceway and single-layer-on-wall columns of 5-8)
    assert.deepEqual(Array.from(ctx.WIRE_AMBIENT_FACTORS, b => b.factor), [1.34, 1.29, 1.22, 1.15, 1.08, 1.00, 0.91, 0.82, 0.70, 0.57]);
    assert.deepEqual(Array.from(ctx.WIRE_GROUP_FACTORS, b => b.raceway), [0.80, 0.70, 0.65, 0.60, 0.57, 0.54, 0.52, 0.50, 0.45, 0.41, 0.38]);
    assert.deepEqual(Array.from(ctx.WIRE_GROUP_FACTORS, b => b.wall), [0.85, 0.79, 0.75, 0.73, 0.72, 0.72, 0.71, 0.70, 0.70, 0.70, 0.70]);

    // Ambient lookup: bands of 5 C, partial degrees round up (conservative), outside 11-60 C there is no factor
    assert.equal(ctx.wireAmbientFactor(40), 1);
    assert.equal(ctx.wireAmbientFactor(36), 1);
    assert.equal(ctx.wireAmbientFactor(35), 1.08);
    assert.equal(ctx.wireAmbientFactor(45), 0.91);
    assert.equal(ctx.wireAmbientFactor(40.5), 0.91);
    assert.equal(ctx.wireAmbientFactor(60), 0.57);
    assert.equal(ctx.wireAmbientFactor(60.5), null);
    assert.equal(ctx.wireAmbientFactor(11), 1.34);
    assert.equal(ctx.wireAmbientFactor(10), null);
    assert.equal(ctx.wireAmbientFactor(NaN), null);

    // Grouping lookup
    assert.equal(ctx.wireGroupFactor(1, 'conduit'), 1);
    assert.equal(ctx.wireGroupFactor(2, 'conduit'), 0.8);
    assert.equal(ctx.wireGroupFactor(2, 'surface'), 0.85);
    assert.equal(ctx.wireGroupFactor(12, 'conduit'), 0.45);
    assert.equal(ctx.wireGroupFactor(13, 'conduit'), 0.41);
    assert.equal(ctx.wireGroupFactor(20, 'conduit'), 0.38);
    assert.equal(ctx.wireGroupFactor(21, 'conduit'), null);
    assert.equal(ctx.wireGroupFactor(0, 'conduit'), null);
    assert.equal(ctx.wireGroupFactor(2.5, 'conduit'), null);

    // Defaults: blank ambient and circuits mean 40 C and one circuit, i.e. no derating and the old results
    const plain = calc({ watts: '7000' });
    assert.equal(plain.derating, 1);
    assert.equal(plain.recommendedBreaker, 32);
    assert.equal(plain.wireSizeSqmm, 6);
    assert.equal(calc({ watts: '7000', ambientC: '', circuits: '' }).wireSizeSqmm, 6);

    // The 2564 manual's worked example: It = In / (Ca x Cg). 32 A breaker at 45 C with 2 circuits in conduit:
    // 32 / (0.91 x 0.8) = 43.96 A -> 10 sq.mm.; 40 A breaker: 54.95 A -> 16 sq.mm. (the same sizes the manual picks)
    const ex1 = calc({ watts: '7000', ambientC: '45', circuits: '2' });
    assert.equal(ex1.selectionStatus, 'ok');
    assert.equal(ex1.recommendedBreaker, 32);
    assert.equal(ex1.ambientFactor, 0.91);
    assert.equal(ex1.groupFactor, 0.8);
    assert.ok(Math.abs(ex1.derating - 0.728) < 1e-12);
    assert.equal(ex1.requiredAmpacity, 43.96);
    assert.equal(ex1.wireSizeSqmm, 10);
    assert.equal(ex1.deratedAmpacity, 36.4);
    const ex2 = calc({ watts: '8500', ambientC: '45', circuits: '2' });
    assert.equal(ex2.recommendedBreaker, 40);
    assert.equal(ex2.requiredAmpacity, 54.95);
    assert.equal(ex2.wireSizeSqmm, 16);

    // Cooler ambient lets a smaller wire carry the breaker: 32 A at 30 C (x1.15): 32 / 1.15 = 27.8 A -> 4 sq.mm. (28 A)
    assert.equal(calc({ watts: '7000', ambientC: '30' }).wireSizeSqmm, 4);

    // Wall grouping uses the wall column and is flagged as single-source; raceway grouping is not
    const wall = calc({ watts: '3500', installMethod: 'surface', circuits: '3' });
    assert.equal(wall.groupFactor, 0.79);
    assert.equal(wall.groupFactorSingleSource, true);
    assert.equal(calc({ watts: '3500', circuits: '3' }).groupFactorSingleSource, false);
    assert.equal(calc({ watts: '3500', installMethod: 'surface', circuits: '1' }).groupFactorSingleSource, false);

    // Derating can leave no wire in the table: 100 A breaker, 35 sq.mm. 109 A x 0.728 = 79 A < 100 A
    const noWire = calc({ watts: '23000', ambientC: '45', circuits: '2' });
    assert.equal(noWire.selectionStatus, 'no_suitable_wire');
    assert.equal(noWire.recommendedBreaker, 100);
    assert.equal(noWire.wireSizeSqmm, null);
    assert.equal(noWire.maxLengthM, null);

    // Outside the factor tables there is no safe answer, but the breaker is still reported
    const hot = calc({ watts: '3500', ambientC: '61' });
    assert.equal(hot.selectionStatus, 'ambient_out_of_range');
    assert.equal(hot.recommendedBreaker, 16);
    assert.equal(hot.wireSizeSqmm, null);
    assert.equal(calc({ watts: '3500', ambientC: '10' }).selectionStatus, 'ambient_out_of_range');
    const crowded = calc({ watts: '3500', circuits: '21' });
    assert.equal(crowded.selectionStatus, 'circuits_out_of_range');
    assert.equal(crowded.recommendedBreaker, 16);
    assert.equal(crowded.wireSizeSqmm, null);
    // A load above the largest breaker is still reported as such before the factor checks
    assert.equal(calc({ watts: '30000', ambientC: '61' }).selectionStatus, 'breaker_out_of_range');

    // Invalid factor input
    assert.equal(calc({ watts: '3500', circuits: '2.5' }).valid, false);
    assert.equal(calc({ watts: '3500', circuits: '0' }).valid, false);
    assert.equal(calc({ watts: '3500', ambientC: 'abc' }).valid, false);
    assert.equal(ctx.hasInvalidNumericInput('wire_breaker', { wire_breaker: { ...base, watts: '3500', ambientC: '4o' } }), true);
    assert.equal(ctx.hasInvalidNumericInput('wire_breaker', { wire_breaker: { ...base, watts: '3500', circuits: '2x' } }), true);
    assert.equal(ctx.hasInvalidNumericInput('wire_breaker', { wire_breaker: { ...base, watts: '3500', ambientC: '40', circuits: '1' } }), false);

    // Maximum length: Lmax = V x 3% x 1000 / (mV/A/m x I). 3,500 W at 230 V = 15.217 A, 2.5 sq.mm. 18 mV/A/m -> 25.19 m
    const heater = calc({ watts: '3500', wireLengthM: '10' });
    assert.equal(heater.wireSizeSqmm, 2.5);
    assert.ok(Math.abs(heater.maxLengthM - 6900 / (18 * (3500 / 230))) < 0.01);
    assert.ok(Math.abs(heater.maxLengthM - 25.19) < 0.01);
    // Running exactly at that length gives the 3% limit; just beyond it the wire is upsized
    const atLimit = calc({ watts: '3500', wireLengthM: String(heater.maxLengthM) });
    assert.equal(atLimit.wireSizeSqmm, 2.5);
    assert.ok(Math.abs(atLimit.vdPct - 3) < 0.01);
    const beyond = calc({ watts: '3500', wireLengthM: '26' });
    assert.ok(beyond.wireSizeSqmm > 2.5);
    assert.equal(beyond.upgradedForVoltageDrop, true);
    assert.ok(beyond.maxLengthM > 26 * 0.9);
    // A bigger wire reaches further, a higher current reaches less far
    assert.ok(calc({ watts: '3500', wireLengthM: '60' }).maxLengthM > heater.maxLengthM);
    assert.ok(calc({ watts: '4500', wireLengthM: '10' }).maxLengthM < heater.maxLengthM);
    // Scales with the supply voltage
    assert.ok(Math.abs(calc({ watts: '3500', voltage: '115', wireLengthM: '5' }).maxLengthM) > 0);

    // The summary shows the factors and the maximum length
    const summary = ctx.getToolSummaryText('wire_breaker', { wire_breaker: { ...base, watts: '7000', ambientC: '45', circuits: '2' } });
    assert.ok(summary.includes('Ca x0.91'));
    assert.ok(summary.includes('Cg x0.8'));
    assert.ok(summary.includes('43.96'));
    assert.ok(summary.includes('ระยะสายสูงสุดที่แรงดันตกไม่เกิน 3%'));
    const hotSummary = ctx.getToolSummaryText('wire_breaker', { wire_breaker: { ...base, watts: '3500', ambientC: '61' } });
    assert.ok(hotSummary.includes('ไม่มีคำตอบจากตาราง'));
    assert.ok(hotSummary.includes('11-60'));
    assert.ok(!hotSummary.includes('ตร.มม.'));
});

test('conduit_fill: fill limits, max conductors per conduit (manual appendix C1), minimum conduit and validation', () => {
    const ctx = context();

    // Fill limits (manual table C5): 53% for 1 conductor, 31% for 2, 40% for 3 or more
    assert.equal(ctx.conduitFillLimit(1), 0.53);
    assert.equal(ctx.conduitFillLimit(2), 0.31);
    assert.equal(ctx.conduitFillLimit(3), 0.40);
    assert.equal(ctx.conduitFillLimit(40), 0.40);

    // Conduit areas from the nominal size match table C5 (177, 314, 491, 804, 1257, 1964, 3318, 5027, 6362, 7854, 12272, 17672 within 1 sq.mm.)
    const c5 = [177, 314, 491, 804, 1257, 1964, 3318, 5027, 6362, 7854, 12272, 17672];
    ctx.CONDUIT_SIZES.forEach((c, i) => assert.ok(Math.abs(ctx.conduitAreaMm2(c.mm) - c5[i]) < 1, `${c.mm} mm`));
    // and the 53 / 40 / 31 percent columns of C5 (first conduit): 94, 71, 55
    assert.equal(Math.round(ctx.conduitAreaMm2(15) * 0.53), 94);
    assert.equal(Math.round(ctx.conduitAreaMm2(15) * 0.40), 71);
    assert.equal(Math.round(ctx.conduitAreaMm2(15) * 0.31), 55);

    // Manual appendix C1 (IEC 01): maximum conductors per conduit 15..150 mm, null = not listed in the manual
    const C1 = {
        '1.5': [8, 14, 22, 37], '2.5': [5, 10, 15, 25], '4': [4, 7, 11, 19, 30], '6': [3, 5, 9, 15, 23, 37], '10': [1, 3, 5, 9, 14, 22],
        '16': [1, 2, 4, 6, 10, 16, 27, 42], '25': [1, 2, 2, 4, 6, 10, 17, 27, 34], '35': [1, 1, 2, 3, 5, 8, 14, 21, 27, 33],
        '50': [null, 1, 1, 1, 3, 6, 10, 15, 19, 24, 38], '70': [null, null, 1, 1, 3, 4, 7, 12, 15, 18, 29, 42],
        '95': [null, null, 1, 1, 1, 3, 5, 8, 11, 13, 21, 30], '120': [null, null, null, 1, 1, 2, 4, 7, 9, 11, 17, 25],
        '150': [null, null, null, 1, 1, 1, 3, 5, 7, 9, 14, 20], '185': [null, null, null, 1, 1, 1, 3, 4, 6, 7, 11, 16],
        '240': [null, null, null, null, 1, 1, 1, 3, 4, 5, 8, 12], '300': [null, null, null, null, null, 1, 1, 2, 3, 4, 7, 10],
        '400': [null, null, null, null, null, 1, 1, 1, 2, 3, 5, 8]
    };
    // Cells where the manual allows exactly one more conductor than the computation (the tool is more conservative there)
    const manualHigherBy1 = new Set(['6@50', '25@20', '35@25', '185@32', '185@90']);
    let compared = 0;
    let equal = 0;
    for (const [size, row] of Object.entries(C1)) {
        row.forEach((manual, i) => {
            if (manual === null) return;
            const mm = ctx.CONDUIT_SIZES[i].mm;
            const calc = ctx.conduitMaxConductors(Number(size), mm);
            compared++;
            if (manualHigherBy1.has(`${size}@${mm}`)) {
                assert.equal(manual - calc, 1, `${size} sq.mm @ ${mm} mm`);
            } else {
                assert.equal(calc, manual, `${size} sq.mm @ ${mm} mm`);
                equal++;
            }
        });
    }
    assert.equal(compared, 131);
    assert.equal(equal, 126);

    // Minimum conduit for a mix: 6 x 2.5 + 2 x 4 sq.mm. = 8 conductors, 40% limit
    const mix = ctx.calculateConduitFill({ mode: 'size', rows: [{ id: '1', size: '2.5', count: '6' }, { id: '2', size: '4', count: '2' }] });
    assert.equal(mix.valid, true);
    assert.equal(mix.totalCount, 8);
    assert.equal(mix.limitPct, 40);
    const area = 6 * Math.PI / 4 * 4.0 ** 2 + 2 * Math.PI / 4 * 4.6 ** 2;
    assert.ok(Math.abs(mix.totalAreaMm2 - area) < 1e-9);
    assert.equal(mix.recommended.mm, 20);
    assert.ok(mix.recommended.fillPct <= 40);
    assert.equal(mix.options.find(o => o.mm === 15).ok, false);
    assert.equal(mix.options.length, 12);

    // One and two conductors use the 53% and 31% limits: a single 16 sq.mm. wire fits 15 mm (47.8 / 176.7 = 27%)
    const one = ctx.calculateConduitFill({ mode: 'size', rows: [{ id: '1', size: '16', count: '1' }] });
    assert.equal(one.limitPct, 53);
    assert.equal(one.recommended.mm, 15);
    // Two 16 sq.mm. wires need 31%: 95.6 > 54.8 (15 mm) so the next conduit (20 mm: 97.3) is used
    const two = ctx.calculateConduitFill({ mode: 'size', rows: [{ id: '1', size: '16', count: '2' }] });
    assert.equal(two.limitPct, 31);
    assert.equal(two.recommended.mm, 20);
    // Splitting the same wires across rows counts them together
    const split = ctx.calculateConduitFill({ mode: 'size', rows: [{ id: '1', size: '16', count: '1' }, { id: '2', size: '16', count: '1' }] });
    assert.equal(split.totalCount, 2);
    assert.equal(split.recommended.mm, 20);
    // Blank-count rows are ignored
    assert.equal(ctx.calculateConduitFill({ mode: 'size', rows: [{ id: '1', size: '16', count: '1' }, { id: '2', size: '4', count: '' }] }).totalCount, 1);

    // More wire than the biggest conduit holds
    const huge = ctx.calculateConduitFill({ mode: 'size', rows: [{ id: '1', size: '400', count: '10' }] });
    assert.equal(huge.valid, true);
    assert.equal(huge.exceedsAll, true);
    assert.equal(huge.recommended, null);

    // The recommended conduit is the first that passes, and the one just below it fails
    for (const [size, count] of [['2.5', 3], ['4', 9], ['10', 5], ['35', 12], ['95', 4]]) {
        const res = ctx.calculateConduitFill({ mode: 'size', rows: [{ id: '1', size, count: String(count) }] });
        const idx = res.options.indexOf(res.recommended);
        assert.ok(res.recommended.ok);
        if (idx > 0) assert.equal(res.options[idx - 1].ok, false, `${count} x ${size}`);
        // consistent with the per-size maximum
        assert.ok(ctx.conduitMaxConductors(Number(size), res.recommended.mm) >= count);
        if (idx > 0) assert.ok(ctx.conduitMaxConductors(Number(size), res.options[idx - 1].mm) < count);
    }

    // Count mode: max conductors of one size in a conduit, and the full row per conduit
    const cnt = ctx.calculateConduitFill({ mode: 'count', wireSize: '2.5', conduit: '20' });
    assert.equal(cnt.valid, true);
    assert.equal(cnt.maxCount, 10);
    assert.equal(cnt.conduitInch, '3/4');
    assert.equal(cnt.wireOuterMm, 4);
    assert.deepEqual(Array.from(cnt.perConduit.slice(0, 4), c => c.maxCount), [5, 10, 15, 25]);
    // A wire too big for a small conduit cannot be pulled at all
    assert.equal(ctx.calculateConduitFill({ mode: 'count', wireSize: '400', conduit: '15' }).maxCount, 0);

    // Invalid input
    assert.equal(ctx.calculateConduitFill({ mode: 'size', rows: [] }).reason, 'no_rows');
    assert.equal(ctx.calculateConduitFill({ mode: 'size', rows: [{ id: '1', size: '2.5', count: '0' }] }).reason, 'invalid_row');
    assert.equal(ctx.calculateConduitFill({ mode: 'size', rows: [{ id: '1', size: '2.5', count: '1.5' }] }).reason, 'invalid_row');
    assert.equal(ctx.calculateConduitFill({ mode: 'size', rows: [{ id: '1', size: '2.5', count: 'x' }] }).reason, 'invalid_row');
    assert.equal(ctx.calculateConduitFill({ mode: 'size', rows: [{ id: '1', size: '3', count: '2' }] }).reason, 'invalid_row');
    assert.equal(ctx.calculateConduitFill({ mode: 'size', rows: [{ id: '1', size: '2.5', count: '401' }] }).reason, 'too_many');
    assert.equal(ctx.calculateConduitFill({ mode: 'count', wireSize: '3', conduit: '20' }).valid, false);
    assert.equal(ctx.calculateConduitFill({ mode: 'count', wireSize: '2.5', conduit: '22' }).valid, false);
    assert.equal(ctx.conduitWireAreaMm2(3), null);
    assert.equal(ctx.conduitMaxConductors(3, 20), 0);

    // Summary text and invalid-input detection
    const summary = ctx.getToolSummaryText('conduit_fill', { conduit_fill: { mode: 'size', rows: [{ id: '1', size: '2.5', count: '6' }, { id: '2', size: '4', count: '2' }] } });
    assert.ok(summary.includes('ท่อ 20 มม.'));
    assert.ok(summary.includes('สายรวม 8 เส้น'));
    assert.ok(summary.includes('สัดส่วนสูงสุด 40%'));
    const countSummary = ctx.getToolSummaryText('conduit_fill', { conduit_fill: { mode: 'count', wireSize: '2.5', conduit: '20' } });
    assert.ok(countSummary.includes('ร้อยได้สูงสุด 10 เส้น'));
    assert.equal(ctx.hasInvalidNumericInput('conduit_fill', { conduit_fill: { mode: 'size', rows: [{ id: '1', size: '2.5', count: '6' }] } }), false);
    assert.equal(ctx.hasInvalidNumericInput('conduit_fill', { conduit_fill: { mode: 'size', rows: [{ id: '1', size: '2.5', count: '6x' }] } }), true);
    assert.equal(ctx.hasInvalidNumericInput('conduit_fill', { conduit_fill: { mode: 'count', rows: [{ id: '1', size: '2.5', count: '6x' }] } }), false);
});

test('wire_breaker: three-phase (400 V) conduit wiring, table columns, limits and summary', () => {
    const ctx = context();
    const near = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);
    const base = { phases: '3', voltage: '400', powerFactor: '1', wireLengthM: '20', installMethod: 'conduit', isContinuous: false };
    const calc = extra => ctx.calculateWireBreaker({ ...base, ...extra });

    // Table columns as printed: in-conduit ampacity with 3 loaded conductors (Yazaki B1 and table 5-20 group 2, single-core)
    // and 3-phase mV/A/m for single-core 70C cable, group 1-2
    assert.deepEqual(Array.from(ctx.WIRE_SPEC_TABLE, w => w.conduitAmp3), [0, 13, 18, 24, 31, 44, 59, 77, 96]);
    assert.deepEqual(Array.from(ctx.WIRE_SPEC_TABLE, w => w.mVPerAmpMeter3), [38, 25, 15, 9.5, 6.4, 3.8, 2.4, 1.52, 1.13]);
    // Sanity against the single-phase columns: 3 conductors carry less, and 3-phase mV/A/m is about 0.83-0.88 of single-phase
    for (const w of ctx.WIRE_SPEC_TABLE.filter(w => w.conduitAmp > 0)) {
        assert.ok(w.conduitAmp3 < w.conduitAmp, `${w.sizeSqmm} ampacity`);
        const ratio = w.mVPerAmpMeter3 / w.mVPerAmpMeter;
        assert.ok(ratio > 0.83 && ratio < 0.88, `${w.sizeSqmm} mV ratio ${ratio}`);
    }

    // 22 kW EV charger, 400 V, PF 1, continuous: I = P / (sqrt(3) x V) = 31.75 A, design x1.25 = 39.69 A -> 40 A breaker
    const ev22 = calc({ watts: '22000', isContinuous: true });
    assert.equal(ev22.selectionStatus, 'ok');
    assert.equal(ev22.phases, 3);
    near(ev22.loadCurrent, 22000 / (Math.sqrt(3) * 400));
    assert.equal(ev22.designCurrent, 39.69);
    assert.equal(ev22.recommendedBreaker, 40);
    assert.equal(ev22.wireSizeSqmm, 10);
    assert.equal(ev22.wireAmpacity, 44);
    // Voltage drop is the line-to-line drop: mV/A/m x I x L / 1000 over 400 V
    near(ev22.vdVolts, 3.8 * (22000 / (Math.sqrt(3) * 400)) * 20 / 1000);
    near(ev22.vdPct, ev22.vdVolts / 400 * 100);
    near(ev22.maxLengthM, 400 * 0.03 * 1000 / (3.8 * (22000 / (Math.sqrt(3) * 400))));

    // 11 kW EV charger: 15.88 A x1.25 = 19.85 A -> 20 A breaker, 2.5 sq.mm. carries only 18 A with 3 conductors -> 4 sq.mm.
    const ev11 = calc({ watts: '11000', isContinuous: true });
    assert.equal(ev11.recommendedBreaker, 20);
    assert.equal(ev11.wireSizeSqmm, 4);
    // The same 20 A breaker in single phase is served by 2.5 sq.mm. (21 A)
    const single = ctx.calculateWireBreaker({ phases: '1', watts: '4500', voltage: '230', powerFactor: '1', wireLengthM: '5', installMethod: 'conduit' });
    assert.equal(single.recommendedBreaker, 20);
    assert.equal(single.wireSizeSqmm, 2.5);

    // Blank voltage means 400 V for three phase and 230 V for single phase; unknown phase values mean single phase
    const defaultVoltage = ctx.calculateWireBreaker({ phases: '3', watts: '11000', powerFactor: '1', wireLengthM: '5' });
    assert.equal(defaultVoltage.voltage, 400);
    assert.equal(ctx.calculateWireBreaker({ watts: '3500', powerFactor: '1', wireLengthM: '5' }).voltage, 230);
    for (const odd of ['2', '', undefined, 'abc']) {
        const res = ctx.calculateWireBreaker({ phases: odd, watts: '3500', voltage: '230', powerFactor: '1', wireLengthM: '5' });
        assert.equal(res.phases, 1);
        assert.equal(res.recommendedBreaker, 16);
    }

    // Surface (VAF) wiring does not exist for three phase: the breaker is reported, no wire
    const vaf3 = calc({ watts: '7000', installMethod: 'surface' });
    assert.equal(vaf3.selectionStatus, 'three_phase_surface_unsupported');
    assert.equal(vaf3.recommendedBreaker, 16);
    assert.equal(vaf3.wireSizeSqmm, null);
    assert.equal(vaf3.maxLengthM, null);

    // Three-phase conduit tops out at 96 A (35 sq.mm.): 55 kW needs an 80 A breaker and 35 sq.mm., 60 kW (100 A) has no wire
    const kw55 = calc({ watts: '55000' });
    assert.equal(kw55.recommendedBreaker, 80);
    assert.equal(kw55.wireSizeSqmm, 35);
    assert.equal(kw55.wireAmpacity, 96);
    const kw60 = calc({ watts: '60000' });
    assert.equal(kw60.selectionStatus, 'no_suitable_wire');
    assert.equal(kw60.recommendedBreaker, 100);
    // Above 100 A there is no breaker in the table
    assert.equal(calc({ watts: '80000' }).selectionStatus, 'breaker_out_of_range');

    // Derating works the same way: 22 kW at 45 C with 2 circuits needs 40 / 0.728 = 54.95 A -> 16 sq.mm. (59 A)
    const hot = calc({ watts: '22000', isContinuous: true, ambientC: '45', circuits: '2' });
    assert.equal(hot.requiredAmpacity, 54.95);
    assert.equal(hot.wireSizeSqmm, 16);

    // Long run is upsized for voltage drop: 11 kW over 100 m, 4 sq.mm. drops 3.77% -> 6 sq.mm. (2.54%)
    const far = calc({ watts: '11000', isContinuous: true, wireLengthM: '100' });
    assert.equal(far.upgradedForVoltageDrop, true);
    assert.equal(far.wireSizeSqmm, 6);
    assert.ok(far.vdPct <= 3);
    // Exactly at the maximum length the drop is the 3% limit
    const atLimit = calc({ watts: '22000', isContinuous: true, wireLengthM: String(Math.floor(ev22.maxLengthM * 10) / 10) });
    assert.equal(atLimit.wireSizeSqmm, 10);
    near(atLimit.vdPct, 3);

    // Appliance presets are split by phase and every three-phase preset works with the three-phase engine
    const threePhasePresets = ctx.WIRE_APPLIANCE_PRESETS.filter(p => p.phases === 3);
    assert.deepEqual(Array.from(threePhasePresets, p => p.key), ['ev_11kw', 'ev_22kw']);
    assert.ok(ctx.WIRE_APPLIANCE_PRESETS.filter(p => !p.phases).length >= 8);

    // Summary text names the system and handles the unsupported VAF case
    const summary = ctx.getToolSummaryText('wire_breaker', { wire_breaker: { ...base, watts: '22000', isContinuous: true } });
    assert.ok(summary.includes('ระบบ 3 เฟส'));
    assert.ok(summary.includes('เบรกเกอร์ 40 A สาย 10 ตร.มม.'));
    const vafSummary = ctx.getToolSummaryText('wire_breaker', { wire_breaker: { ...base, watts: '7000', installMethod: 'surface' } });
    assert.ok(vafSummary.includes('ใช้กับ 1 เฟสเท่านั้น'));
    assert.ok(vafSummary.includes('ไม่มีคำตอบจากตาราง'));
    assert.ok(!vafSummary.includes('ตร.มม.'));
    // Single-phase summary reads "1 เฟส" too
    assert.ok(ctx.getToolSummaryText('wire_breaker', { wire_breaker: { watts: '3500', voltage: '230', powerFactor: '1', wireLengthM: '15' } }).includes('ระบบ 1 เฟส'));
});

test('btu_calc to wire_breaker: air-conditioner rated current table (manual appendix D), size matching and handoff', () => {
    const ctx = context();

    // Every catalog row is self-consistent: kVA = V x A for single phase and sqrt(3) x V x A for 380 V three phase.
    // This validates that the rows were read correctly from the manual.
    assert.equal(ctx.AC_CATALOG_ENTRIES.length, 27);
    for (const e of ctx.AC_CATALOG_ENTRIES) {
        const expected = (e.phases === 3 ? Math.sqrt(3) : 1) * e.volts * e.amps / 1000;
        assert.ok(Math.abs(expected - e.kva) <= 0.011, `${e.type} ${e.btu} BTU ${e.volts} V: ${expected} vs ${e.kva}`);
        assert.equal(e.volts, e.phases === 3 ? 380 : 220);
    }

    // Matching a BTU size: the highest running current among catalog rows within +-10% of the size
    const rated = btu => ctx.acRatedCurrent(btu, 1);
    assert.deepEqual(Array.from(ctx.BTU_STANDARD_SIZES, btu => rated(btu).currentA), [4.6, 6.0, 6.8, 8.5, 10.4, 13.8, 17.7]);
    assert.equal(rated(12000).catalogBtu, 12200);
    assert.equal(rated(12000).type, 'wall');
    assert.equal(rated(18000).type, 'wall');
    assert.equal(rated(18000).matches, 3);
    assert.equal(rated(24000).type, 'duct');
    assert.equal(rated(36000).currentA, 17.7);
    // Three-phase 380 V units exist from 36,000 BTU up
    assert.equal(ctx.acRatedCurrent(36000, 3).currentA, 6.8);
    assert.equal(ctx.acRatedCurrent(36000, 3).volts, 380);
    assert.equal(ctx.acRatedCurrent(12000, 3), null);
    // Outside the catalog sizes, or invalid, there is no value
    assert.equal(ctx.acRatedCurrent(60000, 1), null);
    assert.equal(ctx.acRatedCurrent(3000, 1), null);
    assert.equal(ctx.acRatedCurrent(0, 1), null);
    assert.equal(ctx.acRatedCurrent(NaN, 1), null);
    // A size between catalog capacities has no row within 10% (10,000 BTU sits between 8,800 and 12,200)
    assert.equal(ctx.acRatedCurrent(10000, 1), null);

    // The wire_breaker air-conditioner presets use the same catalog currents (6.0 A and 10.4 A at 230 V, PF 1)
    const preset = key => ctx.WIRE_APPLIANCE_PRESETS.find(p => p.key === key);
    assert.equal(preset('ac_12000').watts, Math.round(rated(12000).currentA * 230));
    assert.equal(preset('ac_24000').watts, Math.round(rated(24000).currentA * 230));
    assert.equal(preset('ac_12000').powerFactor, 1);
    assert.equal(preset('ac_12000').continuous, true);

    // Handoff from btu_calc: 4 x 4 m bedroom needs 12,000 BTU -> 6.0 A -> 1,380 W at 230 V, PF 1
    const room = { width: '4', length: '4', height: '2.8', btuPerSqm: '750', hoursPerDay: '8', ratePerKwh: '4.5', fixedSeer: '11', inverterSeer: '20' };
    const handoff = ctx.buildBtuToWireHandoff(room);
    assert.equal(handoff.hasAmount, true);
    assert.equal(handoff.btu, 12000);
    assert.equal(handoff.units, 1);
    assert.equal(handoff.currentA, 6.0);
    assert.equal(handoff.watts, 1380);
    // A large shop needs several 36,000 BTU units: the circuit is per unit
    const shop = ctx.buildBtuToWireHandoff({ ...room, width: '10', length: '10', btuPerSqm: '1350' });
    assert.equal(shop.btu, 36000);
    assert.equal(shop.units, 4);
    assert.equal(shop.currentA, 17.7);
    assert.equal(shop.watts, Math.round(17.7 * 230));
    // No room size, no handoff
    assert.equal(ctx.buildBtuToWireHandoff({ ...room, width: '' }).hasAmount, false);
    assert.equal(ctx.buildBtuToWireHandoff(undefined).hasAmount, false);

    // Applying it fills wire_breaker, keeps the previous length and wiring method, and the engine returns the catalog current
    const wire = { phases: '3', watts: '1', voltage: '400', powerFactor: '0.8', wireLengthM: '25', ambientC: '50', circuits: '3', installMethod: 'surface', isContinuous: false, preset: 'x' };
    const ctx2 = context({ appState: { wire_breaker: wire } });
    assert.equal(ctx2.applyBtuToWireHandoff(room), true);
    const applied = ctx2.appState.wire_breaker;
    assert.equal(applied.phases, '1');
    assert.equal(applied.watts, '1380');
    assert.equal(applied.voltage, '230');
    assert.equal(applied.powerFactor, '1');
    assert.equal(applied.wireLengthM, '25');
    assert.equal(applied.installMethod, 'surface');
    assert.equal(applied.ambientC, '40');
    assert.equal(applied.circuits, '1');
    assert.equal(applied.isContinuous, true);
    assert.equal(applied.preset, '');
    assert.equal(applied.source.watts, 1380);
    assert.ok(applied.source.label.includes('12,000 BTU'));
    assert.ok(applied.source.label.includes('กระแสทำงาน 6 A'));
    const result = ctx2.calculateWireBreaker(applied);
    assert.equal(result.loadCurrent, 6);
    assert.equal(result.designCurrent, 7.5);
    assert.equal(result.recommendedBreaker, 10);
    assert.equal(result.wireSizeSqmm, 1);  // surface wiring: VAF 1.0 sq.mm. (14 A) carries a 10 A breaker
    assert.equal(ctx2.calculateWireBreaker({ ...applied, installMethod: 'conduit' }).wireSizeSqmm, 1.5);
    // Blank length falls back to 15 m; nothing is written when there is no amount
    const ctx3 = context({ appState: { wire_breaker: { wireLengthM: '' } } });
    assert.equal(ctx3.applyBtuToWireHandoff(room), true);
    assert.equal(ctx3.appState.wire_breaker.wireLengthM, '15');
    assert.equal(ctx3.appState.wire_breaker.installMethod, 'conduit');
    const untouched = { watts: '99' };
    const ctx4 = context({ appState: { wire_breaker: untouched } });
    assert.equal(ctx4.applyBtuToWireHandoff({ ...room, width: '' }), false);
    assert.equal(untouched.watts, '99');
});

test('wire_data: IEC 01 and VAF catalog rows agree with the wire_breaker and conduit_fill tables, and ordering maths', () => {
    const ctx = context();
    const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);
    assert.equal(ctx.WIRE_DATA_THW.length, 20);
    assert.equal(ctx.WIRE_DATA_VAF.length, 7);

    // Ampacity columns of the product table match the tables used by wire_breaker (conduit 1 and 3 phase, VAF in air)
    for (const w of ctx.WIRE_SPEC_TABLE.filter(w => w.conduitAmp > 0)) {
        const rows = ctx.WIRE_DATA_THW.filter(r => r.sizeSqmm === w.sizeSqmm);
        assert.ok(rows.length >= 1, `THW ${w.sizeSqmm}`);
        for (const r of rows) {
            assert.equal(r.conduitA, w.conduitAmp, `conduit ${w.sizeSqmm}`);
            assert.equal(r.conduit3A, w.conduitAmp3, `conduit 3-phase ${w.sizeSqmm}`);
        }
    }
    for (const w of ctx.WIRE_SPEC_TABLE.filter(w => w.surfaceAmp > 0)) {
        const rows = ctx.WIRE_DATA_VAF.filter(r => r.sizeSqmm === w.sizeSqmm);
        assert.equal(rows.length, 1, `VAF ${w.sizeSqmm}`);
        assert.equal(rows[0].airA, w.surfaceAmp, `VAF ${w.sizeSqmm}`);
    }
    // Every VAF size has a wire_breaker row and vice versa (1.0-16 sq.mm.)
    assert.deepEqual(Array.from(ctx.WIRE_DATA_VAF, r => r.sizeSqmm), Array.from(ctx.WIRE_SPEC_TABLE.filter(w => w.surfaceAmp > 0), w => w.sizeSqmm));

    // The maximum overall diameter of the stranded / compacted row equals the diameter used by conduit_fill
    for (const d of ctx.CONDUIT_WIRE_DIAMETERS) {
        const rows = ctx.WIRE_DATA_THW.filter(r => r.sizeSqmm === d.sizeSqmm);
        const used = rows.find(r => r.conductor !== 'solid');
        assert.equal(used.dMaxMm, d.outerMm, `diameter ${d.sizeSqmm}`);
    }

    // Resistance is consistent with the voltage drop columns: mV/A/m is about 2 x R70 (single phase) and sqrt(3) x R70 (three phase)
    // with R70 = R20 x (1 + 0.00393 x 50); within 3% for the sizes up to 16 sq.mm. where reactance is negligible
    for (const w of ctx.WIRE_SPEC_TABLE.filter(w => w.sizeSqmm >= 1.5 && w.sizeSqmm <= 16)) {
        const r20 = ctx.WIRE_DATA_THW.find(r => r.sizeSqmm === w.sizeSqmm && r.conductor !== 'solid').r20;
        const r70 = r20 * (1 + 0.00393 * 50);
        assert.ok(Math.abs(2 * r70 - w.mVPerAmpMeter) / w.mVPerAmpMeter < 0.03, `1-phase ${w.sizeSqmm}`);
        assert.ok(Math.abs(Math.sqrt(3) * r70 - w.mVPerAmpMeter3) / w.mVPerAmpMeter3 < 0.03, `3-phase ${w.sizeSqmm}`);
    }
    // VAF and THW share the same conductor resistance at the same size
    for (const v of ctx.WIRE_DATA_VAF.filter(v => v.sizeSqmm >= 1.5)) {
        assert.equal(v.r20, ctx.WIRE_DATA_THW.find(r => r.sizeSqmm === v.sizeSqmm && r.conductor !== 'solid').r20, `R20 ${v.sizeSqmm}`);
    }

    // Weight sanity: never below the copper alone (8.89 kg/km per sq.mm.), and bounded above (VAF has two cores)
    for (const r of ctx.WIRE_DATA_THW) {
        const copper = r.sizeSqmm * 8.89;
        assert.ok(r.weightKgKm >= copper && r.weightKgKm <= copper * 1.7, `THW ${r.sizeSqmm} ${r.conductor}`);
    }
    for (const r of ctx.WIRE_DATA_VAF) {
        const copper = 2 * r.sizeSqmm * 8.89;
        assert.ok(r.weightKgKm >= copper && r.weightKgKm <= copper * 3, `VAF ${r.sizeSqmm}`);
        assert.ok(r.wMaxMm > r.wMinMm && r.hMaxMm > r.hMinMm);
    }
    // Insulation is thicker for bigger cables, overall diameter grows with the size
    const strandedOrOnly = ctx.WIRE_DATA_THW.filter(r => r.conductor !== 'solid');
    for (let i = 1; i < strandedOrOnly.length; i++) {
        assert.ok(strandedOrOnly[i].dMaxMm > strandedOrOnly[i - 1].dMaxMm);
        assert.ok(strandedOrOnly[i].insulationMm >= strandedOrOnly[i - 1].insulationMm);
        assert.ok(strandedOrOnly[i].weightKgKm > strandedOrOnly[i - 1].weightKgKm);
    }
    // Standard packs: coils of 100 m up to 35 sq.mm., drums above (1,000 m up to 240, 500 m for 300 and 400)
    for (const r of ctx.WIRE_DATA_THW) {
        if (r.sizeSqmm <= 35) assert.deepEqual([r.pack, r.lengthM], ['C', 100]);
        else if (r.sizeSqmm <= 240) assert.deepEqual([r.pack, r.lengthM], ['D', 1000]);
        else assert.deepEqual([r.pack, r.lengthM], ['D', 500]);
    }

    // Lookup and ordering maths
    const base = { type: 'thw', size: '2.5', conductor: 'stranded', lengthM: '100' };
    const a = ctx.calculateWireData(base);
    assert.equal(a.valid, true);
    assert.equal(a.row.weightKgKm, 35);
    near(a.totalWeightKg, 3.5);
    near(a.resistanceOhm, 0.741);
    assert.equal(a.packs, 1);
    assert.equal(a.leftoverM, 0);
    const b = ctx.calculateWireData({ ...base, lengthM: '250' });
    assert.equal(b.packs, 3);
    assert.equal(b.packedLengthM, 300);
    assert.equal(b.leftoverM, 50);
    near(b.totalWeightKg, 8.75);
    const drum = ctx.calculateWireData({ ...base, size: '50', lengthM: '2300' });
    assert.equal(drum.row.pack, 'D');
    assert.equal(drum.packs, 3);
    assert.equal(drum.leftoverM, 700);
    assert.equal(ctx.calculateWireData({ ...base, size: '300', lengthM: '1200' }).packs, 3);
    // No length means a plain lookup
    const lookup = ctx.calculateWireData({ ...base, lengthM: '' });
    assert.equal(lookup.valid, true);
    assert.equal(lookup.hasLength, false);

    // Conductor variants: solid/stranded exist for 1.5-4 sq.mm. only; an unknown or missing variant falls back to stranded
    assert.deepEqual(Array.from(ctx.calculateWireData({ ...base, size: '2.5' }).variants), ['solid', 'stranded']);
    assert.equal(ctx.calculateWireData({ ...base, conductor: 'solid' }).row.weightKgKm, 32);
    assert.equal(ctx.calculateWireData({ ...base, size: '6', conductor: 'solid' }).row.conductor, 'stranded');
    assert.equal(ctx.calculateWireData({ ...base, size: '16', conductor: 'solid' }).row.conductor, 'compacted');
    assert.equal(ctx.calculateWireData({ ...base, conductor: 'nope' }).row.conductor, 'stranded');

    // VAF and type/size mismatches
    const vaf = ctx.calculateWireData({ type: 'vaf', size: '16', conductor: 'stranded', lengthM: '100' });
    assert.equal(vaf.row.airA, 74);
    assert.equal(vaf.row.wMaxMm, 11);
    near(vaf.totalWeightKg, 45);
    assert.equal(ctx.calculateWireData({ type: 'thw', size: '1', lengthM: '' }).valid, false);
    assert.equal(ctx.calculateWireData({ type: 'vaf', size: '25', lengthM: '' }).valid, false);
    assert.equal(ctx.calculateWireData({ type: 'vaf', size: '1', conductor: 'solid', lengthM: '' }).valid, true);

    // Invalid length
    assert.equal(ctx.calculateWireData({ ...base, lengthM: 'x' }).reason, 'invalid_length');
    assert.equal(ctx.calculateWireData({ ...base, lengthM: '0' }).reason, 'invalid_length');
    assert.equal(ctx.calculateWireData({ ...base, lengthM: '-5' }).reason, 'invalid_length');
    assert.equal(ctx.hasInvalidNumericInput('wire_data', { wire_data: { ...base, lengthM: '10m' } }), true);
    assert.equal(ctx.hasInvalidNumericInput('wire_data', { wire_data: { ...base, lengthM: '' } }), false);

    // Summary text
    const summary = ctx.getToolSummaryText('wire_data', { wire_data: { ...base, lengthM: '250' } });
    assert.ok(summary.includes('IEC 01 (THW)'));
    assert.ok(summary.includes('ร้อยท่อ 1 เฟส 21 A 3 เฟส 18 A'));
    assert.ok(summary.includes('หนักประมาณ 8.8 กก.') || summary.includes('หนักประมาณ 8.7 กก.'));
    assert.ok(summary.includes('3 ม้วน'));
    const vafSummary = ctx.getToolSummaryText('wire_data', { wire_data: { type: 'vaf', size: '2.5', conductor: 'solid', lengthM: '' } });
    assert.ok(vafSummary.includes('VAF 2 แกน'));
    assert.ok(vafSummary.includes('กระแสในอากาศ 40°C 23 A'));
    assert.ok(!vafSummary.includes('สั่งซื้อ'));
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
    const ctx = context({ setTimeout, clearTimeout });
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

test('wheel follows a gliding user scroll even when scroll events are sparse', async () => {
    const ctx = context({ setTimeout, clearTimeout });
    const listeners = {};
    const wheelEl = {
        id: 'w', scrollTop: 0,
        querySelectorAll: () => [],
        setAttribute() {},
        addEventListener(type, fn) { listeners[type] = fn; }
    };
    const selected = [];
    const ctrl = ctx.bindWheelColumn(wheelEl, { itemCount: 8, initialIndex: 5, itemHeight: 56, onSelect: (idx) => selected.push(idx) });
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await wait(60);
    listeners.touchstart();
    // The finger is released and the list glides without any scroll event firing.
    wheelEl.scrollTop = 4 * 56;
    await wait(80);
    wheelEl.scrollTop = 2 * 56;
    await wait(80);
    assert.deepEqual(selected, [4, 2], 'polling reports each index passed while gliding');
    assert.equal(ctrl.getIndex(), 2);
    // Once it has stopped, the wheel settles exactly on the selected row.
    wheelEl.scrollTop = 2 * 56 + 10;
    await wait(350);
    assert.equal(wheelEl.scrollTop, 2 * 56);
});
