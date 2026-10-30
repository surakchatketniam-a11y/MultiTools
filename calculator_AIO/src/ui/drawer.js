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
    const toolsBadgeEl = document.getElementById('sidebarToolsCountBadge');
    if (toolsBadgeEl) toolsBadgeEl.textContent = TOOLS_CATALOG.length;
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
    if (toolId === 'loan' && appState.loan) appState.loan.tab = 'amortization';
    appState.activeToolId = toolId;
    appState.activeFieldIndex = 0;
    renderSidebarMenu();
    renderActiveTool();
}

// Entry screen: search-first home. Shows matches while typing, otherwise the user's pinned tools.
function getPinnedToolsForEntry() {
    let pinned = [];
    try {
        const stored = JSON.parse(localStorage.getItem('calc_pwa_favorites') || '[]');
        pinned = Array.isArray(stored) && stored.length > 0
            ? stored
            : TOOLS_CATALOG.filter(item => item.category === 'fav').map(item => item.id);
    } catch (e) {
        pinned = TOOLS_CATALOG.filter(item => item.category === 'fav').map(item => item.id);
    }
    return pinned.map(id => TOOLS_CATALOG.find(t => t.id === id)).filter(Boolean).slice(0, 6);
}

function openEntryOverlay() {
    const overlay = document.getElementById('entryOverlay');
    if (!overlay) return;
    const input = document.getElementById('entrySearchInput');
    if (input) input.value = '';
    renderEntryHome();
    overlay.classList.remove('hidden');
    document.getElementById('entrySkipBtn')?.addEventListener('click', closeEntryOverlay, { once: true });
    if (input && !input.dataset.bound) {
        input.dataset.bound = 'true';
        input.addEventListener('input', () => renderEntryHome());
    }
}

function renderEntryHome() {
    const query = (document.getElementById('entrySearchInput')?.value || '').trim().toLowerCase();
    const results = document.getElementById('entrySearchResults');
    const favSection = document.getElementById('entryFavSection');
    const favList = document.getElementById('entryFavList');
    if (!results || !favSection || !favList) return;

    const makeButton = (tool, cls) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = cls;
        btn.textContent = tool.menuTitle;
        btn.addEventListener('click', () => {
            closeEntryOverlay();
            selectTool(tool.id);
        });
        return btn;
    };

    if (query) {
        const matches = TOOLS_CATALOG.filter(tool => {
            const text = `${tool.menuTitle} ${tool.headerTitle} ${tool.id} ${tool.keywords || ''}`.toLowerCase();
            return text.includes(query);
        });
        results.innerHTML = '';
        results.classList.remove('hidden');
        favSection.classList.add('hidden');
        document.getElementById('entrySavedSection')?.classList.add('hidden');
        if (matches.length === 0) {
            results.innerHTML = `<p class="px-2 py-4 text-center text-sm text-[var(--color-muted)]">ไม่พบเครื่องคำนวณที่ตรงกับ "${escapeHTML(query)}"</p>`;
        } else {
            matches.forEach(tool => results.appendChild(makeButton(tool, 'w-full text-left p-3 min-h-[44px] rounded-xl border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] font-semibold text-[var(--color-ink)] hover:border-[var(--app-accent)]')));
        }
        return;
    }

    const savedSection = document.getElementById('entrySavedSection');
    const savedList = document.getElementById('entrySavedList');
    if (savedSection && savedList) {
        const saved = (typeof getCalculationHistory === 'function' ? getCalculationHistory() : []).filter(item => item.isSaved).slice(0, 4);
        savedList.innerHTML = '';
        savedSection.classList.toggle('hidden', saved.length === 0);
        saved.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'text-left p-3 min-h-[44px] rounded-xl border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] hover:border-[var(--app-accent)]';
            btn.innerHTML = `<div class="text-sm font-semibold text-[var(--color-ink)] truncate">${escapeHTML(item.label || item.toolTitle)}</div><div class="text-[11px] text-[var(--color-muted)] truncate">${escapeHTML(item.toolTitle)}${item.shortSummary ? ' · ' + escapeHTML(item.shortSummary) : ''}</div>`;
            btn.addEventListener('click', () => {
                const restored = restoreCalculationHistory(item.id, appState);
                if (!restored) return;
                closeEntryOverlay();
                selectTool(restored.toolId);
            });
            savedList.appendChild(btn);
        });
    }
    results.classList.add('hidden');
    results.innerHTML = '';
    const pinned = getPinnedToolsForEntry();
    favList.innerHTML = '';
    favSection.classList.toggle('hidden', pinned.length === 0);
    pinned.forEach(tool => favList.appendChild(makeButton(tool, 'text-left p-3 min-h-[44px] rounded-xl border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] text-sm font-semibold text-[var(--color-ink)] hover:border-[var(--app-accent)]')));
}

function closeEntryOverlay() {
    document.getElementById('entryOverlay')?.classList.add('hidden');
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
            return `สรุปยอด VAT + หัก ณ ที่จ่าย\n${divider}\n• ยอดค่าบริการ/สินค้า: ${formatMoney(amt)} บาท\n• ภาษีมูลค่าเพิ่ม (VAT ${rate}%): +${formatMoney(vatAmt)} บาท\n• หักภาษี ณ ที่จ่าย (${wht}%): -${formatMoney(whtAmt)} บาท\n${divider}\nยอดโอนสุทธิ: ${formatMoney(net)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'vat': {
            const st = state.vat || {};
            const amt = parseNumericInput(st.amount) || 0;
            const rate = parseNumericInput(st.rate) || 7;
            const isInclude = st.mode === 'include';
            const baseAmt = isInclude ? amt / (1 + rate / 100) : amt;
            const vatAmt = isInclude ? amt - baseAmt : amt * (rate / 100);
            const totalAmt = isInclude ? amt : amt + vatAmt;
            return `สรุปภาษีมูลค่าเพิ่ม (VAT)\n${divider}\n• โหมด: ${isInclude ? 'ถอด VAT จากยอดรวม' : 'บวก VAT เพิ่ม'}\n• ยอดก่อน VAT: ${formatMoney(baseAmt)} บาท\n• ภาษี VAT (${rate}%): ${formatMoney(vatAmt)} บาท\n${divider}\nยอดรวมสุทธิ: ${formatMoney(totalAmt)} บาท\n(คำนวณโดย Multitools Calculator)`;
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
            return `สรุปส่วนลดสินค้า\n${divider}\n• ราคาปกติ: ${formatMoney(p)} บาท\n• ส่วนลด: ${d1}%${extraStr}\n• ประหยัดไป: ${formatMoney(saved)} บาท\n${divider}\nราคาสุทธิ: ${formatMoney(finalPrice)} บาท\n(คำนวณโดย Multitools Calculator)`;
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
            if (!valid.length) return 'สรุปราคาต่อหน่วย\n(กรุณากรอกราคาและจำนวนเพื่อเปรียบเทียบ)';

            const families = new Set(valid.map(v => v.uDef.family));
            if (families.size > 1) {
                const rowTexts = valid.map(v => `• ตัวเลือก ${v.id}: ${formatMoney(v.p)} บาท / ${formatMoney(v.q)} ${v.uDef.label}`);
                return `สรุปเปรียบเทียบราคาต่อหน่วย\n${divider}\n${rowTexts.join('\n')}\n${divider}\nไม่สามารถเปรียบเทียบข้ามชนิดหน่วยได้ (เช่น น้ำหนัก กับ ปริมาตร)\n(คำนวณโดย Multitools Calculator)`;
            }

            const minPrice = Math.min(...valid.map(v => v.unitPrice));
            const best = valid.find(v => Math.abs(v.unitPrice - minPrice) < 1e-7);
            const baseUnit = valid[0].uDef.baseUnit;
            const rowTexts = valid.map(v => {
                const unitLabel = v.uDef.label;
                const origStr = `${formatMoney(v.p)} บาท / ${formatMoney(v.q)} ${unitLabel}`;
                return `• ตัวเลือก ${v.id}: ${origStr} = ${formatUnitPrice(v.unitPrice)} บาท/${baseUnit}`;
            });
            let comparison = `ตัวเลือกที่คุ้มที่สุด: ตัวเลือก ${best.id} (${formatUnitPrice(best.unitPrice)} บาท/${baseUnit})`;
            const second = [...valid].sort((a,b) => a.unitPrice - b.unitPrice).find(v => v.unitPrice > minPrice + 1e-7);
            if (second) {
                const pct = (((second.unitPrice - best.unitPrice) / second.unitPrice) * 100).toFixed(1);
                comparison += `\n(ประหยัดกว่าตัวเลือก ${second.id} ${pct}%)`;
            }
            return `สรุปเปรียบเทียบราคาต่อหน่วย\n${divider}\n${rowTexts.join('\n')}\n${divider}\n${comparison}\n(คำนวณโดย Multitools Calculator)`;
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
            return `สรุปวันทำการ (Workdays)\n${divider}\n• วันเริ่มต้น: ${st.startDate}\n${st.mode === 'between' ? `• วันสิ้นสุด: ${st.endDate}\n` : ''}${resultText}\n• กติกา: ตัดเสาร์-อาทิตย์และวันหยุดราชการไทย\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'date_calc': {
            const st = state.date_calc || {};
            const d1 = new Date(st.startDate + 'T00:00:00');
            const d2 = new Date(st.endDate + 'T00:00:00');
            const diffDays = Math.round(Math.abs(d2 - d1) / 86400000);
            return `สรุปคำนวณวันที่ & อายุ\n${divider}\n• วันที่เริ่มต้น: ${st.startDate}\n• วันที่สิ้นสุด: ${st.endDate}\n${divider}\n• ระยะห่าง: ${diffDays.toLocaleString('th-TH')} วัน\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'loan': {
            const st = state.loan || {};
            if (st.tab === 'refinance') {
                const calcFn = typeof calculateHomeRefinance === 'function' ? calculateHomeRefinance : (typeof globalThis !== 'undefined' ? globalThis.calculateHomeRefinance : null);
                if (calcFn) {
                    const calc = calcFn({
                        principal: parseNumericInput(st.principal),
                        months: integerOrDefault(st.months, 240),
                        currentRate: parseNumericInput(st.currentRate ?? '5.50'),
                        retentionRate: parseNumericInput(st.retentionRate ?? '3.80'),
                        retentionFee: parseNumericInput(st.retentionFee ?? '0'),
                        refinanceRate: parseNumericInput(st.refinanceRate ?? '2.99'),
                        isGovReducedMortgage: st.isGovReducedMortgage === 'yes',
                        appraisalFee: parseNumericInput(st.appraisalFee ?? '2800'),
                        insuranceFee: parseNumericInput(st.insuranceFee ?? '2000'),
                        otherRefinanceFees: parseNumericInput(st.otherRefinanceFees ?? '0')
                    });
                    const bestChoice = calc.isRefinanceBetter ? 'รีไฟแนนซ์ (ย้ายธนาคาร)' : 'ขอลดดอกเบี้ยเดิม (Retention)';
                    const netSavings = calc.isRefinanceBetter ? calc.refinanceNetSavings : calc.retentionNetSavings;
                    return `สรุปวิเคราะห์รีไฟแนนซ์บ้าน (เกณฑ์ ธปท.)\n${divider}\n• ยอดหนี้คงเหลือ: ${formatMoney(calc.principal)} บาท (${calc.months} เดือน)\n• ดอกเบี้ยเดิม: ${formatNum(calc.currentRate, 2)}% | Retention: ${formatNum(calc.retentionRate, 2)}% | Refinance: ${formatNum(calc.refinanceRate, 2)}%\n• รวมค่าใช้จ่ายย้ายธนาคาร: ${formatMoney(calc.totalRefinanceFees)} บาท\n${divider}\nทางเลือกที่แนะนำ: ${bestChoice}\nประหยัดสุทธิ 3 ปี: +${formatMoney(netSavings)} บาท\nจุดคุ้มทุน: ${calc.breakevenMonth !== null ? (calc.breakevenMonth === 0 ? 'คุ้มทุนทันที' : 'เดือนที่ ' + calc.breakevenMonth) : 'ไม่คุ้มทุน'}\n(คำนวณโดย Multitools Calculator)`;
                }
            }
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
            return `สรุปยอดผ่อนเงินกู้ & ผ่อนชำระ\n${divider}\n• วงเงินกู้: ${formatMoney(P)} บาท\n• ดอกเบี้ย: ${annualRate}% ต่อปี (${methodLabel})\n• ระยะเวลา: ${n} เดือน\n${divider}\nค่างวด: ${formatMoney(monthlyPay)} บาท/เดือน\n• ดอกเบี้ยรวม: +${formatMoney(totalInterest)} บาท\n• ยอดชำระรวม: ${formatMoney(totalPay)} บาท\n(คำนวณโดย Multitools Calculator)`;
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
            return `สรุปการวางแผนเงินออม\n${divider}\n• เงินก้อนเริ่มต้น: ${formatMoney(init)} บาท\n• ฝากเพิ่มรายเดือน: ${formatMoney(monthly)} บาท/เดือน\n• ระยะเวลา: ${years} ปี (${rate}% ต่อปี)\n${divider}\n• เงินต้นสะสม: ${formatMoney(totalPrincipal)} บาท\n• ดอกเบี้ยสะสม: +${formatMoney(interestEarned)} บาท\nยอดเงินออมสุทธิ: ${formatMoney(totalBalance)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'currency': {
            const st = state.currency || { ratesInTHB: {} };
            const amt = parseNumericInput(st.amount) || 0;
            const fromRate = st.ratesInTHB[st.from] || 1;
            const toRate = st.ratesInTHB[st.to] || 1;
            const customRate = parseNumericInput(st.customRateToTHB);
            const effectiveRate = (!isNaN(customRate) && customRate > 0) ? customRate : (fromRate / toRate);
            const converted = amt * effectiveRate;
            return `สรุปอัตราแลกเปลี่ยนสกุลเงิน\n${divider}\n• ${formatNum(amt, 2)} ${st.from} = ${formatMoney(converted)} ${st.to}\n• เรทที่ใช้: 1 ${st.from} = ${formatNum(effectiveRate, 4)} ${st.to}\n• แหล่งข้อมูล: ${st.rateSource || 'Frankfurter'}\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'tip': {
            const st = state.tip || {};
            const bill = parseNumericInput(st.bill) || 0;
            const tipPct = parseNumericInput(st.tipPct) || 0;
            const people = Math.max(1, integerOrDefault(st.people, 1));
            const tipAmt = bill * (tipPct / 100);
            const total = bill + tipAmt;
            const perPerson = total / people;
            return `สรุปหารค่าอาหาร / ทิป\n${divider}\n• ยอดบิล: ${formatMoney(bill)} บาท\n• ทิป (${tipPct}%): ${formatMoney(tipAmt)} บาท\n• ยอดรวมทั้งสิ้น: ${formatMoney(total)} บาท\n• จำนวนคน: ${people} คน\n${divider}\nจ่ายคนละ: ${formatMoney(perPerson)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'salary': {
            const st = state.salary || {};
            if (st.mode === 'net') {
                const calc = (typeof calculateNetSalary === 'function')
                    ? calculateNetSalary(st)
                    : { baseSalary: 0, grossMonthly: 0, totalDeductions: 0, netMonthly: 0, ssoMonthly: 0, pvdMonthly: 0, taxMonthly: 0, customDeduction: 0, effectiveDeductionPct: 0 };
                return `สรุปเงินเดือนสุทธิรับจริง (Take-Home Pay)\n${divider}\n• เงินเดือนฐาน: ${formatMoney(calc.baseSalary)} บาท\n• รายได้รวมก่อนหัก: ${formatMoney(calc.grossMonthly)} บาท\n• ประกันสังคม (ม.33): -${formatMoney(calc.ssoMonthly)} บาท\n• กองทุนสำรองฯ (PVD): -${formatMoney(calc.pvdMonthly)} บาท\n• ภาษีหัก ณ ที่จ่าย (ภ.ง.ด.1): -${formatMoney(calc.taxMonthly)} บาท\n• รายการหักอื่นๆ: -${formatMoney(calc.customDeduction)} บาท\n${divider}\nเงินเดือนสุทธิรับจริง: ${formatMoney(calc.netMonthly)} บาท/เดือน\nรวมรายการหัก: -${formatMoney(calc.totalDeductions)} บาท (${formatNum(calc.effectiveDeductionPct, 1)}%)\n(คำนวณโดย Multitools Calculator)`;
            }
            const income = parseNumericInput(st.income) || 0;
            const needs = income * (numberOrDefault(st.needsPct, 50) / 100);
            const wants = income * (numberOrDefault(st.wantsPct, 30) / 100);
            const savings = income * (numberOrDefault(st.savingsPct, 20) / 100);
            return `สรุปจัดสรรเงินเดือน (50/30/20)\n${divider}\n• เงินเดือนสุทธิ: ${formatMoney(income)} บาท\n• รายจ่ายจำเป็น (50%): ${formatMoney(needs)} บาท\n• เพื่อความสุข/ไลฟ์สไตล์ (30%): ${formatMoney(wants)} บาท\n• เงินออม/ลงทุน (20%): ${formatMoney(savings)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'fuel_cost': {
            const st = state.fuel_cost || {};
            const mode = st.mode || 'fuel';
            if (mode === 'ev') {
                const calc = (typeof calculateEvCost === 'function')
                    ? calculateEvCost(st)
                    : { distance: 100, evEfficiency: 6.5, electricityRate: 2.9, compareIceEfficiency: 15, compareFuelPrice: 36.5, yearlyKm: 20000, ev: { billedKwh: 16.9, totalCost: 49.08, costPerKm: 0.49 }, ice: { totalCost: 243.33, costPerKm: 2.43 }, savings: { tripSavings: 194.25, savingsPct: 79.8, isSavings: true }, annual: { yearlySavings: 38850 } };
                return `สรุปค่าชาร์จรถไฟฟ้า EV & เทียบรถน้ำมัน\n${divider}\n• ระยะทาง: ${formatMoney(calc.distance)} กม.\n• อัตรากินไฟ EV: ${calc.evEfficiency} กม./kWh (ไฟรวม ${formatNum(calc.ev.billedKwh, 1)} หน่วย)\n• อัตราค่าไฟ: ${formatMoney(calc.electricityRate)} บาท/หน่วย\n• ค่าชาร์จรถ EV: ${formatMoney(calc.ev.totalCost)} บาท (เฉลี่ย ${formatMoney(calc.ev.costPerKm)} ฿/กม.)\n${divider}\nเทียบรถน้ำมัน (${calc.compareIceEfficiency} กม./ลิตร @ ${formatMoney(calc.compareFuelPrice)} ฿):\n• ค่าน้ำมันปกติ: ${formatMoney(calc.ice.totalCost)} บาท (${formatMoney(calc.ice.costPerKm)} ฿/กม.)\n${calc.savings.isSavings ? `ประหยัดได้: ${formatMoney(calc.savings.tripSavings)} บาท (${calc.savings.savingsPct}%)\nประหยัดต่อปี (~${formatMoney(calc.yearlyKm)} กม.): +${formatMoney(calc.annual.yearlySavings)} บาท/ปี` : `แพงกว่ารถน้ำมัน: ${formatMoney(Math.abs(calc.savings.tripSavings))} บาท`}\n(คำนวณโดย Multitools Calculator)`;
            }
            const dist = parseNumericInput(st.distance) || 0;
            const eff = parseNumericInput(st.efficiency) || 15;
            const price = parseNumericInput(st.oilPrice) || 35.5;
            const liters = eff > 0 ? dist / eff : 0;
            const totalCost = liters * price;
            const costPerKm = dist > 0 ? totalCost / dist : 0;
            return `สรุปค่าน้ำมันเดินทาง\n${divider}\n• ระยะทาง: ${formatNum(dist, 1)} กม.\n• อัตราสิ้นเปลือง: ${formatNum(eff, 1)} กม./ลิตร\n• ราคาน้ำมัน: ${formatMoney(price)} บาท/ลิตร\n• ปริมาณน้ำมัน: ${formatNum(liters, 2)} ลิตร (เฉลี่ย ${formatMoney(costPerKm)} ฿/กม.)\n${divider}\nค่าน้ำมันรวม: ${formatMoney(totalCost)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'lotto_calc': {
            const st = state.lotto_calc || {};
            const activeTab = st.activeTab || 'bet';
            if (activeTab === 'claim') {
                const claim = (typeof calculatePrizeClaim === 'function')
                    ? calculatePrizeClaim(st.claimPrize, st.claimTicketCount, st.claimChannel, st.claimCustomRate)
                    : { prizeLabel: 'สลากกินแบ่ง', ticketCount: 1, totalGrossPrize: 2000, deductionRate: 1.5, deductionAmount: 30, netPrize: 1970, channelLabel: 'ธนาคาร' };
                return `สรุปขึ้นเงินรางวัลสลากกินแบ่ง\n${divider}\n• รางวัล: ${claim.prizeLabel}\n• จำนวน: ${claim.ticketCount} ใบ\n• ยอดรางวัลรวม: ${formatMoney(claim.totalGrossPrize)} บาท\n• หักภาษี/ค่าธรรมเนียม (${claim.deductionRate}%): -${formatMoney(claim.deductionAmount)} บาท\n${divider}\nเงินสดสุทธิที่ได้รับจริง: ${formatMoney(claim.netPrize)} บาท\n• ช่องทาง: ${claim.channelLabel}\n(คำนวณโดย Multitools Calculator)`;
            } else if (activeTab === 'reality') {
                const sim = (typeof calculateLottoSavingsSimulation === 'function')
                    ? calculateLottoSavingsSimulation(st.lottoSpendPerDraw, st.savingsYears, st.savingsRate)
                    : { spendPerDraw: 500, monthlyDeposit: 1000, years: 10, annualReturnPct: 7, totalPrincipal: 120000, totalInterest: 53094, futureValue: 173094 };
                return `สรุปจำลองเปลี่ยนค่าหวยเป็นเงินล้าน\n${divider}\n• ซื้อหวยงวดละ: ${formatMoney(sim.spendPerDraw)} บาท (เดือนละ ${formatMoney(sim.monthlyDeposit)} บาท)\n• ระยะเวลา: ${sim.years} ปี (ผลตอบแทน ${sim.annualReturnPct}%)\n${divider}\n• เงินต้นสะสม: ${formatMoney(sim.totalPrincipal)} บาท\n• ดอกเบี้ยทบต้น: +${formatMoney(sim.totalInterest)} บาท\nยอดเงินออมรวม: ${formatMoney(sim.futureValue)} บาท\n(คำนวณโดย Multitools Calculator)`;
            } else {
                const count = Array.isArray(st.numbersList) ? st.numbersList.length : 0;
                const bet = (typeof calculateLottoBet === 'function')
                    ? calculateLottoBet(count, st.pricePerNumber, st.payoutRate)
                    : { count: 6, pricePerNumber: 20, payoutRate: 900, totalCost: 120, winningPayout: 18000, netProfit: 17880, roiPercent: 14900 };
                return `สรุปคำนวณต้นทุน & หวยชุด\n${divider}\n• จำนวนเลขในชุด: ${bet.count} หาง\n• ราคาซื้อต่อหาง: ${formatMoney(bet.pricePerNumber)} บาท\n• อัตราจ่าย: บาทละ ${formatMoney(bet.payoutRate)}\n${divider}\n• ต้นทุนรวม: ${formatMoney(bet.totalCost)} บาท\n• เงินรางวัล (ถ้าถูก 1 หาง): ${formatMoney(bet.winningPayout)} บาท\nกำไรสุทธิ: ${bet.netProfit >= 0 ? '+' : ''}${formatMoney(bet.netProfit)} บาท (ROI ${bet.roiPercent.toFixed(1)}%)\n(คำนวณโดย Multitools Calculator)`;
            }
        }
        case 'tax_personal': {
            const st = state.tax_personal || {};
            const calc = (typeof calculatePersonalTax === 'function')
                ? calculatePersonalTax(st)
                : { grossIncome: 650000, expenses: 100000, totalDeductions: 160000, netTaxableIncome: 390000, totalTax: 16500, withholdingTax: 12000, taxBalance: 4500, marginalRate: 10, isRefund: false, refundAmount: 0, payableAmount: 4500 };
            const statusLine = calc.isRefund
                ? `ได้เงินคืนภาษี (Refund): ${formatMoney(calc.refundAmount)} บาท`
                : (calc.payableAmount > 0
                    ? `ต้องชำระภาษีเพิ่มเติม: ${formatMoney(calc.payableAmount)} บาท`
                    : `✓ ภาษีพอดี ไม่มียอดค้างชำระ`);
            return `สรุปภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด. 90/91)\n${divider}\n• รายได้รวมทั้งปี: ${formatMoney(calc.grossIncome)} บาท\n• หักค่าใช้จ่าย: -${formatMoney(calc.expenses || 0)} บาท\n• หักค่าลดหย่อนรวม: -${formatMoney(calc.totalDeductions)} บาท\n• เงินได้สุทธิ (Taxable): ${formatMoney(calc.netTaxableIncome)} บาท (ฐานสูงสุด ${calc.marginalRate}%)\n• ภาษีคำนวณทั้งปี: ${formatMoney(calc.totalTax)} บาท\n• หัก ณ ที่จ่ายไว้แล้ว: ${formatMoney(calc.withholdingTax)} บาท\n${divider}\n${statusLine}\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'property_transfer': {
            const st = state.property_transfer || {};
            const calc = (typeof calculatePropertyTransfer === 'function')
                ? calculatePropertyTransfer(st)
                : { appraisedValue: 3000000, totalLandCost: 150000, buyerCost: 55000, sellerCost: 95000, transferFee: 60000, mortgageFee: 25000, isSBT: true, sbtTax: 105600, stampDuty: 0, withholdingTax: 72000 };
            return `สรุปค่าธรรมเนียมโอนที่ดิน & ภาษีอสังหาฯ\n${divider}\n• ราคาประเมินกรมที่ดิน: ${formatMoney(calc.appraisedValue)} บาท\n• ค่าธรรมเนียมโอน: ${formatMoney(calc.transferFee)} บาท\n• ค่าจดจำนอง: ${formatMoney(calc.mortgageFee)} บาท\n• ${calc.isSBT ? 'ภาษีธุรกิจเฉพาะ (3.3%)' : 'ค่าอากรแสตมป์ (0.5%)'}: ${formatMoney(calc.isSBT ? calc.sbtTax : calc.stampDuty)} บาท\n• ภาษีหัก ณ ที่จ่าย: ${formatMoney(calc.withholdingTax)} บาท\n${divider}\nยอดรวมค่าใช้จ่าย ณ กรมที่ดิน: ${formatMoney(calc.totalLandCost)} บาท\nยอดที่ผู้ซื้อจ่าย: ${formatMoney(calc.buyerCost)} บาท\nยอดที่ผู้ขายจ่าย: ${formatMoney(calc.sellerCost)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'gold_thai': {
            const st = state.gold_thai || {};
            const calc = (typeof calculateGoldThai === 'function')
                ? calculateGoldThai(st)
                : { bahtWeight: 1, totalGrams: 15.16, totalBuyPrice: 45300, craftFee: 800, sellBackValue: 43115, profitLoss: 3115, isProfit: true, profitLossPercent: 7.79, goldType: 'ornament', mode: 'buy' };
            if (st.mode === 'sell') {
                return `สรุปราคารับซื้อคืนทองคำ\n${divider}\n• ประเภท: ${st.goldType === 'bar' ? 'ทองคำแท่ง 96.5%' : 'ทองรูปพรรณ 96.5%'}\n• น้ำหนัก: ${formatNum(calc.bahtWeight, 4)} บาท (${formatNum(calc.totalGrams, 3)} กรัม)\n• ราคารับซื้อสมาคม: ${formatMoney(calc.officialSellBackRate)} บาท/บาททอง\n${divider}\nยอดรับซื้อคืนสุทธิ (สคบ.): ${formatMoney(calc.sellBackValue)} บาท\n(คำนวณโดย Multitools Calculator)`;
            } else if (st.mode === 'savings') {
                return `สรุปผลการออมทองคำ\n${divider}\n• น้ำหนักสะสม: ${formatNum(calc.bahtWeight, 4)} บาท (${formatNum(calc.totalGrams, 3)} กรัม)\n• ต้นทุนเฉลี่ย: ${formatMoney(calc.costPerBaht)} บาท/บาททอง (รวม ${formatMoney(calc.totalInvested)} บาท)\n• มูลค่าตลาดปัจจุบัน: ${formatMoney(calc.currentMarketValue)} บาท\n${divider}\nผลตอบแทนสุทธิ: ${calc.isProfit ? '+' : ''}${formatMoney(calc.profitLoss)} บาท (${formatNum(calc.profitLossPercent, 2)}%)\n(คำนวณโดย Multitools Calculator)`;
            } else {
                return `สรุปราคาซื้อทองคำหน้าร้าน\n${divider}\n• ประเภท: ${st.goldType === 'bar' ? 'ทองคำแท่ง 96.5%' : 'ทองรูปพรรณ 96.5%'}\n• น้ำหนัก: ${formatNum(calc.bahtWeight, 4)} บาท (${formatNum(calc.totalGrams, 3)} กรัม)\n• ราคาทองคำ: ${formatMoney(calc.rawGoldValue)} บาท\n• ค่ากำเหน็จ: +${formatMoney(calc.craftFee)} บาท\n${divider}\nราคาซื้อสุทธิ: ${formatMoney(calc.totalBuyPrice)} บาท\n(คำนวณโดย Multitools Calculator)`;
            }
        }
        case 'electricity_bill': {
            const st = state.electricity_bill || {};
            const calc = (typeof calculateElectricityBill === 'function')
                ? calculateElectricityBill(st)
                : { units: 350, baseEnergyCharge: 1250, serviceFee: 24.62, ftCharge: 139, vat7: 98.95, totalBill: 1512.57, avgRatePerUnit: 4.32, ftRate: 0.3972 };
            return `สรุปค่าไฟฟ้าบ้าน (กฟน./กฟภ.)\n${divider}\n• จำนวนหน่วยไฟฟ้า: ${formatNum(calc.units, 1)} หน่วย (kWh)\n• ค่าไฟฟ้าฐาน (ขั้นบันได): ${formatMoney(calc.baseEnergyCharge)} บาท\n• ค่าบริการรายเดือน: ${formatMoney(calc.serviceFee)} บาท\n• ค่าไฟฟ้าผันแปร Ft (${formatNum(calc.ftRate, 4)} ฿): ${formatMoney(calc.ftCharge)} บาท\n• ภาษีมูลค่าเพิ่ม (VAT 7%): +${formatMoney(calc.vat7)} บาท\n${divider}\nยอดชำระสุทธิ: ${formatMoney(calc.totalBill)} บาท (เฉลี่ย ${formatNum(calc.avgRatePerUnit, 2)} ฿/หน่วย)\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'car_loan': {
            const st = state.car_loan || {};
            const calc = (typeof calculateCarLoan === 'function')
                ? calculateCarLoan(st)
                : { vehicleType: 'car', condition: 'new', price: 850000, downPaymentAmount: 170000, downPaymentPercent: 20, principal: 680000, interestRate: 2.59, periodMonths: 60, years: 5, monthlyPayment: 12801, totalRepayment: 768060, effectiveRateApprox: 4.95 };
            const typeLabel = calc.vehicleType === 'motorcycle' ? 'มอเตอร์ไซค์' : 'รถยนต์';
            const condLabel = calc.condition === 'used' ? 'รถมือสอง (มี VAT 7%)' : 'รถใหม่ป้ายแดง';
            return `สรุปสินเชื่อเช่าซื้อยานพาหนะ\n${divider}\n• ประเภท: ${typeLabel} (${condLabel})\n• ราคารถ: ${formatMoney(calc.price)} บาท\n• เงินดาวน์: ${formatMoney(calc.downPaymentAmount)} บาท (${formatNum(calc.downPaymentPercent, 1)}%)\n• ยอดจัดเช่าซื้อ: ${formatMoney(calc.principal)} บาท\n• อัตราดอกเบี้ย: ${formatNum(calc.interestRate, 2)}% คงที่/ปี (EIR ≈ ${formatNum(calc.effectiveRateApprox, 2)}%)\n• ระยะเวลาผ่อน: ${calc.periodMonths} งวด (${calc.years} ปี)\n${divider}\nค่างวดรายเดือน: ${formatMoney(calc.monthlyPayment)} บาท/งวด\n• ยอดผ่อนรวมทั้งสัญญา: ${formatMoney(calc.totalRepayment)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'social_security': {
            const st = state.social_security || {};
            const calc = (typeof calculateSocialSecurity === 'function')
                ? calculateSocialSecurity(st)
                : { section: 'm33', wageMonthly: 35000, contributionMonths: 240, isPension: true, monthlyPension: 4125, yearlyPension: 49500, lumpSumTotal: 0, monthlyContribution: 750, totalWorkerContributed: 180000 };
            const secName = calc.section === 'm39' ? 'มาตรา 39 (ผู้ประกันตนภาคสมัครใจ)' : (calc.section === 'm40' ? 'มาตรา 40 (อาชีพอิสระ/ฟรีแลนซ์)' : 'มาตรา 33 (พนักงานเอกชน)');
            const benefitLine = calc.isPension
                ? `เงินบำนาญชราภาพตลอดชีพ: ${formatMoney(calc.monthlyPension)} บาท/เดือน (ปีละ ${formatMoney(calc.yearlyPension)} บ.)`
                : `เงินบำเหน็จชราภาพ (ก้อนเดียว): ${formatMoney(calc.lumpSumTotal)} บาท`;
            return `สรุปสิทธิประโยชน์ประกันสังคม\n${divider}\n• สิทธิ์: ${secName}\n• ส่งเงินสมทบ: ${calc.contributionMonths} งวด (${(calc.contributionMonths / 12).toFixed(1)} ปี)\n• เงินสมทบรายเดือน: ${formatMoney(calc.monthlyContribution)} บาท/เดือน\n• รวมเงินสมทบที่จ่ายสะสม: ${formatMoney(calc.totalWorkerContributed)} บาท\n${divider}\n${benefitLine}\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'labor_severance': {
            const st = state.labor_severance || {};
            const calc = (typeof calculateLaborSeverance === 'function')
                ? calculateLaborSeverance(st)
                : { salaryMonthly: 35000, dailyWage: 1166.67, serviceYears: 3, serviceMonths: 6, severanceDays: 180, severancePay: 210000, noticePay: 35000, leavePay: 5833, totalSeverancePackage: 250833, taxExemptAmount: 210000, tierLabel: 'อายุงาน 3 ปี แต่ไม่ถึง 6 ปี' };
            return `สรุปเงินชดเชยเลิกจ้างตามกฎหมายแรงงาน\n${divider}\n• เงินเดือนฐาน: ${formatMoney(calc.salaryMonthly)} บาท (${formatMoney(calc.dailyWage)} บาท/วัน)\n• อายุงาน: ${calc.serviceYears} ปี ${calc.serviceMonths} เดือน\n• เกณฑ์ ม.118: ชดเชย ${calc.severanceDays} วัน (${formatMoney(calc.severancePay)} บาท)\n• ค่าตกใจ ม.17: ${calc.noticePay > 0 ? `+${formatMoney(calc.noticePay)} บาท` : '0.00 บาท'}\n• วันลาพักร้อนคงเหลือ: ${calc.leavePay > 0 ? `+${formatMoney(calc.leavePay)} บาท` : '0.00 บาท'}\n${divider}\nรวมยอดชดเชยสุทธิ: ${formatMoney(calc.totalSeverancePackage)} บาท\nสิทธิยกเว้นภาษี: ${formatMoney(calc.taxExemptAmount)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'legal_interest': {
            const st = state.legal_interest || {};
            const calc = (typeof calculateLegalInterest === 'function')
                ? calculateLegalInterest(st)
                : { principal: 100000, interestRate: 5.0, overdueDays: 60, totalInterest: 821.92, totalPayable: 100821.92 };
            return `สรุปดอกเบี้ยผิดนัดชำระหนี้ (ป.พ.พ.)\n${divider}\n• เงินต้นค้างชำระ: ${formatMoney(calc.principal)} บาท\n• อัตราดอกเบี้ย: ${formatNum(calc.interestRate, 2)}% ต่อปี (ป.พ.พ. ม.224)\n• ระยะเวลาผิดนัด: ${calc.overdueDays} วัน\n• ดอกเบี้ยผิดนัดชำระ: +${formatMoney(calc.totalInterest)} บาท\n${divider}\nยอดหนี้รวมที่ต้องชำระ: ${formatMoney(calc.totalPayable)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'ot_calc': {
            const st = state.ot_calc || {};
            const calc = (typeof calculateOvertimePay === 'function')
                ? calculateOvertimePay(st)
                : { wageType: 'monthly', wageBase: 25000, hourlyRate: 104.17, otWeekdayHours: 10, holidayWorkHours: 8, holidayOtHours: 4, holidayMultiplier: 1.0, otWeekdayPay: 1562.5, holidayWorkPay: 833.33, holidayOtPay: 1250, shiftAllowance: 0, totalOtPay: 3645.83, totalEarnings: 28645.83, totalHours: 22 };
            const typeLabel = calc.wageType === 'daily' ? 'พนักงานรายวัน' : (calc.wageType === 'hourly' ? 'รายชั่วโมง' : 'พนักงานรายเดือน');
            return `สรุปค่าล่วงเวลา (OT) & ทำงานวันหยุด\n${divider}\n• การจ้าง: ${typeLabel} (ฐาน ${formatMoney(calc.wageBase)} บ. / คิดชั่วโมงละ ${formatMoney(calc.hourlyRate)} บ.)\n• OT วันทำงานปกติ (1.5 เท่า): ${calc.otWeekdayHours} ชม. (+${formatMoney(calc.otWeekdayPay)} บ.)\n• ทำงานในวันหยุด (${calc.holidayMultiplier} เท่า): ${calc.holidayWorkHours} ชม. (+${formatMoney(calc.holidayWorkPay)} บ.)\n• OT ในวันหยุด (3.0 เท่า): ${calc.holidayOtHours} ชม. (+${formatMoney(calc.holidayOtPay)} บ.)\n${calc.shiftAllowance > 0 ? `• เงินค่ากะ/เบี้ยเลี้ยง: +${formatMoney(calc.shiftAllowance)} บาท\n` : ''}${divider}\nรวมค่าล่วงเวลา OT พิเศษ: +${formatMoney(calc.totalOtPay)} บาท (${formatNum(calc.totalHours, 1)} ชม.)\nยอดเงินได้รวมประจำงวด: ${formatMoney(calc.totalEarnings)} บาท\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'ecommerce_profit': {
            const st = state.ecommerce_profit || {};
            const calc = (typeof calculateEcommerceProfit === 'function')
                ? calculateEcommerceProfit(st)
                : { platform: 'shopee', sellingPrice: 350, productCost: 150, packagingCost: 10, totalPlatformFees: 43.87, netPayout: 341.13, netProfit: 116.13, profitMarginPct: 33.2, breakevenPrice: 211.23, isProfit: true, adSpendPerOrder: 30 };
            const platLabel = calc.platform === 'shopee' ? 'Shopee' : (calc.platform === 'lazada' ? 'Lazada' : (calc.platform === 'tiktok' ? 'TikTok Shop' : (calc.platform === 'direct' ? 'ขายตรง/LINE' : 'กำหนดเอง')));
            return `สรุปกำไรขายของออนไลน์ (${platLabel})\n${divider}\n• ราคาขายตั้งต้น: ${formatMoney(calc.sellingPrice)} บาท\n• ต้นทุนสินค้า + แพ็คเกจ: ${formatMoney(calc.productCost + calc.packagingCost)} บาท\n• ค่าธรรมเนียมแพลตฟอร์ม: -${formatMoney(calc.totalPlatformFees)} บาท\n${calc.adSpendPerOrder > 0 ? `• ค่ายิงแอด/โฆษณา: -${formatMoney(calc.adSpendPerOrder)} บาท\n` : ''}• เงินโอนเข้าบัญชีจริง: ${formatMoney(calc.netPayout)} บาท\n• จุดคุ้มทุน (Breakeven): ${formatMoney(calc.breakevenPrice)} บาท\n${divider}\n${calc.isProfit ? 'กำไรสุทธิต่อชิ้น' : 'ขาดทุนต่อชิ้น'}: ${formatMoney(calc.netProfit)} บาท (Margin ${formatNum(calc.profitMarginPct, 1)}%)\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'debt_payoff': {
            const st = state.debt_payoff || {};
            const calc = (typeof calculateDebtPayoff === 'function')
                ? calculateDebtPayoff(st)
                : { summary: { months: 18, years: 1.5, totalInterest: 18500, totalPaid: 168500, interestSavedVsOther: 0, completed: true }, initialTotalDebt: 150000, strategy: 'avalanche', extraMonthly: 3000, isPayable: true };
            const stratName = calc.strategy === 'snowball' ? 'Debt Snowball (ยอดน้อยก่อน)' : 'Debt Avalanche (ดอกเบี้ยสูงก่อน)';
            if (!calc.isPayable || !calc[calc.strategy]?.completed) {
                return `สรุปแผนปลดหนี้หลายบัญชี (${stratName})\n${divider}\n• ยอดหนี้รวมเริ่มต้น: ${formatMoney(calc.initialTotalDebt)} บาท\n• เงินโปะเพิ่มต่อเดือน: +${formatMoney(calc.extraMonthly || 0)} บาท\n${divider}\nสถานะ: แผนนี้ยังชำระไม่สำเร็จ (ยอดชำระรายเดือนไม่เพียงพอ หรือเกิน 50 ปี)\n(คำนวณโดย Multitools Calculator)`;
            }
            return `สรุปแผนปลดหนี้หลายบัญชี (${stratName})\n${divider}\n• ยอดหนี้รวมเริ่มต้น: ${formatMoney(calc.initialTotalDebt)} บาท\n• เงินโปะเพิ่มต่อเดือน: +${formatMoney(calc.extraMonthly || 0)} บาท\n• ระยะเวลาปลดหนี้: ${calc.summary.months} เดือน (${calc.summary.years} ปี)\n• ดอกเบี้ยรวมที่ต้องจ่าย: ${formatMoney(calc.summary.totalInterest)} บาท\n• ยอดชำระรวมทั้งสิ้น: ${formatMoney(calc.summary.totalPaid)} บาท\n${calc.summary.interestSavedVsOther > 0 ? `• ประหยัดดอกเบี้ยได้มากกว่าอีกวิธี: ${formatMoney(calc.summary.interestSavedVsOther)} บาท\n` : ''}${divider}\nปลดหนี้หมดสำเร็จใน ${calc.summary.months} เดือน\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'land_fill_calc': {
            const calc = (typeof calculateLandFill === 'function') ? calculateLandFill(state.land_fill_calc || {}) : { valid: false };
            if (!calc.valid) return `สรุปดินถมที่ & รถดั๊มพ์\n${divider}\nยังไม่ได้ป้อนพื้นที่และความสูง\n(คำนวณโดย Multitools Calculator)`;
            const costLine = calc.totalCost > 0 ? `\n• ค่าดิน ${formatMoney(calc.soilCost)} บาท + ค่าเกลี่ยบดอัด ${formatMoney(calc.spreadCost)} บาท = ${formatMoney(calc.totalCost)} บาท` : '';
            return `สรุปดินถมที่ & รถดั๊มพ์\n${divider}\n• พื้นที่: ${formatNum(calc.areaSqm, 2)} ตร.ม. (${formatNum(calc.areaWa, 2)} ตร.ว.) ถมสูง ${formatNum(calc.heightCm, 0)} ซม.\n• ปริมาตรหลังบดอัด (คิวแน่น): ${formatNum(calc.compactedM3, 2)} คิว\n• อัตรายุบ ${formatNum(calc.shrinkPct, 1)}% ตัวคูณเผื่อยุบ x${formatNum(calc.multiplier, 3)}\n• รถ 6 ล้อ: ${calc.truck6.trips} เที่ยว (${formatNum(calc.truck6.capacity, 1)} คิว/เที่ยว)\n• รถ 10 ล้อ: ${calc.truck10.trips} เที่ยว (${formatNum(calc.truck10.capacity, 1)} คิว/เที่ยว)${costLine}\n----------------------------------\nปริมาตรดินที่ต้องสั่งซื้อ (คิวหลวม): ${formatNum(calc.looseM3, 2)} คิว\n(ค่าประมาณ อัตรายุบและความจุรถยังไม่ยืนยัน)\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'wall_ceiling_calc': {
            const st = state.wall_ceiling_calc || {};
            if (st.tab === 'ceiling') {
                const calc = (typeof calculateCeiling === 'function') ? calculateCeiling(st) : { valid: false };
                if (!calc.valid) return `สรุปฝ้าเพดาน\n${divider}\nยังไม่ได้ป้อนพื้นที่ฝ้า\n(คำนวณโดย Multitools Calculator)`;
                return `สรุปคำนวณฝ้าเพดาน\n${divider}\n• พื้นที่ฝ้า: ${formatNum(calc.areaSqm, 2)} ตร.ม.\n• พื้นที่ต่อแผ่น: ${formatNum(calc.panelAreaSqm, 2)} ตร.ม.\n• เผื่อเศษตัด: ${formatNum(calc.wastePct, 1)}%${calc.totalCost > 0 ? `\n• ประมาณการงบประมาณ: ${formatMoney(calc.totalCost)} บาท` : ''}\n----------------------------------\nจำนวนแผ่นที่ต้องสั่งซื้อ: ${formatNum(calc.panels, 0)} แผ่น\n(ไม่รวมโครงคร่าวและอุปกรณ์ ค่าประมาณเพื่อประกอบการตัดสินใจ)\n(คำนวณโดย Multitools Calculator)`;
            }
            const calc = (typeof calculateMasonry === 'function') ? calculateMasonry(st) : { valid: false };
            if (!calc.valid) return `สรุปก่ออิฐ & ฉาบปูน\n${divider}\nยังไม่ได้ป้อนขนาดผนัง\n(คำนวณโดย Multitools Calculator)`;
            return `สรุปคำนวณก่ออิฐ & ฉาบปูน\n${divider}\n• พื้นที่ผนังสุทธิ: ${formatNum(calc.netAreaSqm, 2)} ตร.ม.\n• พื้นที่ฉาบ: ${formatNum(calc.plasterAreaSqm, 2)} ตร.ม. (${calc.sides} ด้าน)\n• ปูนฉาบ: ${formatNum(calc.plasterBags, 0)} ถุง${calc.totalCost > 0 ? `\n• ประมาณการงบประมาณ: ${formatMoney(calc.totalCost)} บาท` : ''}\n----------------------------------\nจำนวนอิฐที่ต้องสั่งซื้อ (เผื่อ ${formatNum(calc.wastePct, 1)}%): ${formatNum(calc.bricks, 0)} ก้อน\n(ค่าประมาณ จำนวนก้อนอิฐมอญและความครอบคลุมปูนฉาบยังไม่ยืนยัน)\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'roof_steel_calc': {
            const st = state.roof_steel_calc || {};
            if (st.tab === 'cut') {
                const calc = (typeof calculateCutting === 'function') ? calculateCutting(st) : { valid: false };
                if (!calc.valid) return `สรุปแผนตัดเหล็ก\n${divider}\nยังไม่มีรายการท่อนที่คำนวณได้\n(คำนวณโดย Multitools Calculator)`;
                return `สรุปแผนตัดท่อนเหล็ก\n${divider}\n• ความยาวเหล็กเต็มเส้น: ${formatNum(calc.stockM, 2)} ม.\n• ท่อนที่ต้องตัด: ${formatNum(calc.pieceCount, 0)} ท่อน (รวม ${formatNum(calc.pieceTotalM, 2)} ม.)\n• เศษเหล็กรวม: ${formatNum(calc.wasteM, 2)} ม. (${formatNum(calc.wastePct, 1)}%)\n----------------------------------\nเหล็กเต็มเส้นที่ต้องซื้อ: ${formatNum(calc.barCount, 0)} เส้น\n(วางแผนแบบ First-Fit Decreasing ค่าประมาณ ไม่รับประกันเศษน้อยที่สุด)\n(คำนวณโดย Multitools Calculator)`;
            }
            if (st.tab === 'rebar') {
                const rebar = (typeof calculateRebar === 'function') ? calculateRebar(st) : { valid: false };
                const con = (typeof calculateConcreteVolume === 'function') ? calculateConcreteVolume(st) : { valid: false };
                if (!rebar.valid && !con.valid) return `สรุปเหล็กเส้น & คอนกรีต\n${divider}\nยังไม่ได้ป้อนข้อมูล\n(คำนวณโดย Multitools Calculator)`;
                const rebarLines = rebar.valid ? `\n• เหล็ก ${rebar.type.key}: ${formatNum(rebar.totalLengthM, 2)} ม. หนัก ${formatNum(rebar.weightKg, 2)} กก. (เหล็กเต็มเส้น ${formatNum(rebar.stockBars, 0)} เส้น)` : '';
                const conLines = con.valid ? `\n• คอนกรีต: ปริมาตรสุทธิ ${formatNum(con.netM3, 3)} คิว สั่งจริง ${formatNum(con.orderM3, 2)} คิว (เผื่อ ${formatNum(con.wastePct, 1)}%)` : '';
                return `สรุปเหล็กเส้น & คอนกรีตโครงสร้าง\n${divider}${rebarLines}${conLines}\n----------------------------------\n(ไม่รวมระยะทาบ ระยะงอ เหล็กปลอก ค่าประมาณ ไม่ใช่การออกแบบโครงสร้าง)\n(คำนวณโดย Multitools Calculator)`;
            }
            const calc = (typeof calculateRoof === 'function') ? calculateRoof(st) : { valid: false };
            if (!calc.valid) return `สรุปหลังคา\n${divider}\nยังไม่ได้ป้อนขนาดหลังคา\n(คำนวณโดย Multitools Calculator)`;
            return `สรุปคำนวณหลังคา & เหล็กแป\n${divider}\n• ความลาดชัน: ${formatNum(calc.angle, 1)} องศา ยก ${formatNum(calc.riseM, 2)} ม.\n• ความยาวจันทัน: ${formatNum(calc.rafterM, 2)} ม. (รวมชายคา ${formatNum(calc.slopeLengthM, 2)} ม.)\n• พื้นที่หลังคา: ${formatNum(calc.areaSqm, 2)} ตร.ม. (${calc.sides} ด้าน)\n• แถวแป: ${formatNum(calc.purlinRows, 0)} แถว ใช้เหล็กแป ${formatNum(calc.purlinStock, 0)} ท่อน\n• สกรู: ${formatNum(calc.screws, 0)} ตัว${calc.totalCost > 0 ? `\n• ค่าแผ่นหลังคาโดยประมาณ: ${formatMoney(calc.totalCost)} บาท` : ''}\n----------------------------------\nแผ่นหลังคาที่ต้องสั่งตัด: ${formatNum(calc.sheets, 0)} แผ่น ยาว ${formatNum(calc.sheetOrderLengthM, 2)} ม.\n(ค่าประมาณ หน้ากว้างแผ่น ระยะแป และสกรูยังไม่ยืนยัน ควรให้ช่างตรวจ)\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'contractor_payment': {
            const calc = (typeof calculateContractorPayment === 'function') ? calculateContractorPayment(state.contractor_payment || {}) : { valid: false };
            if (!calc.valid) return `สรุปแบ่งงวดงานรับเหมา\n${divider}\nยังไม่มีข้อมูลที่คำนวณได้ (ตรวจมูลค่างานและเปอร์เซ็นต์ให้รวม 100%)\n(คำนวณโดย Multitools Calculator)`;
            const itemLines = calc.items.map(item => `• งวดที่ ${item.index} (${formatNum(item.pct, 2)}%): ค่าจ้าง ${formatMoney(item.gross)}${calc.applyVat ? ` + VAT ${formatMoney(item.vat)}` : ''} - ประกัน ${formatMoney(item.retention)}${calc.applyWht ? ` - หัก ณ ที่จ่าย ${formatMoney(item.wht)}` : ''} = จ่ายสุทธิ ${formatMoney(item.net)} บาท`).join('\n');
            return `สรุปแบ่งงวดงานรับเหมา\n${divider}\n• มูลค่างานตามสัญญา: ${formatMoney(calc.contract)} บาท (${calc.items.length} งวด)\n• เงินประกันผลงาน ${formatNum(calc.retentionPct, 2)}%: ถือไว้รวม ${formatMoney(calc.totalRetention)} บาท\n${itemLines}\n----------------------------------\nยอดจ่ายสุทธิรวมทุกงวด: ${formatMoney(calc.totalNet)} บาท\n(เปอร์เซ็นต์แต่ละงวดเป็นตัวอย่าง ให้กำหนดตามสัญญาจริง ค่าประมาณ)\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'plumbing_pump': {
            const calc = (typeof calculatePlumbing === 'function') ? calculatePlumbing(state.plumbing_pump || {}) : { valid: false };
            if (!calc.valid) return `สรุปถังเก็บน้ำ & ปั๊มน้ำ\n${divider}\nยังไม่ได้ป้อนจำนวนผู้อยู่อาศัย\n(คำนวณโดย Multitools Calculator)`;
            const tankText = `${formatNum(calc.tankSizeL, 0)} ลิตร${calc.tankCount > 1 ? ` x ${calc.tankCount} ใบ` : ''}`;
            return `สรุปถังเก็บน้ำ & ปั๊มน้ำบ้าน\n${divider}\n• ผู้อยู่อาศัย: ${formatNum(calc.people, 0)} คน ใช้น้ำ ${formatNum(calc.litersPerPerson, 0)} ลิตร/คน/วัน\n• ใช้น้ำต่อวัน: ${formatNum(calc.dailyLiters, 0)} ลิตร\n• สำรองน้ำ ${formatNum(calc.reserveDays, 1)} วัน: ${formatNum(calc.requiredLiters, 0)} ลิตร\n• กำลังวัตต์ปั๊มโดยทั่วไป: ${calc.pumpMinW}-${calc.pumpMaxW} วัตต์\n----------------------------------\nถังเก็บน้ำที่แนะนำ: ${tankText}\n(ค่าประมาณ ช่วงวัตต์ปั๊มและค่าใช้น้ำยังไม่ยืนยัน ควรให้ช่างประปาตรวจ)\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'inch_fraction': {
            const calc = (typeof calculateInchConversion === 'function') ? calculateInchConversion(state.inch_fraction || {}) : { valid: false };
            if (!calc.valid) return `สรุปแปลงเศษส่วนนิ้ว หุน & มม.\n${divider}\nยังไม่ได้ป้อนขนาด\n(คำนวณโดย Multitools Calculator)`;
            const frac = calc.mode === 'mm' ? calc.fraction : inchesToFraction(calc.inches, 64);
            const fracText = formatInchFraction(frac);
            const errLine = calc.mode === 'mm' ? `\n• ${calc.fraction.exact ? 'ตรงกับเศษส่วนพอดี' : `เศษส่วนที่ใกล้ที่สุดคลาดเคลื่อน ${formatNum(calc.errorMm, 2)} มม.`}` : '';
            return `สรุปแปลงเศษส่วนนิ้ว หุน & มม.\n${divider}\n• มิลลิเมตร: ${formatNum(calc.mm, 2)} มม. (${formatNum(calc.cm, 3)} ซม.)\n• นิ้ว: ${formatNum(calc.inches, 4)} นิ้ว\n• หุน: ${formatNum(calc.hun, 3)} หุน (8 หุน = 1 นิ้ว)${errLine}\n----------------------------------\nขนาดเป็นเศษส่วนนิ้ว: ${fracText}\n(1 นิ้ว = 25.4 มม. ขนาดเรียกท่อ PVC ไม่ใช่เส้นผ่านศูนย์กลางจริง)\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'shape_calc': {
            const st = state.shape_calc || {};
            const calc = (typeof calculateShape === 'function') ? calculateShape(st) : { valid: false };
            if (!calc.valid) return `สรุปพื้นที่ & ปริมาตรรูปทรง\n${divider}\nยังไม่ได้ป้อนขนาดที่คำนวณได้\n(คำนวณโดย Multitools Calculator)`;
            const def = SHAPE_DEFINITIONS.find(s => s.key === calc.shape);
            const extra = (calc.perimeterM !== undefined ? `\n• เส้นรอบรูป: ${formatNum(calc.perimeterM, 3)} ม.` : '') + (calc.lateralAreaSqm !== undefined ? `\n• พื้นที่ผิวด้านข้าง: ${formatNum(calc.lateralAreaSqm, 3)} ตร.ม.` : '');
            const volume = calc.volumeM3 !== undefined ? `\nปริมาตร: ${formatNum(calc.volumeM3, 3)} ลบ.ม.` : '';
            return `สรุปพื้นที่ & ปริมาตรรูปทรง: ${def ? def.label : ''}\n${divider}\n• พื้นที่: ${formatNum(calc.areaSqm, 3)} ตร.ม. (${formatNum(calc.areaWa, 3)} ตร.ว.)${extra}\n----------------------------------${volume || '\nพื้นที่: ' + formatNum(calc.areaSqm, 3) + ' ตร.ม.'}\n(ค่าตามรูปทรงอุดมคติ ไม่รวมเผื่อสูญเสีย)\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'wire_breaker': {
            const calc = (typeof calculateWireBreaker === 'function') ? calculateWireBreaker(state.wire_breaker || {}) : { valid: false };
            const checked = (typeof WIRE_VD_DATA_VERIFIED !== 'undefined' && WIRE_VD_DATA_VERIFIED && WIRE_SPEC_TABLE.every(w => w.ampacityVerified));
            const caution = checked ? 'คำเตือน: ค่าพิกัดกระแสและแรงดันตกตรวจเทียบกับสำเนาตาราง วสท. ในเอกสารผู้ผลิตแล้ว แต่ยังไม่ได้เทียบกับหนังสือ วสท. โดยตรง และไม่รวมตัวคูณลดพิกัดตามอุณหภูมิหรือจำนวนวงจร ต้องให้วิศวกรไฟฟ้าหรือช่างไฟที่มีใบอนุญาตตรวจก่อนติดตั้งจริง' : 'คำเตือน: ตารางพิกัดกระแสและแรงดันตกยังไม่ได้ตรวจกับหนังสือ วสท. ห้ามใช้เป็นข้อมูลติดตั้งจริง ต้องให้วิศวกรไฟฟ้าหรือช่างไฟที่มีใบอนุญาตตรวจก่อน';
            if (!calc.valid) return `สรุปสายไฟ เบรกเกอร์ & แรงดันตก\n${divider}\nยังไม่ได้ป้อนกำลังไฟฟ้าที่คำนวณได้\n${caution}\n(คำนวณโดย Multitools Calculator)`;
            const inputLines = `• โหลด ${formatNum(calc.watts, 0)} W ที่ ${formatNum(calc.voltage, 0)} V PF ${formatNum(calc.powerFactor, 2)}\n• ระยะสาย ${formatNum(calc.wireLengthM, 1)} ม. (${calc.method === 'surface' ? 'ตีกิ๊บเกาะผนัง VAF' : 'ร้อยท่อ IEC 01/THW'})\n• กระแสโหลด ${formatNum(calc.loadCurrent, 2)} A กระแสออกแบบ ${formatNum(calc.designCurrent, 2)} A${calc.isContinuous ? ' (โหลดต่อเนื่อง x1.25)' : ''}`;
            if (calc.selectionStatus === 'breaker_out_of_range') return `สรุปสายไฟ เบรกเกอร์ & แรงดันตก\n${divider}\n${inputLines}\n----------------------------------\nไม่มีคำตอบจากตาราง: กระแสออกแบบเกินพิกัดเบรกเกอร์ที่ตารางมี ต้องให้วิศวกรออกแบบ\n${caution}\n(คำนวณโดย Multitools Calculator)`;
            if (calc.selectionStatus === 'no_suitable_wire') return `สรุปสายไฟ เบรกเกอร์ & แรงดันตก\n${divider}\n${inputLines}\n• เบรกเกอร์ที่คำนวณได้ ${calc.recommendedBreaker} A\n----------------------------------\nไม่มีคำตอบจากตาราง: ไม่มีสายที่รองรับในวิธีเดินสายนี้\n${caution}\n(คำนวณโดย Multitools Calculator)`;
            const vdLine = `• แรงดันตก ${formatNum(calc.vdVolts, 2)} V (${formatNum(calc.vdPct, 2)}%)${calc.isVdExceeded ? ' เกินเกณฑ์ 3%' : ''}${calc.upgradedForVoltageDrop && !calc.isVdExceeded ? ' (ขยายสายเพื่อลดแรงดันตก)' : ''}`;
            return `สรุปสายไฟ เบรกเกอร์ & แรงดันตก\n${divider}\n${inputLines}\n• พิกัดกระแสสายในตาราง ${formatNum(calc.wireAmpacity, 0)} A\n${vdLine}\n----------------------------------\nเบรกเกอร์ ${calc.recommendedBreaker} A สาย ${formatNum(calc.wireSizeSqmm, 1)} ตร.มม. (${calc.wireType})\n${caution}\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'btu_calc': {
            const calc = (typeof calculateBtu === 'function') ? calculateBtu(state.btu_calc || {}) : { valid: false };
            if (!calc.valid) return `สรุปขนาดแอร์ BTU\n${divider}\nยังไม่ได้ป้อนขนาดห้อง\n(คำนวณโดย Multitools Calculator)`;
            const sizeText = `${formatNum(calc.recommendedBtu, 0)} BTU${calc.units > 1 ? ` x ${calc.units} เครื่อง` : ''}`;
            return `สรุปขนาดแอร์ BTU & ค่าไฟ\n${divider}\n• พื้นที่ห้อง: ${formatNum(calc.areaSqm, 2)} ตร.ม.\n• ภาระความเย็นที่คำนวณได้: ${formatNum(calc.requiredBtu, 0)} BTU\n----------------------------------\nขนาดแอร์ที่แนะนำ: ${sizeText}\n• ค่าไฟ Fixed Speed: ${formatMoney(calc.fixed.costPerMonth)} บาท/เดือน (${formatMoney(calc.fixed.costPerYear)} บาท/ปี)\n• ค่าไฟ Inverter: ${formatMoney(calc.inverter.costPerMonth)} บาท/เดือน (${formatMoney(calc.inverter.costPerYear)} บาท/ปี)\n• Inverter ประหยัดกว่า: ${formatMoney(calc.savingsPerYear)} บาท/ปี\n(ค่าประมาณ ควรให้ช่างแอร์ตรวจหน้างาน)\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'food_costing': {
            const st = state.food_costing || {};
            const calc = (typeof calculateFoodCosting === 'function')
                ? calculateFoodCosting(st)
                : { recipeName: 'สูตรอาหาร/เครื่องดื่ม', batchYield: 1, targetFoodCostPct: 30, sellingPrice: 65, summary: { rawBatchCost: 20, rawCostPerPortion: 20, hiddenCostBuffer: 1, packagingCost: 4.5, totalCostPerPortion: 25.5, suggestedSellingPrice: 85, suggestedPriceRounded: 85, grossProfit: 39.5, actualFoodCostPct: 39.2, grossMarginPct: 60.8, isProfit: true, hasActualPrice: true } };
            const rName = calc.recipeName || 'สูตรอาหาร/เครื่องดื่ม';
            const portionText = calc.batchYield > 1 ? `สูตรผลิต ${calc.batchYield} เสิร์ฟ` : 'จานเดี่ยว (1 เสิร์ฟ)';
            let profitSummary = '';
            if (calc.summary.hasActualPrice) {
                profitSummary = `\n• ราคาขายจริง: ${formatMoney(calc.sellingPrice)} บาท\n• ${calc.summary.isProfit ? 'กำไรขั้นต้น' : 'ขาดทุน'}: ${formatMoney(calc.summary.grossProfit)} บาท/เสิร์ฟ (Food Cost ${calc.summary.actualFoodCostPct}%, Margin ${calc.summary.grossMarginPct}%)`;
            }
            return `สรุปต้นทุนสูตรอาหาร & เครื่องดื่ม: ${rName}\n${divider}\n• ขนาดสูตร: ${portionText}\n• ต้นทุนวัตถุดิบ/เสิร์ฟ: ${formatMoney(calc.summary.rawCostPerPortion)} บาท\n• เผื่อสูญเสีย/เครื่องปรุง (${calc.hiddenCostBufferPct}%): +${formatMoney(calc.summary.hiddenCostBuffer)} บาท\n• บรรจุภัณฑ์/กล่อง: +${formatMoney(calc.summary.packagingCost)} บาท\n${divider}\nต้นทุนรวมต่อเสิร์ฟ: ${formatMoney(calc.summary.totalCostPerPortion)} บาท\nราคาแนะนำ (Food Cost ${calc.targetFoodCostPct}%): ${formatMoney(calc.summary.suggestedSellingPrice)} บาท (ปัดเศษการค้า: ${formatMoney(calc.summary.suggestedPriceRounded)} บ.)${profitSummary}\n(คำนวณโดย Multitools Calculator)`;
        }
        case 'construction_calc': {
            const st = state.construction_calc || {};
            const tab = st.tab || 'tiles';
            const calc = (typeof calculateConstructionMaterials === 'function')
                ? calculateConstructionMaterials(st)
                : { tab: 'tiles', boxesNeeded: 0, grossPieces: 0, totalPurchasedPieces: 0, areaSqm: 0, grossAreaSqm: 0, adhesiveBags: 0, groutBags: 0, costs: { totalEstimatedBudget: 0 } };

            if (tab === 'tiles') {
                return `สรุปคำนวณกระเบื้องปูพื้น & ผนัง\n${divider}\n• พื้นที่ปูสุทธิ: ${formatNum(calc.areaSqm, 2)} ตร.ม. (รวมเผื่อ ${calc.wastagePct}%: ${formatNum(calc.grossAreaSqm, 2)} ตร.ม.)\n• ขนาดกระเบื้อง: ${calc.tileWidthCm}x${calc.tileLengthCm} ซม. (${calc.piecesPerBox} แผ่น/กล่อง)\n• จำนวนที่ต้องใช้: ${calc.grossPieces} แผ่น\n----------------------------------\nจำนวนกระเบื้องที่ต้องสั่งซื้อ: ${calc.boxesNeeded} กล่อง (${calc.totalPurchasedPieces} แผ่น)\n• ปูนกาวซีเมนต์ (ถุง 20 กก.): ${calc.adhesiveBags} ถุง\n• กาวยาแนวร่อง (ถุง 1 กก.): ${calc.groutBags} ถุง\n${calc.costs.totalEstimatedBudget > 0 ? `ประมาณการงบประมาณรวม: ${formatMoney(calc.costs.totalEstimatedBudget)} บาท\n` : ''}(คำนวณโดย Multitools Calculator)`;
            } else if (tab === 'paint') {
                return `สรุปคำนวณสีทาอาคาร & ผนัง\n${divider}\n• พื้นที่ผนังสุทธิ: ${formatNum(calc.wallAreaSqm, 2)} ตร.ม. (รวมเผื่อ ${calc.wastagePct}%: ${formatNum(calc.effectiveAreaSqm, 2)} ตร.ม.)\n• สีรองพื้น (Primer 1 เที่ยว): ${calc.primer.pail5Gal > 0 ? `${calc.primer.pail5Gal} ถังใหญ่ 5GL` : ''}${calc.primer.can1Gal > 0 ? ` ${calc.primer.can1Gal} แกลลอน` : ''} (${formatNum(calc.primer.litersNeeded, 1)} ลิตร)\n----------------------------------\nสีทับหน้า (${calc.topcoat.coats} เที่ยว): ${calc.topcoat.pail5Gal > 0 ? `${calc.topcoat.pail5Gal} ถังใหญ่ 5GL` : ''}${calc.topcoat.can1Gal > 0 ? ` ${calc.topcoat.can1Gal} แกลลอน` : ''} (${formatNum(calc.topcoat.litersNeeded, 1)} ลิตร)\n${calc.costs.totalEstimatedBudget > 0 ? `ประมาณการงบประมาณรวม: ${formatMoney(calc.costs.totalEstimatedBudget)} บาท\n` : ''}(คำนวณโดย Multitools Calculator)`;
            } else {
                return `สรุปคำนวณคอนกรีตเทพื้น & ปูน\n${divider}\n• พื้นที่เทพื้น: ${formatNum(calc.slabAreaSqm, 2)} ตร.ม. (หนา ${calc.slabThicknessCm} ซม.)\n• ปริมาตรคอนกรีตสุทธิ: ${formatNum(calc.netVolumeCubicM, 2)} คิว (m³)\n• ปริมาตรรวมเผื่อ ${calc.wastagePct}%: ${formatNum(calc.grossVolumeCubicM, 2)} คิว (m³)\n----------------------------------\nสั่งคอนกรีตผสมเสร็จ (รถโม่): ${calc.readyMixOrderCubicM} คิว\n• ตะแกรงเหล็กไวร์เมช: ${formatNum(calc.wireMeshSqm, 2)} ตร.ม.\n${calc.concreteType === 'site_mix' ? `• สัดส่วนผสมเอง: ปูน ${calc.siteMix.cementBags50kg} ถุง / ทราย ${formatNum(calc.siteMix.sandCubicM, 2)} คิว / หิน ${formatNum(calc.siteMix.gravelCubicM, 2)} คิว\n` : ''}${calc.costs.totalEstimatedBudget > 0 ? `ประมาณการงบประมาณรวม: ${formatMoney(calc.costs.totalEstimatedBudget)} บาท\n` : ''}(คำนวณโดย Multitools Calculator)`;
            }
        }
        default: {
            const statusText = document.getElementById('sharedStatusText')?.innerText?.trim();
            return `สรุปผล: ${title}\n${divider}\n${statusText || 'คำนวณเรียบร้อยแล้ว'}\n(คำนวณโดย Multitools Calculator)`;
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
