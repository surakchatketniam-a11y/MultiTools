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
                            ? (isAirbnb ? 'text-[#ff385c] font-bold' : appState.theme === 'together' ? 'text-[var(--app-accent)] font-bold' : 'text-green-700 font-bold')
                            : 'text-[#222222] font-semibold';
                        const unitLabelClass = isBest
                            ? (isAirbnb ? 'text-[#ff385c]' : appState.theme === 'together' ? 'text-[var(--app-accent)]' : 'text-green-700')
                            : 'text-[#717171]';
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
                    setStatusBanner('error', '⚠️ ชนิดหน่วยไม่ตรงกัน (กรุณาเลือกหน่วยกลุ่มเดียวกัน เช่น กรัม กับ กิโลกรัม)');
                } else if (liveItems.length === 1) {
                    setStatusBanner('info', `ตัวเลือก <b>${liveItems[0].id}</b>: ${formatUnitPrice(liveItems[0].normalizedPrice)} บาท/${liveItems[0].baseUnit} <span class="text-xs font-normal text-[#6a6a6a] block">ป้อนแถวอื่นเพิ่มเพื่อเปรียบเทียบความคุ้มค่า</span>`);
                } else {
                    const best = liveItems.find(item => Math.abs(item.normalizedPrice - liveMin) < 1e-7);
                    const bestLabels = liveItems.filter(item => Math.abs(item.normalizedPrice - liveMin) < 1e-7).map(item => item.id).join(', ');
                    const next = [...liveItems].sort((a, b) => a.normalizedPrice - b.normalizedPrice).find(item => item.normalizedPrice > liveMin + 1e-7);
                    if (next) {
                        const pct = (((next.normalizedPrice - best.normalizedPrice) / next.normalizedPrice) * 100).toFixed(1);
                        const diff = next.normalizedPrice - best.normalizedPrice;
                        setStatusBanner('success', `<span class="text-[var(--app-accent)]">★ ตัวเลือก ${bestLabels} คุ้มที่สุด</span> (${formatUnitPrice(best.normalizedPrice)} บาท/${best.baseUnit})<span class="text-xs font-medium block text-[#3f3f3f]">ถูกกว่าตัวเลือก ${next.id} ${pct}% หรือประหยัด ${formatUnitPrice(diff)} บาท/${best.baseUnit}</span>`);
                    } else {
                        setStatusBanner('success', `⚖️ ตัวเลือก <b>${bestLabels}</b> ราคาต่อหน่วยเท่ากัน (${formatUnitPrice(liveMin)} บาท/${best.baseUnit})`);
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
                priceCell.innerHTML = `<input id="numeric-field-${priceFieldIdx}" data-shared-field="${priceFieldIdx}" class="unit-quick-input unit-price-input" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="ราคา ${row.id}" placeholder="ราคา" value="${escapeHTML(formatInputDisplay(row.price))}" aria-describedby="numeric-error-${priceFieldIdx}"><span id="numeric-error-${priceFieldIdx}" class="field-error text-[10px]" role="alert" hidden></span>`;
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
                qtyCell.innerHTML = `
                    <div class="flex items-center w-full h-full relative">
                        <input id="numeric-field-${qtyFieldIdx}" data-shared-field="${qtyFieldIdx}" class="unit-quick-input unit-qty-input min-w-0 flex-1 h-full px-1.5 text-center bg-transparent focus:outline-none" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="จำนวน ${row.id}" placeholder="จำนวน" value="${escapeHTML(formatInputDisplay(row.qty))}" aria-describedby="numeric-error-${qtyFieldIdx}">
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
