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
 * TOOL 15: เงินกู้ (Loan Payment Calculator)
 * ----------------------------------------------------------- */
function renderLoanTool(container) {
    const st = appState.loan;
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
            ${createKeypadFieldHTML(0, 'วงเงินกู้ (เงินต้น)', st.principal, 'บาท', 'เช่น 500,000')}
            ${createKeypadFieldHTML(1, 'อัตราดอกเบี้ยต่อปี', st.interestRate, '% ต่อปี', 'เช่น 4.5')}
            ${createKeypadFieldHTML(2, 'ระยะเวลาผ่อนชำระ', st.months, 'เดือน', 'เช่น 36')}
            ${createKeypadFieldHTML(3, 'โปะเพิ่มรายเดือน', st.extra, 'บาท/เดือน', 'เช่น 1000')}
        </div>
    `;

    attachFieldClickListeners(container);

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
        renderSavingsTool
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
