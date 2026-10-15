// ==============================================================
// Multitools Calculator - Thai Auto Hire-Purchase & Social Security Tools
// (car_loan, social_security)
// ==============================================================

/* -----------------------------------------------------------
 * PURE ENGINE: คำนวณสินเชื่อเช่าซื้อรถยนต์ & มอเตอร์ไซค์ (Car Hire Purchase)
 * ----------------------------------------------------------- */
function calculateCarLoan(params) {
    const p = params || {};
    const vehicleType = p.vehicleType || 'car'; // 'car' | 'motorcycle'
    const condition = p.condition || 'new'; // 'new' (รถใหม่) | 'used' (รถมือสอง มี VAT 7%)
    const price = Math.max(0, numberOrDefault(p.price, 850000));
    const downPaymentType = p.downPaymentType || 'percent'; // 'percent' | 'amount'
    const downVal = Math.max(0, numberOrDefault(p.downPaymentValue, 20));
    const interestRate = Math.max(0, numberOrDefault(p.interestRate, condition === 'used' ? 4.5 : 2.59));
    const periodMonths = Math.max(1, integerOrDefault(p.periodMonths, 60));
    const payoffMonth = Math.max(1, Math.min(periodMonths, integerOrDefault(p.payoffMonth, Math.round(periodMonths / 2))));

    // 1. คำนวณเงินดาวน์
    let downPaymentAmount = 0;
    let downPaymentPercent = 0;
    if (downPaymentType === 'percent') {
        downPaymentPercent = Math.min(100, downVal);
        downPaymentAmount = price * (downPaymentPercent / 100);
    } else {
        downPaymentAmount = Math.min(price, downVal);
        downPaymentPercent = price > 0 ? (downPaymentAmount / price) * 100 : 0;
    }

    // 2. ยอดจัดเช่าซื้อ (Principal)
    const principal = Math.max(0, price - downPaymentAmount);
    const years = periodMonths / 12;

    // 3. ดอกเบี้ยคงที่ตลอดสัญญา (Flat Rate)
    const totalInterest = principal * (interestRate / 100) * years;
    const totalPayablePreVat = principal + totalInterest;
    const monthlyPaymentPreVat = periodMonths > 0 ? (totalPayablePreVat / periodMonths) : 0;

    // 4. ภาษีมูลค่าเพิ่ม (VAT 7%)
    // รถใหม่: ราคารถรวม VAT 7% อยู่แล้ว ค่างวดไม่ต้องบวก VAT เพิ่ม
    // รถมือสอง: กฎหมายกำหนดให้คิด VAT 7% เพิ่มในค่างวดเช่าซื้อทุกงวด
    const isVatAdded = condition === 'used';
    const vatMonthly = isVatAdded ? (monthlyPaymentPreVat * 0.07) : 0;
    const monthlyPayment = monthlyPaymentPreVat + vatMonthly;
    const totalVat = vatMonthly * periodMonths;
    const totalRepayment = monthlyPayment * periodMonths;
    const totalCostOfCar = downPaymentAmount + totalRepayment;

    // 5. ประมาณการอัตราดอกเบี้ยที่แท้จริงแบบลดต้นลดดอก (Effective Interest Rate - EIR)
    // สูตรประมาณการตามเกณฑ์ ธปท./สคบ. EIR ≈ Flat Rate * (2 * n) / (n + 1)
    const effectiveRateApprox = periodMonths > 0 ? (interestRate * (2 * periodMonths) / (periodMonths + 1)) : 0;

    // 6. การคำนวณส่วนลดปิดบัญชีก่อนกำหนดตามประกาศ สคบ. ใหม่ (มีผล 10 ม.ค. 2566)
    // เกณฑ์ส่วนลดดอกเบี้ยที่ยังไม่ถึงกำหนด (Unearned Interest Discount):
    // - ผ่อนชำระมาแล้ว < 1/3 ของสัญญา: ได้รับส่วนลดดอกเบี้ย 100%
    // - ผ่อนชำระมาแล้ว 1/3 ถึง 2/3 ของสัญญา: ได้รับส่วนลดดอกเบี้ย 70%
    // - ผ่อนชำระมาแล้ว > 2/3 ของสัญญา: ได้รับส่วนลดดอกเบี้ย 60%
    const oneThirdMonths = Math.ceil(periodMonths / 3);
    const twoThirdMonths = Math.floor((periodMonths * 2) / 3);

    let discountTierPercent = 60;
    let discountTierText = 'เกิน 2/3 ของสัญญา (ลด 60%)';
    if (payoffMonth < oneThirdMonths) {
        discountTierPercent = 100;
        discountTierText = 'ไม่เกิน 1/3 ของสัญญา (ลด 100%)';
    } else if (payoffMonth <= twoThirdMonths) {
        discountTierPercent = 70;
        discountTierText = '1/3 ถึง 2/3 ของสัญญา (ลด 70%)';
    }

    // คำนวณดอกเบี้ยที่ยังไม่ถึงกำหนดตามวิธี Rule of 78 (สัดส่วนลดต้นลดดอกตามเกณฑ์ สคบ.)
    // Sum of digits: S = n * (n + 1) / 2
    // Remaining sum: R = (n - m) * (n - m + 1) / 2
    const remainingMonths = Math.max(0, periodMonths - payoffMonth);
    const sumTotalDigits = (periodMonths * (periodMonths + 1)) / 2;
    const sumRemainingDigits = (remainingMonths * (remainingMonths + 1)) / 2;
    const unearnedInterestRatio = sumTotalDigits > 0 ? (sumRemainingDigits / sumTotalDigits) : 0;
    const unearnedInterest = totalInterest * unearnedInterestRatio;

    // ส่วนลดดอกเบี้ยที่ลูกค้าจะได้รับจริง
    const interestDiscount = unearnedInterest * (discountTierPercent / 100);

    // ยอดเงินที่ต้องเตรียมชำระเพื่อปิดบัญชีในงวดนั้น
    // = ค่างวดคงเหลือตามสัญญา - ส่วนลดดอกเบี้ย
    const remainingScheduledPaymentsPreVat = monthlyPaymentPreVat * remainingMonths;
    const payoffAmountPreVat = Math.max(0, remainingScheduledPaymentsPreVat - interestDiscount);
    const payoffVat = isVatAdded ? (payoffAmountPreVat * 0.07) : 0;
    const totalPayoffAmount = payoffAmountPreVat + payoffVat;
    const totalSavedByEarlyPayoff = isVatAdded ? (interestDiscount * 1.07) : interestDiscount;

    return {
        vehicleType,
        condition,
        price,
        downPaymentType,
        downPaymentValue: downVal,
        downPaymentPercent,
        downPaymentAmount,
        principal,
        interestRate,
        periodMonths,
        years,
        totalInterest,
        monthlyPaymentPreVat,
        isVatAdded,
        vatMonthly,
        monthlyPayment,
        totalVat,
        totalRepayment,
        totalCostOfCar,
        effectiveRateApprox,
        // Early Payoff
        payoffMonth,
        remainingMonths,
        oneThirdMonths,
        twoThirdMonths,
        discountTierPercent,
        discountTierText,
        unearnedInterest,
        interestDiscount,
        totalSavedByEarlyPayoff,
        totalPayoffAmount
    };
}

/* -----------------------------------------------------------
 * PURE ENGINE: ประกันสังคม & เงินบำนาญชราภาพ (Social Security Pension & Lump Sum)
 * ----------------------------------------------------------- */
function calculateSocialSecurity(params) {
    const p = params || {};
    const section = p.section || 'm33'; // 'm33' (มาตรา 33) | 'm39' (มาตรา 39) | 'm40' (มาตรา 40)
    const wageMonthly = Math.max(0, numberOrDefault(p.wageMonthly, 35000));
    const contributionMonths = Math.max(1, integerOrDefault(p.contributionMonths, 240)); // เช่น 20 ปี = 240 เดือน
    const m40Plan = p.m40Plan || 'plan2'; // 'plan1' (70฿) | 'plan2' (100฿) | 'plan3' (300฿)
    const m40ExtraSavings = Math.max(0, numberOrDefault(p.m40ExtraSavings, 0)); // เงินออมเพิ่ม ม.40 สูงสุด 1,000 บ./ด.

    let cappedWage = 0;
    let monthlyContribution = 0;
    let employerContribution = 0;
    let govtContribution = 0;
    let oldAgeSavingsMonthly = 0; // เงินเข้ากองทุนชราภาพเฉพาะส่วน
    let isPension = false;
    let pensionRatePercent = 0;
    let monthlyPension = 0;
    let lumpSumTotal = 0;
    let totalWorkerContributed = 0;
    let totalFundAccumulated = 0;

    const yearsContributed = contributionMonths / 12;

    if (section === 'm33') {
        // มาตรา 33: เพดานค่าจ้างขั้นต่ำ 1,650 บาท - สูงสุด 15,000 บาท
        cappedWage = Math.min(15000, Math.max(1650, wageMonthly));
        monthlyContribution = cappedWage * 0.05; // 5% สูงสุด 750 บ.
        employerContribution = monthlyContribution; // นายจ้างสมทบเท่ากัน 5%
        govtContribution = cappedWage * 0.0275; // รัฐบาลร่วมสมทบ 2.75%

        // เงินสมทบเข้ากองทุนชราภาพ 3% (ลูกจ้าง 3% + นายจ้าง 3% = 6% หรือสูงสุด 900 บ./ด.)
        oldAgeSavingsMonthly = cappedWage * 0.03;

        totalWorkerContributed = monthlyContribution * contributionMonths;
        totalFundAccumulated = (oldAgeSavingsMonthly * 2) * contributionMonths; // ลูกจ้าง + นายจ้าง

        // บำนาญชราภาพ (จ่ายครบ 180 เดือนขึ้นไป):
        // 180 เดือนแรกได้ 20% + เพิ่ม 1.5% ต่อทุก 12 เดือนที่เกิน 180 เดือน
        if (contributionMonths >= 180) {
            isPension = true;
            const extraYears = Math.floor((contributionMonths - 180) / 12);
            pensionRatePercent = 20 + (extraYears * 1.5);
            monthlyPension = cappedWage * (pensionRatePercent / 100);
        } else {
            // บำเหน็จชราภาพ (จ่ายไม่ครบ 180 เดือน):
            isPension = false;
            if (contributionMonths < 12) {
                // < 12 เดือน: ได้เฉพาะเงินที่ผู้ประกันตนสมทบเข้ากองทุนชราภาพ (3%)
                lumpSumTotal = oldAgeSavingsMonthly * contributionMonths;
            } else {
                // 12-179 เดือน: ได้เงินลูกจ้าง (3%) + นายจ้าง (3%) + ดอกผลประมาณการ (สมมติเฉลี่ย 2.5% ต่อปี)
                const baseLump = (oldAgeSavingsMonthly * 2) * contributionMonths;
                const estimatedInterest = baseLump * 0.15; // ประมาณการดอกผลสะสม
                lumpSumTotal = baseLump + estimatedInterest;
            }
        }

    } else if (section === 'm39') {
        // มาตรา 39: ฐานค่าจ้างคงที่ 4,800 บาทตามกฎหมาย
        cappedWage = 4800;
        monthlyContribution = 432; // 9% ของ 4,800 บาท
        employerContribution = 0; // ไม่มีนายจ้าง
        govtContribution = 4800 * 0.0325; // รัฐบาลร่วมสมทบ 3.25%

        oldAgeSavingsMonthly = 4800 * 0.06; // 6% เข้าชราภาพ (288 บ./ด.)
        totalWorkerContributed = monthlyContribution * contributionMonths;
        totalFundAccumulated = oldAgeSavingsMonthly * contributionMonths;

        if (contributionMonths >= 180) {
            isPension = true;
            const extraYears = Math.floor((contributionMonths - 180) / 12);
            pensionRatePercent = 20 + (extraYears * 1.5);
            monthlyPension = cappedWage * (pensionRatePercent / 100);
        } else {
            isPension = false;
            lumpSumTotal = oldAgeSavingsMonthly * contributionMonths * (contributionMonths >= 12 ? 1.15 : 1.0);
        }

    } else {
        // มาตรา 40: แรงงานนอกระบบ / ฟรีแลนซ์
        let planCost = 70;
        let planSavings = 0;
        if (m40Plan === 'plan2') {
            planCost = 100;
            planSavings = 50;
        } else if (m40Plan === 'plan3') {
            planCost = 300;
            planSavings = 150;
        }
        const extra = Math.min(1000, m40ExtraSavings);
        const monthlyTotalSavings = planSavings + extra;

        monthlyContribution = planCost + extra;
        employerContribution = 0;
        govtContribution = planSavings > 0 ? (planSavings * 0.5) : 0; // รัฐช่วยออมตามเกณฑ์
        oldAgeSavingsMonthly = monthlyTotalSavings;

        totalWorkerContributed = monthlyContribution * contributionMonths;
        isPension = false; // ม.40 รับเป็นบำเหน็จเงินก้อนเมื่ออายุ 60 ปี
        const baseLump = monthlyTotalSavings * contributionMonths;
        const estimatedInterest = baseLump * 0.10; // ดอกผลสะสม
        lumpSumTotal = baseLump + estimatedInterest;
    }

    return {
        section,
        wageMonthly,
        cappedWage,
        contributionMonths,
        yearsContributed,
        m40Plan,
        m40ExtraSavings,
        monthlyContribution,
        employerContribution,
        govtContribution,
        oldAgeSavingsMonthly,
        isPension,
        pensionRatePercent,
        monthlyPension,
        yearlyPension: monthlyPension * 12,
        lumpSumTotal,
        totalWorkerContributed,
        totalFundAccumulated
    };
}

/* -----------------------------------------------------------
 * UI RENDERER: สินเชื่อเช่าซื้อรถยนต์ & มอเตอร์ไซค์ (car_loan)
 * ----------------------------------------------------------- */
function renderCarLoanTool(container) {
    if (!container) return;
    const st = appState.car_loan = appState.car_loan || {
        vehicleType: 'car', // 'car' | 'motorcycle'
        condition: 'new', // 'new' | 'used'
        price: '850000',
        downPaymentType: 'percent', // 'percent' | 'amount'
        downPaymentValue: '20',
        interestRate: '2.59',
        periodMonths: '60',
        payoffMonth: '30'
    };

    const calc = calculateCarLoan(st);

    container.innerHTML = `
        <div class="finance-thai-tool flex flex-col gap-3 p-1">
            <!-- Vehicle Type & Condition Tabs -->
            <div class="flex flex-col gap-2">
                <div class="segment-group grid-cols-2 balanced-segment-modes" role="group" aria-label="ประเภทยานพาหนะ">
                    <button type="button" aria-pressed="${st.vehicleType === 'car'}" class="segment-btn ${st.vehicleType === 'car' ? 'active' : ''}" data-vehicle="car">รถยนต์</button>
                    <button type="button" aria-pressed="${st.vehicleType === 'motorcycle'}" class="segment-btn ${st.vehicleType === 'motorcycle' ? 'active' : ''}" data-vehicle="motorcycle">มอเตอร์ไซค์</button>
                </div>
                <div class="segment-group grid-cols-2 balanced-segment-modes" role="group" aria-label="สภาพรถ">
                    <button type="button" aria-pressed="${st.condition === 'new'}" class="segment-btn ${st.condition === 'new' ? 'active' : ''}" data-condition="new">รถใหม่</button>
                    <button type="button" aria-pressed="${st.condition === 'used'}" class="segment-btn ${st.condition === 'used' ? 'active' : ''}" data-condition="used">รถมือสอง (VAT 7%)</button>
                </div>
            </div>

            <!-- Main Input Form -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)]">
                    ข้อมูลราคารถและเงินดาวน์
                </div>

                <div>
                    <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">ราคารถยนต์ / ยานพาหนะ (บาท)</label>
                    <input id="carPriceInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.price))}" placeholder="เช่น 850,000" class="airbnb-input w-full text-base font-semibold">
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <div class="flex flex-wrap justify-between items-center gap-1 mb-1">
                            <label class="text-xs font-semibold text-[var(--app-muted)]">เงินดาวน์</label>
                            <div class="flex gap-1 text-[11px]">
                                <button type="button" id="btnDownPct" class="tool-chip-btn" aria-pressed="${st.downPaymentType === 'percent'}">%</button>
                                <button type="button" id="btnDownAmt" class="tool-chip-btn" aria-pressed="${st.downPaymentType === 'amount'}">บาท</button>
                            </div>
                        </div>
                        <input id="carDownValInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.downPaymentValue))}" placeholder="${st.downPaymentType === 'percent' ? 'เช่น 15 หรือ 20' : 'เช่น 150,000'}" class="airbnb-input w-full">
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">ยอดเงินดาวน์คำนวณได้</label>
                        <div class="themed-subcard p-3 w-full font-semibold text-[var(--app-ink)] flex items-center">
                            ${formatMoney(calc.downPaymentAmount)} บาท (${formatNum(calc.downPaymentPercent, 1)}%)
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">อัตราดอกเบี้ยต่อปี Flat Rate (%)</label>
                        <input id="carInterestRateInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.interestRate))}" placeholder="เช่น 2.59 หรือ 4.5" class="airbnb-input w-full">
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">ระยะเวลาผ่อนชำระ (เดือน)</label>
                        <select id="carPeriodSelect" class="airbnb-input w-full">
                            <option value="24" ${st.periodMonths === '24' ? 'selected' : ''}>24 เดือน (2 ปี)</option>
                            <option value="36" ${st.periodMonths === '36' ? 'selected' : ''}>36 เดือน (3 ปี)</option>
                            <option value="48" ${st.periodMonths === '48' ? 'selected' : ''}>48 เดือน (4 ปี)</option>
                            <option value="60" ${st.periodMonths === '60' ? 'selected' : ''}>60 เดือน (5 ปี)</option>
                            <option value="72" ${st.periodMonths === '72' ? 'selected' : ''}>72 เดือน (6 ปี)</option>
                            <option value="84" ${st.periodMonths === '84' ? 'selected' : ''}>84 เดือน (7 ปี)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Big Result Card -->
            <div class="themed-result-card theme-result-highlight p-5 text-center space-y-1">
                <div class="text-xs font-semibold text-[var(--app-muted)]">ค่างวดผ่อนชำระต่อเดือน (${st.condition === 'used' ? 'รวม VAT 7% แล้ว' : 'ราคารวม VAT แล้ว'})</div>
                <div class="themed-result-value text-2xl md:text-3xl font-extrabold">${formatMoney(calc.monthlyPayment)} บาท/เดือน</div>
                <div class="text-xs text-[var(--app-body)]">
                    ยอดจัด: <b>${formatMoney(calc.principal)}</b> บ. · ดอกเบี้ยคงที่ <b>${formatNum(calc.interestRate, 2)}%</b> (เทียบเท่าลดต้นลดดอก ~${formatNum(calc.effectiveRateApprox, 2)}%)
                </div>
            </div>

            <!-- Breakdown Detail Cards -->
            <div class="themed-tool-card p-4 space-y-1 text-xs">
                <div class="font-bold text-[var(--app-ink)] mb-1">สรุปโครงสร้างภาระหนี้ทั้งสัญญา</div>
                <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                    <span class="text-[var(--app-muted)]">ราคารถยนต์สุทธิ</span>
                    <b>${formatMoney(calc.price)} บาท</b>
                </div>
                <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                    <span class="text-[var(--app-muted)]">เงินดาวน์ (${formatNum(calc.downPaymentPercent, 1)}%)</span>
                    <b class="text-[var(--app-ink)]">-${formatMoney(calc.downPaymentAmount)} บาท</b>
                </div>
                <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                    <span class="text-[var(--app-muted)]">ยอดจัดเช่าซื้อ (เงินต้น)</span>
                    <b>${formatMoney(calc.principal)} บาท</b>
                </div>
                <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                    <span class="text-[var(--app-muted)]">ดอกเบี้ยรวมทั้งสัญญา (${calc.years} ปี)</span>
                    <b class="text-[var(--app-ink)]">+${formatMoney(calc.totalInterest)} บาท</b>
                </div>
                ${calc.isVatAdded ? `
                    <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                        <span class="text-[var(--app-muted)]">ภาษีมูลค่าเพิ่มในค่างวด (VAT 7% รถมือสอง)</span>
                        <b>+${formatMoney(calc.totalVat)} บาท (+${formatMoney(calc.vatMonthly)} บ./ด.)</b>
                    </div>
                ` : ''}
                <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)] font-semibold">
                    <span>ยอดผ่อนชำระรวมทุกงวด (${calc.periodMonths} งวด)</span>
                    <b>${formatMoney(calc.totalRepayment)} บาท</b>
                </div>
                <div class="flex justify-between gap-3 py-2 text-sm font-bold text-[var(--app-accent)]">
                    <span>ราคารวมที่จ่ายจริงทั้งหมด (ดาวน์ + ผ่อน)</span>
                    <b>${formatMoney(calc.totalCostOfCar)} บาท</b>
                </div>
            </div>

            <!-- Early Payoff Simulation Card (สคบ. เกณฑ์ใหม่) -->
            <div class="themed-tool-card p-4 space-y-3 text-xs">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-[var(--app-ink)]">จำลองการปิดบัญชีก่อนกำหนด (สคบ. เกณฑ์ใหม่ 2566)</span>
                </div>
                <div class="text-[11px] text-[var(--app-muted)]">
                    กฎหมายใหม่ให้สิทธิส่วนลดดอกเบี้ยที่ยังไม่ถึงกำหนดแบบลดต้นลดดอก
                </div>

                <div class="grid grid-cols-2 gap-2 pt-1">
                    <div>
                        <label class="text-[11px] font-semibold text-[var(--app-body)] block mb-1">ต้องการปิดบัญชี ณ สิ้นงวดที่:</label>
                        <select id="carPayoffMonthSelect" class="airbnb-input w-full text-xs">
                            ${Array.from({ length: calc.periodMonths - 1 }, (_, i) => i + 1).map(m => `
                                <option value="${m}" ${m === calc.payoffMonth ? 'selected' : ''}>งวดที่ ${m} (เหลืออีก ${calc.periodMonths - m} งวด)</option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="text-[11px] font-semibold text-[var(--app-body)] block mb-1">เกณฑ์ส่วนลดตาม สคบ.</label>
                        <div class="themed-subcard p-3 w-full text-[11px] font-bold text-[var(--app-accent)] flex items-center">
                            ลดดอกเบี้ย ${calc.discountTierPercent}%
                        </div>
                    </div>
                </div>

                <div class="themed-subcard p-3 space-y-2 mt-2">
                    <div class="flex justify-between">
                        <span class="text-[var(--app-muted)]">ดอกเบี้ยคงเหลือที่ยังไม่ถึงกำหนด</span>
                        <b>${formatMoney(calc.unearnedInterest)} บาท</b>
                    </div>
                    <div class="flex justify-between text-[var(--app-accent)] font-bold">
                        <span>ส่วนลดดอกเบี้ยที่ได้รับ (${calc.discountTierPercent}%)</span>
                        <b>-${formatMoney(calc.totalSavedByEarlyPayoff)} บาท</b>
                    </div>
                    <div class="flex justify-between pt-1 border-t border-[var(--app-hairline)] font-extrabold text-sm text-[var(--app-accent)]">
                        <span>ยอดเงินสุทธิที่ต้องเตรียมปิดบัญชี</span>
                        <b>${formatMoney(calc.totalPayoffAmount)} บาท</b>
                    </div>
                </div>

                <div class="flex justify-end pt-2">
                    <button id="btnPrintCarLoanSummary" type="button" class="tool-action-btn text-xs">
                        พิมพ์ใบสรุปสินเชื่อรถ / PDF
                    </button>
                </div>
            </div>
        </div>
    `;

    // Bind Event Listeners
    container.querySelectorAll('[data-vehicle]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.vehicleType = btn.getAttribute('data-vehicle');
            persistAppState();
            renderActiveTool();
        });
    });

    container.querySelectorAll('[data-condition]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.condition = btn.getAttribute('data-condition');
            if (st.condition === 'used' && st.interestRate === '2.59') st.interestRate = '4.5';
            else if (st.condition === 'new' && st.interestRate === '4.5') st.interestRate = '2.59';
            persistAppState();
            renderActiveTool();
        });
    });

    document.getElementById('btnDownPct')?.addEventListener('click', () => {
        st.downPaymentType = 'percent';
        st.downPaymentValue = Math.round(calc.downPaymentPercent).toString();
        persistAppState();
        renderActiveTool();
    });

    document.getElementById('btnDownAmt')?.addEventListener('click', () => {
        st.downPaymentType = 'amount';
        st.downPaymentValue = Math.round(calc.downPaymentAmount).toString();
        persistAppState();
        renderActiveTool();
    });

    const bindInput = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            st[key] = el.value;
            persistAppState();
            renderActiveTool();
        });
        el.addEventListener('blur', () => {
            const formatted = formatInputDisplay(el.value);
            st[key] = formatted;
            el.value = formatted;
            persistAppState();
        });
    };
    bindInput('carPriceInput', 'price');
    bindInput('carDownValInput', 'downPaymentValue');
    bindInput('carInterestRateInput', 'interestRate');

    document.getElementById('carPeriodSelect')?.addEventListener('change', e => {
        st.periodMonths = e.target.value;
        persistAppState();
        renderActiveTool();
    });

    document.getElementById('carPayoffMonthSelect')?.addEventListener('change', e => {
        st.payoffMonth = e.target.value;
        persistAppState();
        renderActiveTool();
    });

    container.querySelector('#btnPrintCarLoanSummary')?.addEventListener('click', () => {
        triggerPrintReceipt('car_loan');
    });

    if (calc.price <= 0) {
        setStatusBanner('empty', 'กรุณาระบุราคารถยนต์เพื่อคำนวณค่างวด');
    } else {
        setStatusBanner('success', `ค่างวดผ่อน ${calc.periodMonths} เดือน: <b class="text-[var(--app-accent)]">${formatMoney(calc.monthlyPayment)} บาท/ด.</b> (ยอดจัด ${formatMoney(calc.principal)} บ. ดอกเบี้ย ${formatNum(calc.interestRate, 2)}%)`);
    }
}

/* -----------------------------------------------------------
 * UI RENDERER: ประกันสังคม & เงินบำนาญชราภาพ (social_security)
 * ----------------------------------------------------------- */
function renderSocialSecurityTool(container) {
    if (!container) return;
    const st = appState.social_security = appState.social_security || {
        section: 'm33', // 'm33' | 'm39' | 'm40'
        wageMonthly: '35000',
        contributionMonths: '240', // 20 ปี
        m40Plan: 'plan2',
        m40ExtraSavings: '0'
    };

    const calc = calculateSocialSecurity(st);

    container.innerHTML = `
        <div class="finance-thai-tool flex flex-col gap-3 p-1">
            <!-- Section Selection Tabs (M.33, M.39, M.40) -->
            <div class="segment-group grid-cols-3 balanced-segment-modes" role="group" aria-label="มาตราประกันสังคม">
                <button type="button" aria-pressed="${st.section === 'm33'}" class="segment-btn ${st.section === 'm33' ? 'active' : ''}" data-sec="m33">ม.33 ลูกจ้าง</button>
                <button type="button" aria-pressed="${st.section === 'm39'}" class="segment-btn ${st.section === 'm39' ? 'active' : ''}" data-sec="m39">ม.39 สมัครใจ</button>
                <button type="button" aria-pressed="${st.section === 'm40'}" class="segment-btn ${st.section === 'm40' ? 'active' : ''}" data-sec="m40">ม.40 อาชีพอิสระ</button>
            </div>

            <!-- Main Input Form -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)]">
                    ข้อมูลเงินเดือนและระยะเวลาส่งเงินสมทบ
                </div>

                ${st.section === 'm33' ? `
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">เงินเดือน / ค่าจ้างเฉลี่ย (บาท)</label>
                            <input id="ssWageInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.wageMonthly))}" placeholder="เช่น 35,000" class="airbnb-input w-full font-semibold">
                        </div>
                        <div>
                            <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">ฐานคิดคำนวณ (เพดาน 15,000 บ.)</label>
                            <div class="themed-subcard p-3 w-full font-semibold text-[var(--app-ink)] flex items-center">
                                ${formatMoney(calc.cappedWage)} บาท
                            </div>
                        </div>
                    </div>
                ` : (st.section === 'm39' ? `
                    <div class="themed-subcard p-3 text-xs space-y-1">
                        <div class="font-bold text-[var(--app-ink)]">กฎหมายกำหนดฐานค่าจ้าง ม.39 ไว้คงที่: 4,800 บาท</div>
                        <div class="text-[var(--app-muted)] text-[11px]">ส่งเงินสมทบ 9% = เดือนละ 432 บาท (เข้าชราภาพ 288 บาท)</div>
                    </div>
                ` : `
                    <div class="space-y-2">
                        <label class="text-xs font-semibold text-[var(--app-muted)] block">เลือกทางเลือกการคุ้มครอง ม.40</label>
                        <select id="ssM40PlanSelect" class="airbnb-input w-full text-xs">
                            <option value="plan1" ${st.m40Plan === 'plan1' ? 'selected' : ''}>ทางเลือก 1: จ่าย 70 บ./ด. (เจ็บป่วย/ทุพพลภาพ/เสียชีวิต - ไม่มีชราภาพ)</option>
                            <option value="plan2" ${st.m40Plan === 'plan2' ? 'selected' : ''}>ทางเลือก 2: จ่าย 100 บ./ด. (มีออมชราภาพ 50 บ./ด.)</option>
                            <option value="plan3" ${st.m40Plan === 'plan3' ? 'selected' : ''}>ทางเลือก 3: จ่าย 300 บ./ด. (มีออมชราภาพ 150 บ./ด. + สงเคราะห์บุตร)</option>
                        </select>
                        <div class="grid grid-cols-2 gap-2 pt-1">
                            <div>
                                <label class="text-[11px] font-semibold text-[var(--app-muted)] block mb-1">ออมเพิ่มโดยสมัครใจ (บาท/เดือน)</label>
                                <input id="ssM40ExtraInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.m40ExtraSavings))}" placeholder="สูงสุด 1,000" class="airbnb-input w-full text-xs">
                            </div>
                            <div>
                                <label class="text-[11px] font-semibold text-[var(--app-muted)] block mb-1">ยอดเงินส่งต่อเดือนรวม</label>
                                <div class="themed-subcard p-3 w-full font-semibold text-xs flex items-center">
                                    ${formatMoney(calc.monthlyContribution)} บาท/เดือน
                                </div>
                            </div>
                        </div>
                    </div>
                `)}

                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">จำนวนงวดที่ส่งเงินสมทบ (เดือน)</label>
                        <input id="ssMonthsInput" type="text" inputmode="numeric" value="${escapeHTML(formatInputDisplay(st.contributionMonths))}" placeholder="เช่น 180 หรือ 240" class="airbnb-input w-full font-semibold">
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">ระยะเวลาส่งสะสม</label>
                        <div class="themed-subcard p-3 w-full font-semibold text-[var(--app-ink)] flex items-center">
                            ${formatNum(calc.yearsContributed, 1)} ปี (${formatNum(calc.contributionMonths, 0)} งวด)
                        </div>
                    </div>
                </div>

                <!-- Fast Preset Month Buttons -->
                <div class="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                    <span class="text-[var(--app-muted)] self-center">ลัด:</span>
                    <button type="button" class="btnPresetMonths tool-chip-btn" aria-pressed="${String(st.contributionMonths) === '60'}" data-months="60">5 ปี (60 ด.)</button>
                    <button type="button" class="btnPresetMonths tool-chip-btn" aria-pressed="${String(st.contributionMonths) === '120'}" data-months="120">10 ปี (120 ด.)</button>
                    <button type="button" class="btnPresetMonths tool-chip-btn" aria-pressed="${String(st.contributionMonths) === '180'}" data-months="180">15 ปี (180 ด.)</button>
                    <button type="button" class="btnPresetMonths tool-chip-btn" aria-pressed="${String(st.contributionMonths) === '240'}" data-months="240">20 ปี (240 ด.)</button>
                    <button type="button" class="btnPresetMonths tool-chip-btn" aria-pressed="${String(st.contributionMonths) === '300'}" data-months="300">25 ปี (300 ด.)</button>
                </div>
            </div>

            <!-- Big Result Card -->
            ${calc.isPension ? `
                <div class="themed-result-card theme-result-highlight p-5 text-center space-y-1">
                    <div class="text-xs font-semibold text-[var(--app-muted)]">ได้รับสิทธิเงินบำนาญชราภาพตลอดชีพ (ครบ 55 ปีบริบูรณ์)</div>
                    <div class="themed-result-value text-2xl md:text-3xl font-extrabold">${formatMoney(calc.monthlyPension)} บาท/เดือน</div>
                    <div class="text-xs text-[var(--app-body)]">
                        คิดเป็นปีละ <b>${formatMoney(calc.yearlyPension)}</b> บ. · อัตราบำนาญ <b>${formatNum(calc.pensionRatePercent, 2)}%</b> (เกิน 180 เดือนมา ${formatNum(Math.floor((calc.contributionMonths - 180) / 12), 0)} ปี)
                    </div>
                </div>
            ` : `
                <div class="themed-result-card theme-result-highlight p-5 text-center space-y-1">
                    <div class="text-xs font-semibold text-[var(--app-muted)]">ได้รับสิทธิเงินบำเหน็จชราภาพ (เงินก้อนครั้งเดียว)</div>
                    <div class="themed-result-value text-2xl md:text-3xl font-extrabold">${formatMoney(calc.lumpSumTotal)} บาท</div>
                    <div class="text-xs text-[var(--app-body)]">
                        ${st.section === 'm40' ? 'รับเงินก้อนพร้อมผลประโยชน์ตอบแทนเมื่ออายุครบ 60 ปีบริบูรณ์' : `ส่งเงินสมทบยังไม่ถึง 180 เดือน (${formatNum(calc.contributionMonths, 0)}/180 เดือน) จึงได้รับเป็นเงินบำเหน็จก้อนเดียว`}
                    </div>
                </div>
            `}

            <!-- Benefit Breakdown Details -->
            <div class="themed-tool-card p-4 space-y-1 text-xs">
                <div class="font-bold text-[var(--app-ink)] mb-1">สรุปยอดเงินสมทบและสิทธิประโยชน์</div>
                <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                    <span class="text-[var(--app-muted)]">เงินสมทบของผู้ประกันตนต่อเดือน</span>
                    <b>${formatMoney(calc.monthlyContribution)} บาท/เดือน</b>
                </div>
                ${st.section === 'm33' ? `
                    <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                        <span class="text-[var(--app-muted)]">เงินสมทบฝั่งนายจ้างช่วยจ่าย (5%)</span>
                        <b class="text-[var(--app-ink)]">+${formatMoney(calc.employerContribution)} บาท/เดือน</b>
                    </div>
                    <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                        <span class="text-[var(--app-muted)]">ยอดสะสมเฉพาะส่วนชราภาพ (ลูกจ้าง 3% + นายจ้าง 3%)</span>
                        <b>${formatMoney(calc.oldAgeSavingsMonthly * 2)} บาท/เดือน</b>
                    </div>
                ` : ''}
                <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                    <span class="text-[var(--app-muted)]">เงินที่ผู้ประกันตนจ่ายสะสมตลอด ${formatNum(calc.yearsContributed, 1)} ปี</span>
                    <b>${formatMoney(calc.totalWorkerContributed)} บาท</b>
                </div>
                ${calc.isPension ? `
                    <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                        <span class="text-[var(--app-muted)]">จุดคุ้มทุน (รับบำนาญกี่ปีคืนทุนที่เคยจ่าย)</span>
                        <b class="text-[var(--app-ink)]">~${calc.monthlyPension > 0 ? (calc.totalWorkerContributed / (calc.monthlyPension * 12)).toFixed(1) : 0} ปี (${calc.monthlyPension > 0 ? Math.ceil(calc.totalWorkerContributed / calc.monthlyPension) : 0} เดือน)</b>
                    </div>
                ` : ''}
                <div class="flex justify-end pt-2">
                    <button id="btnPrintSocialSecuritySummary" type="button" class="tool-action-btn text-xs">
                        พิมพ์ใบสรุปสิทธิประกันสังคม / PDF
                    </button>
                </div>
            </div>
        </div>
    `;

    // Bind Event Listeners
    container.querySelectorAll('[data-sec]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.section = btn.getAttribute('data-sec');
            persistAppState();
            renderActiveTool();
        });
    });

    container.querySelectorAll('.btnPresetMonths').forEach(btn => {
        btn.addEventListener('click', () => {
            st.contributionMonths = btn.getAttribute('data-months');
            persistAppState();
            renderActiveTool();
        });
    });

    const bindInput = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            st[key] = el.value;
            persistAppState();
            renderActiveTool();
        });
        el.addEventListener('blur', () => {
            const formatted = formatInputDisplay(el.value);
            st[key] = formatted;
            el.value = formatted;
            persistAppState();
        });
    };
    bindInput('ssWageInput', 'wageMonthly');
    bindInput('ssMonthsInput', 'contributionMonths');
    bindInput('ssM40ExtraInput', 'm40ExtraSavings');

    document.getElementById('ssM40PlanSelect')?.addEventListener('change', e => {
        st.m40Plan = e.target.value;
        persistAppState();
        renderActiveTool();
    });

    container.querySelector('#btnPrintSocialSecuritySummary')?.addEventListener('click', () => {
        triggerPrintReceipt('social_security');
    });

    if (calc.isPension) {
        setStatusBanner('success', `บำนาญชราภาพ (${calc.section.toUpperCase()} ส่ง ${formatNum(calc.contributionMonths, 0)} งวด): <b class="text-[var(--app-ink)]">${formatMoney(calc.monthlyPension)} บาท/เดือนตลอดชีพ</b> (ปีละ ${formatMoney(calc.yearlyPension)} บ.)`);
    } else {
        setStatusBanner('success', `บำเหน็จชราภาพ (${calc.section.toUpperCase()} ส่ง ${formatNum(calc.contributionMonths, 0)} งวด): <b class="text-[var(--app-accent)]">${formatMoney(calc.lumpSumTotal)} บาท</b> (รับเงินก้อนครั้งเดียว)`);
    }
}

// Module export definitions
(function(root) {
    const exportsObj = {
        calculateCarLoan,
        calculateSocialSecurity,
        renderCarLoanTool,
        renderSocialSecurityTool
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
