// ==============================================================
// Multitools Calculator - Actions, Status Banner & Print
// ==============================================================

let lastClearSnapshot = null;

function captureToolSnapshot() {
    if (typeof appState === 'undefined') return null;
    return {
        toolId: appState.activeToolId,
        fieldIndex: appState.activeFieldIndex,
        state: JSON.parse(JSON.stringify(appState[appState.activeToolId]))
    };
}

function rememberToolClear(snapshot) {
    if (!snapshot || typeof appState === 'undefined') return;
    if (JSON.stringify(snapshot.state) === JSON.stringify(appState[snapshot.toolId])) return;
    lastClearSnapshot = snapshot;
    const undoBtn = typeof document !== 'undefined' ? document.getElementById('menuUndoClear') : null;
    if (undoBtn) undoBtn.disabled = false;
}

function undoLastClear() {
    if (!lastClearSnapshot || typeof appState === 'undefined') return;
    const snapshot = lastClearSnapshot;
    lastClearSnapshot = null;
    appState[snapshot.toolId] = snapshot.state;
    appState.activeToolId = snapshot.toolId;
    appState.activeFieldIndex = snapshot.fieldIndex;
    const undoBtn = typeof document !== 'undefined' ? document.getElementById('menuUndoClear') : null;
    if (undoBtn) undoBtn.disabled = true;
    if (typeof renderSidebarMenu === 'function') renderSidebarMenu();
    if (typeof renderActiveTool === 'function') renderActiveTool();
}

function clearCurrentTool() {
    const snapshot = captureToolSnapshot();
    const id = appState.activeToolId;
    appState.activeFieldIndex = 0;

    if (id === 'unit_price') {
        appState.unit_price.rows.forEach(r => { r.price = ''; r.qty = ''; r.unit = 'unit'; });
    } else if (id === 'calc') {
        appState.calc.expr = '';
        appState.calc.result = '0';
    } else if (id === 'currency') {
        appState.currency.amount = '';
        appState.currency.customRateToTHB = '';
    } else if (id === 'unit') {
        appState.unit.val = '';
    } else if (id === 'discount') {
        appState.discount.price = '';
        appState.discount.discountPct = '';
        appState.discount.extraPct = '';
    } else if (id === 'percent') {
        appState.percent.x = '';
        appState.percent.y = '';
        appState.percent.z = '';
    } else if (id === 'vat') {
        appState.vat.amount = '';
    } else if (id === 'vat_wht') {
        appState.vat_wht.amount = '';
    } else if (id === 'salary') {
        appState.salary.income = '';
    } else if (id === 'loan') {
        appState.loan.principal = '';
        appState.loan.extra = '0';
    } else if (id === 'savings') {
        appState.savings.initial = '';
        appState.savings.monthly = '';
    } else if (id === 'date_work') {
        appState.date_work.customHolidays = '';
        appState.date_work.offset = '0';
    } else if (id === 'date_calc') {
        appState.date_calc.daysOffset = 0;
    } else if (id === 'world_time') {
        appState.world_time.search = '';
    } else if (id === 'gpa') {
        appState.gpa.courses = [{ name: 'วิชาที่ 1', credit: 3, grade: '4.0' }];
    } else if (id === 'health') {
        appState.health.weight = '';
        appState.health.height = '';
        appState.health.age = '';
    } else if (id === 'ovulation') {
        appState.ovulation.lastPeriodDate = formatLocalDate(new Date());
    } else if (id === 'fuel_cost') {
        appState.fuel_cost.distance = '';
    } else if (id === 'fuel_eff') {
        appState.fuel_eff.distance = '';
        appState.fuel_eff.fuelUsed = '';
    } else if (id === 'area_cost') {
        appState.area_cost.rai = '0';
        appState.area_cost.ngan = '0';
        appState.area_cost.wa = '0';
        appState.area_cost.rate = '';
        appState.area_cost.price = '';
    } else if (id === 'tip') {
        appState.tip.bill = '';
    } else if (id === 'hex') {
        appState.hex.decValue = 0;
    } else if (id === 'lotto_calc') {
        appState.lotto_calc = {
            activeTab: 'bet',
            betNumberInput: '',
            numbersList: [],
            pricePerNumber: '20',
            payoutRate: '900',
            claimPrize: 'back2',
            claimTicketCount: '1',
            claimChannel: 'bank',
            claimCustomRate: '2.0',
            lottoSpendPerDraw: '500',
            savingsYears: '10',
            savingsRate: '7',
            luckyType: '3digit',
            luckyResult: ''
        };
    }
    rememberToolClear(snapshot);
    renderActiveTool();
}

function loadDemoForCurrentTool() {
    const id = appState.activeToolId;
    if (id === 'unit_price') {
        appState.unit_price.rows = [
            { id: 'A', price: '80', qty: '500', unit: 'g' },
            { id: 'B', price: '150', qty: '1', unit: 'kg' },
            { id: 'C', price: '320', qty: '2', unit: 'kg' },
            { id: 'D', price: '', qty: '', unit: 'g' }
        ];
    } else if (id === 'discount') {
        appState.discount = { price: '1590', discountPct: '25', extraPct: '10' };
    } else if (id === 'percent') {
        appState.percent = { mode: 'pct_of', x: '15', y: '2400', z: '5' };
    } else if (id === 'vat') {
        appState.vat = { amount: '1000', rate: '7', mode: 'exclude' };
    } else if (id === 'vat_wht') {
        appState.vat_wht = { amount: '10000', vatRate: '7', whtRate: '3', mode: 'before' };
    } else if (id === 'salary') {
        appState.salary = { income: '35000', needsPct: '50', wantsPct: '30', savingsPct: '20', emergencyPct: '10', debtPct: '10' };
    } else if (id === 'fuel_cost') {
        appState.fuel_cost = { distance: '320', efficiency: '16', oilPrice: '35.50' };
    } else if (id === 'tip') {
        appState.tip = { bill: '1850', tipPct: '10', people: '4' };
    } else if (id === 'fuel_eff') {
        appState.fuel_eff = { distance: '480', fuelUsed: '32' };
    } else if (id === 'loan') {
        appState.loan = { principal: '600000', interestRate: '3.85', months: '48', extra: '0', rateType: 'fixed', promoMonths: '12', rateAfter: '6.5', calcMethod: 'reducing' };
    } else if (id === 'savings') {
        appState.savings = { initial: '50000', monthly: '5000', interestRate: '2.5', years: '5', compound: true, mode: 'growth', goalTarget: '500000', annualIncrease: '0', inflationRate: '2.5', monthlyExpenses: '15000', emergencyMonths: '6', currentAge: '30', retirementAge: '60', retirementMonthly: '30000' };
    } else if (id === 'currency') {
        appState.currency.amount = '250';
        appState.currency.from = 'USD';
        appState.currency.to = 'THB';
    } else if (id === 'unit') {
        appState.unit = { cat: 'area', val: '2.5', fromIdx: 0, targetIdx: 1 };
    } else if (id === 'date_work') {
        appState.date_work = { startDate: formatLocalDate(new Date()), endDate: formatLocalDate(addCalendarDays(new Date(), 45)), mode: 'between', offset: 30, calendarEra: 'CE', workDays: [1, 2, 3, 4, 5], includeThaiHolidays: true, customHolidays: '' };
    } else if (id === 'date_calc') {
        appState.date_calc = { mode: 'diff', startDate: formatLocalDate(new Date()), endDate: formatLocalDate(addCalendarDays(new Date(), 90)), op: 'add', daysOffset: 30, inclusive: false, workdays: false, includeThaiHolidays: false, birthDate: '1995-08-12', referenceDate: formatLocalDate(new Date()), calendarEra: 'CE' };
    } else if (id === 'world_time') {
        appState.world_time = { search: '', use24h: true, favoriteCities: ['Asia/Bangkok', 'Asia/Tokyo', 'Europe/London', 'America/New_York'], meetingTime: '14:00', meetingDate: formatLocalDate(new Date()) };
    } else if (id === 'gpa') {
        appState.gpa.courses = [
            { name: 'คณิตศาสตร์พื้นฐาน', credit: 3, grade: '4.0' },
            { name: 'ภาษาอังกฤษเพื่อการสื่อสาร', credit: 3, grade: '3.5' },
            { name: 'การเขียนโปรแกรมคอมพิวเตอร์', credit: 3, grade: '3.5' },
            { name: 'ฟิสิกส์ทั่วไป', credit: 3, grade: '3.0' }
        ];
    } else if (id === 'health') {
        appState.health = { gender: 'male', age: '28', height: '172', weight: '68', activity: '1.375' };
    } else if (id === 'ovulation') {
        appState.ovulation = { lastPeriodDate: formatLocalDate(addCalendarDays(new Date(), -12)), cycleLength: 28, periodDays: 5 };
    } else if (id === 'area_cost') {
        appState.area_cost = { rai: '2', ngan: '1', wa: '50', rate: '1500', price: '3450000', rounds: '1' };
    } else if (id === 'hex') {
        appState.hex = { activeBase: 10, decValue: 2026 };
    } else if (id === 'calc') {
        appState.calc.expr = '1,250 × 12 + 3,500';
        appState.calc.result = '18,500';
    } else if (id === 'lotto_calc') {
        appState.lotto_calc = {
            activeTab: 'bet',
            betNumberInput: '579',
            numbersList: ['579', '597', '759', '795', '957', '975'],
            pricePerNumber: '20',
            payoutRate: '900',
            claimPrize: 'back2',
            claimTicketCount: '2',
            claimChannel: 'bank',
            claimCustomRate: '2.0',
            lottoSpendPerDraw: '500',
            savingsYears: '10',
            savingsRate: '7',
            luckyType: '3digit',
            luckyResult: '579'
        };
    }
    renderActiveTool();
}

function triggerPrintReceipt(toolId) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const targetId = toolId || appState.activeToolId;
    if (typeof hasInvalidNumericInput === 'function' && hasInvalidNumericInput(targetId)) {
        if (typeof showHistoryToast === 'function') {
            showHistoryToast('⚠️ ข้อมูลตัวเลขไม่ถูกต้อง กรุณาแก้ไขก่อนพิมพ์', false);
        }
        return;
    }
    const printEl = document.getElementById('printFormalReceipt');
    if (printEl && typeof generateFormalPrintHTML === 'function') {
        printEl.innerHTML = generateFormalPrintHTML(targetId, appState);
    }
    window.print();
}

function setStatusBanner(stateType, htmlContent) {
    if (typeof document === 'undefined') return;
    if (typeof hasInvalidNumericInput === 'function' && hasInvalidNumericInput()) {
        stateType = 'error';
        htmlContent = 'รูปแบบตัวเลขไม่ถูกต้อง กรุณาแก้ข้อมูลก่อนใช้ผลคำนวณ เช่น 1,000 หรือ ๑๐๐๐';
        document.getElementById('sharedStatusBanner')?.classList.remove('hidden');
    }
    const banner = document.getElementById('sharedStatusBanner');
    const textEl = document.getElementById('sharedStatusText');
    if (!banner || !textEl) return;
    const isAirbnb = appState.theme === 'airbnb';
    const isDark = appState.theme === 'dark' || appState.theme === 'ferrari';
    const isTogether = appState.theme === 'together';

    const baseTextPad = 'pl-3 pr-24 sm:pr-28';

    if (stateType === 'empty') {
        banner.className = 'status-banner';
        textEl.className = `text-[var(--app-muted)] text-[1rem] ${baseTextPad}`;
        textEl.innerHTML = htmlContent || 'กรุณาป้อนข้อมูลของคุณ';
    } else if (stateType === 'success') {
        if (typeof scheduleRecordHistory === 'function' && (typeof hasInvalidNumericInput !== 'function' || !hasInvalidNumericInput())) {
            scheduleRecordHistory(appState.activeToolId);
        }
        if (isAirbnb) {
            banner.className = 'status-banner !border-[#ff385c] !bg-[#fff8f9]';
            textEl.className = `text-[#222222] text-[0.98rem] font-semibold leading-snug w-full ${baseTextPad}`;
        } else if (isTogether) {
            banner.className = 'status-banner theme-success';
            textEl.className = `text-[var(--app-ink)] text-[1rem] font-bold leading-snug w-full ${baseTextPad}`;
        } else if (isDark) {
            banner.className = 'status-banner theme-success';
            textEl.className = `text-[var(--app-ink)] text-[1rem] font-bold leading-snug w-full ${baseTextPad}`;
        } else {
            banner.className = 'status-banner !bg-[#f0fdf4] !border-[#16a34a]';
            textEl.className = `text-[#15803d] text-[1rem] font-bold leading-snug w-full ${baseTextPad}`;
        }
        textEl.innerHTML = htmlContent;
    } else {
        banner.className = 'status-banner';
        textEl.className = `text-[#222222] text-[0.98rem] font-medium leading-snug w-full ${baseTextPad}`;
        textEl.innerHTML = htmlContent;
    }
}

function sanitizeSavedNumericValues(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const k of Object.keys(obj)) {
        if (typeof obj[k] === 'string' && /^\d+,\d+/.test(obj[k])) {
            obj[k] = formatInputDisplay(obj[k]);
        } else if (typeof obj[k] === 'object' && obj[k] !== null) {
            sanitizeSavedNumericValues(obj[k]);
        }
    }
}

(function(root) {
    const exportsObj = {
        captureToolSnapshot,
        rememberToolClear,
        undoLastClear,
        clearCurrentTool,
        loadDemoForCurrentTool,
        triggerPrintReceipt,
        setStatusBanner,
        sanitizeSavedNumericValues
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
