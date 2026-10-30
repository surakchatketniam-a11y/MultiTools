// ==============================================================
// Multitools Calculator - Actions, Status Banner & Print
// ==============================================================

let lastClearSnapshot = null;

function captureToolSnapshot() {
    if (typeof appState === 'undefined') return null;
    return {
        toolId: appState.activeToolId,
        fieldIndex: appState.activeFieldIndex,
        state: JSON.parse(JSON.stringify(appState[appState.activeToolId]))
    };
}

function rememberToolClear(snapshot) {
    if (!snapshot || typeof appState === 'undefined') return;
    if (JSON.stringify(snapshot.state) === JSON.stringify(appState[snapshot.toolId])) return;
    lastClearSnapshot = snapshot;
    const undoBtn = typeof document !== 'undefined' ? document.getElementById('menuUndoClear') : null;
    if (undoBtn) undoBtn.disabled = false;
}

function undoLastClear() {
    if (!lastClearSnapshot || typeof appState === 'undefined') return;
    const snapshot = lastClearSnapshot;
    lastClearSnapshot = null;
    appState[snapshot.toolId] = snapshot.state;
    appState.activeToolId = snapshot.toolId;
    appState.activeFieldIndex = snapshot.fieldIndex;
    const undoBtn = typeof document !== 'undefined' ? document.getElementById('menuUndoClear') : null;
    if (undoBtn) undoBtn.disabled = true;
    if (typeof renderSidebarMenu === 'function') renderSidebarMenu();
    if (typeof renderActiveTool === 'function') renderActiveTool();
}

function clearCurrentTool() {
    const snapshot = captureToolSnapshot();
    const id = appState.activeToolId;
    appState.activeFieldIndex = 0;

    if (id === 'unit_price') {
        appState.unit_price.rows.forEach(r => { r.price = ''; r.qty = ''; r.unit = 'unit'; });
    } else if (id === 'calc') {
        appState.calc.expr = '';
        appState.calc.result = '0';
    } else if (id === 'currency') {
        appState.currency.amount = '';
        appState.currency.customRateToTHB = '';
    } else if (id === 'unit') {
        appState.unit.val = '';
    } else if (id === 'discount') {
        appState.discount.price = '';
        appState.discount.discountPct = '';
        appState.discount.extraPct = '';
    } else if (id === 'percent') {
        appState.percent.x = '';
        appState.percent.y = '';
        appState.percent.z = '';
    } else if (id === 'vat') {
        appState.vat.amount = '';
    } else if (id === 'vat_wht') {
        appState.vat_wht.amount = '';
    } else if (id === 'salary') {
        appState.salary.income = '';
        appState.salary.baseSalary = '';
        appState.salary.otAmount = '';
        appState.salary.allowance = '';
        appState.salary.bonusMonthly = '';
        appState.salary.customDeduction = '';
    } else if (id === 'loan') {
        appState.loan.principal = '';
        appState.loan.extra = '0';
    } else if (id === 'savings') {
        appState.savings.initial = '';
        appState.savings.monthly = '';
    } else if (id === 'date_work') {
        appState.date_work.customHolidays = '';
        appState.date_work.offset = '0';
    } else if (id === 'date_calc') {
        appState.date_calc.daysOffset = 0;
    } else if (id === 'world_time') {
        appState.world_time.search = '';
    } else if (id === 'gpa') {
        appState.gpa.courses = [{ name: 'วิชาที่ 1', credit: 3, grade: '4.0' }];
    } else if (id === 'health') {
        appState.health.weight = '';
        appState.health.height = '';
        appState.health.age = '';
    } else if (id === 'ovulation') {
        appState.ovulation.lastPeriodDate = formatLocalDate(new Date());
    } else if (id === 'fuel_cost') {
        const curMode = appState.fuel_cost?.mode || 'fuel';
        appState.fuel_cost = {
            mode: curMode,
            distance: '',
            efficiency: '15',
            oilPrice: '36.50',
            evEfficiency: '6.5',
            electricityRate: '2.90',
            chargingPreset: 'home_offpeak',
            chargingLossPct: '10',
            batteryCapacity: '60',
            compareIceEfficiency: '15',
            compareFuelPrice: '36.50',
            yearlyKm: '20000'
        };
    } else if (id === 'land_fill_calc') {
        appState.land_fill_calc = { mode: appState.land_fill_calc?.mode || 'land', rai: '', ngan: '', wa: '', width: '', length: '', heightCm: '', soil: 'general', shrinkPct: '25', truck6Cap: '5.5', truck10Cap: '11', pricePerM3: '', spreadPerM3: '' };
    } else if (id === 'wall_ceiling_calc') {
        appState.wall_ceiling_calc = { tab: appState.wall_ceiling_calc?.tab || 'masonry', wallLength: '', wallHeight: '', deductArea: '0', brickType: 'lightweight', bricksPerSqm: '8.33', masonryWastePct: '5', plasterSides: '2', plasterCoverage: '2', brickPrice: '', plasterBagPrice: '', masonryLaborPerSqm: '', plasterLaborPerSqm: '', ceilingArea: '', ceilingType: 'gypsum', panelAreaSqm: '2.88', ceilingWastePct: '10', panelPrice: '', ceilingLaborPerSqm: '' };
    } else if (id === 'btu_calc') {
        appState.btu_calc = { width: '', length: '', height: '2.8', btuPerSqm: '750', hoursPerDay: '8', ratePerKwh: '4.5', fixedSeer: '11', inverterSeer: '20' };
    } else if (id === 'fuel_eff') {
        appState.fuel_eff.distance = '';
        appState.fuel_eff.fuelUsed = '';
    } else if (id === 'area_cost') {
        appState.area_cost.rai = '0';
        appState.area_cost.ngan = '0';
        appState.area_cost.wa = '0';
        appState.area_cost.rate = '';
        appState.area_cost.price = '';
    } else if (id === 'tip') {
        appState.tip.bill = '';
    } else if (id === 'hex') {
        appState.hex.decValue = 0;
    } else if (id === 'lotto_calc') {
        appState.lotto_calc = {
            activeTab: 'bet',
            betNumberInput: '',
            numbersList: [],
            pricePerNumber: '20',
            payoutRate: '900',
            claimPrize: 'back2',
            claimTicketCount: '1',
            claimChannel: 'bank',
            claimCustomRate: '2.0',
            lottoSpendPerDraw: '500',
            savingsYears: '10',
            savingsRate: '7',
            luckyType: '3digit',
            luckyResult: ''
        };
    } else if (id === 'tax_personal') {
        appState.tax_personal = {
            activeTab: 'income',
            salaryMonthly: '',
            bonusYearly: '',
            otherIncomeYearly: '',
            withholdingTax: '',
            hasSpouse: 'no',
            childCount: '0',
            child2018Count: '0',
            parentCount: '0',
            disabledCareCount: '0',
            socialSecurity: '',
            lifeInsurance: '',
            healthInsurance: '',
            parentHealthInsurance: '',
            pvdGpf: '',
            rmf: '',
            ssf: '',
            pensionInsurance: '',
            thaiEsg: '',
            homeLoanInterest: '',
            donationEducation: '',
            donationGeneral: ''
        };
    } else if (id === 'property_transfer') {
        appState.property_transfer = {
            appraisedValue: '',
            salePrice: '',
            mortgageAmount: '',
            holdingYears: '1',
            exemptSBT: 'no',
            splitMode: 'custom',
            isGovMeasure: 'standard'
        };
    } else if (id === 'gold_thai') {
        appState.gold_thai = {
            mode: 'buy',
            goldType: 'ornament',
            weightUnit: 'baht',
            weightValue: '',
            craftFee: '',
            priceBarBuy: '43900',
            priceBarSell: '44000',
            priceOrnamentBuy: '43115',
            priceOrnamentSell: '44500',
            savingsCostPerBaht: ''
        };
    } else if (id === 'electricity_bill') {
        appState.electricity_bill = {
            mode: 'bill',
            tariffType: 'type1_2',
            units: '',
            ftRate: '0.3972',
            appliances: [
                { id: 'air12k', name: 'แอร์ Inverter 12,000 BTU', watts: 900, qty: 1, hoursPerDay: 8 },
                { id: 'fridge', name: 'ตู้เย็น 2 ประตู', watts: 100, qty: 1, hoursPerDay: 24 },
                { id: 'fan', name: 'พัดลม 16 นิ้ว', watts: 50, qty: 2, hoursPerDay: 8 },
                { id: 'tv', name: 'สมาร์ททีวี 55 นิ้ว', watts: 100, qty: 1, hoursPerDay: 4 },
                { id: 'water', name: 'เครื่องทำน้ำอุ่น', watts: 3500, qty: 1, hoursPerDay: 0.5 }
            ]
        };
    } else if (id === 'car_loan') {
        appState.car_loan = {
            vehicleType: 'car',
            condition: 'new',
            price: '',
            downPaymentType: 'percent',
            downPaymentValue: '20',
            interestRate: '2.59',
            periodMonths: '60',
            payoffMonth: '30'
        };
    } else if (id === 'social_security') {
        appState.social_security = {
            section: 'm33',
            wageMonthly: '',
            contributionMonths: '180',
            m40Plan: 'plan2',
            m40ExtraSavings: ''
        };
    } else if (id === 'labor_severance') {
        appState.labor_severance = {
            salaryMonthly: '',
            mode: 'duration',
            serviceYears: '0',
            serviceMonths: '0',
            serviceDays: '0',
            startDate: formatLocalDate(new Date()),
            endDate: formatLocalDate(new Date()),
            noticeGiven: 'no',
            noticeMonths: '1',
            unusedLeaveDays: '0'
        };
    } else if (id === 'legal_interest') {
        appState.legal_interest = {
            principal: '',
            ratePreset: 'default_5',
            customRate: '5.0',
            calcMode: 'dates',
            startDate: formatLocalDate(addCalendarDays(new Date(), -30)),
            endDate: formatLocalDate(new Date()),
            overdueDays: '30'
        };
    } else if (id === 'ot_calc') {
        appState.ot_calc = {
            wageType: 'monthly',
            wageBase: '',
            workHoursPerDay: '8',
            otWeekdayHours: '',
            holidayWorkHours: '',
            holidayOtHours: '',
            shiftAllowance: ''
        };
    } else if (id === 'ecommerce_profit') {
        appState.ecommerce_profit = {
            platform: 'shopee',
            sellingPrice: '',
            productCost: '',
            packagingCost: '',
            shopVoucher: '',
            customerShipping: '',
            sellerShipping: '',
            adSpendPerOrder: '',
            commissionRatePct: '5.0',
            serviceFeePct: '4.0',
            transactionRatePct: '3.0',
            isVatApplied: 'yes'
        };
    } else if (id === 'debt_payoff') {
        appState.debt_payoff = {
            strategy: 'avalanche',
            extraMonthly: '0',
            debts: [
                { id: '1', name: '', balance: '', rate: '', minPayment: '' }
            ]
        };
    } else if (id === 'food_costing') {
        appState.food_costing = {
            recipeName: '',
            batchYield: '1',
            targetFoodCostPct: '30',
            sellingPrice: '',
            packagingCost: '0',
            hiddenCostBufferPct: '5',
            ingredients: [
                { id: '1', name: '', packPrice: '', packSize: '1000', packUnit: 'g', useAmount: '', useUnit: 'g', yieldPct: '100' }
            ]
        };
    } else if (id === 'construction_calc') {
        appState.construction_calc = {
            tab: appState.construction_calc?.tab || 'tiles',
            tileWidth: '',
            tileLength: '',
            tileSizePreset: '60x60',
            tileCustomWidthCm: '60',
            tileCustomLengthCm: '60',
            tileCustomPcsPerBox: '4',
            tileWastagePct: '10',
            tilePricePerBox: '',
            tileLaborPerSqm: '',
            adhesivePricePerBag: '160',
            groutPricePerBag: '50',

            paintWallWidth: '',
            paintWallHeight: '',
            paintDeductArea: '',
            paintCoats: '2',
            paintWastagePct: '10',
            paintPrimerPrice5Gal: '1800',
            paintPrimerPrice1Gal: '450',
            paintTopcoatPrice5Gal: '2400',
            paintTopcoatPrice1Gal: '600',
            paintLaborPerSqm: '',

            slabWidth: '',
            slabLength: '',
            slabThickness: '10',
            concreteWastagePct: '5',
            concreteType: 'ready_mix',
            concretePricePerCubic: '2000',
            wireMeshPricePerSqm: '35',
            concreteLaborPerSqm: '',
            cementBagPrice: '145',
            sandPricePerCubic: '450',
            gravelPricePerCubic: '500'
        };
    }
    rememberToolClear(snapshot);
    renderActiveTool();
}

function loadDemoForCurrentTool() {
    const id = appState.activeToolId;
    if (id === 'unit_price') {
        appState.unit_price.rows = [
            { id: 'A', price: '80', qty: '500', unit: 'g' },
            { id: 'B', price: '150', qty: '1', unit: 'kg' },
            { id: 'C', price: '320', qty: '2', unit: 'kg' },
            { id: 'D', price: '', qty: '', unit: 'g' }
        ];
    } else if (id === 'discount') {
        appState.discount = { price: '1590', discountPct: '25', extraPct: '10' };
    } else if (id === 'percent') {
        appState.percent = { mode: 'pct_of', x: '15', y: '2400', z: '5' };
    } else if (id === 'vat') {
        appState.vat = { amount: '1000', rate: '7', mode: 'exclude' };
    } else if (id === 'vat_wht') {
        appState.vat_wht = { amount: '10000', vatRate: '7', whtRate: '3', mode: 'before' };
    } else if (id === 'salary') {
        appState.salary = {
            mode: 'budget',
            income: '35000',
            needsPct: '50',
            wantsPct: '30',
            savingsPct: '20',
            emergencyPct: '10',
            debtPct: '10',
            baseSalary: '35000',
            otAmount: '3500',
            allowance: '2000',
            bonusMonthly: '0',
            hasSocialSecurity: 'yes',
            pvdPct: '3',
            customDeduction: '0',
            additionalDeductionsYearly: '0'
        };
    } else if (id === 'fuel_cost') {
        const curMode = appState.fuel_cost?.mode || 'fuel';
        appState.fuel_cost = {
            mode: curMode,
            distance: '320',
            efficiency: '16',
            oilPrice: '36.50',
            evEfficiency: '6.5',
            electricityRate: '2.90',
            chargingPreset: 'home_offpeak',
            chargingLossPct: '10',
            batteryCapacity: '60',
            compareIceEfficiency: '15',
            compareFuelPrice: '36.50',
            yearlyKm: '20000'
        };
    } else if (id === 'tip') {
        appState.tip = { bill: '1850', tipPct: '10', people: '4' };
    } else if (id === 'land_fill_calc') {
        appState.land_fill_calc = { mode: 'land', rai: '1', ngan: '2', wa: '50', width: '', length: '', heightCm: '50', soil: 'general', shrinkPct: '25', truck6Cap: '5.5', truck10Cap: '11', pricePerM3: '150', spreadPerM3: '40' };
    } else if (id === 'wall_ceiling_calc') {
        appState.wall_ceiling_calc = { tab: appState.wall_ceiling_calc?.tab || 'masonry', wallLength: '6', wallHeight: '3', deductArea: '3.6', brickType: 'lightweight', bricksPerSqm: '8.33', masonryWastePct: '5', plasterSides: '2', plasterCoverage: '2', brickPrice: '25', plasterBagPrice: '120', masonryLaborPerSqm: '180', plasterLaborPerSqm: '120', ceilingArea: '20', ceilingType: 'gypsum', panelAreaSqm: '2.88', ceilingWastePct: '10', panelPrice: '190', ceilingLaborPerSqm: '180' };
    } else if (id === 'btu_calc') {
        appState.btu_calc = { width: '4', length: '5', height: '2.8', btuPerSqm: '850', hoursPerDay: '8', ratePerKwh: '4.5', fixedSeer: '11', inverterSeer: '20' };
    } else if (id === 'fuel_eff') {
        appState.fuel_eff = { distance: '480', fuelUsed: '32' };
    } else if (id === 'loan') {
        // Keep the active tab: the refinance tab shares principal/months with the amortization tab,
        // so fill both sets of fields and only pick the shared values that suit the tab in use.
        const onRefinance = appState.loan?.tab === 'refinance';
        appState.loan = {
            tab: onRefinance ? 'refinance' : 'amortization',
            principal: onRefinance ? '2000000' : '600000',
            months: onRefinance ? '240' : '48',
            interestRate: '3.85', extra: '0', rateType: 'fixed', promoMonths: '12', rateAfter: '6.5', calcMethod: 'reducing',
            currentRate: '5.50', retentionRate: '3.80', retentionFee: '0', refinanceRate: '2.99',
            isGovReducedMortgage: 'no', appraisalFee: '2800', insuranceFee: '2000', otherRefinanceFees: '0'
        };
    } else if (id === 'savings') {
        appState.savings = { initial: '50000', monthly: '5000', interestRate: '2.5', years: '5', compound: true, mode: 'growth', goalTarget: '500000', annualIncrease: '0', inflationRate: '2.5', monthlyExpenses: '15000', emergencyMonths: '6', currentAge: '30', retirementAge: '60', retirementMonthly: '30000' };
    } else if (id === 'currency') {
        appState.currency.amount = '250';
        appState.currency.from = 'USD';
        appState.currency.to = 'THB';
    } else if (id === 'unit') {
        appState.unit = { cat: 'area', val: '2.5', fromIdx: 0, targetIdx: 1 };
    } else if (id === 'date_work') {
        appState.date_work = { startDate: formatLocalDate(new Date()), endDate: formatLocalDate(addCalendarDays(new Date(), 45)), mode: 'between', offset: 30, calendarEra: 'CE', workDays: [1, 2, 3, 4, 5], includeThaiHolidays: true, customHolidays: '' };
    } else if (id === 'date_calc') {
        appState.date_calc = { mode: 'diff', startDate: formatLocalDate(new Date()), endDate: formatLocalDate(addCalendarDays(new Date(), 90)), op: 'add', daysOffset: 30, inclusive: false, workdays: false, includeThaiHolidays: false, birthDate: '1995-08-12', referenceDate: formatLocalDate(new Date()), calendarEra: 'CE' };
    } else if (id === 'world_time') {
        appState.world_time = { search: '', use24h: true, favoriteCities: ['Asia/Bangkok', 'Asia/Tokyo', 'Europe/London', 'America/New_York'], meetingTime: '14:00', meetingDate: formatLocalDate(new Date()) };
    } else if (id === 'gpa') {
        appState.gpa.courses = [
            { name: 'คณิตศาสตร์พื้นฐาน', credit: 3, grade: '4.0' },
            { name: 'ภาษาอังกฤษเพื่อการสื่อสาร', credit: 3, grade: '3.5' },
            { name: 'การเขียนโปรแกรมคอมพิวเตอร์', credit: 3, grade: '3.5' },
            { name: 'ฟิสิกส์ทั่วไป', credit: 3, grade: '3.0' }
        ];
    } else if (id === 'health') {
        appState.health = { gender: 'male', age: '28', height: '172', weight: '68', activity: '1.375' };
    } else if (id === 'ovulation') {
        appState.ovulation = { lastPeriodDate: formatLocalDate(addCalendarDays(new Date(), -12)), cycleLength: 28, periodDays: 5 };
    } else if (id === 'area_cost') {
        appState.area_cost = { rai: '2', ngan: '1', wa: '50', rate: '1500', price: '3450000', rounds: '1' };
    } else if (id === 'hex') {
        appState.hex = { activeBase: 10, decValue: 2026 };
    } else if (id === 'calc') {
        appState.calc.expr = '1,250 × 12 + 3,500';
        appState.calc.result = '18,500';
    } else if (id === 'lotto_calc') {
        appState.lotto_calc = {
            activeTab: 'bet',
            betNumberInput: '579',
            numbersList: ['579', '597', '759', '795', '957', '975'],
            pricePerNumber: '20',
            payoutRate: '900',
            claimPrize: 'back2',
            claimTicketCount: '2',
            claimChannel: 'bank',
            claimCustomRate: '2.0',
            lottoSpendPerDraw: '500',
            savingsYears: '10',
            savingsRate: '7',
            luckyType: '3digit',
            luckyResult: '579'
        };
    } else if (id === 'tax_personal') {
        appState.tax_personal = {
            activeTab: 'income',
            salaryMonthly: '65000',
            bonusYearly: '80000',
            otherIncomeYearly: '20000',
            withholdingTax: '25000',
            hasSpouse: 'no',
            childCount: '1',
            child2018Count: '1',
            parentCount: '1',
            disabledCareCount: '0',
            socialSecurity: '9000',
            lifeInsurance: '50000',
            healthInsurance: '15000',
            parentHealthInsurance: '0',
            pvdGpf: '45000',
            rmf: '30000',
            ssf: '20000',
            pensionInsurance: '0',
            thaiEsg: '30000',
            homeLoanInterest: '40000',
            donationEducation: '5000',
            donationGeneral: '2000'
        };
    } else if (id === 'property_transfer') {
        appState.property_transfer = {
            appraisedValue: '3500000',
            salePrice: '3800000',
            mortgageAmount: '3000000',
            holdingYears: '3',
            exemptSBT: 'no',
            splitMode: 'custom',
            isGovMeasure: 'standard'
        };
    } else if (id === 'gold_thai') {
        appState.gold_thai = {
            mode: 'buy',
            goldType: 'ornament',
            weightUnit: 'baht',
            weightValue: '2',
            craftFee: '1200',
            priceBarBuy: '43900',
            priceBarSell: '44000',
            priceOrnamentBuy: '43115',
            priceOrnamentSell: '44500',
            savingsCostPerBaht: '40000'
        };
    } else if (id === 'electricity_bill') {
        appState.electricity_bill = {
            mode: 'bill',
            tariffType: 'type1_2',
            units: '420',
            ftRate: '0.3972',
            appliances: [
                { id: 'air12k', name: 'แอร์ Inverter 12,000 BTU', watts: 900, qty: 1, hoursPerDay: 8 },
                { id: 'fridge', name: 'ตู้เย็น 2 ประตู', watts: 100, qty: 1, hoursPerDay: 24 },
                { id: 'fan', name: 'พัดลม 16 นิ้ว', watts: 50, qty: 2, hoursPerDay: 8 },
                { id: 'tv', name: 'สมาร์ททีวี 55 นิ้ว', watts: 100, qty: 1, hoursPerDay: 4 },
                { id: 'water', name: 'เครื่องทำน้ำอุ่น', watts: 3500, qty: 1, hoursPerDay: 0.5 }
            ]
        };
    } else if (id === 'car_loan') {
        appState.car_loan = {
            vehicleType: 'car',
            condition: 'new',
            price: '850000',
            downPaymentType: 'percent',
            downPaymentValue: '25',
            interestRate: '2.49',
            periodMonths: '60',
            payoffMonth: '36'
        };
    } else if (id === 'social_security') {
        appState.social_security = {
            section: 'm33',
            wageMonthly: '35000',
            contributionMonths: '240',
            m40Plan: 'plan2',
            m40ExtraSavings: '500'
        };
    } else if (id === 'labor_severance') {
        appState.labor_severance = {
            salaryMonthly: '45000',
            mode: 'duration',
            serviceYears: '5',
            serviceMonths: '8',
            serviceDays: '15',
            startDate: formatLocalDate(addCalendarDays(new Date(), -2085)),
            endDate: formatLocalDate(new Date()),
            noticeGiven: 'no',
            noticeMonths: '1',
            unusedLeaveDays: '6'
        };
    } else if (id === 'legal_interest') {
        appState.legal_interest = {
            principal: '250000',
            ratePreset: 'default_5',
            customRate: '5.0',
            calcMode: 'dates',
            startDate: formatLocalDate(addCalendarDays(new Date(), -120)),
            endDate: formatLocalDate(new Date()),
            overdueDays: '120'
        };
    } else if (id === 'ot_calc') {
        appState.ot_calc = {
            wageType: 'monthly',
            wageBase: '28000',
            workHoursPerDay: '8',
            otWeekdayHours: '16',
            holidayWorkHours: '8',
            holidayOtHours: '4',
            shiftAllowance: '1200'
        };
    } else if (id === 'ecommerce_profit') {
        appState.ecommerce_profit = {
            platform: 'shopee',
            sellingPrice: '390',
            productCost: '140',
            packagingCost: '12',
            shopVoucher: '20',
            customerShipping: '35',
            sellerShipping: '35',
            adSpendPerOrder: '35',
            commissionRatePct: '5.0',
            serviceFeePct: '4.0',
            transactionRatePct: '3.0',
            isVatApplied: 'yes'
        };
    } else if (id === 'debt_payoff') {
        appState.debt_payoff = {
            strategy: 'avalanche',
            extraMonthly: '3000',
            debts: [
                { id: '1', name: 'บัตรกดเงินสด A', balance: '25000', rate: '25', minPayment: '1250' },
                { id: '2', name: 'บัตรเครดิต B', balance: '45000', rate: '16', minPayment: '2250' },
                { id: '3', name: 'สินเชื่อส่วนบุคคล C', balance: '80000', rate: '18', minPayment: '3500' }
            ]
        };
    } else if (id === 'food_costing') {
        appState.food_costing = {
            recipeName: 'ข้าวกะเพราหมูสับไข่ดาว (Delivery)',
            batchYield: '1',
            targetFoodCostPct: '30',
            sellingPrice: '65',
            packagingCost: '4.5',
            hiddenCostBufferPct: '5',
            ingredients: [
                { id: '1', name: 'หมูสับติดมัน', packPrice: '160', packSize: '1000', packUnit: 'g', useAmount: '120', useUnit: 'g', yieldPct: '100' },
                { id: '2', name: 'ข้าวหอมมะลิสุก', packPrice: '45', packSize: '2500', packUnit: 'g', useAmount: '200', useUnit: 'g', yieldPct: '100' },
                { id: '3', name: 'ไข่ไก่สด เบอร์ 2', packPrice: '120', packSize: '30', packUnit: 'piece', useAmount: '1', useUnit: 'piece', yieldPct: '100' },
                { id: '4', name: 'ใบกะเพรา + พริกกระเทียม', packPrice: '50', packSize: '500', packUnit: 'g', useAmount: '30', useUnit: 'g', yieldPct: '90' },
                { id: '5', name: 'น้ำมันพืช & ซอสปรุงรส', packPrice: '65', packSize: '1000', packUnit: 'ml', useAmount: '25', useUnit: 'ml', yieldPct: '100' }
            ]
        };
    } else if (id === 'construction_calc') {
        appState.construction_calc = {
            tab: 'tiles',
            tileWidth: '4',
            tileLength: '5',
            tileSizePreset: '60x60',
            tileCustomWidthCm: '60',
            tileCustomLengthCm: '60',
            tileCustomPcsPerBox: '4',
            tileWastagePct: '10',
            tilePricePerBox: '380',
            tileLaborPerSqm: '250',
            adhesivePricePerBag: '160',
            groutPricePerBag: '50',

            paintWallWidth: '16',
            paintWallHeight: '2.8',
            paintDeductArea: '4',
            paintCoats: '2',
            paintWastagePct: '10',
            paintPrimerPrice5Gal: '1800',
            paintPrimerPrice1Gal: '450',
            paintTopcoatPrice5Gal: '2400',
            paintTopcoatPrice1Gal: '600',
            paintLaborPerSqm: '70',

            slabWidth: '4',
            slabLength: '6',
            slabThickness: '10',
            concreteWastagePct: '5',
            concreteType: 'ready_mix',
            concretePricePerCubic: '2000',
            wireMeshPricePerSqm: '35',
            concreteLaborPerSqm: '150',
            cementBagPrice: '145',
            sandPricePerCubic: '450',
            gravelPricePerCubic: '500'
        };
    }
    renderActiveTool();
}

function triggerPrintReceipt(toolId) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const targetId = toolId || appState.activeToolId;
    if (typeof hasInvalidNumericInput === 'function' && hasInvalidNumericInput(targetId)) {
        if (typeof showHistoryToast === 'function') {
            showHistoryToast('ข้อมูลตัวเลขไม่ถูกต้อง กรุณาแก้ไขก่อนพิมพ์', false);
        }
        return;
    }
    const printEl = document.getElementById('printFormalReceipt');
    if (printEl && typeof generateFormalPrintHTML === 'function') {
        printEl.innerHTML = generateFormalPrintHTML(targetId, appState);
    }
    window.print();
}

function setStatusBanner(stateType, htmlContent) {
    if (typeof document === 'undefined') return;
    if (typeof hasInvalidNumericInput === 'function' && hasInvalidNumericInput()) {
        stateType = 'error';
        htmlContent = 'รูปแบบตัวเลขไม่ถูกต้อง กรุณาแก้ข้อมูลก่อนใช้ผลคำนวณ เช่น 1,000 หรือ ๑๐๐๐';
        document.getElementById('sharedStatusBanner')?.classList.remove('hidden');
    }
    const banner = document.getElementById('sharedStatusBanner');
    const textEl = document.getElementById('sharedStatusText');
    if (!banner || !textEl) return;
    const isAirbnb = appState.theme === 'airbnb';
    const isDark = appState.theme === 'dark' || appState.theme === 'ferrari';
    const isTogether = appState.theme === 'together';

    const baseTextPad = 'pl-3 pr-10';

    if (stateType === 'empty') {
        banner.className = 'status-banner';
        textEl.className = `text-[var(--app-muted)] text-[1rem] ${baseTextPad}`;
        textEl.innerHTML = htmlContent || 'กรุณาป้อนข้อมูลของคุณ';
    } else if (stateType === 'success') {
        if (typeof scheduleRecordHistory === 'function' && (typeof hasInvalidNumericInput !== 'function' || !hasInvalidNumericInput())) {
            scheduleRecordHistory(appState.activeToolId);
        }
        if (isAirbnb) {
            banner.className = 'status-banner theme-success';
            textEl.className = `text-[var(--app-ink)] text-[0.98rem] font-semibold leading-snug w-full ${baseTextPad}`;
        } else if (isTogether) {
            banner.className = 'status-banner theme-success';
            textEl.className = `text-[var(--app-ink)] text-[1rem] font-bold leading-snug w-full ${baseTextPad}`;
        } else if (isDark) {
            banner.className = 'status-banner theme-success';
            textEl.className = `text-[var(--app-ink)] text-[1rem] font-bold leading-snug w-full ${baseTextPad}`;
        } else {
            banner.className = 'status-banner theme-success';
            textEl.className = `text-[var(--app-ink)] text-[1rem] font-bold leading-snug w-full ${baseTextPad}`;
        }
        textEl.innerHTML = htmlContent;
    } else {
        banner.className = 'status-banner';
        textEl.className = `text-[var(--app-ink)] text-[0.98rem] font-medium leading-snug w-full ${baseTextPad}`;
        textEl.innerHTML = htmlContent;
    }
}

function sanitizeSavedNumericValues(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const k of Object.keys(obj)) {
        if (typeof obj[k] === 'string' && /^\d+,\d+/.test(obj[k])) {
            obj[k] = formatInputDisplay(obj[k]);
        } else if (typeof obj[k] === 'object' && obj[k] !== null) {
            sanitizeSavedNumericValues(obj[k]);
        }
    }
}

(function(root) {
    const exportsObj = {
        captureToolSnapshot,
        rememberToolClear,
        undoLastClear,
        clearCurrentTool,
        loadDemoForCurrentTool,
        triggerPrintReceipt,
        setStatusBanner,
        sanitizeSavedNumericValues
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
