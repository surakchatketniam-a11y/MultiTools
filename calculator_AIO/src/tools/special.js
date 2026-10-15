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
                <button class="segment-btn gender-btn ${st.gender === 'male' ? 'active' : ''}" data-g="male">♂ ชาย (Male)</button>
                <button class="segment-btn gender-btn ${st.gender === 'female' ? 'active' : ''}" data-g="female">♀ หญิง (Female)</button>
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
        setStatusBanner('success', `🏃 BMI: <b class="text-[var(--app-accent)] underline">${formatNum(bmi, 1)}</b> (${bmiCategory})<span class="text-xs font-medium block text-[#3f3f3f]">พลังงานพื้นฐาน (BMR): ${Math.round(bmr).toLocaleString()} kcal/วัน · พลังงานที่ใช้ต่อวัน (TDEE): <b>${Math.round(tdee).toLocaleString()} kcal/วัน</b></span>`);
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
                    <span class="text-xs font-semibold text-[#222222]">🌸 วันตกไข่โดยประมาณ</span>
                    <span class="text-sm font-bold text-[var(--app-accent)]">${formatThaiDate(toISO(ovulationDate))}</span>
                </div>
                <div class="flex justify-between items-center border-b border-[#ebebeb] pb-2.5">
                    <span class="text-xs font-semibold text-[#222222]">💕 ช่วงเวลาเจริญพันธุ์</span>
                    <span class="text-xs font-bold text-[var(--app-accent)]">${formatThaiDate(toISO(fertileStart))} - ${formatThaiDate(toISO(fertileEnd))}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs font-semibold text-[#6a6a6a]">📅 ประจำเดือนรอบถัดไป</span>
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
 * TOOL 7: ค่าใช้จ่ายเชื้อเพลิง (Fuel Cost Calculator)
 * ----------------------------------------------------------- */
function renderFuelCostTool(container) {
    const st = appState.fuel_cost;
    const dist = numberOrDefault(st.distance, 0);
    const eff = numberOrDefault(st.efficiency, 0);
    const price = numberOrDefault(st.oilPrice, 0);

    const litersNeeded = eff > 0 ? dist / eff : 0;
    const totalCost = litersNeeded * price;
    const costPerKm = dist > 0 ? totalCost / dist : 0;

    container.innerHTML = `
        <div class="flex flex-col gap-1.5">
            ${createKeypadFieldHTML(0, 'ระยะทางที่เดินทาง', st.distance, 'กม.', 'ป้อนระยะทาง')}
            ${createKeypadFieldHTML(1, 'อัตราสิ้นเปลืองเชื้อเพลิง', st.efficiency, 'กม./ลิตร', 'เช่น 15')}
            ${createKeypadFieldHTML(2, 'ราคาน้ำมันต่อลิตร', st.oilPrice, 'บาท/ลิตร', 'เช่น 35.50')}
        </div>
    `;

    attachFieldClickListeners(container);

    if (dist <= 0 || eff <= 0) {
        setStatusBanner('empty', 'ป้อนระยะทางและอัตราสิ้นเปลืองเพื่อคำนวณค่าน้ำมัน');
    } else {
        setStatusBanner('success', `⛽ ค่าน้ำมันรวม: <span class="text-lg text-[var(--app-accent)] underline">${formatMoney(totalCost)} บาท</span><span class="text-xs font-medium block text-[#3f3f3f]">ใช้น้ำมัน ${formatNum(litersNeeded, 2)} ลิตร (เฉลี่ย ${formatNum(costPerKm, 2)} บาท/กม.)</span>`);
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
        setStatusBanner('success', `🚗 อัตราสิ้นเปลือง: <span class="text-lg text-[var(--app-accent)] underline">${formatNum(kmPerLiter, 2)} กม./ลิตร</span><span class="text-xs font-medium block text-[#3f3f3f]">หรือคิดเป็น ${formatNum(literPer100Km, 2)} ลิตร ต่อ 100 กม.</span>`);
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
        <div class="flex flex-col h-full gap-2">
            <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3.5 flex flex-col justify-between min-h-[125px]" style="box-shadow: var(--app-elevation);">
                <div class="text-xs text-[#6a6a6a] flex justify-between items-center border-b border-[#ebebeb] pb-1.5">
                    <span>ล่าสุด: ${st.history[0] ? `${formatCalcExpr(st.history[0].expr)} = ${st.history[0].res}` : '-'}</span>
                    <button id="clearCalcHistBtn" class="text-[var(--app-accent)] font-semibold hover:underline">ล้างประวัติ</button>
                </div>
                <div class="text-right text-[#6a6a6a] text-lg font-mono break-all min-h-[28px] mt-1">${formatCalcExpr(st.expr) || '0'}</div>
                <div class="text-right text-3xl font-bold text-[#222222] font-mono truncate">= ${st.result}</div>
            </div>

            <div class="grid grid-cols-4 grid-rows-5 gap-2 flex-1">
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
}

(function(root) {
    const exportsObj = {
        renderHealthTool,
        renderOvulationTool,
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
