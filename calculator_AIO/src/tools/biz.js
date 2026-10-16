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

/* -----------------------------------------------------------
 * PURE ENGINE: คำนวณกำไรสุทธิขายของออนไลน์ & ค่าธรรมเนียมแพลตฟอร์ม
 * Shopee, Lazada, TikTok Shop, Direct Sales (Line/FB)
 * ----------------------------------------------------------- */
function calculateEcommerceProfit(params) {
    const p = params || {};
    const platform = p.platform || 'shopee'; // 'shopee' | 'lazada' | 'tiktok' | 'direct' | 'custom'
    const sellingPrice = Math.max(0, numberOrDefault(p.sellingPrice, 350));
    const productCost = Math.max(0, numberOrDefault(p.productCost, 150));
    const packagingCost = Math.max(0, numberOrDefault(p.packagingCost, 10));
    const shopVoucher = Math.max(0, numberOrDefault(p.shopVoucher, 0));
    const customerShipping = Math.max(0, numberOrDefault(p.customerShipping, 35));
    const sellerShipping = Math.max(0, numberOrDefault(p.sellerShipping, 35));
    const adSpendPerOrder = Math.max(0, numberOrDefault(p.adSpendPerOrder, 0));

    // อัตราค่าธรรมเนียม (%)
    const commissionRatePct = Math.max(0, numberOrDefault(p.commissionRatePct, platform === 'tiktok' ? 4.0 : (platform === 'direct' ? 0.0 : 5.0)));
    const serviceFeePct = Math.max(0, numberOrDefault(p.serviceFeePct, platform === 'shopee' ? 4.0 : (platform === 'lazada' ? 3.0 : 0.0)));
    const transactionRatePct = Math.max(0, numberOrDefault(p.transactionRatePct, platform === 'direct' ? 0.0 : 3.0));
    const isVatApplied = p.isVatApplied !== false && p.isVatApplied !== 'no';
    const vatOnFeePct = isVatApplied ? 7.0 : 0.0;

    // 1. มูลค่าสินค้าหลังหักคูปองร้านค้า (Net Merchandise Value)
    const effectiveSellingPrice = Math.max(0, sellingPrice - shopVoucher);
    // มูลค่ารวมที่ผู้ซื้อชำระทั้งหมด (Gross Order Value)
    const orderGrossValue = effectiveSellingPrice + customerShipping;

    // 2. คำนวณค่าธรรมเนียมแพลตฟอร์ม
    // - ค่าคอมมิชชัน คิดจากราคาขายหักคูปองร้าน (ไม่รวมค่าส่ง)
    const commissionFeePreVat = effectiveSellingPrice * (commissionRatePct / 100);
    // - ค่าบริการโปรแกรมส่งฟรี / เหรียญคืน คิดจากราคาขายหักคูปองร้าน
    const serviceFeePreVat = effectiveSellingPrice * (serviceFeePct / 100);
    // - ค่าธรรมเนียมการชำระเงิน/ธุรกรรม คิดจากยอดรวมที่ผู้ซื้อจ่ายทั้งหมด (รวมค่าส่ง)
    const transactionFeePreVat = orderGrossValue * (transactionRatePct / 100);

    const totalPlatformFeesPreVat = commissionFeePreVat + serviceFeePreVat + transactionFeePreVat;
    const platformVat = totalPlatformFeesPreVat * (vatOnFeePct / 100);
    const totalPlatformFees = totalPlatformFeesPreVat + platformVat;

    // 3. ต้นทุนค่าจัดส่งส่วนต่าง (กรณีร้านช่วยออกค่าส่ง หรือค่าส่งจริงแพงกว่าที่ลูกค้าจ่าย)
    const shippingDifference = Math.max(0, sellerShipping - customerShipping);

    // 4. ต้นทุนรวมทั้งหมด
    const totalDirectCosts = productCost + packagingCost + shopVoucher + shippingDifference + adSpendPerOrder;
    const totalCosts = totalDirectCosts + totalPlatformFees;

    // 5. ยอดเงินโอนเข้าบัญชีร้านค้าจากแพลตฟอร์ม (Net Payout)
    // = ยอดที่ผู้ซื้อจ่าย - ค่าธรรมเนียมแพลตฟอร์ม - ค่าส่งจริงที่ขนส่งหัก
    const netPayout = Math.max(0, orderGrossValue - totalPlatformFees - sellerShipping);

    // 6. กำไรสุทธิ (Net Profit)
    const netProfit = sellingPrice - totalCosts;
    const isProfit = netProfit >= 0;

    // 7. อัตราส่วนทางการเงิน
    const profitMarginPct = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
    const directCostBase = productCost + packagingCost;
    const markupPct = directCostBase > 0 ? (netProfit / directCostBase) * 100 : 0;
    const roiPct = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

    // 8. จุดคุ้มทุน (ราคาขายขั้นต่ำที่ไม่ขาดทุน: Breakeven Selling Price)
    // Breakeven Price P: P * (1 - TotalFeeRate) = productCost + packagingCost + adSpend + shippingDiff
    const totalFeeRateDecimal = ((commissionRatePct + serviceFeePct + transactionRatePct) * (1 + vatOnFeePct / 100)) / 100;
    let breakevenPrice = 0;
    if (totalFeeRateDecimal < 0.99) {
        const requiredCost = productCost + packagingCost + adSpendPerOrder + shippingDifference;
        breakevenPrice = requiredCost / (1 - totalFeeRateDecimal);
    }

    return {
        platform,
        sellingPrice,
        productCost,
        packagingCost,
        shopVoucher,
        customerShipping,
        sellerShipping,
        adSpendPerOrder,
        commissionRatePct,
        serviceFeePct,
        transactionRatePct,
        isVatApplied,
        vatOnFeePct,
        effectiveSellingPrice,
        orderGrossValue,
        commissionFeePreVat,
        serviceFeePreVat,
        transactionFeePreVat,
        totalPlatformFeesPreVat,
        platformVat,
        totalPlatformFees,
        shippingDifference,
        totalDirectCosts,
        totalCosts,
        netPayout,
        netProfit,
        isProfit,
        profitMarginPct,
        markupPct,
        roiPct,
        breakevenPrice
    };
}

/* -----------------------------------------------------------
 * UI RENDERER: กำไรสุทธิขายของออนไลน์ & Shopee/TikTok Fees
 * ----------------------------------------------------------- */
function renderEcommerceProfitTool(container) {
    const st = appState.ecommerce_profit || {
        platform: 'shopee',
        sellingPrice: '350',
        productCost: '150',
        packagingCost: '10',
        shopVoucher: '0',
        customerShipping: '35',
        sellerShipping: '35',
        adSpendPerOrder: '30',
        commissionRatePct: '5.0',
        serviceFeePct: '4.0',
        transactionRatePct: '3.0',
        isVatApplied: 'yes'
    };

    const calc = calculateEcommerceProfit({
        platform: st.platform,
        sellingPrice: parseNumericInput(st.sellingPrice),
        productCost: parseNumericInput(st.productCost),
        packagingCost: parseNumericInput(st.packagingCost),
        shopVoucher: parseNumericInput(st.shopVoucher),
        customerShipping: parseNumericInput(st.customerShipping),
        sellerShipping: parseNumericInput(st.sellerShipping),
        adSpendPerOrder: parseNumericInput(st.adSpendPerOrder),
        commissionRatePct: parseNumericInput(st.commissionRatePct),
        serviceFeePct: parseNumericInput(st.serviceFeePct),
        transactionRatePct: parseNumericInput(st.transactionRatePct),
        isVatApplied: st.isVatApplied !== 'no'
    });

    const isShopee = st.platform === 'shopee';
    const isLazada = st.platform === 'lazada';
    const isTiktok = st.platform === 'tiktok';
    const isDirect = st.platform === 'direct';
    const isCustom = st.platform === 'custom';

    container.innerHTML = `
        <div class="flex flex-col gap-3 p-1">
            <!-- Platform Selector -->
            <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3 space-y-2" style="box-shadow:var(--app-elevation)">
                <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400">เลือกแพลตฟอร์มขายสินค้า</label>
                    <span class="text-[11px] font-semibold text-emerald-600">ค่าธรรมเนียมปี 2025/2026</span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs font-semibold">
                    <button type="button" class="btn-ecom-plat py-2 px-1.5 rounded-lg border text-center transition-all cursor-pointer ${isShopee ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold shadow-sm' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'}" data-plat="shopee">
                        🟠 Shopee
                    </button>
                    <button type="button" class="btn-ecom-plat py-2 px-1.5 rounded-lg border text-center transition-all cursor-pointer ${isLazada ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'}" data-plat="lazada">
                        🔵 Lazada
                    </button>
                    <button type="button" class="btn-ecom-plat py-2 px-1.5 rounded-lg border text-center transition-all cursor-pointer ${isTiktok ? 'bg-neutral-900 border-neutral-900 text-white font-bold shadow-sm' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'}" data-plat="tiktok">
                        ⚫ TikTok
                    </button>
                    <button type="button" class="btn-ecom-plat py-2 px-1.5 rounded-lg border text-center transition-all cursor-pointer ${isDirect ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold shadow-sm' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'}" data-plat="direct">
                        🟢 ขายตรง (LINE)
                    </button>
                    <button type="button" class="btn-ecom-plat py-2 px-1.5 rounded-lg border text-center transition-all cursor-pointer ${isCustom ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold shadow-sm' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'}" data-plat="custom">
                        ⚙️ กำหนดเอง
                    </button>
                </div>
            </div>

            <!-- Card 1: ราคาขายและโปรโมชัน -->
            <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3.5 space-y-3" style="box-shadow:var(--app-elevation)">
                <div class="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-1.5 flex justify-between items-center">
                    <span>1. ราคาขายและโปรโมชันหน้าร้าน</span>
                    <span class="text-[11px] font-normal text-neutral-500">ใส่ราคาตั้งขาย</span>
                </div>
                <div>
                    <label class="text-xs font-medium text-neutral-600 block mb-1">ราคาตั้งขายต่อชิ้น (บาท)</label>
                    <div class="relative">
                        <input id="ecomSellingPrice" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.sellingPrice))}" class="airbnb-input w-full font-bold text-base text-[var(--color-ink)] pr-12" placeholder="เช่น 350">
                        <span class="absolute right-3 top-2.5 text-xs text-neutral-400">บาท</span>
                    </div>
                    <!-- Quick Price Step Chips -->
                    <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span class="text-[11px] text-neutral-400">บวกราคา:</span>
                        <button type="button" class="btn-quick-price px-2 py-0.5 text-xs font-medium rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 active:scale-95 transition cursor-pointer" data-add="10">+10</button>
                        <button type="button" class="btn-quick-price px-2 py-0.5 text-xs font-medium rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 active:scale-95 transition cursor-pointer" data-add="20">+20</button>
                        <button type="button" class="btn-quick-price px-2 py-0.5 text-xs font-medium rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 active:scale-95 transition cursor-pointer" data-add="50">+50</button>
                        <button type="button" class="btn-quick-price px-2 py-0.5 text-xs font-medium rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 active:scale-95 transition cursor-pointer" data-add="100">+100</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                        <label class="text-xs font-medium text-neutral-600 block mb-1">คูปองส่วนลดที่ร้านออกให้ (บาท)</label>
                        <input id="ecomShopVoucher" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.shopVoucher))}" class="airbnb-input w-full text-xs" placeholder="เช่น 20 (ถ้าไม่มีใส่ 0)">
                    </div>
                    <div>
                        <label class="text-xs font-medium text-neutral-600 block mb-1">ค่าส่งที่ลูกค้าจ่ายหน้าร้าน (บาท)</label>
                        <input id="ecomCustomerShipping" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.customerShipping))}" class="airbnb-input w-full text-xs" placeholder="เช่น 35">
                    </div>
                </div>
            </div>

            <!-- Card 2: ต้นทุนสินค้าและการดำเนินการ -->
            <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3.5 space-y-3" style="box-shadow:var(--app-elevation)">
                <div class="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-1.5">
                    2. ต้นทุนสินค้า ค่าแพ็ค และค่าโฆษณา
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                        <label class="text-xs font-medium text-neutral-600 block mb-1">ราคาทุนสินค้า / ผลิต (บาท)</label>
                        <input id="ecomProductCost" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.productCost))}" class="airbnb-input w-full text-xs font-semibold" placeholder="เช่น 150">
                    </div>
                    <div>
                        <label class="text-xs font-medium text-neutral-600 block mb-1">ค่ากล่อง / เทป / ซองแพ็ค (บาท)</label>
                        <input id="ecomPackagingCost" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.packagingCost))}" class="airbnb-input w-full text-xs" placeholder="เช่น 10">
                    </div>
                    <div>
                        <label class="text-xs font-medium text-neutral-600 block mb-1">ค่าส่งจริงที่ขนส่งหัก (บาท)</label>
                        <input id="ecomSellerShipping" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.sellerShipping))}" class="airbnb-input w-full text-xs" placeholder="เช่น 35">
                    </div>
                    <div>
                        <label class="text-xs font-medium text-neutral-600 block mb-1">งบยิงแอด/โฆษณาเฉลี่ยต่อออเดอร์ (บาท)</label>
                        <input id="ecomAdSpend" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.adSpendPerOrder))}" class="airbnb-input w-full text-xs" placeholder="เช่น 30 (ถ้าไม่ยิงใส่ 0)">
                    </div>
                </div>
            </div>

            <!-- Card 3: อัตราค่าธรรมเนียมแพลตฟอร์ม -->
            <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3.5 space-y-2.5" style="box-shadow:var(--app-elevation)">
                <div class="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-1.5 flex justify-between items-center">
                    <span>3. โครงสร้างค่าธรรมเนียม (${escapeHTML(calc.platform.toUpperCase())})</span>
                    <label class="flex items-center gap-1.5 text-[11px] text-neutral-600 cursor-pointer">
                        <input id="ecomVatCheck" type="checkbox" ${calc.isVatApplied ? 'checked' : ''} class="rounded border-neutral-300 text-emerald-600">
                        <span>คิด VAT 7% เพิ่มบนค่าธรรมเนียม</span>
                    </label>
                </div>
                <div class="grid grid-cols-3 gap-2 text-xs">
                    <div>
                        <label class="text-[11px] text-neutral-500 block mb-1">คอมมิชชัน (%)</label>
                        <input id="ecomCommission" type="number" step="0.1" value="${st.commissionRatePct}" class="airbnb-input w-full text-xs text-center font-semibold">
                    </div>
                    <div>
                        <label class="text-[11px] text-neutral-500 block mb-1">โปรแกรมส่งฟรี (%)</label>
                        <input id="ecomService" type="number" step="0.1" value="${st.serviceFeePct}" class="airbnb-input w-full text-xs text-center font-semibold">
                    </div>
                    <div>
                        <label class="text-[11px] text-neutral-500 block mb-1">ธุรกรรม/ชำระเงิน (%)</label>
                        <input id="ecomTransaction" type="number" step="0.1" value="${st.transactionRatePct}" class="airbnb-input w-full text-xs text-center font-semibold">
                    </div>
                </div>
            </div>

            <!-- HERO SUMMARY CARD -->
            <div class="rounded-[var(--app-card-radius)] p-4 border ${calc.isProfit ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-red-50/70 border-red-300 text-red-950'} space-y-3" style="box-shadow:var(--app-elevation)">
                <div class="flex items-center justify-between">
                    <div>
                        <span class="text-xs uppercase font-bold tracking-wider ${calc.isProfit ? 'text-emerald-700' : 'text-red-700'}">
                            ${calc.isProfit ? '💰 กำไรสุทธิต่อออเดอร์ (Net Profit)' : '⚠️ ขาดทุนต่อออเดอร์ (Net Loss)'}
                        </span>
                        <div class="text-2xl sm:text-3xl font-extrabold mt-0.5 ${calc.isProfit ? 'text-emerald-700' : 'text-red-700'}">
                            ${formatMoney(calc.netProfit)} บาท
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="inline-block px-2.5 py-1 text-xs font-bold rounded-full ${calc.isProfit ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'}">
                            Margin ${formatNum(calc.profitMarginPct, 1)}%
                        </span>
                        <div class="text-[11px] text-neutral-500 mt-1">
                            Markup: ${formatNum(calc.markupPct, 1)}%
                        </div>
                    </div>
                </div>

                <!-- Sub KPI Grid -->
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-black/10">
                    <div class="bg-white/80 rounded-lg p-2.5 border border-black/5">
                        <div class="text-[11px] text-neutral-500 font-medium">ราคาขายขั้นต่ำที่ไม่ขาดทุน (Breakeven)</div>
                        <div class="text-base font-bold text-[var(--color-ink)] mt-0.5">${formatMoney(calc.breakevenPrice)} ฿</div>
                        <div class="text-[10px] text-neutral-400">ขายต่ำกว่านี้จะเริ่มเข้าเนื้อ</div>
                    </div>
                    <div class="bg-white/80 rounded-lg p-2.5 border border-black/5">
                        <div class="text-[11px] text-neutral-500 font-medium">เงินโอนเข้าบัญชีจริง (Net Payout)</div>
                        <div class="text-base font-bold text-emerald-800 mt-0.5">${formatMoney(calc.netPayout)} ฿</div>
                        <div class="text-[10px] text-neutral-400">หลังหักค่าธรรมเนียมและค่าส่ง</div>
                    </div>
                </div>
            </div>

            <!-- ITEMIZED COST BREAKDOWN -->
            <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3.5 space-y-2 text-xs" style="box-shadow:var(--app-elevation)">
                <div class="font-bold text-neutral-800 border-b border-neutral-100 pb-1.5 flex justify-between">
                    <span>ตารางแจกแจงค่าธรรมเนียมและต้นทุน</span>
                    <span>สัดส่วน</span>
                </div>
                <div class="flex justify-between py-0.5">
                    <span class="text-neutral-600">1. ต้นทุนตัวสินค้า (COGS)</span>
                    <b class="text-neutral-800">${formatMoney(calc.productCost)} ฿ (${calc.sellingPrice > 0 ? formatNum((calc.productCost / calc.sellingPrice) * 100, 1) : 0}%)</b>
                </div>
                <div class="flex justify-between py-0.5">
                    <span class="text-neutral-600">2. ค่ากล่องและบรรจุภัณฑ์</span>
                    <b class="text-neutral-800">${formatMoney(calc.packagingCost)} ฿</b>
                </div>
                <div class="flex justify-between py-0.5">
                    <span class="text-neutral-600">3. คูปองส่วนลดร้านค้า</span>
                    <b class="text-neutral-800">${formatMoney(calc.shopVoucher)} ฿</b>
                </div>
                <div class="flex justify-between py-0.5">
                    <span class="text-neutral-600">4. รวมค่าธรรมเนียมแพลตฟอร์ม ${calc.isVatApplied ? '(รวม VAT 7%)' : ''}</span>
                    <b class="text-red-600">-${formatMoney(calc.totalPlatformFees)} ฿ (${calc.sellingPrice > 0 ? formatNum((calc.totalPlatformFees / calc.sellingPrice) * 100, 1) : 0}%)</b>
                </div>
                <div class="pl-3 space-y-0.5 text-[11px] text-neutral-500 border-l-2 border-red-200">
                    <div class="flex justify-between">
                        <span>• ค่าคอมมิชชัน (${calc.commissionRatePct}%)</span>
                        <span>${formatMoney(calc.commissionFeePreVat)} ฿</span>
                    </div>
                    <div class="flex justify-between">
                        <span>• ค่าบริการโปรแกรมส่งฟรี (${calc.serviceFeePct}%)</span>
                        <span>${formatMoney(calc.serviceFeePreVat)} ฿</span>
                    </div>
                    <div class="flex justify-between">
                        <span>• ค่าธุรกรรมการชำระเงิน (${calc.transactionRatePct}%)</span>
                        <span>${formatMoney(calc.transactionFeePreVat)} ฿</span>
                    </div>
                    ${calc.isVatApplied ? `
                        <div class="flex justify-between text-neutral-600">
                            <span>• ภาษีมูลค่าเพิ่ม (VAT 7% บนค่าธรรมเนียม)</span>
                            <span>${formatMoney(calc.platformVat)} ฿</span>
                        </div>
                    ` : ''}
                </div>
                <div class="flex justify-between py-0.5">
                    <span class="text-neutral-600">5. ค่าขนส่งส่วนต่างที่ร้านออกเพิ่ม</span>
                    <b class="text-neutral-800">${formatMoney(calc.shippingDifference)} ฿</b>
                </div>
                <div class="flex justify-between py-0.5">
                    <span class="text-neutral-600">6. ค่ายิงแอด/โฆษณาต่อออเดอร์</span>
                    <b class="text-neutral-800">${formatMoney(calc.adSpendPerOrder)} ฿</b>
                </div>
                <div class="border-t border-neutral-200 pt-1.5 flex justify-between font-bold text-neutral-900">
                    <span>รวมต้นทุนค่าใช้จ่ายทั้งหมด (Total Costs)</span>
                    <span class="text-red-700">${formatMoney(calc.totalCosts)} ฿</span>
                </div>

                <div class="flex justify-end pt-2">
                    <button id="btnPrintEcomReceipt" type="button" class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm">
                        🖨️ พิมพ์ใบสรุปกำไร / บันทึก PDF
                    </button>
                </div>
            </div>
        </div>
    `;

    // Event Handlers
    // 1. Platform switcher
    container.querySelectorAll('.btn-ecom-plat').forEach(btn => {
        btn.addEventListener('click', () => {
            const plat = btn.dataset.plat;
            st.platform = plat;
            if (plat === 'shopee') {
                st.commissionRatePct = '5.0';
                st.serviceFeePct = '4.0';
                st.transactionRatePct = '3.0';
                st.isVatApplied = 'yes';
            } else if (plat === 'lazada') {
                st.commissionRatePct = '5.0';
                st.serviceFeePct = '3.0';
                st.transactionRatePct = '3.0';
                st.isVatApplied = 'yes';
            } else if (plat === 'tiktok') {
                st.commissionRatePct = '4.0';
                st.serviceFeePct = '0.0';
                st.transactionRatePct = '3.0';
                st.isVatApplied = 'yes';
            } else if (plat === 'direct') {
                st.commissionRatePct = '0.0';
                st.serviceFeePct = '0.0';
                st.transactionRatePct = '0.0';
                st.isVatApplied = 'no';
            }
            persistAppState();
            renderActiveTool();
        });
    });

    // 2. Quick price step adders
    container.querySelectorAll('.btn-quick-price').forEach(btn => {
        btn.addEventListener('click', () => {
            const add = parseFloat(btn.dataset.add) || 0;
            const current = parseNumericInput(st.sellingPrice) || 0;
            st.sellingPrice = formatInputDisplay(String(current + add));
            persistAppState();
            renderActiveTool();
        });
    });

    // 3. Inputs formatting and binding
    const bindInput = (id, stateKey) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('change', () => {
            st[stateKey] = input.value;
            persistAppState();
            renderActiveTool();
        });
        input.addEventListener('blur', () => {
            const formatted = formatInputDisplay(input.value);
            st[stateKey] = formatted;
            input.value = formatted;
            persistAppState();
        });
    };

    bindInput('ecomSellingPrice', 'sellingPrice');
    bindInput('ecomProductCost', 'productCost');
    bindInput('ecomPackagingCost', 'packagingCost');
    bindInput('ecomShopVoucher', 'shopVoucher');
    bindInput('ecomCustomerShipping', 'customerShipping');
    bindInput('ecomSellerShipping', 'sellerShipping');
    bindInput('ecomAdSpend', 'adSpendPerOrder');

    // Fee rates binding
    const bindFee = (id, stateKey) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('change', () => {
            st[stateKey] = input.value;
            st.platform = 'custom';
            persistAppState();
            renderActiveTool();
        });
    };
    bindFee('ecomCommission', 'commissionRatePct');
    bindFee('ecomService', 'serviceFeePct');
    bindFee('ecomTransaction', 'transactionRatePct');

    const vatCheck = document.getElementById('ecomVatCheck');
    if (vatCheck) {
        vatCheck.addEventListener('change', () => {
            st.isVatApplied = vatCheck.checked ? 'yes' : 'no';
            persistAppState();
            renderActiveTool();
        });
    }

    container.querySelector('#btnPrintEcomReceipt')?.addEventListener('click', () => {
        triggerPrintReceipt('ecommerce_profit');
    });

    // Status Banner
    if (calc.sellingPrice <= 0) {
        setStatusBanner('empty', 'กรุณาระบุราคาตั้งขายต่อชิ้นเพื่อคำนวณกำไรและค่าธรรมเนียม');
    } else if (calc.isProfit) {
        setStatusBanner('success', `กำไรสุทธิ <b>${formatMoney(calc.netProfit)} บาท/ออเดอร์</b> (Margin ${formatNum(calc.profitMarginPct, 1)}%) · เงินโอนเข้าบัญชี ${formatMoney(calc.netPayout)} บาท`);
    } else {
        setStatusBanner('empty', `⚠️ ขาดทุน <b>${formatMoney(Math.abs(calc.netProfit))} บาท</b> · ราคาขายขั้นต่ำที่ไม่ขาดทุนคือ ${formatMoney(calc.breakevenPrice)} บาท`);
    }
}

(function(root) {
    const exportsObj = {
        renderVatTool,
        renderVatWhtTool,
        renderPercentTool,
        renderSalaryTool,
        calculateEcommerceProfit,
        renderEcommerceProfitTool
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
