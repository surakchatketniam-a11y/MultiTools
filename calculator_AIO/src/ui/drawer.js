// ==============================================================
// Multitools Calculator - Drawer, Tool Menu & Search
// ==============================================================


/**************************************************************
 * 4. SIDEBAR MENU RENDERING & NAVIGATION
 * ----------------------------------------------------------- */
function openSidebar() {
    if (typeof document === 'undefined') return;
    document.getElementById('sidebarDrawer')?.classList.add('open');
    document.getElementById('sidebarBackdrop')?.classList.add('open');
}

function closeSidebar() {
    if (typeof document === 'undefined') return;
    document.getElementById('sidebarDrawer')?.classList.remove('open');
    document.getElementById('sidebarBackdrop')?.classList.remove('open');
}

function renderSidebarMenu() {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') return;
    const favSection = document.getElementById('sidebarFavSection');
    const favContainer = document.getElementById('sidebarFavList');
    const categoriesContainer = document.getElementById('sidebarCategoriesContainer');
    const searchResults = document.getElementById('sidebarSearchResults');
    const searchResultList = document.getElementById('sidebarSearchResultList');
    const searchResultHeader = document.getElementById('sidebarSearchResultHeader');
    const searchInput = document.getElementById('sidebarSearchInput');
    const searchClearBtn = document.getElementById('sidebarSearchClearBtn');
    const allContainer = document.getElementById('sidebarAllList');

    const query = (searchInput?.value || '').trim().toLowerCase();
    const stored = JSON.parse(localStorage.getItem('calc_pwa_favorites') || '[]');
    const pinned = stored.length ? stored : TOOLS_CATALOG.filter(item => item.category === 'fav').map(item => item.id);

    // Update Dynamic Count in Drawer & Footer
    const brandCountEl = document.getElementById('sidebarBrandCount');
    if (brandCountEl) brandCountEl.textContent = TOOLS_CATALOG.length;
    const footerCountEl = document.getElementById('footerCatalogCount');
    if (footerCountEl) footerCountEl.textContent = `${TOOLS_CATALOG.length} in 1`;

    function createToolButton(tool) {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isActive = appState.activeToolId === tool.id;
        btn.className = `sidebar-item ${isActive ? 'active-tool' : ''}`;
        const isPinned = pinned.includes(tool.id);
        btn.innerHTML = `<span>${escapeHTML(tool.menuTitle)}</span><button type="button" class="ml-auto p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-sm opacity-70 hover:opacity-100 transition rounded-full hover:bg-black/5" data-pin="${tool.id}" title="${isPinned ? 'เลิกปักหมุด' : 'ปักหมุด'}" aria-label="${isPinned ? 'เลิกปักหมุด' : 'ปักหมุด'} ${escapeHTML(tool.menuTitle)}">${isPinned ? '♥' : '♡'}</button>`;
        btn.addEventListener('click', () => {
            selectTool(tool.id);
            closeSidebar();
        });
        btn.querySelector('[data-pin]').addEventListener('click', (event) => {
            event.stopPropagation();
            const next = pinned.includes(tool.id) ? pinned.filter(id => id !== tool.id) : [...pinned, tool.id];
            localStorage.setItem('calc_pwa_favorites', JSON.stringify(next));
            renderSidebarMenu();
        });
        return btn;
    }

    if (favContainer) favContainer.innerHTML = '';
    if (allContainer) allContainer.innerHTML = '';
    if (categoriesContainer) categoriesContainer.innerHTML = '';
    if (searchResultList) searchResultList.innerHTML = '';

    if (query) {
        // Search Mode
        if (searchClearBtn) searchClearBtn?.classList?.remove('hidden');
        if (favSection) favSection?.classList?.add('hidden');
        if (categoriesContainer) categoriesContainer?.classList?.add('hidden');
        if (searchResults) searchResults?.classList?.remove('hidden');

        const matches = TOOLS_CATALOG.filter(tool => {
            const text = `${tool.menuTitle} ${tool.headerTitle} ${tool.id} ${tool.keywords || ''}`.toLowerCase();
            return text.includes(query);
        });

        if (searchResultHeader) searchResultHeader.textContent = `ผลการค้นหา (${matches.length})`;

        if (matches.length > 0) {
            matches.forEach(tool => searchResultList?.appendChild(createToolButton(tool)));
        } else if (searchResultList) {
            searchResultList.innerHTML = `<div class="px-4 py-6 text-center text-xs text-[var(--color-muted)]">ไม่พบเครื่องมือที่ตรงกับ "${escapeHTML(query)}"</div>`;
        }
    } else {
        // Normal Categorized Mode
        if (searchClearBtn) searchClearBtn?.classList?.add('hidden');
        if (favSection) favSection?.classList?.remove('hidden');
        if (categoriesContainer) categoriesContainer?.classList?.remove('hidden');
        if (searchResults) searchResults?.classList?.add('hidden');

        // 1. Render Pinned Favorites
        const favTools = TOOLS_CATALOG.filter(tool => pinned.includes(tool.id));
        if (favTools.length > 0) {
            favTools.forEach(tool => favContainer?.appendChild(createToolButton(tool)));
            if (favSection) favSection?.classList?.remove('hidden');
        } else if (favSection) {
            favSection?.classList?.add('hidden');
        }

        // 2. Render 5 Job-based Categories
        if (categoriesContainer) {
            TOOL_GROUPS.forEach(group => {
                const groupTools = TOOLS_CATALOG.filter(tool => tool.group === group.id);
                if (!groupTools.length) return;

                const header = document.createElement('div');
                header.className = 'sidebar-category-header mt-2';
                header.textContent = group.name;
                categoriesContainer.appendChild(header);

                const list = document.createElement('div');
                groupTools.forEach(tool => {
                    const btn = createToolButton(tool);
                    list.appendChild(btn);
                });
                categoriesContainer.appendChild(list);
            });
        }
    }
}

function selectTool(toolId) {
    appState.activeToolId = toolId;
    appState.activeFieldIndex = 0;
    renderSidebarMenu();
    renderActiveTool();
}

function getToolSummaryText(toolId, stateObj) {
    const state = stateObj || (typeof appState !== 'undefined' ? appState : {});
    const tool = TOOLS_CATALOG.find(t => t.id === toolId) || { menuTitle: toolId };
    const title = tool.headerTitle || tool.menuTitle;
    const divider = '----------------------------------';

    switch (toolId) {
        case 'vat_wht': {
            const st = state.vat_wht || {};
            const amt = parseNumericInput(st.amount) || 0;
            const rate = parseNumericInput(st.vatRate) || 7;
            const wht = parseNumericInput(st.whtRate) || 3;
            const vatAmt = amt * (rate / 100);
            const whtAmt = amt * (wht / 100);
            const net = amt + vatAmt - whtAmt;
            return `📄 สรุปยอด VAT + หัก ณ ที่จ่าย\n${divider}\n• ยอดค่าบริการ/สินค้า: ${formatMoney(amt)} บาท\n• ภาษีมูลค่าเพิ่ม (VAT ${rate}%): +${formatMoney(vatAmt)} บาท\n• หักภาษี ณ ที่จ่าย (${wht}%): -${formatMoney(whtAmt)} บาท\n${divider}\n💰 ยอดโอนสุทธิ: ${formatMoney(net)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'vat': {
            const st = state.vat || {};
            const amt = parseNumericInput(st.amount) || 0;
            const rate = parseNumericInput(st.rate) || 7;
            const isInclude = st.mode === 'include';
            const baseAmt = isInclude ? amt / (1 + rate / 100) : amt;
            const vatAmt = isInclude ? amt - baseAmt : amt * (rate / 100);
            const totalAmt = isInclude ? amt : amt + vatAmt;
            return `📄 สรุปภาษีมูลค่าเพิ่ม (VAT)\n${divider}\n• โหมด: ${isInclude ? 'ถอด VAT จากยอดรวม' : 'บวก VAT เพิ่ม'}\n• ยอดก่อน VAT: ${formatMoney(baseAmt)} บาท\n• ภาษี VAT (${rate}%): ${formatMoney(vatAmt)} บาท\n${divider}\n💰 ยอดรวมสุทธิ: ${formatMoney(totalAmt)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'discount': {
            const st = state.discount || {};
            const p = numberOrDefault(st.price, 0);
            const d1 = numberOrDefault(st.discountPct, 0);
            const d2 = numberOrDefault(st.extraPct, 0);
            const safeD1 = Math.min(Math.max(d1, 0), 100);
            const safeD2 = Math.min(Math.max(d2, 0), 100);
            const afterFirst = p * (1 - safeD1 / 100);
            const finalPrice = afterFirst * (1 - safeD2 / 100);
            const saved = p - finalPrice;
            const extraStr = d2 > 0 ? ` + On-top ${d2}%` : '';
            return `🏷️ สรุปส่วนลดสินค้า\n${divider}\n• ราคาปกติ: ${formatMoney(p)} บาท\n• ส่วนลด: ${d1}%${extraStr}\n• ประหยัดไป: ${formatMoney(saved)} บาท\n${divider}\n💰 ราคาสุทธิ: ${formatMoney(finalPrice)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'unit_price': {
            const rows = (state.unit_price && state.unit_price.rows) ? state.unit_price.rows : [];
            const defs = (typeof UNIT_DEFINITIONS !== 'undefined') ? UNIT_DEFINITIONS : {
                unit: { key: 'unit', label: 'หน่วย', family: 'general', factor: 1,     baseUnit: 'หน่วย' },
                pcs:  { key: 'pcs',  label: 'ชิ้น',  family: 'count',   factor: 1,     baseUnit: 'ชิ้น' },
                doz:  { key: 'doz',  label: 'โหล',  family: 'count',   factor: 12,    baseUnit: 'ชิ้น' },
                g:    { key: 'g',    label: 'g',    family: 'weight',  factor: 0.001, baseUnit: 'กก.' },
                kg:   { key: 'kg',   label: 'kg',   family: 'weight',  factor: 1,     baseUnit: 'กก.' },
                ml:   { key: 'ml',   label: 'ml',   family: 'volume',  factor: 0.001, baseUnit: 'ลิตร' },
                L:    { key: 'L',    label: 'L',    family: 'volume',  factor: 1,     baseUnit: 'ลิตร' }
            };
            const valid = rows
                .map(r => {
                    const p = parseNumericInput(r.price);
                    const q = parseNumericInput(r.qty);
                    const uKey = r.unit || 'unit';
                    const uDef = defs[uKey] || defs.unit;
                    const baseQty = (Number.isFinite(q) && q > 0) ? q * uDef.factor : NaN;
                    const unitPrice = (Number.isFinite(p) && Number.isFinite(baseQty) && baseQty > 0) ? p / baseQty : NaN;
                    return { id: r.id, p, q, unit: uKey, uDef, baseQty, unitPrice };
                })
                .filter(r => Number.isFinite(r.p) && Number.isFinite(r.q) && r.p > 0 && r.q > 0 && Number.isFinite(r.unitPrice));
            if (!valid.length) return '🛒 สรุปราคาต่อหน่วย\n(กรุณากรอกราคาและจำนวนเพื่อเปรียบเทียบ)';

            const families = new Set(valid.map(v => v.uDef.family));
            if (families.size > 1) {
                const rowTexts = valid.map(v => `• ตัวเลือก ${v.id}: ${formatMoney(v.p)} บาท / ${formatMoney(v.q)} ${v.uDef.label}`);
                return `🛒 สรุปเปรียบเทียบราคาต่อหน่วย\n${divider}\n${rowTexts.join('\n')}\n${divider}\n⚠️ ไม่สามารถเปรียบเทียบข้ามชนิดหน่วยได้ (เช่น น้ำหนัก กับ ปริมาตร)\n(คำนวณโดย Multitools Calculator)`;
            }

            const minPrice = Math.min(...valid.map(v => v.unitPrice));
            const best = valid.find(v => Math.abs(v.unitPrice - minPrice) < 1e-7);
            const baseUnit = valid[0].uDef.baseUnit;
            const rowTexts = valid.map(v => {
                const unitLabel = v.uDef.label;
                const origStr = `${formatMoney(v.p)} บาท / ${formatMoney(v.q)} ${unitLabel}`;
                return `• ตัวเลือก ${v.id}: ${origStr} = ${formatUnitPrice(v.unitPrice)} บาท/${baseUnit}`;
            });
            let comparison = `⭐ ตัวเลือกที่คุ้มที่สุด: ตัวเลือก ${best.id} (${formatUnitPrice(best.unitPrice)} บาท/${baseUnit})`;
            const second = [...valid].sort((a,b) => a.unitPrice - b.unitPrice).find(v => v.unitPrice > minPrice + 1e-7);
            if (second) {
                const pct = (((second.unitPrice - best.unitPrice) / second.unitPrice) * 100).toFixed(1);
                comparison += `\n(ประหยัดกว่าตัวเลือก ${second.id} ${pct}%)`;
            }
            return `🛒 สรุปเปรียบเทียบราคาต่อหน่วย\n${divider}\n${rowTexts.join('\n')}\n${divider}\n${comparison}\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'date_work': {
            const st = state.date_work || {};
            const start = new Date(st.startDate + 'T00:00:00');
            const end = new Date(st.endDate + 'T00:00:00');
            const customHolidays = new Set(String(st.customHolidays || '').split(',').map(v => parseDateInputThai(v.trim(), st.calendarEra)).filter(Boolean));
            const isWorkday = (d) => {
                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const isHoliday = (typeof isThaiOfficialHoliday === 'function') ? isThaiOfficialHoliday(d) : ['01-01', '04-06', '05-01', '06-03', '07-28', '08-12', '10-13', '10-23', '12-05', '12-10', '12-31'].includes(iso.slice(5));
                return (st.workDays || [1,2,3,4,5]).includes(d.getDay()) && !(st.includeThaiHolidays && isHoliday) && !customHolidays.has(iso);
            };
            let resultText = '';
            if (st.mode === 'between') {
                const count = countWorkingDays(start, end, isWorkday);
                resultText = `• จำนวนวันทำการจริง: ${count.toLocaleString('th-TH')} วัน`;
            } else {
                const target = offsetWorkingDays(start, integerOrDefault(st.offset, 0), isWorkday);
                resultText = `• วันที่เป้าหมาย (${st.offset >= 0 ? '+' : ''}${st.offset} วันทำการ): ${formatThaiDate(formatLocalDate(target))}`;
            }
            return `📅 สรุปวันทำการ (Workdays)\n${divider}\n• วันเริ่มต้น: ${st.startDate}\n${st.mode === 'between' ? `• วันสิ้นสุด: ${st.endDate}\n` : ''}${resultText}\n• กติกา: ตัดเสาร์-อาทิตย์และวันหยุดราชการไทย\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'date_calc': {
            const st = state.date_calc || {};
            const d1 = new Date(st.startDate + 'T00:00:00');
            const d2 = new Date(st.endDate + 'T00:00:00');
            const diffDays = Math.round(Math.abs(d2 - d1) / 86400000);
            return `📅 สรุปคำนวณวันที่ & อายุ\n${divider}\n• วันที่เริ่มต้น: ${st.startDate}\n• วันที่สิ้นสุด: ${st.endDate}\n${divider}\n• ระยะห่าง: ${diffDays.toLocaleString('th-TH')} วัน\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'loan': {
            const st = state.loan || {};
            const P = numberOrDefault(st.principal, 0);
            const annualRate = numberOrDefault(st.interestRate, 0);
            const n = integerOrDefault(st.months, 0);
            const extra = numberOrDefault(st.extra, 0);
            const rateAfter = numberOrDefault(st.rateAfter, annualRate);
            const promoMonths = Math.max(0, integerOrDefault(st.promoMonths, 0));
            let monthlyPay = 0, totalPay = 0, totalInterest = 0;
            if (P > 0 && n > 0) {
                let bal = P, m = 0, payment = 0, previousRate = null;
                while (bal > 0.01 && m < 1200 && m < n + 120) {
                    const currentRate = st.rateType === 'step' && m >= promoMonths ? rateAfter : annualRate;
                    const r = (currentRate / 100) / 12;
                    const remaining = Math.max(1, n - m);
                    if (payment === 0 || previousRate !== currentRate) {
                        payment = st.calcMethod === 'flat' ? (P / n) + (P * currentRate / 100 / 12) : (r === 0 ? bal / remaining : bal * (r * Math.pow(1 + r, remaining)) / (Math.pow(1 + r, remaining) - 1));
                        previousRate = currentRate;
                    }
                    const interest = st.calcMethod === 'flat' ? (P * currentRate / 100 / 12) : (bal * r);
                    const principalPart = Math.min(bal, Math.max(0, payment + extra - interest));
                    if (principalPart <= 0) break;
                    const actualPayment = interest + principalPart;
                    if (m === 0) monthlyPay = actualPayment;
                    totalPay += actualPayment;
                    totalInterest += interest;
                    bal -= principalPart;
                    m++;
                }
            }
            const methodLabel = st.calcMethod === 'flat' ? 'เงินงวดคงที่' : 'ลดต้นลดดอก';
            return `🏦 สรุปยอดผ่อนเงินกู้ & ผ่อนชำระ\n${divider}\n• วงเงินกู้: ${formatMoney(P)} บาท\n• ดอกเบี้ย: ${annualRate}% ต่อปี (${methodLabel})\n• ระยะเวลา: ${n} เดือน\n${divider}\n💰 ค่างวด: ${formatMoney(monthlyPay)} บาท/เดือน\n• ดอกเบี้ยรวม: +${formatMoney(totalInterest)} บาท\n• ยอดชำระรวม: ${formatMoney(totalPay)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'savings': {
            const st = state.savings || {};
            const init = numberOrDefault(st.initial, 0);
            const monthly = numberOrDefault(st.monthly, 0);
            const rate = numberOrDefault(st.interestRate, 0);
            const retirementYears = Math.max(0, numberOrDefault(st.retirementAge, 0) - numberOrDefault(st.currentAge, 0));
            const years = st.mode === 'retirement' ? retirementYears : numberOrDefault(st.years, 0);
            const annualIncrease = numberOrDefault(st.annualIncrease, 0);
            const months = Math.round(years * 12);
            const r = (rate / 100) / 12;
            let totalBalance = init, totalPrincipal = init;
            for (let m = 0; m < months; m++) {
                const currentMonthly = monthly * Math.pow(1 + annualIncrease / 100, Math.floor(m / 12));
                totalBalance = (totalBalance + currentMonthly) * (1 + r);
                totalPrincipal += currentMonthly;
            }
            const interestEarned = Math.max(0, totalBalance - totalPrincipal);
            return `💰 สรุปการวางแผนเงินออม\n${divider}\n• เงินก้อนเริ่มต้น: ${formatMoney(init)} บาท\n• ฝากเพิ่มรายเดือน: ${formatMoney(monthly)} บาท/เดือน\n• ระยะเวลา: ${years} ปี (${rate}% ต่อปี)\n${divider}\n• เงินต้นสะสม: ${formatMoney(totalPrincipal)} บาท\n• ดอกเบี้ยสะสม: +${formatMoney(interestEarned)} บาท\n💰 ยอดเงินออมสุทธิ: ${formatMoney(totalBalance)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'currency': {
            const st = state.currency || { ratesInTHB: {} };
            const amt = parseNumericInput(st.amount) || 0;
            const fromRate = st.ratesInTHB[st.from] || 1;
            const toRate = st.ratesInTHB[st.to] || 1;
            const customRate = parseNumericInput(st.customRateToTHB);
            const effectiveRate = (!isNaN(customRate) && customRate > 0) ? customRate : (fromRate / toRate);
            const converted = amt * effectiveRate;
            return `💱 สรุปอัตราแลกเปลี่ยนสกุลเงิน\n${divider}\n• ${formatNum(amt, 2)} ${st.from} = ${formatMoney(converted)} ${st.to}\n• เรทที่ใช้: 1 ${st.from} = ${formatNum(effectiveRate, 4)} ${st.to}\n• แหล่งข้อมูล: ${st.rateSource || 'Frankfurter'}\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'tip': {
            const st = state.tip || {};
            const bill = parseNumericInput(st.bill) || 0;
            const tipPct = parseNumericInput(st.tipPct) || 0;
            const people = Math.max(1, integerOrDefault(st.people, 1));
            const tipAmt = bill * (tipPct / 100);
            const total = bill + tipAmt;
            const perPerson = total / people;
            return `🍽️ สรุปหารค่าอาหาร / ทิป\n${divider}\n• ยอดบิล: ${formatMoney(bill)} บาท\n• ทิป (${tipPct}%): ${formatMoney(tipAmt)} บาท\n• ยอดรวมทั้งสิ้น: ${formatMoney(total)} บาท\n• จำนวนคน: ${people} คน\n${divider}\n💰 จ่ายคนละ: ${formatMoney(perPerson)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'salary': {
            const st = state.salary || {};
            const income = parseNumericInput(st.income) || 0;
            const needs = income * (numberOrDefault(st.needsPct, 50) / 100);
            const wants = income * (numberOrDefault(st.wantsPct, 30) / 100);
            const savings = income * (numberOrDefault(st.savingsPct, 20) / 100);
            return `💼 สรุปจัดสรรเงินเดือน (50/30/20)\n${divider}\n• เงินเดือนสุทธิ: ${formatMoney(income)} บาท\n• รายจ่ายจำเป็น (50%): ${formatMoney(needs)} บาท\n• เพื่อความสุข/ไลฟ์สไตล์ (30%): ${formatMoney(wants)} บาท\n• เงินออม/ลงทุน (20%): ${formatMoney(savings)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'fuel_cost': {
            const st = state.fuel_cost || {};
            const dist = parseNumericInput(st.distance) || 0;
            const eff = parseNumericInput(st.efficiency) || 15;
            const price = parseNumericInput(st.oilPrice) || 35.5;
            const liters = eff > 0 ? dist / eff : 0;
            const totalCost = liters * price;
            return `⛽ สรุปค่าน้ำมันเดินทาง\n${divider}\n• ระยะทาง: ${formatNum(dist, 1)} กม.\n• อัตราสิ้นเปลือง: ${formatNum(eff, 1)} กม./ลิตร\n• ราคาน้ำมัน: ${formatMoney(price)} บาท/ลิตร\n• ปริมาณน้ำมัน: ${formatNum(liters, 2)} ลิตร\n${divider}\n💰 ค่าน้ำมันรวม: ${formatMoney(totalCost)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        default: {
            const statusText = document.getElementById('sharedStatusText')?.innerText?.trim();
            return `📋 สรุปผล: ${title}\n${divider}\n${statusText || 'คำนวณเรียบร้อยแล้ว'}\n(คำนวณโดย Multitools Calculator)`;
        }
    }
}

async function copyCurrentToolSummary() {
    const curId = (typeof appState !== "undefined" ? appState.activeToolId : "");
    const text = getToolSummaryText(curId, typeof appState !== "undefined" ? appState : undefined);
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        const btn = document.getElementById('headerCopyBtn');
        const btnText = document.getElementById('headerCopyText');
        if (btnText && btn) {
            btnText.textContent = '✓ คัดลอกแล้ว';
            btn.classList.add('!bg-green-100', '!border-green-500', '!text-green-700');
            setTimeout(() => {
                btnText.textContent = 'คัดลอกสรุป';
                btn.classList.remove('!bg-green-100', '!border-green-500', '!text-green-700');
            }, 2000);
        }
    } catch (e) {
        console.error(e);
    }
}

if (typeof document !== 'undefined') {
    const addSafe = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el && typeof el.addEventListener === 'function') {
            el.addEventListener(event, handler);
        }
    };
    addSafe('headerCopyBtn', 'click', copyCurrentToolSummary);
    addSafe('hamburgerBtn', 'click', openSidebar);
    addSafe('sidebarBackdrop', 'click', closeSidebar);

    const sidebarSearchInput = document.getElementById('sidebarSearchInput');
    if (sidebarSearchInput && typeof sidebarSearchInput.addEventListener === 'function') {
        sidebarSearchInput.addEventListener('input', () => renderSidebarMenu());
        sidebarSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                sidebarSearchInput.value = '';
                renderSidebarMenu();
                if (typeof sidebarSearchInput.blur === 'function') sidebarSearchInput.blur();
            }
        });
    }
    const clearBtn = document.getElementById('sidebarSearchClearBtn');
    if (clearBtn && typeof clearBtn.addEventListener === 'function') {
        clearBtn.addEventListener('click', () => {
            if (sidebarSearchInput) {
                sidebarSearchInput.value = '';
                renderSidebarMenu();
                if (typeof sidebarSearchInput.focus === 'function') sidebarSearchInput.focus();
            }
        });
    }
}

(function(root) {
    const exportsObj = {
        openSidebar,
        closeSidebar,
        renderSidebarMenu,
        selectTool,
        getToolSummaryText,
        copyCurrentToolSummary
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
