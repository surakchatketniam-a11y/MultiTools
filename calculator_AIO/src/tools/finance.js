// ==============================================================
// Multitools Calculator - Finance & Planning Tools
// (loan, savings, currency)
// ==============================================================

if (typeof globalThis.currencyFetchInFlight === 'undefined') {
    globalThis.currencyFetchInFlight = false;
}

/* -----------------------------------------------------------
 * TOOL 2: สกุลเงิน (Currency Converter)
 * ----------------------------------------------------------- */
async function loadFrankfurterRates(force = false) {
    const st = appState.currency;
    const now = Date.now();
    if (currencyFetchInFlight) return;
    if (!force && st.lastAttempt && now - new Date(st.lastAttempt).getTime() < 30000) return;
    currencyFetchInFlight = true;
    st.lastAttempt = new Date().toISOString();
    if (appState.activeToolId === 'currency') renderActiveTool();
    try {
        const quotes = Object.keys(st.ratesInTHB).filter(code => code !== 'THB').join(',');
        const response = await fetch(`https://api.frankfurter.dev/v2/rates?base=THB&quotes=${quotes}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Frankfurter HTTP ${response.status}`);
        const payload = await response.json();
        // Commit a complete validated snapshot; never label old rates as fresh.
        const snapshot = parseFrankfurterRates(payload, quotes.split(','));
        st.ratesInTHB = snapshot.rates;
        st.rateDates = snapshot.dates;
        st.lastUpdated = new Date().toISOString();
        st.rateSource = 'Frankfurter';
    } catch (error) {
        st.rateSource = 'ค่าเดิมในเครื่อง (เชื่อมต่อ API ไม่สำเร็จ)';
    } finally {
        currencyFetchInFlight = false;
        persistAppState();
        if (appState.activeToolId === 'currency') renderActiveTool();
    }
}

function renderCurrencyTool(container) {
    const st = appState.currency;
    const currencies = [
        { code: 'THB', name: '🇹🇭 THB - บาทไทย' },
        { code: 'USD', name: '🇺🇸 USD - ดอลลาร์สหรัฐ' },
        { code: 'EUR', name: '🇪🇺 EUR - ยูโร' },
        { code: 'JPY', name: '🇯🇵 JPY - เยนญี่ปุ่น' },
        { code: 'CNY', name: '🇨🇳 CNY - หยวนจีน' },
        { code: 'GBP', name: '🇬🇧 GBP - ปอนด์อังกฤษ' },
        { code: 'KRW', name: '🇰🇷 KRW - วอนเกาหลี' },
        { code: 'SGD', name: '🇸🇬 SGD - ดอลลาร์สิงคโปร์' }
    ];

    const amt = numberOrDefault(st.amount, 0);
    const fromRate = st.ratesInTHB[st.from] || 1;
    const toRate = st.ratesInTHB[st.to] || 1;
    const customRate = parseNumericInput(st.customRateToTHB);
    const effectiveRate = (!isNaN(customRate) && customRate > 0) ? customRate : (fromRate / toRate);
    const converted = amt * effectiveRate;
    const rateDateText = [...new Set([st.from, st.to].filter(code => code !== 'THB').map(code => st.rateDates?.[code]).filter(Boolean))].join(', ');

    container.innerHTML = `
        <div class="flex flex-col gap-1.5">
            <div class="grid grid-cols-2 gap-1.5">
                <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-btn-radius)] p-2">
                    <label class="text-[11px] text-[#6a6a6a] block">จากสกุลเงิน</label>
                    <select id="currFromSel" class="w-full font-semibold text-sm bg-transparent outline-none mt-0.5 text-[#222222]">
                        ${currencies.map(c => `<option value="${c.code}" ${st.from === c.code ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-btn-radius)] p-2">
                    <label class="text-[11px] text-[#6a6a6a] block">เป็นสกุลเงิน</label>
                    <select id="currToSel" class="w-full font-semibold text-sm bg-transparent outline-none mt-0.5 text-[#222222]">
                        ${currencies.map(c => `<option value="${c.code}" ${st.to === c.code ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
            </div>

            ${createKeypadFieldHTML(0, `จำนวนเงิน (${st.from})`, st.amount, st.from, 'ป้อนจำนวนเงิน')}
            ${createKeypadFieldHTML(1, `กำหนดเรทเอง (1 ${st.from} = ? ${st.to})`, st.customRateToTHB, st.to, `อัตโนมัติ (${formatNum(fromRate / toRate, 4)})`)}

            <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-btn-radius)] p-2.5 space-y-2 text-xs text-[#3f3f3f]">
                <div class="flex items-center justify-between gap-2"><span>เรทที่ใช้: <b>1 ${st.from} = ${formatNum(effectiveRate, 4)} ${st.to}</b></span><button id="swapCurrBtn" class="px-3 py-1 bg-[#f7f7f7] border border-[#dddddd] rounded-full font-semibold text-[var(--app-accent)]">⇄ สลับ</button></div>
                <div class="flex items-center justify-between gap-2 text-[11px] text-[#6a6a6a]"><span>${escapeHTML(st.rateSource)}${rateDateText ? ` · วันที่เรท ${escapeHTML(rateDateText)}` : ''}${st.lastUpdated ? ` · ดึงข้อมูล ${new Date(st.lastUpdated).toLocaleString('th-TH')}` : ''}</span><button id="refreshRatesBtn" class="px-2.5 py-1 border border-[var(--app-hairline)] rounded-full font-semibold text-[var(--app-accent)]">↻ อัปเดตเรท</button></div>
            </div>
        </div>
    `;

    attachFieldClickListeners(container);

    document.getElementById('currFromSel').addEventListener('change', (e) => {
        st.from = e.target.value;
        st.customRateToTHB = '';
        renderActiveTool();
    });
    document.getElementById('currToSel').addEventListener('change', (e) => {
        st.to = e.target.value;
        st.customRateToTHB = '';
        renderActiveTool();
    });
    document.getElementById('swapCurrBtn').addEventListener('click', () => {
        const tmp = st.from;
        st.from = st.to;
        st.to = tmp;
        st.customRateToTHB = '';
        renderActiveTool();
    });
    document.getElementById('refreshRatesBtn').addEventListener('click', () => loadFrankfurterRates(true));

    const stale = !st.lastUpdated || Date.now() - new Date(st.lastUpdated).getTime() > 30 * 60 * 1000;
    if (stale) loadFrankfurterRates();

    if (amt <= 0) {
        setStatusBanner('empty', 'กรุณาป้อนจำนวนเงินที่ต้องการแปลง');
    } else {
        setStatusBanner('success', `💱 ${formatNum(amt, 2)} ${st.from} = <span class="text-lg text-[var(--app-accent)] underline">${formatMoney(converted)} ${st.to}</span>`);
    }
}

/* -----------------------------------------------------------
 * TOOL 15: เงินกู้ (Loan Payment Calculator & Refinance)
 * ----------------------------------------------------------- */
function renderLoanTool(container) {
    const st = appState.loan;
    st.tab = st.tab || 'amortization'; // 'amortization' | 'refinance'

    if (st.tab === 'refinance') {
        renderHomeRefinanceTool(container);
        return;
    }

    const P = numberOrDefault(st.principal, 0);
    const annualRate = numberOrDefault(st.interestRate, 0);
    const n = integerOrDefault(st.months, 0);
    const extra = numberOrDefault(st.extra, 0);

    const rateAfter = numberOrDefault(st.rateAfter, annualRate);
    const promoMonths = Math.max(0, integerOrDefault(st.promoMonths, 0));
    let monthlyPay = 0, totalPay = 0, totalInterest = 0, extraInterest = 0, extraMonths = n;
    const schedule = generateLoanSchedule(st);
    if (schedule.length) {
        monthlyPay = schedule[0]?.payment || 0;
        extraMonths = schedule.length;
        totalPay = schedule.reduce((sum, item) => sum + item.payment, 0);
        totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);
        extraInterest = totalInterest;
    }
    const calculateLoanPlan = (extraPayment) => {
        let balance = P, month = 0, interestTotal = 0, payment = 0, previousRate = null;
        while (balance > 0.01 && month < 1200 && month < n + 120) {
            const currentRate = st.rateType === 'step' && month >= promoMonths ? rateAfter : annualRate;
            const monthlyRate = (currentRate / 100) / 12;
            const remaining = Math.max(1, n - month);
            if (payment === 0 || previousRate !== currentRate) {
                payment = st.calcMethod === 'flat' ? (P / n) + (P * currentRate / 100 / 12) : (monthlyRate === 0 ? balance / remaining : balance * (monthlyRate * Math.pow(1 + monthlyRate, remaining)) / (Math.pow(1 + monthlyRate, remaining) - 1));
                previousRate = currentRate;
            }
            const interest = st.calcMethod === 'flat' ? (P * currentRate / 100 / 12) : (balance * monthlyRate);
            const principalPart = Math.min(balance, Math.max(0, payment + extraPayment - interest));
            if (principalPart <= 0) break;
            interestTotal += interest;
            balance -= principalPart;
            month++;
        }
        return { interestTotal, months: month };
    };
    const normalPlan = P > 0 && n > 0 ? calculateLoanPlan(0) : { interestTotal: 0, months: 0 };
    const interestSaved = Math.max(0, normalPlan.interestTotal - totalInterest);
    const monthsSaved = Math.max(0, normalPlan.months - extraMonths);

    container.innerHTML = `
        <div class="flex flex-col gap-1.5">
            <div class="segment-group grid-cols-2 mb-1">
                <button type="button" class="segment-btn loan-tab-btn ${st.tab !== 'refinance' ? 'active' : ''}" data-tab="amortization">
                    📊 ผ่อนชำระ & ตารางโปะ
                </button>
                <button type="button" class="segment-btn loan-tab-btn ${st.tab === 'refinance' ? 'active' : ''}" data-tab="refinance">
                    🔄 รีไฟแนนซ์ vs Retention (ธปท.)
                </button>
            </div>
            ${createKeypadFieldHTML(0, 'วงเงินกู้ (เงินต้น)', st.principal, 'บาท', 'เช่น 500,000')}
            ${createKeypadFieldHTML(1, 'อัตราดอกเบี้ยต่อปี', st.interestRate, '% ต่อปี', 'เช่น 4.5')}
            ${createKeypadFieldHTML(2, 'ระยะเวลาผ่อนชำระ', st.months, 'เดือน', 'เช่น 36')}
            ${createKeypadFieldHTML(3, 'โปะเพิ่มรายเดือน', st.extra, 'บาท/เดือน', 'เช่น 1000')}
        </div>
    `;

    attachFieldClickListeners(container);

    container.querySelectorAll('.loan-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            st.tab = btn.dataset.tab;
            persistAppState();
            renderActiveTool();
        });
    });

    const loanRoot = container.firstElementChild;
    loanRoot.insertAdjacentHTML('afterbegin', `<div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-2"><label class="text-xs text-[#6a6a6a] block mb-1">วิธีคำนวณดอกเบี้ย</label><select id="loanCalcMethod" class="w-full font-semibold text-sm bg-transparent outline-none"><option value="reducing" ${st.calcMethod !== 'flat' ? 'selected' : ''}>ลดต้นลดดอก</option><option value="flat" ${st.calcMethod === 'flat' ? 'selected' : ''}>ค่างวดคงที่ (Flat Rate)</option></select></div>`);
    loanRoot.insertAdjacentHTML('afterbegin', `<div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-2"><label class="text-xs text-[#6a6a6a] block mb-1">ประเภทอัตราดอกเบี้ย</label><select id="loanRateType" class="w-full font-semibold text-sm bg-transparent outline-none"><option value="fixed" ${st.rateType !== 'step' ? 'selected' : ''}>Fixed Rate (คงที่)</option><option value="step" ${st.rateType === 'step' ? 'selected' : ''}>Step Rate (ขั้นบันได)</option></select><div id="loanStepFields" class="grid grid-cols-2 gap-2 mt-2" style="display:${st.rateType === 'step' ? 'grid' : 'none'}"><input id="loanPromoMonths" type="number" min="0" value="${st.promoMonths}" placeholder="ช่วงแรก (เดือน)" class="airbnb-input w-full"><input id="loanRateAfter" type="number" step="0.01" value="${st.rateAfter}" placeholder="ดอกเบี้ยหลังช่วงแรก" class="airbnb-input w-full"></div></div>`);
    if (schedule.length) {
        const table = document.createElement('div');
        table.className = 'bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3 mt-2 overflow-auto';
        table.innerHTML = `
            <div class="flex items-center justify-between gap-2 mb-2">
                <div class="text-xs font-semibold text-[#6a6a6a]">ตารางผ่อนชำระ (${schedule.length} งวด)</div>
                <div class="flex items-center gap-1.5 flex-wrap justify-end">
                    <button id="btnPrintLoanSummary" type="button" title="พิมพ์สรุปสินเชื่อหรือบันทึกเป็นไฟล์ PDF" class="px-2 py-1 text-xs font-semibold rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1 cursor-pointer">
                        🖨️ พิมพ์/PDF
                    </button>
                    <button id="btnExportLoanMonthly" type="button" title="ดาวน์โหลดตารางผ่อนรายเดือนทุกงวดเป็นไฟล์ CSV สำหรับ Excel / Google Sheets" class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--app-accent)] text-white hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1 cursor-pointer">
                        📥 รายงวด (.CSV)
                    </button>
                    <button id="btnExportLoanYearly" type="button" title="ดาวน์โหลดสรุปยอดผ่อนรายปีเป็นไฟล์ CSV สำหรับ Excel / Google Sheets" class="px-2 py-1 text-xs font-medium rounded-lg border border-[var(--app-hairline)] text-[#4a4a4a] bg-neutral-50 hover:bg-neutral-100 active:scale-95 transition-all flex items-center gap-1 cursor-pointer">
                        📥 สรุปรายปี (.CSV)
                    </button>
                </div>
            </div>
            <table class="w-full text-xs">
                <thead>
                    <tr class="border-b"><th class="text-left py-1">งวด</th><th class="text-right py-1">จ่าย</th><th class="text-right py-1">ดอกเบี้ย</th><th class="text-right py-1">เงินต้น</th><th class="text-right py-1">คงเหลือ</th></tr>
                </thead>
                <tbody>${schedule.slice(0, 120).map(item => `<tr class="border-b border-[#eee]"><td class="py-1">${item.month}</td><td class="text-right">${formatMoney(item.payment)}</td><td class="text-right">${formatMoney(item.interest)}</td><td class="text-right">${formatMoney(item.principal)}</td><td class="text-right">${formatMoney(item.balance)}</td></tr>`).join('')}</tbody>
            </table>
            ${schedule.length > 120 ? `<div class="text-[11px] text-[#888] text-center mt-2">แสดงบนหน้าจอ 120 งวดแรก · ดาวน์โหลดไฟล์ CSV เพื่อดูครบทั้ง ${schedule.length} งวด</div>` : ''}
        `;
        loanRoot.appendChild(table);

        table.querySelector('#btnPrintLoanSummary')?.addEventListener('click', () => {
            triggerPrintReceipt('loan');
        });

        table.querySelector('#btnExportLoanMonthly')?.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const csv = buildLoanAmortizationCSV(schedule, 'monthly');
            downloadCSV(getCSVFilename('loan_amortization', 'monthly'), csv);
            triggerButtonFeedback(btn, '✓ โหลดแล้ว');
        });

        table.querySelector('#btnExportLoanYearly')?.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const csv = buildLoanAmortizationCSV(schedule, 'yearly');
            downloadCSV(getCSVFilename('loan_amortization', 'yearly'), csv);
            triggerButtonFeedback(btn, '✓ โหลดแล้ว');
        });
    }
    container.querySelector('#loanRateType').addEventListener('change', (event) => { st.rateType = event.target.value; renderActiveTool(); });
    container.querySelector('#loanCalcMethod').addEventListener('change', (event) => { st.calcMethod = event.target.value; renderActiveTool(); });
    container.querySelector('#loanPromoMonths')?.addEventListener('change', (event) => { st.promoMonths = event.target.value; renderActiveTool(); });
    container.querySelector('#loanRateAfter')?.addEventListener('change', (event) => { st.rateAfter = event.target.value; renderActiveTool(); });

    if (P <= 0 || n <= 0) {
        setStatusBanner('empty', 'ป้อนวงเงินกู้ ดอกเบี้ย และจำนวนเดือนเพื่อคำนวณยอดผ่อน');
    } else {
        setStatusBanner('success', `🏦 ผ่อนเดือนละ: <span class="text-lg text-[var(--app-accent)] underline">${formatMoney(monthlyPay)} บาท</span><span class="text-xs font-medium block text-[#3f3f3f]">ดอกเบี้ยรวม: ${formatMoney(totalInterest)} ฿ | โปะเพิ่ม: ${formatMoney(extra)} ฿/เดือน | เหลือ ${extraMonths} เดือน</span><span class="text-xs font-bold block text-[var(--app-accent)]">ประหยัดดอกเบี้ย ${formatMoney(interestSaved)} ฿ และลดระยะเวลา ${monthsSaved} เดือน</span>`);
    }
}

/* -----------------------------------------------------------
 * PURE ENGINE: รีไฟแนนซ์บ้าน vs Retention ธนาคารเดิม & จุดคุ้มทุน (ธปท.)
 * ----------------------------------------------------------- */
function calculateHomeRefinance(params) {
    const p = params || {};
    const principal = Math.max(0, numberOrDefault(p.principal, 2000000));
    const months = Math.max(12, integerOrDefault(p.months, 240)); // default 20 years remaining
    const currentRate = Math.max(0, numberOrDefault(p.currentRate, 5.50));
    const retentionRate = Math.max(0, numberOrDefault(p.retentionRate, 3.80));
    const retentionFee = Math.max(0, numberOrDefault(p.retentionFee, 0));
    const refinanceRate = Math.max(0, numberOrDefault(p.refinanceRate, 2.99));
    const isGovReduced = p.isGovReducedMortgage === 'yes' || p.isGovReducedMortgage === true;
    const appraisalFee = Math.max(0, numberOrDefault(p.appraisalFee, 2800));
    const insuranceFee = Math.max(0, numberOrDefault(p.insuranceFee, 2000));
    const otherRefinanceFees = Math.max(0, numberOrDefault(p.otherRefinanceFees, 0));

    // Refinance Upfront Fees
    const mortgageFeeRate = isGovReduced ? 0.0001 : 0.01; // 0.01% or 1.0%
    const mortgageFee = principal * mortgageFeeRate;
    const stampDuty = Math.min(10000, principal * 0.0005); // 0.05% capped at 10,000 THB
    const totalRefinanceFees = mortgageFee + appraisalFee + stampDuty + insuranceFee + otherRefinanceFees;

    // Helper: calculate 3-year amortization (36 months based on BOT standard)
    const calc3Years = (rate) => {
        if (principal <= 0 || months <= 0) {
            return { monthlyPay: 0, totalPaid3Y: 0, interestPaid3Y: 0, principalPaid3Y: 0, endBalance3Y: 0 };
        }
        const i = (rate / 100) / 12;
        const monthlyPay = i > 0
            ? principal * (i * Math.pow(1 + i, months)) / (Math.pow(1 + i, months) - 1)
            : principal / months;

        let bal = principal;
        let totalInterest = 0;
        let totalPrincipal = 0;
        const horizon = Math.min(36, months);

        for (let m = 0; m < horizon; m++) {
            const interest = bal * i;
            const prinPart = Math.min(bal, Math.max(0, monthlyPay - interest));
            totalInterest += interest;
            totalPrincipal += prinPart;
            bal -= prinPart;
            if (bal <= 0.01) break;
        }

        return {
            monthlyPay,
            totalPaid3Y: (totalInterest + totalPrincipal),
            interestPaid3Y: totalInterest,
            principalPaid3Y: totalPrincipal,
            endBalance3Y: Math.max(0, bal)
        };
    };

    // 1. Current Floating Rate (3 years)
    const currentPlan = calc3Years(currentRate);

    // 2. Retention Plan (3 years)
    const retentionPlan = calc3Years(retentionRate);
    const retentionInterestSaved = Math.max(0, currentPlan.interestPaid3Y - retentionPlan.interestPaid3Y);
    const retentionNetSavings = retentionInterestSaved - retentionFee;

    // 3. Refinance Plan (3 years)
    const refinancePlan = calc3Years(refinanceRate);
    const refinanceInterestSaved = Math.max(0, currentPlan.interestPaid3Y - refinancePlan.interestPaid3Y);
    const refinanceNetSavings = refinanceInterestSaved - totalRefinanceFees;

    // 4. Comparison: Refinance vs Retention
    const netSavingsAdvantage = refinanceNetSavings - retentionNetSavings; // positive = Refinance is better
    const interestSavedAdvantage = refinanceInterestSaved - retentionInterestSaved;
    const costDifference = Math.max(0, totalRefinanceFees - retentionFee);

    // Breakeven month: how many months of extra interest savings from refinance cover the upfront cost difference
    let breakevenMonth = null;
    const monthlyExtraInterestSaved = (retentionPlan.interestPaid3Y - refinancePlan.interestPaid3Y) / 36;
    if (monthlyExtraInterestSaved > 0 && costDifference > 0) {
        breakevenMonth = Math.ceil(costDifference / monthlyExtraInterestSaved);
    } else if (costDifference <= 0) {
        breakevenMonth = 0;
    }

    const isRefinanceBetter = netSavingsAdvantage > 0 && (breakevenMonth !== null && breakevenMonth <= 36);

    let recommendation = '';
    if (isRefinanceBetter) {
        recommendation = `🏆 แนะนำ "รีไฟแนนซ์ (ย้ายธนาคารใหม่)" คุ้มทุนในเดือนที่ ${breakevenMonth} และประหยัดสุทธิ 3 ปีได้มากกว่า Retention ถึง ${formatMoney(netSavingsAdvantage)} บาท`;
    } else if (retentionNetSavings > 0) {
        recommendation = `🏆 แนะนำ "Retention (ขอลดดอกเบี้ยแบงก์เดิม)" คุ้มค่ากว่า ได้ผลประหยัดสุทธิ 3 ปี ${formatMoney(retentionNetSavings)} บาท โดยไม่ต้องเสียเวลายื่นกู้และจ่ายค่าธรรมเนียมย้ายค่าย`;
    } else {
        recommendation = `ควรรอเจรจาอัตราดอกเบี้ยโปรโมชันที่ดีกว่านี้ เนื่องจากดอกเบี้ยที่ประหยัดได้ยังไม่คุ้มค่าธรรมเนียม`;
    }

    return {
        principal,
        months,
        currentRate,
        retentionRate,
        retentionFee,
        refinanceRate,
        isGovReduced,
        mortgageFee,
        stampDuty,
        appraisalFee,
        insuranceFee,
        otherRefinanceFees,
        totalRefinanceFees,
        currentPlan,
        retentionPlan,
        retentionInterestSaved,
        retentionNetSavings,
        refinancePlan,
        refinanceInterestSaved,
        refinanceNetSavings,
        netSavingsAdvantage,
        interestSavedAdvantage,
        monthlyExtraInterestSaved,
        costDifference,
        breakevenMonth,
        isRefinanceBetter,
        recommendation
    };
}

/* -----------------------------------------------------------
 * UI RENDERER: รีไฟแนนซ์บ้าน vs Retention ธนาคารเดิม & จุดคุ้มทุน
 * ----------------------------------------------------------- */
function renderHomeRefinanceTool(container) {
    const st = appState.loan;
    const calc = calculateHomeRefinance({
        principal: parseNumericInput(st.principal),
        months: integerOrDefault(st.months, 240),
        currentRate: parseNumericInput(st.currentRate ?? '5.50'),
        retentionRate: parseNumericInput(st.retentionRate ?? '3.80'),
        retentionFee: parseNumericInput(st.retentionFee ?? '0'),
        refinanceRate: parseNumericInput(st.refinanceRate ?? '2.99'),
        isGovReducedMortgage: st.isGovReducedMortgage === 'yes',
        appraisalFee: parseNumericInput(st.appraisalFee ?? '2800'),
        insuranceFee: parseNumericInput(st.insuranceFee ?? '2000'),
        otherRefinanceFees: parseNumericInput(st.otherRefinanceFees ?? '0')
    });

    container.innerHTML = `
        <div class="finance-thai-tool refinance-tool flex flex-col gap-3 p-1">
            <!-- Mode Switcher Tabs -->
            <div class="segment-group grid-cols-2 balanced-segment-modes mb-1" role="group" aria-label="โหมดเงินกู้">
                <button type="button" aria-pressed="false" class="segment-btn loan-tab-btn" data-tab="amortization">
                    📊 ผ่อนชำระ & ตารางโปะ
                </button>
                <button type="button" aria-pressed="true" class="segment-btn loan-tab-btn active" data-tab="refinance">
                    🔄 รีไฟแนนซ์ vs Retention (ธปท.)
                </button>
            </div>

            <!-- Principal & Term Inputs -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)] border-b border-[var(--app-hairline)] pb-1.5 tool-section-heading flex flex-wrap justify-between items-center gap-2">
                    <span>1. ยอดหนี้คงเหลือและระยะเวลา</span>
                    <span class="text-[11px] font-medium text-[var(--app-ink)]">เปรียบเทียบช่วง 3 ปีแรก</span>
                </div>
                <div>
                    <label class="text-xs font-medium text-[var(--app-muted)] block mb-1">ยอดหนี้บ้านคงเหลือ (Principal Balance)</label>
                    <div class="relative">
                        <input id="refinancePrincipal" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.principal))}" class="airbnb-input w-full font-bold text-base text-[var(--app-ink)] pr-12" placeholder="เช่น 2,000,000">
                        <span class="absolute right-3 top-2.5 text-xs text-[var(--app-muted)]">บาท</span>
                    </div>
                    <!-- Quick Principal Chips -->
                    <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span class="text-[11px] text-[var(--app-muted)]">เลือกด่วน:</span>
                        <button type="button" class="btn-quick-principal tool-chip-btn" data-p="1000000">1.0 ล้าน</button>
                        <button type="button" class="btn-quick-principal tool-chip-btn" data-p="2000000">2.0 ล้าน</button>
                        <button type="button" class="btn-quick-principal tool-chip-btn" data-p="3000000">3.0 ล้าน</button>
                        <button type="button" class="btn-quick-principal tool-chip-btn" data-p="5000000">5.0 ล้าน</button>
                    </div>
                </div>

                <div>
                    <label class="text-xs font-medium text-[var(--app-muted)] block mb-1">ระยะเวลาผ่อนที่เหลืออยู่ (เดือน / ปี)</label>
                    <div class="grid grid-cols-2 gap-2">
                        <div class="relative">
                            <input id="refinanceMonths" type="number" min="12" max="480" value="${st.months || 240}" class="airbnb-input w-full font-semibold text-xs pr-12">
                            <span class="absolute right-3 top-2 text-xs text-[var(--app-muted)]">เดือน</span>
                        </div>
                        <div class="flex items-center text-xs font-bold text-[var(--app-ink)] bg-[var(--app-surface-soft)] rounded-lg px-3 border border-[var(--app-hairline)]">
                            ≈ ${(integerOrDefault(st.months, 240) / 12).toFixed(1)} ปี
                        </div>
                    </div>
                </div>
            </div>

            <!-- Comparison Input Cards (3 Options) -->
            <div class="grid grid-cols-1 gap-3">
                <!-- Option 1: Existing Floating -->
                <div class="themed-tool-card p-4 space-y-2">
                    <div class="text-xs font-bold text-[var(--app-ink)] border-b pb-1">
                        1. ดอกเบี้ยเดิมลอยตัว
                    </div>
                    <div>
                        <label class="text-[11px] text-[var(--app-muted)] block mb-0.5">ดอกเบี้ย MRR เดิม (%)</label>
                        <input id="refinanceCurrentRate" type="number" step="0.01" value="${st.currentRate ?? '5.50'}" class="airbnb-input w-full text-xs font-bold text-center">
                    </div>
                    <div class="pt-1 border-t text-[11px] space-y-1 text-[var(--app-muted)]">
                        <div class="flex justify-between gap-3">
                            <span>ผ่อนต่อเดือน:</span>
                            <b class="text-[var(--app-ink)]">${formatMoney(calc.currentPlan.monthlyPay)} ฿</b>
                        </div>
                        <div class="flex justify-between gap-3">
                            <span>ดอกเบี้ย 3 ปี:</span>
                            <b class="text-[var(--app-ink)]">${formatMoney(calc.currentPlan.interestPaid3Y)} ฿</b>
                        </div>
                    </div>
                </div>

                <!-- Option 2: Retention -->
                <div class="themed-tool-card p-4 space-y-3">
                    <div class="text-xs font-bold text-[var(--app-ink)] border-b border-[var(--app-hairline)] pb-1 flex justify-between gap-3">
                        <span>2. ขอลดแบงก์เดิม</span>
                        <span class="text-[11px] bg-[var(--app-surface-soft)] text-[var(--app-ink)] px-1 rounded">Retention</span>
                    </div>
                    <div>
                        <label class="text-[11px] text-[var(--app-ink)] block mb-0.5">ดอกเบี้ย Retention เฉลี่ย (%)</label>
                        <input id="refinanceRetentionRate" type="number" step="0.01" value="${st.retentionRate ?? '3.80'}" class="airbnb-input w-full text-xs font-bold text-center text-[var(--app-ink)] border-[var(--app-hairline)]">
                    </div>
                    <div>
                        <label class="text-[11px] text-[var(--app-muted)] block mb-0.5">ค่าธรรมเนียม Retention (ถ้ามี)</label>
                        <input id="refinanceRetentionFee" type="number" value="${st.retentionFee ?? '0'}" class="airbnb-input w-full text-xs text-center">
                    </div>
                    <div class="pt-1 border-t border-[var(--app-hairline)] text-[11px] space-y-1 text-[var(--app-ink)] font-medium">
                        <div class="flex justify-between gap-3">
                            <span>ผ่อนต่อเดือน:</span>
                            <b>${formatMoney(calc.retentionPlan.monthlyPay)} ฿</b>
                        </div>
                        <div class="flex justify-between gap-3">
                            <span>ประหยัดสุทธิ 3 ปี:</span>
                            <b class="text-[var(--app-ink)]">+${formatMoney(calc.retentionNetSavings)} ฿</b>
                        </div>
                    </div>
                </div>

                <!-- Option 3: Refinance -->
                <div class="themed-tool-card p-4 space-y-3">
                    <div class="text-xs font-bold text-[var(--app-ink)] border-b border-[var(--app-hairline)] pb-1 flex justify-between gap-3">
                        <span>3. ย้ายธนาคารใหม่</span>
                        <span class="text-[11px] bg-[var(--app-surface-soft)] text-[var(--app-ink)] px-1 rounded">Refinance</span>
                    </div>
                    <div>
                        <label class="text-[11px] text-[var(--app-ink)] block mb-0.5">ดอกเบี้ยเฉลี่ย 3 ปีแรก (%)</label>
                        <input id="refinanceNewRate" type="number" step="0.01" value="${st.refinanceRate ?? '2.99'}" class="airbnb-input w-full text-xs font-bold text-center text-[var(--app-ink)] border-[var(--app-hairline)]">
                    </div>
                    <div class="pt-1 text-[11px] space-y-1 text-[var(--app-ink)] font-medium">
                        <label class="flex items-center gap-1.5 text-[11px] text-[var(--app-muted)] cursor-pointer mb-1">
                            <input id="refinanceGovReduced" type="checkbox" ${calc.isGovReduced ? 'checked' : ''} class="rounded text-[var(--app-ink)]">
                            <span>มาตรการรัฐ (จำนอง 0.01%)</span>
                        </label>
                        <div class="flex justify-between gap-3">
                            <span>รวมค่าใช้จ่ายย้าย:</span>
                            <b class="text-[var(--app-ink)]">-${formatMoney(calc.totalRefinanceFees)} ฿</b>
                        </div>
                        <div class="flex justify-between gap-3">
                            <span>ผ่อนต่อเดือน:</span>
                            <b>${formatMoney(calc.refinancePlan.monthlyPay)} ฿</b>
                        </div>
                        <div class="flex justify-between gap-3">
                            <span>ประหยัดสุทธิ 3 ปี:</span>
                            <b class="text-[var(--app-ink)]">+${formatMoney(calc.refinanceNetSavings)} ฿</b>
                        </div>
                    </div>
                </div>
            </div>

            <!-- HERO RECOMMENDATION BOX -->
            <div class="themed-result-card theme-result-highlight p-5 space-y-3">
                <div class="tool-section-heading flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <span class="text-xs font-semibold text-[var(--app-muted)]">
                            ผลเปรียบเทียบความคุ้มค่า
                        </span>
                        <div class="text-lg sm:text-xl font-bold mt-1 text-[var(--app-ink)]">
                            ${escapeHTML(calc.recommendation)}
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[var(--app-hairline)] text-xs">
                    <div class="themed-subcard p-3">
                        <div class="text-[11px] text-[var(--app-muted)]">จุดคุ้มทุน (Breakeven)</div>
                        <div class="text-sm font-bold text-[var(--app-ink)] mt-0.5">
                            ${calc.breakevenMonth !== null ? (calc.breakevenMonth === 0 ? 'คุ้มทุนทันที' : `เดือนที่ ${calc.breakevenMonth} (ปีที่ ${(calc.breakevenMonth / 12).toFixed(1)})`) : 'ไม่คุ้มทุน'}
                        </div>
                        <div class="text-[11px] text-[var(--app-muted)]">จากส่วนต่างค่าธรรมเนียม</div>
                    </div>
                    <div class="themed-subcard p-3">
                        <div class="text-[11px] text-[var(--app-muted)]">ประหยัดดอกเบี้ย 3 ปี (Refinance)</div>
                        <div class="text-sm font-bold text-[var(--app-ink)] mt-0.5">+${formatMoney(calc.refinanceInterestSaved)} ฿</div>
                        <div class="text-[11px] text-[var(--app-muted)]">เทียบกับไม่ทำอะไรเลย</div>
                    </div>
                    <div class="themed-subcard p-3 col-span-2 sm:col-span-1">
                        <div class="text-[11px] text-[var(--app-muted)]">ประหยัดดอกเบี้ย 3 ปี (Retention)</div>
                        <div class="text-sm font-bold text-[var(--app-ink)] mt-0.5">+${formatMoney(calc.retentionInterestSaved)} ฿</div>
                        <div class="text-[11px] text-[var(--app-muted)]">ไม่มีค่าธรรมเนียมย้ายค่าย</div>
                    </div>
                </div>
            </div>

            <!-- ITEMIZED REFINANCE CLOSING COSTS BREAKDOWN -->
            <div class="themed-tool-card p-4 space-y-2 text-xs">
                <div class="font-bold text-[var(--app-ink)] border-b border-[var(--app-hairline)] pb-1.5 flex justify-between gap-3">
                    <span>รายละเอียดค่าใช้จ่ายในการรีไฟแนนซ์ (Refinance Closing Costs)</span>
                    <span>ประมาณการ</span>
                </div>
                <div class="flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">1. ค่าจดจำนองที่ดิน (${calc.isGovReduced ? 'มาตรการรัฐ 0.01%' : 'อัตราปกติ 1.0%'})</span>
                    <b class="text-[var(--app-ink)]">${formatMoney(calc.mortgageFee)} บาท</b>
                </div>
                <div class="flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">2. ค่าประเมินราคาหลักทรัพย์</span>
                    <b class="text-[var(--app-ink)]">${formatMoney(calc.appraisalFee)} บาท</b>
                </div>
                <div class="flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">3. ค่าอากรแสตมป์สัญญาเงินกู้ (0.05% สูงสุด 10,000 บ.)</span>
                    <b class="text-[var(--app-ink)]">${formatMoney(calc.stampDuty)} บาท</b>
                </div>
                <div class="flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">4. ค่าเบี้ยประกันอัคคีภัย (ประมาณการ)</span>
                    <b class="text-[var(--app-ink)]">${formatMoney(calc.insuranceFee)} บาท</b>
                </div>
                <div class="border-t border-[var(--app-hairline)] pt-1.5 flex justify-between gap-3 font-bold text-[var(--app-ink)]">
                    <span>รวมค่าใช้จ่ายดำเนินการรีไฟแนนซ์ทั้งหมด</span>
                    <span class="text-[var(--app-ink)]">${formatMoney(calc.totalRefinanceFees)} บาท</span>
                </div>

                <div class="flex justify-end pt-2">
                    <button id="btnPrintRefinanceSummary" type="button" class="tool-action-btn text-xs">
                        พิมพ์เอกสารวิเคราะห์รีไฟแนนซ์ / PDF
                    </button>
                </div>
            </div>
        </div>
    `;

    // Event Listeners
    container.querySelectorAll('.loan-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            st.tab = btn.dataset.tab;
            persistAppState();
            renderActiveTool();
        });
    });

    container.querySelectorAll('.btn-quick-principal').forEach(btn => {
        btn.addEventListener('click', () => {
            st.principal = formatInputDisplay(btn.dataset.p);
            persistAppState();
            renderActiveTool();
        });
    });

    const bindInput = (id, key) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('change', () => {
            st[key] = input.value;
            persistAppState();
            renderActiveTool();
        });
        input.addEventListener('blur', () => {
            const formatted = formatInputDisplay(input.value);
            st[key] = formatted;
            input.value = formatted;
            persistAppState();
        });
    };

    bindInput('refinancePrincipal', 'principal');

    document.getElementById('refinanceMonths')?.addEventListener('change', (e) => {
        st.months = e.target.value;
        persistAppState();
        renderActiveTool();
    });

    const bindRate = (id, key) => {
        document.getElementById(id)?.addEventListener('change', (e) => {
            st[key] = e.target.value;
            persistAppState();
            renderActiveTool();
        });
    };
    bindRate('refinanceCurrentRate', 'currentRate');
    bindRate('refinanceRetentionRate', 'retentionRate');
    bindRate('refinanceRetentionFee', 'retentionFee');
    bindRate('refinanceNewRate', 'refinanceRate');

    document.getElementById('refinanceGovReduced')?.addEventListener('change', (e) => {
        st.isGovReducedMortgage = e.target.checked ? 'yes' : 'no';
        persistAppState();
        renderActiveTool();
    });

    container.querySelector('#btnPrintRefinanceSummary')?.addEventListener('click', () => {
        triggerPrintReceipt('loan');
    });

    // Status Banner
    setStatusBanner('success', `แนะนำ: <b>${calc.isRefinanceBetter ? 'รีไฟแนนซ์' : 'Retention'}</b> · ประหยัดสุทธิ 3 ปี <b>${formatMoney(calc.isRefinanceBetter ? calc.refinanceNetSavings : calc.retentionNetSavings)} บาท</b>${calc.breakevenMonth !== null ? ` (จุดคุ้มทุนเดือนที่ ${calc.breakevenMonth})` : ''}`);
}

/* -----------------------------------------------------------
 * TOOL 16: เงินออม (Savings & Compound Interest Calculator)
 * ----------------------------------------------------------- */
function renderSavingsTool(container) {
    const st = appState.savings;
    const init = numberOrDefault(st.initial, 0);
    const monthly = numberOrDefault(st.monthly, 0);
    const rate = numberOrDefault(st.interestRate, 0);
    const retirementYears = Math.max(0, numberOrDefault(st.retirementAge, 0) - numberOrDefault(st.currentAge, 0));
    const years = st.mode === 'retirement' ? retirementYears : numberOrDefault(st.years, 0);
    const annualIncrease = numberOrDefault(st.annualIncrease, 0);
    const inflationRate = numberOrDefault(st.inflationRate, 0);

    const months = Math.round(years * 12);
    const r = (rate / 100) / 12;
    let totalBalance = init;
    let totalPrincipal = init;
    const yearlyRows = [];
    const monthlyRows = [];

    let yearlyDepositAcc = init;
    let yearlyInterestAcc = 0;

    for (let m = 0; m < months; m++) {
        const prevBal = totalBalance;
        const currentMonthly = monthly * Math.pow(1 + annualIncrease / 100, Math.floor(m / 12));
        const monthInterest = (prevBal + currentMonthly) * r;
        totalBalance = (prevBal + currentMonthly) + monthInterest;
        totalPrincipal += currentMonthly;

        yearlyDepositAcc += currentMonthly;
        yearlyInterestAcc += monthInterest;

        monthlyRows.push({
            month: m + 1,
            year: Math.ceil((m + 1) / 12),
            deposit: currentMonthly,
            interest: monthInterest,
            principal: totalPrincipal,
            cumulativeInterest: totalBalance - totalPrincipal,
            balance: totalBalance
        });

        if ((m + 1) % 12 === 0 || m === months - 1) {
            const y = Math.ceil((m + 1) / 12);
            yearlyRows.push({
                year: y,
                depositThisYear: yearlyDepositAcc,
                interestThisYear: yearlyInterestAcc,
                principal: totalPrincipal,
                balance: totalBalance,
                interest: totalBalance - totalPrincipal,
                cumulativeInterest: totalBalance - totalPrincipal,
                realValue: totalBalance / Math.pow(1 + inflationRate / 100, y)
            });
            yearlyDepositAcc = 0;
            yearlyInterestAcc = 0;
        }
    }
    const interestEarned = Math.max(0, totalBalance - totalPrincipal);
    const realValue = totalBalance / Math.pow(1 + inflationRate / 100, years);
    const goalTarget = numberOrDefault(st.goalTarget, 0);
    const emergencyTarget = (numberOrDefault(st.monthlyExpenses, 0)) * (numberOrDefault(st.emergencyMonths, 0));
    const retirementTarget = numberOrDefault(st.retirementMonthly, 0) * 12 * 25;
    const modeTarget = st.mode === 'goal' ? goalTarget : (st.mode === 'emergency' ? emergencyTarget : (st.mode === 'retirement' ? retirementTarget : 0));
    const balanceForMonthly = (deposit) => {
        let balance = init;
        for (let month = 0; month < months; month++) balance = (balance + deposit * Math.pow(1 + annualIncrease / 100, Math.floor(month / 12))) * (1 + r);
        return balance;
    };
    let requiredMonthly = 0;
    if (modeTarget > 0 && months > 0 && balanceForMonthly(0) < modeTarget) {
        let low = 0, high = modeTarget / Math.max(1, months);
        // Falling returns/deposits may require more than target / months.
        for (let i = 0; i < 64 && balanceForMonthly(high) < modeTarget; i++) high *= 2;
        for (let i = 0; i < 40; i++) { const mid = (low + high) / 2; if (balanceForMonthly(mid) >= modeTarget) high = mid; else low = mid; }
        requiredMonthly = high;
    }

    container.innerHTML = `
        <div class="flex flex-col gap-1.5">
            ${createKeypadFieldHTML(0, 'เงินออมเริ่มต้น', st.initial, 'บาท', 'เช่น 10,000')}
            ${createKeypadFieldHTML(1, 'ฝากเพิ่มรายเดือน', st.monthly, 'บาท/เดือน', 'เช่น 3,000')}
            ${createKeypadFieldHTML(2, 'อัตราดอกเบี้ยต่อปี', st.interestRate, '% ต่อปี', 'เช่น 2.5')}
            ${st.mode === 'retirement'
                ? `<div class="p-3 text-sm">ระยะสะสมเงินก่อนเกษียณ: <b>${formatNum(retirementYears)} ปี</b><div class="text-xs text-[#6a6a6a] mt-1">เป้าหมายครอบคลุมค่าใช้จ่ายหลังเกษียณ 25 ปี ตามค่าใช้จ่ายรายเดือนที่กรอก ยังไม่รวมเงินเฟ้อและผลตอบแทนหลังเกษียณ</div></div>`
                : createKeypadFieldHTML(3, 'ระยะเวลาออม', st.years, 'ปี', 'เช่น 5')}
        </div>
    `;

    const savingsRoot = container.firstElementChild;
    savingsRoot.insertAdjacentHTML('afterbegin', `<div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-2 space-y-2"><label class="text-xs text-[#6a6a6a] block mb-1">โหมดวางแผนเงินออม</label><select id="savingsMode" class="w-full font-semibold text-sm bg-transparent outline-none"><option value="growth" ${st.mode === 'growth' ? 'selected' : ''}>เงินออมเติบโต</option><option value="goal" ${st.mode === 'goal' ? 'selected' : ''}>เป้าหมายเงินออม</option><option value="emergency" ${st.mode === 'emergency' ? 'selected' : ''}>กองทุนฉุกเฉิน</option><option value="retirement" ${st.mode === 'retirement' ? 'selected' : ''}>เงินออมเพื่อเกษียณ</option></select><div class="grid grid-cols-2 gap-2"><input id="savingsAnnualIncrease" type="number" step="0.1" value="${st.annualIncrease}" placeholder="เพิ่มเงินฝาก/ปี (%)" class="airbnb-input w-full"><input id="savingsInflation" type="number" step="0.1" value="${st.inflationRate}" placeholder="เงินเฟ้อ (%)" class="airbnb-input w-full"></div><div id="savingsModeFields" class="grid grid-cols-2 gap-2"></div></div>`);
    const modeFields = container.querySelector('#savingsModeFields');
    const renderModeFields = () => {
        if (st.mode === 'goal') modeFields.innerHTML = `<input id="savingsGoalTarget" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.goalTarget))}" placeholder="เป้าหมาย เช่น 100,000" class="airbnb-input w-full">`;
        else if (st.mode === 'emergency') modeFields.innerHTML = `<input id="savingsExpenses" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.monthlyExpenses))}" placeholder="ค่าใช้จ่าย/เดือน เช่น 20,000" class="airbnb-input w-full"><input id="savingsEmergencyMonths" type="number" value="${st.emergencyMonths}" placeholder="สำรองกี่เดือน" class="airbnb-input w-full">`;
        else if (st.mode === 'retirement') modeFields.innerHTML = `<input id="savingsCurrentAge" type="number" value="${st.currentAge}" placeholder="อายุปัจจุบัน" class="airbnb-input w-full"><input id="savingsRetirementAge" type="number" value="${st.retirementAge}" placeholder="อายุเกษียณ" class="airbnb-input w-full"><input id="savingsRetirementMonthly" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.retirementMonthly))}" placeholder="ค่าใช้จ่ายหลังเกษียณ เช่น 30,000" class="airbnb-input w-full">`;
        else modeFields.innerHTML = '';
    };
    renderModeFields();
    const saveField = (id, key) => container.querySelector(`#${id}`)?.addEventListener('change', event => {
        const val = event.target.value;
        st[key] = ['goalTarget', 'monthlyExpenses', 'retirementMonthly'].includes(key) ? formatInputDisplay(val) : val;
        renderActiveTool();
    });
    container.querySelector('#savingsMode').addEventListener('change', event => { st.mode = event.target.value; renderActiveTool(); });
    saveField('savingsAnnualIncrease', 'annualIncrease');
    saveField('savingsInflation', 'inflationRate');
    saveField('savingsGoalTarget', 'goalTarget');
    saveField('savingsExpenses', 'monthlyExpenses');
    saveField('savingsEmergencyMonths', 'emergencyMonths');
    saveField('savingsCurrentAge', 'currentAge');
    saveField('savingsRetirementAge', 'retirementAge');
    saveField('savingsRetirementMonthly', 'retirementMonthly');
    if (yearlyRows.length) {
        const yearlyTable = document.createElement('div');
        yearlyTable.className = 'bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3 mt-2 overflow-auto';
        yearlyTable.innerHTML = `
            <div class="flex items-center justify-between gap-2 mb-2">
                <div class="text-xs font-semibold text-[#6a6a6a]">ตารางเงินออมสะสม (${years} ปี)</div>
                <div class="flex items-center gap-1.5 flex-wrap justify-end">
                    <button id="btnPrintSavingsSummary" type="button" title="พิมพ์แผนการออมเงินหรือบันทึกเป็นไฟล์ PDF" class="px-2 py-1 text-xs font-semibold rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1 cursor-pointer">
                        🖨️ พิมพ์/PDF
                    </button>
                    <button id="btnExportSavingsMonthly" type="button" title="ดาวน์โหลดตารางเงินออมรายเดือนทุกงวดเป็นไฟล์ CSV สำหรับ Excel / Google Sheets" class="px-2 py-1 text-xs font-medium rounded-lg border border-[var(--app-hairline)] text-[#4a4a4a] bg-neutral-50 hover:bg-neutral-100 active:scale-95 transition-all flex items-center gap-1 cursor-pointer">
                        📥 รายงวด (.CSV)
                    </button>
                    <button id="btnExportSavingsYearly" type="button" title="ดาวน์โหลดสรุปเงินออมรายปีเป็นไฟล์ CSV สำหรับ Excel / Google Sheets" class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--app-accent)] text-white hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1 cursor-pointer">
                        📥 รายปี (.CSV)
                    </button>
                </div>
            </div>
            <table class="w-full text-xs">
                <thead><tr class="border-b"><th class="text-left py-1">ปี</th><th class="text-right py-1">เงินต้นสะสม</th><th class="text-right py-1">ดอกเบี้ยสะสม</th><th class="text-right py-1">ยอดรวม</th></tr></thead>
                <tbody>${yearlyRows.map(row => `<tr class="border-b border-[#eee]"><td class="py-1">${row.year}</td><td class="text-right">${formatMoney(row.principal)}</td><td class="text-right">${formatMoney(row.interest)}</td><td class="text-right">${formatMoney(row.balance)}</td></tr>`).join('')}</tbody>
            </table>
        `;
        savingsRoot.appendChild(yearlyTable);

        const savingsData = { monthlyRows, yearlyRows, totalBalance, totalPrincipal, interestEarned };
        yearlyTable.querySelector('#btnPrintSavingsSummary')?.addEventListener('click', () => {
            triggerPrintReceipt('savings');
        });
        yearlyTable.querySelector('#btnExportSavingsMonthly')?.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const csv = buildSavingsScheduleCSV(savingsData, 'monthly');
            downloadCSV(getCSVFilename('savings_schedule', 'monthly'), csv);
            triggerButtonFeedback(btn, '✓ โหลดแล้ว');
        });

        yearlyTable.querySelector('#btnExportSavingsYearly')?.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const csv = buildSavingsScheduleCSV(savingsData, 'yearly');
            downloadCSV(getCSVFilename('savings_schedule', 'yearly'), csv);
            triggerButtonFeedback(btn, '✓ โหลดแล้ว');
        });
    }

    attachFieldClickListeners(container);

    if (st.mode === 'retirement' && retirementYears <= 0) {
        setStatusBanner('error', 'อายุเกษียณต้องมากกว่าอายุปัจจุบัน เพื่อคำนวณระยะสะสมเงินและเงินออมรายเดือน');
    } else if (totalPrincipal <= 0 || years <= 0) {
        setStatusBanner('empty', 'ป้อนเงินออมเริ่มต้นหรือเงินฝากรายเดือนเพื่อคำนวณผลตอบแทน');
    } else {
        const targetText = modeTarget > 0 ? ` | เป้าหมาย: ${formatMoney(modeTarget)} ฿ | ${totalBalance >= modeTarget ? 'ถึงเป้าหมายแล้ว' : 'ยังขาด ' + formatMoney(modeTarget - totalBalance) + ' ฿' + (requiredMonthly ? ' · ควรออมประมาณ ' + formatMoney(requiredMonthly) + ' ฿/เดือน' : '')}` : '';
        setStatusBanner('success', `🐷 เงินออมรวมสุทธิ: <span class="text-lg text-[var(--app-accent)] underline">${formatMoney(totalBalance)} บาท</span><span class="text-xs font-medium block text-[#3f3f3f]">เงินต้น: ${formatMoney(totalPrincipal)} ฿ | ดอกเบี้ย: +${formatMoney(interestEarned)} ฿ | มูลค่าหลังเงินเฟ้อ: ${formatMoney(realValue)} ฿${targetText}</span>`);
    }
}

(function(root) {
    const exportsObj = {
        loadFrankfurterRates,
        renderCurrencyTool,
        renderLoanTool,
        calculateHomeRefinance,
        renderHomeRefinanceTool,
        renderSavingsTool
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
