// ==============================================================
// Multitools Calculator - Thai Tax & Property Transfer Tools
// (tax_personal, property_transfer)
// ==============================================================

/* -----------------------------------------------------------
 * PURE ENGINE: คำนวณภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด. 90/91)
 * ----------------------------------------------------------- */
function calculatePersonalTax(params) {
    const p = params || {};
    const salaryMonthly = numberOrDefault(p.salaryMonthly, 0);
    const bonusYearly = numberOrDefault(p.bonusYearly, 0);
    const otherIncomeYearly = numberOrDefault(p.otherIncomeYearly, 0);
    const withholdingTax = numberOrDefault(p.withholdingTax, 0);

    // รายได้รวมทั้งปี
    const grossIncome = (salaryMonthly * 12) + bonusYearly + otherIncomeYearly;

    // หักค่าใช้จ่าย 50% สูงสุด 100,000 บาท
    const expenses = Math.min(grossIncome * 0.5, 100000);
    const incomeAfterExpenses = Math.max(0, grossIncome - expenses);

    // 1. ลดหย่อนส่วนตัวและครอบครัว
    const selfDeduction = 60000;
    const spouseDeduction = p.hasSpouse === 'yes' ? 60000 : 0;
    const childCount = Math.max(0, integerOrDefault(p.childCount, 0));
    const child2018Count = Math.max(0, integerOrDefault(p.child2018Count, 0));
    const childrenDeduction = (childCount * 30000) + (child2018Count * 60000);
    const parentCount = Math.min(4, Math.max(0, integerOrDefault(p.parentCount, 0)));
    const parentsDeduction = parentCount * 30000;
    const disabledCount = Math.max(0, integerOrDefault(p.disabledCareCount, 0));
    const disabledDeduction = disabledCount * 60000;

    const personalTotal = selfDeduction + spouseDeduction + childrenDeduction + parentsDeduction + disabledDeduction;

    // 2. ลดหย่อนประกัน เงินออม และการลงทุน
    const socialSecurity = Math.min(numberOrDefault(p.socialSecurity, 0), 9000);
    const healthInsurance = Math.min(numberOrDefault(p.healthInsurance, 0), 25000);
    const lifeInsurance = Math.min(numberOrDefault(p.lifeInsurance, 0), 100000);
    // ประกันชีวิต + ประกันสุขภาพ รวมกันไม่เกิน 100,000 บาท
    const lifeHealthCombo = Math.min(lifeInsurance + healthInsurance, 100000);
    const parentHealth = Math.min(numberOrDefault(p.parentHealthInsurance, 0), 15000);

    // กองทุนเพื่อการเกษียณ (PVD, RMF, SSF, บำนาญ รวมกันไม่เกิน 500,000)
    const pvdRaw = Math.min(numberOrDefault(p.pvdGpf, 0), grossIncome * 0.15, 500000);
    const rmfRaw = Math.min(numberOrDefault(p.rmf, 0), grossIncome * 0.30, 500000);
    const ssfRaw = Math.min(numberOrDefault(p.ssf, 0), grossIncome * 0.30, 200000);
    const pensionRaw = Math.min(numberOrDefault(p.pensionInsurance, 0), grossIncome * 0.15, 200000);
    const retirementCombo = Math.min(pvdRaw + rmfRaw + ssfRaw + pensionRaw, 500000);

    // กองทุน Thai ESG (แยกเพดาน 30% ไม่เกิน 300,000 บาท)
    const thaiEsgDeduct = Math.min(numberOrDefault(p.thaiEsg, 0), grossIncome * 0.30, 300000);

    // 3. ดอกเบี้ยกู้ยืมเพื่อที่อยู่อาศัย (สูงสุด 100,000 บาท)
    const homeLoanInterest = Math.min(numberOrDefault(p.homeLoanInterest, 0), 100000);

    const savingsTotal = socialSecurity + lifeHealthCombo + parentHealth + retirementCombo + thaiEsgDeduct + homeLoanInterest;

    // เงินได้หลังหักค่าลดหย่อนก่อนบริจาค
    const deductionsBeforeDonations = personalTotal + savingsTotal;
    const netBeforeDonations = Math.max(0, incomeAfterExpenses - deductionsBeforeDonations);

    // 4. เงินบริจาค (ไม่เกิน 10% ของเงินได้หลังหักค่าใช้จ่ายและลดหย่อน)
    const donationLimit = netBeforeDonations * 0.10;
    const donationEduRaw = numberOrDefault(p.donationEducation, 0) * 2;
    const donationEduDeduct = Math.min(donationEduRaw, donationLimit);
    const remDonationLimit = Math.max(0, donationLimit - donationEduDeduct);
    const donationGenDeduct = Math.min(numberOrDefault(p.donationGeneral, 0), remDonationLimit);
    const totalDonations = donationEduDeduct + donationGenDeduct;

    const totalDeductions = deductionsBeforeDonations + totalDonations;
    const netTaxableIncome = Math.max(0, netBeforeDonations - totalDonations);

    // 5. คำนวณภาษีอัตราก้าวหน้า 7 ขั้น (Progressive Tax)
    const brackets = [
        { label: '0 - 150,000', min: 0, max: 150000, rate: 0 },
        { label: '150,001 - 300,000', min: 150000, max: 300000, rate: 0.05 },
        { label: '300,001 - 500,000', min: 300000, max: 500000, rate: 0.10 },
        { label: '500,001 - 750,000', min: 500000, max: 750000, rate: 0.15 },
        { label: '750,001 - 1,000,000', min: 750000, max: 1000000, rate: 0.20 },
        { label: '1,000,001 - 2,000,000', min: 1000000, max: 2000000, rate: 0.25 },
        { label: '2,000,001 - 5,000,000', min: 2000000, max: 5000000, rate: 0.30 },
        { label: 'เกิน 5,000,000', min: 5000000, max: Infinity, rate: 0.35 }
    ];

    let totalTax = 0;
    let marginalRate = 0;
    const taxByBands = [];

    for (const b of brackets) {
        if (netTaxableIncome > b.min) {
            const taxableInBand = Math.min(netTaxableIncome, b.max) - b.min;
            const taxInBand = taxableInBand * b.rate;
            totalTax += taxInBand;
            marginalRate = Math.round(b.rate * 100);
            taxByBands.push({
                range: b.label,
                ratePercent: Math.round(b.rate * 100),
                taxableInBand,
                taxInBand
            });
        } else {
            taxByBands.push({
                range: b.label,
                ratePercent: Math.round(b.rate * 100),
                taxableInBand: 0,
                taxInBand: 0
            });
        }
    }

    // ตำแหน่งในขั้นภาษีปัจจุบัน และขั้นถัดไป (ใช้กับมาตรวัดบนเดสก์ท็อป)
    const currentBracketIndex = brackets.reduce((idx, b, i) => (netTaxableIncome > b.min ? i : idx), 0);
    const currentBracket = brackets[currentBracketIndex];
    const nextBracket = brackets[currentBracketIndex + 1] || null;

    // ภาษีที่ต้องชำระสุทธิ (หักภาษี ณ ที่จ่าย)
    const taxBalance = totalTax - withholdingTax; // บวก = จ่ายเพิ่ม, ลบ = ได้เงินคืน

    // สิทธิประโยชน์จากการลงทุนลดหย่อนเพิ่ม 10,000 บาท
    const savingsPer10k = marginalRate > 0 ? (10000 * (marginalRate / 100)) : 0;

    return {
        grossIncome,
        expenses,
        incomeAfterExpenses,
        personalTotal,
        savingsTotal,
        totalDonations,
        totalDeductions,
        netTaxableIncome,
        taxByBands,
        totalTax,
        marginalRate,
        bracketStart: currentBracket.min,
        nextBracketStart: nextBracket ? nextBracket.min : null,
        nextRatePercent: nextBracket ? Math.round(nextBracket.rate * 100) : null,
        withholdingTax,
        taxBalance,
        isRefund: taxBalance < 0,
        refundAmount: taxBalance < 0 ? Math.abs(taxBalance) : 0,
        payableAmount: taxBalance > 0 ? taxBalance : 0,
        savingsPer10k,
        details: {
            selfDeduction,
            spouseDeduction,
            childrenDeduction,
            parentsDeduction,
            disabledDeduction,
            socialSecurity,
            lifeHealthCombo,
            parentHealth,
            retirementCombo,
            thaiEsgDeduct,
            homeLoanInterest,
            donationEduDeduct,
            donationGenDeduct
        }
    };
}

/* -----------------------------------------------------------
 * PURE ENGINE: ค่าธรรมเนียมโอนที่ดิน & ภาษีอสังหาฯ (กรมที่ดิน)
 * ----------------------------------------------------------- */
function calculatePropertyTransfer(params) {
    const p = params || {};
    const appraisedValue = Math.max(0, numberOrDefault(p.appraisedValue, 0));
    const salePrice = Math.max(0, numberOrDefault(p.salePrice, 0));
    const mortgageAmount = Math.max(0, numberOrDefault(p.mortgageAmount, 0));
    const holdingYears = Math.min(10, Math.max(1, integerOrDefault(p.holdingYears, 1)));
    const isGovMeasure = p.isGovMeasure === 'reduced';
    const exemptSBT = p.exemptSBT === 'yes' || holdingYears >= 5;
    const splitMode = p.splitMode || 'custom'; // 'custom' | 'half' | 'seller' | 'buyer'

    // ฐานคำนวณที่ใช้ยอดสูงสุดระหว่างราคาประเมิน vs ราคาซื้อขายจริง
    const maxVal = Math.max(appraisedValue, salePrice);

    // 1. ค่าธรรมเนียมการโอนกรรมสิทธิ์ (Transfer Fee)
    // ฐาน: ราคาประเมินกรมที่ดิน (ปกติ 2%, มาตรการรัฐ 0.01%)
    const transferRate = isGovMeasure ? 0.0001 : 0.02;
    const transferFee = appraisedValue * transferRate;

    // 2. ค่าจดทะเบียนจำนอง (Mortgage Fee)
    // ฐาน: ยอดวงเงินกู้สินเชื่อ (ปกติ 1%, มาตรการรัฐ 0.01%)
    const mortgageRate = isGovMeasure ? 0.0001 : 0.01;
    const mortgageFee = mortgageAmount > 0 ? (mortgageAmount * mortgageRate) : 0;

    // 3. ภาษีธุรกิจเฉพาะ 3.3% vs ค่าอากรแสตมป์ 0.5%
    // ฐาน: max(ราคาประเมิน, ราคาขายจริง)
    let sbtTax = 0;
    let stampDuty = 0;
    let isSBT = false;

    if (!exemptSBT) {
        // ถือครองน้อยกว่า 5 ปี และไม่มีชื่อในทะเบียนบ้านเกิน 1 ปี -> เสียภาษีธุรกิจเฉพาะ 3.3%
        isSBT = true;
        sbtTax = maxVal * 0.033;
        stampDuty = 0;
    } else {
        // ได้รับยกเว้นภาษีธุรกิจเฉพาะ -> เสียค่าอากรแสตมป์ 0.5% (1 บาท ต่อทุก 200 บาท)
        isSBT = false;
        sbtTax = 0;
        stampDuty = maxVal * 0.005;
    }

    // 4. ภาษีเงินได้บุคคลธรรมดาหัก ณ ที่จ่าย (Personal Withholding Tax - ม.50(5))
    // ฐาน: ราคาประเมินกรมที่ดิน
    const expenseRatesByYear = {
        1: 0.92,
        2: 0.84,
        3: 0.77,
        4: 0.71,
        5: 0.65,
        6: 0.60,
        7: 0.55,
        8: 0.50,
        9: 0.50,
        10: 0.50
    };
    const expenseRate = expenseRatesByYear[holdingYears] || 0.50;
    const expenseDeductible = appraisedValue * expenseRate;
    const netAppraised = Math.max(0, appraisedValue - expenseDeductible);
    const yearlyNetIncome = netAppraised / holdingYears;

    // คำนวณภาษีต่อปีตามอัตรา ม.50(5) บุคคลธรรมดาขายอสังหาริมทรัพย์
    const propertyTaxBands = [
        { max: 100000, rate: 0.05 },
        { max: 500000, rate: 0.10 },
        { max: 1000000, rate: 0.20 },
        { max: 4000000, rate: 0.30 },
        { max: Infinity, rate: 0.35 }
    ];

    let yearlyTax = 0;
    let prevLimit = 0;
    for (const b of propertyTaxBands) {
        if (yearlyNetIncome > prevLimit) {
            const taxable = Math.min(yearlyNetIncome, b.max) - prevLimit;
            yearlyTax += taxable * b.rate;
            prevLimit = b.max;
        } else {
            break;
        }
    }

    // รวมภาษีหัก ณ ที่จ่ายทั้งสิ้น = ภาษีต่อปี * จำนวนปีถือครอง (ไม่เกิน 20% ของราคาประเมิน)
    const rawWithholding = yearlyTax * holdingYears;
    const withholdingTax = Math.min(rawWithholding, appraisedValue * 0.20);

    // ยอดรวมค่าใช้จ่ายทั้งหมด ณ สำนักงานที่ดิน
    const totalLandCost = transferFee + mortgageFee + sbtTax + stampDuty + withholdingTax;

    // การแบ่งจ่ายระหว่างผู้ซื้อ vs ผู้ขาย
    let buyerCost = 0;
    let sellerCost = 0;

    if (splitMode === 'custom') {
        // ธรรมเนียมปฏิบัติทั่วไปของไทย:
        // ผู้ซื้อ: ค่าโอน 50% + ค่าจดจำนอง 100%
        // ผู้ขาย: ค่าโอน 50% + ภาษีธุรกิจเฉพาะ/อากรแสตมป์ 100% + ภาษีหัก ณ ที่จ่าย 100%
        buyerCost = (transferFee * 0.5) + mortgageFee;
        sellerCost = (transferFee * 0.5) + sbtTax + stampDuty + withholdingTax;
    } else if (splitMode === 'half') {
        // คนละครึ่งทุกรายการ ยกเว้นค่าจดจำนอง (เพราะเป็นยอดกู้ของผู้ซื้อ)
        buyerCost = ((transferFee + sbtTax + stampDuty + withholdingTax) * 0.5) + mortgageFee;
        sellerCost = (transferFee + sbtTax + stampDuty + withholdingTax) * 0.5;
    } else if (splitMode === 'seller') {
        // ผู้ขายจ่ายทั้งหมด ยกเว้นค่าจำนอง
        buyerCost = mortgageFee;
        sellerCost = transferFee + sbtTax + stampDuty + withholdingTax;
    } else if (splitMode === 'buyer') {
        // ผู้ซื้อจ่ายทั้งหมด 100%
        buyerCost = totalLandCost;
        sellerCost = 0;
    }

    return {
        appraisedValue,
        salePrice,
        maxVal,
        mortgageAmount,
        holdingYears,
        isGovMeasure,
        isSBT,
        exemptSBT,
        splitMode,
        transferRatePercent: transferRate * 100,
        mortgageRatePercent: mortgageRate * 100,
        transferFee,
        mortgageFee,
        sbtTax,
        stampDuty,
        withholdingExpensePercent: Math.round(expenseRate * 100),
        withholdingTax,
        totalLandCost,
        buyerCost,
        sellerCost,
        breakdown: [
            {
                name: 'ค่าธรรมเนียมการโอนกรรมสิทธิ์',
                rateText: `${formatNum(transferRate * 100, 2)}%`,
                baseAmount: appraisedValue,
                total: transferFee,
                buyer: splitMode === 'buyer' ? transferFee : (splitMode === 'seller' ? 0 : transferFee * 0.5),
                seller: splitMode === 'seller' ? transferFee : (splitMode === 'buyer' ? 0 : transferFee * 0.5)
            },
            {
                name: 'ค่าจดทะเบียนจำนอง (สินเชื่อ)',
                rateText: mortgageAmount > 0 ? `${formatNum(mortgageRate * 100, 2)}%` : '-',
                baseAmount: mortgageAmount,
                total: mortgageFee,
                buyer: mortgageFee,
                seller: 0
            },
            {
                name: isSBT ? 'ภาษีธุรกิจเฉพาะ (SBT 3.3%)' : 'ค่าอากรแสตมป์ (0.5%)',
                rateText: isSBT ? '3.3%' : '0.5%',
                baseAmount: maxVal,
                total: isSBT ? sbtTax : stampDuty,
                buyer: splitMode === 'buyer' ? (isSBT ? sbtTax : stampDuty) : (splitMode === 'half' ? (isSBT ? sbtTax : stampDuty) * 0.5 : 0),
                seller: splitMode === 'buyer' ? 0 : (splitMode === 'half' ? (isSBT ? sbtTax : stampDuty) * 0.5 : (isSBT ? sbtTax : stampDuty))
            },
            {
                name: 'ภาษีเงินได้หัก ณ ที่จ่ายบุคคลธรรมดา',
                rateText: `หัก คชจ. ${Math.round(expenseRate * 100)}%`,
                baseAmount: appraisedValue,
                total: withholdingTax,
                buyer: splitMode === 'buyer' ? withholdingTax : (splitMode === 'half' ? withholdingTax * 0.5 : 0),
                seller: splitMode === 'buyer' ? 0 : (splitMode === 'half' ? withholdingTax * 0.5 : withholdingTax)
            }
        ]
    };
}

/* -----------------------------------------------------------
 * UI RENDERER: ภาษีเงินได้บุคคลธรรมดา ภ.ง.ด. 90/91
 * ----------------------------------------------------------- */
function renderTaxPersonalTool(container) {
    if (!container) return;
    const st = appState.tax_personal = appState.tax_personal || {
        activeTab: 'income',
        salaryMonthly: '50000',
        bonusYearly: '50000',
        otherIncomeYearly: '0',
        withholdingTax: '12000',
        hasSpouse: 'no',
        childCount: '0',
        child2018Count: '0',
        parentCount: '0',
        disabledCareCount: '0',
        socialSecurity: '9000',
        lifeInsurance: '30000',
        healthInsurance: '10000',
        parentHealthInsurance: '0',
        pvdGpf: '30000',
        rmf: '0',
        ssf: '0',
        pensionInsurance: '0',
        thaiEsg: '0',
        homeLoanInterest: '0',
        donationEducation: '0',
        donationGeneral: '0'
    };

    const activeTab = st.activeTab || 'income';
    const calc = calculatePersonalTax(st);

    let html = `
        <div class="personal-tax-tool flex flex-col gap-3 p-1">
            <!-- Segmented Control Tabs -->
            <div class="segment-group grid-cols-3 balanced-segment-modes" role="tablist" aria-label="หมวดคำนวณภาษี">
                <button type="button" role="tab" id="tax-tab-income" aria-selected="${activeTab === 'income'}" tabindex="${activeTab === 'income' ? '0' : '-1'}" class="segment-btn ${activeTab === 'income' ? 'active' : ''}" data-tax-tab="income">1. รายได้ทั้งปี</button>
                <button type="button" role="tab" id="tax-tab-deduct" aria-selected="${activeTab === 'deduct'}" tabindex="${activeTab === 'deduct' ? '0' : '-1'}" class="segment-btn ${activeTab === 'deduct' ? 'active' : ''}" data-tax-tab="deduct">2. สิทธิลดหย่อน</button>
                <button type="button" role="tab" id="tax-tab-summary" aria-selected="${activeTab === 'summary'}" tabindex="${activeTab === 'summary' ? '0' : '-1'}" class="segment-btn ${activeTab === 'summary' ? 'active' : ''}" data-tax-tab="summary">3. สรุปภาษี</button>
            </div>
    `;

    if (activeTab === 'income') {
        html += `
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)]">ข้อมูลรายได้พึงประเมินทั้งปี</div>
                <div>
                    <label class="text-xs font-semibold text-[var(--app-body)] block mb-1">เงินเดือนประจำ (บาท/เดือน)</label>
                    <input id="taxSalaryMonthly" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.salaryMonthly))}" placeholder="เช่น 50,000" class="airbnb-input w-full">
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-xs font-semibold text-[var(--app-body)] block mb-1">โบนัสทั้งปี (บาท)</label>
                        <input id="taxBonusYearly" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.bonusYearly))}" placeholder="เช่น 50,000" class="airbnb-input w-full">
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-[var(--app-body)] block mb-1">รายได้อื่น/ฟรีแลนซ์ทั้งปี</label>
                        <input id="taxOtherIncome" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.otherIncomeYearly))}" placeholder="0" class="airbnb-input w-full">
                    </div>
                </div>
                <div>
                    <label class="text-xs font-semibold text-[var(--app-body)] block mb-1">ภาษีหัก ณ ที่จ่ายสะสมทั้งปี (ถูกหักไว้แล้ว)</label>
                    <input id="taxWithholding" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.withholdingTax))}" placeholder="เช่น 12,000" class="airbnb-input w-full">
                    <span class="text-[11px] text-[var(--app-muted)] mt-0.5 block">ดูได้จากหนังสือรับรอง 50 ทวิ ที่บริษัทออกให้</span>
                </div>
            </div>

            <!-- Mini Preview Card -->
            <div class="themed-tool-card p-4 space-y-1 text-xs">
                <div class="font-bold text-[var(--app-ink)] pb-1">สรุปรายได้เบื้องต้น</div>
                <div class="tool-summary-row flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">รายได้รวมทั้งปี</span>
                    <b class="text-sm font-semibold">${formatMoney(calc.grossIncome)} บาท</b>
                </div>
                <div class="tool-summary-row flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">หักค่าใช้จ่ายตามกฎหมาย</span>
                    <b>- ${formatMoney(calc.expenses)} บาท</b>
                </div>
                <div class="tool-summary-row flex justify-between gap-3 py-2 font-semibold">
                    <span>เงินได้หลังหักค่าใช้จ่าย</span>
                    <b>${formatMoney(calc.incomeAfterExpenses)} บาท</b>
                </div>
            </div>
        `;
    } else if (activeTab === 'deduct') {
        html += `
            <!-- กลุ่มที่ 1: ส่วนตัวและครอบครัว -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)]">1. สิทธิส่วนตัวและครอบครัว</div>
                <div class="text-[11px] text-[var(--app-muted)]">ผู้มีเงินได้ลดหย่อนอัตโนมัติ 60,000 บาท</div>
                
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label class="font-semibold block mb-1">คู่สมรส (ไม่มีเงินได้)</label>
                        <select id="taxHasSpouse" class="airbnb-input w-full">
                            <option value="no" ${st.hasSpouse === 'no' ? 'selected' : ''}>ไม่มี / มีเงินได้</option>
                            <option value="yes" ${st.hasSpouse === 'yes' ? 'selected' : ''}>มีคู่สมรส (ลด 60,000)</option>
                        </select>
                    </div>
                    <div>
                        <label class="font-semibold block mb-1">บิดามารดา (คนละ 3 หมื่น)</label>
                        <input id="taxParentCount" type="number" min="0" max="4" value="${st.parentCount}" class="airbnb-input w-full" placeholder="0-4 คน">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label class="font-semibold block mb-1">บุตรเกิดก่อนปี 2561</label>
                        <input id="taxChildCount" type="number" min="0" max="10" value="${st.childCount}" class="airbnb-input w-full" placeholder="คนละ 30,000">
                    </div>
                    <div>
                        <label class="font-semibold block mb-1">บุตรคนที่ 2+ เกิดปี 61 เป็นต้นไป</label>
                        <input id="taxChild2018Count" type="number" min="0" max="10" value="${st.child2018Count}" class="airbnb-input w-full" placeholder="คนละ 60,000">
                    </div>
                </div>
            </div>

            <!-- กลุ่มที่ 2: ประกัน เงินออม และการลงทุน -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)]">2. ประกัน กองทุน และการออม</div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label class="font-semibold block mb-1">ประกันสังคม (สูงสุด 9,000)</label>
                        <input id="taxSocialSecurity" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.socialSecurity))}" class="airbnb-input w-full">
                    </div>
                    <div>
                        <label class="font-semibold block mb-1">ประกันชีวิต (สูงสุด 1 แสน)</label>
                        <input id="taxLifeInsurance" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.lifeInsurance))}" class="airbnb-input w-full">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label class="font-semibold block mb-1">ประกันสุขภาพ (สูงสุด 25,000)</label>
                        <input id="taxHealthInsurance" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.healthInsurance))}" class="airbnb-input w-full">
                    </div>
                    <div>
                        <label class="font-semibold block mb-1">กองทุนสำรองเลี้ยงชีพ / กบข.</label>
                        <input id="taxPvdGpf" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.pvdGpf))}" class="airbnb-input w-full">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label class="font-semibold block mb-1">กองทุน SSF (สูงสุด 2 แสน)</label>
                        <input id="taxSsf" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.ssf))}" class="airbnb-input w-full">
                    </div>
                    <div>
                        <label class="font-semibold block mb-1">กองทุน RMF (สูงสุด 5 แสน)</label>
                        <input id="taxRmf" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.rmf))}" class="airbnb-input w-full">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label class="font-semibold block mb-1">กองทุน Thai ESG (สูงสุด 3 แสน)</label>
                        <input id="taxThaiEsg" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.thaiEsg))}" class="airbnb-input w-full">
                    </div>
                    <div>
                        <label class="font-semibold block mb-1">ดอกเบี้ยเงินกู้บ้าน (สูงสุด 1 แสน)</label>
                        <input id="taxHomeLoan" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.homeLoanInterest))}" class="airbnb-input w-full">
                    </div>
                </div>
            </div>

            <!-- กลุ่มที่ 3: เงินบริจาค -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)]">3. เงินบริจาค</div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label class="font-semibold block mb-1">บริจาคการศึกษา/กีฬา/รพ. (ลดหย่อน 2 เท่า)</label>
                        <input id="taxDonationEdu" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.donationEducation))}" class="airbnb-input w-full">
                    </div>
                    <div>
                        <label class="font-semibold block mb-1">บริจาคทั่วไป (ลดหย่อนตามจริง)</label>
                        <input id="taxDonationGen" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.donationGeneral))}" class="airbnb-input w-full">
                    </div>
                </div>
            </div>
        `;
    } else {
        // TAB: สรุปผลภาษี & วางแผน
        const isRefund = calc.isRefund;
        const resultStateClass = isRefund ? 'is-profit' : (calc.payableAmount > 0 ? 'is-loss' : '');
        const resultLabel = isRefund ? 'ได้รับเงินคืนภาษี' : (calc.payableAmount > 0 ? 'ต้องชำระภาษีเพิ่มเติม' : 'ไม่มียอดค้างชำระ');

        html += `
            <!-- Big Result Card -->
            <div class="themed-result-card ${resultStateClass} p-5 text-center space-y-1">
                <div class="text-xs font-semibold text-[var(--app-muted)]">${resultLabel}</div>
                <div class="themed-result-value text-2xl md:text-3xl font-extrabold">
                    ${formatMoney(isRefund ? calc.refundAmount : calc.payableAmount)} บาท
                </div>
                <div class="text-xs text-[var(--app-body)]">
                    ภาษีทั้งปี ${formatMoney(calc.totalTax)} บาท · หัก ณ ที่จ่ายแล้ว ${formatMoney(calc.withholdingTax)} บาท
                </div>
            </div>

            ${renderTaxChartPanel(calc, st)}

            <!-- Tax Metrics Grid -->
            <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="themed-subcard p-3">
                    <span class="text-[var(--app-muted)] block mb-0.5">เงินได้สุทธิ</span>
                    <b class="text-sm">${formatMoney(calc.netTaxableIncome)} ฿</b>
                </div>
                <div class="themed-subcard p-3">
                    <span class="text-[var(--app-muted)] block mb-0.5">ฐานภาษีสูงสุด</span>
                    <b class="text-sm text-[var(--app-accent)]">${calc.marginalRate}%</b>
                </div>
            </div>

            <!-- Tax Savings Advisor Box -->
            <div class="themed-tool-card p-4 text-xs space-y-2">
                <div class="font-bold text-[var(--app-ink)]">แนวทางวางแผนภาษี</div>
                <div class="text-[var(--app-body)]">
                    ${calc.marginalRate > 0
                        ? `ปัจจุบันท่านอยู่ในฐานภาษี <b>${calc.marginalRate}%</b> การซื้อกองทุนลดหย่อนภาษี (SSF, RMF, Thai ESG) หรือประกันเพิ่ม <b>ทุก 10,000 บาท</b> จะช่วยประหยัดภาษีได้ถึง <b>${formatMoney(calc.savingsPer10k)} บาท</b>`
                        : 'ปัจจุบันรายได้สุทธิของท่านอยู่ในเกณฑ์ยกเว้นภาษี (0%) ยังไม่จำเป็นต้องซื้อกองทุนหรือประกันเพื่อลดหย่อนภาษีเพิ่มเติม'}
                </div>
            </div>

            <!-- Tax Brackets Table -->
            <div class="themed-tool-card p-4 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ตารางภาษีแบบขั้นบันได 7 ขั้น</div>
                <div class="overflow-x-auto thin-scroll">
                    <table class="w-full text-left border-collapse text-[11px]">
                        <thead>
                            <tr class="border-b border-[var(--app-hairline)] text-[var(--app-muted)]">
                                <th class="py-1">ขั้นเงินได้สุทธิ</th>
                                <th class="py-1 text-center">อัตรา</th>
                                <th class="py-1 text-right">เงินได้ในขั้น</th>
                                <th class="py-1 text-right">ภาษีในขั้น</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${calc.taxByBands.map(b => `
                                <tr class="border-b border-[var(--app-hairline)] ${b.taxInBand > 0 ? 'font-semibold text-[var(--app-ink)]' : 'text-[var(--app-muted)]'}">
                                    <td class="py-1">${b.range}</td>
                                    <td class="py-1 text-center">${b.ratePercent}%</td>
                                    <td class="py-1 text-right">${formatMoney(b.taxableInBand)}</td>
                                    <td class="py-1 text-right">${formatMoney(b.taxInBand)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="font-bold border-t border-[var(--app-hairline)] text-[var(--app-ink)]">
                                <td colspan="3" class="py-1.5 text-right">ภาษีรวมทั้งสิ้น</td>
                                <td class="py-1.5 text-right text-[var(--app-accent)]">${formatMoney(calc.totalTax)} ฿</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Print Actions -->
            <div class="flex justify-end pt-1">
                <button id="btnPrintTaxPersonalSummary" type="button" class="tool-action-btn text-xs">
                    พิมพ์ใบสรุปภาษี ภ.ง.ด. / PDF
                </button>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Attach Tab Handlers
    container.querySelectorAll('[data-tax-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.activeTab = btn.getAttribute('data-tax-tab');
            persistAppState();
            renderActiveTool();
        });
    });

    // Helper to wire input sync
    const bindInput = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            st[key] = el.value;
            persistAppState();
            renderActiveTool();
        });
        el.addEventListener('blur', () => {
            if (el.tagName === 'INPUT' && el.type === 'text') {
                const formatted = formatInputDisplay(el.value);
                st[key] = formatted;
                el.value = formatted;
                persistAppState();
            }
        });
    };

    if (activeTab === 'income') {
        bindInput('taxSalaryMonthly', 'salaryMonthly');
        bindInput('taxBonusYearly', 'bonusYearly');
        bindInput('taxOtherIncome', 'otherIncomeYearly');
        bindInput('taxWithholding', 'withholdingTax');
    } else if (activeTab === 'deduct') {
        bindInput('taxHasSpouse', 'hasSpouse');
        bindInput('taxParentCount', 'parentCount');
        bindInput('taxChildCount', 'childCount');
        bindInput('taxChild2018Count', 'child2018Count');
        bindInput('taxSocialSecurity', 'socialSecurity');
        bindInput('taxLifeInsurance', 'lifeInsurance');
        bindInput('taxHealthInsurance', 'healthInsurance');
        bindInput('taxPvdGpf', 'pvdGpf');
        bindInput('taxSsf', 'ssf');
        bindInput('taxRmf', 'rmf');
        bindInput('taxThaiEsg', 'thaiEsg');
        bindInput('taxHomeLoan', 'homeLoanInterest');
        bindInput('taxDonationEdu', 'donationEducation');
        bindInput('taxDonationGen', 'donationGeneral');
    } else {
        container.querySelector('#btnPrintTaxPersonalSummary')?.addEventListener('click', () => {
            triggerPrintReceipt('tax_personal');
        });
    }

    // Status Banner Text
    if (calc.grossIncome <= 0) {
        setStatusBanner('empty', 'กรุณาระบุเงินเดือนหรือรายได้ทั้งปีเพื่อคำนวณภาษีบุคคลธรรมดา');
    } else if (calc.isRefund) {
        setStatusBanner('success', `ได้รับเงินคืนภาษี: <b class="text-[var(--app-accent)]">${formatMoney(calc.refundAmount)} บาท</b> · ฐานภาษี ${calc.marginalRate}%`);
    } else if (calc.payableAmount > 0) {
        setStatusBanner('success', `ต้องชำระภาษีเพิ่ม: <b class="text-[var(--app-accent)]">${formatMoney(calc.payableAmount)} บาท</b> · ฐานภาษี ${calc.marginalRate}%`);
    } else {
        setStatusBanner('success', `ชำระภาษีครบถ้วนพอดี: ภาษีรวมทั้งสิ้น ${formatMoney(calc.totalTax)} บาท`);
    }
}

/* -----------------------------------------------------------
 * PURE ENGINE: เทียบค่าใช้จ่ายวันโอนฝั่งผู้ซื้อ vs ผู้ขาย ครบทุกข้อตกลงแบ่งจ่าย
 * ยอดรวมเท่ากันทุกแบบ ต่างกันที่ว่าใครเป็นคนจ่าย
 * ----------------------------------------------------------- */
const TRANSFER_SPLIT_MODES = [
    { mode: 'custom', label: 'ธรรมเนียมทั่วไป (โอนคนละครึ่ง)' },
    { mode: 'half', label: 'คนละครึ่งทุกรายการ' },
    { mode: 'seller', label: 'ผู้ขายออกทั้งหมด' },
    { mode: 'buyer', label: 'ผู้ซื้อออกทั้งหมด' }
];

function buildTransferSplitComparison(params) {
    const p = params || {};
    const selected = calculatePropertyTransfer({ ...p, splitMode: p.splitMode || 'custom' });
    if (!(selected.appraisedValue > 0)) return [];
    return TRANSFER_SPLIT_MODES.map(({ mode, label }) => {
        const calc = calculatePropertyTransfer({ ...p, splitMode: mode });
        return {
            mode,
            label,
            isSelected: mode === selected.splitMode,
            buyerCost: calc.buyerCost,
            sellerCost: calc.sellerCost,
            totalCost: calc.totalLandCost,
            buyerSharePct: calc.totalLandCost > 0 ? (calc.buyerCost / calc.totalLandCost) * 100 : 0,
            buyerDelta: calc.buyerCost - selected.buyerCost
        };
    });
}

// ตารางเทียบแบบเคียงข้างกัน แสดงเฉพาะจอใหญ่ (hidden lg:block) เพื่อไม่กระทบมือถือ
function renderTransferSplitComparison(rows) {
    if (!rows.length) return '';
    const deltaText = d => (Math.abs(d) < 0.005 ? '-' : `${d > 0 ? '+' : '−'}${formatMoney(Math.abs(d))}`);
    return `
        <div class="transfer-split-compare themed-tool-card hidden lg:block p-4 space-y-2 text-xs" data-desktop-chart>
            <div class="font-bold text-[var(--app-ink)]">เปรียบเทียบผู้ซื้อ vs ผู้ขาย ทุกข้อตกลงแบ่งจ่าย</div>
            <div class="text-[11px] text-[var(--app-muted)]">ยอดรวมค่าใช้จ่ายวันโอน ${formatMoney(rows[0].totalCost)} บาท เท่ากันทุกแบบ ต่างกันที่ใครเป็นผู้จ่าย · แถวที่ไฮไลต์คือข้อตกลงที่เลือกไว้</div>
            <div class="overflow-x-auto thin-scroll">
                <table class="w-full text-left border-collapse text-[11px]">
                    <thead>
                        <tr class="text-[var(--app-muted)] border-b border-[var(--app-hairline)]">
                            <th scope="col" class="py-1.5 px-1">ข้อตกลงแบ่งจ่าย</th>
                            <th scope="col" class="py-1.5 px-1 text-right">ผู้ซื้อจ่าย</th>
                            <th scope="col" class="py-1.5 px-1 text-right">ผู้ขายจ่าย</th>
                            <th scope="col" class="py-1.5 px-1">สัดส่วนผู้ซื้อ : ผู้ขาย</th>
                            <th scope="col" class="py-1.5 px-1 text-right">ผู้ซื้อต่างจากที่เลือก</th>
                        </tr>
                    </thead>
                    <tbody>${rows.map(r => `
                        <tr class="border-b border-[var(--app-hairline)] ${r.isSelected ? 'bg-[var(--app-accent-soft)] font-bold text-[var(--app-ink)]' : 'text-[var(--app-body)]'}"${r.isSelected ? ' aria-current="true"' : ''}>
                            <td class="py-2 px-1">${escapeHTML(r.label)}</td>
                            <td class="py-2 px-1 text-right">${formatMoney(r.buyerCost)}</td>
                            <td class="py-2 px-1 text-right">${formatMoney(r.sellerCost)}</td>
                            <td class="py-2 px-1 min-w-[9rem]">
                                <div class="flex items-center gap-1.5">
                                    <div class="h-2 flex-1 rounded-full overflow-hidden flex" style="background:var(--app-ink);opacity:0.75" role="img" aria-label="ผู้ซื้อ ${formatNum(r.buyerSharePct, 0)}% ผู้ขาย ${formatNum(100 - r.buyerSharePct, 0)}%"><div class="h-full" style="width:${r.buyerSharePct.toFixed(1)}%;background:var(--app-accent)"></div></div>
                                    <span class="whitespace-nowrap">${formatNum(r.buyerSharePct, 0)} : ${formatNum(100 - r.buyerSharePct, 0)}</span>
                                </div>
                            </td>
                            <td class="py-2 px-1 text-right">${deltaText(r.buyerDelta)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

/* -----------------------------------------------------------
 * UI RENDERER: ค่าธรรมเนียมโอนที่ดิน & ภาษีอสังหาฯ
 * ----------------------------------------------------------- */
function renderPropertyTransferTool(container) {
    if (!container) return;
    const st = appState.property_transfer = appState.property_transfer || {
        appraisedValue: '3000000',
        salePrice: '3200000',
        mortgageAmount: '2500000',
        holdingYears: '3',
        exemptSBT: 'no',
        splitMode: 'custom',
        isGovMeasure: 'standard'
    };

    const calc = calculatePropertyTransfer(st);

    container.innerHTML = `
        <div class="property-transfer-tool flex flex-col gap-3 p-1">
            <!-- Mode Settings & Measures -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)]">เงื่อนไขและมาตรการรัฐ</div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label class="font-semibold text-[var(--app-body)] block mb-1">มาตรการค่าโอน-จำนอง</label>
                        <select id="propGovMeasure" class="airbnb-input w-full">
                            <option value="standard" ${st.isGovMeasure !== 'reduced' ? 'selected' : ''}>อัตราปกติ (โอน 2% / จำนอง 1%)</option>
                            <option value="reduced" ${st.isGovMeasure === 'reduced' ? 'selected' : ''}>ลดหย่อนรัฐ (โอน 0.01% / จำนอง 0.01%)</option>
                        </select>
                    </div>
                    <div>
                        <label class="font-semibold text-[var(--app-body)] block mb-1">สิทธิภาษีธุรกิจเฉพาะ</label>
                        <select id="propExemptSBT" class="airbnb-input w-full">
                            <option value="no" ${st.exemptSBT === 'no' ? 'selected' : ''}>เสียธุรกิจเฉพาะ 3.3%</option>
                            <option value="yes" ${st.exemptSBT === 'yes' ? 'selected' : ''}>ยกเว้น/เสียอากร 0.5% (ชื่อเกิน 1 ปี/มรดก)</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label class="font-semibold text-[var(--app-body)] block mb-1">จำนวนปีที่ถือครองของผู้ขาย</label>
                        <select id="propHoldingYears" class="airbnb-input w-full">
                            ${[1,2,3,4,5,6,7,8,9,10].map(y => `<option value="${y}" ${String(st.holdingYears) === String(y) ? 'selected' : ''}>${y} ปี (หัก คชจ. ${y === 1 ? '92%' : (y === 2 ? '84%' : (y === 3 ? '77%' : (y === 4 ? '71%' : (y === 5 ? '65%' : (y === 6 ? '60%' : (y === 7 ? '55%' : '50%'))))))})</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="font-semibold text-[var(--app-body)] block mb-1">ข้อตกลงการแบ่งจ่าย</label>
                        <select id="propSplitMode" class="airbnb-input w-full">
                            <option value="custom" ${st.splitMode === 'custom' ? 'selected' : ''}>ธรรมเนียมทั่วไป (โอนคนละครึ่ง)</option>
                            <option value="half" ${st.splitMode === 'half' ? 'selected' : ''}>คนละครึ่งทุกรายการ</option>
                            <option value="seller" ${st.splitMode === 'seller' ? 'selected' : ''}>ผู้ขายออกทั้งหมด</option>
                            <option value="buyer" ${st.splitMode === 'buyer' ? 'selected' : ''}>ผู้ซื้อออกทั้งหมด</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Price Inputs -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)]">ข้อมูลราคาทรัพย์และวงเงินจำนอง</div>
                <div>
                    <label class="text-xs font-semibold text-[var(--app-body)] block mb-1">ราคาประเมินทุนทรัพย์ของกรมที่ดิน (บาท)</label>
                    <input id="propAppraisedValue" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.appraisedValue))}" placeholder="เช่น 3,000,000" class="airbnb-input w-full">
                    <span class="text-[11px] text-[var(--app-muted)] mt-0.5 block">ใช้เป็นฐานคิดค่าธรรมเนียมโอน และภาษีเงินได้หัก ณ ที่จ่าย</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-xs font-semibold text-[var(--app-body)] block mb-1">ราคาซื้อขายจริงตามสัญญา (บาท)</label>
                        <input id="propSalePrice" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.salePrice))}" placeholder="เช่น 3,200,000" class="airbnb-input w-full">
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-[var(--app-body)] block mb-1">วงเงินกู้จดจำนอง (ป้อน 0 หากซื้อสด)</label>
                        <input id="propMortgageAmount" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.mortgageAmount))}" placeholder="เช่น 2,500,000" class="airbnb-input w-full">
                    </div>
                </div>
            </div>

            <!-- Primary Result -->
            <div class="themed-result-card theme-result-highlight p-5 text-center space-y-1">
                <div class="text-xs font-semibold text-[var(--app-muted)]">ประมาณการค่าใช้จ่ายวันโอนรวม</div>
                <div class="themed-result-value text-2xl md:text-3xl font-extrabold">${formatMoney(calc.totalLandCost)} บาท</div>
                <div class="text-xs text-[var(--app-body)]">แบ่งตามข้อตกลงการชำระที่เลือกไว้ด้านบน</div>
            </div>

            <!-- Split Summary Cards -->
            <div class="grid grid-cols-2 gap-2">
                <div class="themed-tool-card p-3 space-y-1">
                    <div class="text-xs font-bold text-[var(--app-ink)]">ผู้ซื้อต้องเตรียมชำระ</div>
                    <div class="text-lg md:text-xl font-extrabold text-[var(--app-accent)]">${formatMoney(calc.buyerCost)} บาท</div>
                    <div class="text-[11px] text-[var(--app-muted)]">
                        ${st.splitMode === 'custom' ? 'ค่าโอน 50% + ค่าจดจำนอง' : 'ตามข้อตกลงการแบ่งจ่าย'}
                    </div>
                </div>
                <div class="themed-tool-card p-3 space-y-1">
                    <div class="text-xs font-bold text-[var(--app-ink)]">ผู้ขายต้องเตรียมชำระ</div>
                    <div class="text-lg md:text-xl font-extrabold text-[var(--app-accent)]">${formatMoney(calc.sellerCost)} บาท</div>
                    <div class="text-[11px] text-[var(--app-muted)]">
                        ${st.splitMode === 'custom' ? 'ค่าโอน 50% + ภาษี อากร และหัก ณ ที่จ่าย' : 'ตามข้อตกลงการแบ่งจ่าย'}
                    </div>
                </div>
            </div>

            <!-- Detailed Breakdown Table -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)]">แจกแจงค่าใช้จ่าย ณ สำนักงานที่ดิน</div>
                <div class="overflow-x-auto thin-scroll">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr class="border-b border-[var(--app-hairline)] text-[var(--app-muted)] text-[11px]">
                                <th class="py-1.5">รายการ</th>
                                <th class="py-1.5 text-center">อัตรา</th>
                                <th class="py-1.5 text-right">ผู้ซื้อจ่าย</th>
                                <th class="py-1.5 text-right">ผู้ขายจ่าย</th>
                                <th class="py-1.5 text-right">ยอดรวม</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${calc.breakdown.map(row => `
                                <tr class="border-b border-[var(--app-hairline)]">
                                    <td class="py-2">
                                        <div class="font-medium text-[var(--app-ink)]">${row.name}</div>
                                        <div class="text-[10px] text-[var(--app-muted)]">ฐาน: ${formatMoney(row.baseAmount)} บาท</div>
                                    </td>
                                    <td class="py-2 text-center text-[var(--app-muted)] text-[11px]">${row.rateText}</td>
                                    <td class="py-2 text-right font-medium text-[var(--app-ink)]">${formatMoney(row.buyer)}</td>
                                    <td class="py-2 text-right font-medium text-[var(--app-ink)]">${formatMoney(row.seller)}</td>
                                    <td class="py-2 text-right font-bold text-[var(--app-ink)]">${formatMoney(row.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="font-extrabold border-t-2 border-[var(--app-hairline)] text-[var(--app-ink)]">
                                <td colspan="2" class="py-2 text-right">รวมยอดแบ่งจ่าย</td>
                                <td class="py-2 text-right">${formatMoney(calc.buyerCost)}</td>
                                <td class="py-2 text-right">${formatMoney(calc.sellerCost)}</td>
                                <td class="py-2 text-right text-[var(--app-accent)]">${formatMoney(calc.totalLandCost)} ฿</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="flex justify-end pt-2">
                    <button id="btnPrintPropertyTransferSummary" type="button" class="tool-action-btn text-xs">
                        พิมพ์ใบสรุปค่าโอนที่ดิน / PDF
                    </button>
                </div>
            </div>

            ${renderTransferSplitComparison(buildTransferSplitComparison(st))}
        </div>
    `;

    // Wire input sync
    const bindSelect = (id, key) => {
        document.getElementById(id)?.addEventListener('change', e => {
            st[key] = e.target.value;
            persistAppState();
            renderActiveTool();
        });
    };
    bindSelect('propGovMeasure', 'isGovMeasure');
    bindSelect('propExemptSBT', 'exemptSBT');
    bindSelect('propHoldingYears', 'holdingYears');
    bindSelect('propSplitMode', 'splitMode');

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
    bindInput('propAppraisedValue', 'appraisedValue');
    bindInput('propSalePrice', 'salePrice');
    bindInput('propMortgageAmount', 'mortgageAmount');

    container.querySelector('#btnPrintPropertyTransferSummary')?.addEventListener('click', () => {
        triggerPrintReceipt('property_transfer');
    });

    if (calc.appraisedValue <= 0) {
        setStatusBanner('empty', 'กรุณาระบุราคาประเมินทุนทรัพย์ของกรมที่ดิน');
    } else {
        setStatusBanner('success', `ค่าใช้จ่ายวันโอนรวม: <b class="text-[var(--app-accent)]">${formatMoney(calc.totalLandCost)} บาท</b> (ผู้ซื้อ: ${formatMoney(calc.buyerCost)} | ผู้ขาย: ${formatMoney(calc.sellerCost)})`);
    }
}

// Module export definitions
(function(root) {
    const exportsObj = {
        calculatePersonalTax,
        calculatePropertyTransfer,
        renderTaxPersonalTool,
        renderPropertyTransferTool
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
