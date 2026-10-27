// ==============================================================
// Multitools Calculator - What-If Sliders & Smart Insights (Phase 8)
// Desktop-only sections that live inside the chart panels
// (src/ui/charts.js). Sliders never re-render the tool: one delegated
// listener updates the delta text in place from the current appState.
// ==============================================================

/* ---------- pure engines (unit-tested) ---------- */

// Loan: effect of paying `extraDelta` more per month on top of the current plan.
function computeLoanWhatIf(params, extraDelta) {
    const p = params || {};
    const delta = Math.max(0, safeNumber(extraDelta, 0));
    const sum = rows => rows.reduce((total, r) => total + r.interest, 0);
    const base = generateLoanSchedule(p);
    const alt = generateLoanSchedule({ ...p, extra: Math.max(0, safeNumber(p.extra, 0)) + delta });
    const baseInterest = sum(base);
    const newInterest = sum(alt);
    return {
        baseMonths: base.length,
        newMonths: alt.length,
        baseInterest,
        newInterest,
        interestSaved: Math.max(0, baseInterest - newInterest),
        monthsSaved: Math.max(0, base.length - alt.length)
    };
}

// Salary: move `shiftPct` of income from lifestyle spending into savings.
function computeSalaryWhatIf(params, shiftPct) {
    const p = params || {};
    const income = Math.max(0, safeNumber(p.income, 0));
    const wantsPct = Math.max(0, safeNumber(p.wantsPct, 0));
    const savingsPct = Math.max(0, safeNumber(p.savingsPct, 0));
    const shift = Math.min(wantsPct, Math.max(0, safeNumber(shiftPct, 0)));
    const extraMonthly = income * shift / 100;
    return {
        shift,
        newWantsPct: wantsPct - shift,
        newSavingsPct: savingsPct + shift,
        extraMonthly,
        extraYearly: extraMonthly * 12
    };
}

// Tax: effect of putting `amount` more into one deductible fund (key = param name).
function computeTaxWhatIf(params, key, amount) {
    const p = params || {};
    const add = Math.max(0, safeNumber(amount, 0));
    const base = calculatePersonalTax(p);
    const alt = calculatePersonalTax({ ...p, [key]: Math.max(0, safeNumber(p[key], 0)) + add });
    return {
        baseTax: base.totalTax,
        newTax: alt.totalTax,
        taxSaved: Math.max(0, base.totalTax - alt.totalTax),
        newNetTaxable: alt.netTaxableIncome
    };
}

// Tax: remaining deduction quota per fund and the refund it would unlock.
function computeTaxInsights(params) {
    const p = params || {};
    const base = calculatePersonalTax(p);
    const gross = base.grossIncome;
    const used = key => Math.max(0, safeNumber(p[key], 0));
    const retirementLeft = Math.max(0, 500000 - base.details.retirementCombo);
    const funds = [
        { key: 'ssf', label: 'SSF', cap: Math.min(200000, gross * 0.30), shared: true },
        { key: 'rmf', label: 'RMF', cap: Math.min(500000, gross * 0.30), shared: true },
        { key: 'thaiEsg', label: 'Thai ESG', cap: Math.min(300000, gross * 0.30), shared: false }
    ];
    return funds.map(fund => {
        let remaining = Math.max(0, fund.cap - used(fund.key));
        if (fund.shared) remaining = Math.min(remaining, retirementLeft);
        remaining = Math.floor(remaining);
        const cashBack = remaining > 0 ? computeTaxWhatIf(p, fund.key, remaining).taxSaved : 0;
        return { key: fund.key, label: fund.label, remaining, cashBack };
    });
}

// Car loan: effect of putting `extraDown` baht more into the down payment.
function computeCarLoanWhatIf(params, extraDown) {
    const p = params || {};
    const base = calculateCarLoan(p);
    const extra = Math.max(0, safeNumber(extraDown, 0));
    const alt = calculateCarLoan({ ...p, downPaymentType: 'amount', downPaymentValue: Math.min(base.price, base.downPaymentAmount + extra) });
    return {
        extraDown: Math.min(extra, Math.max(0, base.price - base.downPaymentAmount)),
        baseMonthly: base.monthlyPayment,
        newMonthly: alt.monthlyPayment,
        monthlySaved: Math.max(0, base.monthlyPayment - alt.monthlyPayment),
        interestSaved: Math.max(0, base.totalInterest - alt.totalInterest),
        newPrincipal: alt.principal,
        newTotalRepayment: alt.totalRepayment
    };
}

// Air conditioners = items with an "air..." id or an air-con name.
function isAirConditionerItem(item) {
    const it = item || {};
    return /^air/i.test(String(it.id || '')) || /แอร์|เครื่องปรับอากาศ|air\s*con/i.test(String(it.name || ''));
}

// Appliances: cut `reduceHours` per day off every air conditioner (never below 0).
function computeApplianceWhatIf(appliances, unitCost, reduceHours) {
    const list = Array.isArray(appliances) ? appliances : [];
    const rate = Math.max(0, safeNumber(unitCost, 4.5));
    const cut = Math.max(0, safeNumber(reduceHours, 0));
    const base = calculateApplianceEnergy(list, rate);
    const alt = calculateApplianceEnergy(list.map(item => (isAirConditionerItem(item)
        ? { ...item, hoursPerDay: Math.max(0, safeNumber(item.hoursPerDay, 0) - cut) }
        : item)), rate);
    const acItems = list.filter(isAirConditionerItem);
    return {
        acCount: acItems.length,
        maxHours: Math.max(0, ...acItems.map(item => safeNumber(item.hoursPerDay, 0))),
        savedKwh: Math.max(0, base.totalMonthlyKwh - alt.totalMonthlyKwh),
        savedBaht: Math.max(0, base.totalMonthlyCost - alt.totalMonthlyCost),
        savedBahtYearly: Math.max(0, base.totalMonthlyCost - alt.totalMonthlyCost) * 12,
        newMonthlyCost: alt.totalMonthlyCost
    };
}

/* ---------- section renderers ---------- */

function whatIfSection(kind, title, bodyHTML, attrs = '') {
    return `<div class="border-t border-[var(--app-hairline)] pt-3 space-y-2" data-whatif="${kind}" ${attrs}>
        <div class="font-bold text-[var(--app-ink)]">${escapeHTML(title)}</div>
        ${bodyHTML}
    </div>`;
}

function whatIfRow(label, outKey, initialText) {
    return `<div class="flex justify-between gap-2"><span class="text-[var(--app-body)]">${escapeHTML(label)}</span><b class="text-[var(--app-ink)] text-right" data-out="${outKey}">${initialText}</b></div>`;
}

function whatIfRange(id, label, min, max, step) {
    return `<label for="${id}" class="flex justify-between gap-2 font-semibold text-[var(--app-body)]"><span>${escapeHTML(label)}</span><span data-out="slider" class="text-[var(--app-ink)]">0</span></label>
        <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="0" class="w-full" style="accent-color: var(--app-accent)">`;
}

function renderLoanWhatIfSection(schedule) {
    if (!Array.isArray(schedule) || !schedule.length) return '';
    const max = Math.max(2000, Math.ceil(schedule[0].payment / 500) * 500);
    return whatIfSection('loan', 'ลองโปะเพิ่มต่อเดือน', `
        ${whatIfRange('whatifLoanExtra', 'โปะเพิ่ม (บาท/เดือน)', 0, max, 500)}
        ${whatIfRow('ดอกเบี้ยที่ประหยัดได้', 'interestSaved', '0.00 ฿')}
        ${whatIfRow('ลดระยะเวลาผ่อน', 'monthsSaved', '0 งวด')}
        ${whatIfRow('ผ่อนเสร็จใน', 'newMonths', `${schedule.length} งวด`)}`);
}

function renderSalaryWhatIfSection(params) {
    const p = params || {};
    const income = safeNumber(p.income, 0);
    const wantsPct = safeNumber(p.wantsPct, 0);
    if (income <= 0 || wantsPct <= 0) return '';
    return whatIfSection('salary', 'ลองลดไลฟ์สไตล์เพื่อออมเพิ่ม', `
        ${whatIfRange('whatifSalaryShift', 'ย้ายจากไลฟ์สไตล์ไปออม (% ของเงินเดือน)', 0, Math.floor(wantsPct), 1)}
        ${whatIfRow('ออมเพิ่มต่อเดือน', 'extraMonthly', '0.00 ฿')}
        ${whatIfRow('ออมเพิ่มต่อปี', 'extraYearly', '0.00 ฿')}
        ${whatIfRow('สัดส่วนใหม่ ไลฟ์สไตล์ / ออม', 'split', `${wantsPct}% / ${safeNumber(p.savingsPct, 0)}%`)}`);
}

function renderTaxInsightsSection(params) {
    const insights = computeTaxInsights(params);
    const open = insights.filter(i => i.remaining > 0);
    if (!open.length) {
        return whatIfSection('tax-none', 'สิทธิ์ลดหย่อนที่เหลือ', `<div class="text-[var(--app-body)]">ใช้สิทธิ์ลดหย่อน SSF, RMF และ Thai ESG ครบตามเพดานแล้ว</div>`);
    }
    const rows = insights.map(i => `<div class="flex justify-between gap-2"><span class="text-[var(--app-body)]">${i.label} เหลือสิทธิ์ ${formatMoney(i.remaining)} ฿</span><b class="text-[var(--app-ink)] whitespace-nowrap">คืนภาษี ~${formatMoney(i.cashBack)} ฿</b></div>`).join('');
    const first = open[0];
    const stepFor = r => (r >= 1000 ? 1000 : 1);
    const maxFor = r => (r >= 1000 ? Math.floor(r / 1000) * 1000 : r);
    return whatIfSection('tax', 'สิทธิ์ลดหย่อนที่เหลือ และลองซื้อเพิ่ม', `
        <div class="space-y-1">${rows}</div>
        <label for="whatifTaxFund" class="font-semibold text-[var(--app-body)] block">เลือกกองทุนที่จะลองซื้อเพิ่ม</label>
        <select id="whatifTaxFund" class="airbnb-input w-full text-xs" data-whatif-fund>${open.map(i => `<option value="${i.key}">${i.label}</option>`).join('')}</select>
        ${whatIfRange('whatifTaxAmount', 'ซื้อเพิ่ม (บาท)', 0, maxFor(first.remaining), stepFor(first.remaining))}
        ${whatIfRow('ภาษีที่ประหยัดได้', 'taxSaved', '0.00 ฿')}
        ${whatIfRow('ภาษีทั้งปีหลังซื้อเพิ่ม', 'newTax', `${formatMoney(computeTaxWhatIf(params, first.key, 0).baseTax)} ฿`)}`,
        `data-quotas="${escapeHTML(JSON.stringify(open.map(i => ({ key: i.key, remaining: i.remaining }))))}"`);
}

function renderCarLoanWhatIfSection(params) {
    const base = calculateCarLoan(params || {});
    const max = Math.floor(Math.min(base.principal, base.price * 0.3) / 5000) * 5000;
    if (!(base.principal > 0) || max < 5000) return '';
    return whatIfSection('car', 'ลองเพิ่มเงินดาวน์', `
        ${whatIfRange('whatifCarDown', 'ดาวน์เพิ่ม (บาท)', 0, max, 5000)}
        ${whatIfRow('ค่างวดลดลง', 'monthlySaved', '0.00 ฿/เดือน')}
        ${whatIfRow('ดอกเบี้ยที่ประหยัดได้', 'interestSaved', '0.00 ฿')}
        ${whatIfRow('ค่างวดใหม่', 'newMonthly', `${formatMoney(base.monthlyPayment)} ฿/เดือน`)}`);
}

function renderApplianceWhatIfSection(appliances, unitCost) {
    const info = computeApplianceWhatIf(appliances, unitCost, 0);
    if (!info.acCount || !(info.maxHours > 0)) return '';
    return whatIfSection('ac', 'ลองลดชั่วโมงเปิดแอร์', `
        ${whatIfRange('whatifAcHours', 'ลดเวลาเปิดแอร์ (ชั่วโมง/วัน)', 0, Math.floor(info.maxHours * 2) / 2, 0.5)}
        ${whatIfRow('ประหยัดค่าไฟต่อเดือน', 'savedBaht', '0.00 ฿')}
        ${whatIfRow('ประหยัดค่าไฟต่อปี', 'savedBahtYearly', '0.00 ฿')}
        ${whatIfRow('ใช้ไฟลดลง', 'savedKwh', '0.0 หน่วย/เดือน')}`);
}

/* ---------- live updates (one delegated listener, no re-render) ---------- */

function updateWhatIfSection(section, resetSlider) {
    const kind = section.dataset.whatif;
    const range = section.querySelector('input[type="range"]');
    if (!range) return;
    const set = (key, text) => {
        const el = section.querySelector(`[data-out="${key}"]`);
        if (el) el.textContent = text;
    };
    if (kind === 'tax') {
        const fund = section.querySelector('[data-whatif-fund]')?.value;
        if (resetSlider) {
            let quotas = [];
            try { quotas = JSON.parse(section.dataset.quotas || '[]'); } catch (e) { quotas = []; }
            const remaining = quotas.find(q => q.key === fund)?.remaining || 0;
            range.max = remaining >= 1000 ? Math.floor(remaining / 1000) * 1000 : remaining;
            range.step = remaining >= 1000 ? 1000 : 1;
            range.value = 0;
        }
    }
    const value = safeNumber(range.value, 0);
    if (kind === 'loan') {
        const r = computeLoanWhatIf(appState.loan, value);
        set('slider', `${formatMoney(value)} ฿`);
        set('interestSaved', `${formatMoney(r.interestSaved)} ฿`);
        set('monthsSaved', `${r.monthsSaved} งวด`);
        set('newMonths', `${r.newMonths} งวด`);
    } else if (kind === 'salary') {
        const st = appState.salary;
        const r = computeSalaryWhatIf({ income: st.income, wantsPct: st.wantsPct, savingsPct: st.savingsPct }, value);
        set('slider', `${r.shift}%`);
        set('extraMonthly', `${formatMoney(r.extraMonthly)} ฿`);
        set('extraYearly', `${formatMoney(r.extraYearly)} ฿`);
        set('split', `${r.newWantsPct}% / ${r.newSavingsPct}%`);
    } else if (kind === 'car') {
        const r = computeCarLoanWhatIf(appState.car_loan, value);
        set('slider', `${formatMoney(value)} ฿`);
        set('monthlySaved', `${formatMoney(r.monthlySaved)} ฿/เดือน`);
        set('interestSaved', `${formatMoney(r.interestSaved)} ฿`);
        set('newMonthly', `${formatMoney(r.newMonthly)} ฿/เดือน`);
    } else if (kind === 'ac') {
        const st = appState.electricity_bill;
        const rate = calculateElectricityBill(st).avgRatePerUnit || 4.5;
        const r = computeApplianceWhatIf(st.appliances, rate, value);
        set('slider', `${value} ชม./วัน`);
        set('savedBaht', `${formatMoney(r.savedBaht)} ฿`);
        set('savedBahtYearly', `${formatMoney(r.savedBahtYearly)} ฿`);
        set('savedKwh', `${r.savedKwh.toFixed(1)} หน่วย/เดือน`);
    } else if (kind === 'tax') {
        const fund = section.querySelector('[data-whatif-fund]')?.value;
        const r = computeTaxWhatIf(appState.tax_personal, fund, value);
        set('slider', `${formatMoney(value)} ฿`);
        set('taxSaved', `${formatMoney(r.taxSaved)} ฿`);
        set('newTax', `${formatMoney(r.newTax)} ฿`);
    }
}

function handleWhatIfEvent(event) {
    const section = event.target?.closest?.('[data-whatif]');
    if (!section) return;
    updateWhatIfSection(section, event.type === 'change' && event.target.matches('[data-whatif-fund]'));
}

if (typeof document !== 'undefined' && typeof document.addEventListener === 'function' && !globalThis.__whatIfBound) {
    globalThis.__whatIfBound = true;
    document.addEventListener('input', handleWhatIfEvent);
    document.addEventListener('change', handleWhatIfEvent);
}
