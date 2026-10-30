// ==============================================================
// Multitools Calculator - Engineering & Construction Tools
// (btu_calc)
// ==============================================================

/* -----------------------------------------------------------
 * TOOL: ขนาดแอร์ BTU & ค่าไฟ Fixed Speed vs Inverter (btu_calc)
 * ----------------------------------------------------------- */

// ค่าตั้งต้นที่ผู้ใช้ปรับได้ (ตัวคูณ BTU/ตร.ม. เป็นค่าประมาณตามแนวปฏิบัติช่างแอร์ไทย)
var BTU_ROOM_PRESETS = [
    { key: 'bedroom',     label: 'ห้องนอน (ไม่โดนแดดบ่าย)',          btuPerSqm: 750 },
    { key: 'bedroom_sun', label: 'ห้องนอน (โดนแดดบ่าย / ใต้หลังคา)',  btuPerSqm: 850 },
    { key: 'living',      label: 'ห้องนั่งเล่น / ทำงานกลางวัน',        btuPerSqm: 900 },
    { key: 'living_sun',  label: 'ห้องนั่งเล่นแดดจัด / กระจกเยอะ',     btuPerSqm: 1050 },
    { key: 'commercial',  label: 'ร้านค้า / สำนักงาน คนเข้าออกบ่อย',   btuPerSqm: 1350 }
];
var BTU_STANDARD_SIZES = [9000, 12000, 15000, 18000, 24000, 30000, 36000];
var BTU_BASE_CEILING_M = 2.8;
var BTU_DAYS_PER_MONTH = 30;

function calculateBtu(st) {
    const width = parseNumericInput(st.width);
    const length = parseNumericInput(st.length);
    const btuPerSqm = parseNumericInput(st.btuPerSqm);
    const height = numberOrDefault(st.height, BTU_BASE_CEILING_M);
    const hoursPerDay = numberOrDefault(st.hoursPerDay, 8);
    const ratePerKwh = numberOrDefault(st.ratePerKwh, 4.5);
    const fixedSeer = numberOrDefault(st.fixedSeer, 11);
    const inverterSeer = numberOrDefault(st.inverterSeer, 20);

    const inputs = [width, length, btuPerSqm, height, hoursPerDay, ratePerKwh, fixedSeer, inverterSeer];
    if (!inputs.every(Number.isFinite) || width <= 0 || length <= 0 || btuPerSqm <= 0 || height <= 0
        || hoursPerDay < 0 || hoursPerDay > 24 || ratePerKwh < 0 || fixedSeer <= 0 || inverterSeer <= 0) {
        return { valid: false };
    }

    const areaSqm = width * length;
    const heightFactor = height > BTU_BASE_CEILING_M ? height / BTU_BASE_CEILING_M : 1;
    const requiredBtu = Math.round(areaSqm * btuPerSqm * heightFactor);

    const standardSize = BTU_STANDARD_SIZES.find(size => size >= requiredBtu);
    const exceedsStandard = standardSize === undefined;
    const maxSize = BTU_STANDARD_SIZES[BTU_STANDARD_SIZES.length - 1];
    const recommendedBtu = exceedsStandard ? maxSize : standardSize;
    const units = exceedsStandard ? Math.ceil(requiredBtu / maxSize) : 1;
    const installedBtu = recommendedBtu * units;

    const costFor = seer => {
        const watts = installedBtu / seer;
        const kwhPerMonth = (watts / 1000) * hoursPerDay * BTU_DAYS_PER_MONTH;
        const costPerMonth = kwhPerMonth * ratePerKwh;
        return { seer, watts, kwhPerMonth, costPerMonth, costPerYear: costPerMonth * 12 };
    };
    const fixed = costFor(fixedSeer);
    const inverter = costFor(inverterSeer);

    return {
        valid: true,
        areaSqm,
        heightFactor,
        requiredBtu,
        recommendedBtu,
        units,
        installedBtu,
        exceedsStandard,
        hoursPerDay,
        ratePerKwh,
        fixed,
        inverter,
        savingsPerMonth: fixed.costPerMonth - inverter.costPerMonth,
        savingsPerYear: fixed.costPerYear - inverter.costPerYear
    };
}

function renderBtuTool(container) {
    if (!appState.btu_calc) {
        appState.btu_calc = {
            width: '4', length: '4', height: '2.8', btuPerSqm: '750',
            hoursPerDay: '8', ratePerKwh: '4.5', fixedSeer: '11', inverterSeer: '20'
        };
    }
    const st = appState.btu_calc;
    const calc = calculateBtu(st);
    const currentMultiplier = parseNumericInput(st.btuPerSqm);

    const presetChips = BTU_ROOM_PRESETS.map(p => {
        const active = currentMultiplier === p.btuPerSqm;
        return `<button type="button" class="tool-chip-btn btu-preset-chip ${active ? 'active font-bold' : ''}" aria-pressed="${active}" data-btu-preset="${p.key}" style="min-height: 44px;">${p.label} · ${formatNum(p.btuPerSqm, 0)}</button>`;
    }).join('');

    let resultHTML = '';
    if (calc.valid) {
        const sizeText = `${formatNum(calc.recommendedBtu, 0)} BTU${calc.units > 1 ? ` × ${calc.units} เครื่อง` : ''}`;
        const column = (title, data) => `
            <div class="themed-subcard p-3 space-y-1.5 min-w-0">
                <div class="font-bold text-[var(--app-ink)]">${title}</div>
                <div class="text-[var(--app-muted)]">กำลังไฟเฉลี่ย</div>
                <div class="font-semibold font-mono break-words">${formatNum(data.watts, 0)} วัตต์</div>
                <div class="text-[var(--app-muted)]">หน่วยไฟต่อเดือน</div>
                <div class="font-semibold font-mono break-words">${formatNum(data.kwhPerMonth, 1)} หน่วย</div>
                <div class="text-[var(--app-muted)]">ค่าไฟต่อเดือน</div>
                <div class="font-semibold font-mono break-words">${formatMoney(data.costPerMonth)} บาท</div>
                <div class="text-[var(--app-muted)]">ค่าไฟต่อปี</div>
                <div class="font-semibold font-mono break-words">${formatMoney(data.costPerYear)} บาท</div>
            </div>`;
        resultHTML = `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">ขนาดแอร์ที่แนะนำ</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${sizeText}</div>
                <div class="text-xs text-[var(--app-muted)]">ภาระความเย็นที่คำนวณได้ ${formatNum(calc.requiredBtu, 0)} BTU จากพื้นที่ ${formatNum(calc.areaSqm, 2)} ตร.ม.${calc.heightFactor > 1 ? ` (ปรับเพดานสูง x${formatNum(calc.heightFactor, 2)})` : ''}</div>
                ${calc.exceedsStandard ? `<div class="text-xs font-semibold">เกินขนาดมาตรฐาน ${formatNum(BTU_STANDARD_SIZES[BTU_STANDARD_SIZES.length - 1], 0)} BTU จึงแสดงเป็นหลายเครื่อง ควรปรึกษาช่างแอร์เรื่องแบ่งโซนหรือระบบ VRF</div>` : ''}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    ${column('แอร์ธรรมดา (Fixed Speed)', calc.fixed)}
                    ${column('แอร์ Inverter', calc.inverter)}
                </div>
                <div class="pt-2 border-t border-[var(--app-hairline)] text-xs space-y-1">
                    <div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">Inverter ประหยัดกว่าต่อเดือน</span><span class="font-semibold font-mono">${formatMoney(calc.savingsPerMonth)} บาท</span></div>
                    <div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">Inverter ประหยัดกว่าต่อปี</span><span class="font-semibold font-mono">${formatMoney(calc.savingsPerYear)} บาท</span></div>
                </div>
                <div class="text-[11px] text-[var(--app-muted)]">เป็นค่าประมาณ ใช้ประกอบการตัดสินใจ ควรให้ช่างแอร์ตรวจหน้างานก่อนซื้อและติดตั้ง</div>
            </div>`;
    }

    container.innerHTML = `
        <div class="btu-calc-tool flex flex-col gap-3 p-1">
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'ความกว้างห้อง', st.width, 'เมตร', 'เช่น 4')}
                ${createKeypadFieldHTML(1, 'ความยาวห้อง', st.length, 'เมตร', 'เช่น 4')}
                ${createKeypadFieldHTML(2, 'ความสูงเพดาน', st.height, 'เมตร', 'เช่น 2.8')}
                ${createKeypadFieldHTML(3, 'ตัวคูณภาระความร้อน', st.btuPerSqm, 'BTU/ตร.ม.', 'เช่น 750')}
            </div>
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">เลือกประเภทห้อง (ตัวคูณ BTU/ตร.ม.)</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${presetChips}</div>
            </div>
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(4, 'เปิดแอร์ต่อวัน', st.hoursPerDay, 'ชม.', 'เช่น 8')}
                ${createKeypadFieldHTML(5, 'ค่าไฟต่อหน่วย', st.ratePerKwh, 'บาท/หน่วย', 'เช่น 4.5')}
            </div>
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ค่า SEER ที่ใช้เปรียบเทียบ (BTU/ชม. ต่อวัตต์)</div>
                <div class="grid grid-cols-2 gap-2">
                    <div class="min-w-0">
                        <label for="btuFixedSeer" class="text-[var(--app-muted)] text-[11px] block">Fixed Speed</label>
                        <input id="btuFixedSeer" type="text" inputmode="decimal" class="airbnb-input text-right text-xs w-full min-w-0" style="min-height: 44px;" value="${escapeHTML(st.fixedSeer || '')}" placeholder="11">
                    </div>
                    <div class="min-w-0">
                        <label for="btuInverterSeer" class="text-[var(--app-muted)] text-[11px] block">Inverter</label>
                        <input id="btuInverterSeer" type="text" inputmode="decimal" class="airbnb-input text-right text-xs w-full min-w-0" style="min-height: 44px;" value="${escapeHTML(st.inverterSeer || '')}" placeholder="20">
                    </div>
                </div>
            </div>
            ${resultHTML}
        </div>
    `;

    attachFieldClickListeners(container);

    container.querySelectorAll('.btu-preset-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = BTU_ROOM_PRESETS.find(p => p.key === btn.dataset.btuPreset);
            if (!preset) return;
            st.btuPerSqm = String(preset.btuPerSqm);
            persistAppState();
            renderActiveTool();
        });
    });
    [['btuFixedSeer', 'fixedSeer'], ['btuInverterSeer', 'inverterSeer']].forEach(([id, key]) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('change', () => {
            st[key] = input.value;
            persistAppState();
            renderActiveTool();
        });
    });

    if (!calc.valid) {
        setStatusBanner('empty', 'ป้อนความกว้างและความยาวห้องเพื่อคำนวณขนาดแอร์');
    } else {
        const sizeText = `${formatNum(calc.recommendedBtu, 0)} BTU${calc.units > 1 ? ` × ${calc.units} เครื่อง` : ''}`;
        setStatusBanner('success', `แนะนำแอร์ <span class="text-lg text-[var(--app-accent)] underline">${sizeText}</span><span class="text-xs font-normal opacity-80 block mt-1">ภาระความเย็น ${formatNum(calc.requiredBtu, 0)} BTU · Inverter ประหยัดกว่า ${formatMoney(calc.savingsPerYear)} บาท/ปี</span>`);
    }
}

/* -----------------------------------------------------------
 * DATA & ENGINE: ขนาดสายไฟ เบรกเกอร์ & แรงดันตก (wire_breaker)
 * อ้างอิง: มาตรฐานการติดตั้งทางไฟฟ้าสำหรับประเทศไทย พ.ศ. 2564 (วสท.)
 * ----------------------------------------------------------- */

// ตารางขนาดสายไฟทองแดง (ตร.มม.) และพิกัดกระแส (A) ที่ 40°C
// conduit: ตารางที่ 5-20 (IEC 01 / THW ร้อยท่อในอากาศ กลุ่มที่ 2 ระบบ 1 เฟส 2 สาย)
// surface: ตารางที่ 5-21 (VAF / VAF-G เดินเกาะผนัง กลุ่มที่ 3 ระบบ 1 เฟส 2 สาย)
// mVPerAmpMeter: ค่าแรงดันตกประมาณการ (mV/A/m) สำหรับคำนวณ Voltage Drop สายทองแดง PVC 1 เฟส 230V
//
// สถานะการตรวจข้อมูล (ยังไม่ได้ตรวจกับต้นฉบับ วสท. โดยตรง):
// - พิกัดกระแสแถว 1.0-16 ตร.มม. (conduit) และ 1.0-10 ตร.มม. (VAF) มาจาก ENGINEERING_REFERENCE_STANDARDS.md
//   ซึ่งเป็นเอกสารรวบรวม ไม่ใช่ตัวมาตรฐาน จึงยังต้องให้ผู้ชำนาญเทียบกับเล่มจริง
// - แถว 25 และ 35 ตร.มม. (ampacityVerified: false) ไม่มีในเอกสารอ้างอิงเลย
// - ค่า mVPerAmpMeter ทุกแถวไม่มีในเอกสารอ้างอิง (WIRE_VD_DATA_VERIFIED = false)
// ผลลัพธ์ของ calculateWireBreaker จึงส่งธง ampacityUnverified / voltageDropDataUnverified ให้ UI แสดงคำเตือน
var WIRE_VD_DATA_VERIFIED = false;
var WIRE_SPEC_TABLE = [
    { sizeSqmm: 1.0,  conduitAmp: 0,   surfaceAmp: 14, mVPerAmpMeter: 44.0, defaultBreaker: 10,  ampacityVerified: true },
    { sizeSqmm: 1.5,  conduitAmp: 15,  surfaceAmp: 17, mVPerAmpMeter: 29.0, defaultBreaker: 10,  ampacityVerified: true },
    { sizeSqmm: 2.5,  conduitAmp: 21,  surfaceAmp: 23, mVPerAmpMeter: 18.0, defaultBreaker: 16,  ampacityVerified: true },
    { sizeSqmm: 4.0,  conduitAmp: 28,  surfaceAmp: 32, mVPerAmpMeter: 11.0, defaultBreaker: 20,  ampacityVerified: true },
    { sizeSqmm: 6.0,  conduitAmp: 36,  surfaceAmp: 41, mVPerAmpMeter: 7.3,  defaultBreaker: 32,  ampacityVerified: true },
    { sizeSqmm: 10.0, conduitAmp: 50,  surfaceAmp: 56, mVPerAmpMeter: 4.4,  defaultBreaker: 50,  ampacityVerified: true },
    { sizeSqmm: 16.0, conduitAmp: 68,  surfaceAmp: 0,  mVPerAmpMeter: 2.8,  defaultBreaker: 63,  ampacityVerified: true },
    { sizeSqmm: 25.0, conduitAmp: 89,  surfaceAmp: 0,  mVPerAmpMeter: 1.75, defaultBreaker: 80,  ampacityVerified: false },
    { sizeSqmm: 35.0, conduitAmp: 110, surfaceAmp: 0,  mVPerAmpMeter: 1.25, defaultBreaker: 100, ampacityVerified: false }
];

// พิกัดเบรกเกอร์มาตรฐาน (MCB Ampere Trip)
var STANDARD_BREAKER_RATINGS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100];

// Preset อุปกรณ์ยอดนิยมในบ้าน
var WIRE_APPLIANCE_PRESETS = [
    { key: 'light',       label: 'ไฟแสงสว่าง',              watts: 300,   powerFactor: 0.95, continuous: false },
    { key: 'outlet',      label: 'เต้ารับทั่วไป (ปลั๊กไฟ)',   watts: 2000,  powerFactor: 0.95, continuous: false },
    { key: 'water_3500',  label: 'เครื่องทำน้ำอุ่น 3,500W',    watts: 3500,  powerFactor: 1.0,  continuous: false },
    { key: 'water_4500',  label: 'เครื่องทำน้ำอุ่น 4,500W',    watts: 4500,  powerFactor: 1.0,  continuous: false },
    { key: 'water_6000',  label: 'เครื่องทำน้ำร้อน 6,000W',   watts: 6000,  powerFactor: 1.0,  continuous: false },
    { key: 'ac_12000',    label: 'แอร์ 12,000 BTU',         watts: 1100,  powerFactor: 0.95, continuous: true  },
    { key: 'ac_24000',    label: 'แอร์ 24,000 BTU',         watts: 2200,  powerFactor: 0.95, continuous: true  },
    { key: 'ev_charger',  label: 'EV Charger 7.4 kW (32A)', watts: 7400,  powerFactor: 1.0,  continuous: true  }
];

function calculateWireBreaker(st) {
    const watts = parseNumericInput(st.watts);
    const voltage = numberOrDefault(st.voltage, 230);
    const powerFactor = numberOrDefault(st.powerFactor, 0.95);
    const wireLengthM = numberOrDefault(st.wireLengthM, 15);
    const method = st.installMethod === 'surface' ? 'surface' : 'conduit'; // 'conduit' (THW) or 'surface' (VAF)
    const isContinuous = Boolean(st.isContinuous); // โหลดต่อเนื่อง เช่น แอร์ / EV Charger คิด 125%

    if (![watts, voltage, powerFactor, wireLengthM].every(Number.isFinite)
        || watts <= 0 || voltage <= 0 || powerFactor <= 0 || powerFactor > 1 || wireLengthM < 0) {
        return { valid: false };
    }

    // กระแสโหลดปกติ (A)
    const loadCurrent = watts / (voltage * powerFactor);
    // กระแสออกแบบเบรกเกอร์ (คิดเผื่อ 125% สำหรับโหลดต่อเนื่อง)
    const designCurrent = isContinuous ? loadCurrent * 1.25 : loadCurrent;

    const round2 = (val) => Math.round((Number(val) || 0) * 100) / 100;
    const ampKey = method === 'surface' ? 'surfaceAmp' : 'conduitAmp';
    const wireType = method === 'surface' ? 'VAF / VAF-G' : 'IEC 01 (THW)';
    const base = {
        valid: true,
        watts,
        voltage,
        powerFactor,
        wireLengthM,
        method,
        isContinuous,
        loadCurrent: round2(loadCurrent),
        designCurrent: round2(designCurrent),
        wireType
    };
    // ไม่มีคำตอบที่ปลอดภัยจากตาราง: ไม่แนะนำเบรกเกอร์/สาย ให้ผู้ใช้ปรึกษาวิศวกรหรือช่างไฟ
    const unresolved = (selectionStatus, recommendedBreaker) => ({
        ...base,
        selectionStatus,
        recommendedBreaker,
        wireSizeSqmm: null,
        wireAmpacity: null,
        ampacityUnverified: false,
        voltageDropDataUnverified: !WIRE_VD_DATA_VERIFIED,
        vdVolts: null,
        vdPct: null,
        isVdExceeded: false,
        upgradedForVoltageDrop: false
    });

    // หาเบรกเกอร์มาตรฐานขั้นต่ำที่ทนกระแสออกแบบได้ (Ib >= Id)
    const selectedBreaker = STANDARD_BREAKER_RATINGS.find(b => b >= designCurrent);
    if (!selectedBreaker) return unresolved('breaker_out_of_range', null);

    // หาสายไฟที่ทนกระแสได้ (Iz >= Ib) ตามประเภทการเดินสาย
    const candidateWires = WIRE_SPEC_TABLE.filter(w => w[ampKey] > 0 && w[ampKey] >= selectedBreaker);
    if (candidateWires.length === 0) return unresolved('no_suitable_wire', selectedBreaker);
    let selectedWire = candidateWires[0];

    // คำนวณแรงดันตก (Voltage Drop)
    // VD (V) = (mV/A/m * I * L) / 1000
    // %VD = (VD / Voltage) * 100
    let vdVolts = (selectedWire.mVPerAmpMeter * loadCurrent * wireLengthM) / 1000;
    let vdPct = (vdVolts / voltage) * 100;

    // ตรวจสอบเกณฑ์แรงดันตกวงจรย่อย (ตามมาตรฐาน วสท. ไม่ควรเกิน 3%)
    let upgradedForVoltageDrop = false;
    if (vdPct > 3.0) {
        // ลองขยับขนาดสายให้ใหญ่ขึ้นจนกว่า %VD <= 3% หรือจนสุดตาราง
        const currentIdx = WIRE_SPEC_TABLE.findIndex(w => w.sizeSqmm === selectedWire.sizeSqmm);
        // ถ้าไม่มีสายขนาดใดผ่านเกณฑ์ ใช้สายใหญ่สุดที่ตารางมีให้ และคง isVdExceeded ไว้เพื่อแจ้งเตือน
        for (let i = currentIdx + 1; i < WIRE_SPEC_TABLE.length; i++) {
            const nextWire = WIRE_SPEC_TABLE[i];
            if (nextWire[ampKey] === 0) continue;
            const nextVdVolts = (nextWire.mVPerAmpMeter * loadCurrent * wireLengthM) / 1000;
            const nextVdPct = (nextVdVolts / voltage) * 100;
            selectedWire = nextWire;
            vdVolts = nextVdVolts;
            vdPct = nextVdPct;
            upgradedForVoltageDrop = true;
            if (nextVdPct <= 3.0) break;
        }
    }

    return {
        ...base,
        selectionStatus: 'ok',
        recommendedBreaker: selectedBreaker,
        wireSizeSqmm: selectedWire.sizeSqmm,
        wireAmpacity: selectedWire[ampKey],
        ampacityUnverified: !selectedWire.ampacityVerified,
        voltageDropDataUnverified: !WIRE_VD_DATA_VERIFIED,
        vdVolts: round2(vdVolts),
        vdPct: round2(vdPct),
        isVdExceeded: vdPct > 3.0,
        upgradedForVoltageDrop
    };
}

/* -----------------------------------------------------------
 * TOOL: ดินถมที่ & จำนวนเที่ยวรถดั๊มพ์ (land_fill_calc)
 * ----------------------------------------------------------- */

// ค่ากลางของช่วงอัตรายุบตัวใน ENGINEERING_REFERENCE_STANDARDS.md (ยังไม่ยืนยัน ผู้ใช้ปรับได้)
var LAND_FILL_SOIL_PRESETS = [
    { key: 'general',  label: 'ดินถมทั่วไป / ดินเหนียว / ดินดาน', shrinkPct: 25 },
    { key: 'laterite', label: 'ดินลูกรัง',                          shrinkPct: 30 },
    { key: 'sand',     label: 'ทรายถม',                            shrinkPct: 32.5 }
];
var LAND_FILL_SQM_PER_RAI = 1600;
var LAND_FILL_SQM_PER_NGAN = 400;
var LAND_FILL_SQM_PER_WA = 4;

function calculateLandFill(st) {
    const mode = st.mode === 'dim' ? 'dim' : 'land';
    let areaSqm;
    if (mode === 'land') {
        const rai = numberOrDefault(st.rai, 0);
        const ngan = numberOrDefault(st.ngan, 0);
        const wa = numberOrDefault(st.wa, 0);
        areaSqm = rai * LAND_FILL_SQM_PER_RAI + ngan * LAND_FILL_SQM_PER_NGAN + wa * LAND_FILL_SQM_PER_WA;
        if (![rai, ngan, wa].every(v => Number.isFinite(v) && v >= 0)) return { valid: false };
    } else {
        const width = parseNumericInput(st.width);
        const length = parseNumericInput(st.length);
        areaSqm = width * length;
    }
    const heightCm = parseNumericInput(st.heightCm);
    const shrinkPct = numberOrDefault(st.shrinkPct, 25);
    const truck6Cap = numberOrDefault(st.truck6Cap, 5.5);
    const truck10Cap = numberOrDefault(st.truck10Cap, 11);
    const pricePerM3 = numberOrDefault(st.pricePerM3, 0);
    const spreadPerM3 = numberOrDefault(st.spreadPerM3, 0);

    if (![areaSqm, heightCm, shrinkPct, truck6Cap, truck10Cap, pricePerM3, spreadPerM3].every(Number.isFinite)
        || areaSqm <= 0 || heightCm <= 0 || shrinkPct < 0 || shrinkPct >= 90
        || truck6Cap <= 0 || truck10Cap <= 0 || pricePerM3 < 0 || spreadPerM3 < 0) {
        return { valid: false };
    }

    const compactedM3 = areaSqm * (heightCm / 100);
    // ตัวคูณเผื่อยุบ = 1 / (1 - อัตรายุบ) : ดินหลวม 1 คิว บดอัดแล้วเหลือ (1 - อัตรายุบ) คิว
    const multiplier = 1 / (1 - shrinkPct / 100);
    const looseM3 = compactedM3 * multiplier;
    const tripsFor = capacity => Math.ceil(looseM3 / capacity - 1e-9);
    const soilCost = looseM3 * pricePerM3;
    const spreadCost = compactedM3 * spreadPerM3;

    return {
        valid: true,
        mode,
        areaSqm,
        areaWa: areaSqm / LAND_FILL_SQM_PER_WA,
        heightCm,
        shrinkPct,
        multiplier,
        compactedM3,
        looseM3,
        truck6: { capacity: truck6Cap, trips: tripsFor(truck6Cap) },
        truck10: { capacity: truck10Cap, trips: tripsFor(truck10Cap) },
        soilCost,
        spreadCost,
        totalCost: soilCost + spreadCost
    };
}

function renderLandFillTool(container) {
    if (!appState.land_fill_calc) {
        appState.land_fill_calc = {
            mode: 'land', rai: '1', ngan: '0', wa: '0', width: '', length: '', heightCm: '50',
            soil: 'general', shrinkPct: '25', truck6Cap: '5.5', truck10Cap: '11', pricePerM3: '', spreadPerM3: ''
        };
    }
    const st = appState.land_fill_calc;
    const mode = st.mode === 'dim' ? 'dim' : 'land';
    const calc = calculateLandFill(st);
    const currentShrink = parseNumericInput(st.shrinkPct);

    const areaFields = mode === 'land'
        ? `${createKeypadFieldHTML(0, 'พื้นที่ (ไร่)', st.rai, 'ไร่', 'เช่น 1')}
           ${createKeypadFieldHTML(1, 'พื้นที่ (งาน)', st.ngan, 'งาน', 'เช่น 2')}
           ${createKeypadFieldHTML(2, 'พื้นที่ (ตารางวา)', st.wa, 'ตร.ว.', 'เช่น 50')}`
        : `${createKeypadFieldHTML(0, 'ความกว้างพื้นที่ถม', st.width, 'เมตร', 'เช่น 20')}
           ${createKeypadFieldHTML(1, 'ความยาวพื้นที่ถม', st.length, 'เมตร', 'เช่น 40')}`;
    const base = mode === 'land' ? 3 : 2;

    const soilChips = LAND_FILL_SOIL_PRESETS.map(p => {
        const active = currentShrink === p.shrinkPct;
        return `<button type="button" class="tool-chip-btn land-soil-chip ${active ? 'active font-bold' : ''}" aria-pressed="${active}" data-soil="${p.key}" style="min-height: 44px;">${p.label} · ยุบ ${formatNum(p.shrinkPct, 1)}%</button>`;
    }).join('');

    let resultHTML = '';
    if (calc.valid) {
        const truckRow = (label, t) => `<div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">${label} (${formatNum(t.capacity, 1)} คิว/เที่ยว)</span><span class="font-semibold font-mono">${formatNum(t.trips, 0)} เที่ยว</span></div>`;
        resultHTML = `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">ปริมาตรดินที่ต้องสั่งซื้อ (คิวหลวม)</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${formatNum(calc.looseM3, 2)} คิว</div>
                <div class="text-xs text-[var(--app-muted)]">ปริมาตรหลังบดอัด (คิวแน่น) ${formatNum(calc.compactedM3, 2)} คิว · ตัวคูณเผื่อยุบ x${formatNum(calc.multiplier, 3)} · พื้นที่ ${formatNum(calc.areaSqm, 2)} ตร.ม. (${formatNum(calc.areaWa, 2)} ตร.ว.)</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${truckRow('รถ 6 ล้อ', calc.truck6)}
                    ${truckRow('รถ 10 ล้อ', calc.truck10)}
                </div>
                ${calc.totalCost > 0 ? `
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    <div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">ค่าดิน (คิวหลวม)</span><span class="font-semibold font-mono">${formatMoney(calc.soilCost)} บาท</span></div>
                    <div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">ค่าเกลี่ยและบดอัด (คิวแน่น)</span><span class="font-semibold font-mono">${formatMoney(calc.spreadCost)} บาท</span></div>
                    <div class="flex justify-between gap-2 font-bold"><span>รวมประมาณการ</span><span class="font-mono">${formatMoney(calc.totalCost)} บาท</span></div>
                </div>` : ''}
            </div>`;
    }

    container.innerHTML = `
        <div class="land-fill-tool flex flex-col gap-3 p-1">
            <div class="segment-group grid-cols-2" role="group" aria-label="วิธีป้อนพื้นที่">
                <button type="button" class="segment-btn ${mode === 'land' ? 'active' : ''}" aria-pressed="${mode === 'land'}" data-land-mode="land" style="min-height: 44px;">ไร่ - งาน - ตารางวา</button>
                <button type="button" class="segment-btn ${mode === 'dim' ? 'active' : ''}" aria-pressed="${mode === 'dim'}" data-land-mode="dim" style="min-height: 44px;">กว้าง x ยาว (เมตร)</button>
            </div>
            <div class="flex flex-col gap-1.5">
                ${areaFields}
                ${createKeypadFieldHTML(base, 'ความสูงที่ต้องการถม (เฉลี่ย)', st.heightCm, 'ซม.', 'เช่น 50')}
                ${createKeypadFieldHTML(base + 1, 'อัตราการยุบตัวหลังบดอัด', st.shrinkPct, '%', 'เช่น 25')}
            </div>
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ชนิดวัสดุถม (ค่ากลางของช่วงที่ยังไม่ยืนยัน)</div>
                <div class="grid grid-cols-1 gap-2">${soilChips}</div>
            </div>
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(base + 2, 'ความจุรถ 6 ล้อ', st.truck6Cap, 'คิว/เที่ยว', 'เช่น 5.5')}
                ${createKeypadFieldHTML(base + 3, 'ความจุรถ 10 ล้อ', st.truck10Cap, 'คิว/เที่ยว', 'เช่น 11')}
                ${createKeypadFieldHTML(base + 4, 'ราคาดิน (ไม่บังคับ)', st.pricePerM3, 'บาท/คิวหลวม', 'เช่น 150')}
                ${createKeypadFieldHTML(base + 5, 'ค่าเกลี่ยและบดอัด (ไม่บังคับ)', st.spreadPerM3, 'บาท/คิวแน่น', 'เช่น 40')}
            </div>
            ${resultHTML}
            <div class="themed-subcard p-3 text-[11px] text-[var(--app-muted)] space-y-1">
                <div>ตัวคูณเผื่อยุบ = 1 / (1 - อัตรายุบ) เช่น ยุบ 25% ต้องสั่ง x1.33</div>
                <div>ยังไม่ยืนยัน: อัตรายุบตัวของวัสดุแต่ละชนิดและความจุรถต่อเที่ยวเป็นค่าตั้งต้นจากเอกสารรวบรวม ควรถามผู้ขายดินหรือผู้รับเหมา และข้อมูลนี้เป็นค่าประมาณเพื่อประกอบการตัดสินใจ</div>
            </div>
        </div>
    `;

    attachFieldClickListeners(container);

    container.querySelectorAll('[data-land-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.mode = btn.dataset.landMode;
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('.land-soil-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = LAND_FILL_SOIL_PRESETS.find(p => p.key === btn.dataset.soil);
            if (!preset) return;
            st.soil = preset.key;
            st.shrinkPct = String(preset.shrinkPct);
            persistAppState();
            renderActiveTool();
        });
    });

    if (!calc.valid) {
        setStatusBanner('empty', 'ป้อนพื้นที่และความสูงที่ต้องการถมเพื่อคำนวณปริมาตรดิน');
    } else {
        setStatusBanner('success', `สั่งดิน <span class="text-lg text-[var(--app-accent)] underline">${formatNum(calc.looseM3, 2)} คิว</span><span class="text-xs font-normal opacity-80 block mt-1">รถ 6 ล้อ ${calc.truck6.trips} เที่ยว · รถ 10 ล้อ ${calc.truck10.trips} เที่ยว</span>`);
    }
}

/* -----------------------------------------------------------
 * TOOL: ก่ออิฐ ฉาบปูน & ฝ้าเพดาน (wall_ceiling_calc)
 * ----------------------------------------------------------- */

// source: 'derived' = คำนวณจากขนาดก้อนรวมร่องปูน (1 / (กว้าง x สูง)), 'unverified' = ค่าประมาณจาก ROADMAP ยังไม่ยืนยัน
var MASONRY_BRICK_PRESETS = [
    { key: 'lightweight', label: 'อิฐมวลเบา 20x60 ซม.',      perSqm: 8.33, source: 'derived' },
    { key: 'block',       label: 'อิฐบล็อก 19x39 ซม.',       perSqm: 12.5, source: 'derived' },
    { key: 'red_half',    label: 'อิฐมอญแดง ก่อครึ่งแผ่น',    perSqm: 125,  source: 'unverified' },
    { key: 'red_full',    label: 'อิฐมอญแดง ก่อเต็มแผ่น',     perSqm: 250,  source: 'unverified' }
];
// ขนาดแผ่นมาตรฐาน: ยิปซั่ม 1.20 x 2.40 ม. และ T-Bar 60 x 60 ซม. (คำนวณจากขนาด)
var CEILING_PANEL_PRESETS = [
    { key: 'gypsum', label: 'แผ่นยิปซั่ม / ไฟเบอร์ซีเมนต์ 1.20 x 2.40 ม.', areaSqm: 2.88 },
    { key: 'tbar',   label: 'ฝ้าทีบาร์ 60 x 60 ซม.',                       areaSqm: 0.36 }
];

function calculateMasonry(st) {
    const length = parseNumericInput(st.wallLength);
    const height = parseNumericInput(st.wallHeight);
    const deduct = numberOrDefault(st.deductArea, 0);
    const perSqm = parseNumericInput(st.bricksPerSqm);
    const wastePct = numberOrDefault(st.masonryWastePct, 5);
    const sides = Number(st.plasterSides);
    const coverage = numberOrDefault(st.plasterCoverage, 2);
    const brickPrice = numberOrDefault(st.brickPrice, 0);
    const bagPrice = numberOrDefault(st.plasterBagPrice, 0);
    const masonryLabor = numberOrDefault(st.masonryLaborPerSqm, 0);
    const plasterLabor = numberOrDefault(st.plasterLaborPerSqm, 0);

    const grossArea = length * height;
    const netArea = grossArea - deduct;
    if (![length, height, deduct, perSqm, wastePct, coverage, brickPrice, bagPrice, masonryLabor, plasterLabor].every(Number.isFinite)
        || ![0, 1, 2].includes(sides)
        || length <= 0 || height <= 0 || deduct < 0 || perSqm <= 0 || wastePct < 0 || coverage <= 0
        || brickPrice < 0 || bagPrice < 0 || masonryLabor < 0 || plasterLabor < 0 || netArea <= 0) {
        return { valid: false };
    }

    const bricksExact = netArea * perSqm;
    const bricks = Math.ceil(bricksExact * (1 + wastePct / 100) - 1e-9);
    const plasterAreaSqm = netArea * sides;
    const plasterBags = plasterAreaSqm > 0 ? Math.ceil(plasterAreaSqm / coverage - 1e-9) : 0;
    const brickCost = bricks * brickPrice;
    const plasterMaterialCost = plasterBags * bagPrice;
    const laborCost = netArea * masonryLabor + plasterAreaSqm * plasterLabor;

    return {
        valid: true,
        grossAreaSqm: grossArea,
        netAreaSqm: netArea,
        bricksExact,
        bricks,
        wastePct,
        sides,
        plasterAreaSqm,
        plasterBags,
        brickCost,
        plasterMaterialCost,
        laborCost,
        totalCost: brickCost + plasterMaterialCost + laborCost
    };
}

function calculateCeiling(st) {
    const area = parseNumericInput(st.ceilingArea);
    const panelArea = parseNumericInput(st.panelAreaSqm);
    const wastePct = numberOrDefault(st.ceilingWastePct, 10);
    const panelPrice = numberOrDefault(st.panelPrice, 0);
    const labor = numberOrDefault(st.ceilingLaborPerSqm, 0);
    if (![area, panelArea, wastePct, panelPrice, labor].every(Number.isFinite)
        || area <= 0 || panelArea <= 0 || wastePct < 0 || panelPrice < 0 || labor < 0) {
        return { valid: false };
    }
    const panelsExact = area / panelArea;
    const panels = Math.ceil(panelsExact * (1 + wastePct / 100) - 1e-9);
    const panelCost = panels * panelPrice;
    const laborCost = area * labor;
    return { valid: true, areaSqm: area, panelAreaSqm: panelArea, wastePct, panelsExact, panels, panelCost, laborCost, totalCost: panelCost + laborCost };
}

function renderWallCeilingTool(container) {
    if (!appState.wall_ceiling_calc) {
        appState.wall_ceiling_calc = {
            tab: 'masonry', wallLength: '5', wallHeight: '3', deductArea: '0', brickType: 'lightweight', bricksPerSqm: '8.33',
            masonryWastePct: '5', plasterSides: '2', plasterCoverage: '2', brickPrice: '', plasterBagPrice: '',
            masonryLaborPerSqm: '', plasterLaborPerSqm: '', ceilingArea: '16', ceilingType: 'gypsum', panelAreaSqm: '2.88',
            ceilingWastePct: '10', panelPrice: '', ceilingLaborPerSqm: ''
        };
    }
    const st = appState.wall_ceiling_calc;
    const tab = st.tab === 'ceiling' ? 'ceiling' : 'masonry';
    const costRow = (label, value) => `<div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">${label}</span><span class="font-semibold font-mono">${value}</span></div>`;
    let body = '';
    let statusHTML = null;

    if (tab === 'masonry') {
        const calc = calculateMasonry(st);
        const currentPerSqm = parseNumericInput(st.bricksPerSqm);
        const activeBrick = MASONRY_BRICK_PRESETS.find(p => p.perSqm === currentPerSqm);
        const brickChips = MASONRY_BRICK_PRESETS.map(p => {
            const active = activeBrick && activeBrick.key === p.key;
            return `<button type="button" class="tool-chip-btn wc-brick-chip ${active ? 'active font-bold' : ''}" aria-pressed="${Boolean(active)}" data-brick="${p.key}" style="min-height: 44px;">${p.label} · ${formatNum(p.perSqm, 2)} ก้อน/ตร.ม.</button>`;
        }).join('');
        const sideChips = [0, 1, 2].map(n => `<button type="button" class="tool-chip-btn wc-side-chip ${Number(st.plasterSides) === n ? 'active font-bold' : ''}" aria-pressed="${Number(st.plasterSides) === n}" data-sides="${n}" style="min-height: 44px;">${n === 0 ? 'ไม่ฉาบ' : `ฉาบ ${n} ด้าน`}</button>`).join('');
        const unverifiedBrick = !activeBrick || activeBrick.source === 'unverified';
        body = `
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'ความยาวผนังรวม', st.wallLength, 'เมตร', 'เช่น 5')}
                ${createKeypadFieldHTML(1, 'ความสูงผนัง', st.wallHeight, 'เมตร', 'เช่น 3')}
                ${createKeypadFieldHTML(2, 'พื้นที่หักออก (ประตู/หน้าต่าง)', st.deductArea, 'ตร.ม.', 'เช่น 3.6')}
            </div>
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ชนิดอิฐ</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${brickChips}</div>
            </div>
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(3, 'จำนวนก้อนต่อ ตร.ม.', st.bricksPerSqm, 'ก้อน/ตร.ม.', 'เช่น 8.33')}
                ${createKeypadFieldHTML(4, 'เผื่อแตกหัก', st.masonryWastePct, '%', 'เช่น 5')}
            </div>
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">การฉาบปูน</div>
                <div class="grid grid-cols-3 gap-2">${sideChips}</div>
            </div>
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(5, 'ปูนฉาบ 1 ถุงฉาบได้ (หนา 1.5 ซม.)', st.plasterCoverage, 'ตร.ม./ถุง', 'เช่น 2')}
                ${createKeypadFieldHTML(6, 'ราคาอิฐ (ไม่บังคับ)', st.brickPrice, 'บาท/ก้อน', 'เช่น 8')}
                ${createKeypadFieldHTML(7, 'ราคาปูนฉาบ (ไม่บังคับ)', st.plasterBagPrice, 'บาท/ถุง', 'เช่น 120')}
                ${createKeypadFieldHTML(8, 'ค่าแรงก่อ (ไม่บังคับ)', st.masonryLaborPerSqm, 'บาท/ตร.ม.', 'เช่น 180')}
                ${createKeypadFieldHTML(9, 'ค่าแรงฉาบ (ไม่บังคับ)', st.plasterLaborPerSqm, 'บาท/ตร.ม.', 'เช่น 120')}
            </div>`;
        if (calc.valid) {
            body += `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">จำนวนอิฐที่ต้องสั่งซื้อ (รวมเผื่อ ${formatNum(calc.wastePct, 1)}%)</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${formatNum(calc.bricks, 0)} ก้อน</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${costRow('พื้นที่ผนังสุทธิ', `${formatNum(calc.netAreaSqm, 2)} ตร.ม.`)}
                    ${costRow('พื้นที่ฉาบ', `${formatNum(calc.plasterAreaSqm, 2)} ตร.ม.`)}
                    ${costRow('ปูนฉาบ', `${formatNum(calc.plasterBags, 0)} ถุง`)}
                    ${calc.totalCost > 0 ? costRow('ค่าอิฐ', `${formatMoney(calc.brickCost)} บาท`) + costRow('ค่าปูนฉาบ', `${formatMoney(calc.plasterMaterialCost)} บาท`) + costRow('ค่าแรง', `${formatMoney(calc.laborCost)} บาท`) + `<div class="flex justify-between gap-2 font-bold"><span>รวมประมาณการ</span><span class="font-mono">${formatMoney(calc.totalCost)} บาท</span></div>` : ''}
                </div>
            </div>`;
            statusHTML = `ต้องใช้อิฐ <span class="text-lg text-[var(--app-accent)] underline">${formatNum(calc.bricks, 0)} ก้อน</span><span class="text-xs font-normal opacity-80 block mt-1">ปูนฉาบ ${formatNum(calc.plasterBags, 0)} ถุง · พื้นที่ผนัง ${formatNum(calc.netAreaSqm, 2)} ตร.ม.</span>`;
        }
        body += `
            <div class="themed-subcard p-3 text-[11px] text-[var(--app-muted)] space-y-1">
                <div>จำนวนก้อนต่อ ตร.ม. ของอิฐมวลเบาและอิฐบล็อกคำนวณจากขนาดก้อนรวมร่องปูน</div>
                ${unverifiedBrick ? '<div>ยังไม่ยืนยัน: จำนวนก้อนของอิฐมอญและความครอบคลุมของปูนฉาบเป็นค่าประมาณ ควรเทียบกับข้อมูลของผู้ผลิตหรือผู้ขายก่อนสั่งซื้อ</div>' : '<div>ยังไม่ยืนยัน: ความครอบคลุมของปูนฉาบเป็นค่าประมาณ ควรเทียบกับข้อมูลของผู้ผลิต</div>'}
                <div>ไม่รวมปูนก่อ ทราย เสาเอ็น ทับหลัง และเหล็กหนวดกุ้ง เป็นค่าประมาณเพื่อประกอบการตัดสินใจ</div>
            </div>`;
    } else {
        const calc = calculateCeiling(st);
        const currentPanel = parseNumericInput(st.panelAreaSqm);
        const panelChips = CEILING_PANEL_PRESETS.map(p => {
            const active = currentPanel === p.areaSqm;
            return `<button type="button" class="tool-chip-btn wc-panel-chip ${active ? 'active font-bold' : ''}" aria-pressed="${active}" data-panel="${p.key}" style="min-height: 44px;">${p.label}</button>`;
        }).join('');
        body = `
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'พื้นที่ฝ้าเพดาน', st.ceilingArea, 'ตร.ม.', 'เช่น 16')}
            </div>
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ชนิดแผ่นฝ้า</div>
                <div class="grid grid-cols-1 gap-2">${panelChips}</div>
            </div>
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(1, 'เผื่อเศษตัด', st.ceilingWastePct, '%', 'เช่น 10')}
                ${createKeypadFieldHTML(2, 'พื้นที่ต่อแผ่น', st.panelAreaSqm, 'ตร.ม./แผ่น', 'เช่น 2.88')}
                ${createKeypadFieldHTML(3, 'ราคาแผ่น (ไม่บังคับ)', st.panelPrice, 'บาท/แผ่น', 'เช่น 190')}
                ${createKeypadFieldHTML(4, 'ค่าแรงทำฝ้า (ไม่บังคับ)', st.ceilingLaborPerSqm, 'บาท/ตร.ม.', 'เช่น 180')}
            </div>`;
        if (calc.valid) {
            body += `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">จำนวนแผ่นที่ต้องสั่งซื้อ (รวมเผื่อ ${formatNum(calc.wastePct, 1)}%)</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${formatNum(calc.panels, 0)} แผ่น</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${costRow('พื้นที่ฝ้า', `${formatNum(calc.areaSqm, 2)} ตร.ม.`)}
                    ${costRow('จำนวนแผ่นก่อนเผื่อ', formatNum(calc.panelsExact, 2))}
                    ${calc.totalCost > 0 ? costRow('ค่าแผ่น', `${formatMoney(calc.panelCost)} บาท`) + costRow('ค่าแรง', `${formatMoney(calc.laborCost)} บาท`) + `<div class="flex justify-between gap-2 font-bold"><span>รวมประมาณการ</span><span class="font-mono">${formatMoney(calc.totalCost)} บาท</span></div>` : ''}
                </div>
            </div>`;
            statusHTML = `ต้องใช้แผ่นฝ้า <span class="text-lg text-[var(--app-accent)] underline">${formatNum(calc.panels, 0)} แผ่น</span><span class="text-xs font-normal opacity-80 block mt-1">พื้นที่ ${formatNum(calc.areaSqm, 2)} ตร.ม. · เผื่อ ${formatNum(calc.wastePct, 1)}%</span>`;
        }
        body += `
            <div class="themed-subcard p-3 text-[11px] text-[var(--app-muted)] space-y-1">
                <div>จำนวนแผ่น = พื้นที่ / พื้นที่ต่อแผ่น x (1 + เผื่อเศษตัด) ขนาดแผ่นมาตรฐานเป็นค่าตั้งต้นที่ปรับได้</div>
                <div>ไม่รวมโครงคร่าว ลวดแขวน สกรู และผงยิปซั่มฉาบรอยต่อ เพราะปริมาณขึ้นกับระยะโครงของแต่ละงาน ควรให้ช่างถอดแบบ</div>
            </div>`;
    }

    container.innerHTML = `
        <div class="wall-ceiling-tool flex flex-col gap-3 p-1">
            <div class="segment-group grid-cols-2" role="group" aria-label="ประเภทงาน">
                <button type="button" class="segment-btn ${tab === 'masonry' ? 'active' : ''}" aria-pressed="${tab === 'masonry'}" data-wc-tab="masonry" style="min-height: 44px;">ก่ออิฐ & ฉาบปูน</button>
                <button type="button" class="segment-btn ${tab === 'ceiling' ? 'active' : ''}" aria-pressed="${tab === 'ceiling'}" data-wc-tab="ceiling" style="min-height: 44px;">ฝ้าเพดาน</button>
            </div>
            ${body}
        </div>
    `;

    attachFieldClickListeners(container);

    container.querySelectorAll('[data-wc-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.tab = btn.dataset.wcTab;
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('.wc-brick-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = MASONRY_BRICK_PRESETS.find(p => p.key === btn.dataset.brick);
            if (!preset) return;
            st.brickType = preset.key;
            st.bricksPerSqm = String(preset.perSqm);
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('.wc-side-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            st.plasterSides = btn.dataset.sides;
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('.wc-panel-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = CEILING_PANEL_PRESETS.find(p => p.key === btn.dataset.panel);
            if (!preset) return;
            st.ceilingType = preset.key;
            st.panelAreaSqm = String(preset.areaSqm);
            persistAppState();
            renderActiveTool();
        });
    });

    if (statusHTML) {
        setStatusBanner('success', statusHTML);
    } else {
        setStatusBanner('empty', tab === 'masonry' ? 'ป้อนความยาวและความสูงผนังเพื่อคำนวณอิฐและปูนฉาบ' : 'ป้อนพื้นที่ฝ้าเพดานเพื่อคำนวณจำนวนแผ่น');
    }
}

/* -----------------------------------------------------------
 * TOOL: หลังคา ตัดเหล็ก & เหล็กเส้น/คอนกรีตโครงสร้าง (roof_steel_calc)
 * ----------------------------------------------------------- */

// น้ำหนักเหล็กเส้น มอก. (กก./ม.) จาก ENGINEERING_REFERENCE_STANDARDS.md ข้อ 2.1 ตรวจสอบกับสูตร d^2/162 แล้ว
var REBAR_TABLE = [
    { key: 'RB6',  label: 'RB6 เหล็กเส้นกลม 6 มม.',   diameterMm: 6,  kgPerM: 0.222 },
    { key: 'RB9',  label: 'RB9 เหล็กเส้นกลม 9 มม.',   diameterMm: 9,  kgPerM: 0.499 },
    { key: 'RB12', label: 'RB12 เหล็กเส้นกลม 12 มม.', diameterMm: 12, kgPerM: 0.888 },
    { key: 'DB12', label: 'DB12 เหล็กข้ออ้อย 12 มม.', diameterMm: 12, kgPerM: 0.888 },
    { key: 'DB16', label: 'DB16 เหล็กข้ออ้อย 16 มม.', diameterMm: 16, kgPerM: 1.578 },
    { key: 'DB20', label: 'DB20 เหล็กข้ออ้อย 20 มม.', diameterMm: 20, kgPerM: 2.466 },
    { key: 'DB25', label: 'DB25 เหล็กข้ออ้อย 25 มม.', diameterMm: 25, kgPerM: 3.853 }
];
var REBAR_STOCK_LENGTH_M = 10;
var ROOF_STEEL_STOCK_M = 6;
var CUTTING_MAX_PIECES = 2000;
var ROOF_MAX_ANGLE_DEG = 75;

function calculateRoof(st) {
    const run = parseNumericInput(st.roofRun);
    const length = parseNumericInput(st.roofLength);
    const angle = parseNumericInput(st.roofAngle);
    const overhang = numberOrDefault(st.roofOverhang, 0);
    const sheetWidth = numberOrDefault(st.sheetWidth, 0.76);
    const spacing = numberOrDefault(st.purlinSpacing, 1);
    const screwsPerSqm = numberOrDefault(st.screwsPerSqm, 5);
    const pricePerSqm = numberOrDefault(st.roofPricePerSqm, 0);
    const sides = Number(st.roofSides) === 2 ? 2 : 1;

    if (![run, length, angle, overhang, sheetWidth, spacing, screwsPerSqm, pricePerSqm].every(Number.isFinite)
        || run <= 0 || length <= 0 || angle < 0 || angle > ROOF_MAX_ANGLE_DEG || overhang < 0
        || sheetWidth <= 0 || spacing <= 0 || screwsPerSqm < 0 || pricePerSqm < 0) {
        return { valid: false };
    }

    const rad = angle * Math.PI / 180;
    const riseM = run * Math.tan(rad);
    const rafterM = run / Math.cos(rad);
    const slopeLengthM = rafterM + overhang;
    const areaSqm = slopeLengthM * length * sides;
    const sheetsPerSide = Math.ceil(length / sheetWidth - 1e-9);
    const purlinRowsPerSide = Math.ceil(slopeLengthM / spacing - 1e-9) + 1;
    const purlinTotalM = purlinRowsPerSide * sides * length;
    return {
        valid: true,
        sides,
        angle,
        riseM,
        rafterM,
        slopeLengthM,
        areaSqm,
        sheetsPerSide,
        sheets: sheetsPerSide * sides,
        sheetOrderLengthM: slopeLengthM,
        purlinRows: purlinRowsPerSide * sides,
        purlinTotalM,
        purlinStock: Math.ceil(purlinTotalM / ROOF_STEEL_STOCK_M - 1e-9),
        screws: Math.ceil(areaSqm * screwsPerSqm - 1e-9),
        totalCost: areaSqm * pricePerSqm
    };
}

// วางแผนตัดท่อนเหล็กแบบ First-Fit Decreasing (ไม่ใช่คำตอบที่ดีที่สุดทางคณิตศาสตร์เสมอไป) คำนวณเป็นมิลลิเมตรเพื่อเลี่ยงเศษทศนิยม
function calculateCutting(st) {
    const stockM = parseNumericInput(st.stockLen);
    const kerfMm = numberOrDefault(st.kerfMm, 0);
    if (!Number.isFinite(stockM) || stockM <= 0 || !Number.isFinite(kerfMm) || kerfMm < 0) return { valid: false, reason: 'invalid_stock' };
    const stockMm = Math.round(stockM * 1000);
    const kerf = Math.round(kerfMm);

    const rows = Array.isArray(st.pieces) ? st.pieces : [];
    const pieces = [];
    for (const row of rows) {
        const blankLength = String(row.length ?? '').trim() === '';
        const blankQty = String(row.qty ?? '').trim() === '';
        if (blankLength && blankQty) continue;
        const len = parseNumericInput(row.length);
        const qty = numberOrDefault(row.qty, 1);
        if (!Number.isFinite(len) || len <= 0 || !Number.isInteger(qty) || qty < 1) return { valid: false, reason: 'invalid_piece' };
        for (let i = 0; i < qty; i++) {
            pieces.push(Math.round(len * 1000));
            if (pieces.length > CUTTING_MAX_PIECES) return { valid: false, reason: 'too_many_pieces' };
        }
    }
    if (pieces.length === 0) return { valid: false, reason: 'no_pieces' };
    const longest = Math.max(...pieces);
    if (longest > stockMm) return { valid: false, reason: 'piece_too_long', longestM: longest / 1000, stockM: stockMm / 1000 };

    pieces.sort((a, b) => b - a);
    const bars = [];
    for (const len of pieces) {
        const bar = bars.find(b => b.used + (b.pieces.length > 0 ? kerf : 0) + len <= stockMm);
        if (bar) {
            bar.used += (bar.pieces.length > 0 ? kerf : 0) + len;
            bar.pieces.push(len);
        } else {
            bars.push({ used: len, pieces: [len] });
        }
    }
    const pieceTotalMm = pieces.reduce((sum, v) => sum + v, 0);
    const wasteMm = bars.length * stockMm - pieceTotalMm;
    return {
        valid: true,
        stockM: stockMm / 1000,
        kerfMm: kerf,
        pieceCount: pieces.length,
        pieceTotalM: pieceTotalMm / 1000,
        barCount: bars.length,
        wasteM: wasteMm / 1000,
        wastePct: (wasteMm / (bars.length * stockMm)) * 100,
        bars: bars.map(b => ({ pieces: b.pieces.map(v => v / 1000), usedM: b.used / 1000, leftoverM: (stockMm - b.used) / 1000 }))
    };
}

function calculateRebar(st) {
    const type = REBAR_TABLE.find(r => r.key === st.rebarType);
    const bars = parseNumericInput(st.rebarBars);
    const lengthM = parseNumericInput(st.rebarLength);
    const pricePerKg = numberOrDefault(st.rebarPricePerKg, 0);
    if (!type || ![bars, lengthM, pricePerKg].every(Number.isFinite) || !Number.isInteger(bars) || bars < 1 || lengthM <= 0 || pricePerKg < 0) {
        return { valid: false };
    }
    const totalLengthM = bars * lengthM;
    const weightKg = totalLengthM * type.kgPerM;
    return {
        valid: true,
        type,
        bars,
        lengthM,
        totalLengthM,
        weightKg,
        weightPerBarKg: lengthM * type.kgPerM,
        stockBars: Math.ceil(totalLengthM / REBAR_STOCK_LENGTH_M - 1e-9),
        totalCost: weightKg * pricePerKg
    };
}

function calculateConcreteVolume(st) {
    const width = parseNumericInput(st.conWidth);
    const depth = parseNumericInput(st.conDepth);
    const length = parseNumericInput(st.conLength);
    const qty = numberOrDefault(st.conQty, 1);
    const wastePct = numberOrDefault(st.conWastePct, 5);
    const pricePerM3 = numberOrDefault(st.conPricePerM3, 0);
    if (![width, depth, length, qty, wastePct, pricePerM3].every(Number.isFinite)
        || width <= 0 || depth <= 0 || length <= 0 || !Number.isInteger(qty) || qty < 1 || wastePct < 0 || pricePerM3 < 0) {
        return { valid: false };
    }
    const netM3 = width * depth * length * qty;
    const orderM3 = netM3 * (1 + wastePct / 100);
    return { valid: true, netM3, orderM3, wastePct, qty, totalCost: orderM3 * pricePerM3 };
}

function renderRoofSteelTool(container) {
    if (!appState.roof_steel_calc) {
        appState.roof_steel_calc = {
            tab: 'roof', roofRun: '4', roofLength: '6', roofAngle: '15', roofOverhang: '0.5', roofSides: '1',
            sheetWidth: '0.76', purlinSpacing: '1', screwsPerSqm: '5', roofPricePerSqm: '',
            stockLen: '6', kerfMm: '0', pieces: [{ id: '1', length: '2.4', qty: '4' }, { id: '2', length: '1.2', qty: '6' }],
            rebarType: 'DB12', rebarBars: '10', rebarLength: '6', rebarPricePerKg: '',
            conWidth: '0.2', conDepth: '0.3', conLength: '4', conQty: '4', conWastePct: '5', conPricePerM3: ''
        };
    }
    const st = appState.roof_steel_calc;
    const tab = ['roof', 'cut', 'rebar'].includes(st.tab) ? st.tab : 'roof';
    const row = (label, value) => `<div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">${label}</span><span class="font-semibold font-mono text-right">${value}</span></div>`;
    const note = lines => `<div class="themed-subcard p-3 text-[11px] text-[var(--app-muted)] space-y-1">${lines.map(l => `<div>${l}</div>`).join('')}</div>`;
    let body = '';
    let statusHTML = null;
    let emptyText = '';

    if (tab === 'roof') {
        const calc = calculateRoof(st);
        const sideChips = [1, 2].map(n => `<button type="button" class="tool-chip-btn roof-side-chip ${Number(st.roofSides) === n ? 'active font-bold' : ''}" aria-pressed="${Number(st.roofSides) === n}" data-roof-sides="${n}" style="min-height: 44px;">${n === 1 ? 'หลังคาเพิงหมาแหงน (1 ด้าน)' : 'หลังคาจั่ว (2 ด้าน)'}</button>`).join('');
        body = `
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">รูปแบบหลังคา</div>
                <div class="grid grid-cols-1 gap-2">${sideChips}</div>
            </div>
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'ระยะแนวราบต่อ 1 ด้าน (Run)', st.roofRun, 'เมตร', 'เช่น 4')}
                ${createKeypadFieldHTML(1, 'ความยาวหลังคาตามแนวสันหรือชายคา', st.roofLength, 'เมตร', 'เช่น 6')}
                ${createKeypadFieldHTML(2, 'องศาความลาดชัน', st.roofAngle, 'องศา', 'เช่น 15')}
                ${createKeypadFieldHTML(3, 'ชายคายื่น (ตามแนวลาด)', st.roofOverhang, 'เมตร', 'เช่น 0.5')}
                ${createKeypadFieldHTML(4, 'หน้ากว้างใช้งานจริงของแผ่น', st.sheetWidth, 'เมตร', 'เช่น 0.76')}
                ${createKeypadFieldHTML(5, 'ระยะห่างแป', st.purlinSpacing, 'เมตร', 'เช่น 1')}
                ${createKeypadFieldHTML(6, 'สกรูยิงหลังคา', st.screwsPerSqm, 'ตัว/ตร.ม.', 'เช่น 5')}
                ${createKeypadFieldHTML(7, 'ราคาหลังคา (ไม่บังคับ)', st.roofPricePerSqm, 'บาท/ตร.ม.', 'เช่น 350')}
            </div>`;
        if (calc.valid) {
            body += `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">แผ่นหลังคาที่ต้องสั่งตัด</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${formatNum(calc.sheets, 0)} แผ่น ยาว ${formatNum(calc.sheetOrderLengthM, 2)} ม.</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${row('ความสูงยกจากแนวราบ (Rise)', `${formatNum(calc.riseM, 2)} ม.`)}
                    ${row('ความยาวจันทัน (ไม่รวมชายคา)', `${formatNum(calc.rafterM, 2)} ม.`)}
                    ${row('พื้นที่หลังคาตามแนวลาด', `${formatNum(calc.areaSqm, 2)} ตร.ม.`)}
                    ${row('จำนวนแถวแป', formatNum(calc.purlinRows, 0))}
                    ${row(`เหล็กแป (ท่อนละ ${ROOF_STEEL_STOCK_M} ม.)`, `${formatNum(calc.purlinStock, 0)} ท่อน`)}
                    ${row('สกรูยิงหลังคา', `${formatNum(calc.screws, 0)} ตัว`)}
                    ${calc.totalCost > 0 ? row('ค่าแผ่นหลังคาโดยประมาณ', `${formatMoney(calc.totalCost)} บาท`) : ''}
                </div>
            </div>`;
            statusHTML = `หลังคา <span class="text-lg text-[var(--app-accent)] underline">${formatNum(calc.areaSqm, 2)} ตร.ม.</span><span class="text-xs font-normal opacity-80 block mt-1">${formatNum(calc.sheets, 0)} แผ่น ยาว ${formatNum(calc.sheetOrderLengthM, 2)} ม. · แป ${formatNum(calc.purlinStock, 0)} ท่อน</span>`;
        }
        body += note([
            'ความยาวจันทัน = Run / cos(องศา) ความยาวแผ่นสั่งตัด = จันทัน + ชายคายื่น',
            'ยังไม่ยืนยัน: หน้ากว้างใช้งานจริงของแผ่น (0.76 ม.) ระยะห่างแป (1.0 ม.) และสกรู (5 ตัว/ตร.ม.) เป็นค่าตั้งต้นที่ต่างกันตามรุ่นและผู้ผลิต ควรเทียบกับข้อมูลรุ่นที่เลือก',
            'จำนวนเหล็กแปนับแบบรวมความยาวแล้วหารท่อน ไม่ได้วางแผนตัดเศษ ใช้แท็บ "ตัดเหล็ก" ถ้าต้องการลดเศษ ค่าประมาณเพื่อประกอบการตัดสินใจ ควรให้ช่างหรือวิศวกรตรวจโครงสร้าง'
        ]);
        emptyText = 'ป้อนระยะแนวราบ ความยาว และองศาความลาดชันของหลังคา';
    } else if (tab === 'cut') {
        const calc = calculateCutting(st);
        const pieces = Array.isArray(st.pieces) ? st.pieces : [];
        const rowsHTML = pieces.map(p => `
            <div class="grid grid-cols-[1fr_1fr_auto] gap-2 items-end" data-piece-row="${escapeHTML(p.id)}">
                <div class="min-w-0">
                    <label for="piece-length-${escapeHTML(p.id)}" class="text-[var(--app-muted)] text-[11px] block">ความยาวท่อน (เมตร)</label>
                    <input id="piece-length-${escapeHTML(p.id)}" type="text" inputmode="decimal" class="airbnb-input text-right text-xs w-full min-w-0" style="min-height: 44px;" value="${escapeHTML(p.length || '')}" data-piece-id="${escapeHTML(p.id)}" data-piece-field="length" placeholder="2.4">
                </div>
                <div class="min-w-0">
                    <label for="piece-qty-${escapeHTML(p.id)}" class="text-[var(--app-muted)] text-[11px] block">จำนวน (ท่อน)</label>
                    <input id="piece-qty-${escapeHTML(p.id)}" type="text" inputmode="numeric" class="airbnb-input text-right text-xs w-full min-w-0" style="min-height: 44px;" value="${escapeHTML(p.qty || '')}" data-piece-id="${escapeHTML(p.id)}" data-piece-field="qty" placeholder="4">
                </div>
                <button type="button" class="tool-danger-btn" data-piece-remove="${escapeHTML(p.id)}" style="min-height: 44px; min-width: 44px;" aria-label="ลบรายการท่อนเหล็ก">ลบ</button>
            </div>`).join('');
        body = `
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'ความยาวเหล็กเต็มเส้น', st.stockLen, 'เมตร', 'เช่น 6')}
                ${createKeypadFieldHTML(1, 'ความหนาใบเลื่อย/รอยตัด', st.kerfMm, 'มม.', 'เช่น 3')}
            </div>
            <div class="themed-tool-card p-3 space-y-3 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">รายการท่อนที่ต้องตัด</div>
                ${rowsHTML || '<div class="text-[var(--app-muted)]">ยังไม่มีรายการ กดเพิ่มรายการด้านล่าง</div>'}
                <button type="button" class="tool-action-btn" id="btnAddPiece" style="min-height: 44px;">เพิ่มรายการท่อน</button>
            </div>`;
        if (calc.valid) {
            const shown = calc.bars.slice(0, 40);
            const barLines = shown.map((b, i) => `<div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">เส้นที่ ${i + 1}</span><span class="font-mono text-right break-words">${b.pieces.map(v => formatNum(v, 3)).join(' + ')} (เหลือ ${formatNum(b.leftoverM, 3)})</span></div>`).join('');
            body += `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">เหล็กเต็มเส้นที่ต้องซื้อ</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${formatNum(calc.barCount, 0)} เส้น</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${row('ท่อนที่ต้องตัดทั้งหมด', `${formatNum(calc.pieceCount, 0)} ท่อน`)}
                    ${row('ความยาวท่อนรวม', `${formatNum(calc.pieceTotalM, 2)} ม.`)}
                    ${row('เศษเหล็กรวม', `${formatNum(calc.wasteM, 2)} ม. (${formatNum(calc.wastePct, 1)}%)`)}
                </div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    <div class="font-semibold text-[var(--app-ink)]">แผนการตัด</div>
                    ${barLines}
                    ${calc.bars.length > shown.length ? `<div class="text-[var(--app-muted)]">แสดง ${shown.length} จาก ${calc.bars.length} เส้น</div>` : ''}
                </div>
            </div>`;
            statusHTML = `ซื้อเหล็ก <span class="text-lg text-[var(--app-accent)] underline">${formatNum(calc.barCount, 0)} เส้น</span><span class="text-xs font-normal opacity-80 block mt-1">เศษเหล็ก ${formatNum(calc.wasteM, 2)} ม. (${formatNum(calc.wastePct, 1)}%)</span>`;
        } else if (calc.reason === 'piece_too_long') {
            body += `<div class="themed-subcard p-3 text-xs font-semibold" role="alert">มีท่อนที่ยาว ${formatNum(calc.longestM, 3)} ม. เกินความยาวเหล็กเต็มเส้น ${formatNum(calc.stockM, 3)} ม. ต้องต่อเหล็กหรือใช้เส้นที่ยาวกว่านี้</div>`;
        } else if (calc.reason === 'too_many_pieces') {
            body += `<div class="themed-subcard p-3 text-xs font-semibold" role="alert">จำนวนท่อนรวมเกิน ${formatNum(CUTTING_MAX_PIECES, 0)} ท่อน ลดจำนวนหรือแบ่งคำนวณเป็นชุด</div>`;
        }
        body += note([
            'วางแผนตัดแบบ First-Fit Decreasing เรียงท่อนยาวก่อน เป็นวิธีประมาณที่ใช้ได้ดีในงานทั่วไป แต่ไม่รับประกันว่าเศษน้อยที่สุดทุกกรณี',
            'รอยตัดคิดทุกครั้งที่ตัดระหว่างท่อนในเส้นเดียวกัน ค่าประมาณเพื่อประกอบการตัดสินใจ'
        ]);
        emptyText = 'ป้อนความยาวเหล็กเต็มเส้นและรายการท่อนที่ต้องตัด';
    } else {
        const rebar = calculateRebar(st);
        const con = calculateConcreteVolume(st);
        const typeChips = REBAR_TABLE.map(r => `<button type="button" class="tool-chip-btn rebar-type-chip ${st.rebarType === r.key ? 'active font-bold' : ''}" aria-pressed="${st.rebarType === r.key}" data-rebar="${r.key}" style="min-height: 44px;">${r.key} · ${formatNum(r.kgPerM, 3)} กก./ม.</button>`).join('');
        body = `
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ชนิดเหล็กเส้น (น้ำหนักตามตาราง มอก.)</div>
                <div class="grid grid-cols-2 gap-2">${typeChips}</div>
            </div>
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'จำนวนเส้นเหล็ก', st.rebarBars, 'เส้น', 'เช่น 10')}
                ${createKeypadFieldHTML(1, 'ความยาวต่อเส้นที่ใช้', st.rebarLength, 'เมตร', 'เช่น 6')}
                ${createKeypadFieldHTML(2, 'ราคาเหล็ก (ไม่บังคับ)', st.rebarPricePerKg, 'บาท/กก.', 'เช่น 25')}
            </div>`;
        if (rebar.valid) {
            body += `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">น้ำหนักเหล็กเส้น ${rebar.type.key}</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${formatNum(rebar.weightKg, 2)} กก.</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${row('ความยาวรวม', `${formatNum(rebar.totalLengthM, 2)} ม.`)}
                    ${row('น้ำหนักต่อเส้นที่ใช้', `${formatNum(rebar.weightPerBarKg, 3)} กก.`)}
                    ${row(`เหล็กเต็มเส้น (เส้นละ ${REBAR_STOCK_LENGTH_M} ม.)`, `${formatNum(rebar.stockBars, 0)} เส้น`)}
                    ${rebar.totalCost > 0 ? row('ค่าเหล็กโดยประมาณ', `${formatMoney(rebar.totalCost)} บาท`) : ''}
                </div>
            </div>`;
            statusHTML = `เหล็ก ${rebar.type.key} <span class="text-lg text-[var(--app-accent)] underline">${formatNum(rebar.weightKg, 2)} กก.</span><span class="text-xs font-normal opacity-80 block mt-1">${formatNum(rebar.stockBars, 0)} เส้นเต็ม${con.valid ? ` · คอนกรีต ${formatNum(con.orderM3, 2)} คิว` : ''}</span>`;
        }
        body += `
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(3, 'ความกว้างหน้าตัด', st.conWidth, 'เมตร', 'เช่น 0.2')}
                ${createKeypadFieldHTML(4, 'ความลึก/หนา', st.conDepth, 'เมตร', 'เช่น 0.3')}
                ${createKeypadFieldHTML(5, 'ความยาว/ความสูงชิ้นงาน', st.conLength, 'เมตร', 'เช่น 4')}
                ${createKeypadFieldHTML(6, 'จำนวนชิ้นงาน', st.conQty, 'ชิ้น', 'เช่น 4')}
                ${createKeypadFieldHTML(7, 'เผื่อสูญเสีย', st.conWastePct, '%', 'เช่น 5')}
                ${createKeypadFieldHTML(8, 'ราคาคอนกรีต (ไม่บังคับ)', st.conPricePerM3, 'บาท/คิว', 'เช่น 2000')}
            </div>`;
        if (con.valid) {
            body += `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">ปริมาตรคอนกรีตที่ต้องสั่ง (รวมเผื่อ ${formatNum(con.wastePct, 1)}%)</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${formatNum(con.orderM3, 2)} คิว</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${row('ปริมาตรสุทธิ', `${formatNum(con.netM3, 3)} คิว`)}
                    ${con.totalCost > 0 ? row('ค่าคอนกรีตโดยประมาณ', `${formatMoney(con.totalCost)} บาท`) : ''}
                </div>
            </div>`;
            if (!statusHTML) statusHTML = `คอนกรีต <span class="text-lg text-[var(--app-accent)] underline">${formatNum(con.orderM3, 2)} คิว</span><span class="text-xs font-normal opacity-80 block mt-1">ปริมาตรสุทธิ ${formatNum(con.netM3, 3)} คิว</span>`;
        }
        body += note([
            'น้ำหนักต่อเมตรของเหล็กเส้นตามตารางใน ENGINEERING_REFERENCE_STANDARDS.md ซึ่งตรวจกับสูตร d^2/162 แล้ว',
            'ไม่รวมระยะทาบเหล็ก ระยะงอ และเหล็กปลอก ต้องเผื่อเองหรือให้วิศวกรถอดแบบ เกณฑ์ระยะทาบ (เช่น 36d-40d) ยังไม่ยืนยัน จึงไม่ถูกนำมาคำนวณ',
            'ปริมาตรคอนกรีตคิดเป็นทรงกล่องสี่เหลี่ยม ไม่ใช่การออกแบบโครงสร้าง ต้องให้วิศวกรกำหนดหน้าตัดและเหล็กเสริม'
        ]);
        emptyText = 'ป้อนจำนวนและความยาวเหล็ก หรือขนาดชิ้นงานคอนกรีต';
    }

    container.innerHTML = `
        <div class="roof-steel-tool flex flex-col gap-3 p-1">
            <div class="segment-group grid-cols-3" role="group" aria-label="ประเภทงาน">
                <button type="button" class="segment-btn ${tab === 'roof' ? 'active' : ''}" aria-pressed="${tab === 'roof'}" data-rs-tab="roof" style="min-height: 44px;">หลังคา</button>
                <button type="button" class="segment-btn ${tab === 'cut' ? 'active' : ''}" aria-pressed="${tab === 'cut'}" data-rs-tab="cut" style="min-height: 44px;">ตัดเหล็ก</button>
                <button type="button" class="segment-btn ${tab === 'rebar' ? 'active' : ''}" aria-pressed="${tab === 'rebar'}" data-rs-tab="rebar" style="min-height: 44px;">เหล็กเส้น</button>
            </div>
            ${body}
        </div>
    `;

    attachFieldClickListeners(container);

    container.querySelectorAll('[data-rs-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.tab = btn.dataset.rsTab;
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('.roof-side-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            st.roofSides = btn.dataset.roofSides;
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('.rebar-type-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            st.rebarType = btn.dataset.rebar;
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('[data-piece-id]').forEach(input => {
        input.addEventListener('change', () => {
            const target = (st.pieces || []).find(p => p.id === input.dataset.pieceId);
            if (!target) return;
            target[input.dataset.pieceField] = input.value;
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('[data-piece-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.pieces = (st.pieces || []).filter(p => p.id !== btn.dataset.pieceRemove);
            persistAppState();
            renderActiveTool();
        });
    });
    const addBtn = document.getElementById('btnAddPiece');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const list = Array.isArray(st.pieces) ? st.pieces : [];
            const nextId = String(list.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1);
            st.pieces = list.concat([{ id: nextId, length: '', qty: '1' }]);
            persistAppState();
            renderActiveTool();
        });
    }

    if (statusHTML) {
        setStatusBanner('success', statusHTML);
    } else {
        setStatusBanner('empty', emptyText);
    }
}

/* -----------------------------------------------------------
 * TOOL: แบ่งงวดงานรับเหมา & เงินประกันผลงาน (contractor_payment)
 * ----------------------------------------------------------- */

// เปอร์เซ็นต์แต่ละงวดเป็น "ตัวอย่างเริ่มต้น" ไม่ใช่มาตรฐาน ต้องกำหนดตามสัญญาจริง
var CONTRACTOR_TEMPLATES = [
    { key: '3', label: '3 งวด (40/40/20)',            pcts: [40, 40, 20] },
    { key: '4', label: '4 งวด (30/30/30/10)',         pcts: [30, 30, 30, 10] },
    { key: '6', label: '6 งวด (20/20/20/20/10/10)',   pcts: [20, 20, 20, 20, 10, 10] }
];
var CONTRACTOR_MAX_INSTALLMENTS = 24;

function calculateContractorPayment(st) {
    const contract = parseNumericInput(st.contractValue);
    const retentionPct = numberOrDefault(st.retentionPct, 0);
    const whtPct = numberOrDefault(st.whtPct, 3);
    const vatPct = numberOrDefault(st.vatRate, 7);
    const applyVat = Boolean(st.applyVat);
    const applyWht = Boolean(st.applyWht);
    const rows = Array.isArray(st.installments) ? st.installments : [];

    if (![contract, retentionPct, whtPct, vatPct].every(Number.isFinite)
        || contract <= 0 || retentionPct < 0 || retentionPct > 100 || whtPct < 0 || whtPct > 100 || vatPct < 0 || vatPct > 100
        || rows.length === 0 || rows.length > CONTRACTOR_MAX_INSTALLMENTS) {
        return { valid: false, reason: 'invalid_input' };
    }
    const pcts = rows.map(r => parseNumericInput(r.pct));
    if (!pcts.every(p => Number.isFinite(p) && p >= 0)) return { valid: false, reason: 'invalid_installment' };
    const pctSum = pcts.reduce((sum, p) => sum + p, 0);
    if (Math.abs(pctSum - 100) > 1e-6) return { valid: false, reason: 'pct_sum', pctSum };

    const round2 = v => Math.round(v * 100 + (v >= 0 ? 1e-9 : -1e-9)) / 100;
    const items = [];
    let allocated = 0;
    pcts.forEach((pct, i) => {
        const last = i === pcts.length - 1;
        // งวดสุดท้ายรับส่วนต่างจากการปัดเศษ เพื่อให้ยอดรวมเท่ากับมูลค่าสัญญา
        const gross = last ? round2(contract - allocated) : round2(contract * pct / 100);
        allocated += gross;
        const vat = applyVat ? round2(gross * vatPct / 100) : 0;
        const retention = round2(gross * retentionPct / 100);
        const wht = applyWht ? round2(gross * whtPct / 100) : 0;
        items.push({ index: i + 1, pct, gross, vat, retention, wht, net: round2(gross + vat - retention - wht) });
    });
    const sum = key => round2(items.reduce((total, item) => total + item[key], 0));
    return {
        valid: true,
        contract,
        retentionPct,
        whtPct,
        vatPct,
        applyVat,
        applyWht,
        items,
        totalGross: sum('gross'),
        totalVat: sum('vat'),
        totalRetention: sum('retention'),
        totalWht: sum('wht'),
        totalNet: sum('net'),
        // เงินประกันที่ผู้ว่าจ้างถือไว้และต้องจ่ายคืนเมื่อพ้นระยะประกันผลงาน
        retentionReleased: sum('retention')
    };
}

function renderContractorPaymentTool(container) {
    if (!appState.contractor_payment) {
        appState.contractor_payment = {
            contractValue: '1200000', retentionPct: '5', whtPct: '3', vatRate: '7', applyVat: false, applyWht: false, template: '4',
            installments: CONTRACTOR_TEMPLATES[1].pcts.map((p, i) => ({ id: String(i + 1), pct: String(p) }))
        };
    }
    const st = appState.contractor_payment;
    const calc = calculateContractorPayment(st);
    const rows = Array.isArray(st.installments) ? st.installments : [];
    const pctNow = rows.map(r => parseNumericInput(r.pct));
    const pctSumNow = pctNow.every(Number.isFinite) ? pctNow.reduce((s, p) => s + p, 0) : NaN;

    const templateChips = CONTRACTOR_TEMPLATES.map(t => `<button type="button" class="tool-chip-btn cp-template-chip ${st.template === t.key ? 'active font-bold' : ''}" aria-pressed="${st.template === t.key}" data-cp-template="${t.key}" style="min-height: 44px;">${t.label}</button>`).join('');
    const toggle = (key, label, on) => `<button type="button" class="tool-chip-btn cp-toggle-chip ${on ? 'active font-bold' : ''}" aria-pressed="${on}" data-cp-toggle="${key}" style="min-height: 44px;">${label}</button>`;
    const rowsHTML = rows.map((r, i) => `
        <div class="grid grid-cols-[1fr_auto] gap-2 items-end" data-cp-row="${escapeHTML(r.id)}">
            <div class="min-w-0">
                <label for="cp-pct-${escapeHTML(r.id)}" class="text-[var(--app-muted)] text-[11px] block">งวดที่ ${i + 1} (% ของมูลค่าสัญญา)</label>
                <input id="cp-pct-${escapeHTML(r.id)}" type="text" inputmode="decimal" class="airbnb-input text-right text-xs w-full min-w-0" style="min-height: 44px;" value="${escapeHTML(r.pct || '')}" data-cp-pct="${escapeHTML(r.id)}" placeholder="30">
            </div>
            <button type="button" class="tool-danger-btn" data-cp-remove="${escapeHTML(r.id)}" style="min-height: 44px; min-width: 44px;" aria-label="ลบงวดที่ ${i + 1}">ลบ</button>
        </div>`).join('');

    let resultHTML = '';
    let statusHTML = null;
    let emptyText = 'ป้อนมูลค่างานตามสัญญาเพื่อคำนวณงวดงาน';
    const line = (label, value, strong) => `<div class="flex justify-between gap-2 ${strong ? 'font-bold' : ''}"><span class="${strong ? '' : 'text-[var(--app-muted)]'}">${label}</span><span class="font-mono text-right">${value}</span></div>`;
    if (calc.valid) {
        const cards = calc.items.map(item => `
            <div class="themed-subcard p-3 space-y-1.5 text-xs">
                <div class="font-bold text-[var(--app-ink)]">งวดที่ ${item.index} (${formatNum(item.pct, 2)}%)</div>
                ${line('ค่าจ้างงวดนี้', `${formatMoney(item.gross)} บาท`)}
                ${calc.applyVat ? line(`VAT ${formatNum(calc.vatPct, 2)}%`, `+${formatMoney(item.vat)} บาท`) : ''}
                ${calc.retentionPct > 0 ? line(`หักเงินประกันผลงาน ${formatNum(calc.retentionPct, 2)}%`, `-${formatMoney(item.retention)} บาท`) : ''}
                ${calc.applyWht ? line(`หัก ณ ที่จ่าย ${formatNum(calc.whtPct, 2)}%`, `-${formatMoney(item.wht)} บาท`) : ''}
                ${line('ยอดจ่ายสุทธิ', `${formatMoney(item.net)} บาท`, true)}
            </div>`).join('');
        resultHTML = `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">ยอดจ่ายสุทธิรวมทุกงวด (ไม่รวมเงินประกันที่ถือไว้)</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${formatMoney(calc.totalNet)} บาท</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${line('มูลค่างานตามสัญญา', `${formatMoney(calc.totalGross)} บาท`)}
                    ${calc.applyVat ? line('VAT รวม', `${formatMoney(calc.totalVat)} บาท`) : ''}
                    ${line('เงินประกันผลงานที่ถือไว้รวม', `${formatMoney(calc.totalRetention)} บาท`)}
                    ${calc.applyWht ? line('ภาษีหัก ณ ที่จ่ายรวม', `${formatMoney(calc.totalWht)} บาท`) : ''}
                </div>
                <div class="space-y-2">${cards}</div>
            </div>`;
        statusHTML = `จ่ายสุทธิรวม <span class="text-lg text-[var(--app-accent)] underline">${formatMoney(calc.totalNet)} บาท</span><span class="text-xs font-normal opacity-80 block mt-1">${calc.items.length} งวด · เงินประกันถือไว้ ${formatMoney(calc.totalRetention)} บาท</span>`;
    } else if (calc.reason === 'pct_sum') {
        resultHTML = `<div class="themed-subcard p-3 text-xs font-semibold" role="alert">เปอร์เซ็นต์ทุกงวดรวมกันได้ ${formatNum(calc.pctSum, 2)}% ต้องรวมกันเท่ากับ 100%</div>`;
        emptyText = 'เปอร์เซ็นต์ทุกงวดต้องรวมกันเท่ากับ 100%';
    } else if (calc.reason === 'invalid_installment') {
        emptyText = 'กรอกเปอร์เซ็นต์ของทุกงวดเป็นตัวเลข';
    }

    container.innerHTML = `
        <div class="contractor-payment-tool flex flex-col gap-3 p-1">
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'มูลค่างานตามสัญญา (ก่อน VAT)', st.contractValue, 'บาท', 'เช่น 1,200,000')}
                ${createKeypadFieldHTML(1, 'เงินประกันผลงาน (Retention)', st.retentionPct, '%', 'เช่น 5')}
                ${createKeypadFieldHTML(2, 'อัตราหัก ณ ที่จ่าย (ใช้เมื่อเลือกหัก)', st.whtPct, '%', 'เช่น 3')}
                ${createKeypadFieldHTML(3, 'อัตรา VAT (ใช้เมื่อเลือกคิด)', st.vatRate, '%', 'เช่น 7')}
            </div>
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ภาษี</div>
                <div class="grid grid-cols-2 gap-2">
                    ${toggle('applyVat', 'คิด VAT เพิ่มจากราคาสัญญา', Boolean(st.applyVat))}
                    ${toggle('applyWht', 'หักภาษี ณ ที่จ่าย', Boolean(st.applyWht))}
                </div>
            </div>
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ตัวอย่างการแบ่งงวด (ปรับเองได้)</div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">${templateChips}</div>
            </div>
            <div class="themed-tool-card p-3 space-y-3 text-xs">
                <div class="flex justify-between gap-2"><span class="font-semibold text-[var(--app-ink)]">งวดงาน</span><span class="font-mono ${Number.isFinite(pctSumNow) && Math.abs(pctSumNow - 100) <= 1e-6 ? 'text-[var(--app-muted)]' : 'font-bold'}">รวม ${Number.isFinite(pctSumNow) ? formatNum(pctSumNow, 2) : '-'}%</span></div>
                ${rowsHTML || '<div class="text-[var(--app-muted)]">ยังไม่มีงวด กดเพิ่มงวดด้านล่าง</div>'}
                <button type="button" class="tool-action-btn" id="btnAddInstallment" style="min-height: 44px;">เพิ่มงวด</button>
            </div>
            ${resultHTML}
            <div class="themed-subcard p-3 text-[11px] text-[var(--app-muted)] space-y-1">
                <div>เปอร์เซ็นต์ของตัวอย่างเป็นเพียงค่าเริ่มต้น ไม่ใช่มาตรฐาน ให้กำหนดตามสัญญาจริงที่ตกลงกัน</div>
                <div>วิธีคิด: VAT และหัก ณ ที่จ่ายคำนวณจากค่าจ้างงวดนั้นก่อน VAT ส่วนเงินประกันหักจากค่าจ้างงวดนั้น ยอดสุทธิ = ค่าจ้าง + VAT - เงินประกัน - หัก ณ ที่จ่าย</div>
                <div>ยังไม่ยืนยัน: ภาษีหัก ณ ที่จ่ายใช้กรณีผู้ว่าจ้างเป็นนิติบุคคลและเป็นค่าจ้างทำของ และวิธีจัดการ VAT กับเงินประกันขึ้นกับเงื่อนไขสัญญา ควรสอบถามนักบัญชีหรือผู้ทำสัญญา</div>
            </div>
        </div>
    `;

    attachFieldClickListeners(container);

    container.querySelectorAll('[data-cp-template]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tpl = CONTRACTOR_TEMPLATES.find(t => t.key === btn.dataset.cpTemplate);
            if (!tpl) return;
            st.template = tpl.key;
            st.installments = tpl.pcts.map((p, i) => ({ id: String(i + 1), pct: String(p) }));
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('[data-cp-toggle]').forEach(btn => {
        btn.addEventListener('click', () => {
            st[btn.dataset.cpToggle] = !st[btn.dataset.cpToggle];
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('[data-cp-pct]').forEach(input => {
        input.addEventListener('change', () => {
            const target = rows.find(r => r.id === input.dataset.cpPct);
            if (!target) return;
            target.pct = input.value;
            st.template = '';
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('[data-cp-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.installments = rows.filter(r => r.id !== btn.dataset.cpRemove);
            st.template = '';
            persistAppState();
            renderActiveTool();
        });
    });
    const addBtn = document.getElementById('btnAddInstallment');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (rows.length >= CONTRACTOR_MAX_INSTALLMENTS) return;
            const nextId = String(rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1);
            st.installments = rows.concat([{ id: nextId, pct: '' }]);
            st.template = '';
            persistAppState();
            renderActiveTool();
        });
    }

    if (statusHTML) {
        setStatusBanner('success', statusHTML);
    } else {
        setStatusBanner('empty', emptyText);
    }
}

/* -----------------------------------------------------------
 * TOOL: ถังเก็บน้ำ & ปั๊มน้ำบ้าน (plumbing_pump)
 * ----------------------------------------------------------- */

// ขนาดถังที่พบทั่วไปในท้องตลาด (ยังไม่ยืนยันกับผู้ผลิต)
var PLUMBING_TANK_SIZES_L = [500, 700, 1000, 1500, 2000, 3000];
// ช่วงกำลังวัตต์ปั๊มอัตโนมัติตามลักษณะบ้านจาก ENGINEERING_REFERENCE_STANDARDS.md ข้อ 5 (ยังไม่ยืนยัน)
var PLUMBING_HOUSE_TYPES = [
    { key: 'single', label: 'บ้าน 1 ชั้น / ทาวน์โฮม (เปิดน้ำพร้อมกัน 1-2 จุด)',                  minW: 100, maxW: 150 },
    { key: 'two',    label: 'บ้านเดี่ยว 2 ชั้น (เปิดพร้อมกัน 2-3 จุด / มีฝักบัวและเครื่องทำน้ำอุ่น)', minW: 200, maxW: 250 },
    { key: 'large',  label: 'บ้าน 2-3 ชั้นหลังใหญ่ / Rain Shower / หลายห้องน้ำ',                   minW: 300, maxW: 400 }
];
var PLUMBING_MAX_PEOPLE = 1000;
var PLUMBING_MAX_RESERVE_DAYS = 7;

function calculatePlumbing(st) {
    const people = parseNumericInput(st.people);
    const litersPerPerson = numberOrDefault(st.litersPerPerson, 200);
    const reserveDays = numberOrDefault(st.reserveDays, 1);
    const house = PLUMBING_HOUSE_TYPES.find(h => h.key === st.houseType);
    if (![people, litersPerPerson, reserveDays].every(Number.isFinite) || !Number.isInteger(people)
        || people < 1 || people > PLUMBING_MAX_PEOPLE || litersPerPerson <= 0 || reserveDays <= 0 || reserveDays > PLUMBING_MAX_RESERVE_DAYS || !house) {
        return { valid: false };
    }
    const dailyLiters = people * litersPerPerson;
    const requiredLiters = dailyLiters * reserveDays;
    const largest = PLUMBING_TANK_SIZES_L[PLUMBING_TANK_SIZES_L.length - 1];
    const standardSize = PLUMBING_TANK_SIZES_L.find(size => size >= requiredLiters - 1e-9);
    const exceedsStandard = standardSize === undefined;
    const tankSizeL = exceedsStandard ? largest : standardSize;
    const tankCount = exceedsStandard ? Math.ceil(requiredLiters / largest - 1e-9) : 1;
    return {
        valid: true,
        people,
        litersPerPerson,
        reserveDays,
        dailyLiters,
        monthlyM3: dailyLiters * 30 / 1000,
        requiredLiters,
        tankSizeL,
        tankCount,
        installedLiters: tankSizeL * tankCount,
        exceedsStandard,
        house,
        pumpMinW: house.minW,
        pumpMaxW: house.maxW
    };
}

function renderPlumbingTool(container) {
    if (!appState.plumbing_pump) {
        appState.plumbing_pump = { people: '4', litersPerPerson: '200', reserveDays: '1', houseType: 'two' };
    }
    const st = appState.plumbing_pump;
    const calc = calculatePlumbing(st);
    const houseChips = PLUMBING_HOUSE_TYPES.map(h => `<button type="button" class="tool-chip-btn plumb-house-chip ${st.houseType === h.key ? 'active font-bold' : ''}" aria-pressed="${st.houseType === h.key}" data-house="${h.key}" style="min-height: 44px;">${h.label} · ${h.minW}-${h.maxW} วัตต์</button>`).join('');
    const row = (label, value) => `<div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">${label}</span><span class="font-semibold font-mono text-right">${value}</span></div>`;

    let resultHTML = '';
    if (calc.valid) {
        const tankText = `${formatNum(calc.tankSizeL, 0)} ลิตร${calc.tankCount > 1 ? ` x ${calc.tankCount} ใบ` : ''}`;
        resultHTML = `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">ถังเก็บน้ำที่แนะนำ</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${tankText}</div>
                <div class="text-xs text-[var(--app-muted)]">ต้องสำรอง ${formatNum(calc.requiredLiters, 0)} ลิตร (${formatNum(calc.people, 0)} คน x ${formatNum(calc.litersPerPerson, 0)} ลิตร x ${formatNum(calc.reserveDays, 1)} วัน)</div>
                ${calc.exceedsStandard ? `<div class="text-xs font-semibold">เกินขนาดถังที่พบทั่วไป ${formatNum(PLUMBING_TANK_SIZES_L[PLUMBING_TANK_SIZES_L.length - 1], 0)} ลิตร จึงแสดงเป็นหลายใบ หรือพิจารณาถังใต้ดิน/ถังคอนกรีต</div>` : ''}
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${row('ใช้น้ำต่อวัน', `${formatNum(calc.dailyLiters, 0)} ลิตร`)}
                    ${row('ใช้น้ำต่อเดือนโดยประมาณ', `${formatNum(calc.monthlyM3, 1)} ลบ.ม.`)}
                    ${row('ความจุที่ติดตั้ง', `${formatNum(calc.installedLiters, 0)} ลิตร`)}
                </div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    <div class="text-[var(--app-muted)]">กำลังวัตต์ปั๊มอัตโนมัติโดยทั่วไป</div>
                    <div class="themed-result-value text-xl font-bold font-mono">${calc.pumpMinW}-${calc.pumpMaxW} วัตต์</div>
                </div>
            </div>`;
    }

    container.innerHTML = `
        <div class="plumbing-pump-tool flex flex-col gap-3 p-1">
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'จำนวนผู้อยู่อาศัย', st.people, 'คน', 'เช่น 4')}
                ${createKeypadFieldHTML(1, 'ปริมาณการใช้น้ำ', st.litersPerPerson, 'ลิตร/คน/วัน', 'เช่น 200')}
                ${createKeypadFieldHTML(2, 'จำนวนวันที่สำรองน้ำ', st.reserveDays, 'วัน', 'เช่น 1')}
            </div>
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ลักษณะบ้านสำหรับเลือกปั๊ม</div>
                <div class="grid grid-cols-1 gap-2">${houseChips}</div>
            </div>
            ${resultHTML}
            <div class="themed-subcard p-3 text-[11px] text-[var(--app-muted)] space-y-1">
                <div>ขนาดถัง = จำนวนคน x ลิตรต่อคนต่อวัน x จำนวนวันที่สำรอง แล้วเลือกขนาดถังที่ใหญ่ขึ้นไปถัดจากค่าที่คำนวณได้</div>
                <div>ยังไม่ยืนยัน: ค่า 200 ลิตร/คน/วัน ช่วงวัตต์ปั๊มตามลักษณะบ้าน และขนาดถังมาตรฐาน มาจากเอกสารรวบรวม ไม่ใช่การคำนวณเฮดและอัตราไหล ควรเลือกปั๊มจากอัตราไหล (ลิตร/นาที) และเฮดของรุ่นที่ผู้ผลิตระบุ และให้ช่างประปาตรวจหน้างาน</div>
            </div>
        </div>
    `;

    attachFieldClickListeners(container);

    container.querySelectorAll('.plumb-house-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            st.houseType = btn.dataset.house;
            persistAppState();
            renderActiveTool();
        });
    });

    if (!calc.valid) {
        setStatusBanner('empty', 'ป้อนจำนวนผู้อยู่อาศัย (จำนวนเต็ม) เพื่อคำนวณขนาดถังเก็บน้ำ');
    } else {
        const tankText = `${formatNum(calc.tankSizeL, 0)} ลิตร${calc.tankCount > 1 ? ` x ${calc.tankCount} ใบ` : ''}`;
        setStatusBanner('success', `ถังเก็บน้ำ <span class="text-lg text-[var(--app-accent)] underline">${tankText}</span><span class="text-xs font-normal opacity-80 block mt-1">ต้องสำรอง ${formatNum(calc.requiredLiters, 0)} ลิตร · ปั๊มทั่วไป ${calc.pumpMinW}-${calc.pumpMaxW} วัตต์</span>`);
    }
}

/* -----------------------------------------------------------
 * TOOL: เศษส่วนนิ้ว หุน ↔ มิลลิเมตร (inch_fraction)
 * ----------------------------------------------------------- */

var INCH_MM = 25.4;
var HUN_PER_INCH = 8;
var INCH_DENOMINATORS = [2, 4, 8, 16, 32, 64];

function inchGcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) { const t = y; y = x % y; x = t; }
    return x || 1;
}

// แยกจำนวนนิ้วเป็นจำนวนเต็ม + เศษส่วนอย่างต่ำ (ตัวส่วนไม่เกิน den)
function inchesToFraction(inches, den) {
    const totalParts = Math.round(inches * den);
    const whole = Math.floor(totalParts / den);
    const rem = totalParts - whole * den;
    const g = rem === 0 ? 1 : inchGcd(rem, den);
    return { whole, num: rem / g, den: rem === 0 ? 1 : den / g, exact: Math.abs(inches * den - totalParts) < 1e-9 };
}

function formatInchFraction(f) {
    if (f.num === 0) return `${f.whole} นิ้ว`;
    return f.whole > 0 ? `${f.whole} ${f.num}/${f.den} นิ้ว` : `${f.num}/${f.den} นิ้ว`;
}

function calculateInchConversion(st) {
    const mode = ['inch', 'mm', 'hun'].includes(st.mode) ? st.mode : 'inch';
    const den = Number(st.den);
    if (!INCH_DENOMINATORS.includes(den)) return { valid: false };
    let inches;
    if (mode === 'inch') {
        const whole = numberOrDefault(st.whole, 0);
        const num = numberOrDefault(st.num, 0);
        if (![whole, num].every(Number.isFinite) || whole < 0 || num < 0) return { valid: false };
        inches = whole + num / den;
    } else if (mode === 'mm') {
        const mm = parseNumericInput(st.mm);
        if (!Number.isFinite(mm) || mm <= 0) return { valid: false };
        inches = mm / INCH_MM;
    } else {
        const hun = parseNumericInput(st.hun);
        if (!Number.isFinite(hun) || hun <= 0) return { valid: false };
        inches = hun / HUN_PER_INCH;
    }
    if (!(inches > 0)) return { valid: false };

    const exactMm = inches * INCH_MM;
    const result = { valid: true, mode, den, inches, mm: exactMm, cm: exactMm / 10, hun: inches * HUN_PER_INCH };
    if (mode === 'mm') {
        // ปัดเป็นเศษส่วนนิ้วที่ใกล้ที่สุดตามตัวส่วนที่เลือก
        const fraction = inchesToFraction(inches, den);
        const roundedInches = fraction.whole + (fraction.den > 0 ? fraction.num / fraction.den : 0);
        result.fraction = fraction;
        result.fractionMm = roundedInches * INCH_MM;
        result.errorMm = Math.abs(exactMm - result.fractionMm);
        result.fractionIsZero = roundedInches === 0;
    } else {
        result.fraction = inchesToFraction(inches, 64);
    }
    return result;
}

function renderInchFractionTool(container) {
    if (!appState.inch_fraction) {
        appState.inch_fraction = { mode: 'inch', whole: '1', num: '3', den: '8', mm: '', hun: '' };
    }
    const st = appState.inch_fraction;
    const mode = ['inch', 'mm', 'hun'].includes(st.mode) ? st.mode : 'inch';
    const calc = calculateInchConversion(st);
    const row = (label, value) => `<div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">${label}</span><span class="font-semibold font-mono text-right">${value}</span></div>`;
    const denChips = INCH_DENOMINATORS.map(d => `<button type="button" class="tool-chip-btn inch-den-chip ${Number(st.den) === d ? 'active font-bold' : ''}" aria-pressed="${Number(st.den) === d}" data-den="${d}" style="min-height: 44px;">1/${d}</button>`).join('');
    const segBtn = (key, label) => `<button type="button" class="segment-btn ${mode === key ? 'active' : ''}" aria-pressed="${mode === key}" data-inch-mode="${key}" style="min-height: 44px;">${label}</button>`;

    const inputs = mode === 'inch'
        ? `${createKeypadFieldHTML(0, 'จำนวนเต็ม (นิ้ว)', st.whole, 'นิ้ว', 'เช่น 1')}
           ${createKeypadFieldHTML(1, `เศษส่วน (ตัวเศษ ส่วน ${st.den})`, st.num, `/${st.den}`, 'เช่น 3')}`
        : mode === 'mm'
            ? createKeypadFieldHTML(0, 'ความยาว', st.mm, 'มม.', 'เช่น 35')
            : createKeypadFieldHTML(0, 'ขนาดเป็นหุน', st.hun, 'หุน', 'เช่น 4');
    const denLabel = mode === 'mm' ? 'ปัดเป็นเศษส่วนนิ้วที่ละเอียดสุด' : mode === 'inch' ? 'ตัวส่วนของเศษส่วน' : 'ตัวส่วนที่ใช้แสดงผล';

    let resultHTML = '';
    let statusHTML = null;
    if (calc.valid) {
        let main = '';
        let sub = '';
        if (mode === 'mm') {
            main = calc.fractionIsZero ? 'เล็กกว่าเศษส่วนที่เลือก' : formatInchFraction(calc.fraction);
            sub = `${calc.fraction.exact ? 'ตรงพอดี' : `คลาดเคลื่อน ${formatNum(calc.errorMm, 2)} มม.`} · ${formatNum(calc.mm, 2)} มม. = ${formatNum(calc.inches, 4)} นิ้ว`;
        } else {
            main = `${formatNum(calc.mm, 2)} มม.`;
            sub = mode === 'inch' ? `${formatInchFraction(inchesToFraction(calc.inches, Number(st.den)))} = ${formatNum(calc.inches, 4)} นิ้ว` : `${formatNum(calc.hun, 2)} หุน = ${formatNum(calc.inches, 4)} นิ้ว`;
        }
        resultHTML = `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">ผลการแปลงหน่วย</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${main}</div>
                <div class="text-xs text-[var(--app-muted)]">${sub}</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${row('มิลลิเมตร', `${formatNum(calc.mm, 2)} มม.`)}
                    ${row('เซนติเมตร', `${formatNum(calc.cm, 3)} ซม.`)}
                    ${row('นิ้ว (ทศนิยม)', `${formatNum(calc.inches, 4)} นิ้ว`)}
                    ${row('หุน (8 หุน = 1 นิ้ว)', `${formatNum(calc.hun, 3)} หุน`)}
                </div>
            </div>`;
        statusHTML = `${main}<span class="text-xs font-normal opacity-80 block mt-1">${sub}</span>`;
    }

    const hunRows = [1, 2, 3, 4, 5, 6, 7, 8].map(h => {
        const f = inchesToFraction(h / HUN_PER_INCH, 8);
        return `<div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">${h} หุน = ${formatInchFraction(f)}</span><span class="font-mono">${formatNum(h / HUN_PER_INCH * INCH_MM, 2)} มม.</span></div>`;
    }).join('');

    container.innerHTML = `
        <div class="inch-fraction-tool flex flex-col gap-3 p-1">
            <div class="segment-group grid-cols-3" role="group" aria-label="ทิศทางการแปลง">
                ${segBtn('inch', 'นิ้ว เป็น มม.')}
                ${segBtn('mm', 'มม. เป็น นิ้ว')}
                ${segBtn('hun', 'หุน เป็น มม.')}
            </div>
            <div class="flex flex-col gap-1.5">${inputs}</div>
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">${denLabel}</div>
                <div class="grid grid-cols-3 gap-2">${denChips}</div>
            </div>
            ${resultHTML}
            <div class="themed-subcard p-3 space-y-1.5 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ตารางหุน เป็นนิ้วและมิลลิเมตร (1 นิ้ว = 25.4 มม.)</div>
                ${hunRows}
            </div>
            <div class="themed-subcard p-3 text-[11px] text-[var(--app-muted)] space-y-1">
                <div>ตารางนี้เป็นการแปลงหน่วยความยาวเท่านั้น ขนาดเรียกท่อประปา PVC (เช่น ท่อ 4 หุน) เป็นขนาดเรียก ไม่ใช่เส้นผ่านศูนย์กลางนอกจริง จึงต้องตรวจตารางท่อของ มอก. หรือผู้ผลิต ห้ามใช้ค่าในตารางนี้เป็นขนาดจริงของท่อ</div>
            </div>
        </div>
    `;

    attachFieldClickListeners(container);

    container.querySelectorAll('[data-inch-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.mode = btn.dataset.inchMode;
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('.inch-den-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            st.den = btn.dataset.den;
            persistAppState();
            renderActiveTool();
        });
    });

    if (statusHTML) {
        setStatusBanner('success', statusHTML);
    } else {
        setStatusBanner('empty', mode === 'inch' ? 'ป้อนนิ้วและเศษส่วนเพื่อแปลงเป็นมิลลิเมตร' : mode === 'mm' ? 'ป้อนความยาวเป็นมิลลิเมตรเพื่อแปลงเป็นเศษส่วนนิ้ว' : 'ป้อนขนาดเป็นหุนเพื่อแปลงเป็นมิลลิเมตร');
    }
}

(function(root) {
    const exportsObj = {
        INCH_MM,
        INCH_DENOMINATORS,
        inchesToFraction,
        formatInchFraction,
        calculateInchConversion,
        renderInchFractionTool,
        PLUMBING_TANK_SIZES_L,
        PLUMBING_HOUSE_TYPES,
        calculatePlumbing,
        renderPlumbingTool,
        CONTRACTOR_TEMPLATES,
        calculateContractorPayment,
        renderContractorPaymentTool,
        REBAR_TABLE,
        REBAR_STOCK_LENGTH_M,
        calculateRoof,
        calculateCutting,
        calculateRebar,
        calculateConcreteVolume,
        renderRoofSteelTool,
        MASONRY_BRICK_PRESETS,
        CEILING_PANEL_PRESETS,
        calculateMasonry,
        calculateCeiling,
        renderWallCeilingTool,
        LAND_FILL_SOIL_PRESETS,
        calculateLandFill,
        renderLandFillTool,
        BTU_ROOM_PRESETS,
        BTU_STANDARD_SIZES,
        BTU_BASE_CEILING_M,
        BTU_DAYS_PER_MONTH,
        calculateBtu,
        renderBtuTool,
        WIRE_VD_DATA_VERIFIED,
        WIRE_SPEC_TABLE,
        STANDARD_BREAKER_RATINGS,
        WIRE_APPLIANCE_PRESETS,
        calculateWireBreaker
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
