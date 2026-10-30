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

(function(root) {
    const exportsObj = {
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
