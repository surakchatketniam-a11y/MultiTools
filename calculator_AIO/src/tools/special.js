// ==============================================================
// Multitools Calculator - Health & Special Tools
// (health, ovulation, fuel_cost, fuel_eff, area_cost, hex, calc)
// ==============================================================

/* -----------------------------------------------------------
 * TOOL 8: ตัวชี้วัดร่างกาย (Body Metrics BMI & BMR)
 * ----------------------------------------------------------- */
function renderHealthTool(container) {
    const st = appState.health;
    const w = numberOrDefault(st.weight, 0);
    const hCm = numberOrDefault(st.height, 0);
    const age = numberOrDefault(st.age, 0);
    const activity = numberOrDefault(st.activity, 1.2);

    const hM = hCm / 100;
    const bmi = (w > 0 && hM > 0) ? (w / (hM * hM)) : 0;

    let bmr = 0;
    if (w > 0 && hCm > 0 && age > 0) {
        bmr = (10 * w) + (6.25 * hCm) - (5 * age) + (st.gender === 'male' ? 5 : -161);
    }
    const tdee = bmr * activity;
    const activityOptions = [
        { value: '1.2', label: 'นั่งทำงาน ไม่ค่อยออกกำลังกาย' },
        { value: '1.375', label: 'ออกกำลังกายเบา 1–3 วัน/สัปดาห์' },
        { value: '1.55', label: 'ออกกำลังกายปานกลาง 3–5 วัน/สัปดาห์' },
        { value: '1.725', label: 'ออกกำลังกายหนัก 6–7 วัน/สัปดาห์' },
        { value: '1.9', label: 'ใช้แรงงานหนัก / นักกีฬา' }
    ];

    let bmiCategory = 'ปกติ (สมส่วน)';
    if (bmi < 18.5) bmiCategory = 'น้ำหนักน้อย / ผอม';
    else if (bmi >= 23 && bmi < 25) bmiCategory = 'น้ำหนักเกิน (ท้วม)';
    else if (bmi >= 25 && bmi < 30) bmiCategory = 'โรคอ้วนระดับ 1';
    else if (bmi >= 30) bmiCategory = 'โรคอ้วนระดับ 2';

    container.innerHTML = `
        <div class="flex flex-col gap-1.5">
            <div class="segment-group grid-cols-2">
                <button class="segment-btn gender-btn ${st.gender === 'male' ? 'active' : ''}" data-g="male" aria-pressed="${st.gender === 'male'}">ชาย (Male)</button>
                <button class="segment-btn gender-btn ${st.gender === 'female' ? 'active' : ''}" data-g="female" aria-pressed="${st.gender === 'female'}">หญิง (Female)</button>
            </div>

            ${createKeypadFieldHTML(0, 'น้ำหนัก (Weight)', st.weight, 'กก.', '65')}
            ${createKeypadFieldHTML(1, 'ส่วนสูง (Height)', st.height, 'ซม.', '170')}
            ${createKeypadFieldHTML(2, 'อายุ (Age)', st.age, 'ปี', '28')}
            <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-btn-radius)] p-2">
                <label class="text-xs text-[#6a6a6a] block mb-1">ระดับกิจกรรมสำหรับคำนวณ TDEE</label>
                <select id="healthActivity" class="w-full font-semibold text-sm bg-transparent outline-none text-[#222222]">
                    ${activityOptions.map(option => `<option value="${option.value}" ${st.activity === option.value ? 'selected' : ''}>${option.label}</option>`).join('')}
                </select>
            </div>
        </div>
    `;

    attachFieldClickListeners(container);
    container.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            st.gender = btn.getAttribute('data-g');
            renderActiveTool();
        });
    });
    container.querySelector('#healthActivity').addEventListener('change', (event) => {
        st.activity = event.target.value;
        renderActiveTool();
    });

    if (bmi <= 0) {
        setStatusBanner('empty', 'ป้อนน้ำหนักและส่วนสูงเพื่อคำนวณค่า BMI และ BMR');
    } else {
        setStatusBanner('success', `BMI: <b class="text-[var(--app-accent)] underline">${formatNum(bmi, 1)}</b> (${bmiCategory})<span class="text-xs font-medium block text-[#3f3f3f]">พลังงานพื้นฐาน (BMR): ${Math.round(bmr).toLocaleString()} kcal/วัน · พลังงานที่ใช้ต่อวัน (TDEE): <b>${Math.round(tdee).toLocaleString()} kcal/วัน</b></span>`);
    }
}

/* -----------------------------------------------------------
 * TOOL 12: วันตกไข่ (Ovulation & Fertility Calculator)
 * ----------------------------------------------------------- */
function renderOvulationTool(container) {
    const st = appState.ovulation;
    const lmp = new Date(st.lastPeriodDate + 'T00:00:00');
    const cycle = integerOrDefault(st.cycleLength, 28);

    const nextPeriod = addCalendarDays(lmp, cycle);
    const ovulationDate = addCalendarDays(nextPeriod, -14);
    const fertileStart = addCalendarDays(ovulationDate, -5);
    const fertileEnd = addCalendarDays(ovulationDate, 1);

    const toISO = formatLocalDate;

    container.innerHTML = `
        <div class="flex flex-col gap-3 p-1">
            <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-3" style="box-shadow: var(--app-elevation);">
                <div>
                    <label class="text-xs font-semibold text-[#6a6a6a] block mb-1">วันแรกของประจำเดือนครั้งล่าสุด</label>
                    <input type="date" id="ovuDateInput" value="${st.lastPeriodDate}" class="airbnb-input w-full">
                </div>
                <div>
                    <label class="text-xs font-semibold text-[#6a6a6a] block mb-1">ความยาวรอบเดือนเฉลี่ย: <b class="text-[var(--app-accent)]">${cycle} วัน</b></label>
                    <input type="range" id="ovuCycleInput" min="21" max="35" value="${cycle}" class="w-full accent-[var(--app-accent)]">
                    <div class="flex justify-between text-[11px] text-[#6a6a6a]"><span>21 วัน</span><span>28 วัน (ปกติ)</span><span>35 วัน</span></div>
                </div>
            </div>

            <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-3" style="box-shadow: var(--app-elevation);">
                <div class="flex justify-between items-center border-b border-[#ebebeb] pb-2.5">
                    <span class="text-xs font-semibold text-[#222222]">วันตกไข่โดยประมาณ</span>
                    <span class="text-sm font-bold text-[var(--app-accent)]">${formatThaiDate(toISO(ovulationDate))}</span>
                </div>
                <div class="flex justify-between items-center border-b border-[#ebebeb] pb-2.5">
                    <span class="text-xs font-semibold text-[#222222]">ช่วงเวลาเจริญพันธุ์</span>
                    <span class="text-xs font-bold text-[var(--app-accent)]">${formatThaiDate(toISO(fertileStart))} - ${formatThaiDate(toISO(fertileEnd))}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs font-semibold text-[#6a6a6a]">ประจำเดือนรอบถัดไป</span>
                    <span class="text-xs font-bold text-[#222222]">${formatThaiDate(toISO(nextPeriod))}</span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('ovuDateInput').addEventListener('change', (e) => {
        if (e.target.value) {
            st.lastPeriodDate = e.target.value;
            renderActiveTool();
        }
    });
    document.getElementById('ovuCycleInput').addEventListener('input', (e) => {
        st.cycleLength = parseInt(e.target.value, 10);
        renderActiveTool();
    });
}

/* -----------------------------------------------------------
 * PURE ENGINE: คำนวณค่าน้ำมันเชื้อเพลิง (Fuel Cost)
 * ----------------------------------------------------------- */
function calculateFuelCost(params = {}) {
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

    const distance = Math.max(0, toNum(params.distance, 0));
    const efficiency = Math.max(0, toNum(params.efficiency, 15));
    const oilPrice = Math.max(0, toNum(params.oilPrice, 36.50));
    const tollFee = Math.max(0, toNum(params.tollFee, 0));
    const passengers = Math.max(1, Math.round(toNum(params.passengers, 1)));

    const litersNeeded = efficiency > 0 ? (distance / efficiency) : 0;
    const fuelCost = litersNeeded * oilPrice;
    const totalTripCost = fuelCost + tollFee;
    const costPerKm = distance > 0 ? (fuelCost / distance) : 0;
    const costPerPerson = passengers > 0 ? (totalTripCost / passengers) : totalTripCost;

    const round2 = (v) => Math.round(v * 100) / 100;

    return {
        distance,
        efficiency,
        oilPrice,
        tollFee: round2(tollFee),
        passengers,
        litersNeeded: round2(litersNeeded),
        liters: round2(litersNeeded),
        totalCost: round2(fuelCost),
        fuelCost: round2(fuelCost),
        totalTripCost: round2(totalTripCost),
        costPerKm: round2(costPerKm),
        costPerPerson: round2(costPerPerson)
    };
}

/* -----------------------------------------------------------
 * PURE ENGINE: ค่าชาร์จรถยนต์ไฟฟ้า EV & เทียบความคุ้มค่ารถน้ำมัน
 * ----------------------------------------------------------- */
function calculateEvCost(params = {}) {
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

    const distance = Math.max(0, toNum(params.distance, 0));
    const evEfficiency = Math.max(0.1, toNum(params.evEfficiency, 6.5));
    const electricityRate = Math.max(0, toNum(params.electricityRate, 2.90));
    const chargingLossPct = Math.max(0, Math.min(50, toNum(params.chargingLossPct, 10)));
    const batteryCapacity = Math.max(1, toNum(params.batteryCapacity, 60));
    const compareIceEfficiency = Math.max(0.1, toNum(params.compareIceEfficiency, 15));
    const compareFuelPrice = Math.max(0, toNum(params.compareFuelPrice, 36.50));
    const yearlyKm = Math.max(0, toNum(params.yearlyKm, 20000));

    // 1. EV Electric calculations
    const netKwh = distance > 0 ? (distance / evEfficiency) : 0;
    const lossMultiplier = 1 + (chargingLossPct / 100);
    const billedKwh = netKwh * lossMultiplier;
    const evTotalCost = billedKwh * electricityRate;
    const evCostPerKm = distance > 0 ? (evTotalCost / distance) : 0;
    const batteryCycles = batteryCapacity > 0 ? (netKwh / batteryCapacity) : 0;

    // 2. ICE (Petrol/Diesel) Comparison
    const iceLiters = distance > 0 ? (distance / compareIceEfficiency) : 0;
    const iceTotalCost = iceLiters * compareFuelPrice;
    const iceCostPerKm = distance > 0 ? (iceTotalCost / distance) : 0;

    // 3. Trip Savings
    const tripSavings = iceTotalCost - evTotalCost;
    const savingsPct = iceTotalCost > 0 ? ((tripSavings / iceTotalCost) * 100) : 0;
    const savingsPerKm = iceCostPerKm - evCostPerKm;

    // 4. Annual Projections (based on yearlyKm)
    const evYearlyKwh = (yearlyKm / evEfficiency) * lossMultiplier;
    const evYearlyCost = evYearlyKwh * electricityRate;
    const iceYearlyLiters = yearlyKm / compareIceEfficiency;
    const iceYearlyCost = iceYearlyLiters * compareFuelPrice;
    const yearlySavings = iceYearlyCost - evYearlyCost;
    const fiveYearSavings = yearlySavings * 5;

    return {
        distance,
        evEfficiency,
        electricityRate,
        chargingLossPct,
        batteryCapacity,
        compareIceEfficiency,
        compareFuelPrice,
        yearlyKm,
        ev: {
            netKwh: Math.round(netKwh * 100) / 100,
            billedKwh: Math.round(billedKwh * 100) / 100,
            totalCost: Math.round(evTotalCost * 100) / 100,
            costPerKm: Math.round(evCostPerKm * 100) / 100,
            batteryCycles: Math.round(batteryCycles * 10) / 10
        },
        ice: {
            litersNeeded: Math.round(iceLiters * 100) / 100,
            totalCost: Math.round(iceTotalCost * 100) / 100,
            costPerKm: Math.round(iceCostPerKm * 100) / 100
        },
        savings: {
            tripSavings: Math.round(tripSavings * 100) / 100,
            savingsPct: Math.round(savingsPct * 10) / 10,
            savingsPerKm: Math.round(savingsPerKm * 100) / 100,
            isSavings: tripSavings >= 0
        },
        annual: {
            evYearlyCost: Math.round(evYearlyCost),
            iceYearlyCost: Math.round(iceYearlyCost),
            yearlySavings: Math.round(yearlySavings),
            fiveYearSavings: Math.round(fiveYearSavings)
        }
    };
}

/* -----------------------------------------------------------
 * TOOL 7: ค่าน้ำมัน & ค่าชาร์จรถ EV เทียบความคุ้มค่า (Fuel & EV Cost)
 * ----------------------------------------------------------- */
function renderFuelCostTool(container) {
    const st = appState.fuel_cost;
    const mode = st.mode || 'fuel'; // 'fuel' | 'ev'

    let html = `
        <div class="fuel-cost-tool flex flex-col gap-3 p-1">
            <div class="segment-group grid-cols-2" role="group" aria-label="โหมดคำนวณเชื้อเพลิง">
                <button type="button" id="btnFuelModeFuel" aria-pressed="${mode !== 'ev'}" class="segment-btn ${mode !== 'ev' ? 'active' : ''}">
                    ค่าน้ำมันเดินทาง
                </button>
                <button type="button" id="btnFuelModeEv" aria-pressed="${mode === 'ev'}" class="segment-btn ${mode === 'ev' ? 'active' : ''}">
                    ชาร์จรถไฟฟ้า EV & เทียบน้ำมัน
                </button>
            </div>
    `;

    if (mode === 'fuel') {
        const calc = calculateFuelCost(st);

        html += `
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'ระยะทางที่เดินทาง', st.distance, 'กม.', 'ป้อนระยะทาง')}
                ${createKeypadFieldHTML(1, 'อัตราสิ้นเปลืองเชื้อเพลิง', st.efficiency, 'กม./ลิตร', 'เช่น 15')}
                ${createKeypadFieldHTML(2, 'ราคาน้ำมันต่อลิตร', st.oilPrice, 'บาท/ลิตร', 'เช่น 36.50')}
            </div>

            <!-- Quick Fuel Price Chips -->
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ราคาเฉลี่ยน้ำมันเชื้อเพลิงยอดนิยม</div>
                <div class="grid grid-cols-3 gap-2">
                    <button type="button" class="tool-chip-btn fuel-quick-price" data-price="37.50" style="min-height: 44px;">
                        แก๊สโซฮอล์ 95 (37.50฿)
                    </button>
                    <button type="button" class="tool-chip-btn fuel-quick-price" data-price="35.20" style="min-height: 44px;">
                        แก๊สโซฮอล์ E20 (35.20฿)
                    </button>
                    <button type="button" class="tool-chip-btn fuel-quick-price" data-price="33.00" style="min-height: 44px;">
                        ดีเซล B7 (33.00฿)
                    </button>
                </div>
            </div>

            <!-- Fuel Result Card -->
            <div class="themed-result-card p-4 space-y-2">
                <div class="text-xs text-[var(--app-muted)]">สรุปค่าน้ำมันเชื้อเพลิง</div>
                <div class="flex justify-between items-baseline">
                    <span class="text-xs font-semibold text-[var(--app-muted)]">ค่าน้ำมันรวม</span>
                    <span class="text-2xl font-bold font-mono text-[var(--app-accent)]" id="fuelTotalCostDisplay">
                        ฿${formatMoney(calc.totalCost)}
                    </span>
                </div>
                <div class="flex justify-between text-xs pt-1 border-t border-[var(--app-hairline)]">
                    <span class="text-[var(--app-muted)]">ปริมาณน้ำมันที่ใช้</span>
                    <b class="text-[var(--app-ink)] font-mono" id="fuelLitersDisplay">${formatNum(calc.litersNeeded, 2)} ลิตร</b>
                </div>
                <div class="flex justify-between text-xs">
                    <span class="text-[var(--app-muted)]">ต้นทุนเฉลี่ยต่อกิโลเมตร</span>
                    <b class="text-[var(--app-ink)] font-mono" id="fuelCostPerKmDisplay">฿${formatMoney(calc.costPerKm)} / กม.</b>
                </div>
            </div>
        `;
    } else {
        // Mode EV: Electric Vehicle Cost & ICE Comparison
        const calc = calculateEvCost(st);

        html += `
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'ระยะทางที่เดินทาง', st.distance, 'กม.', 'ป้อนระยะทาง')}
                ${createKeypadFieldHTML(1, 'อัตราประหยัดไฟ EV', st.evEfficiency || '6.5', 'กม./kWh', 'เช่น 6.5')}
                ${createKeypadFieldHTML(2, 'อัตราค่าไฟฟ้า', st.electricityRate || '2.90', 'บาท/หน่วย', 'เช่น 2.90')}
            </div>

            <!-- EV Car Presets -->
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">อัตรากินไฟรถยนต์ไฟฟ้าเฉลี่ย</div>
                <div class="grid grid-cols-3 gap-2">
                    <button type="button" class="tool-chip-btn ev-quick-eff" data-eff="7.0" style="min-height: 44px;">
                        Eco EV (7.0 กม./หน่วย)
                    </button>
                    <button type="button" class="tool-chip-btn ev-quick-eff" data-eff="6.2" style="min-height: 44px;">
                        C-SUV (6.2 กม./หน่วย)
                    </button>
                    <button type="button" class="tool-chip-btn ev-quick-eff" data-eff="5.5" style="min-height: 44px;">
                        Sedan/LR (5.5 กม./หน่วย)
                    </button>
                </div>
            </div>

            <!-- Charging Rate Presets -->
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">รูปแบบและสถานที่ชาร์จไฟฟ้าในไทย</div>
                <div class="grid grid-cols-2 gap-2">
                    <button type="button" class="tool-chip-btn ev-quick-rate" data-rate="2.90" data-preset="home_offpeak" style="min-height: 44px;">
                        ชาร์จบ้าน TOU (2.90 ฿/หน่วย)
                    </button>
                    <button type="button" class="tool-chip-btn ev-quick-rate" data-rate="4.50" data-preset="home_normal" style="min-height: 44px;">
                        ชาร์จบ้านปกติ (4.50 ฿/หน่วย)
                    </button>
                    <button type="button" class="tool-chip-btn ev-quick-rate" data-rate="5.80" data-preset="dc_offpeak" style="min-height: 44px;">
                        ตู้ DC Off-Peak (5.80 ฿/หน่วย)
                    </button>
                    <button type="button" class="tool-chip-btn ev-quick-rate" data-rate="7.80" data-preset="dc_peak" style="min-height: 44px;">
                        ตู้ DC On-Peak (7.80 ฿/หน่วย)
                    </button>
                </div>
            </div>

            <!-- Advanced Charging Settings -->
            <div class="themed-tool-card p-3 space-y-2.5 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">การตั้งค่าการชาร์จ & แบตเตอรี่</div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label for="evChargingLoss" class="block text-[var(--app-muted)] mb-1">สูญเสียชาร์จ (Loss %)</label>
                        <input id="evChargingLoss" type="number" min="0" max="50" step="1" value="${st.chargingLossPct || '10'}" class="airbnb-input w-full" style="min-height: 44px;">
                    </div>
                    <div>
                        <label for="evBatteryCap" class="block text-[var(--app-muted)] mb-1">ขนาดแบตเตอรี่ (kWh)</label>
                        <input id="evBatteryCap" type="number" min="1" max="200" step="1" value="${st.batteryCapacity || '60'}" class="airbnb-input w-full" style="min-height: 44px;">
                    </div>
                </div>
            </div>

            <!-- EV Result Card -->
            <div class="themed-result-card p-4 space-y-2">
                <div class="text-xs text-[var(--app-muted)]">สรุปค่าไฟฟ้าชาร์จรถ EV</div>
                <div class="flex justify-between items-baseline">
                    <span class="text-xs font-semibold text-[var(--app-muted)]">ค่าชาร์จไฟรวม</span>
                    <span class="text-2xl font-bold font-mono text-[var(--app-accent)]" id="evTotalCostResult">
                        ฿${formatMoney(calc.ev.totalCost)}
                    </span>
                </div>
                <div class="flex justify-between text-xs pt-1 border-t border-[var(--app-hairline)]">
                    <span class="text-[var(--app-muted)]">ต้นทุนค่าไฟเฉลี่ยต่อกิโลเมตร</span>
                    <b class="text-[var(--app-ink)] font-mono text-sm" id="evCostPerKmResult">฿${formatMoney(calc.ev.costPerKm)} / กม.</b>
                </div>
                <div class="flex justify-between text-xs">
                    <span class="text-[var(--app-muted)]">ไฟฟ้าที่ดึงจากมิเตอร์จริง (รวม Loss ${calc.chargingLossPct}%)</span>
                    <b class="text-[var(--app-ink)] font-mono" id="evBilledKwhResult">${formatNum(calc.ev.billedKwh, 1)} หน่วย (kWh)</b>
                </div>
                <div class="flex justify-between text-xs">
                    <span class="text-[var(--app-muted)]">รอบชาร์จเทียบเท่าแบตเต็ม</span>
                    <b class="text-[var(--app-ink)] font-mono" id="evBatteryCyclesResult">${formatNum(calc.ev.batteryCycles, 1)} รอบ</b>
                </div>
            </div>

            <!-- Comparison with ICE Card -->
            <div class="themed-tool-card p-4 space-y-3 text-xs">
                <div class="font-bold text-[var(--app-ink)] text-sm border-b border-[var(--app-hairline)] pb-2 flex justify-between items-center">
                    <span>เปรียบเทียบกับรถน้ำมันในระยะทางเดียวกัน</span>
                    <span class="text-xs font-normal text-[var(--app-muted)]">${calc.distance > 0 ? `${formatMoney(calc.distance)} กม.` : 'ทริปนี้'}</span>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label for="compareIceEff" class="block text-[var(--app-muted)] mb-1">รถน้ำมัน (กม./ลิตร)</label>
                        <input id="compareIceEff" type="number" min="1" step="0.5" value="${st.compareIceEfficiency || '15'}" class="airbnb-input w-full" style="min-height: 44px;">
                    </div>
                    <div>
                        <label for="compareFuelPrice" class="block text-[var(--app-muted)] mb-1">ราคาน้ำมัน (บาท/ลิตร)</label>
                        <input id="compareFuelPrice" type="number" min="1" step="0.1" value="${st.compareFuelPrice || '36.50'}" class="airbnb-input w-full" style="min-height: 44px;">
                    </div>
                </div>

                <!-- Savings Highlight -->
                <div class="p-3 rounded-xl border flex flex-col gap-1.5" style="background-color: var(--app-surface-soft); border-color: var(--app-hairline);">
                    <div class="flex justify-between items-center">
                        <span class="text-[var(--app-muted)]">ค่าน้ำมันของรถทั่วไป</span>
                        <b class="text-[var(--app-ink)] font-mono" id="iceTotalCostResult">฿${formatMoney(calc.ice.totalCost)} (เฉลี่ย ฿${formatMoney(calc.ice.costPerKm)}/กม.)</b>
                    </div>
                    <div class="flex justify-between items-center text-sm font-bold pt-1 border-t border-[var(--app-hairline)]">
                        <span>ส่วนต่างความคุ้มค่า</span>
                        <span class="font-mono ${calc.savings.isSavings ? 'text-green-600' : 'text-red-500'}" id="tripSavingsResult">
                            ${calc.savings.isSavings ? 'ประหยัด ' : 'แพงกว่า '}฿${formatMoney(Math.abs(calc.savings.tripSavings))} บาท (${calc.savings.savingsPct}%)
                        </span>
                    </div>
                </div>

                <!-- Annual Mileage Projection -->
                <div class="themed-subcard p-3 space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="font-semibold text-[var(--app-ink)]">จำลองระยะวิ่งต่อปี</span>
                        <div class="flex items-center gap-1">
                            <input id="evYearlyKm" type="number" min="1000" step="1000" value="${st.yearlyKm || '20000'}" class="airbnb-input text-right font-mono text-xs w-24 py-1" style="min-height: 36px;">
                            <span class="text-[var(--app-muted)]">กม./ปี</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-1.5">
                        <button type="button" class="tool-chip-btn ev-quick-year-km text-[11px]" data-km="10000" style="min-height: 38px;">10,000 กม.</button>
                        <button type="button" class="tool-chip-btn ev-quick-year-km text-[11px]" data-km="20000" style="min-height: 38px;">20,000 กม.</button>
                        <button type="button" class="tool-chip-btn ev-quick-year-km text-[11px]" data-km="30000" style="min-height: 38px;">30,000 กม.</button>
                    </div>

                    <div class="space-y-1.5 pt-2 text-xs">
                        <div class="flex justify-between">
                            <span class="text-[var(--app-muted)]">EV จ่ายค่าไฟต่อปี:</span>
                            <b class="text-[var(--app-ink)] font-mono" id="evYearlyCostResult">฿${formatMoney(calc.annual.evYearlyCost)} บาท/ปี</b>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-[var(--app-muted)]">รถน้ำมันจ่ายต่อปี:</span>
                            <b class="text-[var(--app-ink)] font-mono" id="iceYearlyCostResult">฿${formatMoney(calc.annual.iceYearlyCost)} บาท/ปี</b>
                        </div>
                        <div class="flex justify-between font-bold text-green-600 pt-1 border-t border-[var(--app-hairline)]">
                            <span>ประหยัดเงินต่อปี:</span>
                            <span class="font-mono" id="yearlySavingsResult">+฿${formatMoney(calc.annual.yearlySavings)} บาท/ปี</span>
                        </div>
                        <div class="flex justify-between text-[11px] text-[var(--app-muted)]">
                            <span>คาดการณ์ประหยัดสะสม 5 ปี:</span>
                            <b class="text-green-600 font-mono" id="fiveYearSavingsResult">+฿${formatMoney(calc.annual.fiveYearSavings)} บาท</b>
                        </div>
                    </div>
                </div>

                <div class="pt-1">
                    <button type="button" id="btnPrintFuelReport" class="tool-action-btn w-full" style="min-height: 44px;">
                        พิมพ์ใบสรุปเปรียบเทียบค่าเดินทาง (Print/PDF)
                    </button>
                </div>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Attach keypad field click listeners
    attachFieldClickListeners(container);

    // Live update function for EV mode without destroying DOM
    function updateEvLive() {
        const curCalc = calculateEvCost(st);

        const totalCostEl = container.querySelector('#evTotalCostResult');
        if (totalCostEl) totalCostEl.textContent = `฿${formatMoney(curCalc.ev.totalCost)}`;

        const costPerKmEl = container.querySelector('#evCostPerKmResult');
        if (costPerKmEl) costPerKmEl.textContent = `฿${formatMoney(curCalc.ev.costPerKm)} / กม.`;

        const billedKwhEl = container.querySelector('#evBilledKwhResult');
        if (billedKwhEl) billedKwhEl.textContent = `${formatNum(curCalc.ev.billedKwh, 1)} หน่วย (kWh)`;

        const cyclesEl = container.querySelector('#evBatteryCyclesResult');
        if (cyclesEl) cyclesEl.textContent = `${formatNum(curCalc.ev.batteryCycles, 1)} รอบ`;

        const iceTotalEl = container.querySelector('#iceTotalCostResult');
        if (iceTotalEl) iceTotalEl.textContent = `฿${formatMoney(curCalc.ice.totalCost)} (เฉลี่ย ฿${formatMoney(curCalc.ice.costPerKm)}/กม.)`;

        const tripSavingsEl = container.querySelector('#tripSavingsResult');
        if (tripSavingsEl) {
            tripSavingsEl.className = `font-mono ${curCalc.savings.isSavings ? 'text-green-600' : 'text-red-500'}`;
            tripSavingsEl.textContent = `${curCalc.savings.isSavings ? 'ประหยัด ' : 'แพงกว่า '}฿${formatMoney(Math.abs(curCalc.savings.tripSavings))} บาท (${curCalc.savings.savingsPct}%)`;
        }

        const evYearlyEl = container.querySelector('#evYearlyCostResult');
        if (evYearlyEl) evYearlyEl.textContent = `฿${formatMoney(curCalc.annual.evYearlyCost)} บาท/ปี`;

        const iceYearlyEl = container.querySelector('#iceYearlyCostResult');
        if (iceYearlyEl) iceYearlyEl.textContent = `฿${formatMoney(curCalc.annual.iceYearlyCost)} บาท/ปี`;

        const yearlySavingsEl = container.querySelector('#yearlySavingsResult');
        if (yearlySavingsEl) yearlySavingsEl.textContent = `+฿${formatMoney(curCalc.annual.yearlySavings)} บาท/ปี`;

        const fiveYearSavingsEl = container.querySelector('#fiveYearSavingsResult');
        if (fiveYearSavingsEl) fiveYearSavingsEl.textContent = `+฿${formatMoney(curCalc.annual.fiveYearSavings)} บาท`;

        // Status banner
        if (curCalc.distance <= 0) {
            setStatusBanner('empty', 'ป้อนระยะทางและอัตราค่าไฟเพื่อคำนวณค่าชาร์จ EV และเทียบกับรถน้ำมัน');
        } else {
            setStatusBanner('success', `ค่าชาร์จ EV <b>${formatMoney(curCalc.ev.totalCost)} บาท</b> (${formatMoney(curCalc.ev.costPerKm)} ฿/กม.) · ประหยัดกว่ารถน้ำมัน <b>${formatMoney(curCalc.savings.tripSavings)} บาท</b> (${curCalc.savings.savingsPct}%)`);
        }
    }

    // Live update function for Fuel mode
    function updateFuelLive() {
        const curCalc = calculateFuelCost(st);

        const totalCostEl = container.querySelector('#fuelTotalCostDisplay');
        if (totalCostEl) totalCostEl.textContent = `฿${formatMoney(curCalc.totalCost)}`;

        const litersEl = container.querySelector('#fuelLitersDisplay');
        if (litersEl) litersEl.textContent = `${formatNum(curCalc.litersNeeded, 2)} ลิตร`;

        const costPerKmEl = container.querySelector('#fuelCostPerKmDisplay');
        if (costPerKmEl) costPerKmEl.textContent = `฿${formatMoney(curCalc.costPerKm)} / กม.`;

        if (curCalc.distance <= 0 || curCalc.efficiency <= 0) {
            setStatusBanner('empty', 'ป้อนระยะทางและอัตราสิ้นเปลืองเพื่อคำนวณค่าน้ำมัน');
        } else {
            setStatusBanner('success', `ค่าน้ำมันรวม: <span class="text-lg text-[var(--app-accent)] underline">${formatMoney(curCalc.totalCost)} บาท</span><span class="text-xs font-medium block text-[var(--app-muted)]">ใช้น้ำมัน ${formatNum(curCalc.litersNeeded, 2)} ลิตร (เฉลี่ย ${formatNum(curCalc.costPerKm, 2)} บาท/กม.)</span>`);
        }
    }

    // Event Bindings: Mode Switching
    container.querySelector('#btnFuelModeFuel')?.addEventListener('click', () => {
        st.mode = 'fuel';
        persistAppState();
        renderActiveTool();
    });

    container.querySelector('#btnFuelModeEv')?.addEventListener('click', () => {
        st.mode = 'ev';
        if (!st.evEfficiency) st.evEfficiency = '6.5';
        if (!st.electricityRate) st.electricityRate = '2.90';
        if (!st.compareIceEfficiency) st.compareIceEfficiency = '15';
        if (!st.compareFuelPrice) st.compareFuelPrice = '36.50';
        if (!st.yearlyKm) st.yearlyKm = '20000';
        persistAppState();
        renderActiveTool();
    });

    if (mode === 'fuel') {
        // Quick Fuel Price Chips
        container.querySelectorAll('.fuel-quick-price').forEach(btn => {
            btn.addEventListener('click', () => {
                st.oilPrice = btn.dataset.price;
                persistAppState();
                renderActiveTool();
            });
        });

        // Initial Status Banner
        const curCalc = calculateFuelCost(st);
        if (curCalc.distance <= 0 || curCalc.efficiency <= 0) {
            setStatusBanner('empty', 'ป้อนระยะทางและอัตราสิ้นเปลืองเพื่อคำนวณค่าน้ำมัน');
        } else {
            setStatusBanner('success', `ค่าน้ำมันรวม: <span class="text-lg text-[var(--app-accent)] underline">${formatMoney(curCalc.totalCost)} บาท</span><span class="text-xs font-medium block text-[var(--app-muted)]">ใช้น้ำมัน ${formatNum(curCalc.litersNeeded, 2)} ลิตร (เฉลี่ย ${formatNum(curCalc.costPerKm, 2)} บาท/กม.)</span>`);
        }
    } else {
        // EV Mode event listeners
        container.querySelectorAll('.ev-quick-eff').forEach(btn => {
            btn.addEventListener('click', () => {
                st.evEfficiency = btn.dataset.eff;
                persistAppState();
                renderActiveTool();
            });
        });

        container.querySelectorAll('.ev-quick-rate').forEach(btn => {
            btn.addEventListener('click', () => {
                st.electricityRate = btn.dataset.rate;
                st.chargingPreset = btn.dataset.preset;
                persistAppState();
                renderActiveTool();
            });
        });

        const lossInput = container.querySelector('#evChargingLoss');
        lossInput?.addEventListener('input', e => {
            st.chargingLossPct = e.target.value;
            persistAppState();
            updateEvLive();
        });
        lossInput?.addEventListener('blur', () => {
            st.chargingLossPct = formatInputDisplay(lossInput.value);
            lossInput.value = st.chargingLossPct;
            persistAppState();
            updateEvLive();
        });

        const battInput = container.querySelector('#evBatteryCap');
        battInput?.addEventListener('input', e => {
            st.batteryCapacity = e.target.value;
            persistAppState();
            updateEvLive();
        });
        battInput?.addEventListener('blur', () => {
            st.batteryCapacity = formatInputDisplay(battInput.value);
            battInput.value = st.batteryCapacity;
            persistAppState();
            updateEvLive();
        });

        const iceEffInput = container.querySelector('#compareIceEff');
        iceEffInput?.addEventListener('input', e => {
            st.compareIceEfficiency = e.target.value;
            persistAppState();
            updateEvLive();
        });
        iceEffInput?.addEventListener('blur', () => {
            st.compareIceEfficiency = formatInputDisplay(iceEffInput.value);
            iceEffInput.value = st.compareIceEfficiency;
            persistAppState();
            updateEvLive();
        });

        const iceFuelInput = container.querySelector('#compareFuelPrice');
        iceFuelInput?.addEventListener('input', e => {
            st.compareFuelPrice = e.target.value;
            persistAppState();
            updateEvLive();
        });
        iceFuelInput?.addEventListener('blur', () => {
            st.compareFuelPrice = formatInputDisplay(iceFuelInput.value);
            iceFuelInput.value = st.compareFuelPrice;
            persistAppState();
            updateEvLive();
        });

        const yearlyKmInput = container.querySelector('#evYearlyKm');
        yearlyKmInput?.addEventListener('input', e => {
            st.yearlyKm = e.target.value;
            persistAppState();
            updateEvLive();
        });
        yearlyKmInput?.addEventListener('blur', () => {
            st.yearlyKm = formatInputDisplay(yearlyKmInput.value);
            yearlyKmInput.value = st.yearlyKm;
            persistAppState();
            updateEvLive();
        });

        container.querySelectorAll('.ev-quick-year-km').forEach(btn => {
            btn.addEventListener('click', () => {
                st.yearlyKm = btn.dataset.km;
                if (yearlyKmInput) yearlyKmInput.value = st.yearlyKm;
                persistAppState();
                updateEvLive();
            });
        });

        container.querySelector('#btnPrintFuelReport')?.addEventListener('click', () => {
            triggerPrintReceipt('fuel_cost');
        });

        // Initial Status Banner
        const curCalc = calculateEvCost(st);
        if (curCalc.distance <= 0) {
            setStatusBanner('empty', 'ป้อนระยะทางและอัตราค่าไฟเพื่อคำนวณค่าชาร์จ EV และเทียบกับรถน้ำมัน');
        } else {
            setStatusBanner('success', `ค่าชาร์จ EV <b>${formatMoney(curCalc.ev.totalCost)} บาท</b> (${formatMoney(curCalc.ev.costPerKm)} ฿/กม.) · ประหยัดกว่ารถน้ำมัน <b>${formatMoney(curCalc.savings.tripSavings)} บาท</b> (${curCalc.savings.savingsPct}%)`);
        }
    }
}


/* -----------------------------------------------------------
 * TOOL 10: ประสิทธิภาพเชื้อเพลิง (Fuel Efficiency Calculator)
 * ----------------------------------------------------------- */
function renderFuelEffTool(container) {
    const st = appState.fuel_eff;
    const dist = numberOrDefault(st.distance, 0);
    const fuel = numberOrDefault(st.fuelUsed, 0);

    const kmPerLiter = (dist > 0 && fuel > 0) ? (dist / fuel) : 0;
    const literPer100Km = (dist > 0 && fuel > 0) ? ((fuel / dist) * 100) : 0;

    container.innerHTML = `
        <div class="flex flex-col gap-2">
            ${createKeypadFieldHTML(0, 'ระยะทางที่วิ่งได้', st.distance, 'กิโลเมตร', 'เช่น 450')}
            ${createKeypadFieldHTML(1, 'ปริมาณน้ำมันที่ใช้ไป', st.fuelUsed, 'ลิตร', 'เช่น 30')}
        </div>
    `;

    attachFieldClickListeners(container);

    if (kmPerLiter <= 0) {
        setStatusBanner('empty', 'ป้อนระยะทางที่วิ่งและปริมาณน้ำมันที่ใช้');
    } else {
        setStatusBanner('success', `อัตราสิ้นเปลือง: <span class="text-lg text-[var(--app-accent)] underline">${formatNum(kmPerLiter, 2)} กม./ลิตร</span><span class="text-xs font-medium block text-[#3f3f3f]">หรือคิดเป็น ${formatNum(literPer100Km, 2)} ลิตร ต่อ 100 กม.</span>`);
    }
}

/* -----------------------------------------------------------
 * TOOL: ต้นทุนต่อพื้นที่ (ที่ดิน) (Area Cost Calculator)
 * ----------------------------------------------------------- */
function renderAreaCostTool(container) {
    const st = appState.area_cost;
    const rai = numberOrDefault(st.rai, 0), ngan = numberOrDefault(st.ngan, 0), wa = numberOrDefault(st.wa, 0);
    const rate = parseNumericInput(st.rate), price = evaluateArithmeticExpression(st.price), rounds = numberOrDefault(st.rounds, 1);
    const totalRai = rai + ngan / 4 + wa / 400;
    const qty = totalRai * rate * rounds, total = qty * price;
    container.innerHTML = `<div class="flex flex-col gap-3 p-1"><div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-3" style="box-shadow:var(--app-elevation)"><div class="text-xs text-[#6a6a6a]">พื้นที่แบบผสม: 1 ไร่ = 4 งาน = 400 ตารางวา</div><div class="grid grid-cols-3 gap-2">${[['areaRai','ไร่',st.rai],['areaNgan','งาน',st.ngan],['areaWa','ตารางวา',st.wa]].map(([id,l,v])=>`<div><label class="text-xs font-semibold text-[#6a6a6a] block mb-1">${l}</label><input id="${id}" type="number" min="0" value="${v}" class="airbnb-input w-full"></div>`).join('')}</div><div class="grid grid-cols-2 gap-2"><div><label class="text-xs font-semibold text-[#6a6a6a] block mb-1">อัตราใช้ (กก./ไร่)</label><input id="areaRate" type="number" value="${st.rate}" placeholder="เช่น 25" class="airbnb-input w-full"></div><div><label class="text-xs font-semibold text-[#6a6a6a] block mb-1">ราคา (บาท/กก.)</label><input id="areaPrice" type="text" inputmode="decimal" value="${st.price}" placeholder="เช่น 980/50" class="airbnb-input w-full"><div class="text-[10px] text-[#6a6a6a] mt-1">รองรับ + - * / เช่น 980/50 = ราคาต่อกก.</div></div></div><div><label class="text-xs font-semibold text-[#6a6a6a] block mb-1">จำนวนรอบ</label><input id="areaRounds" type="number" min="1" value="${st.rounds}" class="airbnb-input w-full"></div></div><div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-2" style="box-shadow:var(--app-elevation)"><div class="flex justify-between"><span>พื้นที่รวม</span><b>${formatNum(totalRai, 4)} ไร่</b></div><div class="flex justify-between"><span>ปริมาณรวม</span><b>${formatNum(qty, 2)} กก.</b></div><div class="flex justify-between"><span>ต้นทุนต่อไร่</span><b>${formatMoney((rate || 0) * (price || 0) * rounds)} บาท</b></div></div></div>`;
    const areaPriceInput = document.getElementById('areaPrice');
    const pricePreview = document.createElement('div');
    pricePreview.className = 'text-xs font-semibold text-[var(--app-accent)] mt-1';
    areaPriceInput.parentElement.appendChild(pricePreview);
    const updateAreaPricePreview = () => {
        st.price = areaPriceInput.value;
        const calculatedPrice = evaluateArithmeticExpression(areaPriceInput.value);
        pricePreview.textContent = Number.isFinite(calculatedPrice) ? `= ${formatNum(calculatedPrice, 2)} บาท/กก.` : '';
    };
    updateAreaPricePreview();
    areaPriceInput.addEventListener('input', updateAreaPricePreview);
    ['areaRai','areaNgan','areaWa','areaRate','areaPrice','areaRounds'].forEach(id => document.getElementById(id).addEventListener('change', e => { const key = {areaRai:'rai',areaNgan:'ngan',areaWa:'wa',areaRate:'rate',areaPrice:'price',areaRounds:'rounds'}[id]; st[key] = e.target.value; renderActiveTool(); }));
    setStatusBanner(Number.isFinite(rate) && Number.isFinite(price) ? 'success' : 'empty', Number.isFinite(rate) && Number.isFinite(price) ? `ต้นทุนรวม: <span class="text-lg text-[var(--app-accent)] underline">${formatMoney(total)} บาท</span>` : 'กรอกอัตราการใช้และราคาเพื่อคำนวณต้นทุน');
}

/* -----------------------------------------------------------
 * TOOL 17: เลขฐานสิบหก (Hexadecimal / Base Converter)
 * ----------------------------------------------------------- */
function renderHexTool(container) {
    const st = appState.hex;
    const val = Math.max(0, Math.floor(st.decValue || 0));

    const decStr = val.toString(10);
    const hexStr = val.toString(16).toUpperCase();
    const binStr = val.toString(2);
    const octStr = val.toString(8);

    const hexKeys = ['A', 'B', 'C', 'D', 'E', 'F', '7', '8', '9', 'BS', '4', '5', '6', 'CLR', '1', '2', '3', '0'];

    container.innerHTML = `
        <div class="flex flex-col gap-2 h-full">
            <div class="space-y-1.5">
                ${[
                    { base: 10, label: 'DEC (ฐาน 10)', val: decStr },
                    { base: 16, label: 'HEX (ฐาน 16)', val: hexStr },
                    { base: 2,  label: 'BIN (ฐาน 2)',  val: binStr },
                    { base: 8,  label: 'OCT (ฐาน 8)',  val: octStr }
                ].map(item => `
                    <div class="clev-field-box ${st.activeBase === item.base ? 'active-field' : ''}" data-base="${item.base}">
                        <span class="text-xs font-bold text-[var(--app-accent)]">${item.label}</span>
                        <span class="font-mono font-semibold text-sm break-all text-[#222222]">${item.val}</span>
                    </div>
                `).join('')}
            </div>

            <div class="grid grid-cols-4 gap-1.5 flex-1 pt-1">
                ${hexKeys.map(k => {
                    let allowed = true;
                    if (k !== 'BS' && k !== 'CLR') {
                        const digitVal = parseInt(k, 16);
                        allowed = digitVal < st.activeBase;
                    }
                    return `<button class="key-btn !text-lg ${!allowed ? 'key-btn-disabled' : ''} ${(k === 'BS' || k === 'CLR') ? 'key-action' : ''}" data-hexkey="${k}">${k === 'BS' ? '⌫' : (k === 'CLR' ? 'C' : k)}</button>`;
                }).join('')}
            </div>
        </div>
    `;

    container.querySelectorAll('[data-base]').forEach(el => {
        el.addEventListener('click', () => {
            st.activeBase = parseInt(el.getAttribute('data-base'), 10);
            renderActiveTool();
        });
    });

    container.querySelectorAll('[data-hexkey]').forEach(btn => {
        btn.addEventListener('click', () => {
            const k = btn.getAttribute('data-hexkey');
            let curStr = st.decValue === 0 ? '' : st.decValue.toString(st.activeBase).toUpperCase();
            if (k === 'CLR') {
                st.decValue = 0;
            } else if (k === 'BS') {
                curStr = curStr.slice(0, -1);
                st.decValue = curStr ? parseInt(curStr, st.activeBase) : 0;
            } else {
                if (curStr.length < 12) {
                    curStr += k;
                    st.decValue = parseInt(curStr, st.activeBase) || 0;
                }
            }
            renderActiveTool();
        });
    });
}

/* -----------------------------------------------------------
 * TOOL 1: เครื่องคิดเลข (Standard Calculator with History)
 * ----------------------------------------------------------- */
function renderStandardCalcTool(container) {
    const st = appState.calc;
    container.innerHTML = `
        <div class="standard-calc flex flex-col h-full gap-2">
            <div class="standard-calc-display themed-result-card p-3.5 flex flex-col justify-between">
                <div class="text-xs text-[var(--app-muted)] flex justify-between items-center gap-2 border-b border-[var(--app-hairline)] pb-1.5">
                    ${st.history[0]
                        ? `<button id="restoreLatestCalcBtn" type="button" class="min-w-0 min-h-[44px] text-left break-all hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--app-accent)]" aria-label="นำการคำนวณล่าสุดกลับมาแก้ไข" title="แตะเพื่อนำกลับมาคำนวณใหม่">ล่าสุด: ${formatCalcExpr(st.history[0].expr)} = ${st.history[0].res}</button>`
                        : '<span class="min-w-0">ล่าสุด: -</span>'}
                    <button id="clearCalcHistBtn" class="shrink-0 min-h-[44px] text-[var(--app-accent)] font-semibold hover:underline">ล้างประวัติ</button>
                </div>
                <div class="standard-calc-expression text-right text-[var(--app-muted)] font-mono break-all min-h-[28px] mt-1">${formatCalcExpr(st.expr) || '0'}</div>
                <div class="standard-calc-result text-right font-bold text-[var(--app-ink)] font-mono break-all">= ${st.result}</div>
            </div>

            <div class="standard-calc-keypad grid grid-cols-4 grid-rows-5 gap-2">
                <button class="key-btn key-action text-xl" data-std="C">C</button>
                <button class="key-btn key-action text-xl" data-std="()">( )</button>
                <button class="key-btn key-action text-xl" data-std="%">%</button>
                <button class="key-btn key-action text-2xl" data-std="÷">÷</button>

                <button class="key-btn" data-std="7">7</button>
                <button class="key-btn" data-std="8">8</button>
                <button class="key-btn" data-std="9">9</button>
                <button class="key-btn key-action text-2xl" data-std="×">×</button>

                <button class="key-btn" data-std="4">4</button>
                <button class="key-btn" data-std="5">5</button>
                <button class="key-btn" data-std="6">6</button>
                <button class="key-btn key-action text-2xl" data-std="-">−</button>

                <button class="key-btn" data-std="1">1</button>
                <button class="key-btn" data-std="2">2</button>
                <button class="key-btn" data-std="3">3</button>
                <button class="key-btn key-action text-2xl" data-std="+">+</button>

                <button class="key-btn" data-std="0">0</button>
                <button class="key-btn" data-std=".">.</button>
                <button class="key-btn key-action" data-std="BS" aria-label="ลบ">⌫</button>
                <button class="key-btn key-primary-cta !bg-[var(--app-accent)] !text-white font-bold text-2xl" data-std="=">=</button>
            </div>
        </div>
    `;

    function evaluateStdExpr(raw) {
        if (!raw) return '0';
        try {
            const sanitized = raw
                .replace(/,/g, '')
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/%/g, '/100');
            if (!/^[0-9+\-*/().\s]+$/.test(sanitized)) return st.result;
            const val = Function('"use strict";return (' + sanitized + ')')();
            return isFinite(val) ? formatNum(val, 6) : 'Error';
        } catch {
            return st.result;
        }
    }

    container.querySelectorAll('[data-std]').forEach(btn => {
        btn.addEventListener('click', () => {
            const k = btn.getAttribute('data-std');
            if (k === 'C') {
                st.expr = '';
                st.result = '0';
            } else if (k === 'BS') {
                st.expr = st.expr.slice(0, -1);
                st.result = evaluateStdExpr(st.expr);
            } else if (k === '()') {
                const openCount = (st.expr.match(/\(/g) || []).length;
                const closeCount = (st.expr.match(/\)/g) || []).length;
                st.expr += openCount > closeCount ? ')' : '(';
                st.result = evaluateStdExpr(st.expr);
            } else if (k === '=') {
                const finalRes = evaluateStdExpr(st.expr);
                if (st.expr && finalRes !== 'Error') {
                    st.history.unshift({ expr: st.expr, res: finalRes });
                    st.expr = String(finalRes).replace(/,/g, '');
                    st.result = finalRes;
                }
            } else {
                st.expr += k;
                st.result = evaluateStdExpr(st.expr);
            }
            renderActiveTool();
        });
    });

    document.getElementById('clearCalcHistBtn')?.addEventListener('click', () => {
        st.history = [];
        renderActiveTool();
    });

    container.querySelector('#restoreLatestCalcBtn')?.addEventListener('click', () => {
        const latest = st.history[0];
        if (!latest) return;
        st.expr = latest.expr;
        st.result = latest.res;
        renderActiveTool();
    });
}

(function(root) {
    const exportsObj = {
        renderHealthTool,
        renderOvulationTool,
        calculateFuelCost,
        calculateEvCost,
        renderFuelCostTool,
        renderFuelEffTool,
        renderAreaCostTool,
        renderHexTool,
        renderStandardCalcTool
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
