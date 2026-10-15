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
