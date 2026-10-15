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
    'src/tools/shop.js',
    'src/tools/biz.js',
    'src/tools/finance.js',
    'src/tools/work.js',
    'src/tools/special.js',
    'src/tools/lotto.js',
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

test('catalog contains exactly 23 tools classified into 5 valid groups with search keywords', () => {
    const { TOOL_GROUPS, TOOLS_CATALOG } = require('../src/catalog.js');
    assert.ok(Array.isArray(TOOL_GROUPS) && Array.isArray(TOOLS_CATALOG), 'Missing TOOL_GROUPS or TOOLS_CATALOG definitions');
    assert.equal(TOOL_GROUPS.length, 5);
    assert.equal(TOOLS_CATALOG.length, 23);
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
    assert.match(summaryWeight, /⭐ ตัวเลือกที่คุ้มที่สุด: ตัวเลือก B \(150\.00 บาท\/กก\.\)/);
    assert.match(summaryWeight, /ประหยัดกว่าตัวเลือก A 6\.3%/);

    // 2. Count comparison: 120 THB / 1 doz (= 10 THB/pcs) vs 11 THB / 1 pcs
    ctx.appState.unit_price.rows = [
        { id: 'A', price: '120', qty: '1', unit: 'doz' },
        { id: 'B', price: '11', qty: '1', unit: 'pcs' }
    ];
    const summaryCount = ctx.getToolSummaryText('unit_price');
    assert.match(summaryCount, /120\.00 บาท \/ 1\.00 โหล = 10\.00 บาท\/ชิ้น/);
    assert.match(summaryCount, /11\.00 บาท \/ 1\.00 ชิ้น = 11\.00 บาท\/ชิ้น/);
    assert.match(summaryCount, /⭐ ตัวเลือกที่คุ้มที่สุด: ตัวเลือก A \(10\.00 บาท\/ชิ้น\)/);
    assert.match(summaryCount, /ประหยัดกว่าตัวเลือก B 9\.1%/);

    // 3. Volume comparison: 30 THB / 250 ml (= 120 THB/L) vs 100 THB / 1 L
    ctx.appState.unit_price.rows = [
        { id: 'A', price: '30', qty: '250', unit: 'ml' },
        { id: 'B', price: '100', qty: '1', unit: 'L' }
    ];
    const summaryVolume = ctx.getToolSummaryText('unit_price');
    assert.match(summaryVolume, /30\.00 บาท \/ 250\.00 ml = 120\.00 บาท\/ลิตร/);
    assert.match(summaryVolume, /100\.00 บาท \/ 1\.00 L = 100\.00 บาท\/ลิตร/);
    assert.match(summaryVolume, /⭐ ตัวเลือกที่คุ้มที่สุด: ตัวเลือก B \(100\.00 บาท\/ลิตร\)/);
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

test('all 23 tools have complete and valid clear and demo data mappings', () => {
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

    assert.equal(ctx.TOOLS_CATALOG.length, 23);

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

test('calculation history and saved sets: auto-recording, pinning, renaming, FIFO cap and restoration', () => {
    const rawAppStateMatch = html.match(/const appState = \{[\s\S]*?\n        \};/);
    assert.ok(rawAppStateMatch);
    const ctx = context();
    vm.runInContext(rawAppStateMatch[0].replace(/const /g, 'var '), ctx);

    // 1. Summary Extraction Helpers
    const loanSummary = `🏦 สรุปยอดผ่อนเงินกู้ & ผ่อนชำระ
----------------------------------
• วงเงินกู้: 2,500,000 บาท
• ดอกเบี้ย: 3.5% ต่อปี (ลดต้นลดดอก)
• ระยะเวลา: 360 เดือน
----------------------------------
💰 ค่างวด: 11,226.12 บาท/เดือน
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
        ctx.recordCalculationHistory(ctx.appState, 'loan', false, '', `💰 ค่างวด: ${i + 1}0,000 บาท/เดือน\n• วงเงินกู้: ${i + 1} ล้าน`);
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

    // 6. Generic Calculator Fallback
    const genericDoc = ctx.generateFormalPrintHTML('tip', { activeToolId: 'tip' });
    assert.ok(genericDoc.includes('MULTITOOLS AIO'));
    assert.ok(genericDoc.includes('เอกสารสรุปผลการคำนวณ'));
    assert.ok(genericDoc.includes('ข้อมูลและเงื่อนไขการคำนวณ'));
});

test('quick compare engine: side-by-side metrics, delta calculation, winner identification, and presets', () => {
    const ctx = context();

    // 1. Presets availability
    for (const toolId of ['loan', 'savings', 'vat_wht', 'salary']) {
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

    // 6. Print Comparison Sheet Generator
    const printHTML = ctx.generateComparePrintHTML(loanComp);
    assert.ok(printHTML.includes('MULTITOOLS AIO'));
    assert.ok(printHTML.includes('ตารางวิเคราะห์และเปรียบเทียบชุดคำนวณ'));
    assert.ok(printHTML.includes('ธนาคาร A (5.0%)'));
    assert.ok(printHTML.includes('ธนาคาร B (3.8%)'));
    assert.ok(printHTML.includes('🏆 คุ้มค่าที่สุด'));
});

test('all 23 tool renderers are modularized and exported across the 5 tool groups', () => {
    const ctx = context();
    const rendererMap = {
        unit_price: 'renderUnitPriceTool',
        discount:   'renderDiscountTool',
        tip:        'renderTipTool',
        unit:       'renderUnitConverterTool',
        vat:        'renderVatTool',
        vat_wht:    'renderVatWhtTool',
        percent:    'renderPercentTool',
        salary:     'renderSalaryTool',
        loan:       'renderLoanTool',
        savings:    'renderSavingsTool',
        currency:   'renderCurrencyTool',
        date_work:  'renderWorkdayTool',
        date_calc:  'renderDateCalcTool',
        world_time: 'renderWorldTimeTool',
        gpa:        'renderGpaTool',
        health:     'renderHealthTool',
        ovulation:  'renderOvulationTool',
        fuel_cost:  'renderFuelCostTool',
        fuel_eff:   'renderFuelEffTool',
        area_cost:  'renderAreaCostTool',
        hex:        'renderHexTool',
        calc:       'renderStandardCalcTool',
        lotto_calc: 'renderLottoTool'
    };

    assert.equal(Object.keys(rendererMap).length, 23);

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







