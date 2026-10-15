// ==============================================================
// Multitools Calculator - CSV Export & Print-to-PDF Core Helpers
// ==============================================================

function generateLoanSchedule(params) {
    const P = numberOrDefault(params.principal, 0);
    const annualRate = numberOrDefault(params.interestRate, 0);
    const n = integerOrDefault(params.months, 0);
    const extra = numberOrDefault(params.extra, 0);
    const rateType = params.rateType || 'fixed';
    const rateAfter = numberOrDefault(params.rateAfter, annualRate);
    const promoMonths = Math.max(0, integerOrDefault(params.promoMonths, 0));
    const calcMethod = params.calcMethod || 'reducing';

    const schedule = [];
    if (P <= 0 || n <= 0) return schedule;

    let bal = P, m = 0, payment = 0, previousRate = null;
    while (bal > 0.01 && m < 1200 && m < n + 120) {
        const currentRate = rateType === 'step' && m >= promoMonths ? rateAfter : annualRate;
        const r = (currentRate / 100) / 12;
        const remaining = Math.max(1, n - m);
        if (payment === 0 || previousRate !== currentRate) {
            payment = calcMethod === 'flat' 
                ? (P / n) + (P * currentRate / 100 / 12) 
                : (r === 0 ? bal / remaining : bal * (r * Math.pow(1 + r, remaining)) / (Math.pow(1 + r, remaining) - 1));
            previousRate = currentRate;
        }
        const interest = calcMethod === 'flat' ? (P * currentRate / 100 / 12) : (bal * r);
        const principalPart = Math.min(bal, Math.max(0, payment + extra - interest));
        if (principalPart <= 0) break;
        const actualPayment = interest + principalPart;
        bal -= principalPart;
        schedule.push({
            month: m + 1,
            year: Math.ceil((m + 1) / 12),
            payment: actualPayment,
            interest: interest,
            principal: principalPart,
            balance: Math.max(0, bal),
            rate: currentRate
        });
        m++;
    }
    return schedule;
}

function aggregateLoanScheduleByYear(schedule) {
    const yearlyMap = new Map();
    for (const row of schedule) {
        const y = row.year;
        if (!yearlyMap.has(y)) {
            yearlyMap.set(y, {
                year: y,
                paymentsCount: 0,
                payment: 0,
                interest: 0,
                principal: 0,
                balance: row.balance
            });
        }
        const yr = yearlyMap.get(y);
        yr.paymentsCount++;
        yr.payment += row.payment;
        yr.interest += row.interest;
        yr.principal += row.principal;
        yr.balance = row.balance;
    }
    return Array.from(yearlyMap.values());
}

function rowsToCSV(rows) {
    return rows.map(row =>
        row.map(cell => {
            const str = (cell === null || cell === undefined) ? '' : String(cell);
            if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',')
    ).join('\r\n');
}

function buildLoanAmortizationCSV(schedule, type = 'monthly') {
    const rows = [];
    if (!Array.isArray(schedule) || schedule.length === 0) {
        return '\uFEFF';
    }
    if (type === 'yearly') {
        const yearly = aggregateLoanScheduleByYear(schedule);
        rows.push(['ปีที่', 'จำนวนงวดในปี', 'ยอดผ่อนทั้งปี (บาท)', 'ดอกเบี้ยทั้งปี (บาท)', 'ตัดเงินต้นทั้งปี (บาท)', 'หนี้คงเหลือปลายปี (บาท)']);
        let totalPay = 0, totalInt = 0, totalPrin = 0;
        for (const yr of yearly) {
            rows.push([
                yr.year,
                yr.paymentsCount,
                yr.payment.toFixed(2),
                yr.interest.toFixed(2),
                yr.principal.toFixed(2),
                yr.balance.toFixed(2)
            ]);
            totalPay += yr.payment;
            totalInt += yr.interest;
            totalPrin += yr.principal;
        }
        const finalBal = yearly[yearly.length - 1]?.balance || 0;
        rows.push(['รวมทั้งหมด', schedule.length, totalPay.toFixed(2), totalInt.toFixed(2), totalPrin.toFixed(2), finalBal.toFixed(2)]);
    } else {
        rows.push(['งวดที่', 'ปีที่', 'ค่างวด (บาท)', 'ดอกเบี้ย (บาท)', 'ตัดเงินต้น (บาท)', 'หนี้คงเหลือ (บาท)', 'อัตราดอกเบี้ย (% ต่อปี)']);
        let totalPay = 0, totalInt = 0, totalPrin = 0;
        for (const row of schedule) {
            rows.push([
                row.month,
                row.year,
                row.payment.toFixed(2),
                row.interest.toFixed(2),
                row.principal.toFixed(2),
                row.balance.toFixed(2),
                row.rate.toFixed(2)
            ]);
            totalPay += row.payment;
            totalInt += row.interest;
            totalPrin += row.principal;
        }
        const finalBal = schedule[schedule.length - 1]?.balance || 0;
        rows.push(['รวมทั้งหมด', '', totalPay.toFixed(2), totalInt.toFixed(2), totalPrin.toFixed(2), finalBal.toFixed(2), '']);
    }
    return '\uFEFF' + rowsToCSV(rows);
}

function generateSavingsSchedule(params) {
    const init = numberOrDefault(params.initial, 0);
    const monthly = numberOrDefault(params.monthly, 0);
    const rate = numberOrDefault(params.interestRate, 0);
    const retirementYears = Math.max(0, numberOrDefault(params.retirementAge, 0) - numberOrDefault(params.currentAge, 0));
    const years = params.mode === 'retirement' ? retirementYears : numberOrDefault(params.years, 0);
    const annualIncrease = numberOrDefault(params.annualIncrease, 0);
    const inflationRate = numberOrDefault(params.inflationRate, 0);

    const months = Math.round(years * 12);
    const r = (rate / 100) / 12;
    let totalBalance = init;
    let totalPrincipal = init;
    const monthlyRows = [];
    const yearlyRows = [];

    if (months <= 0 || (init <= 0 && monthly <= 0)) {
        return { monthlyRows, yearlyRows, totalBalance, totalPrincipal, interestEarned: 0 };
    }

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
                interest: totalBalance - totalPrincipal,
                cumulativeInterest: totalBalance - totalPrincipal,
                balance: totalBalance,
                realValue: totalBalance / Math.pow(1 + inflationRate / 100, y)
            });
            yearlyDepositAcc = 0;
            yearlyInterestAcc = 0;
        }
    }
    return {
        monthlyRows,
        yearlyRows,
        totalBalance,
        totalPrincipal,
        interestEarned: Math.max(0, totalBalance - totalPrincipal)
    };
}

function buildSavingsScheduleCSV(scheduleData, type = 'yearly') {
    const rows = [];
    const data = scheduleData || {};
    const monthlyRows = Array.isArray(data.monthlyRows) ? data.monthlyRows : [];
    const yearlyRows = Array.isArray(data.yearlyRows) ? data.yearlyRows : [];
    if (!monthlyRows.length && !yearlyRows.length) {
        return '\uFEFF';
    }
    if (type === 'monthly') {
        rows.push(['งวดที่', 'ปีที่', 'เงินฝากในงวด (บาท)', 'ดอกเบี้ยในงวด (บาท)', 'เงินต้นสะสม (บาท)', 'ดอกเบี้ยสะสม (บาท)', 'ยอดเงินรวมสะสม (บาท)']);
        let totalDeposits = 0, totalInterest = 0;
        for (const row of monthlyRows) {
            rows.push([
                row.month,
                row.year,
                row.deposit.toFixed(2),
                row.interest.toFixed(2),
                row.principal.toFixed(2),
                row.cumulativeInterest.toFixed(2),
                row.balance.toFixed(2)
            ]);
            totalDeposits += row.deposit;
            totalInterest += row.interest;
        }
        const lastRow = monthlyRows[monthlyRows.length - 1];
        rows.push(['รวมทั้งหมด', '', totalDeposits.toFixed(2), totalInterest.toFixed(2), lastRow ? lastRow.principal.toFixed(2) : '0.00', lastRow ? lastRow.cumulativeInterest.toFixed(2) : '0.00', lastRow ? lastRow.balance.toFixed(2) : '0.00']);
    } else {
        rows.push(['ปีที่', 'เงินฝากในปี (บาท)', 'ดอกเบี้ยในปี (บาท)', 'เงินต้นสะสม (บาท)', 'ดอกเบี้ยสะสม (บาท)', 'ยอดเงินรวมสะสม (บาท)', 'มูลค่าหลังเงินเฟ้อ (บาท)']);
        let totalDeposits = 0, totalInterest = 0;
        for (const row of yearlyRows) {
            const depInYear = row.depositThisYear !== undefined ? row.depositThisYear : 0;
            const intInYear = row.interestThisYear !== undefined ? row.interestThisYear : 0;
            const cumInt = row.cumulativeInterest !== undefined ? row.cumulativeInterest : (row.interest || 0);
            rows.push([
                row.year,
                depInYear.toFixed(2),
                intInYear.toFixed(2),
                row.principal.toFixed(2),
                cumInt.toFixed(2),
                row.balance.toFixed(2),
                (row.realValue !== undefined ? row.realValue : row.balance).toFixed(2)
            ]);
            totalDeposits += depInYear;
            totalInterest += intInYear;
        }
        const lastRow = yearlyRows[yearlyRows.length - 1];
        const finalCumInt = lastRow ? (lastRow.cumulativeInterest !== undefined ? lastRow.cumulativeInterest : (lastRow.interest || 0)) : 0;
        const finalReal = lastRow ? (lastRow.realValue !== undefined ? lastRow.realValue : lastRow.balance) : 0;
        rows.push(['รวมทั้งหมด', totalDeposits.toFixed(2), totalInterest.toFixed(2), lastRow ? lastRow.principal.toFixed(2) : '0.00', finalCumInt.toFixed(2), lastRow ? lastRow.balance.toFixed(2) : '0.00', finalReal.toFixed(2)]);
    }
    return '\uFEFF' + rowsToCSV(rows);
}

function getCSVFilename(prefix, type) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${prefix}_${type}_${y}${m}${d}.csv`;
}

function downloadCSV(filename, csvContent) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const contentWithBom = csvContent.startsWith('\uFEFF') ? csvContent : ('\uFEFF' + csvContent);
    const blob = new Blob([contentWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 300);
}

function triggerButtonFeedback(btn, successText = '✓ โหลดแล้ว') {
    if (!btn) return;
    const origHtml = btn.innerHTML;
    btn.innerHTML = successText;
    const hadBgAccent = btn.classList.contains('bg-[var(--app-accent)]');
    if (hadBgAccent) {
        btn.classList.remove('bg-[var(--app-accent)]');
        btn.classList.add('bg-emerald-600');
    } else {
        btn.classList.add('!bg-emerald-100', '!text-emerald-800', '!border-emerald-400');
    }
    setTimeout(() => {
        btn.innerHTML = origHtml;
        if (hadBgAccent) {
            btn.classList.remove('bg-emerald-600');
            btn.classList.add('bg-[var(--app-accent)]');
        } else {
            btn.classList.remove('!bg-emerald-100', '!text-emerald-800', '!border-emerald-400');
        }
    }, 1800);
}

/* -----------------------------------------------------------
 * PRINT-TO-PDF & FORMAL SUMMARY RECEIPT (Phase 3.3)
 * ----------------------------------------------------------- */
function formatThaiFormalDate(date) {
    const d = (date instanceof Date) ? date : new Date(date || Date.now());
    if (isNaN(d.getTime())) return '';
    const day = d.getDate();
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const month = thaiMonths[d.getMonth()];
    const yearThai = d.getFullYear() + 543;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} พ.ศ. ${yearThai} เวลา ${hours}:${minutes} น.`;
}

function generateFormalPrintHTML(toolId, stateObj) {
    const state = stateObj || (typeof appState !== 'undefined' ? appState : {});
    const curToolId = toolId || state.activeToolId || 'loan';
    const toolMeta = (typeof TOOLS_CATALOG !== 'undefined' ? TOOLS_CATALOG.find(t => t.id === curToolId) : null) || { menuTitle: curToolId, headerTitle: curToolId };
    const now = new Date();
    const dateStr = formatThaiFormalDate(now);
    const refCode = 'REF-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    let docTitle = `เอกสารสรุปผลการคำนวณ: ${toolMeta.menuTitle || toolMeta.headerTitle}`;
    let docSubtitle = 'Official Calculation Summary & Analysis Report';
    let paramsRows = [];
    let resultCards = [];
    let breakdownHTML = '';

    if (curToolId === 'loan') {
        docTitle = 'เอกสารสรุปผลการคำนวณสินเชื่อและตารางผ่อนชำระ';
        docSubtitle = 'Loan Amortization & Repayment Schedule Report';
        const st = state.loan || {};
        const P = numberOrDefault(st.principal, 0);
        const annualRate = numberOrDefault(st.interestRate, 0);
        const n = integerOrDefault(st.months, 0);
        const extra = numberOrDefault(st.extra, 0);
        const rateType = st.rateType || 'fixed';
        const rateAfter = numberOrDefault(st.rateAfter, annualRate);
        const promoMonths = integerOrDefault(st.promoMonths, 0);
        const calcMethod = st.calcMethod || 'reducing';

        paramsRows = [
            ['วงเงินกู้ (Principal)', `${formatMoney(P)} บาท`],
            ['อัตราดอกเบี้ยเริ่มต้น', `${annualRate}% ต่อปี`],
            ['รูปแบบอัตราดอกเบี้ย', rateType === 'step' ? `ขั้นบันได (${promoMonths} เดือนแรก จากนั้น ${rateAfter}%)` : 'อัตราคงที่ตลอดสัญญา'],
            ['ระยะเวลาผ่อนชำระ', `${n} เดือน (${(n / 12).toFixed(1)} ปี)`],
            ['วิธีการคำนวณดอกเบี้ย', calcMethod === 'flat' ? 'เงินกู้คงที่ (Flat Rate)' : 'ลดต้นลดดอก (Effective Rate)'],
            ['ยอดโปะเงินต้นเพิ่ม', extra > 0 ? `${formatMoney(extra)} บาท/เดือน` : 'ไม่มี (ผ่อนตามเกณฑ์ปกติ)']
        ];

        const schedule = generateLoanSchedule(st);
        const baseSchedule = generateLoanSchedule({ ...st, extra: 0 });
        const normalTotalPaid = baseSchedule.reduce((acc, row) => acc + row.payment, 0);
        const normalTotalInterest = baseSchedule.reduce((acc, row) => acc + row.interest, 0);
        const actualTotalPaid = schedule.reduce((acc, row) => acc + row.payment, 0);
        const actualTotalInterest = schedule.reduce((acc, row) => acc + row.interest, 0);
        const interestSaved = Math.max(0, normalTotalInterest - actualTotalInterest);
        const monthsSaved = Math.max(0, baseSchedule.length - schedule.length);
        const monthlyPay = schedule[0]?.payment || (baseSchedule[0]?.payment || 0);

        resultCards = [
            { label: 'ยอดผ่อนชำระต่อเดือน', value: `${formatMoney(monthlyPay)} บาท`, highlight: true },
            { label: 'ยอดผ่อนชำระรวมตลอดสัญญา', value: `${formatMoney(actualTotalPaid)} บาท` },
            { label: 'ดอกเบี้ยจ่ายรวมทั้งหมด', value: `${formatMoney(actualTotalInterest)} บาท` }
        ];
        if (extra > 0) {
            resultCards.push({ label: 'ประหยัดดอกเบี้ยได้จากการโปะ', value: `${formatMoney(interestSaved)} บาท`, highlight: true });
            resultCards.push({ label: 'ระยะเวลาผ่อนหมดเร็วขึ้น', value: `${monthsSaved} เดือน (ประมาณ ${(monthsSaved / 12).toFixed(1)} ปี)` });
        }

        if (schedule.length > 0) {
            const yearly = aggregateLoanScheduleByYear(schedule);
            let tableRowsHTML = yearly.map(yr => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 6px 8px; text-align: center;">ปีที่ ${yr.year}</td>
                    <td style="padding: 6px 8px; text-align: right;">${formatMoney(yr.payment)}</td>
                    <td style="padding: 6px 8px; text-align: right; color: #b91c1c;">${formatMoney(yr.interest)}</td>
                    <td style="padding: 6px 8px; text-align: right; color: #15803d;">${formatMoney(yr.principal)}</td>
                    <td style="padding: 6px 8px; text-align: right; font-weight: 600;">${formatMoney(yr.balance)}</td>
                </tr>
            `).join('');

            tableRowsHTML += `
                <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8;">
                    <td style="padding: 8px; text-align: center;">รวมทั้งหมด</td>
                    <td style="padding: 8px; text-align: right;">${formatMoney(actualTotalPaid)}</td>
                    <td style="padding: 8px; text-align: right; color: #b91c1c;">${formatMoney(actualTotalInterest)}</td>
                    <td style="padding: 8px; text-align: right; color: #15803d;">${formatMoney(P)}</td>
                    <td style="padding: 8px; text-align: right;">0.00</td>
                </tr>
            `;

            breakdownHTML = `
                <div style="margin-top: 20px;">
                    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                        ตารางแจกแจงสรุปยอดผ่อนและลดหนี้รายปี (Yearly Amortization Schedule)
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                        <thead>
                            <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
                                <th style="padding: 8px; text-align: center;">ปี</th>
                                <th style="padding: 8px; text-align: right;">ยอดผ่อนทั้งปี (บาท)</th>
                                <th style="padding: 8px; text-align: right;">ดอกเบี้ยทั้งปี (บาท)</th>
                                <th style="padding: 8px; text-align: right;">เงินต้นที่ลดได้ (บาท)</th>
                                <th style="padding: 8px; text-align: right;">เงินต้นคงเหลือ (บาท)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHTML}
                        </tbody>
                    </table>
                </div>
            `;
        }

    } else if (curToolId === 'savings') {
        docTitle = 'รายงานแผนการออมเงินและดอกเบี้ยทบต้น';
        docSubtitle = 'Savings & Compound Growth Projection Report';
        const st = state.savings || {};
        const init = numberOrDefault(st.initial, 0);
        const monthly = numberOrDefault(st.monthly, 0);
        const rate = numberOrDefault(st.interestRate, 0);
        const retirementYears = Math.max(0, numberOrDefault(st.retirementAge, 0) - numberOrDefault(st.currentAge, 0));
        const years = st.mode === 'retirement' ? retirementYears : numberOrDefault(st.years, 0);
        const annualIncrease = numberOrDefault(st.annualIncrease, 0);
        const inflationRate = numberOrDefault(st.inflationRate, 0);

        let modeLabel = 'สะสมความมั่งคั่ง (Wealth Growth)';
        if (st.mode === 'retirement') modeLabel = `แผนเกษียณอายุ (ปัจจุบัน ${st.currentAge} ปี เกษียณ ${st.retirementAge} ปี)`;
        else if (st.mode === 'goal') modeLabel = `เป้าหมายเงินออม (เป้าหมาย: ${formatMoney(st.goalTarget)} บาท)`;
        else if (st.mode === 'emergency') modeLabel = `เงินสำรองฉุกเฉิน (${st.emergencyMonths} เดือน)`;

        paramsRows = [
            ['แผนการออม', modeLabel],
            ['เงินต้นเริ่มต้น', `${formatMoney(init)} บาท`],
            ['เงินออมต่อเดือน', `${formatMoney(monthly)} บาท/เดือน`],
            ['อัตราผลตอบแทนคาดหวัง', `${rate}% ต่อปี`],
            ['ระยะเวลาการออม', `${years} ปี (${Math.round(years * 12)} เดือน)`],
            ['อัตราเพิ่มเงินออมต่อปี', `${annualIncrease}% ต่อปี`],
            ['อัตราเงินเฟ้อที่คาดการณ์', `${inflationRate}% ต่อปี`]
        ];

        const scheduleData = generateSavingsSchedule(st);
        const totalBalance = scheduleData.totalBalance || 0;
        const totalPrincipal = scheduleData.totalPrincipal || 0;
        const interestEarned = scheduleData.interestEarned || 0;
        const realValue = totalBalance / Math.pow(1 + inflationRate / 100, years || 1);

        resultCards = [
            { label: 'มูลค่าเงินออมรวมในอนาคต', value: `${formatMoney(totalBalance)} บาท`, highlight: true },
            { label: 'เงินต้นสะสมที่ฝากทั้งหมด', value: `${formatMoney(totalPrincipal)} บาท` },
            { label: 'ดอกเบี้ย / ผลตอบแทนสะสม', value: `+${formatMoney(interestEarned)} บาท`, highlight: true },
            { label: 'มูลค่าที่แท้จริงหลังหักเงินเฟ้อ', value: `${formatMoney(realValue)} บาท` }
        ];

        if (scheduleData.yearlyRows && scheduleData.yearlyRows.length > 0) {
            let tableRowsHTML = scheduleData.yearlyRows.map(yr => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 6px 8px; text-align: center;">ปีที่ ${yr.year}</td>
                    <td style="padding: 6px 8px; text-align: right;">${formatMoney(yr.depositThisYear)}</td>
                    <td style="padding: 6px 8px; text-align: right; color: #15803d;">+${formatMoney(yr.interestThisYear)}</td>
                    <td style="padding: 6px 8px; text-align: right;">${formatMoney(yr.principal)}</td>
                    <td style="padding: 6px 8px; text-align: right; font-weight: 600;">${formatMoney(yr.balance)}</td>
                    <td style="padding: 6px 8px; text-align: right; color: #475569;">${formatMoney(yr.realValue)}</td>
                </tr>
            `).join('');

            tableRowsHTML += `
                <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8;">
                    <td style="padding: 8px; text-align: center;">รวมสะสม</td>
                    <td style="padding: 8px; text-align: right;">${formatMoney(totalPrincipal - init)}</td>
                    <td style="padding: 8px; text-align: right; color: #15803d;">+${formatMoney(interestEarned)}</td>
                    <td style="padding: 8px; text-align: right;">${formatMoney(totalPrincipal)}</td>
                    <td style="padding: 8px; text-align: right;">${formatMoney(totalBalance)}</td>
                    <td style="padding: 8px; text-align: right; color: #475569;">${formatMoney(realValue)}</td>
                </tr>
            `;

            breakdownHTML = `
                <div style="margin-top: 20px;">
                    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                        ตารางการเติบโตของเงินออมรายปี (Yearly Growth Breakdown)
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                        <thead>
                            <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
                                <th style="padding: 8px; text-align: center;">ปี</th>
                                <th style="padding: 8px; text-align: right;">เงินฝากในรอบปี (บาท)</th>
                                <th style="padding: 8px; text-align: right;">ดอกเบี้ยในรอบปี (บาท)</th>
                                <th style="padding: 8px; text-align: right;">เงินต้นสะสม (บาท)</th>
                                <th style="padding: 8px; text-align: right;">ยอดรวมสะสม (บาท)</th>
                                <th style="padding: 8px; text-align: right;">มูลค่าแท้จริง (บาท)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHTML}
                        </tbody>
                    </table>
                </div>
            `;
        }

    } else if (curToolId === 'vat_wht') {
        docTitle = 'ใบสรุปรายการภาษีมูลค่าเพิ่มและภาษีหัก ณ ที่จ่าย';
        docSubtitle = 'VAT & Withholding Tax Settlement Summary';
        const st = state.vat_wht || {};
        const amount = parseNumericInput(String(st.amount ?? '').replace(/,/g, ''));
        const vat = numberOrDefault(st.vatRate, 0);
        const wht = numberOrDefault(st.whtRate, 0);
        const base = Number.isFinite(amount) ? (st.mode === 'after' ? amount / (1 + vat / 100) : amount) : 0;
        const vatAmount = base * vat / 100;
        const gross = base + vatAmount;
        const whtAmount = base * wht / 100;
        const net = gross - whtAmount;

        paramsRows = [
            ['ยอดเงินที่ระบุ', `${Number.isFinite(amount) ? formatMoney(amount) : '-'} บาท`],
            ['ลักษณะยอดเงินที่ป้อน', st.mode === 'after' ? 'ยอดรวมภาษีมูลค่าเพิ่มแล้ว (Gross Incl. VAT)' : 'ยอดก่อนภาษีมูลค่าเพิ่ม (Base Excl. VAT)'],
            ['อัตราภาษีมูลค่าเพิ่ม (VAT)', `${vat}%`],
            ['อัตราภาษีเงินได้หัก ณ ที่จ่าย (WHT)', `${wht}%`]
        ];

        resultCards = [
            { label: 'ยอดเงินก่อน VAT (Base Amount)', value: `${formatMoney(base)} บาท` },
            { label: `ภาษีมูลค่าเพิ่ม (${vat}%)`, value: `${formatMoney(vatAmount)} บาท` },
            { label: 'ยอดรวมภาษีมูลค่าเพิ่ม (Gross Amount)', value: `${formatMoney(gross)} บาท` },
            { label: `ภาษีหัก ณ ที่จ่าย (${wht}%)`, value: `-${formatMoney(whtAmount)} บาท` },
            { label: 'ยอดเงินโอนสุทธิที่ต้องชำระ (Net Payable)', value: `${formatMoney(net)} บาท`, highlight: true }
        ];

        breakdownHTML = `
            <div style="margin-top: 20px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                    ตารางแจกแจงรายการหักภาษี (Tax Calculation Statement)
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px;">1. มูลค่าสินค้า/บริการก่อนภาษีมูลค่าเพิ่ม (Base Price)</td><td style="padding: 8px; text-align: right; font-weight: 600;">${formatMoney(base)} บาท</td></tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px;">2. ภาษีมูลค่าเพิ่ม VAT ${vat}%</td><td style="padding: 8px; text-align: right; font-weight: 600;">+${formatMoney(vatAmount)} บาท</td></tr>
                        <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;"><td style="padding: 8px; font-weight: 600;">3. ราคารวมภาษีมูลค่าเพิ่ม (Total Inclusive)</td><td style="padding: 8px; text-align: right; font-weight: 700;">${formatMoney(gross)} บาท</td></tr>
                        <tr style="border-bottom: 1px solid #e2e8f0; color: #b91c1c;"><td style="padding: 8px;">4. หัก: ภาษีเงินได้ ณ ที่จ่าย ${wht}% (คำนวณจากยอดก่อน VAT)</td><td style="padding: 8px; text-align: right; font-weight: 600;">-${formatMoney(whtAmount)} บาท</td></tr>
                        <tr style="background: #ecfdf5; border-top: 2px solid #059669; border-bottom: 2px solid #059669; color: #065f46;"><td style="padding: 10px 8px; font-size: 14px; font-weight: 700;">5. ยอดเงินโอนสุทธิที่ต้องชำระ (Net Amount to Pay)</td><td style="padding: 10px 8px; text-align: right; font-size: 16px; font-weight: 800;">${formatMoney(net)} บาท</td></tr>
                    </tbody>
                </table>
            </div>
        `;

    } else if (curToolId === 'salary') {
        docTitle = 'แผนการจัดสรรเงินเดือนและงบประมาณการเงิน (50/30/20)';
        docSubtitle = 'Salary Budgeting & Allocation Plan';
        const st = state.salary || {};
        const income = numberOrDefault(st.income, 0);
        const needsPct = numberOrDefault(st.needsPct, 0);
        const wantsPct = numberOrDefault(st.wantsPct, 0);
        const savingsPct = numberOrDefault(st.savingsPct, 0);
        const emergencyPct = numberOrDefault(st.emergencyPct, 0);
        const debtPct = numberOrDefault(st.debtPct, 0);

        const needs = income * needsPct / 100;
        const wants = income * wantsPct / 100;
        const savings = income * savingsPct / 100;
        const emergency = income * emergencyPct / 100;
        const debt = income * debtPct / 100;

        paramsRows = [
            ['เงินเดือนสุทธิที่ได้รับ', `${formatMoney(income)} บาท/เดือน (${formatMoney(income * 12)} บาท/ปี)`],
            ['สัดส่วนค่าใช้จ่ายจำเป็น (Needs)', `${needsPct}%`],
            ['สัดส่วนความต้องการ/ไลฟ์สไตล์ (Wants)', `${wantsPct}%`],
            ['สัดส่วนเงินออมและลงทุน (Savings)', `${savingsPct}%`],
            ['สัดส่วนสำรองฉุกเฉินเป้าหมาย', `${emergencyPct}%`],
            ['สัดส่วนชำระหนี้เพิ่มเติม', `${debtPct}%`]
        ];

        resultCards = [
            { label: 'ค่าใช้จ่ายจำเป็น (Needs 50%)', value: `${formatMoney(needs)} บาท/เดือน` },
            { label: 'ความต้องการ / ไลฟ์สไตล์ (Wants 30%)', value: `${formatMoney(wants)} บาท/เดือน` },
            { label: 'เงินออมและลงทุน (Savings 20%)', value: `${formatMoney(savings)} บาท/เดือน`, highlight: true },
            { label: 'เงินสำรองฉุกเฉินเป้าหมาย', value: `${formatMoney(emergency)} บาท/เดือน` }
        ];

        breakdownHTML = `
            <div style="margin-top: 20px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                    ตารางจำแนกการจัดสรรงบประมาณรายเดือนและรายปี (Budget Breakdown)
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
                            <th style="padding: 8px; text-align: left;">หมวดหมู่งบประมาณ</th>
                            <th style="padding: 8px; text-align: center;">สัดส่วน</th>
                            <th style="padding: 8px; text-align: right;">ยอดต่อเดือน (บาท)</th>
                            <th style="padding: 8px; text-align: right;">ยอดต่อปี (บาท)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px;">1. ค่าใช้จ่ายจำเป็น (Needs) เช่น ค่าที่พัก อาหาร ค่าเดินทาง</td><td style="padding: 8px; text-align: center;">${needsPct}%</td><td style="padding: 8px; text-align: right; font-weight: 600;">${formatMoney(needs)}</td><td style="padding: 8px; text-align: right;">${formatMoney(needs * 12)}</td></tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px;">2. ความต้องการส่วนตัว (Wants) เช่น ท่องเที่ยว ช้อปปิ้ง บันเทิง</td><td style="padding: 8px; text-align: center;">${wantsPct}%</td><td style="padding: 8px; text-align: right; font-weight: 600;">${formatMoney(wants)}</td><td style="padding: 8px; text-align: right;">${formatMoney(wants * 12)}</td></tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px;">3. เงินออมและการลงทุน (Savings & Investments)</td><td style="padding: 8px; text-align: center;">${savingsPct}%</td><td style="padding: 8px; text-align: right; font-weight: 600; color: #15803d;">${formatMoney(savings)}</td><td style="padding: 8px; text-align: right; color: #15803d;">${formatMoney(savings * 12)}</td></tr>
                        <tr style="border-bottom: 1px solid #e2e8f0; color: #2563eb;"><td style="padding: 8px;">• เป้าหมายเงินสำรองฉุกเฉิน (Emergency Fund)</td><td style="padding: 8px; text-align: center;">${emergencyPct}%</td><td style="padding: 8px; text-align: right;">${formatMoney(emergency)}</td><td style="padding: 8px; text-align: right;">${formatMoney(emergency * 12)}</td></tr>
                        <tr style="border-bottom: 1px solid #e2e8f0; color: #7c3aed;"><td style="padding: 8px;">• แผนชำระหนี้เพิ่มเติม (Debt Acceleration)</td><td style="padding: 8px; text-align: center;">${debtPct}%</td><td style="padding: 8px; text-align: right;">${formatMoney(debt)}</td><td style="padding: 8px; text-align: right;">${formatMoney(debt * 12)}</td></tr>
                        <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8;"><td style="padding: 8px;">รวมทั้งสิ้น</td><td style="padding: 8px; text-align: center;">${needsPct + wantsPct + savingsPct}%</td><td style="padding: 8px; text-align: right;">${formatMoney(income)}</td><td style="padding: 8px; text-align: right;">${formatMoney(income * 12)}</td></tr>
                    </tbody>
                </table>
            </div>
        `;

    } else if (curToolId === 'tax_personal') {
        docTitle = 'ใบสรุปการคำนวณภาษีเงินได้บุคคลธรรมดาและวางแผนลดหย่อน (ภ.ง.ด. 90/91)';
        docSubtitle = 'Personal Income Tax & Deduction Planning Statement';
        const st = state.tax_personal || {};
        const calc = (typeof calculatePersonalTax === 'function')
            ? calculatePersonalTax(st)
            : { grossIncome: 0, expenses: 0, incomeAfterExpenses: 0, personalTotal: 0, savingsTotal: 0, totalDonations: 0, totalDeductions: 0, netTaxableIncome: 0, totalTax: 0, marginalRate: 0, withholdingTax: 0, isRefund: false, refundAmount: 0, payableAmount: 0, taxByBands: [] };

        paramsRows = [
            ['รายได้รวมพึงประเมินทั้งปี', `${formatMoney(calc.grossIncome)} บาท`],
            ['หักค่าใช้จ่ายตามกฎหมาย (50% ไม่เกิน 100,000 บ.)', `-${formatMoney(calc.expenses)} บาท`],
            ['เงินได้หลังหักค่าใช้จ่าย', `${formatMoney(calc.incomeAfterExpenses)} บาท`],
            ['ลดหย่อนส่วนตัวและครอบครัว', `-${formatMoney(calc.personalTotal)} บาท`],
            ['ลดหย่อนประกัน กองทุน และดอกเบี้ยบ้าน', `-${formatMoney(calc.savingsTotal)} บาท`],
            ['ลดหย่อนเงินบริจาค', `-${formatMoney(calc.totalDonations)} บาท`],
            ['รวมค่าลดหย่อนทั้งสิ้น', `-${formatMoney(calc.totalDeductions)} บาท`],
            ['ภาษีถูกหัก ณ ที่จ่ายสะสมทั้งปี (50 ทวิ)', `${formatMoney(calc.withholdingTax)} บาท`]
        ];

        resultCards = [
            { label: 'เงินได้สุทธิพึงประเมิน (Taxable Income)', value: `${formatMoney(calc.netTaxableIncome)} บาท` },
            { label: 'ฐานภาษีสูงสุด (Marginal Rate)', value: `${calc.marginalRate}%` },
            { label: 'ภาษีคำนวณทั้งปี', value: `${formatMoney(calc.totalTax)} บาท` },
            {
                label: calc.isRefund ? '🎉 ได้รับเงินคืนภาษี (Tax Refund)' : (calc.payableAmount > 0 ? '⚠️ ต้องชำระภาษีเพิ่มเติม' : '✓ ภาษีครบถ้วนพอดี'),
                value: `${formatMoney(calc.isRefund ? calc.refundAmount : calc.payableAmount)} บาท`,
                highlight: true
            }
        ];

        const bandsHTML = (calc.taxByBands || []).map(b => `
            <tr style="border-bottom: 1px solid #e2e8f0; ${b.taxInBand > 0 ? 'font-weight: 600;' : 'color: #94a3b8;'}">
                <td style="padding: 6px 8px;">${b.range}</td>
                <td style="padding: 6px 8px; text-align: center;">${b.ratePercent}%</td>
                <td style="padding: 6px 8px; text-align: right;">${formatMoney(b.taxableInBand)}</td>
                <td style="padding: 6px 8px; text-align: right;">${formatMoney(b.taxInBand)}</td>
            </tr>
        `).join('');

        breakdownHTML = `
            <div style="margin-top: 20px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                    ตารางแจกแจงภาษีอัตราก้าวหน้า 7 ขั้น (Progressive Tax Computation)
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
                            <th style="padding: 6px 8px; text-align: left;">ช่วงเงินได้สุทธิ</th>
                            <th style="padding: 6px 8px; text-align: center;">อัตราภาษี</th>
                            <th style="padding: 6px 8px; text-align: right;">เงินได้ในขั้น (บาท)</th>
                            <th style="padding: 6px 8px; text-align: right;">ภาษีที่ต้องเสีย (บาท)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bandsHTML}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8;">
                            <td colspan="3" style="padding: 8px; text-align: right;">ภาษีรวมทั้งสิ้น:</td>
                            <td style="padding: 8px; text-align: right; color: #0284c7;">${formatMoney(calc.totalTax)} บาท</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

    } else if (curToolId === 'property_transfer') {
        docTitle = 'เอกสารประมาณการค่าธรรมเนียมและภาษีการโอนกรรมสิทธิ์อสังหาริมทรัพย์ สำนักงานที่ดิน';
        docSubtitle = 'Real Estate Transfer Fees & Land Department Taxes Estimation';
        const st = state.property_transfer || {};
        const calc = (typeof calculatePropertyTransfer === 'function')
            ? calculatePropertyTransfer(st)
            : { appraisedValue: 0, salePrice: 0, mortgageAmount: 0, holdingYears: 1, isGovMeasure: false, isSBT: true, splitMode: 'custom', transferFee: 0, mortgageFee: 0, sbtTax: 0, stampDuty: 0, withholdingTax: 0, totalLandCost: 0, buyerCost: 0, sellerCost: 0, breakdown: [] };

        paramsRows = [
            ['ราคาประเมินทุนทรัพย์กรมที่ดิน', `${formatMoney(calc.appraisedValue)} บาท`],
            ['ราคาซื้อขายจริงตามสัญญา', `${formatMoney(calc.salePrice)} บาท`],
            ['วงเงินสินเชื่อจดจำนอง', `${formatMoney(calc.mortgageAmount)} บาท`],
            ['ระยะเวลาถือครองของผู้ขาย', `${calc.holdingYears} ปี (หัก คชจ. ${calc.withholdingExpensePercent || 50}%)`],
            ['ประเภทภาษีธุรกิจเฉพาะ / อากร', calc.isSBT ? 'ภาษีธุรกิจเฉพาะ (SBT 3.3%)' : 'ค่าอากรแสตมป์ (0.5%)'],
            ['มาตรการรัฐ', calc.isGovMeasure ? 'มาตรการลดค่าโอน-จำนองเหลือ 0.01%' : 'อัตราปกติ (โอน 2%, จำนอง 1%)'],
            ['ข้อตกลงการแบ่งจ่าย', calc.splitMode === 'custom' ? 'ธรรมเนียมปฏิบัติ (โอนคนละครึ่ง ผู้ขายออกภาษี ผู้ซื้อออกจำนอง)' : calc.splitMode]
        ];

        resultCards = [
            { label: 'ยอดรวมค่าใช้จ่ายทั้งหมด ณ กรมที่ดิน', value: `${formatMoney(calc.totalLandCost)} บาท`, highlight: true },
            { label: '👤 ฝั่งผู้ซื้อต้องเตรียมชำระ', value: `${formatMoney(calc.buyerCost)} บาท` },
            { label: '🏠 ฝั่งผู้ขายต้องเตรียมชำระ', value: `${formatMoney(calc.sellerCost)} บาท` }
        ];

        const rowsHTML = (calc.breakdown || []).map(r => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px;">
                    <b>${r.name}</b>
                    <div style="font-size: 10px; color: #64748b;">ฐานคำนวณ: ${formatMoney(r.baseAmount)} บาท (${r.rateText})</div>
                </td>
                <td style="padding: 8px; text-align: right; color: #2563eb; font-weight: 600;">${formatMoney(r.buyer)}</td>
                <td style="padding: 8px; text-align: right; color: #d97706; font-weight: 600;">${formatMoney(r.seller)}</td>
                <td style="padding: 8px; text-align: right; font-weight: 700;">${formatMoney(r.total)}</td>
            </tr>
        `).join('');

        breakdownHTML = `
            <div style="margin-top: 20px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                    ตารางแจกแจงค่าธรรมเนียมและภาษีการโอนกรรมสิทธิ์
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
                            <th style="padding: 8px; text-align: left;">รายการ</th>
                            <th style="padding: 8px; text-align: right;">ผู้ซื้อจ่าย (บาท)</th>
                            <th style="padding: 8px; text-align: right;">ผู้ขายจ่าย (บาท)</th>
                            <th style="padding: 8px; text-align: right;">ยอดรวม (บาท)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f8fafc; font-weight: 800; border-top: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8; font-size: 12px;">
                            <td style="padding: 10px 8px;">รวมยอดแบ่งจ่ายสุทธิ:</td>
                            <td style="padding: 10px 8px; text-align: right; color: #2563eb;">${formatMoney(calc.buyerCost)}</td>
                            <td style="padding: 10px 8px; text-align: right; color: #d97706;">${formatMoney(calc.sellerCost)}</td>
                            <td style="padding: 10px 8px; text-align: right; color: #0284c7;">${formatMoney(calc.totalLandCost)} บาท</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

    } else if (curToolId === 'gold_thai') {
        docTitle = 'เอกสารประมาณการราคาทองคำแท่งและทองรูปพรรณ (มาตรฐานสมาคมค้าทองคำ / สคบ.)';
        docSubtitle = 'Thai Gold Price, Craft Fee & Buyback Estimation Receipt';
        const st = state.gold_thai || {};
        const calc = (typeof calculateGoldThai === 'function')
            ? calculateGoldThai(st)
            : { mode: 'buy', goldType: 'ornament', weightVal: 1, weightUnit: 'baht', bahtWeight: 1, craftFee: 800, rawGoldValue: 44500, totalBuyPrice: 45300, officialSellBackRate: 43115, sellBackValue: 43115, deductionFromSellPrice: 2185, profitLoss: 0, profitLossPercent: 0, prices: { priceBarBuy: 43900, priceBarSell: 44000, priceOrnamentBuy: 43115, priceOrnamentSell: 44500 } };

        const typeLabel = calc.goldType === 'bar' ? 'ทองคำแท่ง (96.5%)' : 'ทองรูปพรรณ (96.5%)';
        const modeLabel = calc.mode === 'buy' ? 'ซื้อทองคำหน้าร้าน' : (calc.mode === 'sell' ? 'ขายคืนทองคำ (เกณฑ์ สคบ.)' : 'จำลองผลตอบแทนการออมทอง');

        paramsRows = [
            ['รูปแบบการคำนวณ', modeLabel],
            ['ประเภททองคำ', typeLabel],
            ['น้ำหนักที่ระบุ', `${formatNum(calc.weightVal, 2)} ${calc.weightUnit === 'baht' ? 'บาททอง' : (calc.weightUnit === 'salung' ? 'สลึง' : 'กรัม')}`],
            ['น้ำหนักแปลงเป็นบาททองคำ', `${formatNum(calc.bahtWeight, 4)} บาททอง (${formatNum(calc.salungWeight, 2)} สลึง / ${formatNum(calc.totalGrams, 3)} กรัม)`],
            ['ราคาขายออกสมาคม', `${formatMoney(calc.baseBuyRate)} บาท/บาททอง`],
            ['ราคารับซื้อคืนสมาคม', `${formatMoney(calc.officialSellBackRate)} บาท/บาททอง`],
            ['ค่ากำเหน็จ', `${formatMoney(calc.craftFee)} บาท`]
        ];

        if (calc.mode === 'buy') {
            resultCards = [
                { label: '💰 ราคาซื้อสุทธิที่หน้าร้าน', value: `${formatMoney(calc.totalBuyPrice)} บาท`, highlight: true },
                { label: 'มูลค่าเนื้อทองคำ', value: `${formatMoney(calc.rawGoldValue)} บาท` },
                { label: 'ค่ากำเหน็จ', value: `${formatMoney(calc.craftFee)} บาท` }
            ];
        } else if (calc.mode === 'sell') {
            resultCards = [
                { label: '💵 ราคารับซื้อคืนขั้นต่ำ (สคบ.)', value: `${formatMoney(calc.sellBackValue)} บาท`, highlight: true },
                { label: 'เรทรับซื้อคืนสมาคม', value: `${formatMoney(calc.officialSellBackRate)} บาท/บาท` },
                { label: 'หักจากราคาซื้อประมาณ', value: `-${formatMoney(calc.deductionFromSellPrice)} บาท` }
            ];
        } else {
            resultCards = [
                { label: calc.isProfit ? '🎉 ผลกำไรจากการออมทอง' : '⚠️ ผลขาดทุนจากการออมทอง', value: `${calc.isProfit ? '+' : ''}${formatMoney(calc.profitLoss)} บาท (${formatNum(calc.profitLossPercent, 2)}%)`, highlight: true },
                { label: 'มูลค่าตลาดปัจจุบัน', value: `${formatMoney(calc.currentMarketValue)} บาท` },
                { label: 'ต้นทุนที่ลงทุนสะสม', value: `${formatMoney(calc.totalInvested)} บาท` }
            ];
        }

        breakdownHTML = `
            <div style="margin-top: 20px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                    เกณฑ์ราคากลางสมาคมค้าทองคำแห่งประเทศไทย (ความบริสุทธิ์ 96.5%)
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
                            <th style="padding: 6px 8px; text-align: left;">รายการทองคำ</th>
                            <th style="padding: 6px 8px; text-align: right;">ราคารับซื้อ (บาท)</th>
                            <th style="padding: 6px 8px; text-align: right;">ราคาขายออก (บาท)</th>
                            <th style="padding: 6px 8px; text-align: right;">ส่วนต่าง (Spread)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 6px 8px;"><b>ทองคำแท่ง (ความบริสุทธิ์ 96.5%)</b></td>
                            <td style="padding: 6px 8px; text-align: right;">${formatMoney(calc.prices.priceBarBuy)}</td>
                            <td style="padding: 6px 8px; text-align: right;">${formatMoney(calc.prices.priceBarSell)}</td>
                            <td style="padding: 6px 8px; text-align: right; color: #dc2626;">-${formatMoney(calc.prices.priceBarSell - calc.prices.priceBarBuy)}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                            <td style="padding: 6px 8px;"><b>ทองรูปพรรณ (ความบริสุทธิ์ 96.5%)</b></td>
                            <td style="padding: 6px 8px; text-align: right;">${formatMoney(calc.prices.priceOrnamentBuy)}</td>
                            <td style="padding: 6px 8px; text-align: right;">${formatMoney(calc.prices.priceOrnamentSell)}</td>
                            <td style="padding: 6px 8px; text-align: right; color: #dc2626;">-${formatMoney(calc.prices.priceOrnamentSell - calc.prices.priceOrnamentBuy)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

    } else if (curToolId === 'electricity_bill') {
        docTitle = 'เอกสารประมาณการค่าไฟฟ้าบ้านอยู่อาศัยตามอัตราก้าวหน้า กฟน. / กฟภ.';
        docSubtitle = 'Residential Electricity Tariff & Power Consumption Estimation';
        const st = state.electricity_bill || {};
        const calc = (typeof calculateElectricityBill === 'function')
            ? calculateElectricityBill(st)
            : { units: 0, ftRate: 0.3972, serviceFee: 24.62, baseEnergyCharge: 0, ftCharge: 0, preVatTotal: 0, vat7: 0, totalBill: 0, avgRatePerUnit: 0, tariffType: 'type1_2', tariffLabel: 'ประเภท 1.2', tierBreakdown: [] };

        paramsRows = [
            ['ประเภทอัตราค่าไฟฟ้า', calc.tariffLabel || (calc.tariffType === 'type1_1' ? 'ประเภท 1.1 บ้านไม่เกิน 150 หน่วย' : 'ประเภท 1.2 บ้านเกิน 150 หน่วย')],
            ['จำนวนหน่วยไฟฟ้าที่ใช้', `${formatNum(calc.units, 1)} หน่วย (kWh)`],
            ['ค่าไฟฟ้าผันแปร (Ft)', `${formatNum(calc.ftRate, 4)} บาท/หน่วย`],
            ['ค่าบริการรายเดือน', `${formatMoney(calc.serviceFee)} บาท`],
            ['อัตราภาษีมูลค่าเพิ่ม', '7.0%']
        ];

        resultCards = [
            { label: '⚡ ค่าไฟฟ้ารวมสุทธิ (Total Bill)', value: `${formatMoney(calc.totalBill)} บาท`, highlight: true },
            { label: 'ค่าไฟฟ้าฐานตามขั้นบันได', value: `${formatMoney(calc.baseEnergyCharge)} บาท` },
            { label: 'ค่า Ft รวม', value: `${formatMoney(calc.ftCharge)} บาท` },
            { label: 'ภาษีมูลค่าเพิ่ม (VAT 7%)', value: `${formatMoney(calc.vat7)} บาท` }
        ];

        const tiersHTML = (calc.tierBreakdown || []).map((t, idx) => `
            <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 6px 8px;">${t.label}</td>
                <td style="padding: 6px 8px; text-align: center;">${formatNum(t.rate, 4)}</td>
                <td style="padding: 6px 8px; text-align: right; font-weight: 600;">${formatNum(t.units, 1)}</td>
                <td style="padding: 6px 8px; text-align: right; font-weight: 600;">${formatMoney(t.cost)}</td>
            </tr>
        `).join('');

        breakdownHTML = `
            <div style="margin-top: 20px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                    ตารางแจกแจงค่าพลังงานไฟฟ้าตามขั้นบันไดอัตราก้าวหน้า (Base Energy Charge Tiers)
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
                            <th style="padding: 6px 8px; text-align: left;">ช่วงหน่วยการใช้ไฟฟ้า</th>
                            <th style="padding: 6px 8px; text-align: center;">อัตรา (บาท/หน่วย)</th>
                            <th style="padding: 6px 8px; text-align: right;">หน่วยที่ใช้จริง</th>
                            <th style="padding: 6px 8px; text-align: right;">รวมเป็นเงิน (บาท)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tiersHTML}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8;">
                            <td colspan="3" style="padding: 8px; text-align: right;">รวมค่าพลังงานไฟฟ้าฐาน:</td>
                            <td style="padding: 8px; text-align: right; color: #0284c7;">${formatMoney(calc.baseEnergyCharge)} บาท</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

    } else if (curToolId === 'car_loan') {
        docTitle = 'เอกสารประมาณการสินเชื่อเช่าซื้อรถยนต์และตารางปิดบัญชีล่วงหน้า (เกณฑ์ สคบ.)';
        docSubtitle = 'Auto Hire-Purchase Loan & Early Payoff Settlement Statement';
        const st = state.car_loan || {};
        const calc = (typeof calculateCarLoan === 'function')
            ? calculateCarLoan(st)
            : { vehicleType: 'car', condition: 'new', price: 850000, downPaymentAmount: 170000, downPaymentPercent: 20, principal: 680000, interestRate: 2.59, periodMonths: 60, years: 5, totalInterest: 88060, monthlyPaymentPreVat: 12801, isVatAdded: false, vatMonthly: 0, monthlyPayment: 12801, totalVat: 0, totalRepayment: 768060, effectiveRateApprox: 4.95, payoffMonth: 30, remainingMonths: 30, discountTierPercent: 70, discountTierText: '1/3 ถึง 2/3 ของสัญญา (ลด 70%)', unearnedInterest: 22455, interestDiscount: 15718, totalSavedByEarlyPayoff: 15718, totalPayoffAmount: 368312 };

        paramsRows = [
            ['ประเภทยานพาหนะและสภาพรถ', `${calc.vehicleType === 'motorcycle' ? 'มอเตอร์ไซค์' : 'รถยนต์'} (${calc.condition === 'used' ? 'รถมือสอง (มี VAT 7%)' : 'รถใหม่ป้ายแดง'})`],
            ['ราคารถยนต์ / ยานพาหนะ', `${formatMoney(calc.price)} บาท`],
            ['เงินดาวน์ที่ชำระ', `${formatMoney(calc.downPaymentAmount)} บาท (${formatNum(calc.downPaymentPercent, 1)}%)`],
            ['ยอดจัดเช่าซื้อ (เงินต้น)', `${formatMoney(calc.principal)} บาท`],
            ['อัตราดอกเบี้ยคงที่ (Flat Rate)', `${formatNum(calc.interestRate, 2)}% ต่อปี`],
            ['อัตราดอกเบี้ยแท้จริง (EIR ประมาณการ)', `${formatNum(calc.effectiveRateApprox, 2)}% ต่อปี`],
            ['ระยะเวลาผ่อนชำระตามสัญญา', `${calc.periodMonths} งวด (${calc.years} ปี)`],
            ['งวดที่จำลองปิดบัญชีก่อนกำหนด', `งวดที่ ${calc.payoffMonth} (คงเหลือ ${calc.remainingMonths} งวด)`]
        ];

        resultCards = [
            { label: 'ค่างวดผ่อนชำระรายเดือน', value: `${formatMoney(calc.monthlyPayment)} บาท/งวด`, highlight: true },
            { label: 'ยอดชำระเพื่อปิดบัญชีในงวดนี้', value: `${formatMoney(calc.totalPayoffAmount)} บาท` },
            { label: 'ส่วนลดดอกเบี้ยตามเกณฑ์ สคบ. ใหม่', value: `${formatMoney(calc.totalSavedByEarlyPayoff)} บาท`, highlight: true },
            { label: 'ยอดผ่อนชำระรวมตลอดสัญญา', value: `${formatMoney(calc.totalRepayment)} บาท` }
        ];

        breakdownHTML = `
            <div style="margin-top: 20px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                    สรุปโครงสร้างสินเชื่อเช่าซื้อและเกณฑ์ส่วนลดปิดบัญชี สคบ.
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
                            <th style="padding: 6px 8px; text-align: left;">รายการโครงสร้างสินเชื่อ</th>
                            <th style="padding: 6px 8px; text-align: right;">มูลค่า (บาท)</th>
                            <th style="padding: 6px 8px; text-align: left;">หมายเหตุ / เกณฑ์ที่ใช้</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 6px 8px;"><b>ยอดจัดเช่าซื้อ (เงินต้น)</b></td>
                            <td style="padding: 6px 8px; text-align: right; font-weight: 600;">${formatMoney(calc.principal)}</td>
                            <td style="padding: 6px 8px; color: #64748b;">ราคารถหักเงินดาวน์</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 6px 8px;">ดอกเบี้ยเช่าซื้อรวมทั้งสัญญา</td>
                            <td style="padding: 6px 8px; text-align: right; color: #dc2626;">+${formatMoney(calc.totalInterest)}</td>
                            <td style="padding: 6px 8px; color: #64748b;">Flat Rate ${formatNum(calc.interestRate, 2)}% × ${calc.years} ปี</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 6px 8px;">ภาษีมูลค่าเพิ่ม (VAT 7%) ตลอดสัญญา</td>
                            <td style="padding: 6px 8px; text-align: right;">${calc.isVatAdded ? `+${formatMoney(calc.totalVat)}` : 'รวมในตัวรถแล้ว'}</td>
                            <td style="padding: 6px 8px; color: #64748b;">${calc.isVatAdded ? 'รถมือสองคิด VAT 7% ในค่างวด' : 'รถใหม่ราคารวม VAT แล้ว'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                            <td style="padding: 6px 8px;"><b>ดอกเบี้ยที่ยังไม่ถึงกำหนด (ณ งวดที่ ${calc.payoffMonth})</b></td>
                            <td style="padding: 6px 8px; text-align: right;">${formatMoney(calc.unearnedInterest)}</td>
                            <td style="padding: 6px 8px; color: #64748b;">วิธีคำนวณสัดส่วน Rule of 78</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0; background: #f0fdf4;">
                            <td style="padding: 6px 8px; color: #166534;"><b>ส่วนลดดอกเบี้ยที่ได้รับจริง (${calc.discountTierPercent}%)</b></td>
                            <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #166534;">-${formatMoney(calc.interestDiscount)}</td>
                            <td style="padding: 6px 8px; color: #166534;">เกณฑ์ สคบ. ใหม่: ${calc.discountTierText}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8;">
                            <td style="padding: 8px;">ยอดเงินสุทธิที่ต้องชำระเพื่อปิดบัญชี:</td>
                            <td style="padding: 8px; text-align: right; color: #0284c7; font-size: 12px;">${formatMoney(calc.totalPayoffAmount)} บาท</td>
                            <td style="padding: 8px; color: #64748b;">ประหยัดเงินได้ ${formatMoney(calc.totalSavedByEarlyPayoff)} บาท</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

    } else if (curToolId === 'social_security') {
        docTitle = 'เอกสารประมาณการสิทธิประโยชน์เงินบำนาญและเงินชราภาพประกันสังคม';
        docSubtitle = 'Social Security Pension & Old-Age Lump Sum Statement';
        const st = state.social_security || {};
        const calc = (typeof calculateSocialSecurity === 'function')
            ? calculateSocialSecurity(st)
            : { section: 'm33', wageMonthly: 35000, cappedWage: 15000, contributionMonths: 240, yearsContributed: 20, m40Plan: 'plan2', m40ExtraSavings: 0, monthlyContribution: 750, employerContribution: 750, govtContribution: 412.5, oldAgeSavingsMonthly: 450, isPension: true, pensionRatePercent: 27.5, monthlyPension: 4125, yearlyPension: 49500, lumpSumTotal: 0, totalWorkerContributed: 180000, totalFundAccumulated: 216000 };

        paramsRows = [
            ['มาตราผู้ประกันตน', calc.section === 'm39' ? 'มาตรา 39 (ผู้ประกันตนโดยสมัครใจ)' : (calc.section === 'm40' ? `มาตรา 40 (${calc.m40Plan.toUpperCase()})` : 'มาตรา 33 (พนักงานเอกชนภาคบังคับ)')],
            ['ฐานค่าจ้างในการคำนวณ', `${formatMoney(calc.cappedWage)} บาท/เดือน (เพดานกฎหมาย)`],
            ['จำนวนเดือนที่ส่งเงินสมทบ', `${calc.contributionMonths} เดือน (${formatNum(calc.yearsContributed, 1)} ปี)`],
            ['เงินสมทบผู้ประกันตนรายเดือน', `${formatMoney(calc.monthlyContribution)} บาท/เดือน`],
            ['เงินสมทบนายจ้างร่วมสมทบ', `${formatMoney(calc.employerContribution)} บาท/เดือน`],
            ['เงินสะสมเฉพาะกองทุนชราภาพ', `${formatMoney(calc.oldAgeSavingsMonthly)} บาท/เดือน`],
            ['รวมเงินสมทบที่ผู้ประกันตนจ่ายสะสม', `${formatMoney(calc.totalWorkerContributed)} บาท`]
        ];

        if (calc.isPension) {
            resultCards = [
                { label: '💰 เงินบำนาญชราภาพรายเดือน (ตลอดชีพ)', value: `${formatMoney(calc.monthlyPension)} บาท/เดือน`, highlight: true },
                { label: 'ประมาณการเงินบำนาญรวมต่อปี', value: `${formatMoney(calc.yearlyPension)} บาท/ปี` },
                { label: 'อัตราบำนาญที่ได้รับ', value: `${formatNum(calc.pensionRatePercent, 2)}% ของค่าจ้างเฉลี่ย` },
                { label: 'รวมเงินสมทบสะสมกองทุนชราภาพ', value: `${formatMoney(calc.totalFundAccumulated)} บาท` }
            ];
        } else {
            resultCards = [
                { label: '💰 เงินบำเหน็จชราภาพ (รับก้อนเดียว)', value: `${formatMoney(calc.lumpSumTotal)} บาท`, highlight: true },
                { label: 'รวมเงินสมทบสะสมกองทุนชราภาพ', value: `${formatMoney(calc.totalFundAccumulated)} บาท` },
                { label: 'รวมเงินสมทบที่ลูกจ้างจ่ายสะสม', value: `${formatMoney(calc.totalWorkerContributed)} บาท` },
                { label: 'เงื่อนไขการรับสิทธิ์', value: 'ส่งเงินสมทบน้อยกว่า 180 เดือน' }
            ];
        }

        breakdownHTML = `
            <div style="margin-top: 20px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                    เกณฑ์สิทธิประโยชน์ชราภาพและการจัดสรรเงินสมทบ
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
                            <th style="padding: 6px 8px; text-align: left;">รายการจัดสรร</th>
                            <th style="padding: 6px 8px; text-align: right;">เงินต่อเดือน (บาท)</th>
                            <th style="padding: 6px 8px; text-align: left;">หลักเกณฑ์และสัดส่วนตามกฎหมาย</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 6px 8px;"><b>เงินสมทบผู้ประกันตน</b></td>
                            <td style="padding: 6px 8px; text-align: right; font-weight: 600;">${formatMoney(calc.monthlyContribution)}</td>
                            <td style="padding: 6px 8px; color: #64748b;">${calc.section === 'm33' ? 'หัก 5% ของค่าจ้าง (สูงสุด 750 บ.)' : (calc.section === 'm39' ? 'หัก 9% ของฐาน 4,800 บ. (432 บ.)' : 'ตามแพ็กเกจ ม.40')}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 6px 8px;">เงินสมทบนายจ้าง</td>
                            <td style="padding: 6px 8px; text-align: right;">${formatMoney(calc.employerContribution)}</td>
                            <td style="padding: 6px 8px; color: #64748b;">${calc.section === 'm33' ? 'นายจ้างสมทบเท่ากัน 5%' : 'ไม่มีนายจ้างร่วมสมทบ'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0; background: #f0fdf4;">
                            <td style="padding: 6px 8px; color: #166534;"><b>เงินสะสมเข้ากองทุนชราภาพ</b></td>
                            <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #166534;">${formatMoney(calc.oldAgeSavingsMonthly)}</td>
                            <td style="padding: 6px 8px; color: #166534;">${calc.section === 'm33' ? 'ส่วนลูกจ้าง 3% (กองทุนรวม 6% = 900 บ./ด.)' : 'เข้ากองทุนบำเหน็จชราภาพ'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 6px 8px;">ประเภทสิทธิประโยชน์ชราภาพ</td>
                            <td style="padding: 6px 8px; text-align: right; font-weight: 600; color: #0284c7;">${calc.isPension ? 'บำนาญรายเดือน' : 'บำเหน็จก้อนเดียว'}</td>
                            <td style="padding: 6px 8px; color: #64748b;">${calc.isPension ? `ครบ 180 งวด (20% + 1.5% ต่อ 12 งวดที่เกิน = ${calc.pensionRatePercent}%)` : 'ส่งไม่ครบ 180 งวด รับเงินก้อนพร้อมผลประโยชน์ตอบแทน'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

    } else if (curToolId === 'labor_severance') {
        docTitle = 'หนังสือแสดงรายการคำนวณเงินชดเชยการเลิกจ้างตามกฎหมายแรงงาน';
        docSubtitle = 'Labor Protection Act Severance & Notice Pay Calculation Statement';
        const st = state.labor_severance || {};
        const calc = (typeof calculateLaborSeverance === 'function')
            ? calculateLaborSeverance(st)
            : { salaryMonthly: 35000, dailyWage: 1166.67, serviceYears: 3, serviceMonths: 6, serviceDays: 0, severanceDays: 180, severancePay: 210000, noticeGiven: 'no', noticeMonths: 1, noticePay: 35000, unusedLeaveDays: 5, leavePay: 5833.33, totalSeverancePackage: 250833.33, taxExemptAmount: 210000, taxableSeverance: 40833.33, tierLabel: 'อายุงาน 3 ปี แต่ไม่ถึง 6 ปี' };

        paramsRows = [
            ['ค่าจ้างรายเดือนฐานคำนวณ', `${formatMoney(calc.salaryMonthly)} บาท/เดือน (${formatMoney(calc.dailyWage)} บาท/วัน)`],
            ['อายุงานสะสม', `${calc.serviceYears} ปี ${calc.serviceMonths} เดือน ${calc.serviceDays} วัน`],
            ['การบอกกล่าวล่วงหน้า (ม.17)', calc.noticeGiven === 'yes' ? 'บอกกล่าวถูกต้องตามงวดค่าจ้าง' : `เลิกจ้างทันที (จ่ายสินจ้างแทน ${calc.noticeMonths} เดือน)`],
            ['วันหยุดพักผ่อนประจำปีคงเหลือ', `${calc.unusedLeaveDays} วัน (สะสมตามสิทธิ์)`],
            ['เกณฑ์การชดเชย (ม.118)', calc.tierLabel]
        ];

        resultCards = [
            { label: '💰 รวมเงินชดเชยสุทธิที่ได้รับ', value: `${formatMoney(calc.totalSeverancePackage)} บาท`, highlight: true },
            { label: 'เงินชดเชยเลิกจ้าง (ม.118)', value: `${formatMoney(calc.severancePay)} บาท (${calc.severanceDays} วัน)` },
            { label: 'ค่าบอกกล่าวล่วงหน้า (ค่าตกใจ)', value: `${formatMoney(calc.noticePay)} บาท` },
            { label: 'สิทธิยกเว้นภาษีเงินได้', value: `${formatMoney(calc.taxExemptAmount)} บาท (สูงสุด 3 แสน)` }
        ];

        breakdownHTML = `
            <div style="margin-top: 20px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                    รายละเอียดสิทธิประโยชน์และภาระภาษีตามกฎหมายแรงงาน
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
                            <th style="padding: 6px 8px; text-align: left;">รายการชดเชยตามกฎหมาย</th>
                            <th style="padding: 6px 8px; text-align: right;">จำนวนเงิน (บาท)</th>
                            <th style="padding: 6px 8px; text-align: left;">บทบัญญัติกฎหมาย / สิทธิภาษี</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 6px 8px;"><b>เงินชดเชยเลิกจ้างตามอายุงาน</b></td>
                            <td style="padding: 6px 8px; text-align: right; font-weight: 600;">${formatMoney(calc.severancePay)}</td>
                            <td style="padding: 6px 8px; color: #64748b;">พ.ร.บ. คุ้มครองแรงงาน ม.118 (${calc.severanceDays} วัน)</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 6px 8px;">สินจ้างแทนการบอกกล่าวล่วงหน้า (ค่าตกใจ)</td>
                            <td style="padding: 6px 8px; text-align: right;">${formatMoney(calc.noticePay)}</td>
                            <td style="padding: 6px 8px; color: #64748b;">ม.17 วรรคสอง (${calc.noticeMonths} เดือน)</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 6px 8px;">ค่าจ้างวันหยุดพักผ่อนประจำปีสะสมคงเหลือ</td>
                            <td style="padding: 6px 8px; text-align: right;">${formatMoney(calc.leavePay)}</td>
                            <td style="padding: 6px 8px; color: #64748b;">ม.67 (${calc.unusedLeaveDays} วัน × ${formatMoney(calc.dailyWage)} บ.)</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0; background: #f0fdf4;">
                            <td style="padding: 6px 8px; color: #166534;"><b>ส่วนที่ได้รับยกเว้นภาษีเงินได้บุคคลธรรมดา</b></td>
                            <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #166534;">${formatMoney(calc.taxExemptAmount)}</td>
                            <td style="padding: 6px 8px; color: #166534;">กฎกระทรวง ฉบับที่ 126 (ไม่เกินค่าจ้าง 300 วัน และไม่เกิน 300,000 บ.)</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0; background: #fff7ed;">
                            <td style="padding: 6px 8px; color: #c2410c;">ส่วนที่ต้องนำไปคำนวณภาษีเงินได้</td>
                            <td style="padding: 6px 8px; text-align: right; font-weight: 600; color: #c2410c;">${formatMoney(calc.taxableSeverance)}</td>
                            <td style="padding: 6px 8px; color: #c2410c;">เงินชดเชยส่วนเกิน 3 แสน + ค่าตกใจ + พักร้อน</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8;">
                            <td style="padding: 8px;">รวมยอดเงินที่นายจ้างต้องจ่ายให้ลูกจ้างทั้งสิ้น:</td>
                            <td style="padding: 8px; text-align: right; color: #0284c7; font-size: 12px;">${formatMoney(calc.totalSeverancePackage)} บาท</td>
                            <td style="padding: 8px; color: #64748b;">ต้องจ่าย ณ วันเลิกจ้างหรือภายใน 3 วัน</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

    } else if (curToolId === 'legal_interest') {
        docTitle = 'หนังสือแสดงรายการคำนวณดอกเบี้ยผิดนัดชำระหนี้ตามประมวลกฎหมายแพ่งและพาณิชย์';
        docSubtitle = 'Civil & Commercial Code Default Legal Interest Statement (Section 224 / 7)';
        const st = state.legal_interest || {};
        const calc = (typeof calculateLegalInterest === 'function')
            ? calculateLegalInterest(st)
            : { principal: 100000, interestRate: 5.0, overdueDays: 60, dailyInterest: 13.70, totalInterest: 821.92, totalPayable: 100821.92, ratePreset: 'default_5', ratePresetLabel: 'อัตราดอกเบี้ยผิดนัดตามกฎหมายใหม่ (5.00% ต่อปี)' };

        paramsRows = [
            ['เงินต้นค้างชำระ (Principal)', `${formatMoney(calc.principal)} บาท`],
            ['อัตราดอกเบี้ยผิดนัดตามกฎหมาย', `${formatNum(calc.interestRate, 2)}% ต่อปี`],
            ['บทบัญญัติและฐานคิดอัตราดอกเบี้ย', calc.ratePresetLabel || 'ป.พ.พ. ม.224'],
            ['วิธีคำนวณระยะเวลาผิดนัด', calc.calcMode === 'dates' ? `นับตามช่วงวันที่ (${calc.startDate} ถึง ${calc.endDate})` : 'ระบุจำนวนวันผิดนัดโดยตรง'],
            ['จำนวนวันผิดนัดชำระหนี้', `${calc.overdueDays} วัน (เกณฑ์ฐาน 365 วัน/ปี)`]
        ];

        resultCards = [
            { label: '💰 ยอดหนี้รวมทั้งสิ้นที่ต้องชำระ', value: `${formatMoney(calc.totalPayable)} บาท`, highlight: true },
            { label: 'เงินต้นค้างชำระ', value: `${formatMoney(calc.principal)} บาท` },
            { label: 'ดอกเบี้ยผิดนัดชำระหนี้สะสม', value: `+${formatMoney(calc.totalInterest)} บาท` },
            { label: 'ดอกเบี้ยผิดนัดเฉลี่ยต่อวัน', value: `+${formatMoney(calc.dailyInterest)} บาท/วัน` }
        ];

        breakdownHTML = `
            <div style="margin-top: 20px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                    สรุปภาระหนี้และข้อกำหนดทางกฎหมาย (ป.พ.พ.)
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
                            <th style="padding: 6px 8px; text-align: left;">รายการโครงสร้างหนี้</th>
                            <th style="padding: 6px 8px; text-align: right;">จำนวนเงิน (บาท)</th>
                            <th style="padding: 6px 8px; text-align: left;">ข้อกฎหมายและเกณฑ์การบังคับใช้</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 6px 8px;"><b>เงินต้นค้างชำระ (เงินหนี้เดิม)</b></td>
                            <td style="padding: 6px 8px; text-align: right; font-weight: 600;">${formatMoney(calc.principal)}</td>
                            <td style="padding: 6px 8px; color: #64748b;">เฉพาะงวดที่ผิดนัดชำระแล้วจริง</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0; background: #fff1f2;">
                            <td style="padding: 6px 8px; color: #be123c;"><b>ดอกเบี้ยผิดนัดชำระ (${calc.overdueDays} วัน)</b></td>
                            <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #be123c;">+${formatMoney(calc.totalInterest)}</td>
                            <td style="padding: 6px 8px; color: #be123c;">คำนวณตาม ป.พ.พ. ม.224 อัตรา ${formatNum(calc.interestRate, 2)}% ต่อปี</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                            <td style="padding: 6px 8px;">ดอกเบี้ยผิดนัดเฉลี่ยต่อวัน</td>
                            <td style="padding: 6px 8px; text-align: right;">+${formatMoney(calc.dailyInterest)}/วัน</td>
                            <td style="padding: 6px 8px; color: #64748b;">เงินต้น × อัตราดอกเบี้ย ÷ 365 วัน</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 6px 8px;">ข้อห้ามตาม ป.พ.พ. ม.224/1</td>
                            <td style="padding: 6px 8px; text-align: right; color: #166534;">มีผลบังคับใช้</td>
                            <td style="padding: 6px 8px; color: #166534;">ห้ามคิดดอกเบี้ยผิดนัดจากเงินงวดในอนาคตที่ยังไม่ถึงกำหนดชำระ</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8;">
                            <td style="padding: 8px;">ยอดหนี้รวมทั้งสิ้นที่ลูกหนี้ต้องชำระ:</td>
                            <td style="padding: 8px; text-align: right; color: #e11d48; font-size: 12px;">${formatMoney(calc.totalPayable)} บาท</td>
                            <td style="padding: 8px; color: #64748b;">ยอดหนี้ ณ วันที่ระบุในเอกสารนี้</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

    } else {
        // Generic Fallback for other calculators
        const summary = (typeof getToolSummaryText === 'function') ? getToolSummaryText(curToolId) : '';
        const lines = summary.split('\n').map(l => l.trim()).filter(Boolean);
        const bullets = lines.filter(l => l.startsWith('•')).map(l => l.replace(/^•\s*/, ''));
        const highlight = lines.find(l => !l.startsWith('•') && !l.startsWith('---') && !l.includes('Multitools')) || lines[0] || 'ผลลัพธ์การคำนวณ';

        paramsRows = [
            ['เครื่องมือคำนวณ', toolMeta.menuTitle || toolMeta.headerTitle],
            ['หมวดหมู่', toolMeta.group || 'การคำนวณทั่วไป']
        ];

        resultCards = [
            { label: 'ผลการคำนวณหลัก', value: highlight, highlight: true }
        ];

        if (bullets.length > 0) {
            breakdownHTML = `
                <div style="margin-top: 20px;">
                    <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                        รายละเอียดผลลัพธ์ (Calculation Details)
                    </h3>
                    <ul style="font-size: 12px; line-height: 1.8; color: #334155; padding-left: 20px;">
                        ${bullets.map(b => `<li>${b}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    const paramsTableHTML = `
        <div style="margin-bottom: 18px;">
            <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                ข้อมูลและเงื่อนไขการคำนวณ (Parameters & Inputs)
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <tbody>
                    ${paramsRows.map(([label, val], idx) => `
                        <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                            <td style="padding: 6px 10px; color: #475569; width: 40%; font-weight: 500;">${label}</td>
                            <td style="padding: 6px 10px; color: #0f172a; font-weight: 600; text-align: right;">${val}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    const resultsBoxesHTML = `
        <div style="margin-bottom: 18px;">
            <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
                สรุปผลการคำนวณ (Calculation Results)
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                ${resultCards.map(c => `
                    <div style="padding: 10px 12px; border-radius: 6px; border: 1px solid ${c.highlight ? '#10b981' : '#cbd5e1'}; background: ${c.highlight ? '#ecfdf5' : '#f8fafc'};">
                        <div style="font-size: 11px; color: ${c.highlight ? '#065f46' : '#64748b'}; font-weight: 600;">${c.label}</div>
                        <div style="font-size: 15px; font-weight: 800; color: ${c.highlight ? '#047857' : '#0f172a'}; margin-top: 4px;">${c.value}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Sarabun', 'Noto Sans Thai', sans-serif; color: #1e293b; line-height: 1.5; padding: 12px 16px; max-width: 800px; margin: 0 auto; box-sizing: border-box;">
            <!-- Top Branding & Doc Meta Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="display: inline-block; width: 26px; height: 26px; background: #0f172a; color: #fff; font-weight: 800; border-radius: 5px; text-align: center; line-height: 26px; font-size: 14px;">M</span>
                        <span style="font-size: 18px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">MULTITOOLS AIO</span>
                    </div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">เครื่องมือคำนวณและวางแผนทางการเงินครบวงจร (Financial & Utility Toolkit)</div>
                </div>
                <div style="text-align: right; font-size: 11px; color: #475569;">
                    <div style="font-weight: 700; color: #0f172a; font-size: 12px;">เอกสารสรุปผลการคำนวณทางการ</div>
                    <div>รหัสเอกสาร: <span style="font-family: monospace; font-weight: 600;">${refCode}</span></div>
                    <div>วันที่ออกเอกสาร: ${dateStr}</div>
                </div>
            </div>

            <!-- Title Banner -->
            <div style="text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 16px;">
                <h1 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${docTitle}</h1>
                <div style="font-size: 11px; color: #64748b; margin-top: 3px;">${docSubtitle}</div>
            </div>

            <!-- Section 1: Parameters -->
            ${paramsTableHTML}

            <!-- Section 2: Results -->
            ${resultsBoxesHTML}

            <!-- Section 3: Breakdown (if any) -->
            ${breakdownHTML}

            <!-- Footer & Disclaimer & Signature -->
            <div style="margin-top: 24px; padding-top: 14px; border-top: 1px dashed #cbd5e1; font-size: 10.5px; color: #64748b;" class="print-keep-together">
                <div style="margin-bottom: 20px; line-height: 1.6;">
                    <b>หมายเหตุ:</b> ข้อมูลและผลลัพธ์ในเอกสารนี้จัดทำขึ้นโดยโปรแกรม Multitools AIO เพื่อใช้เป็นข้อมูลเบื้องต้นในการวางแผนและตัดสินใจเท่านั้น มิใช่หนังสือรับรองทางการเงินหรือข้อเสนอสัญญาอย่างเป็นทางการจากสถาบันการเงินหรือหน่วยงานภาครัฐ
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 8px;">
                    <div>
                        <div>ผู้จัดทำเอกสาร: ...........................................................</div>
                        <div style="margin-top: 4px; font-size: 10px; color: #94a3b8;">ระบบคำนวณอัตโนมัติ Multitools Web Application</div>
                    </div>
                    <div style="text-align: right;">
                        <div>ลายมือชื่อผู้ตรวจสอบ / ผู้อนุมัติ: ...........................................................</div>
                        <div style="margin-top: 4px; font-size: 10px; color: #94a3b8;">วันที่: ........ / ........ / ................</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}


(function(root) {
    const exportsObj = {
        generateLoanSchedule,
        aggregateLoanScheduleByYear,
        rowsToCSV,
        buildLoanAmortizationCSV,
        generateSavingsSchedule,
        buildSavingsScheduleCSV,
        getCSVFilename,
        downloadCSV,
        triggerButtonFeedback,
        formatThaiFormalDate,
        generateFormalPrintHTML
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
