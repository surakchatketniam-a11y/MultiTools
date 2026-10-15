// ==============================================================
// Multitools Calculator - Business & Commerce Tools
// (vat, vat_wht, percent, salary)
// ==============================================================

/* -----------------------------------------------------------
 * TOOL 6: ภาษีมูลค่าเพิ่ม (VAT Calculator)
 * ----------------------------------------------------------- */
function renderVatTool(container) {
    const st = appState.vat;
    const amt = numberOrDefault(st.amount, 0);
    const rate = numberOrDefault(st.rate, 0);

    let netPrice = 0, vatAmt = 0, grossPrice = 0;
    if (st.mode === 'exclude') {
        netPrice = amt;
        vatAmt = amt * (rate / 100);
        grossPrice = netPrice + vatAmt;
    } else {
        grossPrice = amt;
        netPrice = amt / (1 + rate / 100);
        vatAmt = grossPrice - netPrice;
    }

    container.innerHTML = `
        <div class="flex flex-col gap-2">
            <div class="segment-group grid-cols-2">
                <button class="segment-btn vat-mode ${st.mode === 'exclude' ? 'active' : ''}" data-m="exclude">บวกภาษีเพิ่ม (Add VAT)</button>
                <button class="segment-btn vat-mode ${st.mode === 'include' ? 'active' : ''}" data-m="include">ถอดภาษีจากราคารวม (Excl. VAT)</button>
            </div>

            ${createKeypadFieldHTML(0, 'จำนวนเงิน', st.amount, 'บาท', 'ป้อนจำนวนเงิน')}
            ${createKeypadFieldHTML(1, 'อัตราภาษีมูลค่าเพิ่ม (VAT)', st.rate, '%', '7')}
        </div>
    `;

    attachFieldClickListeners(container);
    container.querySelectorAll('.vat-mode').forEach(btn => {
        btn.addEventListener('click', () => {
            st.mode = btn.getAttribute('data-m');
            renderActiveTool();
        });
    });

    if (amt <= 0) {
        setStatusBanner('empty', 'กรุณาป้อนจำนวนเงินเพื่อคำนวณภาษีมูลค่าเพิ่ม');
    } else {
        setStatusBanner('success', `ก่อนภาษี: <b>${formatMoney(netPrice)}</b> | ภาษี (${rate}%): <b>${formatMoney(vatAmt)}</b><span class="block text-base text-[var(--app-accent)] underline mt-0.5">รวมภาษีสุทธิ: ${formatMoney(grossPrice)} บาท</span>`);
    }
}

/* -----------------------------------------------------------
 * TOOL: VAT + หัก ณ ที่จ่าย (Withholding Tax Calculator)
 * ----------------------------------------------------------- */
function renderVatWhtTool(container) {
    const st = appState.vat_wht;
    const amount = parseNumericInput(String(st.amount ?? '').replace(/,/g, ''));
    const vat = numberOrDefault(st.vatRate, 0);
    const wht = numberOrDefault(st.whtRate, 0);
    const base = Number.isFinite(amount) ? (st.mode === 'after' ? amount / (1 + vat / 100) : amount) : 0;
    const vatAmount = base * vat / 100;
    const gross = base + vatAmount;
    const whtAmount = base * wht / 100;
    const net = gross - whtAmount;
    container.innerHTML = `<div class="flex flex-col gap-3 p-1">
        <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-3" style="box-shadow:var(--app-elevation)">
            <div><label class="text-xs font-semibold text-[#6a6a6a] block mb-1">ยอดเงิน</label><input id="whtAmount" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.amount))}" placeholder="เช่น 10,000" class="airbnb-input w-full"></div>
            <div class="grid grid-cols-2 gap-2"><div><label class="text-xs font-semibold text-[#6a6a6a] block mb-1">ยอดที่กรอกคือ</label><select id="whtMode" class="airbnb-input w-full"><option value="before" ${st.mode === 'before' ? 'selected' : ''}>ยอดก่อน VAT</option><option value="after" ${st.mode === 'after' ? 'selected' : ''}>ยอดรวม VAT แล้ว</option></select></div><div><label class="text-xs font-semibold text-[#6a6a6a] block mb-1">VAT (%)</label><input id="whtVat" type="number" value="${st.vatRate}" class="airbnb-input w-full"></div></div>
            <div><label class="text-xs font-semibold text-[#6a6a6a] block mb-1">หัก ณ ที่จ่าย (%)</label><select id="whtRate" class="airbnb-input w-full"><option value="0" ${wht === 0 ? 'selected' : ''}>ไม่หัก</option><option value="1" ${wht === 1 ? 'selected' : ''}>1%</option><option value="3" ${wht === 3 ? 'selected' : ''}>3%</option><option value="5" ${wht === 5 ? 'selected' : ''}>5%</option></select></div>
        </div>
        <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-2" style="box-shadow:var(--app-elevation)"><div class="flex justify-between"><span>ยอดก่อน VAT</span><b>${Number.isFinite(amount) ? formatMoney(base) : '-'} บาท</b></div><div class="flex justify-between"><span>VAT ${vat}%</span><b>${Number.isFinite(amount) ? formatMoney(vatAmount) : '-'} บาท</b></div><div class="flex justify-between"><span>ยอดรวม VAT</span><b>${Number.isFinite(amount) ? formatMoney(gross) : '-'} บาท</b></div><div class="flex justify-between"><span>หัก ณ ที่จ่าย ${wht}%</span><b>${Number.isFinite(amount) ? `- ${formatMoney(whtAmount)}` : '-'} บาท</b></div><div class="mt-2 p-3 rounded-xl border border-[#16a34a] bg-[#f0fdf4] text-[#15803d] theme-result-highlight flex justify-between"><span class="font-semibold">ยอดโอนสุทธิ</span><b>${Number.isFinite(amount) ? formatMoney(net) : '-'} บาท</b></div>${Number.isFinite(amount) ? `<div class="flex justify-end pt-1"><button id="btnPrintVatWhtSummary" type="button" class="px-2.5 py-1 text-xs font-semibold rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1 cursor-pointer">🖨️ พิมพ์ใบสรุปภาษี / PDF</button></div>` : ''}</div></div>`;
    const whtInput = document.getElementById('whtAmount');
    whtInput.addEventListener('blur', () => {
        const formatted = formatInputDisplay(whtInput.value);
        st.amount = formatted;
        whtInput.value = formatted;
        persistAppState();
    });
    const rerender = () => {
        st.amount = formatInputDisplay(whtInput.value);
        st.mode = document.getElementById('whtMode').value;
        st.vatRate = document.getElementById('whtVat').value;
        st.whtRate = document.getElementById('whtRate').value;
        persistAppState();
        renderActiveTool();
    };
    ['whtAmount','whtMode','whtVat','whtRate'].forEach(id => document.getElementById(id).addEventListener('change', rerender));
    container.querySelector('#btnPrintVatWhtSummary')?.addEventListener('click', () => {
        triggerPrintReceipt('vat_wht');
    });
    setStatusBanner(Number.isFinite(amount) ? 'success' : 'empty', Number.isFinite(amount) ? `ยอดโอนสุทธิ: <span class="text-lg text-[var(--app-accent)] underline">${formatMoney(net)} บาท</span>` : 'กรุณาป้อนยอดเงินเพื่อคำนวณ VAT และหัก ณ ที่จ่าย');
}

/* -----------------------------------------------------------
 * TOOL 5: เปอร์เซ็นต์ (Percentage Calculator)
 * ----------------------------------------------------------- */
function renderPercentTool(container) {
    const st = appState.percent;
    const x = parseNumericInput(st.x);
    const y = parseNumericInput(st.y);
    const z = parseNumericInput(st.z);

    let labelX = 'เปอร์เซ็นต์ (X%)';
    let labelY = 'ของจำนวน (Y)';
    if (st.mode === 'what_pct') {
        labelX = 'จำนวนย่อย (X)';
        labelY = 'คิดเป็นกี่ % ของจำนวนเต็ม (Y)';
    } else if (st.mode === 'change') {
        labelX = 'ค่าเริ่มต้น (X)';
        labelY = 'ค่าใหม่ (Y)';
    } else if (st.mode === 'reverse') {
        labelX = 'ค่าหลังลด';
        labelY = 'ลดกี่ %';
    } else if (st.mode === 'split') {
        labelX = 'ยอดรวม';
        labelY = 'สัดส่วน (%)';
    } else if (st.mode === 'compound') {
        labelX = 'ค่าตั้งต้น';
        labelY = 'ลดครั้งที่ 1 (%)';
    } else if (st.mode === 'profit') {
        labelX = 'ต้นทุน';
        labelY = 'ราคาขาย';
    }

    container.innerHTML = `
        <div class="flex flex-col gap-2">
            <div class="segment-group grid-cols-3">
                <button class="segment-btn pct-mode ${st.mode === 'pct_of' ? 'active' : ''}" data-m="pct_of">X% ของ Y</button>
                <button class="segment-btn pct-mode ${st.mode === 'what_pct' ? 'active' : ''}" data-m="what_pct">X เป็นกี่ % ของ Y</button>
                <button class="segment-btn pct-mode ${st.mode === 'change' ? 'active' : ''}" data-m="change">% เพิ่ม/ลด</button>
            </div>
            <div class="segment-group grid-cols-2 balanced-segment-modes">
                <button class="segment-btn pct-mode ${st.mode === 'reverse' ? 'active' : ''}" data-m="reverse">ย้อนหาค่าเดิม</button>
                <button class="segment-btn pct-mode ${st.mode === 'split' ? 'active' : ''}" data-m="split">แบ่งสัดส่วน</button>
                <button class="segment-btn pct-mode ${st.mode === 'compound' ? 'active' : ''}" data-m="compound">ลดต่อเนื่อง</button>
                <button class="segment-btn pct-mode ${st.mode === 'profit' ? 'active' : ''}" data-m="profit">กำไร / Margin</button>
            </div>

            ${createKeypadFieldHTML(0, labelX, st.x, st.mode === 'pct_of' ? '%' : '', 'ป้อนค่า X')}
            ${createKeypadFieldHTML(1, labelY, st.y, '', 'ป้อนค่า Y')}
            ${st.mode === 'compound' ? createKeypadFieldHTML(2, 'ลดครั้งที่ 2 (%)', st.z, '%', 'ป้อนเปอร์เซ็นต์ครั้งที่ 2') : ''}
        </div>
    `;

    attachFieldClickListeners(container);
    container.querySelectorAll('.pct-mode').forEach(btn => {
        btn.addEventListener('click', () => {
            st.mode = btn.getAttribute('data-m');
            renderActiveTool();
        });
    });

    if (['reverse', 'split', 'compound', 'profit'].includes(st.mode)) {
        if (isNaN(x) || isNaN(y) || (st.mode === 'compound' && isNaN(z))) {
            setStatusBanner('empty', 'กรุณาป้อนข้อมูลให้ครบเพื่อคำนวณ');
        } else if (st.mode === 'reverse') {
            if (y >= 100) {
                setStatusBanner('empty', 'เปอร์เซ็นต์ลดต้องน้อยกว่า 100%');
            } else {
                const original = x / (1 - y / 100);
                const saved = original - x;
                setStatusBanner('success', `ราคาก่อนลด = <span class="text-lg text-[var(--app-accent)] underline">${formatNum(original, 2)}</span><span class="text-xs font-medium block">ส่วนต่าง ${formatNum(saved, 2)}</span>`);
            }
        } else if (st.mode === 'split') {
            const part = x * y / 100;
            setStatusBanner('success', `${formatNum(y, 2)}% ของ ${formatNum(x)} = <span class="text-lg text-[var(--app-accent)] underline">${formatNum(part, 2)}</span>`);
        } else if (st.mode === 'compound') {
            const afterFirst = x * (1 - y / 100);
            const finalValue = afterFirst * (1 - z / 100);
            const totalPct = (1 - finalValue / x) * 100;
            setStatusBanner('success', `เหลือ <span class="text-lg text-[var(--app-accent)] underline">${formatNum(finalValue, 2)}</span><span class="text-xs font-medium block">ลดจริงรวม ${formatNum(totalPct, 2)}% (ไม่ใช่ ${formatNum(y + z, 2)}% ตรงๆ)</span>`);
        } else {
            const profit = y - x;
            const markup = x === 0 ? 0 : (profit / x) * 100;
            const margin = y === 0 ? 0 : (profit / y) * 100;
            setStatusBanner('success', `กำไร <span class="text-lg text-[var(--app-accent)] underline">${formatNum(profit, 2)}</span><span class="text-xs font-medium block">Markup ${formatNum(markup, 2)}% · Margin ${formatNum(margin, 2)}%</span>`);
        }
        return;
    }

    if (isNaN(x) || isNaN(y)) {
        setStatusBanner('empty', 'กรุณาป้อนค่า X และ Y เพื่อคำนวณเปอร์เซ็นต์');
    } else if (st.mode === 'pct_of') {
        const res = (x / 100) * y;
        setStatusBanner('success', `${formatNum(x)}% ของ ${formatNum(y)} = <span class="text-lg text-[var(--app-accent)] underline">${formatNum(res, 4)}</span>`);
    } else if (st.mode === 'what_pct') {
        if (y === 0) {
            setStatusBanner('empty', 'ค่า Y ต้องไม่เป็น 0');
        } else {
            const res = (x / y) * 100;
            setStatusBanner('success', `${formatNum(x)} คิดเป็น <span class="text-lg text-[var(--app-accent)] underline">${formatNum(res, 2)}%</span> ของ ${formatNum(y)}`);
        }
    } else {
        if (x === 0) {
            setStatusBanner('empty', 'ค่าเริ่มต้น X ต้องไม่เป็น 0');
        } else {
            const diff = y - x;
            const pct = (diff / x) * 100;
            const dir = diff >= 0 ? 'เพิ่มขึ้น +' : 'ลดลง ';
            setStatusBanner('success', `เปลี่ยนแปลง: <b class="text-[var(--app-accent)]">${dir}${formatNum(pct, 2)}%</b> (ผลต่าง ${formatNum(diff, 2)})`);
        }
    }
}

/* -----------------------------------------------------------
 * TOOL: จัดการเงินเดือน 50/30/20 (Salary Allocation)
 * ----------------------------------------------------------- */
function renderSalaryTool(container) {
    const st = appState.salary;
    const income = numberOrDefault(st.income, 0);
    const needsPct = numberOrDefault(st.needsPct, 0);
    const wantsPct = numberOrDefault(st.wantsPct, 0);
    const savingsPct = numberOrDefault(st.savingsPct, 0);
    const emergencyPct = numberOrDefault(st.emergencyPct, 0);
    const debtPct = numberOrDefault(st.debtPct, 0);
    const totalPct = needsPct + wantsPct + savingsPct;
    const needs = income * needsPct / 100;
    const wants = income * wantsPct / 100;
    const savings = income * savingsPct / 100;
    const emergency = income * emergencyPct / 100;
    const debt = income * debtPct / 100;

    container.innerHTML = `<div class="flex flex-col gap-2"><div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3"><div class="text-xs text-[#6a6a6a] mb-2">หลักการเริ่มต้น 50/30/20: ค่าใช้จ่ายจำเป็น / ความต้องการ / ออมและลงทุน</div>${createKeypadFieldHTML(0, 'เงินเดือนสุทธิที่ได้รับ', st.income, 'บาท/เดือน', 'เช่น 30,000')}</div><div class="grid grid-cols-3 gap-2">${[['salaryNeedsPct','ค่าใช้จ่ายจำเป็น (%)',st.needsPct],['salaryWantsPct','ไลฟ์สไตล์ (%)',st.wantsPct],['salarySavingsPct','ออม/ลงทุน (%)',st.savingsPct]].map(([id,label,value]) => `<div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-btn-radius)] p-2"><label class="text-[10px] text-[#6a6a6a] block">${label}</label><input id="${id}" type="number" min="0" max="100" step="1" value="${value}" class="airbnb-input w-full"></div>`).join('')}</div><div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3 space-y-2"><div class="text-xs font-semibold text-[#6a6a6a]">เป้าหมายย่อยที่แนะนำ</div><div class="grid grid-cols-2 gap-2"><label class="text-xs">เงินสำรองฉุกเฉิน (% ของเงินเดือน)<input id="salaryEmergencyPct" type="number" min="0" max="100" value="${st.emergencyPct}" class="airbnb-input w-full mt-1"></label><label class="text-xs">ชำระหนี้เพิ่มเติม (% ของเงินเดือน)<input id="salaryDebtPct" type="number" min="0" max="100" value="${st.debtPct}" class="airbnb-input w-full mt-1"></label></div></div><div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-2"><div class="flex justify-between"><span>ค่าใช้จ่ายจำเป็น</span><b>${formatMoney(needs)} บาท</b></div><div class="flex justify-between"><span>ความต้องการ/ไลฟ์สไตล์</span><b>${formatMoney(wants)} บาท</b></div><div class="flex justify-between"><span>ออมและลงทุน</span><b>${formatMoney(savings)} บาท</b></div><div class="flex justify-between text-[var(--app-accent)]"><span>เป้าหมายเงินฉุกเฉิน</span><b>${formatMoney(emergency)} บาท/เดือน</b></div><div class="flex justify-between"><span>แนวทางชำระหนี้เพิ่ม</span><b>${formatMoney(debt)} บาท/เดือน</b></div>${income > 0 ? `<div class="flex justify-end pt-2"><button id="btnPrintSalarySummary" type="button" class="px-2.5 py-1 text-xs font-semibold rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1 cursor-pointer">🖨️ พิมพ์แผนการเงิน / PDF</button></div>` : ''}</div></div>`;
    attachFieldClickListeners(container);
    const save = (id, key) => document.getElementById(id)?.addEventListener('change', event => { st[key] = event.target.value; renderActiveTool(); });
    save('salaryNeedsPct', 'needsPct');
    save('salaryWantsPct', 'wantsPct');
    save('salarySavingsPct', 'savingsPct');
    save('salaryEmergencyPct', 'emergencyPct');
    save('salaryDebtPct', 'debtPct');
    container.querySelector('#btnPrintSalarySummary')?.addEventListener('click', () => {
        triggerPrintReceipt('salary');
    });
    if (income <= 0) setStatusBanner('empty', 'กรุณากรอกเงินเดือนสุทธิที่ได้รับ');
    else if (Math.abs(totalPct - 100) > 0.01) setStatusBanner('empty', `สัดส่วนหลักรวม ${formatNum(totalPct, 0)}% ควรปรับให้รวมเท่ากับ 100%`);
    else setStatusBanner('success', `จัดสรรเงินเดือน ${formatMoney(income)} บาทเรียบร้อย · ออม/ลงทุน ${formatMoney(savings)} บาทต่อเดือน`);
}

(function(root) {
    const exportsObj = {
        renderVatTool,
        renderVatWhtTool,
        renderPercentTool,
        renderSalaryTool
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
