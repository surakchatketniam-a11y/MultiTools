// ==============================================================
// Multitools Calculator - Quick Compare Engine (Phase 3.4)
// ==============================================================

let isCompareSlotCActive = false;
let currentCompareData = null;

function getComparisonPresets(toolId) {
    const presets = {
        loan: [
            {
                label: 'ทางเลือก 1: ดอกเบี้ย 5.0% (30 ปี)',
                state: { principal: '2,000,000', interestRate: '5.0', months: '360', extra: '0', rateType: 'fixed', calcMethod: 'reducing' }
            },
            {
                label: 'ทางเลือก 2: ดอกเบี้ย 3.8% (รีไฟแนนซ์)',
                state: { principal: '2,000,000', interestRate: '3.8', months: '360', extra: '0', rateType: 'fixed', calcMethod: 'reducing' }
            },
            {
                label: 'ทางเลือก 3: ดอกเบี้ย 5.0% + โปะ 2,000 บ./ด.',
                state: { principal: '2,000,000', interestRate: '5.0', months: '360', extra: '2,000', rateType: 'fixed', calcMethod: 'reducing' }
            }
        ],
        savings: [
            {
                label: 'ทางเลือก 1: ออม 3,000 บ./ด. ผลตอบแทน 2.5% (10 ปี)',
                state: { initial: '20,000', monthly: '3,000', interestRate: '2.5', years: '10', annualIncrease: '0', inflationRate: '2.0', mode: 'growth' }
            },
            {
                label: 'ทางเลือก 2: ออม 5,000 บ./ด. ผลตอบแทน 5.0% (10 ปี)',
                state: { initial: '20,000', monthly: '5,000', interestRate: '5.0', years: '10', annualIncrease: '0', inflationRate: '2.0', mode: 'growth' }
            },
            {
                label: 'ทางเลือก 3: ออม 7,000 บ./ด. ผลตอบแทน 7.0% (10 ปี)',
                state: { initial: '20,000', monthly: '7,000', interestRate: '7.0', years: '10', annualIncrease: '0', inflationRate: '2.0', mode: 'growth' }
            }
        ],
        vat_wht: [
            {
                label: 'ทางเลือก 1: ยอด 50,000 ไม่หัก ณ ที่จ่าย',
                state: { amount: '50,000', mode: 'before', vatRate: '7', whtRate: '0' }
            },
            {
                label: 'ทางเลือก 2: ยอด 50,000 หักบริการ 3%',
                state: { amount: '50,000', mode: 'before', vatRate: '7', whtRate: '3' }
            },
            {
                label: 'ทางเลือก 3: ยอด 50,000 หักค่าจ้าง 1%',
                state: { amount: '50,000', mode: 'before', vatRate: '7', whtRate: '1' }
            }
        ],
        salary: [
            {
                label: 'ทางเลือก 1: แผนมาตรฐาน 50/30/20',
                state: { income: '35,000', needsPct: '50', wantsPct: '30', savingsPct: '20', emergencyPct: '10', debtPct: '10' }
            },
            {
                label: 'ทางเลือก 2: แผนเน้นเงินออม 40/20/40',
                state: { income: '35,000', needsPct: '40', wantsPct: '20', savingsPct: '40', emergencyPct: '15', debtPct: '5' }
            },
            {
                label: 'ทางเลือก 3: แผนเร่งปลดหนี้ 50/20/10 (หนี้ 20%)',
                state: { income: '35,000', needsPct: '50', wantsPct: '20', savingsPct: '10', emergencyPct: '5', debtPct: '20' }
            }
        ],
        tax_personal: [
            {
                label: 'ทางเลือก 1: รายได้ล้วน (ไม่ลดหย่อนเพิ่ม)',
                state: { salaryMonthly: '60000', bonusYearly: '60000', withholdingTax: '15000', socialSecurity: '9000', lifeInsurance: '0', healthInsurance: '0', ssf: '0', rmf: '0', thaiEsg: '0' }
            },
            {
                label: 'ทางเลือก 2: ลดหย่อนประกัน (ชีวิต+สุขภาพ)',
                state: { salaryMonthly: '60000', bonusYearly: '60000', withholdingTax: '15000', socialSecurity: '9000', lifeInsurance: '50000', healthInsurance: '15000', ssf: '0', rmf: '0', thaiEsg: '0' }
            },
            {
                label: 'ทางเลือก 3: ลดหย่อนเต็มที่ (+SSF 50k +ThaiESG 30k)',
                state: { salaryMonthly: '60000', bonusYearly: '60000', withholdingTax: '15000', socialSecurity: '9000', lifeInsurance: '50000', healthInsurance: '15000', ssf: '50000', rmf: '0', thaiEsg: '30000' }
            }
        ],
        property_transfer: [
            {
                label: 'ทางเลือก 1: อัตราปกติ (ถือครอง 3 ปี เสียธุรกิจเฉพาะ 3.3%)',
                state: { appraisedValue: '3000000', salePrice: '3200000', mortgageAmount: '2500000', holdingYears: '3', exemptSBT: 'no', isGovMeasure: 'standard', splitMode: 'custom' }
            },
            {
                label: 'ทางเลือก 2: ถือครอง 5 ปี (ยกเว้นธุรกิจเฉพาะ เสียอากร 0.5%)',
                state: { appraisedValue: '3000000', salePrice: '3200000', mortgageAmount: '2500000', holdingYears: '5', exemptSBT: 'yes', isGovMeasure: 'standard', splitMode: 'custom' }
            },
            {
                label: 'ทางเลือก 3: มาตรการลดหย่อนรัฐ (โอน 0.01% จำนอง 0.01%)',
                state: { appraisedValue: '3000000', salePrice: '3200000', mortgageAmount: '2500000', holdingYears: '5', exemptSBT: 'yes', isGovMeasure: 'reduced', splitMode: 'custom' }
            }
        ],
        gold_thai: [
            {
                label: 'ทางเลือก 1: ซื้อทองคำแท่ง 1 บาท (ไม่มีกำเหน็จ)',
                state: { mode: 'buy', goldType: 'bar', weightUnit: 'baht', weightValue: '1', craftFee: '0', priceBarBuy: '43900', priceBarSell: '44000', priceOrnamentBuy: '43115', priceOrnamentSell: '44500' }
            },
            {
                label: 'ทางเลือก 2: ซื้อทองรูปพรรณ 1 บาท (กำเหน็จ 800 บ.)',
                state: { mode: 'buy', goldType: 'ornament', weightUnit: 'baht', weightValue: '1', craftFee: '800', priceBarBuy: '43900', priceBarSell: '44000', priceOrnamentBuy: '43115', priceOrnamentSell: '44500' }
            },
            {
                label: 'ทางเลือก 3: ซื้อทองรูปพรรณ 2 สลึง (กำเหน็จ 600 บ.)',
                state: { mode: 'buy', goldType: 'ornament', weightUnit: 'salung', weightValue: '2', craftFee: '600', priceBarBuy: '43900', priceBarSell: '44000', priceOrnamentBuy: '43115', priceOrnamentSell: '44500' }
            }
        ],
        electricity_bill: [
            {
                label: 'ทางเลือก 1: ใช้ไฟ 250 หน่วย/ด. (บ้านทั่วไป)',
                state: { mode: 'bill', tariffType: 'type1_2', units: '250', ftRate: '0.3972' }
            },
            {
                label: 'ทางเลือก 2: ใช้ไฟ 400 หน่วย/ด. (เปิดแอร์หน้าร้อน)',
                state: { mode: 'bill', tariffType: 'type1_2', units: '400', ftRate: '0.3972' }
            },
            {
                label: 'ทางเลือก 3: ใช้ไฟ 600 หน่วย/ด. (บ้านขนาดใหญ่)',
                state: { mode: 'bill', tariffType: 'type1_2', units: '600', ftRate: '0.3972' }
            }
        ],
        car_loan: [
            {
                label: 'ทางเลือก 1: ผ่อน 48 งวด (4 ปี) ดอกเบี้ย 2.39%',
                state: { vehicleType: 'car', condition: 'new', price: '850000', downPaymentType: 'percent', downPaymentValue: '25', interestRate: '2.39', periodMonths: '48', payoffMonth: '24' }
            },
            {
                label: 'ทางเลือก 2: ผ่อน 60 งวด (5 ปี) ดอกเบี้ย 2.59%',
                state: { vehicleType: 'car', condition: 'new', price: '850000', downPaymentType: 'percent', downPaymentValue: '25', interestRate: '2.59', periodMonths: '60', payoffMonth: '30' }
            },
            {
                label: 'ทางเลือก 3: ผ่อน 72 งวด (6 ปี) ดอกเบี้ย 2.99%',
                state: { vehicleType: 'car', condition: 'new', price: '850000', downPaymentType: 'percent', downPaymentValue: '25', interestRate: '2.99', periodMonths: '72', payoffMonth: '36' }
            }
        ],
        social_security: [
            {
                label: 'ทางเลือก 1: ม.33 ส่ง 15 ปี (180 งวด) ฐาน 15,000 บ.',
                state: { section: 'm33', wageMonthly: '35000', contributionMonths: '180', m40Plan: 'plan2', m40ExtraSavings: '0' }
            },
            {
                label: 'ทางเลือก 2: ม.33 ส่ง 20 ปี (240 งวด) ฐาน 15,000 บ.',
                state: { section: 'm33', wageMonthly: '35000', contributionMonths: '240', m40Plan: 'plan2', m40ExtraSavings: '0' }
            },
            {
                label: 'ทางเลือก 3: ม.33 ส่ง 25 ปี (300 งวด) ฐาน 15,000 บ.',
                state: { section: 'm33', wageMonthly: '35000', contributionMonths: '300', m40Plan: 'plan2', m40ExtraSavings: '0' }
            }
        ]
    };
    return presets[toolId] || [];
}

function compareCalculations(toolId, itemsList) {
    const items = (Array.isArray(itemsList) ? itemsList : []).filter(Boolean);
    if (items.length < 2) return null;

    const toolMeta = (typeof TOOLS_CATALOG !== 'undefined' ? TOOLS_CATALOG.find(t => t.id === toolId) : null) || { menuTitle: toolId, headerTitle: toolId };
    const toolTitle = toolMeta.menuTitle || toolMeta.headerTitle;

    const rows = [];
    let deltaSummary = '';
    let winnerIndex = -1;

    if (toolId === 'loan') {
        const results = items.map(item => {
            const st = item.state || {};
            const P = numberOrDefault(st.principal, 0);
            const rate = numberOrDefault(st.interestRate, 0);
            const months = integerOrDefault(st.months, 0);
            const extra = numberOrDefault(st.extra, 0);
            const schedule = generateLoanSchedule(st);
            const monthlyPay = schedule[0]?.payment || 0;
            const totalPaid = schedule.reduce((sum, r) => sum + r.payment, 0);
            const totalInterest = schedule.reduce((sum, r) => sum + r.interest, 0);
            const actualMonths = schedule.length;
            return { P, rate, months, extra, monthlyPay, totalPaid, totalInterest, actualMonths };
        });

        rows.push({
            label: 'วงเงินกู้ (Principal)',
            values: results.map(r => `${formatMoney(r.P)} ฿`)
        });
        rows.push({
            label: 'อัตราดอกเบี้ยต่อปี',
            values: results.map(r => `${r.rate}%`)
        });
        rows.push({
            label: 'ระยะเวลาสัญญา',
            values: results.map(r => `${r.months} เดือน (${(r.months / 12).toFixed(1)} ปี)`)
        });
        rows.push({
            label: 'ยอดโปะเพิ่มรายเดือน',
            values: results.map(r => r.extra > 0 ? `+${formatMoney(r.extra)} ฿` : 'ไม่มี')
        });
        rows.push({
            label: 'ค่างวดผ่อนต่อเดือน',
            values: results.map(r => `${formatMoney(r.monthlyPay)} ฿/ด.`),
            bestIndex: results.indexOf(results.reduce((min, cur) => cur.monthlyPay < min.monthlyPay ? cur : min, results[0]))
        });
        const minInterestResult = results.reduce((min, cur) => cur.totalInterest < min.totalInterest ? cur : min, results[0]);
        const bestInterestIdx = results.indexOf(minInterestResult);
        rows.push({
            label: 'ดอกเบี้ยรวมตลอดสัญญา',
            values: results.map(r => `${formatMoney(r.totalInterest)} ฿`),
            bestIndex: bestInterestIdx,
            highlight: true
        });
        rows.push({
            label: 'ยอดผ่อนชำระรวมทั้งหมด',
            values: results.map(r => `${formatMoney(r.totalPaid)} ฿`),
            bestIndex: bestInterestIdx
        });
        rows.push({
            label: 'ระยะเวลาผ่อนหมดจริง',
            values: results.map(r => `${r.actualMonths} งวด (${(r.actualMonths / 12).toFixed(1)} ปี)`),
            bestIndex: results.indexOf(results.reduce((min, cur) => cur.actualMonths < min.actualMonths ? cur : min, results[0]))
        });

        winnerIndex = bestInterestIdx;
        const winnerItem = items[winnerIndex];
        const worstInterest = Math.max(...results.map(r => r.totalInterest));
        const savedInterest = worstInterest - minInterestResult.totalInterest;

        deltaSummary = `🏆 ทางเลือกที่คุ้มค่าที่สุดคือ "${winnerItem.label}" ประหยัดดอกเบี้ยได้สูงสุด ${formatMoney(savedInterest)} บาท เมื่อเทียบกับทางเลือกที่ดอกเบี้ยสูงสุด`;

    } else if (toolId === 'savings') {
        const results = items.map(item => {
            const st = item.state || {};
            const init = numberOrDefault(st.initial, 0);
            const monthly = numberOrDefault(st.monthly, 0);
            const rate = numberOrDefault(st.interestRate, 0);
            const years = numberOrDefault(st.years, 0);
            const scheduleData = generateSavingsSchedule(st);
            const totalBal = scheduleData.totalBalance || 0;
            const totalPrin = scheduleData.totalPrincipal || 0;
            const interestEarned = scheduleData.interestEarned || 0;
            const inflationRate = numberOrDefault(st.inflationRate, 0);
            const realValue = totalBal / Math.pow(1 + inflationRate / 100, years || 1);
            return { init, monthly, rate, years, totalBal, totalPrin, interestEarned, realValue };
        });

        rows.push({
            label: 'เงินต้นเริ่มต้น',
            values: results.map(r => `${formatMoney(r.init)} ฿`)
        });
        rows.push({
            label: 'เงินออมต่อเดือน',
            values: results.map(r => `${formatMoney(r.monthly)} ฿/ด.`)
        });
        rows.push({
            label: 'ผลตอบแทนคาดหวัง',
            values: results.map(r => `${r.rate}%`)
        });
        rows.push({
            label: 'ระยะเวลาการออม',
            values: results.map(r => `${r.years} ปี`)
        });
        rows.push({
            label: 'เงินต้นสะสมที่ฝาก',
            values: results.map(r => `${formatMoney(r.totalPrin)} ฿`)
        });
        const maxEarnedResult = results.reduce((max, cur) => cur.interestEarned > max.interestEarned ? cur : max, results[0]);
        const bestEarnedIdx = results.indexOf(maxEarnedResult);
        rows.push({
            label: 'ดอกเบี้ย / กำไรสะสม',
            values: results.map(r => `+${formatMoney(r.interestEarned)} ฿`),
            bestIndex: bestEarnedIdx,
            highlight: true
        });
        const maxBalResult = results.reduce((max, cur) => cur.totalBal > max.totalBal ? cur : max, results[0]);
        const bestBalIdx = results.indexOf(maxBalResult);
        rows.push({
            label: 'มูลค่าเงินออมรวมสุทธิ',
            values: results.map(r => `${formatMoney(r.totalBal)} ฿`),
            bestIndex: bestBalIdx,
            highlight: true
        });
        rows.push({
            label: 'มูลค่าจริงหลังหักเงินเฟ้อ',
            values: results.map(r => `${formatMoney(r.realValue)} ฿`),
            bestIndex: results.indexOf(results.reduce((max, cur) => cur.realValue > max.realValue ? cur : max, results[0]))
        });

        winnerIndex = bestBalIdx;
        const winnerItem = items[winnerIndex];
        const minBal = Math.min(...results.map(r => r.totalBal));
        const diffBal = maxBalResult.totalBal - minBal;

        deltaSummary = `🏆 ทางเลือกที่สร้างความมั่งคั่งได้สูงสุดคือ "${winnerItem.label}" ได้รับเงินออมรวมมากกว่าถึง ${formatMoney(diffBal)} บาท`;

    } else if (toolId === 'vat_wht') {
        const results = items.map(item => {
            const st = item.state || {};
            const amount = parseNumericInput(String(st.amount ?? '').replace(/,/g, ''));
            const vat = numberOrDefault(st.vatRate, 0);
            const wht = numberOrDefault(st.whtRate, 0);
            const base = Number.isFinite(amount) ? (st.mode === 'after' ? amount / (1 + vat / 100) : amount) : 0;
            const vatAmount = base * vat / 100;
            const gross = base + vatAmount;
            const whtAmount = base * wht / 100;
            const net = gross - whtAmount;
            return { amount, vat, wht, base, vatAmount, gross, whtAmount, net };
        });

        rows.push({
            label: 'ยอดเงินก่อน VAT',
            values: results.map(r => `${formatMoney(r.base)} ฿`)
        });
        rows.push({
            label: 'อัตรา VAT',
            values: results.map(r => `${r.vat}% (+${formatMoney(r.vatAmount)} ฿)`)
        });
        rows.push({
            label: 'หัก ณ ที่จ่าย',
            values: results.map(r => `${r.wht}% (-${formatMoney(r.whtAmount)} ฿)`)
        });
        rows.push({
            label: 'ยอดโอนสุทธิ (Net Payable)',
            values: results.map(r => `${formatMoney(r.net)} ฿`),
            highlight: true
        });

        winnerIndex = 0;
        deltaSummary = `สรุปเปรียบเทียบยอดโอนสุทธิระหว่าง ${items.map(i => i.label).join(' vs ')}`;

    } else if (toolId === 'salary') {
        const results = items.map(item => {
            const st = item.state || {};
            const income = numberOrDefault(st.income, 0);
            const needsPct = numberOrDefault(st.needsPct, 0);
            const wantsPct = numberOrDefault(st.wantsPct, 0);
            const savingsPct = numberOrDefault(st.savingsPct, 0);
            const needs = income * needsPct / 100;
            const wants = income * wantsPct / 100;
            const savings = income * savingsPct / 100;
            return { income, needsPct, wantsPct, savingsPct, needs, wants, savings };
        });

        rows.push({
            label: 'เงินเดือนสุทธิ',
            values: results.map(r => `${formatMoney(r.income)} ฿/ด.`)
        });
        rows.push({
            label: 'ค่าใช้จ่ายจำเป็น (Needs)',
            values: results.map(r => `${r.needsPct}% (${formatMoney(r.needs)} ฿)`)
        });
        rows.push({
            label: 'ความต้องการ (Wants)',
            values: results.map(r => `${r.wantsPct}% (${formatMoney(r.wants)} ฿)`)
        });
        const bestSavingsResult = results.reduce((max, cur) => cur.savings > max.savings ? cur : max, results[0]);
        const bestSavingsIdx = results.indexOf(bestSavingsResult);
        rows.push({
            label: 'เงินออม & ลงทุน (Savings)',
            values: results.map(r => `${r.savingsPct}% (${formatMoney(r.savings)} ฿)`),
            bestIndex: bestSavingsIdx,
            highlight: true
        });

        winnerIndex = bestSavingsIdx;
        deltaSummary = `🏆 แผนที่มีสัดส่วนเงินออมและลงทุนสูงสุดคือ "${items[winnerIndex].label}" ออมได้ ${formatMoney(bestSavingsResult.savings)} บาท/เดือน (${formatMoney(bestSavingsResult.savings * 12)} บาท/ปี)`;

    } else if (toolId === 'tax_personal') {
        const results = items.map(item => {
            const st = item.state || {};
            const calc = (typeof calculatePersonalTax === 'function')
                ? calculatePersonalTax(st)
                : { grossIncome: 0, totalDeductions: 0, netTaxableIncome: 0, marginalRate: 0, totalTax: 0, isRefund: false, refundAmount: 0, payableAmount: 0 };
            return calc;
        });

        rows.push({
            label: 'รายได้รวมทั้งปี (Gross Income)',
            values: results.map(r => `${formatMoney(r.grossIncome)} ฿`)
        });
        rows.push({
            label: 'ค่าลดหย่อนรวม (Deductions)',
            values: results.map(r => `${formatMoney(r.totalDeductions)} ฿`)
        });
        rows.push({
            label: 'เงินได้สุทธิ (Taxable Income)',
            values: results.map(r => `${formatMoney(r.netTaxableIncome)} ฿`)
        });
        rows.push({
            label: 'ฐานภาษีสูงสุด (Marginal Rate)',
            values: results.map(r => `${r.marginalRate}%`)
        });

        const minTaxRes = results.reduce((min, cur) => cur.totalTax < min.totalTax ? cur : min, results[0]);
        const minTaxIdx = results.indexOf(minTaxRes);
        rows.push({
            label: 'ภาษีทั้งปีที่คำนวณได้',
            values: results.map(r => `${formatMoney(r.totalTax)} ฿`),
            bestIndex: minTaxIdx,
            highlight: true
        });
        rows.push({
            label: 'ยอดชำระเพิ่ม / ได้เงินคืน (Refund)',
            values: results.map(r => r.isRefund ? `คืน ${formatMoney(r.refundAmount)} ฿` : (r.payableAmount > 0 ? `จ่ายเพิ่ม ${formatMoney(r.payableAmount)} ฿` : 'พอดี 0 ฿'))
        });

        winnerIndex = minTaxIdx;
        const maxTax = Math.max(...results.map(r => r.totalTax));
        const diffTax = maxTax - minTaxRes.totalTax;
        deltaSummary = `🏆 ทางเลือกที่ช่วยประหยัดภาษีได้สูงสุดคือ "${items[winnerIndex].label}" เสียภาษีเพียง ${formatMoney(minTaxRes.totalTax)} บาท${diffTax > 0 ? ` (ประหยัดกว่าทางเลือกอื่นสูงสุด ${formatMoney(diffTax)} บาท)` : ''}`;

    } else if (toolId === 'property_transfer') {
        const results = items.map(item => {
            const st = item.state || {};
            const calc = (typeof calculatePropertyTransfer === 'function')
                ? calculatePropertyTransfer(st)
                : { appraisedValue: 0, transferFee: 0, mortgageFee: 0, sbtTax: 0, stampDuty: 0, withholdingTax: 0, totalLandCost: 0, buyerCost: 0, sellerCost: 0, isSBT: true };
            return calc;
        });

        rows.push({
            label: 'ราคาประเมินกรมที่ดิน',
            values: results.map(r => `${formatMoney(r.appraisedValue)} ฿`)
        });
        rows.push({
            label: 'ค่าธรรมเนียมโอนกรรมสิทธิ์',
            values: results.map(r => `${formatMoney(r.transferFee)} ฿`)
        });
        rows.push({
            label: 'ค่าจดทะเบียนจำนอง',
            values: results.map(r => `${formatMoney(r.mortgageFee)} ฿`)
        });
        rows.push({
            label: 'ภาษีธุรกิจเฉพาะ / อากรแสตมป์',
            values: results.map(r => `${formatMoney(r.isSBT ? r.sbtTax : r.stampDuty)} ฿ (${r.isSBT ? '3.3%' : '0.5%'})`)
        });
        rows.push({
            label: 'ภาษีเงินได้หัก ณ ที่จ่าย',
            values: results.map(r => `${formatMoney(r.withholdingTax)} ฿`)
        });

        const minCostRes = results.reduce((min, cur) => cur.totalLandCost < min.totalLandCost ? cur : min, results[0]);
        const minCostIdx = results.indexOf(minCostRes);
        rows.push({
            label: 'ยอดรวมค่าใช้จ่าย ณ กรมที่ดิน',
            values: results.map(r => `${formatMoney(r.totalLandCost)} ฿`),
            bestIndex: minCostIdx,
            highlight: true
        });
        rows.push({
            label: 'ยอดที่ผู้ซื้อจ่าย',
            values: results.map(r => `${formatMoney(r.buyerCost)} ฿`)
        });
        rows.push({
            label: 'ยอดที่ผู้ขายจ่าย',
            values: results.map(r => `${formatMoney(r.sellerCost)} ฿`)
        });

        winnerIndex = minCostIdx;
        const maxCost = Math.max(...results.map(r => r.totalLandCost));
        const diffCost = maxCost - minCostRes.totalLandCost;
        deltaSummary = `🏆 ทางเลือกที่มีค่าใช้จ่ายวันโอนรวมต่ำที่สุดคือ "${items[winnerIndex].label}" ยอดรวมเพียง ${formatMoney(minCostRes.totalLandCost)} บาท${diffCost > 0 ? ` (ประหยัดได้ถึง ${formatMoney(diffCost)} บาท)` : ''}`;

    } else if (toolId === 'gold_thai') {
        const results = items.map(item => {
            const st = item.state || {};
            const calc = (typeof calculateGoldThai === 'function')
                ? calculateGoldThai(st)
                : { goldType: 'ornament', bahtWeight: 1, totalGrams: 15.16, rawGoldValue: 0, craftFee: 0, totalBuyPrice: 0, sellBackValue: 0, deductionFromSellPrice: 0 };
            return calc;
        });

        rows.push({
            label: 'ประเภททองคำ',
            values: results.map(r => r.goldType === 'bar' ? 'ทองคำแท่ง (96.5%)' : 'ทองรูปพรรณ (96.5%)')
        });
        rows.push({
            label: 'น้ำหนักคำนวณ',
            values: results.map(r => `${formatNum(r.bahtWeight, 2)} บาท (${formatNum(r.totalGrams, 2)} g)`)
        });
        rows.push({
            label: 'มูลค่าเนื้อทองคำ',
            values: results.map(r => `${formatMoney(r.rawGoldValue)} ฿`)
        });
        rows.push({
            label: 'ค่ากำเหน็จ',
            values: results.map(r => `${formatMoney(r.craftFee)} ฿`)
        });

        const minBuyRes = results.reduce((min, cur) => cur.totalBuyPrice < min.totalBuyPrice ? cur : min, results[0]);
        const minBuyIdx = results.indexOf(minBuyRes);

        rows.push({
            label: 'ราคาซื้อสุทธิหน้าร้าน',
            values: results.map(r => `${formatMoney(r.totalBuyPrice)} ฿`),
            bestIndex: minBuyIdx,
            highlight: true
        });
        rows.push({
            label: 'ราคารับซื้อคืนขั้นต่ำ (สคบ.)',
            values: results.map(r => `${formatMoney(r.sellBackValue)} ฿`)
        });
        rows.push({
            label: 'ส่วนต่างค่าธรรมเนียม/กำเหน็จ',
            values: results.map(r => `-${formatMoney(r.deductionFromSellPrice)} ฿`)
        });

        winnerIndex = minBuyIdx;
        deltaSummary = `🏆 ทางเลือกที่ใช้เงินซื้อน้อยที่สุดคือ "${items[winnerIndex].label}" ยอดสุทธิ ${formatMoney(minBuyRes.totalBuyPrice)} บาท (น้ำหนัก ${formatNum(minBuyRes.bahtWeight, 2)} บาททอง)`;

    } else if (toolId === 'electricity_bill') {
        const results = items.map(item => {
            const st = item.state || {};
            const calc = (typeof calculateElectricityBill === 'function')
                ? calculateElectricityBill(st)
                : { units: 0, tariffType: 'type1_2', baseEnergyCharge: 0, serviceFee: 0, ftCharge: 0, vat7: 0, totalBill: 0, avgRatePerUnit: 0 };
            return calc;
        });

        rows.push({
            label: 'จำนวนหน่วยไฟฟ้าที่ใช้',
            values: results.map(r => `${formatNum(r.units, 0)} หน่วย (kWh)`)
        });
        rows.push({
            label: 'ประเภทบ้านอยู่อาศัย',
            values: results.map(r => r.tariffType === 'type1_1' ? 'ประเภท 1.1 (<=150)' : 'ประเภท 1.2 (>150)')
        });
        rows.push({
            label: 'ค่าไฟฟ้าฐานตามขั้นบันได',
            values: results.map(r => `${formatMoney(r.baseEnergyCharge)} ฿`)
        });
        rows.push({
            label: 'ค่าบริการรายเดือน',
            values: results.map(r => `${formatMoney(r.serviceFee)} ฿`)
        });
        rows.push({
            label: 'ค่าไฟฟ้าผันแปร (Ft)',
            values: results.map(r => `${formatMoney(r.ftCharge)} ฿`)
        });
        rows.push({
            label: 'ภาษีมูลค่าเพิ่ม (VAT 7%)',
            values: results.map(r => `${formatMoney(r.vat7)} ฿`)
        });

        const minBillRes = results.reduce((min, cur) => cur.totalBill < min.totalBill ? cur : min, results[0]);
        const minBillIdx = results.indexOf(minBillRes);

        rows.push({
            label: 'ยอดค่าไฟฟ้ารวมสุทธิ',
            values: results.map(r => `${formatMoney(r.totalBill)} ฿`),
            bestIndex: minBillIdx,
            highlight: true
        });
        rows.push({
            label: 'อัตราค่าไฟฟ้าเฉลี่ยต่อหน่วย',
            values: results.map(r => `${formatNum(r.avgRatePerUnit, 2)} ฿/หน่วย`)
        });

        winnerIndex = minBillIdx;
        const maxBill = Math.max(...results.map(r => r.totalBill));
        const diffBill = maxBill - minBillRes.totalBill;
        deltaSummary = `🏆 ทางเลือกที่มียอดค่าไฟฟ้ารวมต่ำที่สุดคือ "${items[winnerIndex].label}" ยอดสุทธิเพียง ${formatMoney(minBillRes.totalBill)} บาท${diffBill > 0 ? ` (ประหยัดได้ ${formatMoney(diffBill)} บาท/เดือน)` : ''}`;

    } else if (toolId === 'car_loan') {
        const results = items.map(item => {
            const st = item.state || {};
            const calc = (typeof calculateCarLoan === 'function')
                ? calculateCarLoan(st)
                : { price: 0, downPaymentAmount: 0, downPaymentPercent: 0, principal: 0, interestRate: 0, periodMonths: 0, years: 0, monthlyPayment: 0, totalRepayment: 0, totalInterest: 0, effectiveRateApprox: 0, totalPayoffAmount: 0, totalSavedByEarlyPayoff: 0, discountTierPercent: 0 };
            return calc;
        });

        rows.push({
            label: 'ราคารถยนต์ / ยานพาหนะ',
            values: results.map(r => `${formatMoney(r.price)} ฿`)
        });
        rows.push({
            label: 'เงินดาวน์ (Down Payment)',
            values: results.map(r => `${formatMoney(r.downPaymentAmount)} ฿ (${formatNum(r.downPaymentPercent, 1)}%)`)
        });
        rows.push({
            label: 'ยอดจัดเช่าซื้อ (Principal)',
            values: results.map(r => `${formatMoney(r.principal)} ฿`)
        });
        rows.push({
            label: 'อัตราดอกเบี้ย Flat Rate (ต่อปี)',
            values: results.map(r => `${formatNum(r.interestRate, 2)}% (EIR ≈ ${formatNum(r.effectiveRateApprox, 2)}%)`)
        });
        rows.push({
            label: 'ระยะเวลาผ่อนชำระ',
            values: results.map(r => `${r.periodMonths} งวด (${r.years} ปี)`)
        });
        rows.push({
            label: 'ดอกเบี้ยรวมตลอดสัญญา',
            values: results.map(r => `${formatMoney(r.totalInterest)} ฿`)
        });
        rows.push({
            label: 'ค่างวดผ่อนชำระรายเดือน',
            values: results.map(r => `${formatMoney(r.monthlyPayment)} ฿/งวด`)
        });

        const minRepaymentRes = results.reduce((min, cur) => cur.totalRepayment < min.totalRepayment ? cur : min, results[0]);
        const minRepaymentIdx = results.indexOf(minRepaymentRes);

        rows.push({
            label: 'ยอดผ่อนชำระรวมทั้งสัญญา',
            values: results.map(r => `${formatMoney(r.totalRepayment)} ฿`),
            bestIndex: minRepaymentIdx,
            highlight: true
        });
        rows.push({
            label: 'ส่วนลดดอกเบี้ยปิดบัญชี (งวดที่กำหนด)',
            values: results.map(r => `${formatMoney(r.totalSavedByEarlyPayoff)} ฿ (${r.discountTierPercent}%)`)
        });

        winnerIndex = minRepaymentIdx;
        const maxRepayment = Math.max(...results.map(r => r.totalRepayment));
        const diffRepayment = maxRepayment - minRepaymentRes.totalRepayment;
        deltaSummary = `🏆 ทางเลือกที่มียอดผ่อนชำระรวมต่ำที่สุดคือ "${items[winnerIndex].label}" ยอดรวมเพียง ${formatMoney(minRepaymentRes.totalRepayment)} บาท${diffRepayment > 0 ? ` (ประหยัดกว่าทางเลือกอื่น ${formatMoney(diffRepayment)} บาท)` : ''}`;

    } else if (toolId === 'social_security') {
        const results = items.map(item => {
            const st = item.state || {};
            const calc = (typeof calculateSocialSecurity === 'function')
                ? calculateSocialSecurity(st)
                : { section: 'm33', cappedWage: 0, contributionMonths: 0, yearsContributed: 0, monthlyContribution: 0, totalWorkerContributed: 0, isPension: true, pensionRatePercent: 0, monthlyPension: 0, yearlyPension: 0, lumpSumTotal: 0, totalFundAccumulated: 0 };
            return calc;
        });

        rows.push({
            label: 'สิทธิผู้ประกันตน',
            values: results.map(r => r.section === 'm39' ? 'ม.39' : (r.section === 'm40' ? 'ม.40' : 'ม.33'))
        });
        rows.push({
            label: 'ฐานค่าจ้างในการคำนวณ',
            values: results.map(r => `${formatMoney(r.cappedWage)} ฿`)
        });
        rows.push({
            label: 'จำนวนเดือนที่ส่งเงินสมทบ',
            values: results.map(r => `${r.contributionMonths} งวด (${formatNum(r.yearsContributed, 1)} ปี)`)
        });
        rows.push({
            label: 'เงินสมทบผู้ประกันตนจ่ายต่อเดือน',
            values: results.map(r => `${formatMoney(r.monthlyContribution)} ฿`)
        });
        rows.push({
            label: 'รวมเงินสมทบที่จ่ายสะสม',
            values: results.map(r => `${formatMoney(r.totalWorkerContributed)} ฿`)
        });
        rows.push({
            label: 'รูปแบบสิทธิประโยชน์ชราภาพ',
            values: results.map(r => r.isPension ? `บำนาญตลอดชีพ (${formatNum(r.pensionRatePercent, 1)}%)` : 'บำเหน็จเงินก้อน')
        });

        const pensionCandidates = results.filter(r => r.isPension);
        if (pensionCandidates.length > 0) {
            const maxPensionRes = pensionCandidates.reduce((max, cur) => cur.monthlyPension > max.monthlyPension ? cur : max, pensionCandidates[0]);
            const maxPensionIdx = results.indexOf(maxPensionRes);

            rows.push({
                label: 'เงินบำนาญชราภาพรายเดือน (ตลอดชีพ)',
                values: results.map(r => r.isPension ? `${formatMoney(r.monthlyPension)} ฿/ด.` : '-'),
                bestIndex: maxPensionIdx,
                highlight: true
            });
            rows.push({
                label: 'เงินบำนาญสะสมต่อปี',
                values: results.map(r => r.isPension ? `${formatMoney(r.yearlyPension)} ฿/ปี` : '-')
            });

            winnerIndex = maxPensionIdx;
            const minPension = Math.min(...pensionCandidates.map(r => r.monthlyPension));
            const diffPension = maxPensionRes.monthlyPension - minPension;
            deltaSummary = `🏆 ทางเลือกที่ได้รับเงินบำนาญชราภาพรายเดือนสูงสุดคือ "${items[winnerIndex].label}" ได้รับ ${formatMoney(maxPensionRes.monthlyPension)} บาท/เดือนตลอดชีพ${diffPension > 0 ? ` (มากกว่าทางเลือกอื่น ${formatMoney(diffPension)} บาท/เดือน)` : ''}`;
        } else {
            const maxLumpRes = results.reduce((max, cur) => cur.lumpSumTotal > max.lumpSumTotal ? cur : max, results[0]);
            const maxLumpIdx = results.indexOf(maxLumpRes);

            rows.push({
                label: 'เงินบำเหน็จชราภาพ (รับก้อนเดียว)',
                values: results.map(r => `${formatMoney(r.lumpSumTotal)} ฿`),
                bestIndex: maxLumpIdx,
                highlight: true
            });

            winnerIndex = maxLumpIdx;
            deltaSummary = `🏆 ทางเลือกที่ได้รับเงินบำเหน็จชราภาพสูงสุดคือ "${items[winnerIndex].label}" ได้รับ ${formatMoney(maxLumpRes.lumpSumTotal)} บาท`;
        }

    } else {
        rows.push({
            label: 'สรุปผลการคำนวณ',
            values: items.map(item => item.shortSummary || item.label || '-')
        });
        deltaSummary = `เปรียบเทียบข้อมูล ${items.length} ทางเลือก`;
    }

    return {
        toolId,
        toolTitle,
        items,
        rows,
        deltaSummary,
        winnerIndex
    };
}

function generateComparePrintHTML(compData) {
    if (!compData || !compData.items) return '';
    const now = new Date();
    const dateStr = formatThaiFormalDate(now);
    const refCode = 'CMP-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const headersHTML = compData.items.map((item, idx) => `
        <th style="padding: 10px; text-align: right; background: ${idx === compData.winnerIndex ? '#ecfdf5' : '#f8fafc'}; color: ${idx === compData.winnerIndex ? '#065f46' : '#0f172a'}; border-left: 1px solid #cbd5e1;">
            <div style="font-size: 13px; font-weight: 700;">${escapeHTML(item.label || ('ทางเลือก ' + (idx + 1)))}</div>
            ${idx === compData.winnerIndex ? '<span style="display:inline-block; font-size:10px; font-weight:700; color:#047857; background:#d1fae5; border-radius:4px; padding:1px 6px; margin-top:3px;">🏆 คุ้มค่าที่สุด</span>' : ''}
        </th>
    `).join('');

    const rowsHTML = compData.rows.map((row, rIdx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; background: ${row.highlight ? (rIdx % 2 === 0 ? '#f0fdf4' : '#ecfdf5') : (rIdx % 2 === 0 ? '#ffffff' : '#f8fafc')};">
            <td style="padding: 8px 10px; font-weight: ${row.highlight ? '700' : '500'}; color: ${row.highlight ? '#065f46' : '#334155'}; width: 34%;">
                ${escapeHTML(row.label)}
            </td>
            ${row.values.map((val, vIdx) => `
                <td style="padding: 8px 10px; text-align: right; font-weight: ${vIdx === row.bestIndex ? '800' : '600'}; color: ${vIdx === row.bestIndex ? '#047857' : '#0f172a'}; border-left: 1px solid #e2e8f0;">
                    ${escapeHTML(val)} ${vIdx === row.bestIndex ? '✓' : ''}
                </td>
            `).join('')}
        </tr>
    `).join('');

    return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Sarabun', 'Noto Sans Thai', sans-serif; color: #1e293b; line-height: 1.5; padding: 12px 16px; max-width: 800px; margin: 0 auto; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="display: inline-block; width: 26px; height: 26px; background: #0f172a; color: #fff; font-weight: 800; border-radius: 5px; text-align: center; line-height: 26px; font-size: 14px;">M</span>
                        <span style="font-size: 18px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">MULTITOOLS AIO</span>
                    </div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">ตารางวิเคราะห์และเปรียบเทียบชุดคำนวณ (Side-by-Side Comparison Matrix)</div>
                </div>
                <div style="text-align: right; font-size: 11px; color: #475569;">
                    <div style="font-weight: 700; color: #0f172a; font-size: 12px;">เอกสารเปรียบเทียบทางการ</div>
                    <div>รหัสเอกสาร: <span style="font-family: monospace; font-weight: 600;">${refCode}</span></div>
                    <div>วันที่ออกเอกสาร: ${dateStr}</div>
                </div>
            </div>

            <div style="text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 16px;">
                <h1 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">รายงานเปรียบเทียบ: ${escapeHTML(compData.toolTitle)}</h1>
                <div style="font-size: 11px; color: #64748b; margin-top: 3px;">วิเคราะห์ทางเลือกคู่ขนาน ${compData.items.length} รูปแบบ</div>
            </div>

            ${compData.deltaSummary ? `
                <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 12px; color: #065f46; font-weight: 600; line-height: 1.6;">
                    ${escapeHTML(compData.deltaSummary)}
                </div>
            ` : ''}

            <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
                <thead>
                    <tr style="border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
                        <th style="padding: 10px; text-align: left; background: #f1f5f9; color: #334155;">คุณสมบัติ / ค่าตัวเลข</th>
                        ${headersHTML}
                    </tr>
                </thead>
                <tbody>
                    ${rowsHTML}
                </tbody>
            </table>

            <div style="margin-top: 24px; padding-top: 14px; border-top: 1px dashed #cbd5e1; font-size: 10.5px; color: #64748b;" class="print-keep-together">
                <div style="margin-bottom: 20px; line-height: 1.6;">
                    <b>หมายเหตุ:</b> ตารางเปรียบเทียบนี้จัดทำขึ้นโดยอัตโนมัติจากโปรแกรม Multitools AIO เพื่อใช้เป็นข้อมูลเบื้องต้นในการเปรียบเทียบทางเลือกทางการเงิน การกู้ยืม การออม หรือการจำแนกภาษี เงื่อนไขจริงอาจเปลี่ยนแปลงตามหลักเกณฑ์ของหน่วยงานที่เกี่ยวข้อง
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

function populateCompareSlots() {
    if (typeof document === 'undefined') return;
    const toolId = document.getElementById('compareToolSelect')?.value || 'loan';
    const slotA = document.getElementById('compareSlotA');
    const slotB = document.getElementById('compareSlotB');
    const slotC = document.getElementById('compareSlotC');
    if (!slotA || !slotB || !slotC) return;

    const options = [];
    if (appState && appState[toolId]) {
        options.push({
            value: 'current',
            label: '📌 ค่าปัจจุบันบนหน้าจอ',
            state: JSON.parse(JSON.stringify(appState[toolId]))
        });
    }

    const history = getCalculationHistory().filter(h => h.toolId === toolId);
    history.forEach(item => {
        const prefix = item.isSaved ? '⭐ ' : '🕒 ';
        const label = prefix + (item.label || item.shortSummary || item.timeDisplay);
        options.push({
            value: item.id,
            label: label,
            state: item.state
        });
    });

    const presets = getComparisonPresets(toolId);
    presets.forEach((p, idx) => {
        options.push({
            value: 'preset_' + idx,
            label: '💡 ' + p.label,
            state: p.state
        });
    });

    const buildOptionsHTML = () => options.map(opt => `<option value="${opt.value}">${escapeHTML(opt.label)}</option>`).join('');

    slotA.innerHTML = buildOptionsHTML();
    slotB.innerHTML = buildOptionsHTML();
    slotC.innerHTML = buildOptionsHTML();

    if (options.length >= 2) {
        slotA.selectedIndex = 0;
        slotB.selectedIndex = 1;
        if (options.length >= 3) {
            slotC.selectedIndex = 2;
        }
    }
}

function getSelectedSlotItem(slotId) {
    const toolId = document.getElementById('compareToolSelect')?.value || 'loan';
    const select = document.getElementById(slotId);
    if (!select) return null;
    const val = select.value;
    const selectedText = select.options[select.selectedIndex]?.text || '';

    if (val === 'current') {
        return {
            label: '📌 ค่าปัจจุบันบนหน้าจอ',
            state: JSON.parse(JSON.stringify(appState[toolId] || {}))
        };
    }
    if (val && val.startsWith('preset_')) {
        const idx = parseInt(val.replace('preset_', ''), 10);
        const presets = getComparisonPresets(toolId);
        const p = presets[idx];
        return p ? { label: p.label, state: JSON.parse(JSON.stringify(p.state)) } : null;
    }
    const history = getCalculationHistory();
    const item = history.find(h => h.id === val);
    if (item) {
        return {
            label: item.label || item.shortSummary || item.toolTitle,
            state: JSON.parse(JSON.stringify(item.state))
        };
    }
    return {
        label: selectedText,
        state: JSON.parse(JSON.stringify(appState[toolId] || {}))
    };
}

function updateSlotCUI() {
    if (typeof document === 'undefined') return;
    const slotC = document.getElementById('compareSlotC');
    const toggleBtn = document.getElementById('btnToggleSlotC');
    if (!slotC || !toggleBtn) return;
    if (isCompareSlotCActive) {
        slotC.removeAttribute('disabled');
        slotC.classList.remove('opacity-50');
        toggleBtn.textContent = '✕ ปิด';
        toggleBtn.className = 'text-[10px] text-red-500 font-semibold cursor-pointer';
    } else {
        slotC.setAttribute('disabled', 'true');
        slotC.classList.add('opacity-50');
        toggleBtn.textContent = '+ เปิด';
        toggleBtn.className = 'text-[10px] text-emerald-600 font-semibold cursor-pointer';
    }
}

function renderCompareMatrix() {
    if (typeof document === 'undefined') return;
    const toolId = document.getElementById('compareToolSelect')?.value || 'loan';
    const itemA = getSelectedSlotItem('compareSlotA');
    const itemB = getSelectedSlotItem('compareSlotB');
    const items = [itemA, itemB];

    if (isCompareSlotCActive) {
        const itemC = getSelectedSlotItem('compareSlotC');
        if (itemC) items.push(itemC);
    }

    const compData = compareCalculations(toolId, items);
    currentCompareData = compData;
    const deltaText = document.getElementById('compareDeltaText');
    const matrixTable = document.getElementById('compareMatrixTable');

    if (!compData) {
        if (deltaText) deltaText.textContent = 'กรุณาเลือกตัวเลือกที่ต้องการเปรียบเทียบอย่างน้อย 2 ทางเลือก';
        if (matrixTable) matrixTable.innerHTML = '';
        return;
    }

    if (deltaText) deltaText.textContent = compData.deltaSummary;

    let tableHTML = `
        <thead>
            <tr class="bg-neutral-100 dark:bg-white/10 border-b border-[var(--app-hairline)]">
                <th class="p-2.5 font-bold text-neutral-600 dark:text-neutral-300 w-1/3">คุณสมบัติ / ค่าตัวเลข</th>
                ${compData.items.map((item, idx) => `
                    <th class="p-2.5 text-right font-bold border-l border-[var(--app-hairline)] ${idx === compData.winnerIndex ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200' : 'text-[var(--color-ink)]'}">
                        <div class="truncate max-w-[170px] inline-block font-bold">${escapeHTML(item.label)}</div>
                        ${idx === compData.winnerIndex ? '<span class="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">🏆 คุ้มค่าที่สุด</span>' : ''}
                        <div class="mt-1">
                            <button type="button" class="btn-load-compare-set px-2 py-0.5 text-[10px] font-semibold rounded bg-[var(--app-accent)] text-white hover:opacity-90 active:scale-95 transition shadow-sm cursor-pointer" data-idx="${idx}">
                                📥 ใช้ชุดนี้
                            </button>
                        </div>
                    </th>
                `).join('')}
            </tr>
        </thead>
        <tbody>
            ${compData.rows.map((row, rIdx) => `
                <tr class="border-b border-[var(--app-hairline)] ${row.highlight ? 'bg-emerald-50/50 dark:bg-emerald-950/20 font-bold' : (rIdx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-neutral-50/70 dark:bg-white/5')}">
                    <td class="p-2.5 text-neutral-600 dark:text-neutral-400 font-medium">
                        ${escapeHTML(row.label)}
                    </td>
                    ${row.values.map((val, vIdx) => `
                        <td class="p-2.5 text-right border-l border-[var(--app-hairline)] ${vIdx === row.bestIndex ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-[var(--color-ink)] font-semibold'}">
                            ${escapeHTML(val)} ${vIdx === row.bestIndex ? '✓' : ''}
                        </td>
                    `).join('')}
                </tr>
            `).join('')}
        </tbody>
    `;

    if (matrixTable) {
        matrixTable.innerHTML = tableHTML;
        matrixTable.querySelectorAll('.btn-load-compare-set').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx, 10);
                const selected = compData.items[idx];
                if (selected && selected.state) {
                    appState[compData.toolId] = JSON.parse(JSON.stringify(selected.state));
                    appState.activeToolId = compData.toolId;
                    persistAppState();
                    closeCompareModal();
                    closeSidebar();
                    selectTool(compData.toolId);
                    showHistoryToast(`✓ โหลด "${selected.label}" นำมาคำนวณเรียบร้อย`);
                }
            });
        });
    }
}

function openCompareModal(preselectedToolId) {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('compareModal');
    if (!modal) return;

    const toolSelect = document.getElementById('compareToolSelect');
    const targetToolId = preselectedToolId || appState.activeToolId || 'loan';

    if (toolSelect) {
        const optExists = Array.from(toolSelect.options).some(o => o.value === targetToolId);
        toolSelect.value = optExists ? targetToolId : 'loan';
    }

    modal.classList.remove('hidden');
    populateCompareSlots();
    renderCompareMatrix();
}

function closeCompareModal() {
    if (typeof document === 'undefined') return;
    document.getElementById('compareModal')?.classList.add('hidden');
}


(function(root) {
    const exportsObj = {
        getComparisonPresets,
        compareCalculations,
        generateComparePrintHTML,
        populateCompareSlots,
        getSelectedSlotItem,
        updateSlotCUI,
        renderCompareMatrix,
        openCompareModal,
        closeCompareModal
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
