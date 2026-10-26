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

            container.innerHTML = `<div class="text-xs text-[var(--app-muted)] px-1 pb-1">เคล็ดลับ: พิมพ์ <b>ราคา เว้นวรรค จำนวน</b> ในช่องราคา เช่น <b>864 50</b> ระบบจะแยกช่องให้อัตโนมัติ</div>`;

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

                const liveMin = (liveItems.length && !hasMismatchedFamilies) ? Math.min(...liveItems.map(item => item.normalizedPrice)) : Infinity;
                const liveBest = (liveItems.length && !hasMismatchedFamilies)
                    ? liveItems.filter(item => Math.abs(item.normalizedPrice - liveMin) < 1e-7).map(item => item.index)
                    : [];

                container.querySelectorAll('.unit-price-output').forEach((cell, index) => {
                    const item = liveItems.find(entry => entry.index === index);
                    const isBest = liveBest.includes(index) && liveItems.length >= 2 && !hasMismatchedFamilies;
                    const calcRow = cell.closest('.calc-row');
                    calcRow.classList.toggle('cheapest-row', isBest);
                    calcRow.querySelector('.cell-label span').textContent = `${rows[index].id}${isBest ? ' ★' : ''}`;
                    if (item) {
                        const highlightClass = isBest
                            ? (isAirbnb ? 'text-[var(--app-accent)] font-bold' : appState.theme === 'together' ? 'text-[var(--app-accent)] font-bold' : 'text-green-700 font-bold')
                            : 'text-[var(--app-ink)] font-semibold';
                        const unitLabelClass = isBest
                            ? (isAirbnb ? 'text-[var(--app-accent)]' : appState.theme === 'together' ? 'text-[var(--app-accent)]' : 'text-green-700')
                            : 'text-[var(--app-muted)]';
                        cell.innerHTML = `<div class="flex flex-col items-center justify-center leading-tight py-0.5"><span class="text-[1.02rem] ${highlightClass}">${formatUnitPrice(item.normalizedPrice)}</span><span class="text-[10px] ${unitLabelClass} font-medium">บาท/${item.baseUnit}</span></div>`;
                    } else {
                        cell.innerHTML = `<span class="placeholder-text text-xs">ราคาต่อหน่วย</span>`;
                    }
                });

                if (invalidCount) {
                    setStatusBanner('error', 'กรุณาแก้ช่องที่มีข้อผิดพลาดก่อนเปรียบเทียบราคา');
                } else if (!liveItems.length) {
                    setStatusBanner('empty', 'กรุณาป้อนข้อมูลของคุณ');
                } else if (hasMismatchedFamilies) {
                    setStatusBanner('error', 'ชนิดหน่วยไม่ตรงกัน (กรุณาเลือกหน่วยกลุ่มเดียวกัน เช่น กรัม กับ กิโลกรัม)');
                } else if (liveItems.length === 1) {
                    setStatusBanner('info', `ตัวเลือก <b>${liveItems[0].id}</b>: ${formatUnitPrice(liveItems[0].normalizedPrice)} บาท/${liveItems[0].baseUnit} <span class="text-xs font-normal text-[var(--app-muted)] block">ป้อนแถวอื่นเพิ่มเพื่อเปรียบเทียบความคุ้มค่า</span>`);
                } else {
                    const best = liveItems.find(item => Math.abs(item.normalizedPrice - liveMin) < 1e-7);
                    const bestLabels = liveItems.filter(item => Math.abs(item.normalizedPrice - liveMin) < 1e-7).map(item => item.id).join(', ');
                    const next = [...liveItems].sort((a, b) => a.normalizedPrice - b.normalizedPrice).find(item => item.normalizedPrice > liveMin + 1e-7);
                    if (next) {
                        const pct = (((next.normalizedPrice - best.normalizedPrice) / next.normalizedPrice) * 100).toFixed(1);
                        const diff = next.normalizedPrice - best.normalizedPrice;
                        setStatusBanner('success', `<span class="text-[var(--app-accent)]">★ ตัวเลือก ${bestLabels} คุ้มที่สุด</span> (${formatUnitPrice(best.normalizedPrice)} บาท/${best.baseUnit})<span class="text-xs font-medium block text-[var(--app-body)]">ถูกกว่าตัวเลือก ${next.id} ${pct}% หรือประหยัด ${formatUnitPrice(diff)} บาท/${best.baseUnit}</span>`);
                    } else {
                        setStatusBanner('success', `ตัวเลือก <b>${bestLabels}</b> ราคาต่อหน่วยเท่ากัน (${formatUnitPrice(liveMin)} บาท/${best.baseUnit})`);
                    }
                }
            }

            rows.forEach((row, rIdx) => {
                const priceFieldIdx = rIdx * 2;
                const qtyFieldIdx = rIdx * 2 + 1;
                const isPriceActive = appState.activeFieldIndex === priceFieldIdx;
                const isQtyActive = appState.activeFieldIndex === qtyFieldIdx;
                const rowUnit = row.unit || 'unit';

                const rowEl = document.createElement('div');
                rowEl.className = 'calc-row';

                // Cell 1: Label A, B, C, D
                const labelCell = document.createElement('div');
                labelCell.className = 'cell cell-label';
                labelCell.innerHTML = `<span>${row.id}</span>`;

                // Cell 2: Price
                const priceCell = document.createElement('div');
                priceCell.dataset.fieldIndex = priceFieldIdx;
                priceCell.className = `cell cell-input flex-col ${isPriceActive ? 'active-cell' : ''}`;
                // Touch devices use the in-app keypad only; PC keeps free text so "864 50" can be typed.
                const priceInputMode = window.matchMedia('(pointer: coarse)').matches ? 'none' : 'text';
                priceCell.innerHTML = `<input id="numeric-field-${priceFieldIdx}" data-shared-field="${priceFieldIdx}" class="unit-quick-input unit-price-input" type="text" inputmode="${priceInputMode}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="ราคา ${row.id}" placeholder="ราคา" value="${escapeHTML(formatInputDisplay(row.price))}" aria-describedby="numeric-error-${priceFieldIdx}"><span id="numeric-error-${priceFieldIdx}" class="field-error text-[10px]" role="alert" hidden></span>`;
                const quickInput = priceCell.querySelector('.unit-quick-input');
                let quickPairActive = false;
                quickInput.addEventListener('click', (event) => event.stopPropagation());
                quickInput.addEventListener('focus', () => setActiveNumericField(priceFieldIdx));
                quickInput.addEventListener('input', (event) => {
                    const raw = event.target.value;
                    const pair = normalizeThaiDigits(raw).match(/^([\d,.]+)\s+([\d,.]*)$/);
                    if (pair && Number.isFinite(parseNumericInput(pair[1])) && (pair[2] === '' || Number.isFinite(parseNumericInput(pair[2])))) {
                        quickPairActive = true;
                        row.price = pair[1];
                        row.qty = pair[2];
                        qtyInput.value = row.qty;
                        refreshUnitPriceResults();
                    } else {
                        row.price = raw;
                        if (quickPairActive) {
                            row.qty = '';
                            qtyInput.value = '';
                            quickPairActive = false;
                        }
                        refreshUnitPriceResults();
                    }
                });
                const finishQuickInput = () => {
                    const pair = normalizeThaiDigits(quickInput.value).trim().match(/^([\d,.]+)\s+([\d,.]+)$/);
                    if (pair && Number.isFinite(parseNumericInput(pair[1].replace(/,/g, ''))) && Number.isFinite(parseNumericInput(pair[2].replace(/,/g, '')))) {
                        row.price = pair[1];
                        row.qty = pair[2];
                    }
                    const cleanP = String(row.price ?? '').replace(/,/g, '');
                    const cleanQ = String(row.qty ?? '').replace(/,/g, '');
                    if (Number.isFinite(parseNumericInput(cleanP))) row.price = formatInputDisplay(row.price);
                    if (Number.isFinite(parseNumericInput(cleanQ))) row.qty = formatInputDisplay(row.qty);
                    quickInput.value = row.price;
                    qtyInput.value = row.qty;
                    quickPairActive = false;
                    refreshUnitPriceResults();
                };
                quickInput.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        finishQuickInput();
                        quickInput.blur();
                    } else if (event.key === 'Tab') {
                        finishQuickInput();
                    }
                });
                quickInput.addEventListener('blur', finishQuickInput);
                priceCell.addEventListener('click', () => {
                    appState.activeFieldIndex = priceFieldIdx;
                    quickInput.focus();
                });

                // Cell 3: Quantity & Unit
                const qtyCell = document.createElement('div');
                qtyCell.dataset.fieldIndex = qtyFieldIdx;
                qtyCell.className = `cell cell-input !p-0 flex-col ${isQtyActive ? 'active-cell' : ''}`;
                // Touch devices use the in-app keypad only; PC keeps the native keyboard.
                const qtyInputMode = window.matchMedia('(pointer: coarse)').matches ? 'none' : 'decimal';
                qtyCell.innerHTML = `
                    <div class="flex items-center w-full h-full relative">
                        <input id="numeric-field-${qtyFieldIdx}" data-shared-field="${qtyFieldIdx}" class="unit-quick-input unit-qty-input min-w-0 flex-1 h-full px-1.5 text-center bg-transparent focus:outline-none" type="text" inputmode="${qtyInputMode}" autocomplete="off" spellcheck="false" aria-label="จำนวน ${row.id}" placeholder="จำนวน" value="${escapeHTML(formatInputDisplay(row.qty))}" aria-describedby="numeric-error-${qtyFieldIdx}">
                        <select class="unit-select" aria-label="หน่วย ${row.id}">
                            <option value="unit"${rowUnit === 'unit' ? ' selected' : ''}>หน่วย</option>
                            <optgroup label="นับชิ้น">
                                <option value="pcs"${rowUnit === 'pcs' ? ' selected' : ''}>ชิ้น</option>
                                <option value="doz"${rowUnit === 'doz' ? ' selected' : ''}>โหล</option>
                            </optgroup>
                            <optgroup label="น้ำหนัก">
                                <option value="g"${rowUnit === 'g' ? ' selected' : ''}>g</option>
                                <option value="kg"${rowUnit === 'kg' ? ' selected' : ''}>kg</option>
                            </optgroup>
                            <optgroup label="ปริมาตร">
                                <option value="ml"${rowUnit === 'ml' ? ' selected' : ''}>ml</option>
                                <option value="L"${rowUnit === 'L' ? ' selected' : ''}>L</option>
                            </optgroup>
                        </select>
                    </div>
                    <span id="numeric-error-${qtyFieldIdx}" class="field-error text-[10px]" role="alert" hidden></span>
                `;
                const qtyInput = qtyCell.querySelector('.unit-qty-input');
                const unitSelect = qtyCell.querySelector('.unit-select');

                unitSelect.addEventListener('click', (event) => event.stopPropagation());
                unitSelect.addEventListener('change', (event) => {
                    row.unit = event.target.value;
                    refreshUnitPriceResults();
                });

                qtyInput.addEventListener('focus', () => setActiveNumericField(qtyFieldIdx));
                qtyInput.addEventListener('input', () => { row.qty = qtyInput.value; refreshUnitPriceResults(); });
                qtyInput.addEventListener('blur', () => {
                    const cleanQ = String(row.qty ?? '').replace(/,/g, '');
                    if (Number.isFinite(parseNumericInput(cleanQ))) {
                        row.qty = formatInputDisplay(row.qty);
                        qtyInput.value = row.qty;
                        refreshUnitPriceResults();
                    }
                });
                qtyInput.addEventListener('keydown', event => {
                    if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); qtyInput.blur(); }
                });
                qtyCell.addEventListener('click', () => qtyInput.focus());

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
                    <button class="quick-disc flex-1 bg-[var(--color-canvas)] border border-[var(--app-hairline)] rounded-full py-1 text-xs font-semibold text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] transition" data-pct="${pct}">-${pct}%</button>
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
        setStatusBanner('error', `ส่วนลดไม่ควรเกิน 100% (คำนวณสูงสุดที่ 100%) | ราคาสุทธิ: ${formatMoney(finalPrice)} บาท`);
    } else {
        setStatusBanner('success', `ราคาสุทธิ: <span class="text-lg text-[var(--app-accent)] underline">${formatMoney(finalPrice)} บาท</span><span class="text-xs font-medium block text-[var(--app-body)]">ประหยัดไป ${formatMoney(saved)} บาท</span>`);
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
        setStatusBanner('success', `ยอดรวมสุทธิ: <b>${formatMoney(totalBill)} ฿</b> (ทิป ${formatMoney(tipAmt)} ฿)<span class="text-sm font-bold block underline text-[var(--app-accent)]">หารเฉลี่ยคนละ: ${formatMoney(perPerson)} บาท (${people} คน)</span>`);
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
            <div class="flex justify-between items-center py-1.5 px-3 border-b border-[var(--app-hairline)] last:border-none ${isSelected ? 'bg-[var(--app-accent-soft)] font-bold text-[var(--app-accent)]' : ''} ${isTarget ? 'ring-1 ring-inset ring-[var(--app-accent)]' : ''}">
                <span class="text-xs text-[var(--app-ink)]">${u.name}</span>
                <span class="text-sm font-mono">${formatNum(res, 4)}</span>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="flex flex-col gap-1.5">
            <div class="grid grid-cols-3 gap-1.5">
                <div class="themed-subcard p-1.5">
                    <label class="text-[10px] text-[var(--app-muted)] block">หมวดหมู่หน่วย</label>
                    <select id="unitCatSel" class="w-full font-semibold text-xs bg-transparent outline-none text-[var(--app-ink)]">
                        ${Object.entries(UNIT_CATEGORIES).map(([k, v]) => `<option value="${k}" ${st.cat === k ? 'selected' : ''}>${v.label}</option>`).join('')}
                    </select>
                </div>
                <div class="themed-subcard p-1.5">
                    <label class="text-[10px] text-[var(--app-muted)] block">หน่วยตั้งต้น</label>
                    <select id="unitFromSel" class="w-full font-semibold text-xs bg-transparent outline-none text-[var(--app-ink)]">
                        ${catObj.units.map((u, i) => `<option value="${i}" ${st.fromIdx === i ? 'selected' : ''}>${u.name}</option>`).join('')}
                    </select>
                </div>
                <div class="themed-subcard p-1.5">
                    <label class="text-[10px] text-[var(--app-muted)] block">หน่วยปลายทาง</label>
                    <select id="unitToSel" class="w-full font-semibold text-xs bg-transparent outline-none text-[var(--app-ink)]">
                        ${catObj.units.map((u, i) => `<option value="${i}" ${st.targetIdx === i ? 'selected' : ''}>${u.name}</option>`).join('')}
                    </select>
                </div>
            </div>

            ${createKeypadFieldHTML(0, `ค่าที่ต้องการแปลง`, st.val, fromUnit.name.split(' ')[0], 'ป้อนตัวเลข')}

            <div class="bg-[var(--color-canvas)] border-2 border-[var(--app-accent)] rounded-[var(--app-btn-radius)] p-3 flex justify-between items-center">
                <span class="text-xs font-semibold">ผลลัพธ์ปลายทาง<br><span class="font-normal text-[var(--app-muted)]">${targetUnit.name}</span></span>
                <span class="text-xl font-bold text-[var(--app-accent)]">${formatNum(convertValue(inputVal, fromUnit, targetUnit), 6)}</span>
            </div>

            <div class="themed-subcard overflow-y-auto max-h-[180px] thin-scroll">
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
        setStatusBanner('success', `เท่ากับ <b>${rai} ไร่ ${ngan} งาน ${formatNum(sqWa, 2)} ตารางวา</b> (${formatNum(totalSqm, 2)} ตร.ม.)`);
    } else {
        setStatusBanner('info', `แปลงค่าจาก <b>${formatNum(inputVal, 4)} ${fromUnit.name}</b>`);
    }
}

/* -----------------------------------------------------------
 * PURE ENGINE: คำนวณวัสดุก่อสร้าง & ปรับปรุงบ้าน (Construction Materials)
 * ----------------------------------------------------------- */
function calculateConstructionMaterials(params = {}) {
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
    const round2 = (v) => Math.round(v * 100) / 100;
    const ceil = Math.ceil;

    const tab = params.tab || 'tiles'; // 'tiles' | 'paint' | 'concrete'

    // 1. TILES
    if (tab === 'tiles') {
        const widthM = Math.max(0, toNum(params.tileWidth, 0));
        const lengthM = Math.max(0, toNum(params.tileLength, 0));
        const areaSqm = round2(widthM * lengthM);

        const sizePreset = params.tileSizePreset || '60x60';
        let tileWidthCm = 60, tileLengthCm = 60, piecesPerBox = 4;
        if (sizePreset === '30x30') {
            tileWidthCm = 30; tileLengthCm = 30; piecesPerBox = 11;
        } else if (sizePreset === '40x40') {
            tileWidthCm = 40; tileLengthCm = 40; piecesPerBox = 6;
        } else if (sizePreset === '60x60') {
            tileWidthCm = 60; tileLengthCm = 60; piecesPerBox = 4;
        } else if (sizePreset === '60x120') {
            tileWidthCm = 60; tileLengthCm = 120; piecesPerBox = 2;
        } else if (sizePreset === 'custom') {
            tileWidthCm = Math.max(1, toNum(params.tileCustomWidthCm, 60));
            tileLengthCm = Math.max(1, toNum(params.tileCustomLengthCm, 60));
            piecesPerBox = Math.max(1, Math.round(toNum(params.tileCustomPcsPerBox, 4)));
        }

        const tileAreaSqm = (tileWidthCm / 100) * (tileLengthCm / 100);
        const boxCoverageSqm = tileAreaSqm * piecesPerBox;

        const wastagePct = Math.max(0, toNum(params.tileWastagePct, 10));
        const grossAreaSqm = round2(areaSqm * (1 + (wastagePct / 100)));

        const netPieces = tileAreaSqm > 0 ? (areaSqm / tileAreaSqm) : 0;
        const grossPieces = tileAreaSqm > 0 ? ceil(grossAreaSqm / tileAreaSqm) : 0;

        const boxesNeeded = boxCoverageSqm > 0 ? ceil(grossAreaSqm / boxCoverageSqm) : 0;
        const totalPurchasedPieces = boxesNeeded * piecesPerBox;

        // Adhesive: 20kg bag covers ~4.5 sqm
        const adhesiveBags = grossAreaSqm > 0 ? ceil(grossAreaSqm / 4.5) : 0;
        // Grout: 1kg bag covers ~3.5 sqm
        const groutBags = grossAreaSqm > 0 ? ceil(grossAreaSqm / 3.5) : 0;

        const pricePerBox = Math.max(0, toNum(params.tilePricePerBox, 0));
        const adhesivePricePerBag = Math.max(0, toNum(params.adhesivePricePerBag, 160));
        const groutPricePerBag = Math.max(0, toNum(params.groutPricePerBag, 50));
        const laborRatePerSqm = Math.max(0, toNum(params.tileLaborPerSqm, 0));

        const tileCost = boxesNeeded * pricePerBox;
        const adhesiveCost = adhesiveBags * adhesivePricePerBag;
        const groutCost = groutBags * groutPricePerBag;
        const laborCost = round2(areaSqm * laborRatePerSqm);
        const totalEstimatedBudget = round2(tileCost + adhesiveCost + groutCost + laborCost);

        return {
            tab: 'tiles',
            widthM,
            lengthM,
            areaSqm,
            grossAreaSqm,
            sizePreset,
            tileWidthCm,
            tileLengthCm,
            tileAreaSqm: round2(tileAreaSqm),
            piecesPerBox,
            boxCoverageSqm: round2(boxCoverageSqm),
            wastagePct,
            netPieces: Math.round(netPieces * 10) / 10,
            grossPieces,
            boxesNeeded,
            totalPurchasedPieces,
            adhesiveBags,
            groutBags,
            costs: {
                pricePerBox,
                tileCost: round2(tileCost),
                adhesiveCost: round2(adhesiveCost),
                groutCost: round2(groutCost),
                laborCost: round2(laborCost),
                totalEstimatedBudget
            }
        };
    }

    // 2. PAINT
    if (tab === 'paint') {
        const wallWidthM = Math.max(0, toNum(params.paintWallWidth, 0));
        const wallHeightM = Math.max(0, toNum(params.paintWallHeight, 0));
        const deductAreaSqm = Math.max(0, toNum(params.paintDeductArea, 0));
        const wallAreaSqm = Math.max(0, round2((wallWidthM * wallHeightM) - deductAreaSqm));

        const wastagePct = Math.max(0, toNum(params.paintWastagePct, 10));
        const effectiveAreaSqm = round2(wallAreaSqm * (1 + (wastagePct / 100)));

        const primerCoats = 1;
        const primerSqmLiter = 8.5;
        const primerLitersNeeded = primerSqmLiter > 0 ? (effectiveAreaSqm * primerCoats / primerSqmLiter) : 0;

        const topcoatCoats = Math.max(1, Math.round(toNum(params.paintCoats, 2)));
        const topcoatSqmLiter = 8.0;
        const topcoatLitersNeeded = topcoatSqmLiter > 0 ? (effectiveAreaSqm * topcoatCoats / topcoatSqmLiter) : 0;

        const calcCans = (liters) => {
            if (liters <= 0) return { pail5Gal: 0, can1Gal: 0, totalLiters: 0 };
            const pail5L = 18.925;
            const can1L = 3.785;
            let pail5Gal = Math.floor(liters / pail5L);
            let remLiters = liters - (pail5Gal * pail5L);
            let can1Gal = ceil(remLiters / can1L);
            if (can1Gal >= 5) {
                pail5Gal += 1;
                can1Gal = 0;
            }
            return { pail5Gal, can1Gal, totalLiters: round2(liters) };
        };

        const primerPackages = calcCans(primerLitersNeeded);
        const topcoatPackages = calcCans(topcoatLitersNeeded);

        const primerPrice5Gal = Math.max(0, toNum(params.paintPrimerPrice5Gal, 1800));
        const primerPrice1Gal = Math.max(0, toNum(params.paintPrimerPrice1Gal, 450));
        const topcoatPrice5Gal = Math.max(0, toNum(params.paintTopcoatPrice5Gal, 2400));
        const topcoatPrice1Gal = Math.max(0, toNum(params.paintTopcoatPrice1Gal, 600));
        const laborRatePerSqm = Math.max(0, toNum(params.paintLaborPerSqm, 0));

        const primerCost = (primerPackages.pail5Gal * primerPrice5Gal) + (primerPackages.can1Gal * primerPrice1Gal);
        const topcoatCost = (topcoatPackages.pail5Gal * topcoatPrice5Gal) + (topcoatPackages.can1Gal * topcoatPrice1Gal);
        const laborCost = round2(wallAreaSqm * laborRatePerSqm);
        const totalEstimatedBudget = round2(primerCost + topcoatCost + laborCost);

        return {
            tab: 'paint',
            wallWidthM,
            wallHeightM,
            deductAreaSqm,
            wallAreaSqm,
            effectiveAreaSqm,
            wastagePct,
            primer: {
                coats: primerCoats,
                litersNeeded: round2(primerLitersNeeded),
                pail5Gal: primerPackages.pail5Gal,
                can1Gal: primerPackages.can1Gal,
                cost: round2(primerCost)
            },
            topcoat: {
                coats: topcoatCoats,
                litersNeeded: round2(topcoatLitersNeeded),
                pail5Gal: topcoatPackages.pail5Gal,
                can1Gal: topcoatPackages.can1Gal,
                cost: round2(topcoatCost)
            },
            costs: {
                primerCost: round2(primerCost),
                topcoatCost: round2(topcoatCost),
                laborCost: round2(laborCost),
                totalEstimatedBudget
            }
        };
    }

    // 3. CONCRETE
    const slabWidthM = Math.max(0, toNum(params.slabWidth, 0));
    const slabLengthM = Math.max(0, toNum(params.slabLength, 0));
    const slabThicknessCm = Math.max(0, toNum(params.slabThickness, 10));
    const slabThicknessM = slabThicknessCm / 100;

    const slabAreaSqm = round2(slabWidthM * slabLengthM);
    const netVolumeCubicM = round2(slabAreaSqm * slabThicknessM);

    const wastagePct = Math.max(0, toNum(params.concreteWastagePct, 5));
    const grossVolumeCubicM = round2(netVolumeCubicM * (1 + (wastagePct / 100)));

    const readyMixOrderCubicM = Math.round(ceil(grossVolumeCubicM * 4) / 4 * 100) / 100;

    const siteMix = {
        cementBags50kg: ceil(grossVolumeCubicM * 6.8),
        sandCubicM: round2(grossVolumeCubicM * 0.50),
        gravelCubicM: round2(grossVolumeCubicM * 0.85),
        waterLiters: Math.round(grossVolumeCubicM * 180)
    };

    const wireMeshSqm = round2(slabAreaSqm * 1.10);

    const concreteType = params.concreteType || 'ready_mix';
    const pricePerCubicM = Math.max(0, toNum(params.concretePricePerCubic, 2000));
    const pricePerWireMeshSqm = Math.max(0, toNum(params.wireMeshPricePerSqm, 35));
    const laborRatePerSqm = Math.max(0, toNum(params.concreteLaborPerSqm, 0));

    let concreteMaterialCost = 0;
    if (concreteType === 'ready_mix') {
        concreteMaterialCost = readyMixOrderCubicM * pricePerCubicM;
    } else {
        const cementBagPrice = Math.max(0, toNum(params.cementBagPrice, 145));
        const sandPrice = Math.max(0, toNum(params.sandPricePerCubic, 450));
        const gravelPrice = Math.max(0, toNum(params.gravelPricePerCubic, 500));
        concreteMaterialCost = (siteMix.cementBags50kg * cementBagPrice) + (siteMix.sandCubicM * sandPrice) + (siteMix.gravelCubicM * gravelPrice);
    }
    const wireMeshCost = wireMeshSqm * pricePerWireMeshSqm;
    const laborCost = round2(slabAreaSqm * laborRatePerSqm);
    const totalEstimatedBudget = round2(concreteMaterialCost + wireMeshCost + laborCost);

    return {
        tab: 'concrete',
        slabWidthM,
        slabLengthM,
        slabThicknessCm,
        slabAreaSqm,
        netVolumeCubicM,
        grossVolumeCubicM,
        wastagePct,
        readyMixOrderCubicM,
        siteMix,
        wireMeshSqm,
        concreteType,
        costs: {
            concreteMaterialCost: round2(concreteMaterialCost),
            wireMeshCost: round2(wireMeshCost),
            laborCost: round2(laborCost),
            totalEstimatedBudget
        }
    };
}

/* -----------------------------------------------------------
 * RENDERER: คำนวณวัสดุก่อสร้าง & ปรับปรุงบ้าน (construction_calc)
 * ----------------------------------------------------------- */
function renderConstructionTool(container) {
    if (!appState.construction_calc) {
        appState.construction_calc = {
            tab: 'tiles',
            tileWidth: '4',
            tileLength: '5',
            tileSizePreset: '60x60',
            tileCustomWidthCm: '60',
            tileCustomLengthCm: '60',
            tileCustomPcsPerBox: '4',
            tileWastagePct: '10',
            tilePricePerBox: '350',
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

    const st = appState.construction_calc;
    const tab = st.tab || 'tiles';
    const calc = calculateConstructionMaterials(st);

    let html = `
        <div class="construction-calc-tool flex flex-col gap-3 p-1">
            <!-- Mode / Category Segmented Buttons -->
            <div class="segment-group grid-cols-3" role="group" aria-label="หมวดหมู่วัสดุก่อสร้าง">
                <button type="button" id="btnConstTabTiles" aria-pressed="${tab === 'tiles'}" class="segment-btn ${tab === 'tiles' ? 'active' : ''}" style="min-height: 44px;">
                    กระเบื้องปูพื้น & ผนัง
                </button>
                <button type="button" id="btnConstTabPaint" aria-pressed="${tab === 'paint'}" class="segment-btn ${tab === 'paint' ? 'active' : ''}" style="min-height: 44px;">
                    สีทาอาคาร & ผนัง
                </button>
                <button type="button" id="btnConstTabConcrete" aria-pressed="${tab === 'concrete'}" class="segment-btn ${tab === 'concrete' ? 'active' : ''}" style="min-height: 44px;">
                    คอนกรีตเทพื้น & ปูน
                </button>
            </div>
    `;

    if (tab === 'tiles') {
        html += `
            <!-- Keypad Fields for Tiles -->
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'ความกว้างพื้นที่ปู', st.tileWidth, 'เมตร', 'เช่น 4')}
                ${createKeypadFieldHTML(1, 'ความยาวพื้นที่ปู', st.tileLength, 'เมตร', 'เช่น 5')}
                ${createKeypadFieldHTML(2, 'ราคากระเบื้องต่อกล่อง', st.tilePricePerBox, 'บาท/กล่อง', 'เช่น 350')}
            </div>

            <!-- Tile Size Presets -->
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ขนาดกระเบื้องมาตรฐาน</div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button type="button" class="tool-chip-btn tile-size-chip ${st.tileSizePreset === '30x30' ? 'active font-bold border-[var(--app-accent)]' : ''}" data-size="30x30" style="min-height: 44px;">
                        30x30 ซม. (11 แผ่น)
                    </button>
                    <button type="button" class="tool-chip-btn tile-size-chip ${st.tileSizePreset === '40x40' ? 'active font-bold border-[var(--app-accent)]' : ''}" data-size="40x40" style="min-height: 44px;">
                        40x40 ซม. (6 แผ่น)
                    </button>
                    <button type="button" class="tool-chip-btn tile-size-chip ${st.tileSizePreset === '60x60' ? 'active font-bold border-[var(--app-accent)]' : ''}" data-size="60x60" style="min-height: 44px;">
                        60x60 ซม. (4 แผ่น)
                    </button>
                    <button type="button" class="tool-chip-btn tile-size-chip ${st.tileSizePreset === '60x120' ? 'active font-bold border-[var(--app-accent)]' : ''}" data-size="60x120" style="min-height: 44px;">
                        60x120 ซม. (2 แผ่น)
                    </button>
                </div>
            </div>

            <!-- Wastage & Labor Options -->
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-[var(--app-ink)]">อัตราเผื่อเศษตัด & แตกหัก</span>
                    <span class="text-[var(--app-accent)] font-semibold" id="tileWastageDisplay">${st.tileWastagePct || '10'}%</span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                    <button type="button" class="tool-chip-btn tile-waste-chip ${st.tileWastagePct === '5' ? 'active font-bold' : ''}" data-waste="5" style="min-height: 44px;">
                        เผื่อ 5% (ปูตรง)
                    </button>
                    <button type="button" class="tool-chip-btn tile-waste-chip ${st.tileWastagePct === '10' ? 'active font-bold' : ''}" data-waste="10" style="min-height: 44px;">
                        เผื่อ 10% (มาตรฐาน)
                    </button>
                    <button type="button" class="tool-chip-btn tile-waste-chip ${st.tileWastagePct === '15' ? 'active font-bold' : ''}" data-waste="15" style="min-height: 44px;">
                        เผื่อ 15% (ลายก้างปลา)
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--app-hairline)]">
                    <div>
                        <label for="constTileLaborInput" class="text-[var(--app-muted)] text-[11px] block">ค่าแรงปูต่อ ตร.ม. (บาท)</label>
                        <input id="constTileLaborInput" type="text" inputmode="decimal" class="airbnb-input text-right text-xs" style="min-height: 44px;" value="${escapeHTML(st.tileLaborPerSqm || '')}" placeholder="เช่น 250">
                    </div>
                    <div>
                        <label for="constTileAdhesiveInput" class="text-[var(--app-muted)] text-[11px] block">ราคาปูนกาว (บ./ถุง 20กก.)</label>
                        <input id="constTileAdhesiveInput" type="text" inputmode="decimal" class="airbnb-input text-right text-xs" style="min-height: 44px;" value="${escapeHTML(st.adhesivePricePerBag || '160')}" placeholder="160">
                    </div>
                </div>
            </div>

            <!-- Result Card for Tiles -->
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">สรุปวัสดุกระเบื้องที่ต้องสั่งซื้อ</div>
                <div class="flex justify-between items-baseline">
                    <span class="text-xs font-semibold text-[var(--app-muted)]">จำนวนกระเบื้อง</span>
                    <span class="text-2xl font-bold font-mono text-[var(--app-accent)]" id="tileResultBoxes">
                        ${calc.boxesNeeded} กล่อง
                    </span>
                </div>
                <div class="text-right text-xs text-[var(--app-muted)]" id="tileResultPieces">
                    (รวม ${calc.grossPieces} แผ่น / ซื้อจริง ${calc.totalPurchasedPieces} แผ่น)
                </div>

                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    <div class="flex justify-between">
                        <span class="text-[var(--app-muted)]">พื้นที่ปูสุทธิ</span>
                        <b class="text-[var(--app-ink)] font-mono" id="tileAreaDisplay">${formatNum(calc.areaSqm, 2)} ตร.ม. (รวมเผื่อ ${formatNum(calc.grossAreaSqm, 2)} ตร.ม.)</b>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-[var(--app-muted)]">ปูนกาวซีเมนต์ (ถุงละ 20 กก.)</span>
                        <b class="text-[var(--app-ink)] font-mono" id="tileAdhesiveDisplay">${calc.adhesiveBags} ถุง</b>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-[var(--app-muted)]">กาวยาแนวร่องกระเบื้อง (ถุงละ 1 กก.)</span>
                        <b class="text-[var(--app-ink)] font-mono" id="tileGroutDisplay">${calc.groutBags} ถุง</b>
                    </div>
                    <div class="flex justify-between pt-1 border-t border-[var(--app-hairline)] text-sm font-semibold">
                        <span class="text-[var(--app-ink)]">ประมาณการงบประมาณรวม</span>
                        <span class="text-[var(--app-accent)] font-mono" id="tileTotalBudgetDisplay">฿${formatMoney(calc.costs.totalEstimatedBudget)}</span>
                    </div>
                </div>
            </div>
        `;
    } else if (tab === 'paint') {
        html += `
            <!-- Keypad Fields for Paint -->
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'ความยาวรอบห้องหรือผนัง', st.paintWallWidth, 'เมตร', 'เช่น 16')}
                ${createKeypadFieldHTML(1, 'ความสูงของผนัง', st.paintWallHeight, 'เมตร', 'เช่น 2.8')}
                ${createKeypadFieldHTML(2, 'หักพื้นที่ประตู/หน้าต่าง', st.paintDeductArea, 'ตร.ม.', 'เช่น 4')}
            </div>

            <!-- Quick Room Size Presets -->
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ขนาดห้องยอดนิยม (รอบห้อง 4 ด้าน)</div>
                <div class="grid grid-cols-3 gap-2">
                    <button type="button" class="tool-chip-btn paint-room-preset" data-perim="12" data-h="2.8" style="min-height: 44px;">
                        ห้อง 3x3 ม. (12 ม.)
                    </button>
                    <button type="button" class="tool-chip-btn paint-room-preset" data-perim="16" data-h="2.8" style="min-height: 44px;">
                        ห้อง 4x4 ม. (16 ม.)
                    </button>
                    <button type="button" class="tool-chip-btn paint-room-preset" data-perim="20" data-h="2.8" style="min-height: 44px;">
                        ทาวน์โฮม 4x6 ม. (20 ม.)
                    </button>
                </div>
            </div>

            <!-- Coats & Pricing Options -->
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">จำนวนเที่ยวทาสีทับหน้า</div>
                <div class="grid grid-cols-3 gap-2">
                    <button type="button" class="tool-chip-btn paint-coat-chip ${st.paintCoats === '1' ? 'active font-bold' : ''}" data-coat="1" style="min-height: 44px;">
                        ทา 1 เที่ยว
                    </button>
                    <button type="button" class="tool-chip-btn paint-coat-chip ${st.paintCoats === '2' || !st.paintCoats ? 'active font-bold' : ''}" data-coat="2" style="min-height: 44px;">
                        ทา 2 เที่ยว (มาตรฐาน)
                    </button>
                    <button type="button" class="tool-chip-btn paint-coat-chip ${st.paintCoats === '3' ? 'active font-bold' : ''}" data-coat="3" style="min-height: 44px;">
                        ทา 3 เที่ยว (เน้นเข้ม)
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--app-hairline)]">
                    <div>
                        <label for="constPaintLaborInput" class="text-[var(--app-muted)] text-[11px] block">ค่าแรงทาสีต่อ ตร.ม. (บาท)</label>
                        <input id="constPaintLaborInput" type="text" inputmode="decimal" class="airbnb-input text-right text-xs" style="min-height: 44px;" value="${escapeHTML(st.paintLaborPerSqm || '')}" placeholder="เช่น 70">
                    </div>
                    <div>
                        <label for="constPaintTopcoatPriceInput" class="text-[var(--app-muted)] text-[11px] block">สีทับหน้า (บ./ถัง 5GL)</label>
                        <input id="constPaintTopcoatPriceInput" type="text" inputmode="decimal" class="airbnb-input text-right text-xs" style="min-height: 44px;" value="${escapeHTML(st.paintTopcoatPrice5Gal || '2400')}" placeholder="2400">
                    </div>
                </div>
            </div>

            <!-- Result Card for Paint -->
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">สรุปปริมาณสีที่ต้องสั่งซื้อ</div>
                <div class="flex justify-between items-baseline">
                    <span class="text-xs font-semibold text-[var(--app-muted)]">สีทับหน้า (${calc.topcoat.coats} เที่ยว)</span>
                    <span class="text-2xl font-bold font-mono text-[var(--app-accent)]" id="paintTopcoatDisplay">
                        ${calc.topcoat.pail5Gal > 0 ? `${calc.topcoat.pail5Gal} ถังใหญ่` : ''}${calc.topcoat.can1Gal > 0 ? ` ${calc.topcoat.can1Gal} แกลลอน` : ''}${calc.topcoat.pail5Gal === 0 && calc.topcoat.can1Gal === 0 ? '0 แกลลอน' : ''}
                    </span>
                </div>
                <div class="text-right text-xs text-[var(--app-muted)]" id="paintTopcoatLitersDisplay">
                    (ปริมาณเนื้อสี ${formatNum(calc.topcoat.litersNeeded, 1)} ลิตร)
                </div>

                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    <div class="flex justify-between">
                        <span class="text-[var(--app-muted)]">พื้นที่ผนังสุทธิ</span>
                        <b class="text-[var(--app-ink)] font-mono" id="paintAreaDisplay">${formatNum(calc.wallAreaSqm, 2)} ตร.ม. (รวมเผื่อ ${formatNum(calc.effectiveAreaSqm, 2)} ตร.ม.)</b>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-[var(--app-muted)]">สีรองพื้น (Primer 1 เที่ยว)</span>
                        <b class="text-[var(--app-ink)] font-mono" id="paintPrimerDisplay">
                            ${calc.primer.pail5Gal > 0 ? `${calc.primer.pail5Gal} ถังใหญ่` : ''}${calc.primer.can1Gal > 0 ? ` ${calc.primer.can1Gal} GL` : ''}${calc.primer.pail5Gal === 0 && calc.primer.can1Gal === 0 ? '0 GL' : ''} (${formatNum(calc.primer.litersNeeded, 1)} ลิตร)
                        </b>
                    </div>
                    <div class="flex justify-between pt-1 border-t border-[var(--app-hairline)] text-sm font-semibold">
                        <span class="text-[var(--app-ink)]">ประมาณการงบประมาณรวม</span>
                        <span class="text-[var(--app-accent)] font-mono" id="paintTotalBudgetDisplay">฿${formatMoney(calc.costs.totalEstimatedBudget)}</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Concrete Tab
        html += `
            <!-- Keypad Fields for Concrete -->
            <div class="flex flex-col gap-1.5">
                ${createKeypadFieldHTML(0, 'ความกว้างพื้นที่เทพื้น', st.slabWidth, 'เมตร', 'เช่น 4')}
                ${createKeypadFieldHTML(1, 'ความยาวพื้นที่เทพื้น', st.slabLength, 'เมตร', 'เช่น 6')}
                ${createKeypadFieldHTML(2, 'ความหนาคอนกรีต', st.slabThickness, 'ซม.', 'เช่น 10')}
            </div>

            <!-- Quick Thickness Presets -->
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ความหนาคอนกรีตตามประเภทการใช้งาน</div>
                <div class="grid grid-cols-3 gap-2">
                    <button type="button" class="tool-chip-btn concrete-thick-chip ${st.slabThickness === '8' ? 'active font-bold' : ''}" data-thick="8" style="min-height: 44px;">
                        8 ซม. (ทางเดิน/ซักล้าง)
                    </button>
                    <button type="button" class="tool-chip-btn concrete-thick-chip ${st.slabThickness === '10' || !st.slabThickness ? 'active font-bold' : ''}" data-thick="10" style="min-height: 44px;">
                        10 ซม. (พื้นบ้าน/ห้อง)
                    </button>
                    <button type="button" class="tool-chip-btn concrete-thick-chip ${st.slabThickness === '15' ? 'active font-bold' : ''}" data-thick="15" style="min-height: 44px;">
                        15 ซม. (โรงจอดรถ)
                    </button>
                </div>
            </div>

            <!-- Concrete Mix Type Options -->
            <div class="themed-tool-card p-3 space-y-2 text-xs">
                <div class="font-semibold text-[var(--app-ink)]">ประเภทคอนกรีต</div>
                <div class="grid grid-cols-2 gap-2">
                    <button type="button" class="tool-chip-btn concrete-type-chip ${st.concreteType !== 'site_mix' ? 'active font-bold border-[var(--app-accent)]' : ''}" data-type="ready_mix" style="min-height: 44px;">
                        รถโม่ผสมเสร็จ (คิว)
                    </button>
                    <button type="button" class="tool-chip-btn concrete-type-chip ${st.concreteType === 'site_mix' ? 'active font-bold border-[var(--app-accent)]' : ''}" data-type="site_mix" style="min-height: 44px;">
                        ผสมเอง (ปูน+ทราย+หิน)
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--app-hairline)]">
                    <div>
                        <label for="constConcretePriceInput" class="text-[var(--app-muted)] text-[11px] block">ราคาคอนกรีตผสมเสร็จ (บ./คิว)</label>
                        <input id="constConcretePriceInput" type="text" inputmode="decimal" class="airbnb-input text-right text-xs" style="min-height: 44px;" value="${escapeHTML(st.concretePricePerCubic || '2000')}" placeholder="2000">
                    </div>
                    <div>
                        <label for="constConcreteLaborInput" class="text-[var(--app-muted)] text-[11px] block">ค่าแรงเทปรับระดับ (บ./ตร.ม.)</label>
                        <input id="constConcreteLaborInput" type="text" inputmode="decimal" class="airbnb-input text-right text-xs" style="min-height: 44px;" value="${escapeHTML(st.concreteLaborPerSqm || '')}" placeholder="เช่น 150">
                    </div>
                </div>
            </div>

            <!-- Result Card for Concrete -->
            <div class="themed-result-card p-4 space-y-3">
                <div class="text-xs text-[var(--app-muted)] font-medium">สรุปคอนกรีตและวัสดุเทพื้น</div>
                <div class="flex justify-between items-baseline">
                    <span class="text-xs font-semibold text-[var(--app-muted)]">คอนกรีตที่ต้องสั่ง</span>
                    <span class="text-2xl font-bold font-mono text-[var(--app-accent)]" id="concreteVolumeDisplay">
                        ${calc.readyMixOrderCubicM} คิว (m³)
                    </span>
                </div>
                <div class="text-right text-xs text-[var(--app-muted)]" id="concreteExactVolumeDisplay">
                    (ปริมาตรคำนวณ ${formatNum(calc.grossVolumeCubicM, 2)} คิว รวมเผื่อ ${calc.wastagePct}%)
                </div>

                <div class="pt-2 border-t border-[var(--app-hairline)] space-y-1.5 text-xs">
                    <div class="flex justify-between">
                        <span class="text-[var(--app-muted)]">พื้นที่เทพื้นคอนกรีต</span>
                        <b class="text-[var(--app-ink)] font-mono" id="concreteAreaDisplay">${formatNum(calc.slabAreaSqm, 2)} ตร.ม. (หนา ${calc.slabThicknessCm} ซม.)</b>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-[var(--app-muted)]">ตะแกรงเหล็กไวร์เมช (เผื่อทาบ 10%)</span>
                        <b class="text-[var(--app-ink)] font-mono" id="concreteWireMeshDisplay">${formatNum(calc.wireMeshSqm, 2)} ตร.ม.</b>
                    </div>

                    ${st.concreteType === 'site_mix' ? `
                        <div class="p-2.5 rounded bg-[var(--app-surface-soft)] space-y-1 mt-1 border border-[var(--app-hairline)]">
                            <div class="font-semibold text-[var(--app-ink)] text-[11px]">สัดส่วนผสมเอง (สูตร 1:2:4 มาตรฐาน):</div>
                            <div class="flex justify-between text-[11px]"><span class="text-[var(--app-muted)]">• ปูนซีเมนต์ปอร์ตแลนด์ (50 กก.)</span><b class="font-mono">${calc.siteMix.cementBags50kg} ถุง</b></div>
                            <div class="flex justify-between text-[11px]"><span class="text-[var(--app-muted)]">• ทรายหยาบ</span><b class="font-mono">${formatNum(calc.siteMix.sandCubicM, 2)} คิว</b></div>
                            <div class="flex justify-between text-[11px]"><span class="text-[var(--app-muted)]">• หินก่อสร้าง 1-2</span><b class="font-mono">${formatNum(calc.siteMix.gravelCubicM, 2)} คิว</b></div>
                        </div>
                    ` : ''}

                    <div class="flex justify-between pt-1 border-t border-[var(--app-hairline)] text-sm font-semibold">
                        <span class="text-[var(--app-ink)]">ประมาณการงบประมาณรวม</span>
                        <span class="text-[var(--app-accent)] font-mono" id="concreteTotalBudgetDisplay">฿${formatMoney(calc.costs.totalEstimatedBudget)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Attach shared keypad field click listeners
    attachFieldClickListeners(container);

    // Tab Switch Handlers
    document.getElementById('btnConstTabTiles')?.addEventListener('click', () => {
        st.tab = 'tiles';
        persistAppState();
        renderActiveTool();
    });
    document.getElementById('btnConstTabPaint')?.addEventListener('click', () => {
        st.tab = 'paint';
        persistAppState();
        renderActiveTool();
    });
    document.getElementById('btnConstTabConcrete')?.addEventListener('click', () => {
        st.tab = 'concrete';
        persistAppState();
        renderActiveTool();
    });

    // Tiles Event Listeners
    if (tab === 'tiles') {
        container.querySelectorAll('.tile-size-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                st.tileSizePreset = btn.dataset.size;
                persistAppState();
                renderActiveTool();
            });
        });
        container.querySelectorAll('.tile-waste-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                st.tileWastagePct = btn.dataset.waste;
                persistAppState();
                renderActiveTool();
            });
        });
        const laborInput = document.getElementById('constTileLaborInput');
        if (laborInput) {
            laborInput.addEventListener('input', () => {
                st.tileLaborPerSqm = laborInput.value;
                updateConstructionDOM();
            });
        }
        const adhesiveInput = document.getElementById('constTileAdhesiveInput');
        if (adhesiveInput) {
            adhesiveInput.addEventListener('input', () => {
                st.adhesivePricePerBag = adhesiveInput.value;
                updateConstructionDOM();
            });
        }
    }

    // Paint Event Listeners
    if (tab === 'paint') {
        container.querySelectorAll('.paint-room-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                st.paintWallWidth = btn.dataset.perim;
                st.paintWallHeight = btn.dataset.h;
                persistAppState();
                renderActiveTool();
            });
        });
        container.querySelectorAll('.paint-coat-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                st.paintCoats = btn.dataset.coat;
                persistAppState();
                renderActiveTool();
            });
        });
        const laborInput = document.getElementById('constPaintLaborInput');
        if (laborInput) {
            laborInput.addEventListener('input', () => {
                st.paintLaborPerSqm = laborInput.value;
                updateConstructionDOM();
            });
        }
        const topcoatPriceInput = document.getElementById('constPaintTopcoatPriceInput');
        if (topcoatPriceInput) {
            topcoatPriceInput.addEventListener('input', () => {
                st.paintTopcoatPrice5Gal = topcoatPriceInput.value;
                updateConstructionDOM();
            });
        }
    }

    // Concrete Event Listeners
    if (tab === 'concrete') {
        container.querySelectorAll('.concrete-thick-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                st.slabThickness = btn.dataset.thick;
                persistAppState();
                renderActiveTool();
            });
        });
        container.querySelectorAll('.concrete-type-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                st.concreteType = btn.dataset.type;
                persistAppState();
                renderActiveTool();
            });
        });
        const priceInput = document.getElementById('constConcretePriceInput');
        if (priceInput) {
            priceInput.addEventListener('input', () => {
                st.concretePricePerCubic = priceInput.value;
                updateConstructionDOM();
            });
        }
        const laborInput = document.getElementById('constConcreteLaborInput');
        if (laborInput) {
            laborInput.addEventListener('input', () => {
                st.concreteLaborPerSqm = laborInput.value;
                updateConstructionDOM();
            });
        }
    }

    // Helper to update DOM live without tearing down buttons
    function updateConstructionDOM() {
        const curCalc = calculateConstructionMaterials(st);
        if (tab === 'tiles') {
            const boxesEl = document.getElementById('tileResultBoxes');
            if (boxesEl) boxesEl.textContent = `${curCalc.boxesNeeded} กล่อง`;
            const pcsEl = document.getElementById('tileResultPieces');
            if (pcsEl) pcsEl.textContent = `(รวม ${curCalc.grossPieces} แผ่น / ซื้อจริง ${curCalc.totalPurchasedPieces} แผ่น)`;
            const areaEl = document.getElementById('tileAreaDisplay');
            if (areaEl) areaEl.textContent = `${formatNum(curCalc.areaSqm, 2)} ตร.ม. (รวมเผื่อ ${formatNum(curCalc.grossAreaSqm, 2)} ตร.ม.)`;
            const adhEl = document.getElementById('tileAdhesiveDisplay');
            if (adhEl) adhEl.textContent = `${curCalc.adhesiveBags} ถุง`;
            const groutEl = document.getElementById('tileGroutDisplay');
            if (groutEl) groutEl.textContent = `${curCalc.groutBags} ถุง`;
            const budgetEl = document.getElementById('tileTotalBudgetDisplay');
            if (budgetEl) budgetEl.textContent = `฿${formatMoney(curCalc.costs.totalEstimatedBudget)}`;
        } else if (tab === 'paint') {
            const topcoatEl = document.getElementById('paintTopcoatDisplay');
            if (topcoatEl) {
                topcoatEl.textContent = `${curCalc.topcoat.pail5Gal > 0 ? `${curCalc.topcoat.pail5Gal} ถังใหญ่` : ''}${curCalc.topcoat.can1Gal > 0 ? ` ${curCalc.topcoat.can1Gal} แกลลอน` : ''}${curCalc.topcoat.pail5Gal === 0 && curCalc.topcoat.can1Gal === 0 ? '0 แกลลอน' : ''}`;
            }
            const litersEl = document.getElementById('paintTopcoatLitersDisplay');
            if (litersEl) litersEl.textContent = `(ปริมาณเนื้อสี ${formatNum(curCalc.topcoat.litersNeeded, 1)} ลิตร)`;
            const areaEl = document.getElementById('paintAreaDisplay');
            if (areaEl) areaEl.textContent = `${formatNum(curCalc.wallAreaSqm, 2)} ตร.ม. (รวมเผื่อ ${formatNum(curCalc.effectiveAreaSqm, 2)} ตร.ม.)`;
            const primerEl = document.getElementById('paintPrimerDisplay');
            if (primerEl) {
                primerEl.textContent = `${curCalc.primer.pail5Gal > 0 ? `${curCalc.primer.pail5Gal} ถังใหญ่` : ''}${curCalc.primer.can1Gal > 0 ? ` ${curCalc.primer.can1Gal} GL` : ''}${curCalc.primer.pail5Gal === 0 && curCalc.primer.can1Gal === 0 ? '0 GL' : ''} (${formatNum(curCalc.primer.litersNeeded, 1)} ลิตร)`;
            }
            const budgetEl = document.getElementById('paintTotalBudgetDisplay');
            if (budgetEl) budgetEl.textContent = `฿${formatMoney(curCalc.costs.totalEstimatedBudget)}`;
        } else {
            const volEl = document.getElementById('concreteVolumeDisplay');
            if (volEl) volEl.textContent = `${curCalc.readyMixOrderCubicM} คิว (m³)`;
            const exactEl = document.getElementById('concreteExactVolumeDisplay');
            if (exactEl) exactEl.textContent = `(ปริมาตรคำนวณ ${formatNum(curCalc.grossVolumeCubicM, 2)} คิว รวมเผื่อ ${curCalc.wastagePct}%)`;
            const areaEl = document.getElementById('concreteAreaDisplay');
            if (areaEl) areaEl.textContent = `${formatNum(curCalc.slabAreaSqm, 2)} ตร.ม. (หนา ${curCalc.slabThicknessCm} ซม.)`;
            const wireEl = document.getElementById('concreteWireMeshDisplay');
            if (wireEl) wireEl.textContent = `${formatNum(curCalc.wireMeshSqm, 2)} ตร.ม.`;
            const budgetEl = document.getElementById('concreteTotalBudgetDisplay');
            if (budgetEl) budgetEl.textContent = `฿${formatMoney(curCalc.costs.totalEstimatedBudget)}`;
        }
    }
}

(function(root) {
    const exportsObj = {
        UNIT_CATEGORIES,
        renderUnitPriceTool,
        renderDiscountTool,
        renderTipTool,
        renderUnitConverterTool,
        calculateConstructionMaterials,
        renderConstructionTool
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
