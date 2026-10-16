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
        ],
        labor_severance: [
            {
                label: 'ทางเลือก 1: อายุงาน 2 ปี (ชดเชย 90 วัน) บอกกล่าวล่วงหน้า',
                state: { salaryMonthly: '35000', mode: 'duration', serviceYears: '2', serviceMonths: '0', serviceDays: '0', noticeGiven: 'yes', noticeMonths: '1', unusedLeaveDays: '0' }
            },
            {
                label: 'ทางเลือก 2: อายุงาน 4 ปี (ชดเชย 180 วัน) + ค่าตกใจ 1 ด.',
                state: { salaryMonthly: '35000', mode: 'duration', serviceYears: '4', serviceMonths: '0', serviceDays: '0', noticeGiven: 'no', noticeMonths: '1', unusedLeaveDays: '5' }
            },
            {
                label: 'ทางเลือก 3: อายุงาน 8 ปี (ชดเชย 240 วัน) + ค่าตกใจ 1 ด.',
                state: { salaryMonthly: '35000', mode: 'duration', serviceYears: '8', serviceMonths: '0', serviceDays: '0', noticeGiven: 'no', noticeMonths: '1', unusedLeaveDays: '10' }
            }
        ],
        legal_interest: [
            {
                label: 'ทางเลือก 1: ดอกเบี้ยผิดนัด ป.พ.พ. 5.0% (ค้าง 60 วัน)',
                state: { principal: '200000', ratePreset: 'default_5', customRate: '5.0', calcMode: 'days', overdueDays: '60' }
            },
            {
                label: 'ทางเลือก 2: ดอกเบี้ยกฎหมาย ป.พ.พ. ม.7 3.0% (ค้าง 60 วัน)',
                state: { principal: '200000', ratePreset: 'statutory_3', customRate: '3.0', calcMode: 'days', overdueDays: '60' }
            },
            {
                label: 'ทางเลือก 3: อัตราสัญญาเดิม 7.5% (ค้าง 60 วัน)',
                state: { principal: '200000', ratePreset: 'custom', customRate: '7.5', calcMode: 'days', overdueDays: '60' }
            }
        ],
        ot_calc: [
            {
                label: 'ทางเลือก 1: พนักงานรายเดือน 25k (OT วันธรรมดา 10 ชม.)',
                state: { wageType: 'monthly', wageBase: '25000', workHoursPerDay: '8', otWeekdayHours: '10', holidayWorkHours: '0', holidayOtHours: '0', shiftAllowance: '0' }
            },
            {
                label: 'ทางเลือก 2: พนักงานรายเดือน 25k (OT วันธรรมดา 15 ชม. + วันหยุด 8 ชม.)',
                state: { wageType: 'monthly', wageBase: '25000', workHoursPerDay: '8', otWeekdayHours: '15', holidayWorkHours: '8', holidayOtHours: '0', shiftAllowance: '500' }
            },
            {
                label: 'ทางเลือก 3: พนักงานรายวัน 500 บ. (OT วันหยุดเต็มวัน + OT ดึก 4 ชม.)',
                state: { wageType: 'daily', wageBase: '500', workHoursPerDay: '8', otWeekdayHours: '10', holidayWorkHours: '8', holidayOtHours: '4', shiftAllowance: '800' }
            }
        ],
        ecommerce_profit: [
            {
                label: 'ทางเลือก 1: Shopee (ราคา 350 บ. ยิงแอด 30 บ.)',
                state: { platform: 'shopee', sellingPrice: '350', productCost: '150', packagingCost: '10', shopVoucher: '0', customerShipping: '35', sellerShipping: '35', adSpendPerOrder: '30', commissionRatePct: '5.0', serviceFeePct: '4.0', transactionRatePct: '3.0', isVatApplied: 'yes' }
            },
            {
                label: 'ทางเลือก 2: TikTok Shop (ราคา 350 บ. ยิงแอด 20 บ.)',
                state: { platform: 'tiktok', sellingPrice: '350', productCost: '150', packagingCost: '10', shopVoucher: '0', customerShipping: '35', sellerShipping: '35', adSpendPerOrder: '20', commissionRatePct: '4.0', serviceFeePct: '0.0', transactionRatePct: '3.0', isVatApplied: 'yes' }
            },
            {
                label: 'ทางเลือก 3: ขายตรง LINE Shop (ราคา 320 บ. ไม่เสียคอม)',
                state: { platform: 'direct', sellingPrice: '320', productCost: '150', packagingCost: '10', shopVoucher: '0', customerShipping: '35', sellerShipping: '35', adSpendPerOrder: '15', commissionRatePct: '0.0', serviceFeePct: '0.0', transactionRatePct: '0.0', isVatApplied: 'no' }
            }
        ],
        debt_payoff: [
            {
                label: 'ทางเลือก 1: โปะเพิ่ม 1,000 บ. (Avalanche)',
                state: {
                    strategy: 'avalanche',
                    extraMonthly: '1000',
                    debts: [
                        { id: '1', name: 'บัตรกดเงินสด A', balance: '25000', rate: '25', minPayment: '1250' },
                        { id: '2', name: 'บัตรเครดิต B', balance: '45000', rate: '16', minPayment: '2250' },
                        { id: '3', name: 'สินเชื่อส่วนบุคคล C', balance: '80000', rate: '18', minPayment: '3500' }
                    ]
                }
            },
            {
                label: 'ทางเลือก 2: โปะเพิ่ม 3,000 บ. (Avalanche)',
                state: {
                    strategy: 'avalanche',
                    extraMonthly: '3000',
                    debts: [
                        { id: '1', name: 'บัตรกดเงินสด A', balance: '25000', rate: '25', minPayment: '1250' },
                        { id: '2', name: 'บัตรเครดิต B', balance: '45000', rate: '16', minPayment: '2250' },
                        { id: '3', name: 'สินเชื่อส่วนบุคคล C', balance: '80000', rate: '18', minPayment: '3500' }
                    ]
                }
            },
            {
                label: 'ทางเลือก 3: โปะเพิ่ม 3,000 บ. (Snowball)',
                state: {
                    strategy: 'snowball',
                    extraMonthly: '3000',
                    debts: [
                        { id: '1', name: 'บัตรกดเงินสด A', balance: '25000', rate: '25', minPayment: '1250' },
                        { id: '2', name: 'บัตรเครดิต B', balance: '45000', rate: '16', minPayment: '2250' },
                        { id: '3', name: 'สินเชื่อส่วนบุคคล C', balance: '80000', rate: '18', minPayment: '3500' }
                    ]
                }
            }
        ],
        food_costing: [
            {
                label: 'ทางเลือก 1: จานเดี่ยว Food Cost 30% (ขาย 65 บ.)',
                state: {
                    recipeName: 'กะเพราหมูสับไข่ดาว',
                    batchYield: '1',
                    targetFoodCostPct: '30',
                    sellingPrice: '65',
                    packagingCost: '4.5',
                    hiddenCostBufferPct: '5',
                    ingredients: [
                        { id: '1', name: 'หมูสับ', packPrice: '160', packSize: '1000', packUnit: 'g', useAmount: '120', useUnit: 'g', yieldPct: '100' },
                        { id: '2', name: 'ข้าวสวย', packPrice: '45', packSize: '2500', packUnit: 'g', useAmount: '200', useUnit: 'g', yieldPct: '100' },
                        { id: '3', name: 'ไข่ไก่', packPrice: '120', packSize: '30', packUnit: 'piece', useAmount: '1', useUnit: 'piece', yieldPct: '100' },
                        { id: '4', name: 'เครื่องปรุง', packPrice: '50', packSize: '500', packUnit: 'g', useAmount: '30', useUnit: 'g', yieldPct: '90' }
                    ]
                }
            },
            {
                label: 'ทางเลือก 2: จานเดี่ยว Food Cost 25% (ขาย 75 บ.)',
                state: {
                    recipeName: 'กะเพราหมูสับไข่ดาว',
                    batchYield: '1',
                    targetFoodCostPct: '25',
                    sellingPrice: '75',
                    packagingCost: '4.5',
                    hiddenCostBufferPct: '5',
                    ingredients: [
                        { id: '1', name: 'หมูสับ', packPrice: '160', packSize: '1000', packUnit: 'g', useAmount: '120', useUnit: 'g', yieldPct: '100' },
                        { id: '2', name: 'ข้าวสวย', packPrice: '45', packSize: '2500', packUnit: 'g', useAmount: '200', useUnit: 'g', yieldPct: '100' },
                        { id: '3', name: 'ไข่ไก่', packPrice: '120', packSize: '30', packUnit: 'piece', useAmount: '1', useUnit: 'piece', yieldPct: '100' },
                        { id: '4', name: 'เครื่องปรุง', packPrice: '50', packSize: '500', packUnit: 'g', useAmount: '30', useUnit: 'g', yieldPct: '90' }
                    ]
                }
            },
            {
                label: 'ทางเลือก 3: วัตถุดิบล็อตใหญ่ (ลดต้นทุนหมูเหลือ 140 บ.)',
                state: {
                    recipeName: 'กะเพราหมูสับไข่ดาว (ราคาส่ง)',
                    batchYield: '1',
                    targetFoodCostPct: '30',
                    sellingPrice: '65',
                    packagingCost: '3.5',
                    hiddenCostBufferPct: '5',
                    ingredients: [
                        { id: '1', name: 'หมูสับส่งตรง', packPrice: '140', packSize: '1000', packUnit: 'g', useAmount: '120', useUnit: 'g', yieldPct: '100' },
                        { id: '2', name: 'ข้าวสวย', packPrice: '45', packSize: '2500', packUnit: 'g', useAmount: '200', useUnit: 'g', yieldPct: '100' },
                        { id: '3', name: 'ไข่ไก่ส่งฟาร์ม', packPrice: '105', packSize: '30', packUnit: 'piece', useAmount: '1', useUnit: 'piece', yieldPct: '100' },
                        { id: '4', name: 'เครื่องปรุง', packPrice: '50', packSize: '500', packUnit: 'g', useAmount: '30', useUnit: 'g', yieldPct: '90' }
                    ]
                }
            }
        ],
        fuel_cost: [
            {
                label: 'ทางเลือก 1: ชาร์จบ้าน TOU Off-Peak (2.90 ฿/หน่วย)',
                state: {
                    mode: 'ev',
                    distance: '200',
                    evEfficiency: '6.5',
                    electricityRate: '2.90',
                    chargingLossPct: '10',
                    batteryCapacity: '60',
                    compareIceEfficiency: '15',
                    compareFuelPrice: '36.50',
                    yearlyKm: '20000'
                }
            },
            {
                label: 'ทางเลือก 2: ตู้ชาร์จสาธารณะ DC Peak (7.80 ฿/หน่วย)',
                state: {
                    mode: 'ev',
                    distance: '200',
                    evEfficiency: '6.5',
                    electricityRate: '7.80',
                    chargingLossPct: '10',
                    batteryCapacity: '60',
                    compareIceEfficiency: '15',
                    compareFuelPrice: '36.50',
                    yearlyKm: '20000'
                }
            },
            {
                label: 'ทางเลือก 3: รถยนต์น้ำมันเดิม (15 กม./ลิตร @ 36.50 ฿)',
                state: {
                    mode: 'fuel',
                    distance: '200',
                    efficiency: '15',
                    oilPrice: '36.50'
                }
            }
        ],
        construction_calc: [
            {
                label: 'ทางเลือก 1: กระเบื้องแกรนิตโต้ 60x60 ซม. (ห้อง 20 ตร.ม.)',
                state: {
                    tab: 'tiles',
                    tileWidth: '4',
                    tileLength: '5',
                    tileSizePreset: '60x60',
                    tileWastagePct: '10',
                    tilePricePerBox: '380',
                    tileLaborPerSqm: '250',
                    adhesivePricePerBag: '160',
                    groutPricePerBag: '50'
                }
            },
            {
                label: 'ทางเลือก 2: กระเบื้องหินอ่อน 60x120 ซม. (ห้อง 20 ตร.ม.)',
                state: {
                    tab: 'tiles',
                    tileWidth: '4',
                    tileLength: '5',
                    tileSizePreset: '60x120',
                    tileWastagePct: '10',
                    tilePricePerBox: '750',
                    tileLaborPerSqm: '300',
                    adhesivePricePerBag: '160',
                    groutPricePerBag: '50'
                }
            },
            {
                label: 'ทางเลือก 3: กระเบื้องมาตรฐาน 40x40 ซม. (ห้อง 20 ตร.ม.)',
                state: {
                    tab: 'tiles',
                    tileWidth: '4',
                    tileLength: '5',
                    tileSizePreset: '40x40',
                    tileWastagePct: '10',
                    tilePricePerBox: '220',
                    tileLaborPerSqm: '220',
                    adhesivePricePerBag: '160',
                    groutPricePerBag: '50'
                }
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
            let income = numberOrDefault(st.income, 0);
            if (st.mode === 'net') {
                const calc = (typeof calculateNetSalary === 'function')
                    ? calculateNetSalary(st)
                    : { netMonthly: income };
                income = calc.netMonthly;
            }
            const needsPct = numberOrDefault(st.needsPct, 50);
            const wantsPct = numberOrDefault(st.wantsPct, 30);
            const savingsPct = numberOrDefault(st.savingsPct, 20);
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

    } else if (toolId === 'labor_severance') {
        const results = items.map(item => {
            const st = item.state || {};
            const calc = (typeof calculateLaborSeverance === 'function')
                ? calculateLaborSeverance(st)
                : { salaryMonthly: 0, dailyWage: 0, serviceYears: 0, serviceMonths: 0, severanceDays: 0, severancePay: 0, noticePay: 0, leavePay: 0, totalSeverancePackage: 0, taxExemptAmount: 0, taxableSeverance: 0, tierLabel: '' };
            return calc;
        });

        rows.push({
            label: 'เงินเดือนฐานคำนวณ',
            values: results.map(r => `${formatMoney(r.salaryMonthly)} ฿ (${formatMoney(r.dailyWage)} ฿/วัน)`)
        });
        rows.push({
            label: 'อายุงานสะสม',
            values: results.map(r => `${r.serviceYears} ปี ${r.serviceMonths} เดือน`)
        });
        rows.push({
            label: 'เกณฑ์ชดเชยตาม ม.118',
            values: results.map(r => `${r.severanceDays} วัน`)
        });
        rows.push({
            label: 'เงินชดเชยเลิกจ้าง (ม.118)',
            values: results.map(r => `${formatMoney(r.severancePay)} ฿`)
        });
        rows.push({
            label: 'สินจ้างแทนบอกกล่าว (ม.17)',
            values: results.map(r => r.noticePay > 0 ? `+${formatMoney(r.noticePay)} ฿` : '0 ฿ (บอกถูกต้อง)')
        });
        rows.push({
            label: 'ค่าจ้างพักร้อนคงเหลือ (ม.67)',
            values: results.map(r => r.leavePay > 0 ? `+${formatMoney(r.leavePay)} ฿` : '0 ฿')
        });

        const maxPackageRes = results.reduce((max, cur) => cur.totalSeverancePackage > max.totalSeverancePackage ? cur : max, results[0]);
        const maxPackageIdx = results.indexOf(maxPackageRes);

        rows.push({
            label: 'รวมเงินชดเชยสุทธิที่ได้รับ',
            values: results.map(r => `${formatMoney(r.totalSeverancePackage)} ฿`),
            bestIndex: maxPackageIdx,
            highlight: true
        });
        rows.push({
            label: 'สิทธิยกเว้นภาษีเงินได้',
            values: results.map(r => `${formatMoney(r.taxExemptAmount)} ฿ (สูงสุด 3 แสน)`)
        });

        winnerIndex = maxPackageIdx;
        const minPackage = Math.min(...results.map(r => r.totalSeverancePackage));
        const diffPackage = maxPackageRes.totalSeverancePackage - minPackage;
        deltaSummary = `🏆 ทางเลือกที่ได้รับเงินชดเชยรวมสูงสุดคือ "${items[winnerIndex].label}" ยอดสุทธิ ${formatMoney(maxPackageRes.totalSeverancePackage)} บาท${diffPackage > 0 ? ` (มากกว่าทางเลือกต่ำสุด ${formatMoney(diffPackage)} บาท)` : ''}`;

    } else if (toolId === 'legal_interest') {
        const results = items.map(item => {
            const st = item.state || {};
            const calc = (typeof calculateLegalInterest === 'function')
                ? calculateLegalInterest(st)
                : { principal: 0, interestRate: 0, overdueDays: 0, dailyInterest: 0, totalInterest: 0, totalPayable: 0, ratePresetLabel: '' };
            return calc;
        });

        rows.push({
            label: 'เงินต้นค้างชำระ (Principal)',
            values: results.map(r => `${formatMoney(r.principal)} ฿`)
        });
        rows.push({
            label: 'อัตราดอกเบี้ยต่อปี',
            values: results.map(r => `${formatNum(r.interestRate, 2)}% (${r.ratePresetLabel || 'ป.พ.พ.'})`)
        });
        rows.push({
            label: 'ระยะเวลาผิดนัดชำระ',
            values: results.map(r => `${r.overdueDays} วัน`)
        });
        rows.push({
            label: 'ดอกเบี้ยผิดนัดเฉลี่ยต่อวัน',
            values: results.map(r => `+${formatMoney(r.dailyInterest)} ฿/วัน`)
        });

        const minPayableRes = results.reduce((min, cur) => cur.totalPayable < min.totalPayable ? cur : min, results[0]);
        const minPayableIdx = results.indexOf(minPayableRes);

        rows.push({
            label: 'ดอกเบี้ยผิดนัดชำระสะสม',
            values: results.map(r => `+${formatMoney(r.totalInterest)} ฿`),
            bestIndex: minPayableIdx
        });
        rows.push({
            label: 'ยอดหนี้รวมทั้งสิ้นที่ต้องชำระ',
            values: results.map(r => `${formatMoney(r.totalPayable)} ฿`),
            bestIndex: minPayableIdx,
            highlight: true
        });

        winnerIndex = minPayableIdx;
        const maxPayable = Math.max(...results.map(r => r.totalPayable));
        const diffPayable = maxPayable - minPayableRes.totalPayable;
        deltaSummary = `🏆 ทางเลือกที่มียอดหนี้รวมต่ำที่สุดคือ "${items[winnerIndex].label}" ยอดชำระรวม ${formatMoney(minPayableRes.totalPayable)} บาท (ดอกเบี้ย ${formatMoney(minPayableRes.totalInterest)} บาท)${diffPayable > 0 ? ` ประหยัดภาระหนี้ได้ ${formatMoney(diffPayable)} บาท` : ''}`;

    } else if (toolId === 'ot_calc') {
        const results = items.map(item => {
            const st = item.state || {};
            const calc = (typeof calculateOvertimePay === 'function')
                ? calculateOvertimePay(st)
                : { wageType: 'monthly', wageBase: 0, hourlyRate: 0, otWeekdayHours: 0, otWeekdayPay: 0, holidayWorkHours: 0, holidayWorkPay: 0, holidayOtHours: 0, holidayOtPay: 0, shiftAllowance: 0, totalOtPay: 0, totalEarnings: 0 };
            return calc;
        });

        rows.push({
            label: 'ประเภทค่าจ้าง / ฐานค่าจ้าง',
            values: results.map(r => `${r.wageType === 'daily' ? 'รายวัน' : r.wageType === 'hourly' ? 'รายชั่วโมง' : 'รายเดือน'} ${formatMoney(r.wageBase)} ฿`)
        });
        rows.push({
            label: 'อัตราค่าจ้างต่อชั่วโมงฐาน',
            values: results.map(r => `${formatMoney(r.hourlyRate)} ฿/ชม.`)
        });
        rows.push({
            label: 'OT วันทำงานปกติ (1.5x)',
            values: results.map(r => `${r.otWeekdayHours} ชม. (+${formatMoney(r.otWeekdayPay)} ฿)`)
        });
        rows.push({
            label: 'ทำงานในวันหยุด (1x/2x)',
            values: results.map(r => `${r.holidayWorkHours} ชม. (+${formatMoney(r.holidayWorkPay)} ฿)`)
        });
        rows.push({
            label: 'OT วันหยุด (3.0x)',
            values: results.map(r => `${r.holidayOtHours} ชม. (+${formatMoney(r.holidayOtPay)} ฿)`)
        });
        if (results.some(r => r.shiftAllowance > 0)) {
            rows.push({
                label: 'เงินช่วยเหลือ/กะพิเศษ',
                values: results.map(r => `+${formatMoney(r.shiftAllowance)} ฿`)
            });
        }

        const maxOtRes = results.reduce((max, cur) => cur.totalOtPay > max.totalOtPay ? cur : max, results[0]);
        const maxOtIdx = results.indexOf(maxOtRes);

        rows.push({
            label: 'รวมค่าล่วงเวลา & วันหยุด (OT Pay)',
            values: results.map(r => `+${formatMoney(r.totalOtPay)} ฿`),
            bestIndex: maxOtIdx,
            highlight: true
        });
        rows.push({
            label: 'รวมรายได้คาดการณ์ทั้งสิ้น',
            values: results.map(r => `${formatMoney(r.totalEarnings)} ฿`),
            bestIndex: results.indexOf(results.reduce((max, cur) => cur.totalEarnings > max.totalEarnings ? cur : max, results[0]))
        });

        winnerIndex = maxOtIdx;
        const minOt = Math.min(...results.map(r => r.totalOtPay));
        const diffOt = maxOtRes.totalOtPay - minOt;
        deltaSummary = `🏆 ทางเลือกที่ได้ค่าล่วงเวลา (OT) สูงสุดคือ "${items[winnerIndex].label}" ได้รับค่า OT รวม ${formatMoney(maxOtRes.totalOtPay)} บาท${diffOt > 0 ? ` (มากกว่าทางเลือกต่ำสุด ${formatMoney(diffOt)} บาท)` : ''}`;

    } else if (toolId === 'ecommerce_profit') {
        const results = items.map(item => {
            const st = item.state || {};
            const calc = (typeof calculateEcommerceProfit === 'function')
                ? calculateEcommerceProfit(st)
                : { platform: 'shopee', sellingPrice: 0, productCost: 0, packagingCost: 0, totalPlatformFees: 0, adSpendPerOrder: 0, totalCosts: 0, netPayout: 0, netProfit: 0, profitMarginPct: 0, breakevenPrice: 0 };
            return calc;
        });

        rows.push({
            label: 'ช่องทาง / แพลตฟอร์ม',
            values: results.map(r => r.platform.toUpperCase())
        });
        rows.push({
            label: 'ราคาขายต่อชิ้น (Selling Price)',
            values: results.map(r => `${formatMoney(r.sellingPrice)} ฿`)
        });
        rows.push({
            label: 'ต้นทุนสินค้า + บรรจุภัณฑ์',
            values: results.map(r => `${formatMoney(r.productCost + r.packagingCost)} ฿`)
        });
        rows.push({
            label: 'ค่าธรรมเนียมแพลตฟอร์มรวม VAT',
            values: results.map(r => `-${formatMoney(r.totalPlatformFees)} ฿`)
        });
        rows.push({
            label: 'งบยิงแอด/โฆษณาต่อออเดอร์',
            values: results.map(r => `-${formatMoney(r.adSpendPerOrder)} ฿`)
        });
        rows.push({
            label: 'เงินโอนสุทธิเข้าบัญชี (Net Payout)',
            values: results.map(r => `${formatMoney(r.netPayout)} ฿`)
        });
        rows.push({
            label: 'ราคาขายขั้นต่ำที่ไม่ขาดทุน (Breakeven)',
            values: results.map(r => `${formatMoney(r.breakevenPrice)} ฿`)
        });

        const maxProfitRes = results.reduce((max, cur) => cur.netProfit > max.netProfit ? cur : max, results[0]);
        const maxProfitIdx = results.indexOf(maxProfitRes);

        rows.push({
            label: 'กำไรสุทธิต่อออเดอร์ (Net Profit)',
            values: results.map(r => `${formatMoney(r.netProfit)} ฿ (Margin ${formatNum(r.profitMarginPct, 1)}%)`),
            bestIndex: maxProfitIdx,
            highlight: true
        });

        winnerIndex = maxProfitIdx;
        const minProfit = Math.min(...results.map(r => r.netProfit));
        const diffProfit = maxProfitRes.netProfit - minProfit;
        deltaSummary = `🏆 ทางเลือกที่สร้างกำไรสุทธิสูงสุดคือ "${items[winnerIndex].label}" กำไรต่อออเดอร์ ${formatMoney(maxProfitRes.netProfit)} บาท (Margin ${formatNum(maxProfitRes.profitMarginPct, 1)}%)${diffProfit > 0 ? ` มากกว่าทางเลือกต่ำสุด ${formatMoney(diffProfit)} บาท` : ''}`;

    } else if (toolId === 'debt_payoff') {
        const results = items.map(item => {
            const st = item.state || {};
            return (typeof calculateDebtPayoff === 'function')
                ? calculateDebtPayoff(st)
                : { summary: { months: 0, years: 0, totalInterest: 0, totalPaid: 0 }, initialTotalDebt: 0, totalMonthlyBudget: 0, strategy: 'avalanche' };
        });

        rows.push({
            label: 'กลยุทธ์การชำระหนี้',
            values: results.map(r => r.strategy === 'snowball' ? 'Debt Snowball (ยอดน้อยก่อน)' : 'Debt Avalanche (ดอกเบี้ยสูงก่อน)')
        });
        rows.push({
            label: 'ยอดหนี้รวมเริ่มต้น',
            values: results.map(r => `${formatMoney(r.initialTotalDebt)} ฿`)
        });
        rows.push({
            label: 'เงินโปะเพิ่มต่อเดือน',
            values: results.map(r => `+${formatMoney(r.extraMonthly || 0)} ฿`)
        });
        rows.push({
            label: 'งบชำระหนี้รวมต่อเดือน',
            values: results.map(r => `${formatMoney(r.totalMonthlyBudget)} ฿/เดือน`)
        });
        rows.push({
            label: 'ดอกเบี้ยรวมตลอดสัญญา',
            values: results.map(r => `${formatMoney(r.summary.totalInterest)} ฿`)
        });

        const fastestRes = results.reduce((best, cur) => cur.summary.months < best.summary.months ? cur : best, results[0]);
        const fastestIdx = results.indexOf(fastestRes);

        rows.push({
            label: 'ระยะเวลาปลดหนี้ทั้งหมด',
            values: results.map(r => `${r.summary.months} เดือน (${r.summary.years} ปี)`),
            bestIndex: fastestIdx,
            highlight: true
        });

        winnerIndex = fastestIdx;
        const maxMonths = Math.max(...results.map(r => r.summary.months));
        const diffMonths = maxMonths - fastestRes.summary.months;
        deltaSummary = `🏆 ทางเลือกที่ปลดหนี้ได้เร็วที่สุดคือ "${items[winnerIndex].label}" ใช้เวลาเพียง ${fastestRes.summary.months} เดือน (${fastestRes.summary.years} ปี)${diffMonths > 0 ? ` (เร็วกว่าทางเลือกช้าสุด ${diffMonths} เดือน)` : ''}`;

    } else if (toolId === 'food_costing') {
        const results = items.map(item => {
            const st = item.state || {};
            return (typeof calculateFoodCosting === 'function')
                ? calculateFoodCosting(st)
                : { recipeName: '', batchYield: 1, targetFoodCostPct: 30, sellingPrice: 0, summary: { rawBatchCost: 0, rawCostPerPortion: 0, hiddenCostBuffer: 0, packagingCost: 0, totalCostPerPortion: 0, suggestedSellingPrice: 0, suggestedPriceRounded: 0, grossProfit: 0, actualFoodCostPct: 0, grossMarginPct: 0, isProfit: true, hasActualPrice: false } };
        });

        rows.push({
            label: 'ขนาดสูตร / เสิร์ฟ',
            values: results.map(r => r.batchYield > 1 ? `${r.batchYield} เสิร์ฟ` : '1 เสิร์ฟ (จานเดี่ยว)')
        });
        rows.push({
            label: 'ต้นทุนวัตถุดิบต่อเสิร์ฟ',
            values: results.map(r => `${formatMoney(r.summary.rawCostPerPortion)} ฿`)
        });
        rows.push({
            label: 'เผื่อสูญเสีย & บรรจุภัณฑ์',
            values: results.map(r => `+${formatMoney(r.summary.hiddenCostBuffer + r.summary.packagingCost)} ฿`)
        });

        const minCostRes = results.reduce((min, cur) => cur.summary.totalCostPerPortion < min.summary.totalCostPerPortion ? cur : min, results[0]);
        const minCostIdx = results.indexOf(minCostRes);

        rows.push({
            label: 'ต้นทุนรวมต่อเสิร์ฟ (Total Cost)',
            values: results.map(r => `${formatMoney(r.summary.totalCostPerPortion)} ฿`),
            bestIndex: minCostIdx
        });
        rows.push({
            label: 'ราคาแนะนำ (Food Cost เป้าหมาย)',
            values: results.map(r => `${formatMoney(r.summary.suggestedSellingPrice)} ฿ (${r.targetFoodCostPct}%)`)
        });
        rows.push({
            label: 'ราคาขายจริงต่อเสิร์ฟ',
            values: results.map(r => r.summary.hasActualPrice ? `${formatMoney(r.sellingPrice)} ฿` : '-')
        });

        const validProfits = results.filter(r => r.summary.hasActualPrice);
        if (validProfits.length > 0) {
            const maxProfitRes = validProfits.reduce((max, cur) => cur.summary.grossProfit > max.summary.grossProfit ? cur : max, validProfits[0]);
            const maxProfitIdx = results.indexOf(maxProfitRes);

            rows.push({
                label: 'กำไรขั้นต้นต่อเสิร์ฟ (Gross Profit)',
                values: results.map(r => r.summary.hasActualPrice ? `${formatMoney(r.summary.grossProfit)} ฿ (Margin ${formatNum(r.summary.grossMarginPct, 1)}%)` : '-'),
                bestIndex: maxProfitIdx,
                highlight: true
            });

            winnerIndex = maxProfitIdx;
            const minProfit = Math.min(...validProfits.map(r => r.summary.grossProfit));
            const diffProfit = maxProfitRes.summary.grossProfit - minProfit;
            deltaSummary = `🏆 ทางเลือกที่สร้างกำไรต่อเสิร์ฟสูงสุดคือ "${items[winnerIndex].label}" กำไร ${formatMoney(maxProfitRes.summary.grossProfit)} บาท (Margin ${formatNum(maxProfitRes.summary.grossMarginPct, 1)}%)${diffProfit > 0 ? ` มากกว่าทางเลือกต่ำสุด ${formatMoney(diffProfit)} บาท` : ''}`;
        } else {
            winnerIndex = minCostIdx;
            deltaSummary = `🏆 ทางเลือกที่ต้นทุนรวมต่อเสิร์ฟประหยัดที่สุดคือ "${items[winnerIndex].label}" ต้นทุนเพียง ${formatMoney(minCostRes.summary.totalCostPerPortion)} บาท`;
        }

    } else if (toolId === 'fuel_cost') {
        const results = items.map(item => {
            const st = item.state || {};
            const isEv = st.mode === 'ev';
            if (isEv) {
                const res = (typeof calculateEvCost === 'function')
                    ? calculateEvCost(st)
                    : { distance: 0, evEfficiency: 6.5, electricityRate: 2.9, ev: { totalCost: 0, costPerKm: 0, billedKwh: 0 }, annual: { evYearlyCost: 0 }, yearlyKm: 20000 };
                return {
                    isEv: true,
                    modeLabel: 'รถยนต์ไฟฟ้า EV',
                    distance: res.distance,
                    effText: `${formatNum(res.evEfficiency, 1)} กม./kWh`,
                    rateText: `${formatMoney(res.electricityRate)} ฿/kWh`,
                    energyText: `${formatNum(res.ev.billedKwh, 1)} kWh (รวมสูญเสีย)`,
                    tripCost: res.ev.totalCost,
                    costPerKm: res.ev.costPerKm,
                    annualCost: res.annual.evYearlyCost,
                    yearlyKm: res.yearlyKm || 20000
                };
            } else {
                const res = (typeof calculateFuelCost === 'function')
                    ? calculateFuelCost(st)
                    : { distance: 0, efficiency: 15, oilPrice: 36.5, liters: 0, totalTripCost: 0, costPerKm: 0 };
                const yearlyKm = numberOrDefault(st.yearlyKm, 20000);
                const annualCost = Math.round(res.costPerKm * yearlyKm);
                return {
                    isEv: false,
                    modeLabel: 'รถยนต์น้ำมัน (ICE)',
                    distance: res.distance,
                    effText: `${formatNum(res.efficiency, 1)} กม./ลิตร`,
                    rateText: `${formatMoney(res.oilPrice)} ฿/ลิตร`,
                    energyText: `${formatNum(res.liters, 1)} ลิตร`,
                    tripCost: res.totalTripCost || res.fuelCost,
                    costPerKm: res.costPerKm,
                    annualCost: annualCost,
                    yearlyKm: yearlyKm
                };
            }
        });

        rows.push({
            label: 'ประเภทพลังงาน',
            values: results.map(r => r.modeLabel)
        });
        rows.push({
            label: 'ระยะทางคำนวณ',
            values: results.map(r => `${formatNum(r.distance)} กม.`)
        });
        rows.push({
            label: 'อัตราสิ้นเปลืองเฉลี่ย',
            values: results.map(r => r.effText)
        });
        rows.push({
            label: 'อัตราค่าพลังงานต่อหน่วย',
            values: results.map(r => r.rateText)
        });
        rows.push({
            label: 'พลังงานที่ใช้ตลอดทริป',
            values: results.map(r => r.energyText)
        });
        rows.push({
            label: 'ค่าพลังงานทริปนี้',
            values: results.map(r => `${formatMoney(r.tripCost)} ฿`)
        });

        const validCostResults = results.filter(r => r.distance > 0 && r.costPerKm > 0);
        if (validCostResults.length > 0) {
            const minCostRes = validCostResults.reduce((min, cur) => cur.costPerKm < min.costPerKm ? cur : min, validCostResults[0]);
            const minCostIdx = results.indexOf(minCostRes);
            const maxCost = Math.max(...validCostResults.map(r => r.costPerKm));
            const diffKm = maxCost - minCostRes.costPerKm;
            const maxAnnual = Math.max(...validCostResults.map(r => r.annualCost));
            const diffAnnual = maxAnnual - minCostRes.annualCost;

            rows.push({
                label: 'ต้นทุนเฉลี่ยต่อกิโลเมตร',
                values: results.map(r => `${formatMoney(r.costPerKm)} ฿/กม.`),
                bestIndex: minCostIdx,
                highlight: true
            });
            rows.push({
                label: 'ประมาณการค่าใช้จ่ายต่อปี (20,000 กม.)',
                values: results.map(r => `${formatMoney(r.annualCost)} ฿/ปี`),
                bestIndex: minCostIdx
            });

            winnerIndex = minCostIdx;
            deltaSummary = `🏆 ทางเลือกที่ประหยัดต้นทุนพลังงานที่สุดคือ "${items[winnerIndex].label}" ต้นทุนเพียง ${formatMoney(minCostRes.costPerKm)} บาท/กม. (ประมาณการ ${formatMoney(minCostRes.annualCost)} บาท/ปี)${diffAnnual > 0 ? ` ประหยัดกว่าทางเลือกสูงสุดถึง ${formatMoney(diffAnnual)} บาท/ปี (${formatMoney(diffKm)} บาท/กม.)` : ''}`;
        } else {
            rows.push({
                label: 'ต้นทุนเฉลี่ยต่อกิโลเมตร',
                values: results.map(r => `${formatMoney(r.costPerKm)} ฿/กม.`)
            });
            deltaSummary = `เปรียบเทียบข้อมูลต้นทุนพลังงาน ${items.length} ทางเลือก`;
        }

    } else if (toolId === 'construction_calc') {
        const results = items.map(item => {
            const st = item.state || {};
            return (typeof calculateConstructionMaterials === 'function')
                ? calculateConstructionMaterials(st)
                : { tab: 'tiles', areaSqm: 0, grossAreaSqm: 0, boxesNeeded: 0, grossPieces: 0, totalPurchasedPieces: 0, adhesiveBags: 0, groutBags: 0, costs: { totalEstimatedBudget: 0 } };
        });

        const isAllTiles = results.every(r => r.tab === 'tiles');
        const isAllPaint = results.every(r => r.tab === 'paint');
        const isAllConcrete = results.every(r => r.tab === 'concrete');

        if (isAllTiles) {
            rows.push({
                label: 'ขนาดพื้นที่ปูจริง',
                values: results.map(r => `${formatNum(r.areaSqm, 2)} ตร.ม.`)
            });
            rows.push({
                label: 'ขนาดกระเบื้อง & แผ่น/กล่อง',
                values: results.map(r => `${r.tileWidthCm}×${r.tileLengthCm} ซม. (${r.piecesPerBox} แผ่น)`)
            });
            rows.push({
                label: 'พื้นที่รวมเผื่อเศษ (' + (results[0]?.wastagePct || 10) + '%)',
                values: results.map(r => `${formatNum(r.grossAreaSqm, 2)} ตร.ม.`)
            });
            rows.push({
                label: 'จำนวนแผ่นที่ต้องใช้',
                values: results.map(r => `${r.grossPieces} แผ่น`)
            });
            rows.push({
                label: 'จำนวนกล่องที่ต้องสั่งซื้อ',
                values: results.map(r => `${r.boxesNeeded} กล่อง (${r.totalPurchasedPieces} แผ่น)`)
            });
            rows.push({
                label: 'ปูนกาวซีเมนต์ & กาวยาแนว',
                values: results.map(r => `ปูนกาว ${r.adhesiveBags} ถุง / ยาแนว ${r.groutBags} ถุง`)
            });
        } else if (isAllPaint) {
            rows.push({
                label: 'พื้นที่ผนังสุทธิ',
                values: results.map(r => `${formatNum(r.wallAreaSqm, 2)} ตร.ม.`)
            });
            rows.push({
                label: 'สีรองพื้น (Primer 1 เที่ยว)',
                values: results.map(r => `${formatNum(r.primer.litersNeeded, 1)} ลิตร`)
            });
            rows.push({
                label: 'สีทับหน้า (' + (results[0]?.topcoat?.coats || 2) + ' เที่ยว)',
                values: results.map(r => `${formatNum(r.topcoat.litersNeeded, 1)} ลิตร`)
            });
            rows.push({
                label: 'บรรจุภัณฑ์แนะนำ (สีทับหน้า)',
                values: results.map(r => `${r.topcoat.pail5Gal > 0 ? `${r.topcoat.pail5Gal} ถังใหญ่ 5GL` : ''}${r.topcoat.can1Gal > 0 ? ` ${r.topcoat.can1Gal} GL` : ''}`)
            });
        } else if (isAllConcrete) {
            rows.push({
                label: 'พื้นที่ & ความหนา',
                values: results.map(r => `${formatNum(r.slabAreaSqm, 2)} ตร.ม. (หนา ${r.slabThicknessCm} ซม.)`)
            });
            rows.push({
                label: 'ปริมาตรสุทธิ / รวมเผื่อ',
                values: results.map(r => `${formatNum(r.netVolumeCubicM, 2)} / ${formatNum(r.grossVolumeCubicM, 2)} คิว`)
            });
            rows.push({
                label: 'คอนกรีตรถโม่สั่งซื้อ',
                values: results.map(r => `${r.readyMixOrderCubicM} คิว`)
            });
            rows.push({
                label: 'ตะแกรงเหล็กไวร์เมช',
                values: results.map(r => `${formatNum(r.wireMeshSqm, 2)} ตร.ม.`)
            });
        } else {
            rows.push({
                label: 'หมวดหมู่งาน',
                values: results.map(r => r.tab === 'tiles' ? 'กระเบื้อง' : (r.tab === 'paint' ? 'สีทาอาคาร' : 'คอนกรีต'))
            });
        }

        const validBudgets = results.filter(r => r.costs && r.costs.totalEstimatedBudget > 0);
        if (validBudgets.length > 0) {
            const minBudgetRes = validBudgets.reduce((min, cur) => cur.costs.totalEstimatedBudget < min.costs.totalEstimatedBudget ? cur : min, validBudgets[0]);
            const minBudgetIdx = results.indexOf(minBudgetRes);
            const maxBudget = Math.max(...validBudgets.map(r => r.costs.totalEstimatedBudget));
            const diffBudget = maxBudget - minBudgetRes.costs.totalEstimatedBudget;

            rows.push({
                label: 'ประมาณการงบประมาณรวม',
                values: results.map(r => `${formatMoney(r.costs.totalEstimatedBudget)} ฿`),
                bestIndex: minBudgetIdx,
                highlight: true
            });

            winnerIndex = minBudgetIdx;
            deltaSummary = `🏆 ทางเลือกที่ประหยัดงบประมาณที่สุดคือ "${items[winnerIndex].label}" งบประมาณเพียง ${formatMoney(minBudgetRes.costs.totalEstimatedBudget)} บาท${diffBudget > 0 ? ` (ประหยัดกว่าทางเลือกสูงสุด ${formatMoney(diffBudget)} บาท)` : ''}`;
        } else {
            rows.push({
                label: 'จำนวนวัสดุหลักที่ต้องสั่ง',
                values: results.map(r => r.tab === 'tiles' ? `${r.boxesNeeded} กล่อง` : (r.tab === 'paint' ? `${formatNum(r.topcoat.litersNeeded, 1)} ลิตร` : `${r.readyMixOrderCubicM} คิว`))
            });
            deltaSummary = `เปรียบเทียบรายการวัสดุก่อสร้าง ${items.length} ทางเลือก`;
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
