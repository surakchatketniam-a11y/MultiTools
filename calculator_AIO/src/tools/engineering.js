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

// กระแสทำงาน (Running Current) ของแอร์ตัวอย่างจากแค็ตตาล็อก Mitsubishi ในภาคผนวก D ของคู่มือการติดตั้งระบบไฟฟ้า พ.ศ. 2564
// (ตาราง D1 ติดผนัง Standard Inverter, D2 ฝังฝ้า 4 ทิศทาง, D4 Duct, D5 ตั้งพื้น) ใช้เลือกสายและเบรกเกอร์ ไม่ใช่กำลังไฟเฉลี่ยในการคิดค่าไฟ
// ตรวจความสอดคล้องแล้วทุกแถว: kVA = V x A (1 เฟส) และ kVA = sqrt(3) x V x A (3 เฟส 380 V) ตาราง D3 (ฝังแขวน) ไม่ใช้เพราะข้อความที่ถอดจาก PDF เยื้องแถว
// เป็นข้อมูลของยี่ห้อเดียว รุ่นอื่นต่างกัน ต้องดูแผ่นป้ายหรือแค็ตตาล็อกของรุ่นที่ซื้อ
var AC_CATALOG_ENTRIES = [
    { type: 'wall',     btu: 8800,  amps: 4.6,  kva: 1.01, volts: 220, phases: 1 },
    { type: 'wall',     btu: 12200, amps: 6.0,  kva: 1.32, volts: 220, phases: 1 },
    { type: 'wall',     btu: 14300, amps: 6.8,  kva: 1.50, volts: 220, phases: 1 },
    { type: 'wall',     btu: 17700, amps: 8.5,  kva: 1.87, volts: 220, phases: 1 },
    { type: 'wall',     btu: 22500, amps: 9.2,  kva: 2.02, volts: 220, phases: 1 },
    { type: 'cassette', btu: 18000, amps: 7.8,  kva: 1.72, volts: 220, phases: 1 },
    { type: 'cassette', btu: 24000, amps: 10.1, kva: 2.22, volts: 220, phases: 1 },
    { type: 'cassette', btu: 30000, amps: 13.8, kva: 3.04, volts: 220, phases: 1 },
    { type: 'cassette', btu: 36000, amps: 16.6, kva: 3.65, volts: 220, phases: 1 },
    { type: 'cassette', btu: 42000, amps: 20.4, kva: 4.49, volts: 220, phases: 1 },
    { type: 'cassette', btu: 48000, amps: 28.1, kva: 6.18, volts: 220, phases: 1 },
    { type: 'cassette', btu: 36000, amps: 6.2,  kva: 4.08, volts: 380, phases: 3 },
    { type: 'cassette', btu: 42000, amps: 7.5,  kva: 4.94, volts: 380, phases: 3 },
    { type: 'cassette', btu: 48000, amps: 10.4, kva: 6.84, volts: 380, phases: 3 },
    { type: 'duct',     btu: 18000, amps: 8.2,  kva: 1.80, volts: 220, phases: 1 },
    { type: 'duct',     btu: 24000, amps: 10.4, kva: 2.29, volts: 220, phases: 1 },
    { type: 'duct',     btu: 30000, amps: 13.8, kva: 3.04, volts: 220, phases: 1 },
    { type: 'duct',     btu: 36000, amps: 17.7, kva: 3.89, volts: 220, phases: 1 },
    { type: 'duct',     btu: 42000, amps: 21.8, kva: 4.80, volts: 220, phases: 1 },
    { type: 'duct',     btu: 48000, amps: 27.3, kva: 6.01, volts: 220, phases: 1 },
    { type: 'duct',     btu: 36000, amps: 6.8,  kva: 4.48, volts: 380, phases: 3 },
    { type: 'duct',     btu: 42000, amps: 8.3,  kva: 5.46, volts: 380, phases: 3 },
    { type: 'duct',     btu: 48000, amps: 10.2, kva: 6.71, volts: 380, phases: 3 },
    { type: 'floor',    btu: 42000, amps: 19.0, kva: 4.18, volts: 220, phases: 1 },
    { type: 'floor',    btu: 45700, amps: 27.3, kva: 6.01, volts: 220, phases: 1 },
    { type: 'floor',    btu: 42000, amps: 7.1,  kva: 4.67, volts: 380, phases: 3 },
    { type: 'floor',    btu: 45700, amps: 10.1, kva: 6.65, volts: 380, phases: 3 }
];
var AC_CATALOG_MATCH_TOLERANCE = 0.10;
var AC_CATALOG_TYPE_LABELS = { wall: 'ติดผนัง', cassette: 'ฝังฝ้า 4 ทิศทาง', duct: 'ซ่อนในฝ้า (Duct)', floor: 'ตั้งพื้น' };

// กระแสทำงานที่ใช้เลือกสาย: ค่าสูงสุดของรุ่นตัวอย่างที่ขนาดอยู่ในช่วง +-10% ของขนาด BTU ที่ขอ (ระมัดระวังไว้ก่อน)
// คืน null ถ้าไม่มีรุ่นตัวอย่างใกล้ขนาดนั้นในระบบไฟที่ขอ
function acRatedCurrent(btu, phases) {
    const sys = Number(phases) === 3 ? 3 : 1;
    if (!Number.isFinite(btu) || btu <= 0) return null;
    const matches = AC_CATALOG_ENTRIES.filter(e => e.phases === sys && Math.abs(e.btu - btu) <= btu * AC_CATALOG_MATCH_TOLERANCE + 1e-9);
    if (matches.length === 0) return null;
    const top = matches.reduce((best, e) => (e.amps > best.amps ? e : best), matches[0]);
    return { currentA: top.amps, kva: top.kva, volts: top.volts, phases: sys, type: top.type, catalogBtu: top.btu, matches: matches.length };
}

// ส่งขนาดแอร์ที่แนะนำจาก btu_calc ไป wire_breaker: ใช้กระแสทำงานตามแค็ตตาล็อกโดยตรง
// (กำลังไฟ = กระแส x 230 V ที่ PF 1 ทำให้ wire_breaker ได้กระแสโหลดเท่ากับกระแสทำงานนั้น) และตั้งเป็นโหลดต่อเนื่อง
function buildBtuToWireHandoff(btuState) {
    const calc = calculateBtu(btuState || {});
    if (!calc.valid) return { hasAmount: false };
    const ac = acRatedCurrent(calc.recommendedBtu, 1);
    if (!ac) return { hasAmount: false };
    return {
        hasAmount: true,
        btu: calc.recommendedBtu,
        units: calc.units,
        currentA: ac.currentA,
        kva: ac.kva,
        type: ac.type,
        catalogBtu: ac.catalogBtu,
        watts: Math.round(ac.currentA * 230)
    };
}

function applyBtuToWireHandoff(btuState) {
    const handoff = buildBtuToWireHandoff(btuState);
    if (!handoff.hasAmount) return false;
    const previous = appState.wire_breaker || {};
    const lengthKept = String(previous.wireLengthM ?? '').trim() === '' ? '15' : previous.wireLengthM;
    appState.wire_breaker = {
        phases: '1',
        watts: String(handoff.watts),
        voltage: '230',
        powerFactor: '1',
        wireLengthM: lengthKept,
        ambientC: '40',
        circuits: '1',
        installMethod: previous.installMethod === 'surface' ? 'surface' : 'conduit',
        isContinuous: true,
        preset: '',
        source: {
            label: 'แอร์ ' + formatNum(handoff.btu, 0) + ' BTU กระแสทำงาน ' + formatNum(handoff.currentA, 1) + ' A (ตัวอย่างแค็ตตาล็อก Mitsubishi ในคู่มือ)',
            watts: handoff.watts
        }
    };
    persistAppState();
    return true;
}

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
    let wireCardHTML = '';
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
        const ac = acRatedCurrent(calc.recommendedBtu, 1);
        wireCardHTML = ac ? `
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">วงจรไฟฟ้าของแอร์${calc.units > 1 ? ' (ต่อเครื่อง)' : ''}</div>
                <div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">กระแสทำงานโดยประมาณ</span><span class="font-semibold font-mono">${formatNum(ac.currentA, 1)} A (${formatNum(ac.kva, 2)} kVA)</span></div>
                <div class="text-[11px] text-[var(--app-muted)]">จากรุ่นตัวอย่าง Mitsubishi ขนาด ${formatNum(ac.catalogBtu, 0)} BTU แบบ${AC_CATALOG_TYPE_LABELS[ac.type]} (ค่าสูงสุดของรุ่นตัวอย่างขนาดใกล้เคียง) รุ่นอื่นต่างกัน ควรดูแผ่นป้ายเครื่อง</div>
                <button type="button" class="tool-action-btn" id="btnBtuToWire" style="min-height: 44px;">คำนวณสายไฟและเบรกเกอร์สำหรับแอร์เครื่องนี้</button>
            </div>` : '';
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
            ${wireCardHTML}
        </div>
    `;

    attachFieldClickListeners(container);

    const wireBtn = document.getElementById('btnBtuToWire');
    if (wireBtn) {
        wireBtn.addEventListener('click', () => {
            if (!applyBtuToWireHandoff(st)) {
                if (typeof showHistoryToast === 'function') showHistoryToast('ยังไม่มีข้อมูลกระแสของแอร์ขนาดนี้', false);
                return;
            }
            selectTool('wire_breaker');
            if (typeof showHistoryToast === 'function') showHistoryToast('ส่งกระแสทำงานของแอร์ไปคำนวณสายไฟและเบรกเกอร์แล้ว');
        });
    }

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

// ตารางขนาดสายไฟทองแดง (ตร.มม.) และพิกัดกระแส (A) สายหุ้ม PVC ตัวนำ 70°C อุณหภูมิแวดล้อม 40°C ระบบ 1 เฟส (2 สายนำกระแส)
// conduit: สายเดี่ยว IEC 01 / THW ร้อยท่อ กลุ่มการติดตั้งที่ 2 (ตาราง 5-20)
// surface: สาย VAF / VAF-G เกาะผนัง กลุ่มการติดตั้งที่ 3 (ตาราง 5-21) VAF มีขนาด 1-16 ตร.มม.
// mVPerAmpMeter: แรงดันตก (mV/A/m) 1 เฟส สายเดี่ยว 70°C กลุ่ม 1,2 จากตาราง "Voltage Drop" ของ Yazaki
//
// แหล่งที่ใช้เทียบ (30 ต.ค. 2569) คือสำเนาตาราง วสท. ในเอกสารผู้ผลิต 3 ฉบับ ที่อยู่ในโฟลเดอร์ Knowledge/
// - Yazaki Technical Data Catalog: Table 5-20 (A24), Table 5-21 (A25), Voltage Drop Table 1-2 (A48-A49)
// - BCC Electric Design & Installation Guide: ตาราง 5-20 และ 5-21 (หน้า 158-160)
// - คู่มือการติดตั้งระบบไฟฟ้า พ.ศ. 2564: ข้อ 9.1 (mV/A/m) และตัวอย่างที่อ้าง 5-20 (IEC 01 2.5 ตร.มม. = 21 A)
// ผลเทียบ: แก้ conduit 16/25/35 ตร.มม. จาก 68/89/110 เป็น 66/88/109 A, แก้ mV/A/m ของ 25/35 ตร.มม. เป็น 1.81/1.33 (สายเดี่ยวกลุ่ม 1,2)
// และเพิ่ม VAF 16 ตร.มม. = 74 A ตามตาราง 5-21 (VAF มีขนาดสูงสุด 16 ตร.มม.) ค่าอื่นตรงกับตารางเดิม
// ยังไม่ได้เทียบกับหนังสือ วสท. 022001-22 โดยตรง ตัวคูณอุณหภูมิ (5-43) และจำนวนวงจร (5-8) อยู่ใน WIRE_AMBIENT_FACTORS / WIRE_GROUP_FACTORS
// conduit 1.0 ตร.มม. มีค่า 12 A ในตาราง แต่ตั้งเป็น 0 (ไม่ใช้) เพราะยังไม่ได้ตรวจเกณฑ์ขนาดสายขั้นต่ำของวงจรย่อย
// ดู ENGINEERING_REFERENCE_STANDARDS.md ข้อ 3.1-3.3
var WIRE_VD_DATA_VERIFIED = true;
var WIRE_DATA_SOURCE_NOTE = 'สำเนาตาราง วสท. ในแค็ตตาล็อก Yazaki และคู่มือ BCC';
// ระบบ 3 เฟส (แรงดันระหว่างสาย 400 V) ใช้เฉพาะสายเดี่ยว IEC 01 ร้อยท่อ ตาราง 5-20 กลุ่มที่ 2 คอลัมน์ 3 สายนำกระแสสายเดี่ยว
// conduitAmp3: กระแสสาย 3 สายนำกระแส (ตรงกับ Yazaki B1 "In conduit three-phase" และ BCC/Yazaki ตาราง 5-20)
// mVPerAmpMeter3: แรงดันตก 3 เฟส (ระหว่างสาย) สายเดี่ยว 70°C กลุ่ม 1,2 จากตาราง Voltage Drop ของ Yazaki และ BCC
// สาย VAF เป็นสาย 2 แกน ใช้กับ 1 เฟสเท่านั้น จึงไม่มีคอลัมน์ 3 เฟสสำหรับเดินเกาะผนัง
// ค่า 1.0 ตร.มม. มีในตารางแต่ไม่ใช้ในโค้ด (conduitAmp = 0) เหมือนกรณี 1 เฟส
var WIRE_SPEC_TABLE = [
    { sizeSqmm: 1.0,  conduitAmp: 0,   conduitAmp3: 0,   surfaceAmp: 14, mVPerAmpMeter: 44.0, mVPerAmpMeter3: 38.0, defaultBreaker: 10,  ampacityVerified: true },
    { sizeSqmm: 1.5,  conduitAmp: 15,  conduitAmp3: 13,  surfaceAmp: 17, mVPerAmpMeter: 29.0, mVPerAmpMeter3: 25.0, defaultBreaker: 10,  ampacityVerified: true },
    { sizeSqmm: 2.5,  conduitAmp: 21,  conduitAmp3: 18,  surfaceAmp: 23, mVPerAmpMeter: 18.0, mVPerAmpMeter3: 15.0, defaultBreaker: 16,  ampacityVerified: true },
    { sizeSqmm: 4.0,  conduitAmp: 28,  conduitAmp3: 24,  surfaceAmp: 32, mVPerAmpMeter: 11.0, mVPerAmpMeter3: 9.5,  defaultBreaker: 20,  ampacityVerified: true },
    { sizeSqmm: 6.0,  conduitAmp: 36,  conduitAmp3: 31,  surfaceAmp: 41, mVPerAmpMeter: 7.3,  mVPerAmpMeter3: 6.4,  defaultBreaker: 32,  ampacityVerified: true },
    { sizeSqmm: 10.0, conduitAmp: 50,  conduitAmp3: 44,  surfaceAmp: 56, mVPerAmpMeter: 4.4,  mVPerAmpMeter3: 3.8,  defaultBreaker: 50,  ampacityVerified: true },
    { sizeSqmm: 16.0, conduitAmp: 66,  conduitAmp3: 59,  surfaceAmp: 74, mVPerAmpMeter: 2.8,  mVPerAmpMeter3: 2.4,  defaultBreaker: 63,  ampacityVerified: true },
    { sizeSqmm: 25.0, conduitAmp: 88,  conduitAmp3: 77,  surfaceAmp: 0,  mVPerAmpMeter: 1.81, mVPerAmpMeter3: 1.52, defaultBreaker: 80,  ampacityVerified: true },
    { sizeSqmm: 35.0, conduitAmp: 109, conduitAmp3: 96,  surfaceAmp: 0,  mVPerAmpMeter: 1.33, mVPerAmpMeter3: 1.13, defaultBreaker: 100, ampacityVerified: true }
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
    { key: 'ac_12000',    label: 'แอร์ 12,000 BTU (6.0 A)',  watts: 1380,  powerFactor: 1.0,  continuous: true  },
    { key: 'ac_24000',    label: 'แอร์ 24,000 BTU (10.4 A)', watts: 2392,  powerFactor: 1.0,  continuous: true  },
    { key: 'ev_charger',  label: 'EV Charger 7.4 kW (32A)', watts: 7400,  powerFactor: 1.0,  continuous: true  },
    { key: 'ev_11kw',     label: 'EV Charger 11 kW (3 เฟส 16A)', watts: 11000, powerFactor: 1.0, continuous: true, phases: 3 },
    { key: 'ev_22kw',     label: 'EV Charger 22 kW (3 เฟส 32A)', watts: 22000, powerFactor: 1.0, continuous: true, phases: 3 }
];

// เกณฑ์แรงดันตกวงจรย่อย (ร้อยละ) ใช้ทั้งในการเลือกสายและคำนวณระยะสายสูงสุด
var WIRE_VD_LIMIT_PCT = 3;

// ตาราง 5-43 ตัวคูณปรับค่าอุณหภูมิแวดล้อมอื่นจาก 40°C สายหุ้ม PVC ตัวนำ 70°C (สายในอากาศ/ร้อยท่อ)
// ช่วง 61°C ขึ้นไปไม่มีค่า (ไม่อนุญาตให้ใช้สาย PVC 70°C) แหล่งตรวจ: Yazaki หน้า A43 และ BCC หน้า 186 ค่าคอลัมน์ PVC 70°C ตรงกัน
var WIRE_AMBIENT_FACTORS = [
    { minC: 11, maxC: 15, factor: 1.34 },
    { minC: 16, maxC: 20, factor: 1.29 },
    { minC: 21, maxC: 25, factor: 1.22 },
    { minC: 26, maxC: 30, factor: 1.15 },
    { minC: 31, maxC: 35, factor: 1.08 },
    { minC: 36, maxC: 40, factor: 1.00 },
    { minC: 41, maxC: 45, factor: 0.91 },
    { minC: 46, maxC: 50, factor: 0.82 },
    { minC: 51, maxC: 55, factor: 0.70 },
    { minC: 56, maxC: 60, factor: 0.57 }
];

// ตาราง 5-8 ตัวคูณจำนวนวงจรหรือสายหลายแกนที่เดินรวมกัน
// raceway: ในท่อร้อยสาย ตรวจจาก Yazaki A23 และ BCC หน้า 157 ตรงกัน และตรงกับตัวอย่างในคู่มือ 2564 (2 วงจร = 0.8)
// wall: เดินเกาะผนังชั้นเดียว ตรวจจากแหล่งเดียว (Yazaki A23) ยังไม่มีแหล่งที่สองยืนยัน
var WIRE_GROUP_FACTORS = [
    { minCircuits: 2,  maxCircuits: 2,  raceway: 0.80, wall: 0.85 },
    { minCircuits: 3,  maxCircuits: 3,  raceway: 0.70, wall: 0.79 },
    { minCircuits: 4,  maxCircuits: 4,  raceway: 0.65, wall: 0.75 },
    { minCircuits: 5,  maxCircuits: 5,  raceway: 0.60, wall: 0.73 },
    { minCircuits: 6,  maxCircuits: 6,  raceway: 0.57, wall: 0.72 },
    { minCircuits: 7,  maxCircuits: 7,  raceway: 0.54, wall: 0.72 },
    { minCircuits: 8,  maxCircuits: 8,  raceway: 0.52, wall: 0.71 },
    { minCircuits: 9,  maxCircuits: 9,  raceway: 0.50, wall: 0.70 },
    { minCircuits: 10, maxCircuits: 12, raceway: 0.45, wall: 0.70 },
    { minCircuits: 13, maxCircuits: 16, raceway: 0.41, wall: 0.70 },
    { minCircuits: 17, maxCircuits: 20, raceway: 0.38, wall: 0.70 }
];
var WIRE_MAX_CIRCUITS = 20;
var WIRE_AMBIENT_MIN_C = 11;
var WIRE_AMBIENT_MAX_C = 60;

// ตัวคูณอุณหภูมิ: ปัดอุณหภูมิขึ้นเป็นจำนวนเต็มก่อนหาช่วง (เช่น 40.5 ถือเป็น 41 อยู่ช่วง 41-45) เพื่อไม่ให้ได้ค่าที่ไม่ปลอดภัย
function wireAmbientFactor(ambientC) {
    if (!Number.isFinite(ambientC)) return null;
    const t = Math.ceil(ambientC - 1e-9);
    const band = WIRE_AMBIENT_FACTORS.find(b => t >= b.minC && t <= b.maxC);
    return band ? band.factor : null;
}

function wireGroupFactor(circuits, method) {
    if (!Number.isInteger(circuits) || circuits < 1) return null;
    if (circuits === 1) return 1;
    const band = WIRE_GROUP_FACTORS.find(b => circuits >= b.minCircuits && circuits <= b.maxCircuits);
    if (!band) return null;
    return method === 'surface' ? band.wall : band.raceway;
}

function calculateWireBreaker(st) {
    const phases = Number(st.phases) === 3 ? 3 : 1;
    const watts = parseNumericInput(st.watts);
    const voltage = numberOrDefault(st.voltage, phases === 3 ? 400 : 230);
    const powerFactor = numberOrDefault(st.powerFactor, 0.95);
    const wireLengthM = numberOrDefault(st.wireLengthM, 15);
    const ambientC = numberOrDefault(st.ambientC, 40);
    const circuits = numberOrDefault(st.circuits, 1);
    const method = st.installMethod === 'surface' ? 'surface' : 'conduit'; // 'conduit' (THW) or 'surface' (VAF)
    const isContinuous = Boolean(st.isContinuous); // โหลดต่อเนื่อง เช่น แอร์ / EV Charger คิด 125%

    if (![watts, voltage, powerFactor, wireLengthM, ambientC, circuits].every(Number.isFinite)
        || watts <= 0 || voltage <= 0 || powerFactor <= 0 || powerFactor > 1 || wireLengthM < 0
        || !Number.isInteger(circuits) || circuits < 1) {
        return { valid: false };
    }

    // กระแสโหลดปกติ (A) 1 เฟส: P / (V x PF), 3 เฟส (V = แรงดันระหว่างสาย): P / (sqrt(3) x V x PF)
    const loadCurrent = phases === 3 ? watts / (Math.sqrt(3) * voltage * powerFactor) : watts / (voltage * powerFactor);
    // กระแสออกแบบเบรกเกอร์ (คิดเผื่อ 125% สำหรับโหลดต่อเนื่อง)
    const designCurrent = isContinuous ? loadCurrent * 1.25 : loadCurrent;

    const round2 = (val) => Math.round((Number(val) || 0) * 100) / 100;
    // 3 เฟสใช้คอลัมน์ 3 สายนำกระแสของสายเดี่ยวร้อยท่อ ส่วน VAF (สาย 2 แกน) ไม่มีค่า 3 เฟส
    const ampKey = method === 'surface' ? 'surfaceAmp' : (phases === 3 ? 'conduitAmp3' : 'conduitAmp');
    const mvKey = phases === 3 ? 'mVPerAmpMeter3' : 'mVPerAmpMeter';
    const wireType = method === 'surface' ? 'VAF / VAF-G' : 'IEC 01 (THW)';
    const ambientFactor = wireAmbientFactor(ambientC);
    const groupFactor = wireGroupFactor(circuits, method);
    const derating = (ambientFactor !== null && groupFactor !== null) ? ambientFactor * groupFactor : null;
    const base = {
        valid: true,
        phases,
        watts,
        voltage,
        powerFactor,
        wireLengthM,
        ambientC,
        circuits,
        ambientFactor,
        groupFactor,
        // ตัวคูณจัดกลุ่มแบบเกาะผนังตรวจจากแหล่งเดียว
        groupFactorSingleSource: method === 'surface' && circuits > 1,
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
        derating,
        requiredAmpacity: null,
        deratedAmpacity: null,
        wireSizeSqmm: null,
        wireAmpacity: null,
        ampacityUnverified: false,
        voltageDropDataUnverified: !WIRE_VD_DATA_VERIFIED,
        vdVolts: null,
        vdPct: null,
        isVdExceeded: false,
        upgradedForVoltageDrop: false,
        maxLengthM: null
    });

    // หาเบรกเกอร์มาตรฐานขั้นต่ำที่ทนกระแสออกแบบได้ (Ib >= Id)
    const selectedBreaker = STANDARD_BREAKER_RATINGS.find(b => b >= designCurrent);
    if (!selectedBreaker) return unresolved('breaker_out_of_range', null);

    // สาย VAF เป็นสาย 2 แกน ใช้กับระบบ 1 เฟสเท่านั้น
    if (phases === 3 && method === 'surface') return unresolved('three_phase_surface_unsupported', selectedBreaker);

    // อุณหภูมิหรือจำนวนวงจรอยู่นอกช่วงตาราง 5-43 / 5-8 ไม่มีตัวคูณให้ใช้
    if (ambientFactor === null) return unresolved('ambient_out_of_range', selectedBreaker);
    if (groupFactor === null) return unresolved('circuits_out_of_range', selectedBreaker);

    // หาสายไฟที่ทนกระแสได้ตามหลักคู่มือ 2564: It = In / (Ca x Cg) คือพิกัดกระแสของสายในตารางต้องไม่น้อยกว่า It
    // (In = พิกัดเบรกเกอร์ Ca = ตัวคูณอุณหภูมิ Cg = ตัวคูณจำนวนวงจร) เทียบเท่า Iz x Ca x Cg >= In
    const requiredAmpacity = selectedBreaker / derating;
    const candidateWires = WIRE_SPEC_TABLE.filter(w => w[ampKey] > 0 && w[ampKey] * derating >= selectedBreaker - 1e-9);
    if (candidateWires.length === 0) return unresolved('no_suitable_wire', selectedBreaker);
    let selectedWire = candidateWires[0];

    // คำนวณแรงดันตก (Voltage Drop)
    // VD (V) = (mV/A/m * I * L) / 1000 (3 เฟสเป็นแรงดันตกระหว่างสาย)
    // %VD = (VD / Voltage) * 100
    let vdVolts = (selectedWire[mvKey] * loadCurrent * wireLengthM) / 1000;
    let vdPct = (vdVolts / voltage) * 100;

    // ตรวจสอบเกณฑ์แรงดันตกวงจรย่อย (ตามมาตรฐาน วสท. ไม่ควรเกิน 3%)
    let upgradedForVoltageDrop = false;
    if (vdPct > WIRE_VD_LIMIT_PCT) {
        // ลองขยับขนาดสายให้ใหญ่ขึ้นจนกว่า %VD <= 3% หรือจนสุดตาราง
        const currentIdx = WIRE_SPEC_TABLE.findIndex(w => w.sizeSqmm === selectedWire.sizeSqmm);
        // ถ้าไม่มีสายขนาดใดผ่านเกณฑ์ ใช้สายใหญ่สุดที่ตารางมีให้ และคง isVdExceeded ไว้เพื่อแจ้งเตือน
        for (let i = currentIdx + 1; i < WIRE_SPEC_TABLE.length; i++) {
            const nextWire = WIRE_SPEC_TABLE[i];
            if (nextWire[ampKey] === 0) continue;
            const nextVdVolts = (nextWire[mvKey] * loadCurrent * wireLengthM) / 1000;
            const nextVdPct = (nextVdVolts / voltage) * 100;
            selectedWire = nextWire;
            vdVolts = nextVdVolts;
            vdPct = nextVdPct;
            upgradedForVoltageDrop = true;
            if (nextVdPct <= WIRE_VD_LIMIT_PCT) break;
        }
    }

    // ระยะสายสูงสุดที่แรงดันตกไม่เกินเกณฑ์สำหรับสายที่เลือก ที่กระแสโหลดนี้
    // Lmax = (V x เกณฑ์% / 100 x 1000) / (mV/A/m x I)
    const maxLengthM = (voltage * (WIRE_VD_LIMIT_PCT / 100) * 1000) / (selectedWire[mvKey] * loadCurrent);

    return {
        ...base,
        selectionStatus: 'ok',
        recommendedBreaker: selectedBreaker,
        derating,
        requiredAmpacity: round2(requiredAmpacity),
        deratedAmpacity: round2(selectedWire[ampKey] * derating),
        wireSizeSqmm: selectedWire.sizeSqmm,
        wireAmpacity: selectedWire[ampKey],
        ampacityUnverified: !selectedWire.ampacityVerified,
        voltageDropDataUnverified: !WIRE_VD_DATA_VERIFIED,
        vdVolts: round2(vdVolts),
        vdPct: round2(vdPct),
        isVdExceeded: vdPct > WIRE_VD_LIMIT_PCT,
        upgradedForVoltageDrop,
        maxLengthM: round2(maxLengthM)
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

/* -----------------------------------------------------------
 * TOOL: พื้นที่ & ปริมาตรรูปทรงหน้างาน (shape_calc)
 * ----------------------------------------------------------- */

// รายการช่องกรอกของแต่ละรูปทรง (หน่วยเป็นเมตร) ลำดับตรงกับช่องคีย์แพดกลาง
var SHAPE_DEFINITIONS = [
    { key: 'rect',           label: 'สี่เหลี่ยมผืนผ้า',          fields: [['width', 'ความกว้าง'], ['length', 'ความยาว']], optionalDepth: true },
    { key: 'trapezoid',      label: 'สี่เหลี่ยมคางหมู',          fields: [['top', 'ด้านบน'], ['bottom', 'ด้านล่าง'], ['height', 'ความสูง']], optionalDepth: true },
    { key: 'triangle_bh',    label: 'สามเหลี่ยม (ฐาน x สูง)',    fields: [['base', 'ความยาวฐาน'], ['height', 'ความสูง']], optionalDepth: true },
    { key: 'triangle_sides', label: 'สามเหลี่ยม (รู้ 3 ด้าน)',    fields: [['sideA', 'ด้าน A'], ['sideB', 'ด้าน B'], ['sideC', 'ด้าน C']], optionalDepth: true },
    { key: 'circle',         label: 'วงกลม',                    fields: [['diameter', 'เส้นผ่านศูนย์กลาง']], optionalDepth: true },
    { key: 'semicircle',     label: 'ครึ่งวงกลม',                fields: [['diameter', 'เส้นผ่านศูนย์กลาง']], optionalDepth: true },
    { key: 'cylinder',       label: 'ทรงกระบอก (เสากลม)',        fields: [['diameter', 'เส้นผ่านศูนย์กลาง'], ['height', 'ความสูง']], optionalDepth: false },
    { key: 'prism_trap',     label: 'ปริซึมคางหมู (ร่องน้ำ/คันดิน)', fields: [['top', 'หน้าตัดด้านบน'], ['bottom', 'หน้าตัดด้านล่าง'], ['height', 'ความสูงหน้าตัด'], ['length', 'ความยาว']], optionalDepth: false }
];
var SHAPE_SQM_PER_RAI = 1600;
var SHAPE_SQM_PER_NGAN = 400;
var SHAPE_SQM_PER_WA = 4;

function shapeFieldKeys(shapeKey) {
    const def = SHAPE_DEFINITIONS.find(s => s.key === shapeKey);
    if (!def) return [];
    return def.fields.map(f => f[0]).concat(def.optionalDepth ? ['depth'] : []);
}

function splitRaiNganWa(areaSqm) {
    const rai = Math.floor(areaSqm / SHAPE_SQM_PER_RAI + 1e-9);
    const afterRai = areaSqm - rai * SHAPE_SQM_PER_RAI;
    const ngan = Math.floor(afterRai / SHAPE_SQM_PER_NGAN + 1e-9);
    const wa = (afterRai - ngan * SHAPE_SQM_PER_NGAN) / SHAPE_SQM_PER_WA;
    return { rai, ngan, wa };
}

function calculateShape(st) {
    const def = SHAPE_DEFINITIONS.find(s => s.key === st.shape);
    if (!def) return { valid: false };
    const v = {};
    for (const [key] of def.fields) v[key] = parseNumericInput(st[key]);
    if (!Object.values(v).every(n => Number.isFinite(n) && n > 0)) return { valid: false };

    const result = { valid: true, shape: def.key };
    switch (def.key) {
        case 'rect':
            result.areaSqm = v.width * v.length;
            result.perimeterM = 2 * (v.width + v.length);
            break;
        case 'trapezoid':
            result.areaSqm = (v.top + v.bottom) / 2 * v.height;
            break;
        case 'triangle_bh':
            result.areaSqm = v.base * v.height / 2;
            break;
        case 'triangle_sides': {
            const { sideA: a, sideB: b, sideC: c } = v;
            if (a + b <= c || a + c <= b || b + c <= a) return { valid: false, reason: 'triangle_inequality' };
            const s = (a + b + c) / 2;
            // สูตรเฮรอน
            result.areaSqm = Math.sqrt(s * (s - a) * (s - b) * (s - c));
            result.perimeterM = a + b + c;
            break;
        }
        case 'circle':
            result.areaSqm = Math.PI * (v.diameter / 2) ** 2;
            result.perimeterM = Math.PI * v.diameter;
            break;
        case 'semicircle':
            result.areaSqm = Math.PI * (v.diameter / 2) ** 2 / 2;
            result.perimeterM = Math.PI * v.diameter / 2 + v.diameter;
            break;
        case 'cylinder':
            result.areaSqm = Math.PI * (v.diameter / 2) ** 2;
            result.lateralAreaSqm = Math.PI * v.diameter * v.height;
            result.volumeM3 = result.areaSqm * v.height;
            break;
        case 'prism_trap':
            result.areaSqm = (v.top + v.bottom) / 2 * v.height;
            result.volumeM3 = result.areaSqm * v.length;
            break;
    }

    if (def.optionalDepth) {
        const depthRaw = String(st.depth ?? '').trim();
        if (depthRaw !== '') {
            const depth = parseNumericInput(depthRaw);
            if (!Number.isFinite(depth) || depth <= 0) return { valid: false, reason: 'invalid_depth' };
            result.depthM = depth;
            result.volumeM3 = result.areaSqm * depth;
        }
    }
    result.areaWa = result.areaSqm / SHAPE_SQM_PER_WA;
    result.raiNganWa = splitRaiNganWa(result.areaSqm);
    return result;
}

function renderShapeTool(container) {
    if (!appState.shape_calc) {
        appState.shape_calc = {
            shape: 'rect', width: '5', length: '8', top: '3', bottom: '5', height: '2', base: '4',
            sideA: '3', sideB: '4', sideC: '5', diameter: '2', depth: ''
        };
    }
    const st = appState.shape_calc;
    const def = SHAPE_DEFINITIONS.find(s => s.key === st.shape) || SHAPE_DEFINITIONS[0];
    const calc = calculateShape({ ...st, shape: def.key });
    const row = (label, value) => `<div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">${label}</span><span class="font-semibold font-mono text-right">${value}</span></div>`;
    const chips = SHAPE_DEFINITIONS.map(s => `<button type="button" class="tool-chip-btn shape-chip ${s.key === def.key ? 'active font-bold' : ''}" aria-pressed="${s.key === def.key}" data-shape="${s.key}" style="min-height: 44px;">${s.label}</button>`).join('');
    const fieldsHTML = def.fields.map((f, i) => createKeypadFieldHTML(i, f[1], st[f[0]], 'เมตร', 'เช่น 5')).join('')
        + (def.optionalDepth ? createKeypadFieldHTML(def.fields.length, 'ความหนา/ความลึก (ไม่บังคับ หาปริมาตร)', st.depth, 'เมตร', 'เช่น 0.1') : '');

    let resultHTML = '';
    let statusHTML = null;
    let emptyText = 'ป้อนขนาดของรูปทรงที่เลือก';
    if (calc.valid) {
        const rnw = calc.raiNganWa;
        const mainIsVolume = def.key === 'cylinder' || def.key === 'prism_trap';
        const mainLabel = mainIsVolume ? 'ปริมาตร' : 'พื้นที่';
        const mainValue = mainIsVolume ? `${formatNum(calc.volumeM3, 3)} ลบ.ม.` : `${formatNum(calc.areaSqm, 3)} ตร.ม.`;
        resultHTML = `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">${mainLabel}${def.key === 'prism_trap' ? 'รวมตลอดความยาว' : ''}</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${mainValue}</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${row(def.key === 'prism_trap' ? 'พื้นที่หน้าตัด' : def.key === 'cylinder' ? 'พื้นที่หน้าตัดวงกลม' : 'พื้นที่', `${formatNum(calc.areaSqm, 3)} ตร.ม.`)}
                    ${row('พื้นที่เป็นตารางวา', `${formatNum(calc.areaWa, 3)} ตร.ว.`)}
                    ${calc.areaSqm >= SHAPE_SQM_PER_NGAN ? row('ไร่ - งาน - ตร.ว.', `${formatNum(rnw.rai, 0)} - ${formatNum(rnw.ngan, 0)} - ${formatNum(rnw.wa, 2)}`) : ''}
                    ${calc.perimeterM !== undefined ? row(def.key === 'circle' ? 'เส้นรอบวง' : 'เส้นรอบรูป', `${formatNum(calc.perimeterM, 3)} ม.`) : ''}
                    ${calc.lateralAreaSqm !== undefined ? row('พื้นที่ผิวด้านข้าง', `${formatNum(calc.lateralAreaSqm, 3)} ตร.ม.`) : ''}
                    ${calc.volumeM3 !== undefined && !mainIsVolume ? row(`ปริมาตร (หนา ${formatNum(calc.depthM, 3)} ม.)`, `${formatNum(calc.volumeM3, 3)} ลบ.ม.`) : ''}
                </div>
            </div>`;
        statusHTML = `${mainLabel} <span class="text-lg text-[var(--app-accent)] underline">${mainValue}</span><span class="text-xs font-normal opacity-80 block mt-1">${def.label}${calc.volumeM3 !== undefined && !mainIsVolume ? ` · ปริมาตร ${formatNum(calc.volumeM3, 3)} ลบ.ม.` : ''}</span>`;
    } else if (calc.reason === 'triangle_inequality') {
        resultHTML = `<div class="themed-subcard p-3 text-xs font-semibold" role="alert">ความยาว 3 ด้านนี้ประกอบเป็นสามเหลี่ยมไม่ได้ ผลรวมของสองด้านใดๆ ต้องมากกว่าด้านที่เหลือ</div>`;
        emptyText = 'ความยาว 3 ด้านต้องประกอบเป็นสามเหลี่ยมได้';
    } else if (calc.reason === 'invalid_depth') {
        emptyText = 'ความหนา/ความลึกต้องเป็นตัวเลขที่มากกว่า 0 หรือเว้นว่างไว้';
    }

    container.innerHTML = `
        <div class="shape-calc-tool flex flex-col gap-3 p-1">
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">รูปทรง</div>
                <div class="grid grid-cols-2 gap-2">${chips}</div>
            </div>
            <div class="flex flex-col gap-1.5">${fieldsHTML}</div>
            ${resultHTML}
            <div class="themed-subcard p-3 text-[11px] text-[var(--app-muted)] space-y-1">
                <div>ป้อนหน่วยเป็นเมตรทั้งหมด 1 ตารางวา = 4 ตร.ม. 1 งาน = 400 ตร.ม. 1 ไร่ = 1,600 ตร.ม.</div>
                <div>สามเหลี่ยม 3 ด้านใช้สูตรเฮรอน ปริมาตรของรูปทรงแบนคิดจากพื้นที่ x ความหนา ค่านี้เป็นค่าตามรูปทรงอุดมคติ ไม่รวมเผื่อสูญเสีย</div>
            </div>
        </div>
    `;

    attachFieldClickListeners(container);

    container.querySelectorAll('.shape-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            st.shape = btn.dataset.shape;
            persistAppState();
            renderActiveTool();
        });
    });

    if (statusHTML) {
        setStatusBanner('success', statusHTML);
    } else {
        setStatusBanner('empty', emptyText);
    }
}

/* -----------------------------------------------------------
 * UI: ขนาดสายไฟ เบรกเกอร์ & แรงดันตก (wire_breaker)
 * engine และตารางอยู่ด้านบน (calculateWireBreaker) ตารางตรวจเทียบกับสำเนาตาราง วสท. ในเอกสารผู้ผลิตแล้ว
 * แต่ยังไม่ได้เทียบกับหนังสือ วสท. โดยตรง UI จึงแสดงคำเตือนทุกครั้ง และไม่แสดงตัวเลขเมื่อ engine ไม่มีคำตอบที่ปลอดภัย
 * ถ้าธงตรวจข้อมูลในตารางกลับเป็น false จะแสดงคำเตือนแบบเข้มว่ายังไม่ได้ตรวจ
 * ----------------------------------------------------------- */

function renderWireBreakerTool(container) {
    if (!appState.wire_breaker) {
        appState.wire_breaker = { phases: '1', watts: '3500', voltage: '230', powerFactor: '1', wireLengthM: '15', ambientC: '40', circuits: '1', installMethod: 'conduit', isContinuous: false, preset: 'water_3500' };
    }
    const st = appState.wire_breaker;
    const calc = calculateWireBreaker(st);
    const method = st.installMethod === 'surface' ? 'surface' : 'conduit';
    const phases = Number(st.phases) === 3 ? 3 : 1;
    const currentWatts = parseNumericInput(st.watts);
    const row = (label, value) => `<div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">${label}</span><span class="font-semibold font-mono text-right">${value}</span></div>`;

    const presetChips = WIRE_APPLIANCE_PRESETS.filter(p => (p.phases || 1) === phases).map(p => {
        const active = st.preset === p.key && currentWatts === p.watts;
        return `<button type="button" class="tool-chip-btn wire-preset-chip ${active ? 'active font-bold' : ''}" aria-pressed="${active}" data-wire-preset="${p.key}" style="min-height: 44px;">${p.label} · ${formatNum(p.watts, 0)} W</button>`;
    }).join('');
    const methodBtn = (key, label) => {
        const disabled = key === 'surface' && phases === 3;
        return `<button type="button" class="segment-btn ${method === key ? 'active' : ''} ${disabled ? 'opacity-50' : ''}" aria-pressed="${method === key}" ${disabled ? 'disabled aria-disabled="true"' : ''} data-wire-method="${key}" style="min-height: 44px;">${label}</button>`;
    };

    const dataChecked = WIRE_VD_DATA_VERIFIED && WIRE_SPEC_TABLE.every(w => w.ampacityVerified);
    const sourceNote = st.source && Number(st.source.watts) === currentWatts ? st.source.label : '';
    const warnings = [dataChecked
        ? `ตัวเลขพิกัดกระแสและแรงดันตกตรวจเทียบกับ${WIRE_DATA_SOURCE_NOTE} แล้ว แต่ยังไม่ได้เทียบกับหนังสือ วสท. โดยตรง คิดตัวคูณอุณหภูมิ (ตาราง 5-43) และจำนวนวงจร (ตาราง 5-8) แล้ว แต่ไม่รวมการเดินสายในผนังฉนวนความร้อนหรือใต้ดิน ต้องให้วิศวกรไฟฟ้าหรือช่างไฟที่มีใบอนุญาตตรวจก่อนติดตั้งจริงเสมอ`
        : 'ตารางพิกัดกระแสและค่าแรงดันตกยังไม่ได้ตรวจกับหนังสือ วสท. ไม่ควรใช้เป็นข้อมูลสำหรับติดตั้งจริง ต้องให้วิศวกรไฟฟ้าหรือช่างไฟที่มีใบอนุญาตตรวจก่อนเสมอ'];
    if (phases === 3) warnings.push('ระบบ 3 เฟสใช้สายเดี่ยว IEC 01 ร้อยท่อ (ตาราง 5-20 คอลัมน์ 3 สายนำกระแส) และแรงดันตกระหว่างสาย 3 เฟสเท่านั้น สาย VAF เป็นสาย 2 แกนใช้กับ 1 เฟส');
    let resultHTML = '';
    let statusType = 'empty';
    let statusHTML = 'ป้อนกำลังไฟฟ้าของอุปกรณ์เพื่อคำนวณขนาดสายไฟและเบรกเกอร์';

    if (calc.valid && calc.selectionStatus === 'breaker_out_of_range') {
        const maxBreaker = STANDARD_BREAKER_RATINGS[STANDARD_BREAKER_RATINGS.length - 1];
        resultHTML = `
            <div class="themed-result-card p-4 space-y-3" role="alert">
                <div class="text-xs text-[var(--app-muted)] font-medium">ไม่มีคำตอบจากตาราง</div>
                <div class="themed-result-value text-xl font-bold break-words">กระแสออกแบบ ${formatNum(calc.designCurrent, 2)} A เกินเบรกเกอร์ ${maxBreaker} A ที่ตารางมี</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${row('กระแสโหลด', `${formatNum(calc.loadCurrent, 2)} A`)}
                    ${row('กระแสออกแบบ', `${formatNum(calc.designCurrent, 2)} A`)}
                </div>
                <div class="text-xs">${phases === 1 ? 'โหลดขนาดนี้ต้องให้วิศวกรไฟฟ้าออกแบบ (เช่น แยกเป็นหลายวงจร หรือลองเปลี่ยนเป็นระบบ 3 เฟส)' : 'โหลดขนาดนี้ต้องให้วิศวกรไฟฟ้าออกแบบ (เช่น แยกเป็นหลายวงจร)'}</div>
            </div>`;
        statusType = 'error';
        statusHTML = `กระแสออกแบบ ${formatNum(calc.designCurrent, 2)} A เกินพิกัดเบรกเกอร์ที่ตารางมี ต้องให้วิศวกรออกแบบ`;
    } else if (calc.valid && calc.selectionStatus === 'no_suitable_wire') {
        resultHTML = `
            <div class="themed-result-card p-4 space-y-3" role="alert">
                <div class="text-xs text-[var(--app-muted)] font-medium">ไม่มีสายในตารางสำหรับเงื่อนไขนี้</div>
                <div class="themed-result-value text-xl font-bold break-words">เบรกเกอร์ ${calc.recommendedBreaker} A แต่ไม่มีสาย ${calc.wireType} ที่รองรับ</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${row('กระแสโหลด', `${formatNum(calc.loadCurrent, 2)} A`)}
                    ${row('กระแสออกแบบ', `${formatNum(calc.designCurrent, 2)} A`)}
                    ${row('เบรกเกอร์ที่คำนวณได้', `${calc.recommendedBreaker} A`)}
                </div>
                <div class="text-xs">ลองเปลี่ยนวิธีเดินสายเป็นร้อยท่อ ลดจำนวนวงจรที่เดินรวมกัน หรือให้วิศวกรไฟฟ้าเลือกสายให้ (พิกัดสายต้องไม่น้อยกว่าเบรกเกอร์ / (Ca x Cg))</div>
            </div>`;
        statusType = 'error';
        statusHTML = `ไม่มีสายในตารางที่รองรับเบรกเกอร์ ${calc.recommendedBreaker} A ในเงื่อนไขนี้ (วิธีเดินสาย อุณหภูมิ จำนวนวงจร) ให้เปลี่ยนเงื่อนไขหรือปรึกษาวิศวกร`;
    } else if (calc.valid && calc.selectionStatus === 'three_phase_surface_unsupported') {
        resultHTML = `
            <div class="themed-result-card p-4 space-y-3" role="alert">
                <div class="text-xs text-[var(--app-muted)] font-medium">ไม่มีสายสำหรับ 3 เฟสแบบเกาะผนัง</div>
                <div class="themed-result-value text-xl font-bold break-words">เบรกเกอร์ ${calc.recommendedBreaker} A แต่สาย VAF ใช้กับ 1 เฟสเท่านั้น</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${row('กระแสโหลด', `${formatNum(calc.loadCurrent, 2)} A`)}
                    ${row('กระแสออกแบบ', `${formatNum(calc.designCurrent, 2)} A`)}
                </div>
                <div class="text-xs">เลือกวิธีร้อยท่อ (สาย IEC 01) หรือให้วิศวกรไฟฟ้าเลือกสายหลายแกนสำหรับ 3 เฟสให้</div>
            </div>`;
        statusType = 'error';
        statusHTML = 'สาย VAF ใช้กับ 1 เฟสเท่านั้น ให้เลือกวิธีร้อยท่อหรือปรึกษาวิศวกร';
    } else if (calc.valid && (calc.selectionStatus === 'ambient_out_of_range' || calc.selectionStatus === 'circuits_out_of_range')) {
        const isAmbient = calc.selectionStatus === 'ambient_out_of_range';
        const reason = isAmbient
            ? `อุณหภูมิแวดล้อม ${formatNum(calc.ambientC, 1)} องศา อยู่นอกช่วงตาราง ${WIRE_AMBIENT_MIN_C}-${WIRE_AMBIENT_MAX_C} องศาของสาย PVC 70 องศา`
            : `จำนวนวงจรที่เดินรวมกัน ${formatNum(calc.circuits, 0)} วงจร เกินช่วงตารางที่มีถึง ${WIRE_MAX_CIRCUITS} วงจร`;
        resultHTML = `
            <div class="themed-result-card p-4 space-y-3" role="alert">
                <div class="text-xs text-[var(--app-muted)] font-medium">ไม่มีตัวคูณลดพิกัดในตาราง</div>
                <div class="themed-result-value text-xl font-bold break-words">${reason}</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${row('กระแสออกแบบ', `${formatNum(calc.designCurrent, 2)} A`)}
                    ${row('เบรกเกอร์ที่คำนวณได้', `${calc.recommendedBreaker} A`)}
                </div>
                <div class="text-xs">${isAmbient ? 'ถ้าอุณหภูมิสูงกว่านี้ ต้องใช้สายชนิดทนความร้อนสูงกว่าและให้วิศวกรไฟฟ้าเลือกให้' : 'ให้แยกวงจรออกเป็นหลายท่อ หรือให้วิศวกรไฟฟ้าออกแบบ'}</div>
            </div>`;
        statusType = 'error';
        statusHTML = `${reason} ให้ปรึกษาวิศวกรไฟฟ้า`;
    } else if (calc.valid) {
        const lengthAssumed = String(st.wireLengthM ?? '').trim() === '';
        if (calc.groupFactorSingleSource) warnings.push('ตัวคูณจำนวนวงจรของสายเดินเกาะผนังตรวจจากแหล่งเดียว (แค็ตตาล็อก Yazaki) ยังไม่มีแหล่งที่สองยืนยัน');
        if (calc.isVdExceeded) warnings.push(`แรงดันตก ${formatNum(calc.vdPct, 2)}% เกินเกณฑ์ ${WIRE_VD_LIMIT_PCT}% แม้ใช้สายใหญ่สุดที่ตารางมีให้แล้ว ลดระยะสายหรือให้วิศวกรตรวจ`);
        else if (calc.upgradedForVoltageDrop) warnings.push('ขยายขนาดสายจากเกณฑ์กระแสเพื่อให้แรงดันตกไม่เกิน 3%');
        if (calc.ampacityUnverified) warnings.push('ขนาดสายที่เลือกอยู่ในแถวที่ไม่มีแหล่งอ้างอิงยืนยันพิกัดกระแสเลย (25 หรือ 35 ตร.มม.)');
        if (lengthAssumed) warnings.push(`ไม่ได้ป้อนระยะสาย จึงใช้ ${formatNum(calc.wireLengthM, 0)} ม. ตามค่าเริ่มต้น`);
        resultHTML = `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">${dataChecked ? 'ผลการคำนวณ (ค่าตารางตรวจกับเอกสารผู้ผลิต)' : 'ผลการคำนวณ (ยังไม่ยืนยันกับ วสท.)'}</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">เบรกเกอร์ ${calc.recommendedBreaker} A · สาย ${formatNum(calc.wireSizeSqmm, 1)} ตร.มม.</div>
                <div class="text-xs text-[var(--app-muted)]">${calc.wireType} · ${calc.method === 'surface' ? 'เดินเกาะผนัง (ตีกิ๊บ)' : 'ร้อยท่อ'}</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${row('กระแสโหลด', `${formatNum(calc.loadCurrent, 2)} A`)}
                    ${row(calc.isContinuous ? 'กระแสออกแบบ (x1.25 โหลดต่อเนื่อง)' : 'กระแสออกแบบ', `${formatNum(calc.designCurrent, 2)} A`)}
                    ${row('ตัวคูณอุณหภูมิ Ca (ตาราง 5-43)', `x${formatNum(calc.ambientFactor, 2)} ที่ ${formatNum(calc.ambientC, 1)} °C`)}
                    ${row('ตัวคูณจำนวนวงจร Cg (ตาราง 5-8)', `x${formatNum(calc.groupFactor, 2)} (${formatNum(calc.circuits, 0)} วงจร)`)}
                    ${row('พิกัดกระแสสายที่ต้องการ = เบรกเกอร์ / (Ca x Cg)', `${formatNum(calc.requiredAmpacity, 2)} A`)}
                    ${row('พิกัดกระแสของสายในตาราง', `${formatNum(calc.wireAmpacity, 0)} A (หลังลดพิกัด ${formatNum(calc.deratedAmpacity, 1)} A)`)}
                    ${row('แรงดันตก', `${formatNum(calc.vdVolts, 2)} V (${formatNum(calc.vdPct, 2)}%)`)}
                    ${row('เกณฑ์แรงดันตกวงจรย่อย', `ไม่เกิน ${WIRE_VD_LIMIT_PCT}%`)}
                    ${row(`ระยะสายสูงสุดที่แรงดันตกไม่เกิน ${WIRE_VD_LIMIT_PCT}%`, `${formatNum(calc.maxLengthM, 1)} ม.`)}
                    ${row('ระบบไฟฟ้า', `${calc.phases} เฟส`)}
                    ${row('ใช้ระยะสาย / แรงดัน / PF', `${formatNum(calc.wireLengthM, 1)} ม. / ${formatNum(calc.voltage, 0)} V / ${formatNum(calc.powerFactor, 2)}`)}
                </div>
            </div>`;
        const vdBad = calc.isVdExceeded;
        // ไม่ใช้สถานะ success เพราะจะบันทึกผลลงประวัติอัตโนมัติ ทั้งที่ยังไม่ได้เทียบกับหนังสือ วสท. โดยตรง
        statusType = 'warning';
        statusHTML = `${vdBad ? 'แรงดันตกเกินเกณฑ์ · ' : ''}เบรกเกอร์ <span class="text-lg text-[var(--app-accent)] underline">${calc.recommendedBreaker} A</span> สาย ${formatNum(calc.wireSizeSqmm, 1)} ตร.มม.<span class="text-xs font-normal opacity-80 block mt-1">${dataChecked ? 'ต้องให้ช่างไฟตรวจก่อนติดตั้งจริง' : 'ยังไม่ยืนยันกับ วสท. ต้องให้ช่างไฟตรวจ'}</span>`;
    }

    container.innerHTML = `
        <div class="wire-breaker-tool flex flex-col gap-3 p-1">
            <div class="themed-subcard p-3 text-xs font-semibold space-y-1" role="note">
                ${warnings.map(w => `<div>${w}</div>`).join('')}
            </div>
            ${sourceNote ? `<div class="themed-subcard p-3 text-xs space-y-1" role="note"><div class="font-semibold text-[var(--app-ink)]">โหลดจากเครื่องมือคำนวณขนาดแอร์</div><div>${escapeHTML(sourceNote)}</div><div class="text-[var(--app-muted)]">ตั้งเป็นโหลดต่อเนื่อง (x1.25) กำลังไฟเป็นกระแส x 230 V ที่ PF 1 เพื่อให้ได้กระแสเท่ากับกระแสทำงาน</div></div>` : ''}
            <div class="segment-group grid-cols-2" role="group" aria-label="ระบบไฟฟ้า">
                <button type="button" class="segment-btn ${phases === 1 ? 'active' : ''}" aria-pressed="${phases === 1}" data-wire-phases="1" style="min-height: 44px;">1 เฟส (230 V)</button>
                <button type="button" class="segment-btn ${phases === 3 ? 'active' : ''}" aria-pressed="${phases === 3}" data-wire-phases="3" style="min-height: 44px;">3 เฟส (400 V)</button>
            </div>
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">อุปกรณ์ยอดนิยม</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${presetChips}</div>
            </div>
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'กำลังไฟฟ้าของโหลด', st.watts, 'วัตต์', 'เช่น 3,500')}
                ${createKeypadFieldHTML(1, phases === 3 ? 'แรงดันระหว่างสาย (3 เฟส)' : 'แรงดันไฟฟ้า (1 เฟส)', st.voltage, 'โวลต์', phases === 3 ? 'เช่น 400' : 'เช่น 230')}
                ${createKeypadFieldHTML(2, 'ตัวประกอบกำลัง (PF)', st.powerFactor, '', 'เช่น 0.95')}
                ${createKeypadFieldHTML(3, 'ระยะสายจากตู้ถึงโหลด', st.wireLengthM, 'เมตร', 'เช่น 15')}
                ${createKeypadFieldHTML(4, 'อุณหภูมิแวดล้อม', st.ambientC, '°C', 'เช่น 40')}
                ${createKeypadFieldHTML(5, 'จำนวนวงจรที่เดินรวมกันในท่อ/แนวเดียวกัน', st.circuits, 'วงจร', 'เช่น 1')}
            </div>
            <div class="segment-group grid-cols-2" role="group" aria-label="วิธีเดินสาย">
                ${methodBtn('conduit', 'ร้อยท่อ (IEC 01 / THW)')}
                ${methodBtn('surface', 'ตีกิ๊บเกาะผนัง (VAF)')}
            </div>
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <button type="button" class="tool-chip-btn wire-continuous-chip ${st.isContinuous ? 'active font-bold' : ''}" aria-pressed="${Boolean(st.isContinuous)}" id="btnWireContinuous" style="min-height: 44px;">โหลดต่อเนื่อง (แอร์ / EV Charger) คิดเผื่อ 125%</button>
            </div>
            ${resultHTML}
            <div class="themed-subcard p-3 text-[11px] text-[var(--app-muted)] space-y-1">
                <div>รองรับระบบ 1 เฟส (สาย IEC 01 ร้อยท่อ และ VAF) และ 3 เฟส (สาย IEC 01 ร้อยท่อ) สายทองแดงหุ้ม PVC 70 องศา ไม่รวมการเดินสายในผนังหรือเพดานฉนวนความร้อน (กลุ่ม 1) การเดินใต้ดิน สายหลายแกน การเลือกชนิดเบรกเกอร์ (MCB, RCBO) และสายดิน</div>
                <div>กระแสโหลด 1 เฟส = วัตต์ / (แรงดัน x PF) 3 เฟส = วัตต์ / (sqrt(3) x แรงดันระหว่างสาย x PF)</div>
                <div>วิธีคิด: เบรกเกอร์ต้องไม่เล็กกว่ากระแสออกแบบ พิกัดกระแสของสายในตารางต้องไม่น้อยกว่า เบรกเกอร์ / (Ca x Cg) ตามคู่มือ พ.ศ. 2564 และแรงดันตกวงจรย่อยไม่เกิน 3% ถ้าเกินจะขยับขนาดสายขึ้น ระยะสายสูงสุด = (แรงดัน x 3% x 1,000) / (mV/A/m x กระแสโหลด)</div>
                <div>เว้นช่องอุณหภูมิหรือจำนวนวงจรว่างไว้ = 40 องศา และ 1 วงจร (ไม่ลดพิกัด)</div>
            </div>
        </div>
    `;

    attachFieldClickListeners(container);

    container.querySelectorAll('.wire-preset-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = WIRE_APPLIANCE_PRESETS.find(p => p.key === btn.dataset.wirePreset);
            if (!preset) return;
            st.preset = preset.key;
            st.watts = String(preset.watts);
            st.powerFactor = String(preset.powerFactor);
            st.isContinuous = Boolean(preset.continuous);
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('[data-wire-phases]').forEach(btn => {
        btn.addEventListener('click', () => {
            const next = Number(btn.dataset.wirePhases) === 3 ? 3 : 1;
            if (next === phases) return;
            st.phases = String(next);
            const v = String(st.voltage ?? '').trim();
            if (next === 3 && (v === '' || v === '230')) st.voltage = '400';
            if (next === 1 && (v === '' || v === '400')) st.voltage = '230';
            if (next === 3) st.installMethod = 'conduit';
            const current = WIRE_APPLIANCE_PRESETS.find(p => p.key === st.preset);
            if (current && (current.phases || 1) !== next) st.preset = '';
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('[data-wire-method]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.installMethod = btn.dataset.wireMethod;
            persistAppState();
            renderActiveTool();
        });
    });
    const continuousBtn = document.getElementById('btnWireContinuous');
    if (continuousBtn) {
        continuousBtn.addEventListener('click', () => {
            st.isContinuous = !st.isContinuous;
            persistAppState();
            renderActiveTool();
        });
    }

    setStatusBanner(statusType, statusHTML);
}

/* -----------------------------------------------------------
 * TOOL: ขนาดท่อร้อยสาย (conduit_fill)
 * ----------------------------------------------------------- */

// เส้นผ่านศูนย์กลางนอกสูงสุด (มม.) ของสาย 60227 IEC 01 (THW) ตัวนำ non-compacted/compacted จากแค็ตตาล็อก Yazaki หน้า B1
// (ขนาด 1.5-4 ตร.มม. ใช้ค่าของสายตีเกลียวที่ใหญ่กว่าสายเดี่ยว) แหล่งเดียว แต่ตรวจย้อนแล้วว่าคำนวณได้ตรงกับตาราง C1 ของคู่มือ พ.ศ. 2564
// 126 จาก 131 ช่อง ส่วนอีก 5 ช่องคู่มือให้ได้มากกว่า 1 เส้น (ดู ENGINEERING_REFERENCE_STANDARDS.md ข้อ 3.5)
var CONDUIT_WIRE_DIAMETERS = [
    { sizeSqmm: 1.5, outerMm: 3.3 },
    { sizeSqmm: 2.5, outerMm: 4.0 },
    { sizeSqmm: 4,   outerMm: 4.6 },
    { sizeSqmm: 6,   outerMm: 5.2 },
    { sizeSqmm: 10,  outerMm: 6.7 },
    { sizeSqmm: 16,  outerMm: 7.8 },
    { sizeSqmm: 25,  outerMm: 9.7 },
    { sizeSqmm: 35,  outerMm: 10.9 },
    { sizeSqmm: 50,  outerMm: 12.8 },
    { sizeSqmm: 70,  outerMm: 14.6 },
    { sizeSqmm: 95,  outerMm: 17.1 },
    { sizeSqmm: 120, outerMm: 18.8 },
    { sizeSqmm: 150, outerMm: 20.9 },
    { sizeSqmm: 185, outerMm: 23.3 },
    { sizeSqmm: 240, outerMm: 26.6 },
    { sizeSqmm: 300, outerMm: 29.6 },
    { sizeSqmm: 400, outerMm: 33.2 }
];
// ขนาดท่อตามตาราง C ของคู่มือ (มม. และขนาดนิ้ว) พื้นที่หน้าตัดคิดจากขนาดเรียก: pi/4 x d^2 ตรงกับตาราง C5 (177, 314, 491, ...)
var CONDUIT_SIZES = [
    { mm: 15,  inch: '1/2' },
    { mm: 20,  inch: '3/4' },
    { mm: 25,  inch: '1' },
    { mm: 32,  inch: '1 1/4' },
    { mm: 40,  inch: '1 1/2' },
    { mm: 50,  inch: '2' },
    { mm: 65,  inch: '2 1/2' },
    { mm: 80,  inch: '3' },
    { mm: 90,  inch: '3 1/2' },
    { mm: 100, inch: '4' },
    { mm: 125, inch: '5' },
    { mm: 150, inch: '6' }
];
var CONDUIT_MAX_CONDUCTORS = 400;

// สัดส่วนพื้นที่สายต่อพื้นที่ท่อสูงสุด: 1 เส้น 53%, 2 เส้น 31%, ตั้งแต่ 3 เส้นขึ้นไป 40% (ตาราง C5 ของคู่มือ พ.ศ. 2564)
function conduitFillLimit(conductorCount) {
    if (conductorCount === 1) return 0.53;
    if (conductorCount === 2) return 0.31;
    return 0.40;
}

function conduitAreaMm2(tradeMm) {
    return Math.PI / 4 * tradeMm * tradeMm;
}

function conduitWireAreaMm2(sizeSqmm) {
    const wire = CONDUIT_WIRE_DIAMETERS.find(w => w.sizeSqmm === sizeSqmm);
    return wire ? Math.PI / 4 * wire.outerMm * wire.outerMm : null;
}

// จำนวนสายขนาดเดียวกันมากที่สุดที่ร้อยในท่อได้ (0 = ใส่ไม่ได้แม้เส้นเดียว)
function conduitMaxConductors(sizeSqmm, conduitMm) {
    const wireArea = conduitWireAreaMm2(sizeSqmm);
    if (wireArea === null || !(conduitMm > 0)) return 0;
    const area = conduitAreaMm2(conduitMm);
    let best = 0;
    for (let n = 1; n <= CONDUIT_MAX_CONDUCTORS; n++) {
        if (n * wireArea <= conduitFillLimit(n) * area + 1e-9) best = n;
    }
    return best;
}

function calculateConduitFill(st) {
    const mode = st.mode === 'count' ? 'count' : 'size';

    if (mode === 'count') {
        const wireSize = Number(st.wireSize);
        const conduitMm = Number(st.conduit);
        if (conduitWireAreaMm2(wireSize) === null || !CONDUIT_SIZES.some(c => c.mm === conduitMm)) return { valid: false, mode };
        const perConduit = CONDUIT_SIZES.map(c => ({ mm: c.mm, inch: c.inch, maxCount: conduitMaxConductors(wireSize, c.mm) }));
        return {
            valid: true,
            mode,
            wireSizeSqmm: wireSize,
            wireOuterMm: CONDUIT_WIRE_DIAMETERS.find(w => w.sizeSqmm === wireSize).outerMm,
            conduitMm,
            conduitInch: CONDUIT_SIZES.find(c => c.mm === conduitMm).inch,
            maxCount: conduitMaxConductors(wireSize, conduitMm),
            perConduit
        };
    }

    const rows = Array.isArray(st.rows) ? st.rows : [];
    let totalCount = 0;
    let totalAreaMm2 = 0;
    const items = [];
    for (const row of rows) {
        const countRaw = String(row.count ?? '').trim();
        if (countRaw === '') continue;
        const size = Number(row.size);
        const count = parseNumericInput(countRaw);
        const wireArea = conduitWireAreaMm2(size);
        if (wireArea === null || !Number.isInteger(count) || count < 1) return { valid: false, mode, reason: 'invalid_row' };
        totalCount += count;
        if (totalCount > CONDUIT_MAX_CONDUCTORS) return { valid: false, mode, reason: 'too_many' };
        totalAreaMm2 += count * wireArea;
        items.push({ sizeSqmm: size, count, areaMm2: count * wireArea });
    }
    if (items.length === 0) return { valid: false, mode, reason: 'no_rows' };

    const limit = conduitFillLimit(totalCount);
    const options = CONDUIT_SIZES.map(c => {
        const area = conduitAreaMm2(c.mm);
        const fillPct = totalAreaMm2 / area * 100;
        return { mm: c.mm, inch: c.inch, areaMm2: area, fillPct, limitPct: limit * 100, ok: totalAreaMm2 <= limit * area + 1e-9 };
    });
    const recommended = options.find(o => o.ok) || null;
    return {
        valid: true,
        mode,
        items,
        totalCount,
        totalAreaMm2,
        limitPct: limit * 100,
        options,
        recommended,
        exceedsAll: recommended === null
    };
}

function renderConduitFillTool(container) {
    if (!appState.conduit_fill) {
        appState.conduit_fill = {
            mode: 'size', rows: [{ id: '1', size: '2.5', count: '6' }, { id: '2', size: '4', count: '2' }], wireSize: '2.5', conduit: '20'
        };
    }
    const st = appState.conduit_fill;
    const mode = st.mode === 'count' ? 'count' : 'size';
    const calc = calculateConduitFill(st);
    const row = (label, value) => `<div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">${label}</span><span class="font-semibold font-mono text-right">${value}</span></div>`;
    const sizeOptions = selected => CONDUIT_WIRE_DIAMETERS.map(w => `<option value="${w.sizeSqmm}" ${String(w.sizeSqmm) === String(selected) ? 'selected' : ''}>${w.sizeSqmm} ตร.มม.</option>`).join('');
    const segBtn = (key, label) => `<button type="button" class="segment-btn ${mode === key ? 'active' : ''}" aria-pressed="${mode === key}" data-conduit-mode="${key}" style="min-height: 44px;">${label}</button>`;
    let body = '';

    if (mode === 'size') {
        const rows = Array.isArray(st.rows) ? st.rows : [];
        const rowsHTML = rows.map((r, i) => `
            <div class="grid grid-cols-[1fr_1fr_auto] gap-2 items-end" data-conduit-row="${escapeHTML(r.id)}">
                <div class="min-w-0">
                    <label for="conduit-size-${escapeHTML(r.id)}" class="text-[var(--app-muted)] text-[11px] block">ขนาดสายรายการที่ ${i + 1}</label>
                    <select id="conduit-size-${escapeHTML(r.id)}" class="airbnb-input text-xs w-full min-w-0" style="min-height: 44px;" data-conduit-field="size" data-conduit-id="${escapeHTML(r.id)}">${sizeOptions(r.size)}</select>
                </div>
                <div class="min-w-0">
                    <label for="conduit-count-${escapeHTML(r.id)}" class="text-[var(--app-muted)] text-[11px] block">จำนวนเส้น</label>
                    <input id="conduit-count-${escapeHTML(r.id)}" type="text" inputmode="numeric" class="airbnb-input text-right text-xs w-full min-w-0" style="min-height: 44px;" value="${escapeHTML(r.count || '')}" data-conduit-field="count" data-conduit-id="${escapeHTML(r.id)}" placeholder="6">
                </div>
                <button type="button" class="tool-danger-btn" data-conduit-remove="${escapeHTML(r.id)}" style="min-height: 44px; min-width: 44px;" aria-label="ลบรายการที่ ${i + 1}">ลบ</button>
            </div>`).join('');
        body = `
            <div class="themed-tool-card p-3 space-y-3 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">สายที่จะร้อยในท่อเดียวกัน (นับรวมสายดิน)</div>
                ${rowsHTML || '<div class="text-[var(--app-muted)]">ยังไม่มีรายการ กดเพิ่มรายการด้านล่าง</div>'}
                <button type="button" class="tool-action-btn" id="btnAddConduitRow" style="min-height: 44px;">เพิ่มรายการสาย</button>
            </div>`;
        if (calc.valid) {
            const rec = calc.recommended;
            const recIdx = rec ? calc.options.indexOf(rec) : calc.options.length - 1;
            const shown = calc.options.slice(Math.max(0, recIdx - 1), Math.max(0, recIdx - 1) + 4);
            const optionRows = shown.map(o => `<div class="flex justify-between gap-2"><span class="${o.ok ? 'font-semibold' : 'text-[var(--app-muted)]'}">ท่อ ${o.mm} มม. (${o.inch} นิ้ว)</span><span class="font-mono text-right">${formatNum(o.fillPct, 1)}% จาก ${formatNum(o.limitPct, 0)}% ${o.ok ? 'ผ่าน' : 'เกิน'}</span></div>`).join('');
            body += `
            <div class="themed-result-card p-4 space-y-3" ${rec ? '' : 'role="alert"'}>
                <div class="text-xs text-[var(--app-muted)] font-medium">${rec ? 'ท่อที่เล็กที่สุดที่ร้อยได้' : 'สายมากเกินกว่าท่อที่มีในตาราง'}</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${rec ? `ท่อ ${rec.mm} มม. (${rec.inch} นิ้ว)` : `เกินท่อ ${CONDUIT_SIZES[CONDUIT_SIZES.length - 1].mm} มม.`}</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${row('จำนวนสายรวม', `${formatNum(calc.totalCount, 0)} เส้น`)}
                    ${row('พื้นที่สายรวม', `${formatNum(calc.totalAreaMm2, 1)} ตร.มม.`)}
                    ${row('สัดส่วนสูงสุดที่ยอมให้', `${formatNum(calc.limitPct, 0)}% ของพื้นที่ท่อ`)}
                    ${rec ? row('ใช้พื้นที่ท่อ', `${formatNum(rec.fillPct, 1)}%`) : ''}
                </div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    <div class="font-semibold text-[var(--app-ink)]">เทียบขนาดท่อ</div>
                    ${optionRows}
                </div>
            </div>`;
        } else if (calc.reason === 'invalid_row') {
            body += '<div class="themed-subcard p-3 text-xs font-semibold" role="alert">จำนวนเส้นต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป</div>';
        } else if (calc.reason === 'too_many') {
            body += `<div class="themed-subcard p-3 text-xs font-semibold" role="alert">จำนวนสายรวมเกิน ${formatNum(CONDUIT_MAX_CONDUCTORS, 0)} เส้น ให้แบ่งเป็นหลายท่อ</div>`;
        }
    } else {
        const conduitChips = CONDUIT_SIZES.map(c => `<button type="button" class="tool-chip-btn conduit-size-chip ${Number(st.conduit) === c.mm ? 'active font-bold' : ''}" aria-pressed="${Number(st.conduit) === c.mm}" data-conduit-size="${c.mm}" style="min-height: 44px;">${c.mm} มม. (${c.inch})</button>`).join('');
        body = `
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <label for="conduitWireSize" class="font-semibold text-[var(--app-ink)] block">ขนาดสาย IEC 01 (THW)</label>
                <select id="conduitWireSize" class="airbnb-input text-xs w-full min-w-0" style="min-height: 44px;">${sizeOptions(st.wireSize)}</select>
            </div>
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ขนาดท่อ</div>
                <div class="grid grid-cols-2 gap-2">${conduitChips}</div>
            </div>`;
        if (calc.valid) {
            const tableRows = calc.perConduit.map(c => `<div class="flex justify-between gap-2 ${c.mm === calc.conduitMm ? 'font-bold' : ''}"><span class="${c.mm === calc.conduitMm ? '' : 'text-[var(--app-muted)]'}">ท่อ ${c.mm} มม. (${c.inch} นิ้ว)</span><span class="font-mono text-right">${c.maxCount > 0 ? `${formatNum(c.maxCount, 0)} เส้น` : 'ใส่ไม่ได้'}</span></div>`).join('');
            body += `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">ร้อยสาย ${formatNum(calc.wireSizeSqmm, 1)} ตร.มม. ในท่อ ${calc.conduitMm} มม. ได้มากที่สุด</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${calc.maxCount > 0 ? `${formatNum(calc.maxCount, 0)} เส้น` : 'ใส่ไม่ได้'}</div>
                <div class="text-xs text-[var(--app-muted)]">เส้นผ่านศูนย์กลางนอกของสาย ${formatNum(calc.wireOuterMm, 1)} มม.</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    <div class="font-semibold text-[var(--app-ink)]">จำนวนสายสูงสุดในท่อแต่ละขนาด</div>
                    ${tableRows}
                </div>
            </div>`;
        }
    }

    container.innerHTML = `
        <div class="conduit-fill-tool flex flex-col gap-3 p-1">
            <div class="segment-group grid-cols-2" role="group" aria-label="โหมดคำนวณ">
                ${segBtn('size', 'หาขนาดท่อ')}
                ${segBtn('count', 'ร้อยสายได้กี่เส้น')}
            </div>
            ${body}
            <div class="themed-subcard p-3 text-[11px] text-[var(--app-muted)] space-y-1">
                <div>สัดส่วนพื้นที่สายรวมต่อพื้นที่ท่อไม่เกิน 53% (1 เส้น), 31% (2 เส้น), 40% (3 เส้นขึ้นไป) ตามตาราง C5 ของคู่มือ พ.ศ. 2564 พื้นที่ท่อคิดจากขนาดเรียก (มม.) ไม่ใช่เส้นผ่านศูนย์กลางภายในจริง ซึ่งต่างกันตามชนิดท่อ (EMT, IMC, RSC, PVC) ควรตรวจกับข้อมูลท่อรุ่นที่ใช้</div>
                <div>เฉพาะสายเดี่ยว 60227 IEC 01 (THW) ใช้เส้นผ่านศูนย์กลางนอกสูงสุดจากแค็ตตาล็อก Yazaki ผลคำนวณตรงกับตาราง C1 ของคู่มือ 126 จาก 131 ช่อง ส่วนที่ต่างกัน 5 ช่อง คู่มือให้มากกว่า 1 เส้น เครื่องมือนี้จึงระมัดระวังกว่า</div>
                <div>ค่าประมาณเพื่อประกอบการตัดสินใจ ไม่รวมการดัดท่อ ระยะดึงสาย และข้อกำหนดเฉพาะของผู้ผลิตท่อ ควรให้ช่างหรือวิศวกรตรวจ</div>
            </div>
        </div>
    `;

    container.querySelectorAll('[data-conduit-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.mode = btn.dataset.conduitMode;
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('[data-conduit-field]').forEach(input => {
        input.addEventListener('change', () => {
            const target = (st.rows || []).find(r => r.id === input.dataset.conduitId);
            if (!target) return;
            target[input.dataset.conduitField] = input.value;
            persistAppState();
            renderActiveTool();
        });
    });
    container.querySelectorAll('[data-conduit-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.rows = (st.rows || []).filter(r => r.id !== btn.dataset.conduitRemove);
            persistAppState();
            renderActiveTool();
        });
    });
    const addBtn = document.getElementById('btnAddConduitRow');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const list = Array.isArray(st.rows) ? st.rows : [];
            const nextId = String(list.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1);
            st.rows = list.concat([{ id: nextId, size: '2.5', count: '1' }]);
            persistAppState();
            renderActiveTool();
        });
    }
    container.querySelectorAll('.conduit-size-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            st.conduit = btn.dataset.conduitSize;
            persistAppState();
            renderActiveTool();
        });
    });
    const wireSelect = document.getElementById('conduitWireSize');
    if (wireSelect) {
        wireSelect.addEventListener('change', () => {
            st.wireSize = wireSelect.value;
            persistAppState();
            renderActiveTool();
        });
    }
}

/* -----------------------------------------------------------
 * TOOL: ข้อมูลสายไฟ IEC 01 (THW) / VAF & จำนวนม้วน (wire_data)
 * ----------------------------------------------------------- */

// ข้อมูลสายจากแค็ตตาล็อก Thai-Yazaki หน้า B1 (60227 IEC 01 THW 450/750 V 70°C ตามมาตรฐาน มอก.11 เล่ม 3-2553) และ B28 (VAF 300/500 V 70°C
// ตาม มอก.11 เล่ม 101-2559) ค่าเป็นของผู้ผลิตรายเดียว (น้ำหนักเป็นค่าประมาณ ขนาดมีพิกัดความคลาดเคลื่อน) แต่กระแสในท่อ/ในอากาศ
// ตรงกับตาราง 5-20 / 5-21 ที่ใช้ใน wire_breaker และความต้านทานสอดคล้องกับค่า mV/A/m (ดูเทสต์)
// conductor: solid = ตัวนำเดี่ยว, stranded = ตีเกลียว (non-compacted), compacted = ตีเกลียวอัดแน่น
// pack: C = ม้วน (coil), D = ดรัม (drum) lengthM = ความยาวมาตรฐานต่อม้วนหรือดรัม
var WIRE_DATA_THW = [
    { sizeSqmm: 1.5, conductor: 'solid',     insulationMm: 0.7, dMinMm: 2.6,  dMaxMm: 3.2,  r20: 12.1,   airA: 21,  conduitA: 15,  conduit3A: 13,  weightKgKm: 21,   lengthM: 100,  pack: 'C' },
    { sizeSqmm: 1.5, conductor: 'stranded',  insulationMm: 0.7, dMinMm: 2.7,  dMaxMm: 3.3,  r20: 12.1,   airA: 21,  conduitA: 15,  conduit3A: 13,  weightKgKm: 22,   lengthM: 100,  pack: 'C' },
    { sizeSqmm: 2.5, conductor: 'solid',     insulationMm: 0.8, dMinMm: 3.2,  dMaxMm: 3.9,  r20: 7.41,   airA: 28,  conduitA: 21,  conduit3A: 18,  weightKgKm: 32,   lengthM: 100,  pack: 'C' },
    { sizeSqmm: 2.5, conductor: 'stranded',  insulationMm: 0.8, dMinMm: 3.3,  dMaxMm: 4.0,  r20: 7.41,   airA: 28,  conduitA: 21,  conduit3A: 18,  weightKgKm: 35,   lengthM: 100,  pack: 'C' },
    { sizeSqmm: 4,   conductor: 'solid',     insulationMm: 0.8, dMinMm: 3.6,  dMaxMm: 4.4,  r20: 4.61,   airA: 37,  conduitA: 28,  conduit3A: 24,  weightKgKm: 47,   lengthM: 100,  pack: 'C' },
    { sizeSqmm: 4,   conductor: 'stranded',  insulationMm: 0.8, dMinMm: 3.8,  dMaxMm: 4.6,  r20: 4.61,   airA: 37,  conduitA: 28,  conduit3A: 24,  weightKgKm: 50,   lengthM: 100,  pack: 'C' },
    { sizeSqmm: 6,   conductor: 'stranded',  insulationMm: 0.8, dMinMm: 4.3,  dMaxMm: 5.2,  r20: 3.08,   airA: 49,  conduitA: 36,  conduit3A: 31,  weightKgKm: 70,   lengthM: 100,  pack: 'C' },
    { sizeSqmm: 10,  conductor: 'stranded',  insulationMm: 1.0, dMinMm: 5.6,  dMaxMm: 6.7,  r20: 1.83,   airA: 68,  conduitA: 50,  conduit3A: 44,  weightKgKm: 120,  lengthM: 100,  pack: 'C' },
    { sizeSqmm: 16,  conductor: 'compacted', insulationMm: 1.0, dMinMm: 6.4,  dMaxMm: 7.8,  r20: 1.15,   airA: 91,  conduitA: 66,  conduit3A: 59,  weightKgKm: 180,  lengthM: 100,  pack: 'C' },
    { sizeSqmm: 25,  conductor: 'compacted', insulationMm: 1.2, dMinMm: 8.1,  dMaxMm: 9.7,  r20: 0.727,  airA: 122, conduitA: 88,  conduit3A: 77,  weightKgKm: 280,  lengthM: 100,  pack: 'C' },
    { sizeSqmm: 35,  conductor: 'compacted', insulationMm: 1.2, dMinMm: 9.0,  dMaxMm: 10.9, r20: 0.524,  airA: 151, conduitA: 109, conduit3A: 96,  weightKgKm: 370,  lengthM: 100,  pack: 'C' },
    { sizeSqmm: 50,  conductor: 'compacted', insulationMm: 1.4, dMinMm: 10.6, dMaxMm: 12.8, r20: 0.387,  airA: 184, conduitA: 131, conduit3A: 117, weightKgKm: 500,  lengthM: 1000, pack: 'D' },
    { sizeSqmm: 70,  conductor: 'compacted', insulationMm: 1.4, dMinMm: 12.1, dMaxMm: 14.6, r20: 0.268,  airA: 234, conduitA: 167, conduit3A: 149, weightKgKm: 700,  lengthM: 1000, pack: 'D' },
    { sizeSqmm: 95,  conductor: 'compacted', insulationMm: 1.6, dMinMm: 14.1, dMaxMm: 17.1, r20: 0.193,  airA: 292, conduitA: 202, conduit3A: 180, weightKgKm: 1000, lengthM: 1000, pack: 'D' },
    { sizeSqmm: 120, conductor: 'compacted', insulationMm: 1.6, dMinMm: 15.6, dMaxMm: 18.8, r20: 0.153,  airA: 341, conduitA: 234, conduit3A: 208, weightKgKm: 1200, lengthM: 1000, pack: 'D' },
    { sizeSqmm: 150, conductor: 'compacted', insulationMm: 1.8, dMinMm: 17.3, dMaxMm: 20.9, r20: 0.124,  airA: 391, conduitA: 261, conduit3A: 228, weightKgKm: 1500, lengthM: 1000, pack: 'D' },
    { sizeSqmm: 185, conductor: 'compacted', insulationMm: 2.0, dMinMm: 19.3, dMaxMm: 23.3, r20: 0.0991, airA: 454, conduitA: 297, conduit3A: 258, weightKgKm: 1900, lengthM: 1000, pack: 'D' },
    { sizeSqmm: 240, conductor: 'compacted', insulationMm: 2.2, dMinMm: 22.0, dMaxMm: 26.6, r20: 0.0754, airA: 543, conduitA: 348, conduit3A: 301, weightKgKm: 2500, lengthM: 1000, pack: 'D' },
    { sizeSqmm: 300, conductor: 'stranded',  insulationMm: 2.4, dMinMm: 24.5, dMaxMm: 29.6, r20: 0.0601, airA: 628, conduitA: 398, conduit3A: 343, weightKgKm: 3100, lengthM: 500,  pack: 'D' },
    { sizeSqmm: 400, conductor: 'stranded',  insulationMm: 2.6, dMinMm: 27.5, dMaxMm: 33.2, r20: 0.047,  airA: 736, conduitA: 475, conduit3A: 406, weightKgKm: 3900, lengthM: 500,  pack: 'D' }
];
// VAF 2 แกนแบน: ขนาดรวม กว้าง x สูง (มม.) ต่ำสุดและสูงสุด ตัวนำ 1.0-1.5 ตร.มม. เป็นสายเดี่ยว (Solid) ที่เหลือ Standard
var WIRE_DATA_VAF = [
    { sizeSqmm: 1.0, conductor: 'solid',    insulationMm: 0.6, sheathMm: 0.9, wMinMm: 4.0, hMinMm: 6.2,  wMaxMm: 4.7,  hMaxMm: 7.4,  r20: 18.1, airA: 14, weightKgKm: 50,  lengthM: 100, pack: 'C' },
    { sizeSqmm: 1.5, conductor: 'solid',    insulationMm: 0.7, sheathMm: 0.9, wMinMm: 4.4, hMinMm: 7.0,  wMaxMm: 5.4,  hMaxMm: 8.4,  r20: 12.1, airA: 17, weightKgKm: 70,  lengthM: 100, pack: 'C' },
    { sizeSqmm: 2.5, conductor: 'solid',    insulationMm: 0.8, sheathMm: 1.0, wMinMm: 5.2, hMinMm: 8.4,  wMaxMm: 6.2,  hMaxMm: 9.8,  r20: 7.41, airA: 23, weightKgKm: 100, lengthM: 100, pack: 'C' },
    { sizeSqmm: 4,   conductor: 'stranded', insulationMm: 0.8, sheathMm: 1.1, wMinMm: 5.6, hMinMm: 9.6,  wMaxMm: 7.2,  hMaxMm: 11.5, r20: 4.61, airA: 32, weightKgKm: 150, lengthM: 100, pack: 'C' },
    { sizeSqmm: 6,   conductor: 'stranded', insulationMm: 0.8, sheathMm: 1.1, wMinMm: 6.4, hMinMm: 10.5, wMaxMm: 8.0,  hMaxMm: 13.0, r20: 3.08, airA: 41, weightKgKm: 200, lengthM: 100, pack: 'C' },
    { sizeSqmm: 10,  conductor: 'stranded', insulationMm: 1.0, sheathMm: 1.2, wMinMm: 7.8, hMinMm: 13.0, wMaxMm: 9.6,  hMaxMm: 16.0, r20: 1.83, airA: 56, weightKgKm: 310, lengthM: 100, pack: 'C' },
    { sizeSqmm: 16,  conductor: 'stranded', insulationMm: 1.0, sheathMm: 1.3, wMinMm: 9.0, hMinMm: 15.5, wMaxMm: 11.0, hMaxMm: 18.5, r20: 1.15, airA: 74, weightKgKm: 450, lengthM: 100, pack: 'C' }
];
var WIRE_DATA_CONDUCTOR_LABELS = { solid: 'ตัวนำเดี่ยว (Solid)', stranded: 'ตีเกลียว (Stranded)', compacted: 'ตีเกลียวอัดแน่น (Compacted)' };
var WIRE_DATA_PACK_LABELS = { C: 'ม้วน', D: 'ดรัม' };

function wireDataRows(type) {
    return type === 'vaf' ? WIRE_DATA_VAF : WIRE_DATA_THW;
}

function calculateWireData(st) {
    const type = st.type === 'vaf' ? 'vaf' : 'thw';
    const size = Number(st.size);
    const rows = wireDataRows(type).filter(r => r.sizeSqmm === size);
    if (rows.length === 0) return { valid: false };
    // ขนาดที่มีทั้งสายเดี่ยวและสายตีเกลียว (1.5-4 ตร.มม.) ใช้ตัวนำที่เลือก ถ้าไม่ตรงใช้แบบตีเกลียว
    const row = rows.find(r => r.conductor === st.conductor) || rows.find(r => r.conductor === 'stranded') || rows[0];
    const lengthRaw = String(st.lengthM ?? '').trim();
    const result = { valid: true, type, row, variants: rows.map(r => r.conductor), hasLength: false };
    if (lengthRaw !== '') {
        const lengthM = parseNumericInput(lengthRaw);
        if (!Number.isFinite(lengthM) || lengthM <= 0) return { valid: false, reason: 'invalid_length' };
        const packs = Math.ceil(lengthM / row.lengthM - 1e-9);
        result.hasLength = true;
        result.lengthM = lengthM;
        result.totalWeightKg = row.weightKgKm * lengthM / 1000;
        result.resistanceOhm = row.r20 * lengthM / 1000;
        result.packs = packs;
        result.packedLengthM = packs * row.lengthM;
        result.leftoverM = packs * row.lengthM - lengthM;
    }
    return result;
}

function renderWireDataTool(container) {
    if (!appState.wire_data) {
        appState.wire_data = { type: 'thw', size: '2.5', conductor: 'stranded', lengthM: '100' };
    }
    const st = appState.wire_data;
    const type = st.type === 'vaf' ? 'vaf' : 'thw';
    const calc = calculateWireData(st);
    const row = (label, value) => `<div class="flex justify-between gap-2"><span class="text-[var(--app-muted)]">${label}</span><span class="font-semibold font-mono text-right">${value}</span></div>`;
    const sizes = [...new Set(wireDataRows(type).map(r => r.sizeSqmm))];
    const sizeOptions = sizes.map(sz => `<option value="${sz}" ${String(sz) === String(st.size) ? 'selected' : ''}>${sz} ตร.มม.</option>`).join('');
    const typeBtn = (key, label) => `<button type="button" class="segment-btn ${type === key ? 'active' : ''}" aria-pressed="${type === key}" data-wire-data-type="${key}" style="min-height: 44px;">${label}</button>`;

    let conductorChips = '';
    let resultHTML = '';
    if (calc.valid) {
        const r = calc.row;
        if (calc.variants.length > 1) {
            conductorChips = `
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ชนิดตัวนำ</div>
                <div class="grid grid-cols-1 gap-2">${calc.variants.map(v => `<button type="button" class="tool-chip-btn wire-data-conductor-chip ${r.conductor === v ? 'active font-bold' : ''}" aria-pressed="${r.conductor === v}" data-wire-data-conductor="${v}" style="min-height: 44px;">${WIRE_DATA_CONDUCTOR_LABELS[v]}</button>`).join('')}</div>
            </div>`;
        }
        const dims = type === 'vaf'
            ? row('ขนาดรวมกว้าง x สูง (ต่ำสุด - สูงสุด)', `${formatNum(r.wMinMm, 1)} x ${formatNum(r.hMinMm, 1)} - ${formatNum(r.wMaxMm, 1)} x ${formatNum(r.hMaxMm, 1)} มม.`)
            : row('เส้นผ่านศูนย์กลางนอก (ต่ำสุด - สูงสุด)', `${formatNum(r.dMinMm, 1)} - ${formatNum(r.dMaxMm, 1)} มม.`);
        const currents = type === 'vaf'
            ? row('กระแสในอากาศ 40°C', `${formatNum(r.airA, 0)} A`)
            : row('กระแสในอากาศ 40°C', `${formatNum(r.airA, 0)} A`)
                + row('กระแสร้อยท่อ 1 เฟส', `${formatNum(r.conduitA, 0)} A`)
                + row('กระแสร้อยท่อ 3 เฟส', `${formatNum(r.conduit3A, 0)} A`);
        const order = calc.hasLength ? `
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    <div class="font-semibold text-[var(--app-ink)]">สั่งซื้อ ${formatNum(calc.lengthM, 1)} เมตร</div>
                    ${row('น้ำหนักประมาณ', `${formatNum(calc.totalWeightKg, 1)} กก.`)}
                    ${row('ความต้านทานรวมที่ 20°C', `${formatNum(calc.resistanceOhm, 3)} โอห์ม`)}
                    ${row(`จำนวน${WIRE_DATA_PACK_LABELS[r.pack]}มาตรฐาน (${formatNum(r.lengthM, 0)} ม./${WIRE_DATA_PACK_LABELS[r.pack]})`, `${formatNum(calc.packs, 0)} ${WIRE_DATA_PACK_LABELS[r.pack]}`)}
                    ${row('ความยาวรวมถ้าซื้อเต็มหน่วย', `${formatNum(calc.packedLengthM, 0)} ม. (เหลือ ${formatNum(calc.leftoverM, 1)} ม.)`)}
                </div>` : '';
        resultHTML = `
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">${type === 'vaf' ? 'สาย VAF 2 แกน 300/500 V' : 'สาย IEC 01 (THW) 450/750 V'} ${formatNum(r.sizeSqmm, 1)} ตร.มม.</div>
                <div class="themed-result-value text-2xl font-bold font-mono break-words">${formatNum(r.weightKgKm, 0)} กก./กม.</div>
                <div class="text-xs text-[var(--app-muted)]">${WIRE_DATA_CONDUCTOR_LABELS[r.conductor]} · ฉนวน PVC หนา ${formatNum(r.insulationMm, 1)} มม.${type === 'vaf' ? ` · เปลือกนอกหนา ${formatNum(r.sheathMm, 1)} มม.` : ''}</div>
                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    ${dims}
                    ${row('ความต้านทานตัวนำที่ 20°C', `${formatNum(r.r20, 4)} โอห์ม/กม.`)}
                    ${currents}
                    ${row('ความยาวมาตรฐาน', `${formatNum(r.lengthM, 0)} ม./${WIRE_DATA_PACK_LABELS[r.pack]}`)}
                </div>
                ${order}
            </div>`;
    } else if (calc.reason === 'invalid_length') {
        resultHTML = '<div class="themed-subcard p-3 text-xs font-semibold" role="alert">ความยาวต้องเป็นตัวเลขมากกว่า 0 หรือเว้นว่างไว้</div>';
    }

    container.innerHTML = `
        <div class="wire-data-tool flex flex-col gap-3 p-1">
            <div class="segment-group grid-cols-2" role="group" aria-label="ชนิดสาย">
                ${typeBtn('thw', 'IEC 01 (THW)')}
                ${typeBtn('vaf', 'VAF 2 แกน')}
            </div>
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <label for="wireDataSize" class="font-semibold text-[var(--app-ink)] block">ขนาดสาย</label>
                <select id="wireDataSize" class="airbnb-input text-xs w-full min-w-0" style="min-height: 44px;">${sizeOptions}</select>
            </div>
            ${conductorChips}
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'ความยาวที่ต้องการสั่ง (ไม่บังคับ)', st.lengthM, 'เมตร', 'เช่น 100')}
            </div>
            ${resultHTML}
            <div class="themed-subcard p-3 text-[11px] text-[var(--app-muted)] space-y-1">
                <div>ข้อมูลจากแค็ตตาล็อก Thai-Yazaki (สาย 60227 IEC 01 THW ตาม มอก.11 เล่ม 3-2553 และสาย VAF ตาม มอก.11 เล่ม 101-2559) น้ำหนักเป็นค่าประมาณ ขนาดมีพิกัดความคลาดเคลื่อน ผู้ผลิตรายอื่นต่างกันเล็กน้อย</div>
                <div>กระแสในอากาศและในท่อเป็นของสายนี้ที่ 40°C ตรงกับตารางใน wire_breaker ยังไม่รวมตัวคูณลดพิกัด ต้องให้ช่างไฟตรวจก่อนติดตั้งจริง</div>
                <div>ถ้าซื้อสายขนาด 50 ตร.มม. ขึ้นไปที่ขายเป็นดรัม ผู้ขายมักตัดขายตามเมตร ให้ตรวจกับร้านก่อน</div>
            </div>
        </div>
    `;

    attachFieldClickListeners(container);

    container.querySelectorAll('[data-wire-data-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            const next = btn.dataset.wireDataType === 'vaf' ? 'vaf' : 'thw';
            if (next === type) return;
            st.type = next;
            // เก็บขนาดเดิมถ้ามีในชนิดใหม่ ไม่งั้นใช้ขนาดแรกที่ใกล้ที่สุดที่มี
            const available = wireDataRows(next).map(r => r.sizeSqmm);
            if (!available.includes(Number(st.size))) {
                const wanted = Number(st.size);
                st.size = String(available.reduce((best, s) => (Math.abs(s - wanted) < Math.abs(best - wanted) ? s : best), available[0]));
            }
            st.conductor = 'stranded';
            persistAppState();
            renderActiveTool();
        });
    });
    const sizeSelect = document.getElementById('wireDataSize');
    if (sizeSelect) {
        sizeSelect.addEventListener('change', () => {
            st.size = sizeSelect.value;
            st.conductor = 'stranded';
            persistAppState();
            renderActiveTool();
        });
    }
    container.querySelectorAll('.wire-data-conductor-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            st.conductor = btn.dataset.wireDataConductor;
            persistAppState();
            renderActiveTool();
        });
    });

    if (calc.valid) {
        const r = calc.row;
        setStatusBanner('success', `สาย ${type === 'vaf' ? 'VAF' : 'IEC 01'} ${formatNum(r.sizeSqmm, 1)} ตร.มม. หนัก <span class="text-lg text-[var(--app-accent)] underline">${formatNum(r.weightKgKm, 0)} กก./กม.</span>${calc.hasLength ? `<span class="text-xs font-normal opacity-80 block mt-1">${formatNum(calc.lengthM, 1)} ม. หนัก ${formatNum(calc.totalWeightKg, 1)} กก. · ${formatNum(calc.packs, 0)} ${WIRE_DATA_PACK_LABELS[r.pack]}</span>` : ''}`);
    } else {
        setStatusBanner('empty', calc.reason === 'invalid_length' ? 'ความยาวต้องเป็นตัวเลขมากกว่า 0' : 'เลือกชนิดและขนาดสาย');
    }
}

(function(root) {
    const exportsObj = {
        WIRE_DATA_THW,
        WIRE_DATA_VAF,
        wireDataRows,
        calculateWireData,
        renderWireDataTool,
        CONDUIT_WIRE_DIAMETERS,
        CONDUIT_SIZES,
        conduitFillLimit,
        conduitAreaMm2,
        conduitWireAreaMm2,
        conduitMaxConductors,
        calculateConduitFill,
        renderConduitFillTool,
        WIRE_VD_LIMIT_PCT,
        WIRE_AMBIENT_FACTORS,
        WIRE_GROUP_FACTORS,
        wireAmbientFactor,
        wireGroupFactor,
        renderWireBreakerTool,
        SHAPE_DEFINITIONS,
        shapeFieldKeys,
        splitRaiNganWa,
        calculateShape,
        renderShapeTool,
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
        AC_CATALOG_ENTRIES,
        acRatedCurrent,
        buildBtuToWireHandoff,
        applyBtuToWireHandoff,
        WIRE_VD_DATA_VERIFIED,
        WIRE_DATA_SOURCE_NOTE,
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
