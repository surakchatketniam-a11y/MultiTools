// ==============================================================
// Multitools Calculator - Business & Commerce Tools
// (vat, vat_wht, percent, salary)
// ==============================================================

/* -----------------------------------------------------------
 * TOOL 6: ภาษีมูลค่าเพิ่ม (VAT Calculator)
 * ----------------------------------------------------------- */
function renderVatTool(container) {
    const st = appState.vat;
    const amt = numberOrDefault(st.amount, 0);
    const rate = numberOrDefault(st.rate, 0);

    let netPrice = 0, vatAmt = 0, grossPrice = 0;
    if (st.mode === 'exclude') {
        netPrice = amt;
        vatAmt = amt * (rate / 100);
        grossPrice = netPrice + vatAmt;
    } else {
        grossPrice = amt;
        netPrice = amt / (1 + rate / 100);
        vatAmt = grossPrice - netPrice;
    }

    container.innerHTML = `
        <div class="flex flex-col gap-2">
            <div class="segment-group grid-cols-2">
                <button class="segment-btn vat-mode ${st.mode === 'exclude' ? 'active' : ''}" data-m="exclude">บวกภาษีเพิ่ม (Add VAT)</button>
                <button class="segment-btn vat-mode ${st.mode === 'include' ? 'active' : ''}" data-m="include">ถอดภาษีจากราคารวม (Excl. VAT)</button>
            </div>

            ${createKeypadFieldHTML(0, 'จำนวนเงิน', st.amount, 'บาท', 'ป้อนจำนวนเงิน')}
            ${createKeypadFieldHTML(1, 'อัตราภาษีมูลค่าเพิ่ม (VAT)', st.rate, '%', '7')}
        </div>
    `;

    attachFieldClickListeners(container);
    container.querySelectorAll('.vat-mode').forEach(btn => {
        btn.addEventListener('click', () => {
            st.mode = btn.getAttribute('data-m');
            renderActiveTool();
        });
    });

    if (amt <= 0) {
        setStatusBanner('empty', 'กรุณาป้อนจำนวนเงินเพื่อคำนวณภาษีมูลค่าเพิ่ม');
    } else {
        setStatusBanner('success', `ก่อนภาษี: <b>${formatMoney(netPrice)}</b> | ภาษี (${rate}%): <b>${formatMoney(vatAmt)}</b><span class="block text-base text-[var(--app-accent)] underline mt-0.5">รวมภาษีสุทธิ: ${formatMoney(grossPrice)} บาท</span>`);
    }
}

/* -----------------------------------------------------------
 * TOOL: VAT + หัก ณ ที่จ่าย (Withholding Tax Calculator)
 * ----------------------------------------------------------- */
function renderVatWhtTool(container) {
    const st = appState.vat_wht;
    const amount = parseNumericInput(String(st.amount ?? '').replace(/,/g, ''));
    const vat = numberOrDefault(st.vatRate, 0);
    const wht = numberOrDefault(st.whtRate, 0);
    const base = Number.isFinite(amount) ? (st.mode === 'after' ? amount / (1 + vat / 100) : amount) : 0;
    const vatAmount = base * vat / 100;
    const gross = base + vatAmount;
    const whtAmount = base * wht / 100;
    const net = gross - whtAmount;
    container.innerHTML = `<div class="flex flex-col gap-3 p-1">
        <div class="themed-tool-card p-4 space-y-3">
            <div><label class="text-xs font-semibold text-[var(--app-body)] block mb-1">ยอดเงิน</label><input id="whtAmount" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.amount))}" placeholder="เช่น 10,000" class="airbnb-input w-full"></div>
            <div class="grid grid-cols-2 gap-2"><div><label class="text-xs font-semibold text-[var(--app-body)] block mb-1">ยอดที่กรอกคือ</label><select id="whtMode" class="airbnb-input w-full"><option value="before" ${st.mode === 'before' ? 'selected' : ''}>ยอดก่อน VAT</option><option value="after" ${st.mode === 'after' ? 'selected' : ''}>ยอดรวม VAT แล้ว</option></select></div><div><label class="text-xs font-semibold text-[var(--app-body)] block mb-1">VAT (%)</label><input id="whtVat" type="number" value="${st.vatRate}" class="airbnb-input w-full"></div></div>
            <div><label class="text-xs font-semibold text-[var(--app-body)] block mb-1">หัก ณ ที่จ่าย (%)</label><select id="whtRate" class="airbnb-input w-full"><option value="0" ${wht === 0 ? 'selected' : ''}>ไม่หัก</option><option value="1" ${wht === 1 ? 'selected' : ''}>1%</option><option value="3" ${wht === 3 ? 'selected' : ''}>3%</option><option value="5" ${wht === 5 ? 'selected' : ''}>5%</option></select></div>
        </div>
        <div class="themed-tool-card p-4 space-y-2"><div class="flex justify-between"><span>ยอดก่อน VAT</span><b>${Number.isFinite(amount) ? formatMoney(base) : '-'} บาท</b></div><div class="flex justify-between"><span>VAT ${vat}%</span><b>${Number.isFinite(amount) ? formatMoney(vatAmount) : '-'} บาท</b></div><div class="flex justify-between"><span>ยอดรวม VAT</span><b>${Number.isFinite(amount) ? formatMoney(gross) : '-'} บาท</b></div><div class="flex justify-between"><span>หัก ณ ที่จ่าย ${wht}%</span><b>${Number.isFinite(amount) ? `- ${formatMoney(whtAmount)}` : '-'} บาท</b></div><div class="mt-2 p-3 rounded-xl border border-[var(--app-accent)] bg-[var(--app-accent-soft)] text-[var(--app-ink)] theme-result-highlight flex justify-between"><span class="font-semibold">ยอดโอนสุทธิ</span><b class="text-[var(--app-accent)]">${Number.isFinite(amount) ? formatMoney(net) : '-'} บาท</b></div>${Number.isFinite(amount) ? `<div class="flex justify-end pt-1"><button id="btnPrintVatWhtSummary" type="button" class="tool-action-btn text-xs cursor-pointer">พิมพ์ใบสรุปภาษี / PDF</button></div>` : ''}</div></div>`;
    const whtInput = document.getElementById('whtAmount');
    whtInput.addEventListener('blur', () => {
        const formatted = formatInputDisplay(whtInput.value);
        st.amount = formatted;
        whtInput.value = formatted;
        persistAppState();
    });
    const rerender = () => {
        st.amount = formatInputDisplay(whtInput.value);
        st.mode = document.getElementById('whtMode').value;
        st.vatRate = document.getElementById('whtVat').value;
        st.whtRate = document.getElementById('whtRate').value;
        persistAppState();
        renderActiveTool();
    };
    ['whtAmount','whtMode','whtVat','whtRate'].forEach(id => document.getElementById(id).addEventListener('change', rerender));
    container.querySelector('#btnPrintVatWhtSummary')?.addEventListener('click', () => {
        triggerPrintReceipt('vat_wht');
    });
    setStatusBanner(Number.isFinite(amount) ? 'success' : 'empty', Number.isFinite(amount) ? `ยอดโอนสุทธิ: <span class="text-lg text-[var(--app-accent)] underline">${formatMoney(net)} บาท</span>` : 'กรุณาป้อนยอดเงินเพื่อคำนวณ VAT และหัก ณ ที่จ่าย');
}

/* -----------------------------------------------------------
 * TOOL 5: เปอร์เซ็นต์ (Percentage Calculator)
 * ----------------------------------------------------------- */
function renderPercentTool(container) {
    const st = appState.percent;
    const x = parseNumericInput(st.x);
    const y = parseNumericInput(st.y);
    const z = parseNumericInput(st.z);

    let labelX = 'เปอร์เซ็นต์ (X%)';
    let labelY = 'ของจำนวน (Y)';
    if (st.mode === 'what_pct') {
        labelX = 'จำนวนย่อย (X)';
        labelY = 'คิดเป็นกี่ % ของจำนวนเต็ม (Y)';
    } else if (st.mode === 'change') {
        labelX = 'ค่าเริ่มต้น (X)';
        labelY = 'ค่าใหม่ (Y)';
    } else if (st.mode === 'reverse') {
        labelX = 'ค่าหลังลด';
        labelY = 'ลดกี่ %';
    } else if (st.mode === 'split') {
        labelX = 'ยอดรวม';
        labelY = 'สัดส่วน (%)';
    } else if (st.mode === 'compound') {
        labelX = 'ค่าตั้งต้น';
        labelY = 'ลดครั้งที่ 1 (%)';
    } else if (st.mode === 'profit') {
        labelX = 'ต้นทุน';
        labelY = 'ราคาขาย';
    }

    container.innerHTML = `
        <div class="flex flex-col gap-2">
            <div class="segment-group grid-cols-3">
                <button class="segment-btn pct-mode ${st.mode === 'pct_of' ? 'active' : ''}" data-m="pct_of">X% ของ Y</button>
                <button class="segment-btn pct-mode ${st.mode === 'what_pct' ? 'active' : ''}" data-m="what_pct">X เป็นกี่ % ของ Y</button>
                <button class="segment-btn pct-mode ${st.mode === 'change' ? 'active' : ''}" data-m="change">% เพิ่ม/ลด</button>
            </div>
            <div class="segment-group grid-cols-2 balanced-segment-modes">
                <button class="segment-btn pct-mode ${st.mode === 'reverse' ? 'active' : ''}" data-m="reverse">ย้อนหาค่าเดิม</button>
                <button class="segment-btn pct-mode ${st.mode === 'split' ? 'active' : ''}" data-m="split">แบ่งสัดส่วน</button>
                <button class="segment-btn pct-mode ${st.mode === 'compound' ? 'active' : ''}" data-m="compound">ลดต่อเนื่อง</button>
                <button class="segment-btn pct-mode ${st.mode === 'profit' ? 'active' : ''}" data-m="profit">กำไร / Margin</button>
            </div>

            ${createKeypadFieldHTML(0, labelX, st.x, st.mode === 'pct_of' ? '%' : '', 'ป้อนค่า X')}
            ${createKeypadFieldHTML(1, labelY, st.y, '', 'ป้อนค่า Y')}
            ${st.mode === 'compound' ? createKeypadFieldHTML(2, 'ลดครั้งที่ 2 (%)', st.z, '%', 'ป้อนเปอร์เซ็นต์ครั้งที่ 2') : ''}
        </div>
    `;

    attachFieldClickListeners(container);
    container.querySelectorAll('.pct-mode').forEach(btn => {
        btn.addEventListener('click', () => {
            st.mode = btn.getAttribute('data-m');
            renderActiveTool();
        });
    });

    if (['reverse', 'split', 'compound', 'profit'].includes(st.mode)) {
        if (isNaN(x) || isNaN(y) || (st.mode === 'compound' && isNaN(z))) {
            setStatusBanner('empty', 'กรุณาป้อนข้อมูลให้ครบเพื่อคำนวณ');
        } else if (st.mode === 'reverse') {
            if (y >= 100) {
                setStatusBanner('empty', 'เปอร์เซ็นต์ลดต้องน้อยกว่า 100%');
            } else {
                const original = x / (1 - y / 100);
                const saved = original - x;
                setStatusBanner('success', `ราคาก่อนลด = <span class="text-lg text-[var(--app-accent)] underline">${formatNum(original, 2)}</span><span class="text-xs font-medium block">ส่วนต่าง ${formatNum(saved, 2)}</span>`);
            }
        } else if (st.mode === 'split') {
            const part = x * y / 100;
            setStatusBanner('success', `${formatNum(y, 2)}% ของ ${formatNum(x)} = <span class="text-lg text-[var(--app-accent)] underline">${formatNum(part, 2)}</span>`);
        } else if (st.mode === 'compound') {
            const afterFirst = x * (1 - y / 100);
            const finalValue = afterFirst * (1 - z / 100);
            const totalPct = (1 - finalValue / x) * 100;
            setStatusBanner('success', `เหลือ <span class="text-lg text-[var(--app-accent)] underline">${formatNum(finalValue, 2)}</span><span class="text-xs font-medium block">ลดจริงรวม ${formatNum(totalPct, 2)}% (ไม่ใช่ ${formatNum(y + z, 2)}% ตรงๆ)</span>`);
        } else {
            const profit = y - x;
            const markup = x === 0 ? 0 : (profit / x) * 100;
            const margin = y === 0 ? 0 : (profit / y) * 100;
            setStatusBanner('success', `กำไร <span class="text-lg text-[var(--app-accent)] underline">${formatNum(profit, 2)}</span><span class="text-xs font-medium block">Markup ${formatNum(markup, 2)}% · Margin ${formatNum(margin, 2)}%</span>`);
        }
        return;
    }

    if (isNaN(x) || isNaN(y)) {
        setStatusBanner('empty', 'กรุณาป้อนค่า X และ Y เพื่อคำนวณเปอร์เซ็นต์');
    } else if (st.mode === 'pct_of') {
        const res = (x / 100) * y;
        setStatusBanner('success', `${formatNum(x)}% ของ ${formatNum(y)} = <span class="text-lg text-[var(--app-accent)] underline">${formatNum(res, 4)}</span>`);
    } else if (st.mode === 'what_pct') {
        if (y === 0) {
            setStatusBanner('empty', 'ค่า Y ต้องไม่เป็น 0');
        } else {
            const res = (x / y) * 100;
            setStatusBanner('success', `${formatNum(x)} คิดเป็น <span class="text-lg text-[var(--app-accent)] underline">${formatNum(res, 2)}%</span> ของ ${formatNum(y)}`);
        }
    } else {
        if (x === 0) {
            setStatusBanner('empty', 'ค่าเริ่มต้น X ต้องไม่เป็น 0');
        } else {
            const diff = y - x;
            const pct = (diff / x) * 100;
            const dir = diff >= 0 ? 'เพิ่มขึ้น +' : 'ลดลง ';
            setStatusBanner('success', `เปลี่ยนแปลง: <b class="text-[var(--app-accent)]">${dir}${formatNum(pct, 2)}%</b> (ผลต่าง ${formatNum(diff, 2)})`);
        }
    }
}

/* -----------------------------------------------------------
 * PURE ENGINE: คำนวณเงินเดือนสุทธิรับจริง (Net Salary / Take-Home Pay)
 * รวม OT, โบนัส, เบี้ยขยัน, หักประกันสังคม ม.33 (5% สูงสุด 750),
 * กองทุนสำรองเลี้ยงชีพ PVD, ภาษีหัก ณ ที่จ่าย ภ.ง.ด.1 และรายการหักอื่นๆ
 * ----------------------------------------------------------- */
function calculateNetSalary(params) {
    const p = params || {};
    const baseSalary = Math.max(0, numberOrDefault(p.baseSalary !== undefined ? p.baseSalary : p.income, 0));
    const otAmount = Math.max(0, numberOrDefault(p.otAmount, 0));
    const allowance = Math.max(0, numberOrDefault(p.allowance, 0));
    const bonusMonthly = Math.max(0, numberOrDefault(p.bonusMonthly, 0));
    const hasSocialSecurity = p.hasSocialSecurity !== 'no';
    const pvdPct = Math.max(0, Math.min(15, numberOrDefault(p.pvdPct, 0)));
    const customDeduction = Math.max(0, numberOrDefault(p.customDeduction, 0));
    const additionalDeductionsYearly = Math.max(0, numberOrDefault(p.additionalDeductionsYearly, 0));

    // 1. Gross Income รายได้พึงประเมินต่อเดือน
    const grossMonthly = baseSalary + otAmount + allowance + bonusMonthly;
    const annualGross = grossMonthly * 12;

    // 2. Social Security ม.33 (5% ฐานค่าจ้าง 1,650 - 15,000 บาท = หัก 83 - 750 บาท/เดือน)
    let ssoMonthly = 0;
    if (hasSocialSecurity && baseSalary > 0) {
        const ssoBase = Math.min(15000, Math.max(1650, baseSalary));
        ssoMonthly = Math.min(750, Math.round(ssoBase * 0.05));
    }
    const annualSSO = ssoMonthly * 12;

    // 3. Provident Fund (PVD % ของเงินเดือนฐาน ไม่เกิน 15%)
    const pvdMonthly = (baseSalary > 0 && pvdPct > 0) ? Math.round(baseSalary * (pvdPct / 100)) : 0;
    const annualPVD = Math.min(annualGross * 0.15, Math.min(500000, pvdMonthly * 12));

    // 4. Monthly Withholding Tax (ภาษีเงินได้หัก ณ ที่จ่าย ภ.ง.ด.1 คำนวณตามสูตรกรมสรรพากร)
    let annualTax = 0;
    let taxMonthly = 0;
    let netTaxableAnnual = 0;
    if (annualGross > 0) {
        const standardExpense = Math.min(100000, annualGross * 0.5);
        const personalAllowance = 60000;
        const totalDeductionsForTax = standardExpense + personalAllowance + annualSSO + annualPVD + additionalDeductionsYearly;
        netTaxableAnnual = Math.max(0, annualGross - totalDeductionsForTax);

        const brackets = [
            { limit: 150000, rate: 0 },
            { limit: 150000, rate: 0.05 },
            { limit: 200000, rate: 0.10 },
            { limit: 250000, rate: 0.15 },
            { limit: 250000, rate: 0.20 },
            { limit: 1000000, rate: 0.25 },
            { limit: 3000000, rate: 0.30 },
            { limit: Infinity, rate: 0.35 }
        ];

        let remaining = netTaxableAnnual;
        for (const b of brackets) {
            if (remaining <= 0) break;
            const taxableChunk = Math.min(remaining, b.limit);
            annualTax += taxableChunk * b.rate;
            remaining -= taxableChunk;
        }

        taxMonthly = Math.round(annualTax / 12);
    }

    // 5. Total Deductions & Net Take-Home Pay
    const totalDeductions = ssoMonthly + pvdMonthly + taxMonthly + customDeduction;
    const netMonthly = Math.max(0, grossMonthly - totalDeductions);
    const effectiveDeductionPct = grossMonthly > 0 ? (totalDeductions / grossMonthly) * 100 : 0;

    return {
        baseSalary,
        otAmount,
        allowance,
        bonusMonthly,
        grossMonthly,
        annualGross,
        hasSocialSecurity,
        ssoMonthly,
        annualSSO,
        pvdPct,
        pvdMonthly,
        annualPVD,
        customDeduction,
        additionalDeductionsYearly,
        netTaxableAnnual,
        annualTax,
        taxMonthly,
        totalDeductions,
        netMonthly,
        effectiveDeductionPct
    };
}

/* -----------------------------------------------------------
 * TOOL: จัดการเงินเดือน 50/30/20 & เงินเดือนสุทธิรับจริง
 * ----------------------------------------------------------- */
function renderSalaryTool(container) {
    const st = appState.salary;
    const mode = st.mode || 'budget'; // 'budget' | 'net'

    let html = `
        <div class="salary-tool finance-thai-tool flex flex-col gap-3 p-1">
            <div class="segment-group grid-cols-2 salary-modes" role="group" aria-label="โหมดคำนวณเงินเดือน">
                <button type="button" id="btnSalaryModeBudget" aria-pressed="${mode !== 'net'}" class="segment-btn ${mode !== 'net' ? 'active' : ''}">
                    จัดสรรงบ 50/30/20
                </button>
                <button type="button" id="btnSalaryModeNet" aria-pressed="${mode === 'net'}" class="segment-btn ${mode === 'net' ? 'active' : ''}">
                    เงินเดือนสุทธิรับจริง
                </button>
            </div>
    `;

    if (mode === 'net') {
        const calc = calculateNetSalary(st);

        html += `
            <div class="salary-intro themed-tool-card p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                <span>คำนวณเงินเดือนสุทธิหลังหักภาษี ภ.ง.ด.1, ประกันสังคม และ PVD เพื่อส่งต่อยอดจริงไปจัดงบ</span>
                <button type="button" id="btnSalaryQuickToBudget" class="tool-text-btn text-xs">
                    ไปหน้างบ 50/30/20 ↗
                </button>
            </div>

            <!-- Card 1: รายได้พึงประเมิน (Earnings) -->
            <div class="themed-tool-card p-3 space-y-3">
                <div class="salary-row flex justify-between items-center text-xs font-semibold text-[var(--app-ink)] ">
                    <span>รายได้พึงประเมิน (Earnings)</span>
                    <span class="text-xs salary-muted">รวม ฿${formatMoney(calc.grossMonthly)}/เดือน</span>
                </div>
                ${createKeypadFieldHTML(0, 'เงินเดือนฐาน (Base Salary)', st.baseSalary !== undefined ? st.baseSalary : st.income, 'บาท/เดือน', 'เช่น 35,000')}
                <div class="salary-fields grid gap-2 pt-1">
                    <div>
                        <div class="salary-row flex justify-between items-center mb-1">
                            <label for="netOtAmount" class="text-xs salary-muted block">ค่าล่วงเวลา (OT)</label>
                        </div>
                        <input id="netOtAmount" type="number" min="0" value="${st.otAmount || '0'}" class="airbnb-input w-full" placeholder="บาท">
                    </div>
                    <div>
                        <label for="netAllowance" class="text-xs salary-muted block mb-1">เบี้ยขยัน/ค่าตำแหน่ง/อื่นๆ</label>
                        <input id="netAllowance" type="number" min="0" value="${st.allowance || '0'}" class="airbnb-input w-full" placeholder="บาท">
                    </div>
                    <div>
                        <label for="netBonusMonthly" class="text-xs salary-muted block mb-1">โบนัส/คอมมิชชันเฉลี่ย</label>
                        <input id="netBonusMonthly" type="number" min="0" value="${st.bonusMonthly || '0'}" class="airbnb-input w-full" placeholder="บาท">
                    </div>
                </div>
            </div>

            <!-- Card 2: รายการหัก (Deductions) -->
            <div class="themed-tool-card p-3 space-y-3">
                <div class="salary-row flex justify-between items-center text-xs font-semibold text-[var(--app-ink)] ">
                    <span>รายการหักตามกฎหมายและสวัสดิการ (Deductions)</span>
                    <span class="text-xs salary-deduction font-bold">-฿${formatMoney(calc.totalDeductions)}</span>
                </div>
                <div class="salary-fields grid gap-2 text-xs">
                    <div>
                        <label for="netSocialSecurity" class="text-xs salary-muted block mb-1">ประกันสังคม ม.33 (5%)</label>
                        <select id="netSocialSecurity" class="airbnb-input w-full text-xs">
                            <option value="yes" ${st.hasSocialSecurity !== 'no' ? 'selected' : ''}>หัก ม.33 (สูงสุด 750 บาท)</option>
                            <option value="no" ${st.hasSocialSecurity === 'no' ? 'selected' : ''}>ไม่หักประกันสังคม (0 บ.)</option>
                        </select>
                    </div>
                    <div>
                        <label for="netPvdPct" class="text-xs salary-muted block mb-1">กองทุนสำรองฯ (PVD %)</label>
                        <input id="netPvdPct" type="number" min="0" max="15" step="0.5" value="${st.pvdPct !== undefined ? st.pvdPct : '3'}" class="airbnb-input w-full text-xs" placeholder="% ของเงินเดือน">
                    </div>
                    <div>
                        <label for="netCustomDeduction" class="text-xs salary-muted block mb-1">หักอื่นๆ (กยศ./สหกรณ์/เงินกู้)</label>
                        <input id="netCustomDeduction" type="number" min="0" value="${st.customDeduction || '0'}" class="airbnb-input w-full text-xs" placeholder="บาท">
                    </div>
                </div>
                <div class="text-xs salary-muted salary-inset p-2 rounded-lg salary-row flex items-center justify-between">
                    <span>ภาษีหัก ณ ที่จ่าย (ภ.ง.ด.1 คำนวณตามขั้นบันไดอัตโนมัติ):</span>
                    <span class="font-bold text-[var(--app-ink)] ">-${formatMoney(calc.taxMonthly)} บาท/ด. (ปีละ ${formatMoney(calc.annualTax)} บ.)</span>
                </div>
            </div>

            <!-- Card 3: สรุปผลเงินเดือนสุทธิรับจริง (Net Salary Summary) -->
            <div class="themed-result-card salary-result p-4 space-y-2.5">
                <div class="salary-row flex justify-between items-center text-xs salary-muted">
                    <span>รายได้รวมก่อนหัก (Gross Income)</span>
                    <span class="font-semibold text-[var(--app-ink)] ">${formatMoney(calc.grossMonthly)} บาท</span>
                </div>
                <div class="salary-row flex justify-between items-center text-xs salary-deduction">
                    <span>รวมรายการหักทั้งสิ้น (Deductions ${formatNum(calc.effectiveDeductionPct, 1)}%)</span>
                    <span class="font-semibold">-${formatMoney(calc.totalDeductions)} บาท</span>
                </div>
                <div class="border-t border-[var(--app-hairline)] pt-3 salary-net-total">
                    <span class="text-sm font-bold text-[var(--app-ink)] ">เงินเดือนสุทธิรับจริง (Take-Home Pay)</span>
                    <span class="text-2xl font-extrabold themed-result-value  font-mono tracking-tight">
                        ฿${formatMoney(calc.netMonthly)}
                    </span>
                </div>

                <!-- Breakdown Pills -->
                <div class="grid grid-cols-3 gap-1.5 pt-1 text-xs text-center">
                    <div class="p-1.5 salary-inset  rounded-lg">
                        <span class="block salary-muted text-xs">ประกันสังคม</span>
                        <span class="font-semibold text-[var(--app-ink)] ">-${formatMoney(calc.ssoMonthly)}</span>
                    </div>
                    <div class="p-1.5 salary-inset  rounded-lg">
                        <span class="block salary-muted text-xs">กองทุน PVD</span>
                        <span class="font-semibold text-[var(--app-ink)] ">-${formatMoney(calc.pvdMonthly)}</span>
                    </div>
                    <div class="p-1.5 salary-inset  rounded-lg">
                        <span class="block salary-muted text-xs">ภาษี ภ.ง.ด.1</span>
                        <span class="font-semibold text-[var(--app-ink)] ">-${formatMoney(calc.taxMonthly)}</span>
                    </div>
                </div>

                <!-- One-click Handoff Button to 50/30/20 -->
                <div class="pt-2 flex flex-col gap-2">
                    <button type="button" id="btnHandoffTo503020" class="tool-action-btn salary-primary w-full text-xs">
                        <span>ส่งต่อยอดสุทธิ (฿${formatMoney(calc.netMonthly)}) ไปจัดงบ 50/30/20</span>
                    </button>
                    <button type="button" id="btnPrintSalarySummary" class="tool-action-btn text-xs">
                        สลิปจำลอง / PDF
                    </button>
                </div>
            </div>
        `;
    } else {
        // 50/30/20 Budget mode
        const income = numberOrDefault(st.income, 0);
        const needsPct = numberOrDefault(st.needsPct, 0);
        const wantsPct = numberOrDefault(st.wantsPct, 0);
        const savingsPct = numberOrDefault(st.savingsPct, 0);
        const emergencyPct = numberOrDefault(st.emergencyPct, 0);
        const debtPct = numberOrDefault(st.debtPct, 0);
        const totalPct = needsPct + wantsPct + savingsPct;
        const needs = income * needsPct / 100;
        const wants = income * wantsPct / 100;
        const savings = income * savingsPct / 100;
        const emergency = income * emergencyPct / 100;
        const debt = income * debtPct / 100;

        html += `
            <div class="salary-intro themed-tool-card p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                <span>ไม่แน่ใจยอดรับจริงหลังหักภาษี ภ.ง.ด.1, ประกันสังคม และ PVD?</span>
                <button type="button" id="btnQuickToNetMode" class="tool-text-btn text-xs">
                    คำนวณเงินเดือนสุทธิ ↗
                </button>
            </div>

            <div class="themed-tool-card p-3">
                <div class="text-xs salary-muted mb-2">หลักการเริ่มต้น 50/30/20: ค่าใช้จ่ายจำเป็น / ความต้องการ / ออมและลงทุน</div>
                ${createKeypadFieldHTML(0, 'เงินเดือนสุทธิที่ได้รับ', st.income, 'บาท/เดือน', 'เช่น 30,000')}
            </div>
            <div class="salary-percent-grid grid gap-2">
                ${[['salaryNeedsPct','ค่าใช้จ่ายจำเป็น (%)',st.needsPct],['salaryWantsPct','ไลฟ์สไตล์ (%)',st.wantsPct],['salarySavingsPct','ออม/ลงทุน (%)',st.savingsPct]].map(([id,label,value]) => `
                    <div class="themed-subcard p-2">
                        <label for="${id}" class="text-xs salary-muted block">${label}</label>
                        <input id="${id}" type="number" min="0" max="100" step="1" value="${value}" class="airbnb-input w-full">
                    </div>
                `).join('')}
            </div>
            <div class="themed-tool-card p-3 space-y-2">
                <div class="text-xs font-semibold salary-muted">เป้าหมายย่อยที่แนะนำ</div>
                <div class="salary-goals grid gap-2">
                    <label class="text-xs">เงินสำรองฉุกเฉิน (% ของเงินเดือน)
                        <input id="salaryEmergencyPct" type="number" min="0" max="100" value="${st.emergencyPct}" class="airbnb-input w-full mt-1">
                    </label>
                    <label class="text-xs">ชำระหนี้เพิ่มเติม (% ของเงินเดือน)
                        <input id="salaryDebtPct" type="number" min="0" max="100" value="${st.debtPct}" class="airbnb-input w-full mt-1">
                    </label>
                </div>
            </div>
            <div class="themed-result-card salary-result p-4 space-y-2">
                <div class="salary-row flex justify-between"><span>ค่าใช้จ่ายจำเป็น</span><b>${formatMoney(needs)} บาท</b></div>
                <div class="salary-row flex justify-between"><span>ความต้องการ/ไลฟ์สไตล์</span><b>${formatMoney(wants)} บาท</b></div>
                <div class="salary-row flex justify-between"><span>ออมและลงทุน</span><b>${formatMoney(savings)} บาท</b></div>
                <div class="salary-row flex justify-between text-[var(--app-accent)]"><span>เป้าหมายเงินฉุกเฉิน</span><b>${formatMoney(emergency)} บาท/เดือน</b></div>
                <div class="salary-row flex justify-between"><span>แนวทางชำระหนี้เพิ่ม</span><b>${formatMoney(debt)} บาท/เดือน</b></div>
                ${income > 0 ? `<div class="flex justify-end pt-2"><button id="btnPrintSalarySummary" type="button" class="tool-action-btn text-xs">พิมพ์แผนการเงิน / PDF</button></div>` : ''}
            </div>
            ${renderSalaryChartPanel({ income, needsPct, wantsPct, savingsPct })}
        `;
    }

    html += `</div>`;
    container.innerHTML = html;
    attachFieldClickListeners(container);

    // Tab switcher events
    container.querySelector('#btnSalaryModeBudget')?.addEventListener('click', () => {
        st.mode = 'budget';
        renderActiveTool();
    });
    container.querySelector('#btnSalaryModeNet')?.addEventListener('click', () => {
        st.mode = 'net';
        renderActiveTool();
    });
    container.querySelector('#btnQuickToNetMode')?.addEventListener('click', () => {
        st.mode = 'net';
        renderActiveTool();
    });
    container.querySelector('#btnSalaryQuickToBudget')?.addEventListener('click', () => {
        st.mode = 'budget';
        renderActiveTool();
    });

    if (mode === 'net') {
        const calc = calculateNetSalary(st);
        const saveNet = (id, key) => container.querySelector('#' + id)?.addEventListener('input', event => {
            st[key] = event.target.value;
            renderActiveTool();
        });
        saveNet('netOtAmount', 'otAmount');
        saveNet('netAllowance', 'allowance');
        saveNet('netBonusMonthly', 'bonusMonthly');
        saveNet('netPvdPct', 'pvdPct');
        saveNet('netCustomDeduction', 'customDeduction');
        container.querySelector('#netSocialSecurity')?.addEventListener('change', event => {
            st.hasSocialSecurity = event.target.value;
            renderActiveTool();
        });

        // Handoff to 50/30/20
        container.querySelector('#btnHandoffTo503020')?.addEventListener('click', () => {
            st.income = String(calc.netMonthly);
            st.mode = 'budget';
            renderActiveTool();
            setStatusBanner('success', `ส่งต่อเงินเดือนสุทธิ <b>${formatMoney(calc.netMonthly)} บาท</b> ไปจัดงบ 50/30/20 เรียบร้อยแล้ว`);
        });

        container.querySelector('#btnPrintSalarySummary')?.addEventListener('click', () => {
            triggerPrintReceipt('salary');
        });

        if (calc.grossMonthly <= 0) {
            setStatusBanner('empty', 'กรุณากรอกเงินเดือนฐานเพื่อคำนวณเงินเดือนสุทธิรับจริง');
        } else {
            setStatusBanner('success', `เงินเดือนสุทธิรับจริง <b>${formatMoney(calc.netMonthly)} บาท/เดือน</b> (ถูกหักรวม ${formatNum(calc.effectiveDeductionPct, 1)}%)`);
        }
    } else {
        const save = (id, key) => document.getElementById(id)?.addEventListener('change', event => { st[key] = event.target.value; renderActiveTool(); });
        save('salaryNeedsPct', 'needsPct');
        save('salaryWantsPct', 'wantsPct');
        save('salarySavingsPct', 'savingsPct');
        save('salaryEmergencyPct', 'emergencyPct');
        save('salaryDebtPct', 'debtPct');
        container.querySelector('#btnPrintSalarySummary')?.addEventListener('click', () => {
            triggerPrintReceipt('salary');
        });
        const income = numberOrDefault(st.income, 0);
        const needsPct = numberOrDefault(st.needsPct, 0);
        const wantsPct = numberOrDefault(st.wantsPct, 0);
        const savingsPct = numberOrDefault(st.savingsPct, 0);
        const totalPct = needsPct + wantsPct + savingsPct;
        const savings = income * savingsPct / 100;
        if (income <= 0) setStatusBanner('empty', 'กรุณากรอกเงินเดือนสุทธิที่ได้รับ');
        else if (Math.abs(totalPct - 100) > 0.01) setStatusBanner('empty', `สัดส่วนหลักรวม ${formatNum(totalPct, 0)}% ควรปรับให้รวมเท่ากับ 100%`);
        else setStatusBanner('success', `จัดสรรเงินเดือน ${formatMoney(income)} บาทเรียบร้อย · ออม/ลงทุน ${formatMoney(savings)} บาทต่อเดือน`);
    }
}

/* -----------------------------------------------------------
 * PURE ENGINE: คำนวณกำไรสุทธิขายของออนไลน์ & ค่าธรรมเนียมแพลตฟอร์ม
 * Shopee, Lazada, TikTok Shop, Direct Sales (Line/FB)
 * ----------------------------------------------------------- */
function calculateEcommerceProfit(params) {
    const p = params || {};
    const platform = p.platform || 'shopee'; // 'shopee' | 'lazada' | 'tiktok' | 'direct' | 'custom'
    const sellingPrice = Math.max(0, numberOrDefault(p.sellingPrice, 350));
    const productCost = Math.max(0, numberOrDefault(p.productCost, 150));
    const packagingCost = Math.max(0, numberOrDefault(p.packagingCost, 10));
    const shopVoucher = Math.max(0, numberOrDefault(p.shopVoucher, 0));
    const customerShipping = Math.max(0, numberOrDefault(p.customerShipping, 35));
    const sellerShipping = Math.max(0, numberOrDefault(p.sellerShipping, 35));
    const adSpendPerOrder = Math.max(0, numberOrDefault(p.adSpendPerOrder, 0));

    // อัตราค่าธรรมเนียม (%)
    const commissionRatePct = Math.max(0, numberOrDefault(p.commissionRatePct, platform === 'tiktok' ? 4.0 : (platform === 'direct' ? 0.0 : 5.0)));
    const serviceFeePct = Math.max(0, numberOrDefault(p.serviceFeePct, platform === 'shopee' ? 4.0 : (platform === 'lazada' ? 3.0 : 0.0)));
    const transactionRatePct = Math.max(0, numberOrDefault(p.transactionRatePct, platform === 'direct' ? 0.0 : 3.0));
    const isVatApplied = p.isVatApplied !== false && p.isVatApplied !== 'no';
    const vatOnFeePct = isVatApplied ? 7.0 : 0.0;

    // 1. มูลค่าสินค้าหลังหักคูปองร้านค้า (Net Merchandise Value)
    const effectiveSellingPrice = Math.max(0, sellingPrice - shopVoucher);
    // มูลค่ารวมที่ผู้ซื้อชำระทั้งหมด (Gross Order Value)
    const orderGrossValue = effectiveSellingPrice + customerShipping;

    // 2. คำนวณค่าธรรมเนียมแพลตฟอร์ม
    // - ค่าคอมมิชชัน คิดจากราคาขายหักคูปองร้าน (ไม่รวมค่าส่ง)
    const commissionFeePreVat = effectiveSellingPrice * (commissionRatePct / 100);
    // - ค่าบริการโปรแกรมส่งฟรี / เหรียญคืน คิดจากราคาขายหักคูปองร้าน
    const serviceFeePreVat = effectiveSellingPrice * (serviceFeePct / 100);
    // - ค่าธรรมเนียมการชำระเงิน/ธุรกรรม คิดจากยอดรวมที่ผู้ซื้อจ่ายทั้งหมด (รวมค่าส่ง)
    const transactionFeePreVat = orderGrossValue * (transactionRatePct / 100);

    const totalPlatformFeesPreVat = commissionFeePreVat + serviceFeePreVat + transactionFeePreVat;
    const platformVat = totalPlatformFeesPreVat * (vatOnFeePct / 100);
    const totalPlatformFees = totalPlatformFeesPreVat + platformVat;

    // 3. ต้นทุนค่าจัดส่งส่วนต่าง (กรณีร้านช่วยออกค่าส่ง หรือค่าส่งจริงแพงกว่าที่ลูกค้าจ่าย)
    const shippingDifference = Math.max(0, sellerShipping - customerShipping);

    // 4. ต้นทุนรวมทั้งหมด
    const totalDirectCosts = productCost + packagingCost + shopVoucher + shippingDifference + adSpendPerOrder;
    const totalCosts = totalDirectCosts + totalPlatformFees;

    // 5. ยอดเงินโอนเข้าบัญชีร้านค้าจากแพลตฟอร์ม (Net Payout)
    // = ยอดที่ผู้ซื้อจ่าย - ค่าธรรมเนียมแพลตฟอร์ม - ค่าส่งจริงที่ขนส่งหัก
    const netPayout = Math.max(0, orderGrossValue - totalPlatformFees - sellerShipping);

    // 6. กำไรสุทธิ (Net Profit)
    const netProfit = sellingPrice - totalCosts;
    const isProfit = netProfit >= 0;

    // 7. อัตราส่วนทางการเงิน
    const profitMarginPct = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
    const directCostBase = productCost + packagingCost;
    const markupPct = directCostBase > 0 ? (netProfit / directCostBase) * 100 : 0;
    const roiPct = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

    // 8. จุดคุ้มทุน (ราคาขายขั้นต่ำที่ไม่ขาดทุน: Breakeven Selling Price)
    // Breakeven Price P: P * (1 - TotalFeeRate) = productCost + packagingCost + adSpend + shippingDiff
    const totalFeeRateDecimal = ((commissionRatePct + serviceFeePct + transactionRatePct) * (1 + vatOnFeePct / 100)) / 100;
    let breakevenPrice = 0;
    if (totalFeeRateDecimal < 0.99) {
        const requiredCost = productCost + packagingCost + adSpendPerOrder + shippingDifference;
        breakevenPrice = requiredCost / (1 - totalFeeRateDecimal);
    }

    return {
        platform,
        sellingPrice,
        productCost,
        packagingCost,
        shopVoucher,
        customerShipping,
        sellerShipping,
        adSpendPerOrder,
        commissionRatePct,
        serviceFeePct,
        transactionRatePct,
        isVatApplied,
        vatOnFeePct,
        effectiveSellingPrice,
        orderGrossValue,
        commissionFeePreVat,
        serviceFeePreVat,
        transactionFeePreVat,
        totalPlatformFeesPreVat,
        platformVat,
        totalPlatformFees,
        shippingDifference,
        totalDirectCosts,
        totalCosts,
        netPayout,
        netProfit,
        isProfit,
        profitMarginPct,
        markupPct,
        roiPct,
        breakevenPrice
    };
}

/* -----------------------------------------------------------
 * UI RENDERER: กำไรสุทธิขายของออนไลน์ & Shopee/TikTok Fees
 * ----------------------------------------------------------- */
function renderEcommerceProfitTool(container) {
    const st = appState.ecommerce_profit || {
        platform: 'shopee',
        sellingPrice: '350',
        productCost: '150',
        packagingCost: '10',
        shopVoucher: '0',
        customerShipping: '35',
        sellerShipping: '35',
        adSpendPerOrder: '30',
        commissionRatePct: '5.0',
        serviceFeePct: '4.0',
        transactionRatePct: '3.0',
        isVatApplied: 'yes'
    };

    const calc = calculateEcommerceProfit({
        platform: st.platform,
        sellingPrice: parseNumericInput(st.sellingPrice),
        productCost: parseNumericInput(st.productCost),
        packagingCost: parseNumericInput(st.packagingCost),
        shopVoucher: parseNumericInput(st.shopVoucher),
        customerShipping: parseNumericInput(st.customerShipping),
        sellerShipping: parseNumericInput(st.sellerShipping),
        adSpendPerOrder: parseNumericInput(st.adSpendPerOrder),
        commissionRatePct: parseNumericInput(st.commissionRatePct),
        serviceFeePct: parseNumericInput(st.serviceFeePct),
        transactionRatePct: parseNumericInput(st.transactionRatePct),
        isVatApplied: st.isVatApplied !== 'no'
    });

    const isShopee = st.platform === 'shopee';
    const isLazada = st.platform === 'lazada';
    const isTiktok = st.platform === 'tiktok';
    const isDirect = st.platform === 'direct';
    const isCustom = st.platform === 'custom';

    container.innerHTML = `
        <div class="finance-thai-tool ecommerce-tool flex flex-col gap-3 p-1">
            <!-- Platform Selector -->
            <div class="themed-tool-card p-4 space-y-2">
                <div class="tool-section-heading flex flex-wrap items-center justify-between gap-2">
                    <label class="text-xs font-bold text-[var(--app-muted)]">เลือกแพลตฟอร์มขายสินค้า</label>
                    <span class="text-[11px] font-semibold text-[var(--app-ink)]">ปรับอัตราให้ตรงกับร้านของคุณ</span>
                </div>
                <div class="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                    <button type="button" class="btn-ecom-plat tool-chip-btn" aria-pressed="${isShopee}" data-plat="shopee">
                        Shopee
                    </button>
                    <button type="button" class="btn-ecom-plat tool-chip-btn" aria-pressed="${isLazada}" data-plat="lazada">
                        Lazada
                    </button>
                    <button type="button" class="btn-ecom-plat tool-chip-btn" aria-pressed="${isTiktok}" data-plat="tiktok">
                        TikTok
                    </button>
                    <button type="button" class="btn-ecom-plat tool-chip-btn" aria-pressed="${isDirect}" data-plat="direct">
                        ขายตรง (LINE)
                    </button>
                    <button type="button" class="btn-ecom-plat tool-chip-btn" aria-pressed="${isCustom}" data-plat="custom">
                        กำหนดเอง
                    </button>
                </div>
            </div>

            <!-- Card 1: ราคาขายและโปรโมชัน -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)] border-b border-[var(--app-hairline)] pb-1.5 tool-section-heading flex flex-wrap justify-between items-center gap-2">
                    <span>1. ราคาขายและโปรโมชันหน้าร้าน</span>
                    <span class="text-[11px] font-normal text-[var(--app-muted)]">ใส่ราคาตั้งขาย</span>
                </div>
                <div>
                    <label class="text-xs font-medium text-[var(--app-muted)] block mb-1">ราคาตั้งขายต่อชิ้น (บาท)</label>
                    <div class="relative">
                        <input id="ecomSellingPrice" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.sellingPrice))}" class="airbnb-input w-full font-bold text-base text-[var(--app-ink)] pr-12" placeholder="เช่น 350">
                        <span class="absolute right-3 top-2.5 text-xs text-[var(--app-muted)]">บาท</span>
                    </div>
                    <!-- Quick Price Step Chips -->
                    <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span class="text-[11px] text-[var(--app-muted)]">บวกราคา:</span>
                        <button type="button" class="btn-quick-price tool-chip-btn" data-add="10">+10</button>
                        <button type="button" class="btn-quick-price tool-chip-btn" data-add="20">+20</button>
                        <button type="button" class="btn-quick-price tool-chip-btn" data-add="50">+50</button>
                        <button type="button" class="btn-quick-price tool-chip-btn" data-add="100">+100</button>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2.5">
                    <div>
                        <label class="text-xs font-medium text-[var(--app-muted)] block mb-1">คูปองส่วนลดที่ร้านออกให้ (บาท)</label>
                        <input id="ecomShopVoucher" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.shopVoucher))}" class="airbnb-input w-full text-xs" placeholder="เช่น 20 (ถ้าไม่มีใส่ 0)">
                    </div>
                    <div>
                        <label class="text-xs font-medium text-[var(--app-muted)] block mb-1">ค่าส่งที่ลูกค้าจ่ายหน้าร้าน (บาท)</label>
                        <input id="ecomCustomerShipping" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.customerShipping))}" class="airbnb-input w-full text-xs" placeholder="เช่น 35">
                    </div>
                </div>
            </div>

            <!-- Card 2: ต้นทุนสินค้าและการดำเนินการ -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)] border-b border-[var(--app-hairline)] pb-1.5">
                    2. ต้นทุนสินค้า ค่าแพ็ค และค่าโฆษณา
                </div>
                <div class="grid grid-cols-2 gap-2.5">
                    <div>
                        <label class="text-xs font-medium text-[var(--app-muted)] block mb-1">ราคาทุนสินค้า / ผลิต (บาท)</label>
                        <input id="ecomProductCost" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.productCost))}" class="airbnb-input w-full text-xs font-semibold" placeholder="เช่น 150">
                    </div>
                    <div>
                        <label class="text-xs font-medium text-[var(--app-muted)] block mb-1">ค่ากล่อง / เทป / ซองแพ็ค (บาท)</label>
                        <input id="ecomPackagingCost" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.packagingCost))}" class="airbnb-input w-full text-xs" placeholder="เช่น 10">
                    </div>
                    <div>
                        <label class="text-xs font-medium text-[var(--app-muted)] block mb-1">ค่าส่งจริงที่ขนส่งหัก (บาท)</label>
                        <input id="ecomSellerShipping" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.sellerShipping))}" class="airbnb-input w-full text-xs" placeholder="เช่น 35">
                    </div>
                    <div>
                        <label class="text-xs font-medium text-[var(--app-muted)] block mb-1">งบยิงแอด/โฆษณาเฉลี่ยต่อออเดอร์ (บาท)</label>
                        <input id="ecomAdSpend" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.adSpendPerOrder))}" class="airbnb-input w-full text-xs" placeholder="เช่น 30 (ถ้าไม่ยิงใส่ 0)">
                    </div>
                </div>
            </div>

            <!-- Card 3: อัตราค่าธรรมเนียมแพลตฟอร์ม -->
            <div class="themed-tool-card p-4 space-y-2.5">
                <div class="text-xs font-bold text-[var(--app-ink)] border-b border-[var(--app-hairline)] pb-1.5 tool-section-heading flex flex-wrap justify-between items-center gap-2">
                    <span>3. โครงสร้างค่าธรรมเนียม (${escapeHTML(calc.platform.toUpperCase())})</span>
                    <label class="flex items-center gap-1.5 text-[11px] text-[var(--app-muted)] cursor-pointer">
                        <input id="ecomVatCheck" type="checkbox" ${calc.isVatApplied ? 'checked' : ''} class="rounded border-[var(--app-hairline)] text-[var(--app-ink)]">
                        <span>คิด VAT 7% เพิ่มบนค่าธรรมเนียม</span>
                    </label>
                </div>
                <div class="grid grid-cols-3 gap-2 text-xs">
                    <div>
                        <label class="text-[11px] text-[var(--app-muted)] block mb-1">คอมมิชชัน (%)</label>
                        <input id="ecomCommission" type="number" step="0.1" value="${st.commissionRatePct}" class="airbnb-input w-full text-xs text-center font-semibold">
                    </div>
                    <div>
                        <label class="text-[11px] text-[var(--app-muted)] block mb-1">โปรแกรมส่งฟรี (%)</label>
                        <input id="ecomService" type="number" step="0.1" value="${st.serviceFeePct}" class="airbnb-input w-full text-xs text-center font-semibold">
                    </div>
                    <div>
                        <label class="text-[11px] text-[var(--app-muted)] block mb-1">ธุรกรรม/ชำระเงิน (%)</label>
                        <input id="ecomTransaction" type="number" step="0.1" value="${st.transactionRatePct}" class="airbnb-input w-full text-xs text-center font-semibold">
                    </div>
                </div>
            </div>

            <!-- HERO SUMMARY CARD -->
            <div class="themed-result-card ${calc.isProfit ? 'is-profit' : 'is-loss'} p-5 space-y-3">
                <div class="tool-section-heading flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <span class="text-xs font-semibold text-[var(--app-muted)]">
                            ${calc.isProfit ? 'กำไรสุทธิต่อออเดอร์' : 'ขาดทุนต่อออเดอร์'}
                        </span>
                        <div class="themed-result-value text-2xl md:text-3xl font-extrabold mt-1">
                            ${formatMoney(calc.netProfit)} บาท
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="tool-metric-chip">
                            Margin ${formatNum(calc.profitMarginPct, 1)}%
                        </span>
                        <div class="text-[11px] text-[var(--app-muted)] mt-1">
                            Markup: ${formatNum(calc.markupPct, 1)}%
                        </div>
                    </div>
                </div>

                <!-- Sub KPI Grid -->
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--app-hairline)]">
                    <div class="themed-subcard p-3">
                        <div class="text-[11px] text-[var(--app-muted)] font-medium">ราคาขายขั้นต่ำที่ไม่ขาดทุน (Breakeven)</div>
                        <div class="text-base font-bold text-[var(--app-ink)] mt-0.5">${formatMoney(calc.breakevenPrice)} ฿</div>
                        <div class="text-[11px] text-[var(--app-muted)]">ขายต่ำกว่านี้จะเริ่มเข้าเนื้อ</div>
                    </div>
                    <div class="themed-subcard p-3">
                        <div class="text-[11px] text-[var(--app-muted)] font-medium">เงินโอนเข้าบัญชีจริง (Net Payout)</div>
                        <div class="text-base font-bold text-[var(--app-ink)] mt-0.5">${formatMoney(calc.netPayout)} ฿</div>
                        <div class="text-[11px] text-[var(--app-muted)]">หลังหักค่าธรรมเนียมและค่าส่ง</div>
                    </div>
                </div>
            </div>

            <!-- ITEMIZED COST BREAKDOWN -->
            <div class="themed-tool-card p-4 space-y-2 text-xs">
                <div class="font-bold text-[var(--app-ink)] border-b border-[var(--app-hairline)] pb-1.5 flex justify-between gap-3">
                    <span>ตารางแจกแจงค่าธรรมเนียมและต้นทุน</span>
                    <span>สัดส่วน</span>
                </div>
                <div class="flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">1. ต้นทุนตัวสินค้า (COGS)</span>
                    <b class="text-[var(--app-ink)]">${formatMoney(calc.productCost)} ฿ (${calc.sellingPrice > 0 ? formatNum((calc.productCost / calc.sellingPrice) * 100, 1) : 0}%)</b>
                </div>
                <div class="flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">2. ค่ากล่องและบรรจุภัณฑ์</span>
                    <b class="text-[var(--app-ink)]">${formatMoney(calc.packagingCost)} ฿</b>
                </div>
                <div class="flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">3. คูปองส่วนลดร้านค้า</span>
                    <b class="text-[var(--app-ink)]">${formatMoney(calc.shopVoucher)} ฿</b>
                </div>
                <div class="flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">4. รวมค่าธรรมเนียมแพลตฟอร์ม ${calc.isVatApplied ? '(รวม VAT 7%)' : ''}</span>
                    <b class="text-[var(--app-ink)]">-${formatMoney(calc.totalPlatformFees)} ฿ (${calc.sellingPrice > 0 ? formatNum((calc.totalPlatformFees / calc.sellingPrice) * 100, 1) : 0}%)</b>
                </div>
                <div class="pl-3 space-y-0.5 text-[11px] text-[var(--app-muted)] border-l-2 border-[var(--app-hairline)]">
                    <div class="flex justify-between gap-3">
                        <span>• ค่าคอมมิชชัน (${calc.commissionRatePct}%)</span>
                        <span>${formatMoney(calc.commissionFeePreVat)} ฿</span>
                    </div>
                    <div class="flex justify-between gap-3">
                        <span>• ค่าบริการโปรแกรมส่งฟรี (${calc.serviceFeePct}%)</span>
                        <span>${formatMoney(calc.serviceFeePreVat)} ฿</span>
                    </div>
                    <div class="flex justify-between gap-3">
                        <span>• ค่าธุรกรรมการชำระเงิน (${calc.transactionRatePct}%)</span>
                        <span>${formatMoney(calc.transactionFeePreVat)} ฿</span>
                    </div>
                    ${calc.isVatApplied ? `
                        <div class="flex justify-between gap-3 text-[var(--app-muted)]">
                            <span>• ภาษีมูลค่าเพิ่ม (VAT 7% บนค่าธรรมเนียม)</span>
                            <span>${formatMoney(calc.platformVat)} ฿</span>
                        </div>
                    ` : ''}
                </div>
                <div class="flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">5. ค่าขนส่งส่วนต่างที่ร้านออกเพิ่ม</span>
                    <b class="text-[var(--app-ink)]">${formatMoney(calc.shippingDifference)} ฿</b>
                </div>
                <div class="flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">6. ค่ายิงแอด/โฆษณาต่อออเดอร์</span>
                    <b class="text-[var(--app-ink)]">${formatMoney(calc.adSpendPerOrder)} ฿</b>
                </div>
                <div class="border-t border-[var(--app-hairline)] pt-1.5 flex justify-between gap-3 font-bold text-[var(--app-ink)]">
                    <span>รวมต้นทุนค่าใช้จ่ายทั้งหมด (Total Costs)</span>
                    <span class="text-[var(--app-ink)]">${formatMoney(calc.totalCosts)} ฿</span>
                </div>

                <div class="flex justify-end pt-2">
                    <button id="btnPrintEcomReceipt" type="button" class="tool-action-btn text-xs">
                        พิมพ์ใบสรุปกำไร / บันทึก PDF
                    </button>
                </div>
            </div>
        </div>
    `;

    // Event Handlers
    // 1. Platform switcher
    container.querySelectorAll('.btn-ecom-plat').forEach(btn => {
        btn.addEventListener('click', () => {
            const plat = btn.dataset.plat;
            st.platform = plat;
            if (plat === 'shopee') {
                st.commissionRatePct = '5.0';
                st.serviceFeePct = '4.0';
                st.transactionRatePct = '3.0';
                st.isVatApplied = 'yes';
            } else if (plat === 'lazada') {
                st.commissionRatePct = '5.0';
                st.serviceFeePct = '3.0';
                st.transactionRatePct = '3.0';
                st.isVatApplied = 'yes';
            } else if (plat === 'tiktok') {
                st.commissionRatePct = '4.0';
                st.serviceFeePct = '0.0';
                st.transactionRatePct = '3.0';
                st.isVatApplied = 'yes';
            } else if (plat === 'direct') {
                st.commissionRatePct = '0.0';
                st.serviceFeePct = '0.0';
                st.transactionRatePct = '0.0';
                st.isVatApplied = 'no';
            }
            persistAppState();
            renderActiveTool();
        });
    });

    // 2. Quick price step adders
    container.querySelectorAll('.btn-quick-price').forEach(btn => {
        btn.addEventListener('click', () => {
            const add = parseFloat(btn.dataset.add) || 0;
            const current = parseNumericInput(st.sellingPrice) || 0;
            st.sellingPrice = formatInputDisplay(String(current + add));
            persistAppState();
            renderActiveTool();
        });
    });

    // 3. Inputs formatting and binding
    const bindInput = (id, stateKey) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('change', () => {
            st[stateKey] = input.value;
            persistAppState();
            renderActiveTool();
        });
        input.addEventListener('blur', () => {
            const formatted = formatInputDisplay(input.value);
            st[stateKey] = formatted;
            input.value = formatted;
            persistAppState();
        });
    };

    bindInput('ecomSellingPrice', 'sellingPrice');
    bindInput('ecomProductCost', 'productCost');
    bindInput('ecomPackagingCost', 'packagingCost');
    bindInput('ecomShopVoucher', 'shopVoucher');
    bindInput('ecomCustomerShipping', 'customerShipping');
    bindInput('ecomSellerShipping', 'sellerShipping');
    bindInput('ecomAdSpend', 'adSpendPerOrder');

    // Fee rates binding
    const bindFee = (id, stateKey) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('change', () => {
            st[stateKey] = input.value;
            st.platform = 'custom';
            persistAppState();
            renderActiveTool();
        });
    };
    bindFee('ecomCommission', 'commissionRatePct');
    bindFee('ecomService', 'serviceFeePct');
    bindFee('ecomTransaction', 'transactionRatePct');

    const vatCheck = document.getElementById('ecomVatCheck');
    if (vatCheck) {
        vatCheck.addEventListener('change', () => {
            st.isVatApplied = vatCheck.checked ? 'yes' : 'no';
            persistAppState();
            renderActiveTool();
        });
    }

    container.querySelector('#btnPrintEcomReceipt')?.addEventListener('click', () => {
        triggerPrintReceipt('ecommerce_profit');
    });

    // Status Banner
    if (calc.sellingPrice <= 0) {
        setStatusBanner('empty', 'กรุณาระบุราคาตั้งขายต่อชิ้นเพื่อคำนวณกำไรและค่าธรรมเนียม');
    } else if (calc.isProfit) {
        setStatusBanner('success', `กำไรสุทธิ <b>${formatMoney(calc.netProfit)} บาท/ออเดอร์</b> (Margin ${formatNum(calc.profitMarginPct, 1)}%) · เงินโอนเข้าบัญชี ${formatMoney(calc.netPayout)} บาท`);
    } else {
        setStatusBanner('empty', `ขาดทุน <b>${formatMoney(Math.abs(calc.netProfit))} บาท</b> · ราคาขายขั้นต่ำที่ไม่ขาดทุนคือ ${formatMoney(calc.breakevenPrice)} บาท`);
    }
}

/* -----------------------------------------------------------
 * ENGINE: คำนวณต้นทุนอาหาร & เครื่องดื่ม (F&B Recipe Costing)
 * ----------------------------------------------------------- */
function calculateFoodCosting(options = {}) {
    const toNum = (val, def = 0) => {
        if (typeof val === 'number') return Number.isFinite(val) ? val : def;
        if (typeof parseNumericInput === 'function') {
            const parsed = parseNumericInput(val);
            return Number.isFinite(parsed) ? parsed : def;
        }
        const clean = String(val ?? '').trim().replace(/,/g, '');
        const n = parseFloat(clean);
        return Number.isFinite(n) ? n : def;
    };

    const recipeName = options.recipeName || 'สูตรอาหาร/เครื่องดื่ม';
    const batchYield = Math.max(1, toNum(options.batchYield, 1));
    const targetFoodCostPct = Math.max(1, Math.min(99, toNum(options.targetFoodCostPct, 30)));
    const sellingPrice = Math.max(0, toNum(options.sellingPrice, 0));
    const packagingCost = Math.max(0, toNum(options.packagingCost, 0));
    const hiddenCostBufferPct = Math.max(0, toNum(options.hiddenCostBufferPct, 0));

    const rawIngredients = Array.isArray(options.ingredients) ? options.ingredients : [];

    // Helper: แปลงหน่วยเป็น Base Unit (g, ml, piece)
    function normalizeUnit(amount, unit) {
        const u = String(unit || 'g').toLowerCase().trim();
        if (u === 'kg') return { val: amount * 1000, base: 'g', family: 'mass' };
        if (u === 'g') return { val: amount, base: 'g', family: 'mass' };
        if (u === 'l') return { val: amount * 1000, base: 'ml', family: 'volume' };
        if (u === 'ml') return { val: amount, base: 'ml', family: 'volume' };
        return { val: amount, base: 'piece', family: 'count' };
    }

    let rawBatchCost = 0;
    const itemized = rawIngredients.map((item, idx) => {
        const name = String(item.name || `วัตถุดิบ ${idx + 1}`).trim();
        const packPrice = Math.max(0, toNum(item.packPrice, 0));
        const packSize = Math.max(0.0001, toNum(item.packSize, 1));
        const packUnit = item.packUnit || 'g';
        const useAmount = Math.max(0, toNum(item.useAmount, 0));
        const useUnit = item.useUnit || 'g';
        const rawYield = toNum(item.yieldPct, 100);
        const yieldPct = (rawYield > 0 && rawYield <= 100) ? rawYield : 100;

        const packNorm = normalizeUnit(packSize, packUnit);
        const useNorm = normalizeUnit(useAmount, useUnit);

        let unitCost = 0;
        let lineCost = 0;

        if (packNorm.family === useNorm.family) {
            unitCost = packNorm.val > 0 ? (packPrice / packNorm.val) : 0;
            lineCost = (useNorm.val * unitCost) / (yieldPct / 100);
        } else {
            unitCost = packSize > 0 ? (packPrice / packSize) : 0;
            lineCost = (useAmount * unitCost) / (yieldPct / 100);
        }

        lineCost = Math.round(lineCost * 100) / 100;
        rawBatchCost += lineCost;

        return {
            id: item.id || String(idx + 1),
            name,
            packPrice,
            packSize,
            packUnit,
            useAmount,
            useUnit,
            yieldPct,
            unitCost: Math.round(unitCost * 10000) / 10000,
            lineCost
        };
    });

    rawBatchCost = Math.round(rawBatchCost * 100) / 100;

    // ต้นทุนต่อจาน/เสิร์ฟ (Portion Cost)
    const rawCostPerPortion = Math.round((rawBatchCost / batchYield) * 100) / 100;
    const hiddenCostBuffer = Math.round((rawCostPerPortion * (hiddenCostBufferPct / 100)) * 100) / 100;
    const foodCostPerPortion = Math.round((rawCostPerPortion + hiddenCostBuffer) * 100) / 100;
    const totalCostPerPortion = Math.round((foodCostPerPortion + packagingCost) * 100) / 100;

    // ราคาขายแนะนำตาม Target Food Cost %
    const suggestedSellingPrice = targetFoodCostPct > 0
        ? Math.round((totalCostPerPortion / (targetFoodCostPct / 100)) * 100) / 100
        : totalCostPerPortion;

    // ปัดเศษให้เป็นตัวเลขกลมๆ สวยงามสำหรับการค้า (Commercial Rounding ปัดขึ้นทีละ 5 บาท)
    const suggestedPriceRounded = Math.ceil(suggestedSellingPrice / 5) * 5;

    // วิเคราะห์กำไรจากราคาขายจริง (Actual Selling Price)
    const hasActualPrice = sellingPrice > 0;
    const grossProfit = hasActualPrice ? Math.round((sellingPrice - totalCostPerPortion) * 100) / 100 : 0;
    const actualFoodCostPct = (hasActualPrice && sellingPrice > 0)
        ? Math.round(((totalCostPerPortion / sellingPrice) * 100) * 10) / 10
        : 0;
    const grossMarginPct = (hasActualPrice && sellingPrice > 0)
        ? Math.round(((grossProfit / sellingPrice) * 100) * 10) / 10
        : 0;
    const markupPct = totalCostPerPortion > 0
        ? Math.round(((grossProfit / totalCostPerPortion) * 100) * 10) / 10
        : 0;
    const isProfit = grossProfit >= 0;

    return {
        recipeName,
        batchYield,
        targetFoodCostPct,
        sellingPrice,
        packagingCost,
        hiddenCostBufferPct,
        ingredients: itemized,
        summary: {
            rawBatchCost,
            rawCostPerPortion,
            hiddenCostBuffer,
            foodCostPerPortion,
            packagingCost,
            totalCostPerPortion,
            suggestedSellingPrice,
            suggestedPriceRounded,
            hasActualPrice,
            grossProfit,
            actualFoodCostPct,
            grossMarginPct,
            markupPct,
            isProfit
        }
    };
}

/* -----------------------------------------------------------
 * UI RENDERER: คำนวณต้นทุนอาหาร & เครื่องดื่ม (F&B Recipe Costing)
 * ----------------------------------------------------------- */
function renderFoodCostingTool(container) {
    if (!container) return;
    const st = appState.food_costing || {
        recipeName: 'ข้าวกะเพราหมูสับไข่ดาว',
        batchYield: '1',
        targetFoodCostPct: '30',
        sellingPrice: '65',
        packagingCost: '4.5',
        hiddenCostBufferPct: '5',
        ingredients: [
            { id: '1', name: 'หมูสับ', packPrice: '160', packSize: '1000', packUnit: 'g', useAmount: '120', useUnit: 'g', yieldPct: '100' },
            { id: '2', name: 'ข้าวสวยสุก', packPrice: '45', packSize: '2500', packUnit: 'g', useAmount: '200', useUnit: 'g', yieldPct: '100' },
            { id: '3', name: 'ไข่ไก่ (เบอร์ 2)', packPrice: '120', packSize: '30', packUnit: 'piece', useAmount: '1', useUnit: 'piece', yieldPct: '100' },
            { id: '4', name: 'ใบกะเพรา + พริกกระเทียม', packPrice: '50', packSize: '500', packUnit: 'g', useAmount: '30', useUnit: 'g', yieldPct: '90' }
        ]
    };
    appState.food_costing = st;

    if (!Array.isArray(st.ingredients) || st.ingredients.length === 0) {
        st.ingredients = [{ id: '1', name: 'วัตถุดิบหลัก 1', packPrice: '', packSize: '1000', packUnit: 'g', useAmount: '', useUnit: 'g', yieldPct: '100' }];
    }

    const calc = calculateFoodCosting(st);

    const unitOptions = [
        { key: 'g', label: 'กรัม (g)' },
        { key: 'kg', label: 'กิโลกรัม (kg)' },
        { key: 'ml', label: 'มิลลิลิตร (ml)' },
        { key: 'l', label: 'ลิตร (L)' },
        { key: 'piece', label: 'ชิ้น/ฟอง/แผ่น' }
    ];

    let html = `
        <div class="food-costing-tool flex flex-col gap-3 p-1">
            <!-- 1. การ์ดข้อมูลเมนู & เป้าหมาย Food Cost (Recipe Header Card) -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="flex justify-between items-center text-xs font-semibold">
                    <label for="foodRecipeName">ชื่อเมนู / รายการสูตร</label>
                    <div class="flex gap-1.5">
                        <button type="button" id="btnFoodPresetKaprao" class="tool-chip-btn text-xs">
                            สูตรกะเพราไข่ดาว
                        </button>
                        <button type="button" id="btnFoodPresetTea" class="tool-chip-btn text-xs">
                            สูตรชาไทย/กาแฟ
                        </button>
                    </div>
                </div>
                <input id="foodRecipeName" type="text" value="${escapeHTML(st.recipeName || '')}" class="airbnb-input w-full font-bold text-sm" placeholder="เช่น ข้าวกะเพราหมูสับ หรือ ชาไทยเย็น">

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                        <label for="foodBatchYield" class="block mb-1" style="color: var(--app-muted);">จำนวนเสิร์ฟที่ทำได้ต่อสูตร (Batch Yield)</label>
                        <div class="relative">
                            <input id="foodBatchYield" type="text" inputmode="numeric" value="${escapeHTML(st.batchYield || '1')}" class="airbnb-input w-full font-semibold pr-16" placeholder="1">
                            <span class="absolute right-3 top-2.5 text-xs pointer-events-none" style="color: var(--app-muted);">จาน/แก้ว</span>
                        </div>
                    </div>
                    <div>
                        <label for="foodTargetCostPct" class="block mb-1" style="color: var(--app-muted);">Food Cost เป้าหมาย (%)</label>
                        <div class="relative">
                            <input id="foodTargetCostPct" type="text" inputmode="decimal" value="${escapeHTML(st.targetFoodCostPct || '30')}" class="airbnb-input w-full font-semibold pr-8" placeholder="30">
                            <span class="absolute right-3 top-2.5 text-xs pointer-events-none" style="color: var(--app-muted);">%</span>
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                    <span class="text-xs" style="color: var(--app-muted);">เป้าหมายแนะนำ:</span>
                    <button type="button" class="tool-chip-btn food-chip-target" data-val="20">20% เครื่องดื่ม</button>
                    <button type="button" class="tool-chip-btn food-chip-target" data-val="25">25% คาเฟ่</button>
                    <button type="button" class="tool-chip-btn food-chip-target" data-val="30">30% อาหารทั่วไป</button>
                    <button type="button" class="tool-chip-btn food-chip-target" data-val="35">35% มาตรฐาน</button>
                    <button type="button" class="tool-chip-btn food-chip-target" data-val="40">40% บุฟเฟต์</button>
                </div>
            </div>

            <!-- 2. การ์ดรายการวัตถุดิบ (Ingredients List Card) -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="flex justify-between items-center text-xs font-semibold">
                    <span>รายการวัตถุดิบ (${st.ingredients.length} รายการ)</span>
                    <button type="button" id="btnAddFoodIngredient" class="tool-action-btn text-xs">
                        + เพิ่มวัตถุดิบ
                    </button>
                </div>

                <div class="space-y-3" id="foodIngredientsList">
                    ${st.ingredients.map((ing, idx) => {
                        const itemCalc = calc.ingredients[idx] || { lineCost: 0 };
                        return `
                            <div class="themed-subcard p-3 space-y-2.5" data-ing-id="${escapeHTML(ing.id)}">
                                <div class="flex items-center justify-between gap-2">
                                    <div class="flex-1">
                                        <label for="foodIngName_${escapeHTML(ing.id)}" class="sr-only">ชื่อวัตถุดิบ ${idx + 1}</label>
                                        <input id="foodIngName_${escapeHTML(ing.id)}" type="text" value="${escapeHTML(ing.name || '')}" class="airbnb-input w-full text-xs font-semibold food-ing-name" data-ing-id="${escapeHTML(ing.id)}" placeholder="ชื่อวัตถุดิบ เช่น หมูสับ, นมสด, เมล็ดกาแฟ">
                                    </div>
                                    ${st.ingredients.length > 1 ? `
                                        <button type="button" class="tool-danger-btn btn-remove-ing text-xs" data-ing-id="${escapeHTML(ing.id)}">
                                            ลบ
                                        </button>
                                    ` : ''}
                                </div>

                                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <label for="foodIngPackPrice_${escapeHTML(ing.id)}" class="block mb-1" style="color: var(--app-muted);">ราคาซื้อ/แพ็ค</label>
                                        <input id="foodIngPackPrice_${escapeHTML(ing.id)}" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(ing.packPrice))}" class="airbnb-input w-full text-xs food-ing-pack-price" data-ing-id="${escapeHTML(ing.id)}" placeholder="บาท">
                                    </div>
                                    <div>
                                        <label for="foodIngPackSize_${escapeHTML(ing.id)}" class="block mb-1" style="color: var(--app-muted);">ขนาดแพ็คที่ซื้อ</label>
                                        <input id="foodIngPackSize_${escapeHTML(ing.id)}" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(ing.packSize))}" class="airbnb-input w-full text-xs food-ing-pack-size" data-ing-id="${escapeHTML(ing.id)}" placeholder="ขนาด">
                                    </div>
                                    <div>
                                        <label for="foodIngPackUnit_${escapeHTML(ing.id)}" class="block mb-1" style="color: var(--app-muted);">หน่วยที่ซื้อ</label>
                                        <button type="button" id="foodIngPackUnit_${escapeHTML(ing.id)}" class="airbnb-input w-full text-xs food-ing-unit-btn food-ing-pack-unit" data-ing-id="${escapeHTML(ing.id)}" data-unit-field="packUnit" aria-haspopup="dialog">${escapeHTML((unitOptions.find(u => u.key === (ing.packUnit || 'g')) || unitOptions[0]).label)}</button>
                                    </div>
                                    <div>
                                        <label for="foodIngUseAmt_${escapeHTML(ing.id)}" class="block mb-1" style="color: var(--app-muted);">ปริมาณที่ใช้ในสูตร</label>
                                        <input id="foodIngUseAmt_${escapeHTML(ing.id)}" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(ing.useAmount))}" class="airbnb-input w-full text-xs food-ing-use-amount" data-ing-id="${escapeHTML(ing.id)}" placeholder="ปริมาณ">
                                    </div>
                                    <div>
                                        <label for="foodIngUseUnit_${escapeHTML(ing.id)}" class="block mb-1" style="color: var(--app-muted);">หน่วยที่ใช้</label>
                                        <button type="button" id="foodIngUseUnit_${escapeHTML(ing.id)}" class="airbnb-input w-full text-xs food-ing-unit-btn food-ing-use-unit" data-ing-id="${escapeHTML(ing.id)}" data-unit-field="useUnit" aria-haspopup="dialog">${escapeHTML((unitOptions.find(u => u.key === (ing.useUnit || 'g')) || unitOptions[0]).label)}</button>
                                    </div>
                                    <div>
                                        <label for="foodIngYield_${escapeHTML(ing.id)}" class="block mb-1" style="color: var(--app-muted);">Yield / ใช้ได้จริง (%)</label>
                                        <input id="foodIngYield_${escapeHTML(ing.id)}" type="text" inputmode="decimal" value="${escapeHTML(ing.yieldPct || '100')}" class="airbnb-input w-full text-xs food-ing-yield" data-ing-id="${escapeHTML(ing.id)}" placeholder="100%">
                                    </div>
                                </div>

                                <div class="flex justify-between items-center text-xs pt-1 border-t" style="border-color: var(--app-hairline);">
                                    <span style="color: var(--app-muted);">ต้นทุนวัตถุดิบนี้ในสูตร:</span>
                                    <span class="font-bold food-ing-cost-display" data-ing-id="${escapeHTML(ing.id)}" style="color: var(--app-accent);">฿${formatMoney(itemCalc.lineCost)} บาท</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- 3. การ์ดบรรจุภัณฑ์ & ต้นทุนแฝง (Packaging & Buffer Card) -->
            <div class="themed-tool-card p-4 space-y-3 text-xs">
                <div class="font-semibold">บรรจุภัณฑ์ ต้นทุนแฝง และราคาขาย</div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label for="foodPackagingCost" class="block mb-1" style="color: var(--app-muted);">ค่าบรรจุภัณฑ์ต่อเสิร์ฟ (กล่อง/แก้ว/ถุง/ช้อน)</label>
                        <div class="relative">
                            <input id="foodPackagingCost" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.packagingCost || '0'))}" class="airbnb-input w-full font-semibold pr-10" placeholder="0">
                            <span class="absolute right-3 top-2.5 text-xs pointer-events-none" style="color: var(--app-muted);">บาท</span>
                        </div>
                    </div>
                    <div>
                        <label for="foodHiddenCostPct" class="block mb-1" style="color: var(--app-muted);">เผื่อต้นทุนแฝง/เครื่องปรุง/แก๊ส (%)</label>
                        <div class="relative">
                            <input id="foodHiddenCostPct" type="text" inputmode="decimal" value="${escapeHTML(st.hiddenCostBufferPct || '5')}" class="airbnb-input w-full font-semibold pr-8" placeholder="5">
                            <span class="absolute right-3 top-2.5 text-xs pointer-events-none" style="color: var(--app-muted);">%</span>
                        </div>
                    </div>
                    <div>
                        <label for="foodSellingPrice" class="block mb-1" style="color: var(--app-muted);">ราคาขายจริงต่อเสิร์ฟ (บาท)</label>
                        <div class="relative">
                            <input id="foodSellingPrice" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.sellingPrice || '0'))}" class="airbnb-input w-full font-semibold pr-10" placeholder="0">
                            <span class="absolute right-3 top-2.5 text-xs pointer-events-none" style="color: var(--app-muted);">บาท</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 4. การ์ดสรุปผลการคำนวณ (Cost & Profit Results Card) -->
            <div class="themed-result-card p-4 space-y-3">
                <div class="flex justify-between items-center text-xs" style="color: var(--app-muted);">
                    <span>ต้นทุนรวมสุทธิต่อเสิร์ฟ (Total Cost per Portion)</span>
                    <span id="foodBatchSummary">${calc.batchYield > 1 ? `สูตรละ ${calc.batchYield} เสิร์ฟ` : 'จานเดี่ยว / 1 เสิร์ฟ'}</span>
                </div>
                <div class="themed-result-value text-2xl md:text-3xl font-extrabold font-mono" id="foodTotalCostResult">
                    ฿${formatMoney(calc.summary.totalCostPerPortion)}
                </div>

                <!-- แจกแจงสัดส่วนต้นทุน 4 ก้อน -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                    <div class="themed-subcard p-2.5">
                        <span class="block" style="color: var(--app-muted);">วัตถุดิบ/เสิร์ฟ</span>
                        <span class="font-bold text-sm" id="foodRawPortionResult">฿${formatMoney(calc.summary.rawCostPerPortion)}</span>
                    </div>
                    <div class="themed-subcard p-2.5">
                        <span class="block" style="color: var(--app-muted);">ต้นทุนแฝง (${calc.hiddenCostBufferPct}%)</span>
                        <span class="font-bold text-sm" id="foodHiddenCostResult">฿${formatMoney(calc.summary.hiddenCostBuffer)}</span>
                    </div>
                    <div class="themed-subcard p-2.5">
                        <span class="block" style="color: var(--app-muted);">บรรจุภัณฑ์</span>
                        <span class="font-bold text-sm" id="foodPackagingResult">฿${formatMoney(calc.summary.packagingCost)}</span>
                    </div>
                    <div class="themed-subcard p-2.5">
                        <span class="block" style="color: var(--app-muted);">รวมทั้งสูตร (${calc.batchYield} ที่)</span>
                        <span class="font-bold text-sm" id="foodBatchCostResult">฿${formatMoney(calc.summary.rawBatchCost)}</span>
                    </div>
                </div>

                <!-- ราคาขายแนะนำตามเป้าหมาย (Suggested Selling Price) -->
                <div class="themed-subcard p-3 space-y-2 text-xs">
                    <div class="flex justify-between items-center">
                        <span class="font-semibold">ราคาขายแนะนำที่ Food Cost ${calc.targetFoodCostPct}%</span>
                        <span class="font-mono font-bold text-base" id="foodSuggestedPriceResult" style="color: var(--app-accent);">
                            ฿${formatMoney(calc.summary.suggestedSellingPrice)} บาท
                        </span>
                    </div>
                    <div class="text-[11px]" style="color: var(--app-muted);">
                        ปัดเศษราคาขายที่น่าสนใจทางการตลาด: <b id="foodSuggestedRoundedResult" class="font-mono">฿${formatMoney(calc.summary.suggestedPriceRounded)} บาท</b>
                    </div>
                </div>

                <!-- วิเคราะห์กำไรจริง (Actual Profit Analysis) -->
                <div class="themed-subcard p-3 space-y-2 text-xs" id="foodActualProfitWrapper">
                    ${calc.summary.hasActualPrice ? `
                        <div class="font-semibold">ผลประกอบการเมื่อขายราคาจริง ฿${formatMoney(calc.sellingPrice)} บาท</div>
                        <div class="flex justify-between items-center py-1 border-b" style="border-color: var(--app-hairline);">
                            <span>กำไรขั้นต้นต่อเสิร์ฟ (Gross Profit)</span>
                            <span class="font-mono font-bold ${calc.summary.isProfit ? 'text-green-600' : 'text-red-500'}">
                                ${calc.summary.isProfit ? '+' : ''}฿${formatMoney(calc.summary.grossProfit)} บาท
                            </span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b" style="border-color: var(--app-hairline);">
                            <span>Food Cost % ที่เกิดขึ้นจริง</span>
                            <span class="font-mono font-bold">${calc.summary.actualFoodCostPct}%</span>
                        </div>
                        <div class="flex justify-between items-center py-1">
                            <span>อัตรากำไรขั้นต้น (Gross Profit Margin)</span>
                            <span class="font-mono font-bold">${calc.summary.grossMarginPct}%</span>
                        </div>
                        <div class="p-2 rounded-lg text-xs" style="background-color: var(--app-surface-soft); line-height: 1.5;">
                            ${calc.summary.actualFoodCostPct <= calc.targetFoodCostPct
                                ? `ราคาขายนี้ได้สัดส่วน Food Cost <b>${calc.summary.actualFoodCostPct}%</b> อยู่ในเกณฑ์เป้าหมาย (ไม่เกิน ${calc.targetFoodCostPct}%)`
                                : `Food Cost จริงอยู่ที่ <b>${calc.summary.actualFoodCostPct}%</b> สูงกว่าเป้าหมายที่ตั้งไว้ (${calc.targetFoodCostPct}%) พิจารณาปรับราคาขายขึ้นหรือลดต้นทุนวัตถุดิบ`}
                        </div>
                    ` : `
                        <div class="text-[11px] text-center py-1" style="color: var(--app-muted);">
                            ระบุ "ราคาขายจริงต่อเสิร์ฟ" ด้านบนเพื่อดูการวิเคราะห์กำไรสุทธิต่อจานและ Food Cost % จริง
                        </div>
                    `}
                </div>

                <!-- ปุ่มพิมพ์เอกสารทางการ / PDF -->
                <div class="pt-2">
                    <button type="button" id="btnPrintFoodReceipt" class="tool-action-btn w-full text-xs">
                        พิมพ์ใบคำนวณต้นทุนอาหาร / PDF
                    </button>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // ฟังก์ชันอัปเดตผลลัพธ์แบบ Real-time โดยไม่ทำลาย DOM ช่องกรอก
    function updateFoodCostingLive() {
        const curCalc = calculateFoodCosting(st);

        // 1. อัปเดตราคาแต่ละแถววัตถุดิบ
        container.querySelectorAll('.food-ing-cost-display').forEach(el => {
            const ingId = el.dataset.ingId;
            const item = curCalc.ingredients.find(i => i.id === ingId);
            if (item) {
                el.textContent = `฿${formatMoney(item.lineCost)} บาท`;
            }
        });

        // 2. อัปเดตการ์ดผลลัพธ์หลัก
        const batchEl = container.querySelector('#foodBatchSummary');
        if (batchEl) {
            batchEl.textContent = curCalc.batchYield > 1 ? `สูตรละ ${curCalc.batchYield} เสิร์ฟ` : 'จานเดี่ยว / 1 เสิร์ฟ';
        }

        const totalCostEl = container.querySelector('#foodTotalCostResult');
        if (totalCostEl) {
            totalCostEl.textContent = `฿${formatMoney(curCalc.summary.totalCostPerPortion)}`;
        }

        const rawPortionEl = container.querySelector('#foodRawPortionResult');
        if (rawPortionEl) rawPortionEl.textContent = `฿${formatMoney(curCalc.summary.rawCostPerPortion)}`;

        const hiddenEl = container.querySelector('#foodHiddenCostResult');
        if (hiddenEl) hiddenEl.textContent = `฿${formatMoney(curCalc.summary.hiddenCostBuffer)}`;

        const packEl = container.querySelector('#foodPackagingResult');
        if (packEl) packEl.textContent = `฿${formatMoney(curCalc.summary.packagingCost)}`;

        const batchCostEl = container.querySelector('#foodBatchCostResult');
        if (batchCostEl) batchCostEl.textContent = `฿${formatMoney(curCalc.summary.rawBatchCost)}`;

        const suggestedEl = container.querySelector('#foodSuggestedPriceResult');
        if (suggestedEl) suggestedEl.textContent = `฿${formatMoney(curCalc.summary.suggestedSellingPrice)} บาท`;

        const roundedEl = container.querySelector('#foodSuggestedRoundedResult');
        if (roundedEl) roundedEl.textContent = `฿${formatMoney(curCalc.summary.suggestedPriceRounded)} บาท`;

        // 3. อัปเดตส่วนวิเคราะห์ราคาจริง
        const profitWrapper = container.querySelector('#foodActualProfitWrapper');
        if (profitWrapper) {
            if (curCalc.summary.hasActualPrice) {
                profitWrapper.innerHTML = `
                    <div class="font-semibold">ผลประกอบการเมื่อขายราคาจริง ฿${formatMoney(curCalc.sellingPrice)} บาท</div>
                    <div class="flex justify-between items-center py-1 border-b" style="border-color: var(--app-hairline);">
                        <span>กำไรขั้นต้นต่อเสิร์ฟ (Gross Profit)</span>
                        <span class="font-mono font-bold ${curCalc.summary.isProfit ? 'text-green-600' : 'text-red-500'}">
                            ${curCalc.summary.isProfit ? '+' : ''}฿${formatMoney(curCalc.summary.grossProfit)} บาท
                        </span>
                    </div>
                    <div class="flex justify-between items-center py-1 border-b" style="border-color: var(--app-hairline);">
                        <span>Food Cost % ที่เกิดขึ้นจริง</span>
                        <span class="font-mono font-bold">${curCalc.summary.actualFoodCostPct}%</span>
                    </div>
                    <div class="flex justify-between items-center py-1">
                        <span>อัตรากำไรขั้นต้น (Gross Profit Margin)</span>
                        <span class="font-mono font-bold">${curCalc.summary.grossMarginPct}%</span>
                    </div>
                    <div class="p-2 rounded-lg text-xs" style="background-color: var(--app-surface-soft); line-height: 1.5;">
                        ${curCalc.summary.actualFoodCostPct <= curCalc.targetFoodCostPct
                            ? `ราคาขายนี้ได้สัดส่วน Food Cost <b>${curCalc.summary.actualFoodCostPct}%</b> อยู่ในเกณฑ์เป้าหมาย (ไม่เกิน ${curCalc.targetFoodCostPct}%)`
                            : `Food Cost จริงอยู่ที่ <b>${curCalc.summary.actualFoodCostPct}%</b> สูงกว่าเป้าหมายที่ตั้งไว้ (${curCalc.targetFoodCostPct}%) พิจารณาปรับราคาขายขึ้นหรือลดต้นทุนวัตถุดิบ`}
                    </div>
                `;
            } else {
                profitWrapper.innerHTML = `
                    <div class="text-[11px] text-center py-1" style="color: var(--app-muted);">
                        ระบุ "ราคาขายจริงต่อเสิร์ฟ" ด้านบนเพื่อดูการวิเคราะห์กำไรสุทธิต่อจานและ Food Cost % จริง
                    </div>
                `;
            }
        }

        // 4. Status Banner
        if (curCalc.ingredients.length === 0 || curCalc.summary.totalCostPerPortion <= 0) {
            setStatusBanner('empty', 'กรุณาระบุวัตถุดิบและราคาซื้อเพื่อคำนวณต้นทุนอาหารและราคาขายแนะนำ');
        } else if (curCalc.summary.hasActualPrice) {
            if (curCalc.summary.isProfit) {
                setStatusBanner('success', `ต้นทุนต่อเสิร์ฟ <b>${formatMoney(curCalc.summary.totalCostPerPortion)} บาท</b> · กำไร <b>${formatMoney(curCalc.summary.grossProfit)} บาท</b> (Food Cost ${curCalc.summary.actualFoodCostPct}%, Margin ${curCalc.summary.grossMarginPct}%)`);
            } else {
                setStatusBanner('empty', `ขาดทุนต่อเสิร์ฟ <b>${formatMoney(Math.abs(curCalc.summary.grossProfit))} บาท</b> · ราคาแนะนำที่ Food Cost ${curCalc.targetFoodCostPct}% คือ ${formatMoney(curCalc.summary.suggestedSellingPrice)} บาท`);
            }
        } else {
            setStatusBanner('success', `ต้นทุนรวมต่อเสิร์ฟ <b>${formatMoney(curCalc.summary.totalCostPerPortion)} บาท</b> · ราคาแนะนำที่ Food Cost ${curCalc.targetFoodCostPct}% คือ <b>${formatMoney(curCalc.summary.suggestedSellingPrice)} บาท</b>`);
        }
    }

    // Event Bindings: Input Header
    const nameInput = container.querySelector('#foodRecipeName');
    nameInput?.addEventListener('input', e => {
        st.recipeName = e.target.value;
        persistAppState();
    });

    const yieldInput = container.querySelector('#foodBatchYield');
    yieldInput?.addEventListener('input', e => {
        st.batchYield = e.target.value;
        persistAppState();
        updateFoodCostingLive();
    });
    yieldInput?.addEventListener('blur', () => {
        st.batchYield = formatInputDisplay(yieldInput.value);
        yieldInput.value = st.batchYield;
        persistAppState();
        updateFoodCostingLive();
    });

    const targetInput = container.querySelector('#foodTargetCostPct');
    targetInput?.addEventListener('input', e => {
        st.targetFoodCostPct = e.target.value;
        persistAppState();
        updateFoodCostingLive();
    });
    targetInput?.addEventListener('blur', () => {
        st.targetFoodCostPct = formatInputDisplay(targetInput.value);
        targetInput.value = st.targetFoodCostPct;
        persistAppState();
        updateFoodCostingLive();
    });

    // Preset Target Chips
    container.querySelectorAll('.food-chip-target').forEach(btn => {
        btn.addEventListener('click', () => {
            st.targetFoodCostPct = btn.dataset.val;
            if (targetInput) targetInput.value = st.targetFoodCostPct;
            persistAppState();
            updateFoodCostingLive();
        });
    });

    // Preset Recipe Buttons
    container.querySelector('#btnFoodPresetKaprao')?.addEventListener('click', () => {
        st.recipeName = 'ข้าวกะเพราหมูสับไข่ดาว';
        st.batchYield = '1';
        st.targetFoodCostPct = '30';
        st.sellingPrice = '65';
        st.packagingCost = '4.5';
        st.hiddenCostBufferPct = '5';
        st.ingredients = [
            { id: '1', name: 'หมูสับ', packPrice: '160', packSize: '1000', packUnit: 'g', useAmount: '120', useUnit: 'g', yieldPct: '100' },
            { id: '2', name: 'ข้าวสวยสุก', packPrice: '45', packSize: '2500', packUnit: 'g', useAmount: '200', useUnit: 'g', yieldPct: '100' },
            { id: '3', name: 'ไข่ไก่ (เบอร์ 2)', packPrice: '120', packSize: '30', packUnit: 'piece', useAmount: '1', useUnit: 'piece', yieldPct: '100' },
            { id: '4', name: 'ใบกะเพรา + พริกกระเทียม', packPrice: '50', packSize: '500', packUnit: 'g', useAmount: '30', useUnit: 'g', yieldPct: '90' }
        ];
        persistAppState();
        renderActiveTool();
    });

    container.querySelector('#btnFoodPresetTea')?.addEventListener('click', () => {
        st.recipeName = 'ชาไทยเย็น / ลาเต้เย็น';
        st.batchYield = '1';
        st.targetFoodCostPct = '25';
        st.sellingPrice = '55';
        st.packagingCost = '3.5';
        st.hiddenCostBufferPct = '5';
        st.ingredients = [
            { id: '1', name: 'ผงชาไทย / เมล็ดกาแฟ', packPrice: '350', packSize: '500', packUnit: 'g', useAmount: '20', useUnit: 'g', yieldPct: '100' },
            { id: '2', name: 'นมสดพาสเจอร์ไรส์', packPrice: '95', packSize: '2000', packUnit: 'ml', useAmount: '120', useUnit: 'ml', yieldPct: '100' },
            { id: '3', name: 'นมข้นหวาน / ไซรัป', packPrice: '55', packSize: '1000', packUnit: 'g', useAmount: '30', useUnit: 'g', yieldPct: '100' },
            { id: '4', name: 'น้ำแข็งหลอด', packPrice: '20', packSize: '10', packUnit: 'kg', useAmount: '200', useUnit: 'g', yieldPct: '100' }
        ];
        persistAppState();
        renderActiveTool();
    });

    // Add Ingredient
    container.querySelector('#btnAddFoodIngredient')?.addEventListener('click', () => {
        const newId = String(Date.now());
        st.ingredients.push({
            id: newId,
            name: `วัตถุดิบ ${st.ingredients.length + 1}`,
            packPrice: '',
            packSize: '1000',
            packUnit: 'g',
            useAmount: '',
            useUnit: 'g',
            yieldPct: '100'
        });
        persistAppState();
        renderActiveTool();
    });

    // Remove Ingredient
    container.querySelectorAll('.btn-remove-ing').forEach(btn => {
        btn.addEventListener('click', () => {
            const idToRemove = btn.dataset.ingId;
            st.ingredients = st.ingredients.filter(i => i.id !== idToRemove);
            persistAppState();
            renderActiveTool();
        });
    });

    // Ingredient Row Inputs
    container.querySelectorAll('.food-ing-name').forEach(inp => {
        inp.addEventListener('input', e => {
            const ing = st.ingredients.find(i => i.id === e.target.dataset.ingId);
            if (ing) ing.name = e.target.value;
            persistAppState();
        });
    });

    container.querySelectorAll('.food-ing-pack-price').forEach(inp => {
        inp.addEventListener('input', e => {
            const ing = st.ingredients.find(i => i.id === e.target.dataset.ingId);
            if (ing) ing.packPrice = e.target.value;
            persistAppState();
            updateFoodCostingLive();
        });
        inp.addEventListener('blur', e => {
            const formatted = formatInputDisplay(e.target.value);
            const ing = st.ingredients.find(i => i.id === e.target.dataset.ingId);
            if (ing) ing.packPrice = formatted;
            inp.value = formatted;
            persistAppState();
            updateFoodCostingLive();
        });
    });

    container.querySelectorAll('.food-ing-pack-size').forEach(inp => {
        inp.addEventListener('input', e => {
            const ing = st.ingredients.find(i => i.id === e.target.dataset.ingId);
            if (ing) ing.packSize = e.target.value;
            persistAppState();
            updateFoodCostingLive();
        });
        inp.addEventListener('blur', e => {
            const formatted = formatInputDisplay(e.target.value);
            const ing = st.ingredients.find(i => i.id === e.target.dataset.ingId);
            if (ing) ing.packSize = formatted;
            inp.value = formatted;
            persistAppState();
            updateFoodCostingLive();
        });
    });

    container.querySelectorAll('.food-ing-use-amount').forEach(inp => {
        inp.addEventListener('input', e => {
            const ing = st.ingredients.find(i => i.id === e.target.dataset.ingId);
            if (ing) ing.useAmount = e.target.value;
            persistAppState();
            updateFoodCostingLive();
        });
        inp.addEventListener('blur', e => {
            const formatted = formatInputDisplay(e.target.value);
            const ing = st.ingredients.find(i => i.id === e.target.dataset.ingId);
            if (ing) ing.useAmount = formatted;
            inp.value = formatted;
            persistAppState();
            updateFoodCostingLive();
        });
    });

    // Unit pickers: compact wheel popover anchored to the button of the ingredient being edited
    container.querySelectorAll('.food-ing-unit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof openUnitWheelDialog !== 'function') return;
            const ing = st.ingredients.find(i => i.id === btn.dataset.ingId);
            const field = btn.dataset.unitField;
            if (!ing || !field) return;
            const isPack = field === 'packUnit';
            openUnitWheelDialog({
                title: `${isPack ? 'หน่วยที่ซื้อ' : 'หน่วยที่ใช้'}: ${ing.name || 'วัตถุดิบ'}`,
                items: unitOptions.map(u => ({ name: u.label })),
                selectedIndex: Math.max(0, unitOptions.findIndex(u => u.key === (ing[field] || 'g'))),
                anchor: btn,
                onChange: (idx) => {
                    ing[field] = unitOptions[idx].key;
                    btn.textContent = unitOptions[idx].label;
                    persistAppState();
                    updateFoodCostingLive();
                },
                onClose: () => { if (document.activeElement === document.body || !document.activeElement) btn.focus(); }
            });
        });
    });

    container.querySelectorAll('.food-ing-yield').forEach(inp => {
        inp.addEventListener('input', e => {
            const ing = st.ingredients.find(i => i.id === e.target.dataset.ingId);
            if (ing) ing.yieldPct = e.target.value;
            persistAppState();
            updateFoodCostingLive();
        });
        inp.addEventListener('blur', e => {
            const ing = st.ingredients.find(i => i.id === e.target.dataset.ingId);
            if (ing) ing.yieldPct = e.target.value;
            persistAppState();
            updateFoodCostingLive();
        });
    });

    // Packaging & Hidden Cost Inputs
    const packCostInput = container.querySelector('#foodPackagingCost');
    packCostInput?.addEventListener('input', e => {
        st.packagingCost = e.target.value;
        persistAppState();
        updateFoodCostingLive();
    });
    packCostInput?.addEventListener('blur', () => {
        st.packagingCost = formatInputDisplay(packCostInput.value);
        packCostInput.value = st.packagingCost;
        persistAppState();
        updateFoodCostingLive();
    });

    const hiddenCostInput = container.querySelector('#foodHiddenCostPct');
    hiddenCostInput?.addEventListener('input', e => {
        st.hiddenCostBufferPct = e.target.value;
        persistAppState();
        updateFoodCostingLive();
    });
    hiddenCostInput?.addEventListener('blur', () => {
        st.hiddenCostBufferPct = formatInputDisplay(hiddenCostInput.value);
        hiddenCostInput.value = st.hiddenCostBufferPct;
        persistAppState();
        updateFoodCostingLive();
    });

    const sellingInput = container.querySelector('#foodSellingPrice');
    sellingInput?.addEventListener('input', e => {
        st.sellingPrice = e.target.value;
        persistAppState();
        updateFoodCostingLive();
    });
    sellingInput?.addEventListener('blur', () => {
        st.sellingPrice = formatInputDisplay(sellingInput.value);
        sellingInput.value = st.sellingPrice;
        persistAppState();
        updateFoodCostingLive();
    });

    // Print Receipt
    container.querySelector('#btnPrintFoodReceipt')?.addEventListener('click', () => {
        triggerPrintReceipt('food_costing');
    });

    // Initial Status Banner
    if (calc.ingredients.length === 0 || calc.summary.totalCostPerPortion <= 0) {
        setStatusBanner('empty', 'กรุณาระบุวัตถุดิบและราคาซื้อเพื่อคำนวณต้นทุนอาหารและราคาขายแนะนำ');
    } else if (calc.summary.hasActualPrice) {
        if (calc.summary.isProfit) {
            setStatusBanner('success', `ต้นทุนต่อเสิร์ฟ <b>${formatMoney(calc.summary.totalCostPerPortion)} บาท</b> · กำไร <b>${formatMoney(calc.summary.grossProfit)} บาท</b> (Food Cost ${calc.summary.actualFoodCostPct}%, Margin ${calc.summary.grossMarginPct}%)`);
        } else {
            setStatusBanner('empty', `ขาดทุนต่อเสิร์ฟ <b>${formatMoney(Math.abs(calc.summary.grossProfit))} บาท</b> · ราคาแนะนำที่ Food Cost ${calc.targetFoodCostPct}% คือ ${formatMoney(calc.summary.suggestedSellingPrice)} บาท`);
        }
    } else {
        setStatusBanner('success', `ต้นทุนรวมต่อเสิร์ฟ <b>${formatMoney(calc.summary.totalCostPerPortion)} บาท</b> · ราคาแนะนำที่ Food Cost ${calc.targetFoodCostPct}% คือ <b>${formatMoney(calc.summary.suggestedSellingPrice)} บาท</b>`);
    }
}

(function(root) {
    const exportsObj = {
        renderVatTool,
        renderVatWhtTool,
        renderPercentTool,
        renderSalaryTool,
        calculateNetSalary,
        calculateEcommerceProfit,
        renderEcommerceProfitTool,
        calculateFoodCosting,
        renderFoodCostingTool
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
