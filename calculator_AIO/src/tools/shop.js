// ==============================================================
// Multitools Calculator - Shop & General Tools
// (unit_price, discount, tip, unit)
// ==============================================================

// Unit conversion definitions (including Thai Area units: ไร่, งาน, ตารางวา)
const UNIT_CATEGORIES = {
    area: {
        label: 'พื้นที่ (ไร่-งาน-ตร.วา)',
        units: [
            { name: 'ไร่ (Rai)', factor: 1600 },
            { name: 'งาน (Ngan)', factor: 400 },
            { name: 'ตารางวา (Sq.Wa)', factor: 4 },
            { name: 'ตารางเมตร (Sq.m)', factor: 1 },
            { name: 'ตารางฟุต (Sq.ft)', factor: 0.092903 },
            { name: 'เอเคอร์ (Acre)', factor: 4046.856 }
        ]
    },
    length: {
        label: 'ความยาว',
        units: [
            { name: 'กิโลเมตร (km)', factor: 1000 },
            { name: 'เมตร (m)', factor: 1 },
            { name: 'เซนติเมตร (cm)', factor: 0.01 },
            { name: 'มิลลิเมตร (mm)', factor: 0.001 },
            { name: 'นิ้ว (inch)', factor: 0.0254 },
            { name: 'หุน (1/8 นิ้ว)', factor: 0.003175 },
            { name: 'ฟุต (ft)', factor: 0.3048 },
            { name: 'หลา (yd)', factor: 0.9144 },
            { name: 'ไมล์ (mile)', factor: 1609.344 }
        ]
    },
    weight: {
        label: 'น้ำหนัก',
        units: [
            { name: 'กิโลกรัม (kg)', factor: 1 },
            { name: 'กรัม (g)', factor: 0.001 },
            { name: 'ขีด (100g)', factor: 0.1 },
            { name: 'ปอนด์ (lb)', factor: 0.45359237 },
            { name: 'ออนซ์ (oz)', factor: 0.0283495 },
            { name: 'บาททองคำ (15.244g)', factor: 0.015244 }
        ]
    },
    volume: {
        label: 'ปริมาตร',
        units: [
            { name: 'ลิตร (L)', factor: 1 },
            { name: 'มิลลิลิตร (mL / cc)', factor: 0.001 },
            { name: 'แกลลอน (US Gal)', factor: 3.78541 },
            { name: 'ถ้วยตวง (Cup)', factor: 0.24 },
            { name: 'ช้อนโต๊ะ (Tbsp)', factor: 0.015 },
            { name: 'ช้อนชา (Tsp)', factor: 0.005 }
        ]
    },
    temp: {
        label: 'อุณหภูมิ',
        units: [
            { name: 'เซลเซียส (°C)', code: 'C' },
            { name: 'ฟาเรนไฮต์ (°F)', code: 'F' },
            { name: 'เคลวิน (K)', code: 'K' }
        ]
    }
};

/* -----------------------------------------------------------
 * TOOL 11: ราคาต่อหน่วย (Unit Price Comparison A, B, C, D)
 * ----------------------------------------------------------- */
function renderUnitPriceTool(container) {
    const rows = appState.unit_price.rows;
    const isAirbnb = appState.theme === 'airbnb';
    const defs = (typeof UNIT_DEFINITIONS !== 'undefined') ? UNIT_DEFINITIONS : {
        unit: { key: 'unit', label: 'หน่วย', family: 'general', factor: 1,     baseUnit: 'หน่วย' },
        pcs:  { key: 'pcs',  label: 'ชิ้น',  family: 'count',   factor: 1,     baseUnit: 'ชิ้น' },
        doz:  { key: 'doz',  label: 'โหล',  family: 'count',   factor: 12,    baseUnit: 'ชิ้น' },
        g:    { key: 'g',    label: 'g',    family: 'weight',  factor: 0.001, baseUnit: 'กก.' },
        kg:   { key: 'kg',   label: 'kg',   family: 'weight',  factor: 1,     baseUnit: 'กก.' },
        ml:   { key: 'ml',   label: 'ml',   family: 'volume',  factor: 0.001, baseUnit: 'ลิตร' },
        L:    { key: 'L',    label: 'L',    family: 'volume',  factor: 1,     baseUnit: 'ลิตร' }
    };

    container.innerHTML = `<div class="text-xs text-[var(--app-muted)] px-1 pb-1">💡 เคล็ดลับ: พิมพ์ <b>ราคา เว้นวรรค จำนวน</b> ในช่องราคา เช่น <b>864 50</b> ระบบจะแยกช่องให้อัตโนมัติ</div>`;

    function refreshUnitPriceResults() {
        persistAppState();
        let invalidCount = 0;
        container.querySelectorAll('input[data-shared-field]').forEach(input => {
            const fieldIndex = Number(input.dataset.sharedField);
            const value = rows[Math.floor(fieldIndex / 2)][fieldIndex % 2 ? 'qty' : 'price'];
            const number = parseNumericInput(value);
            const invalid = String(value).trim() !== '' && (!Number.isFinite(number) || number <= 0);
            const cellEl = input.closest('.cell-input');
            const error = cellEl ? cellEl.querySelector('.field-error') : null;
            input.setAttribute('aria-invalid', String(invalid));
            if (error) {
                error.hidden = !invalid;
                error.textContent = invalid ? (Number.isFinite(number) ? 'ต้องมากกว่า 0' : 'รูปแบบตัวเลขไม่ถูกต้อง') : '';
            }
            if (invalid) invalidCount++;
        });

        const liveItems = rows.map((r, index) => {
            const price = parseNumericInput(r.price);
            const qty = parseNumericInput(r.qty);
            const uKey = r.unit || 'unit';
            const uDef = defs[uKey] || defs.unit;
            const baseQty = (Number.isFinite(qty) && qty > 0) ? qty * uDef.factor : NaN;
            const normalizedPrice = (Number.isFinite(price) && Number.isFinite(baseQty) && baseQty > 0) ? price / baseQty : NaN;
            return {
                index,
                id: r.id,
                price,
                qty,
                unit: uKey,
                uDef,
                baseQty,
                baseUnit: uDef.baseUnit,
                family: uDef.family,
                normalizedPrice
            };
        }).filter(item => Number.isFinite(item.price) && Number.isFinite(item.qty) && item.price > 0 && item.qty > 0 && Number.isFinite(item.normalizedPrice));

        const distinctFamilies = new Set(liveItems.map(item => item.family));
        const hasMismatchedFamilies = distinctFamilies.size > 1;

        let bestItem = null;
        if (!hasMismatchedFamilies && liveItems.length > 0) {
            bestItem = [...liveItems].sort((a, b) => a.normalizedPrice - b.normalizedPrice)[0];
        }

        const rowNodes = container.querySelectorAll('.comparison-row');
        rows.forEach((r, idx) => {
            const rowNode = rowNodes[idx];
            if (!rowNode) return;
            const outputCell = rowNode.querySelector('.unit-price-output');
            const liveMatch = liveItems.find(item => item.index === idx);

            rowNode.classList.remove('is-cheapest', 'border-[var(--app-accent)]');
            if (!liveMatch) {
                outputCell.innerHTML = `<span class="placeholder-text text-xs">ราคาต่อหน่วย</span>`;
                return;
            }

            const isBest = bestItem && bestItem.id === liveMatch.id && liveItems.length > 1;
            if (isBest) {
                rowNode.classList.add('is-cheapest');
                if (isAirbnb) rowNode.classList.add('border-[var(--app-accent)]');
            }

            const diffBadge = (isBest && liveItems.length > 1)
                ? `<span class="cheapest-badge mt-0.5">ถูกที่สุด</span>`
                : (bestItem && bestItem.id !== liveMatch.id && !hasMismatchedFamilies)
                    ? `<span class="text-[10px] text-[var(--app-muted)] mt-0.5 block">+${formatNum(((liveMatch.normalizedPrice - bestItem.normalizedPrice) / bestItem.normalizedPrice) * 100, 1)}%</span>`
                    : '';

            outputCell.innerHTML = `
                <span class="unit-price-val font-mono font-bold text-sm ${isBest ? 'text-[var(--app-accent)] font-extrabold' : 'text-[#222222]'}">${formatMoney(liveMatch.normalizedPrice)}</span>
                <span class="unit-price-sub text-[10px] text-[#6a6a6a]">฿/${escapeHTML(liveMatch.baseUnit)}</span>
                ${diffBadge}
            `;
        });

        if (invalidCount > 0) {
            setStatusBanner('error', '⚠️ ตรวจพบช่องที่ข้อมูลไม่ถูกต้อง กรุณากรอกตัวเลขที่มากกว่า 0');
        } else if (hasMismatchedFamilies) {
            setStatusBanner('error', '⚠️ หน่วยสินค้าต่างประเภทกัน (เช่น น้ำหนัก vs ปริมาตร) ไม่สามารถเปรียบเทียบข้ามประเภทได้โดยตรง');
        } else if (liveItems.length >= 2 && bestItem) {
            const runnerUp = [...liveItems].filter(i => i.id !== bestItem.id).sort((a, b) => a.normalizedPrice - b.normalizedPrice)[0];
            const savedPct = runnerUp ? ((runnerUp.normalizedPrice - bestItem.normalizedPrice) / runnerUp.normalizedPrice) * 100 : 0;
            const contextText = bestItem.baseUnit !== 'หน่วย' ? ` (${formatMoney(bestItem.normalizedPrice)} บาท/${bestItem.baseUnit})` : '';
            setStatusBanner('success', `⭐ <b>ตัวเลือก ${bestItem.id}</b> คุ้มค่าที่สุด!${contextText} <span class="text-xs font-normal block text-[#4a4a4a] mt-0.5">ประหยัดกว่าตัวเลือก ${runnerUp.id} ถึง <b>${formatNum(savedPct, 1)}%</b></span>`);
        } else if (liveItems.length === 1) {
            setStatusBanner('info', `กรอกราคาและจำนวนของ <b>ตัวเลือกอื่น</b> เพื่อเริ่มการเปรียบเทียบความคุ้มค่า`);
        } else {
            setStatusBanner('empty', 'กรอกราคาและจำนวนเพื่อคำนวณและเปรียบเทียบราคาต่อหน่วย');
        }
    }

    const rowColors = ['border-blue-400', 'border-rose-400', 'border-emerald-400', 'border-amber-400'];

    rows.forEach((r, idx) => {
        const rowEl = document.createElement('div');
        rowEl.className = `comparison-row flex items-center gap-1.5 p-2 bg-white rounded-[var(--app-card-radius)] border border-[var(--app-hairline)] ${rowColors[idx]} border-l-4 transition-all`;
        rowEl.style.boxShadow = 'var(--app-elevation)';

        // Cell 1: Label Badge
        const labelCell = document.createElement('div');
        labelCell.className = 'w-7 h-7 flex items-center justify-center font-bold text-xs rounded-full bg-[#f2f2f2] text-[#222222] shrink-0';
        labelCell.textContent = r.id;

        // Cell 2: Price Input
        const priceCell = document.createElement('div');
        priceCell.className = 'cell-input flex-1 min-w-0';
        const priceFieldIdx = idx * 2;
        const priceIsActive = appState.activeFieldIndex === priceFieldIdx;
        priceCell.innerHTML = `
            <div class="clev-field-box ${priceIsActive ? 'active-field' : ''} !p-1.5" data-field-index="${priceFieldIdx}">
                <span class="field-label text-[10px] text-[#6a6a6a]">ราคา (${r.id})</span>
                <input type="text" inputmode="decimal" data-shared-field="${priceFieldIdx}" value="${escapeHTML(formatInputDisplay(r.price))}" placeholder="0.00" class="field-input font-bold text-sm text-[#222222]">
            </div>
            <p class="field-error text-[10px] text-red-500 mt-0.5" hidden></p>
        `;

        // Cell 3: Quantity + Unit Selection
        const qtyCell = document.createElement('div');
        qtyCell.className = 'cell-input flex-1 min-w-0';
        const qtyFieldIdx = idx * 2 + 1;
        const qtyIsActive = appState.activeFieldIndex === qtyFieldIdx;
        const activeUnit = r.unit || 'unit';
        qtyCell.innerHTML = `
            <div class="clev-field-box ${qtyIsActive ? 'active-field' : ''} !p-1.5" data-field-index="${qtyFieldIdx}">
                <div class="flex items-center justify-between">
                    <span class="field-label text-[10px] text-[#6a6a6a]">จำนวน</span>
                    <select class="unit-select text-[10px] font-semibold bg-transparent text-[var(--app-accent)] border-none outline-none cursor-pointer p-0" data-row-idx="${idx}">
                        ${Object.values(defs).map(u => `<option value="${u.key}" ${u.key === activeUnit ? 'selected' : ''}>${u.label}</option>`).join('')}
                    </select>
                </div>
                <input type="text" inputmode="decimal" data-shared-field="${qtyFieldIdx}" value="${escapeHTML(formatInputDisplay(r.qty))}" placeholder="1" class="field-input font-bold text-sm text-[#222222]">
            </div>
            <p class="field-error text-[10px] text-red-500 mt-0.5" hidden></p>
        `;

        // Interactivity
        const priceBox = priceCell.querySelector('[data-field-index]');
        const priceInput = priceCell.querySelector('input');
        const qtyBox = qtyCell.querySelector('[data-field-index]');
        const qtyInput = qtyCell.querySelector('input');
        const unitSelect = qtyCell.querySelector('.unit-select');

        priceBox.addEventListener('click', (e) => {
            if (e.target !== priceInput) priceInput.focus();
            setActiveNumericField(priceFieldIdx);
        });
        qtyBox.addEventListener('click', (e) => {
            if (e.target !== qtyInput && e.target !== unitSelect) qtyInput.focus();
            setActiveNumericField(qtyFieldIdx);
        });

        priceInput.addEventListener('focus', () => setActiveNumericField(priceFieldIdx));
        qtyInput.addEventListener('focus', () => setActiveNumericField(qtyFieldIdx));

        priceInput.addEventListener('input', (e) => {
            const rawVal = e.target.value;
            // Smart input space separation: typing "864 50" automatically splits into Price=864 and Qty=50
            if (/\s+/.test(rawVal)) {
                const parts = rawVal.trim().split(/\s+/);
                if (parts.length >= 2) {
                    r.price = parts[0];
                    r.qty = parts[1];
                    priceInput.value = formatInputDisplay(parts[0]);
                    qtyInput.value = formatInputDisplay(parts[1]);
                    refreshUnitPriceResults();
                    qtyInput.focus();
                    return;
                }
            }
            r.price = rawVal;
            refreshUnitPriceResults();
        });

        priceInput.addEventListener('blur', () => {
            const formatted = formatInputDisplay(r.price);
            r.price = formatted;
            priceInput.value = formatted;
            refreshUnitPriceResults();
        });

        qtyInput.addEventListener('input', (e) => {
            r.qty = e.target.value;
            refreshUnitPriceResults();
        });

        qtyInput.addEventListener('blur', () => {
            const formatted = formatInputDisplay(r.qty);
            r.qty = formatted;
            qtyInput.value = formatted;
            refreshUnitPriceResults();
        });

        unitSelect.addEventListener('change', (e) => {
            r.unit = e.target.value;
            refreshUnitPriceResults();
        });

        // Cell 4: Unit Price Output
        const unitCell = document.createElement('div');
        unitCell.className = 'cell unit-price-output';
        unitCell.innerHTML = `<span class="placeholder-text text-xs">ราคาต่อหน่วย</span>`;

        rowEl.appendChild(labelCell);
        rowEl.appendChild(priceCell);
        rowEl.appendChild(qtyCell);
        rowEl.appendChild(unitCell);
        container.appendChild(rowEl);
    });

    refreshUnitPriceResults();
}

/* -----------------------------------------------------------
 * TOOL 4: ส่วนลด (Discount Calculator)
 * ----------------------------------------------------------- */
function renderDiscountTool(container) {
    const st = appState.discount;
    const p = numberOrDefault(st.price, 0);
    const d1 = numberOrDefault(st.discountPct, 0);
    const d2 = numberOrDefault(st.extraPct, 0);
    const isOver100 = d1 > 100 || d2 > 100;
    const safeD1 = Math.min(Math.max(d1, 0), 100);
    const safeD2 = Math.min(Math.max(d2, 0), 100);

    const afterFirst = p * (1 - safeD1 / 100);
    const finalPrice = afterFirst * (1 - safeD2 / 100);
    const saved = p - finalPrice;

    container.innerHTML = `
        <div class="flex flex-col gap-1.5">
            ${createKeypadFieldHTML(0, 'ราคาปกติ', st.price, 'บาท', 'ราคาเต็ม')}
            ${createKeypadFieldHTML(1, 'ส่วนลดหลัก (%)', st.discountPct, '%', 'เช่น 20')}
            ${createKeypadFieldHTML(2, 'ส่วนลดเพิ่ม On-Top (%)', st.extraPct, '%', 'ถ้ามี เช่น 10')}

            <div class="flex gap-1.5 pt-0.5">
                ${[10, 15, 20, 25, 30, 50, 70].map(pct => `
                    <button class="quick-disc flex-1 bg-white border border-[var(--app-hairline)] rounded-full py-1 text-xs font-semibold text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] transition" data-pct="${pct}">-${pct}%</button>
                `).join('')}
            </div>
        </div>
    `;

    attachFieldClickListeners(container);
    container.querySelectorAll('.quick-disc').forEach(btn => {
        btn.addEventListener('click', () => {
            st.discountPct = btn.getAttribute('data-pct');
            renderActiveTool();
        });
    });

    if (p <= 0) {
        setStatusBanner('empty', 'กรุณาป้อนราคาสินค้าและเปอร์เซ็นต์ส่วนลด');
    } else if (isOver100) {
        setStatusBanner('error', `⚠️ ส่วนลดไม่ควรเกิน 100% (คำนวณสูงสุดที่ 100%) | ราคาสุทธิ: ${formatMoney(finalPrice)} บาท`);
    } else {
        setStatusBanner('success', `🏷️ ราคาสุทธิ: <span class="text-lg text-[var(--app-accent)] underline">${formatMoney(finalPrice)} บาท</span><span class="text-xs font-medium block text-[#3f3f3f]">ประหยัดไป ${formatMoney(saved)} บาท</span>`);
    }
}

/* -----------------------------------------------------------
 * TOOL 9: ทิป (Tip & Split Bill Calculator)
 * ----------------------------------------------------------- */
function renderTipTool(container) {
    const st = appState.tip;
    const bill = numberOrDefault(st.bill, 0);
    const tipPct = numberOrDefault(st.tipPct, 0);
    const people = Math.max(1, integerOrDefault(st.people, 1));

    const tipAmt = bill * (tipPct / 100);
    const totalBill = bill + tipAmt;
    const perPerson = totalBill / people;

    container.innerHTML = `
        <div class="flex flex-col gap-1.5">
            ${createKeypadFieldHTML(0, 'ยอดค่าอาหาร / บริการ', st.bill, 'บาท', 'ป้อนยอดบิล')}
            ${createKeypadFieldHTML(1, 'เปอร์เซ็นต์ทิป (%)', st.tipPct, '%', '10')}
            ${createKeypadFieldHTML(2, 'จำนวนคนหาร', st.people, 'คน', '1')}
        </div>
    `;

    attachFieldClickListeners(container);

    if (bill <= 0) {
        setStatusBanner('empty', 'กรุณาป้อนยอดค่าอาหารเพื่อคำนวณทิปและหารจำนวนคน');
    } else {
        setStatusBanner('success', `🍽️ ยอดรวมสุทธิ: <b>${formatMoney(totalBill)} ฿</b> (ทิป ${formatMoney(tipAmt)} ฿)<span class="text-sm font-bold block underline text-[var(--app-accent)]">หารเฉลี่ยคนละ: ${formatMoney(perPerson)} บาท (${people} คน)</span>`);
    }
}

/* -----------------------------------------------------------
 * TOOL 3: หน่วย (Unit Converter including Rai-Ngan-Sq.Wa)
 * ----------------------------------------------------------- */
function renderUnitConverterTool(container) {
    const st = appState.unit;
    const catObj = UNIT_CATEGORIES[st.cat];
    if (st.fromIdx >= catObj.units.length) st.fromIdx = 0;
    if (st.targetIdx >= catObj.units.length || st.targetIdx === st.fromIdx || st.targetIdx === undefined) st.targetIdx = catObj.units.length > 1 ? (st.fromIdx === 0 ? 1 : 0) : 0;

    const inputVal = numberOrDefault(st.val, 0);
    const fromUnit = catObj.units[st.fromIdx];
    const targetUnit = catObj.units[st.targetIdx];

    function convertValue(value, source, target) {
        if (st.cat === 'temp') {
            let celsius = value;
            if (source.code === 'F') celsius = (value - 32) * 5 / 9;
            if (source.code === 'K') celsius = value - 273.15;
            if (target.code === 'C') return celsius;
            if (target.code === 'F') return (celsius * 9 / 5) + 32;
            return celsius + 273.15;
        }
        return (value * source.factor) / target.factor;
    }

    // Show only units that are useful for the current conversion.
    // The list is selected from the current value and both selected units,
    // so it does not fall back to a fixed km/m/cm set.
    const relatedIndices = new Set([st.fromIdx, st.targetIdx]);
    const rankedUnits = catObj.units
        .map((unit, index) => {
            const converted = Math.abs(convertValue(inputVal, fromUnit, unit));
            const scale = converted > 0 ? Math.abs(Math.log10(converted) - 1) : Math.abs(Math.log10(Math.max(unit.factor || 1, 1e-12) / Math.max(fromUnit.factor || 1, 1e-12)));
            return { index, scale };
        })
        .sort((a, b) => a.scale - b.scale);
    rankedUnits.slice(0, Math.min(6, rankedUnits.length)).forEach(item => relatedIndices.add(item.index));

    const resultsHTML = [...relatedIndices].sort((a, b) => a - b).map(idx => {
        const u = catObj.units[idx];
        let res = 0;
        res = convertValue(inputVal, fromUnit, u);
        const isSelected = idx === st.fromIdx;
        const isTarget = idx === st.targetIdx;
        return `
            <div class="flex justify-between items-center py-1.5 px-3 border-b border-[#ebebeb] last:border-none ${isSelected ? 'bg-[var(--app-accent-soft)] font-bold text-[var(--app-accent)]' : ''} ${isTarget ? 'ring-1 ring-inset ring-[var(--app-accent)]' : ''}">
                <span class="text-xs text-[#222222]">${u.name}</span>
                <span class="text-sm font-mono">${formatNum(res, 4)}</span>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="flex flex-col gap-1.5">
            <div class="grid grid-cols-3 gap-1.5">
                <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-btn-radius)] p-1.5">
                    <label class="text-[10px] text-[#6a6a6a] block">หมวดหมู่หน่วย</label>
                    <select id="unitCatSel" class="w-full font-semibold text-xs bg-transparent outline-none text-[#222222]">
                        ${Object.entries(UNIT_CATEGORIES).map(([k, v]) => `<option value="${k}" ${st.cat === k ? 'selected' : ''}>${v.label}</option>`).join('')}
                    </select>
                </div>
                <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-btn-radius)] p-1.5">
                    <label class="text-[10px] text-[#6a6a6a] block">หน่วยตั้งต้น</label>
                    <select id="unitFromSel" class="w-full font-semibold text-xs bg-transparent outline-none text-[#222222]">
                        ${catObj.units.map((u, i) => `<option value="${i}" ${st.fromIdx === i ? 'selected' : ''}>${u.name}</option>`).join('')}
                    </select>
                </div>
                <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-btn-radius)] p-1.5">
                    <label class="text-[10px] text-[#6a6a6a] block">หน่วยปลายทาง</label>
                    <select id="unitToSel" class="w-full font-semibold text-xs bg-transparent outline-none text-[#222222]">
                        ${catObj.units.map((u, i) => `<option value="${i}" ${st.targetIdx === i ? 'selected' : ''}>${u.name}</option>`).join('')}
                    </select>
                </div>
            </div>

            ${createKeypadFieldHTML(0, `ค่าที่ต้องการแปลง`, st.val, fromUnit.name.split(' ')[0], 'ป้อนตัวเลข')}

            <div class="bg-white border-2 border-[var(--app-accent)] rounded-[var(--app-btn-radius)] p-3 flex justify-between items-center">
                <span class="text-xs font-semibold">ผลลัพธ์ปลายทาง<br><span class="font-normal text-[#6a6a6a]">${targetUnit.name}</span></span>
                <span class="text-xl font-bold text-[var(--app-accent)]">${formatNum(convertValue(inputVal, fromUnit, targetUnit), 6)}</span>
            </div>

            <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-btn-radius)] overflow-y-auto max-h-[180px] thin-scroll">
                ${resultsHTML}
            </div>
        </div>
    `;

    attachFieldClickListeners(container);

    document.getElementById('unitCatSel').addEventListener('change', (e) => {
        st.cat = e.target.value;
        st.fromIdx = 0;
        st.targetIdx = 1;
        renderActiveTool();
    });
    document.getElementById('unitFromSel').addEventListener('change', (e) => {
        st.fromIdx = parseInt(e.target.value, 10);
        if (st.targetIdx === st.fromIdx) st.targetIdx = st.fromIdx === 0 ? 1 : 0;
        renderActiveTool();
    });
    document.getElementById('unitToSel').addEventListener('change', (e) => {
        st.targetIdx = parseInt(e.target.value, 10);
        renderActiveTool();
    });

    if (st.cat === 'area' && inputVal > 0) {
        const totalSqm = inputVal * fromUnit.factor;
        const rai = Math.floor(totalSqm / 1600);
        const remAfterRai = totalSqm % 1600;
        const ngan = Math.floor(remAfterRai / 400);
        const sqWa = (remAfterRai % 400) / 4;
        setStatusBanner('success', `📐 เท่ากับ <b>${rai} ไร่ ${ngan} งาน ${formatNum(sqWa, 2)} ตารางวา</b> (${formatNum(totalSqm, 2)} ตร.ม.)`);
    } else {
        setStatusBanner('info', `แปลงค่าจาก <b>${formatNum(inputVal, 4)} ${fromUnit.name}</b>`);
    }
}

(function(root) {
    const exportsObj = {
        UNIT_CATEGORIES,
        renderUnitPriceTool,
        renderDiscountTool,
        renderTipTool,
        renderUnitConverterTool
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
