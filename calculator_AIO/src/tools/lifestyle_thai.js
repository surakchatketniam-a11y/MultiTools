// ==============================================================
// Multitools Calculator - Thai Lifestyle & Everyday Asset Tools
// (gold_thai, electricity_bill)
// ==============================================================

/* -----------------------------------------------------------
 * PURE ENGINE: คำนวณราคาทองคำไทย (ทองแท่ง / รูปพรรณ / สลึง / กำเหน็จ)
 * ----------------------------------------------------------- */
function calculateGoldThai(params) {
    const p = params || {};
    const mode = p.mode || 'buy'; // 'buy' | 'sell' | 'savings'
    const goldType = p.goldType || 'ornament'; // 'bar' (ทองแท่ง 96.5%) | 'ornament' (ทองรูปพรรณ 96.5%)
    const weightUnit = p.weightUnit || 'baht'; // 'baht' | 'salung' | 'gram'
    const weightVal = Math.max(0, numberOrDefault(p.weightValue, 1));
    const craftFee = Math.max(0, numberOrDefault(p.craftFee, goldType === 'ornament' ? 800 : 0));

    // ราคาประกาศสมาคมค้าทองคำ (Gold Traders Association Standards)
    const priceBarBuy = Math.max(0, numberOrDefault(p.priceBarBuy, 43900));
    const priceBarSell = Math.max(0, numberOrDefault(p.priceBarSell, 44000));
    const priceOrnamentBuy = Math.max(0, numberOrDefault(p.priceOrnamentBuy, 43115));
    const priceOrnamentSell = Math.max(0, numberOrDefault(p.priceOrnamentSell, 44500));

    // มาตรฐานน้ำหนักทองคำไทย 96.5%
    // 1 บาททองแท่ง = 15.244 กรัม | 1 บาททองรูปพรรณ = 15.16 กรัม | 1 บาท = 4 สลึง
    const gramsPerBaht = goldType === 'bar' ? 15.244 : 15.16;

    let bahtWeight = 0;
    if (weightUnit === 'baht') {
        bahtWeight = weightVal;
    } else if (weightUnit === 'salung') {
        bahtWeight = weightVal / 4;
    } else if (weightUnit === 'gram') {
        bahtWeight = gramsPerBaht > 0 ? (weightVal / gramsPerBaht) : 0;
    }

    const salungWeight = bahtWeight * 4;
    const totalGrams = bahtWeight * gramsPerBaht;

    // 1. ซื้อทอง (Buy Gold)
    const baseBuyRate = goldType === 'bar' ? priceBarSell : priceOrnamentSell;
    const rawGoldValue = bahtWeight * baseBuyRate;
    const totalBuyPrice = rawGoldValue + craftFee;

    // 2. ขายคืนทองคำ (Sell Back / Pawnshop Standard)
    // เกณฑ์ สคบ. & สมาคมค้าทองคำ:
    // - ทองแท่ง: หักไม่เกิน 100 บาทจากราคาขายออก
    // - ทองรูปพรรณ: รับซื้อตามเกณฑ์สมาคม (หักไม่เกิน 5% จากราคารับซื้อทองคำแท่ง)
    const officialSellBackRate = goldType === 'bar' ? priceBarBuy : priceOrnamentBuy;
    const sellBackValue = bahtWeight * officialSellBackRate;
    const deductionFromSellPrice = totalBuyPrice - sellBackValue;

    // 3. จำลองการออมทอง / ผลตอบแทน (Savings & Investment)
    const costPerBaht = Math.max(0, numberOrDefault(p.savingsCostPerBaht, 40000));
    const totalInvested = bahtWeight * costPerBaht;
    const currentMarketValue = bahtWeight * (goldType === 'bar' ? priceBarBuy : priceOrnamentBuy);
    const profitLoss = currentMarketValue - totalInvested;
    const profitLossPercent = totalInvested > 0 ? ((profitLoss / totalInvested) * 100) : 0;

    return {
        mode,
        goldType,
        weightUnit,
        weightVal,
        bahtWeight,
        salungWeight,
        totalGrams,
        gramsPerBaht,
        craftFee,
        baseBuyRate,
        rawGoldValue,
        totalBuyPrice,
        officialSellBackRate,
        sellBackValue,
        deductionFromSellPrice,
        costPerBaht,
        totalInvested,
        currentMarketValue,
        profitLoss,
        profitLossPercent,
        isProfit: profitLoss >= 0,
        prices: {
            priceBarBuy,
            priceBarSell,
            priceOrnamentBuy,
            priceOrnamentSell
        }
    };
}

/* -----------------------------------------------------------
 * PURE ENGINE: ค่าไฟฟ้าบ้าน & อัตราก้าวหน้า กฟน./กฟภ.
 * ----------------------------------------------------------- */
function calculateElectricityBill(params) {
    const p = params || {};
    const tariffType = p.tariffType || 'type1_2'; // 'type1_1' (ไม่เกิน 150 หน่วย) | 'type1_2' (เกิน 150 หน่วย)
    const units = Math.max(0, numberOrDefault(p.units, 0));
    const ftRate = numberOrDefault(p.ftRate, 0.3972); // ค่า Ft บาท/หน่วย

    // โครงสร้างอัตราค่าไฟฟ้าฐาน กฟน. / กฟภ. (MEA / PEA Residential Tariffs)
    const tiers1_1 = [
        { label: '1 - 15 หน่วย', max: 15, rate: 2.3488 },
        { label: '16 - 25 หน่วย', max: 10, rate: 2.9882 },
        { label: '26 - 35 หน่วย', max: 10, rate: 3.2405 },
        { label: '36 - 100 หน่วย', max: 65, rate: 3.6237 },
        { label: '101 - 150 หน่วย', max: 50, rate: 3.7171 },
        { label: '151 - 400 หน่วย', max: 250, rate: 4.2218 },
        { label: 'เกิน 400 หน่วยขึ้นไป', max: Infinity, rate: 4.4217 }
    ];

    const tiers1_2 = [
        { label: '150 หน่วยแรก (1 - 150)', max: 150, rate: 3.2484 },
        { label: '250 หน่วยต่อไป (151 - 400)', max: 250, rate: 4.2218 },
        { label: 'เกินกว่า 400 หน่วยขึ้นไป', max: Infinity, rate: 4.4217 }
    ];

    const tiers = tariffType === 'type1_1' ? tiers1_1 : tiers1_2;
    const serviceFee = tariffType === 'type1_1' ? 8.19 : 24.62;

    let remainingUnits = units;
    let baseEnergyCharge = 0;
    const tierBreakdown = [];

    for (const tier of tiers) {
        if (remainingUnits > 0) {
            const unitsInTier = Math.min(remainingUnits, tier.max);
            const costInTier = unitsInTier * tier.rate;
            baseEnergyCharge += costInTier;
            remainingUnits -= unitsInTier;
            tierBreakdown.push({
                label: tier.label,
                rate: tier.rate,
                units: unitsInTier,
                cost: costInTier
            });
        } else {
            tierBreakdown.push({
                label: tier.label,
                rate: tier.rate,
                units: 0,
                cost: 0
            });
        }
    }

    // ค่าไฟฟ้าผันแปร (Ft)
    const ftCharge = units * ftRate;

    // รวมค่าไฟฟ้าก่อนภาษีมูลค่าเพิ่ม
    const preVatTotal = baseEnergyCharge + serviceFee + ftCharge;

    // ภาษีมูลค่าเพิ่ม VAT 7%
    const vat7 = preVatTotal * 0.07;

    // รวมเงินค่าไฟฟ้าทั้งสิ้น
    const totalBill = preVatTotal + vat7;

    // อัตราค่าไฟฟ้าเฉลี่ยต่อหน่วย
    const avgRatePerUnit = units > 0 ? (totalBill / units) : 0;

    return {
        tariffType,
        units,
        ftRate,
        serviceFee,
        baseEnergyCharge,
        ftCharge,
        preVatTotal,
        vat7,
        totalBill,
        avgRatePerUnit,
        tierBreakdown
    };
}

/* -----------------------------------------------------------
 * PURE ENGINE: เครื่องคำนวณการใช้ไฟเครื่องใช้ไฟฟ้า (Wattage)
 * ----------------------------------------------------------- */
function calculateApplianceEnergy(appliancesList, avgUnitCost = 4.5) {
    const list = Array.isArray(appliancesList) ? appliancesList : [];
    let totalDailyKwh = 0;

    const items = list.map(item => {
        const watts = Math.max(0, numberOrDefault(item.watts, 0));
        const qty = Math.max(0, integerOrDefault(item.qty, 1));
        const hours = Math.max(0, numberOrDefault(item.hoursPerDay, 0));
        const dailyKwh = (watts * qty * hours) / 1000;
        const monthlyKwh = dailyKwh * 30;
        const monthlyCost = monthlyKwh * avgUnitCost;
        totalDailyKwh += dailyKwh;

        return {
            id: item.id || '',
            name: item.name || 'อุปกรณ์',
            watts,
            qty,
            hours,
            dailyKwh,
            monthlyKwh,
            monthlyCost
        };
    });

    const totalMonthlyKwh = totalDailyKwh * 30;
    const totalMonthlyCost = totalMonthlyKwh * avgUnitCost;

    return {
        items,
        totalDailyKwh,
        totalMonthlyKwh,
        totalMonthlyCost,
        avgUnitCost
    };
}

/* -----------------------------------------------------------
 * PURE ENGINE: จัดอันดับเครื่องใช้ไฟฟ้าที่กินไฟมากที่สุด (เรียงตามหน่วยไฟ/เดือน)
 * ----------------------------------------------------------- */
function buildApplianceRanking(appCalc) {
    const items = (appCalc && Array.isArray(appCalc.items)) ? appCalc.items : [];
    const total = items.reduce((sum, item) => sum + item.monthlyKwh, 0);
    return items
        .map((item, index) => ({ item, index }))
        .sort((a, b) => (b.item.monthlyKwh - a.item.monthlyKwh) || (a.index - b.index))
        .map(({ item }, i) => ({
            rank: i + 1,
            name: item.name,
            monthlyKwh: item.monthlyKwh,
            monthlyCost: item.monthlyCost,
            sharePct: total > 0 ? (item.monthlyKwh / total) * 100 : 0
        }));
}

// ตารางจัดอันดับ แสดงเฉพาะจอใหญ่ (hidden lg:block) เพื่อไม่กระทบมือถือ
function renderApplianceRankingTable(ranking) {
    if (!ranking.length) return '';
    const top = ranking[0];
    const insight = top.monthlyKwh > 0
        ? `${escapeHTML(top.name)} กินไฟมากที่สุด คิดเป็น ${formatNum(top.sharePct, 1)}% ของทั้งบ้าน (ประมาณ ${formatMoney(top.monthlyCost)} บาท/เดือน)`
        : 'ยังไม่มีเครื่องใช้ไฟฟ้าที่ระบุชั่วโมงใช้งาน';
    return `
        <div class="appliance-ranking themed-tool-card hidden lg:block p-4 space-y-2 text-xs" data-desktop-chart>
            <div class="font-bold text-[var(--app-ink)]">จัดอันดับเครื่องใช้ไฟฟ้าที่กินไฟมากที่สุด</div>
            <div class="text-[11px] text-[var(--app-body)]">${insight}</div>
            <div class="overflow-auto thin-scroll">
                <table class="w-full text-left border-collapse text-[11px]">
                    <thead>
                        <tr class="text-[var(--app-body)] border-b border-[var(--app-hairline)]">
                            <th scope="col" class="py-1.5 px-1">อันดับ</th>
                            <th scope="col" class="py-1.5 px-1">เครื่องใช้ไฟฟ้า</th>
                            <th scope="col" class="py-1.5 px-1 text-right">หน่วย/เดือน</th>
                            <th scope="col" class="py-1.5 px-1 text-right">ค่าไฟ/เดือน</th>
                            <th scope="col" class="py-1.5 px-1">สัดส่วน</th>
                        </tr>
                    </thead>
                    <tbody>${ranking.map(r => `
                        <tr class="border-b border-[var(--app-hairline)] ${r.rank === 1 ? 'font-bold text-[var(--app-ink)]' : 'text-[var(--app-body)]'}">
                            <td class="py-1.5 px-1">${r.rank}</td>
                            <td class="py-1.5 px-1">${escapeHTML(r.name)}</td>
                            <td class="py-1.5 px-1 text-right">${formatNum(r.monthlyKwh, 1)}</td>
                            <td class="py-1.5 px-1 text-right">${formatMoney(r.monthlyCost)}</td>
                            <td class="py-1.5 px-1 min-w-[6rem]">
                                <div class="flex items-center gap-1.5">
                                    <div class="h-2 flex-1 rounded-full overflow-hidden" style="box-shadow: inset 0 0 0 1px var(--app-hairline)"><div class="h-full rounded-full" style="width:${r.sharePct.toFixed(1)}%;background:var(--app-accent)"></div></div>
                                    <span class="w-10 text-right">${formatNum(r.sharePct, 1)}%</span>
                                </div>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

/* -----------------------------------------------------------
 * LIVE API: ระบบดึงราคาทองคำสมาคมค้าทองคำแบบเรียลไทม์
 * ----------------------------------------------------------- */
function parseThaiGoldApiResponse(payload) {
    if (!payload || payload.status !== 'success' || !payload.response || !payload.response.price) {
        throw new Error('Invalid Thai Gold API response structure');
    }
    const price = payload.response.price;
    const priceBarBuy = parseNumericInput(price.gold_bar?.buy);
    const priceBarSell = parseNumericInput(price.gold_bar?.sell);
    const priceOrnamentBuy = parseNumericInput(price.gold?.buy);
    const priceOrnamentSell = parseNumericInput(price.gold?.sell);

    if (!Number.isFinite(priceBarBuy) || priceBarBuy <= 0 ||
        !Number.isFinite(priceBarSell) || priceBarSell <= 0 ||
        !Number.isFinite(priceOrnamentBuy) || priceOrnamentBuy <= 0 ||
        !Number.isFinite(priceOrnamentSell) || priceOrnamentSell <= 0) {
        throw new Error('Missing or invalid gold rates in API response');
    }

    const updateDate = String(payload.response.update_date || '').trim();
    const updateTime = String(payload.response.update_time || '').trim();

    return {
        priceBarBuy,
        priceBarSell,
        priceOrnamentBuy,
        priceOrnamentSell,
        updateDate,
        updateTime
    };
}

let goldFetchInFlight = false;

async function loadThaiGoldRates(force = false) {
    if (typeof appState === 'undefined' || !appState.gold_thai) return;
    const st = appState.gold_thai;
    const now = Date.now();
    if (goldFetchInFlight) return;
    if (!force && st.lastAttempt && now - new Date(st.lastAttempt).getTime() < 30000) return;

    goldFetchInFlight = true;
    st.lastAttempt = new Date().toISOString();
    if (appState.activeToolId === 'gold_thai' && typeof renderActiveTool === 'function') {
        renderActiveTool();
    }

    try {
        const response = await fetch('https://api.chnwt.dev/thai-gold-api/latest', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Thai Gold API HTTP ${response.status}`);
        const payload = await response.json();
        const parsed = parseThaiGoldApiResponse(payload);

        st.priceBarBuy = String(parsed.priceBarBuy);
        st.priceBarSell = String(parsed.priceBarSell);
        st.priceOrnamentBuy = String(parsed.priceOrnamentBuy);
        st.priceOrnamentSell = String(parsed.priceOrnamentSell);
        st.lastUpdated = new Date().toISOString();
        st.apiUpdateDate = parsed.updateDate;
        st.apiUpdateTime = parsed.updateTime;
        st.rateSource = 'สมาคมค้าทองคำ (สดจาก API)';
    } catch (error) {
        st.rateSource = 'ค่าเดิมในเครื่อง (เชื่อมต่อ API ไม่สำเร็จ)';
    } finally {
        goldFetchInFlight = false;
        if (typeof persistAppState === 'function') persistAppState();
        if (appState.activeToolId === 'gold_thai' && typeof renderActiveTool === 'function') {
            renderActiveTool();
        }
    }
}

/* -----------------------------------------------------------
 * UI RENDERER: คำนวณราคาทองคำไทย (gold_thai)
 * ----------------------------------------------------------- */
function renderGoldThaiTool(container) {
    if (!container) return;
    const st = appState.gold_thai = appState.gold_thai || {
        mode: 'buy', // 'buy' | 'sell' | 'savings'
        goldType: 'ornament', // 'bar' | 'ornament'
        weightUnit: 'baht', // 'baht' | 'salung' | 'gram'
        weightValue: '1',
        craftFee: '800',
        priceBarBuy: '43900',
        priceBarSell: '44000',
        priceOrnamentBuy: '43115',
        priceOrnamentSell: '44500',
        savingsCostPerBaht: '40000',
        rateSource: 'ค่าเริ่มต้นในเครื่อง (ยังไม่ได้ดึงจาก API)',
        lastUpdated: null,
        apiUpdateDate: '',
        apiUpdateTime: ''
    };

    const calc = calculateGoldThai(st);

    let modeTitle = 'คำนวณราคาซื้อทองคำ';
    if (st.mode === 'sell') modeTitle = 'คำนวณราคารับซื้อคืน';
    else if (st.mode === 'savings') modeTitle = 'จำลองผลตอบแทนการออมทอง';

    container.innerHTML = `
        <div class="gold-tool flex flex-col gap-3 p-1">
            <!-- Mode Switcher Tabs -->
            <div class="segment-group grid-cols-3 balanced-segment-modes" role="tablist" aria-label="โหมดราคาทองคำ">
                <button type="button" role="tab" aria-selected="${st.mode === 'buy'}" tabindex="${st.mode === 'buy' ? '0' : '-1'}" class="segment-btn ${st.mode === 'buy' ? 'active' : ''}" data-gold-mode="buy">ซื้อทอง</button>
                <button type="button" role="tab" aria-selected="${st.mode === 'sell'}" tabindex="${st.mode === 'sell' ? '0' : '-1'}" class="segment-btn ${st.mode === 'sell' ? 'active' : ''}" data-gold-mode="sell">ขายคืน</button>
                <button type="button" role="tab" aria-selected="${st.mode === 'savings'}" tabindex="${st.mode === 'savings' ? '0' : '-1'}" class="segment-btn ${st.mode === 'savings' ? 'active' : ''}" data-gold-mode="savings">ออมทอง</button>
            </div>

            <!-- Reference Prices -->
            <div class="themed-tool-card gold-reference-card p-3 text-xs space-y-3">
                <div class="flex flex-col gap-1">
                    <div class="font-bold text-[var(--app-ink)]">ราคาทองอ้างอิง 96.5%</div>
                    <div class="text-[11px] text-[var(--app-muted)]">ข้อมูลจาก ${escapeHTML(st.rateSource || 'ค่าเริ่มต้นในเครื่อง')} ${st.apiUpdateDate ? `วันที่ ${escapeHTML(st.apiUpdateDate)} ` : ''}${st.apiUpdateTime ? `เวลา ${escapeHTML(st.apiUpdateTime)} น.` : ''}</div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-[11px]">
                    <div class="themed-subcard p-2.5 space-y-1">
                        <div class="font-semibold text-[var(--app-ink)]">ทองคำแท่ง</div>
                        <div class="flex justify-between gap-2 text-[var(--app-muted)]"><span>รับซื้อ</span><b class="text-[var(--app-ink)]">${formatMoney(calc.prices.priceBarBuy)}</b></div>
                        <div class="flex justify-between gap-2 text-[var(--app-muted)]"><span>ขายออก</span><b class="text-[var(--app-ink)]">${formatMoney(calc.prices.priceBarSell)}</b></div>
                    </div>
                    <div class="themed-subcard p-2.5 space-y-1">
                        <div class="font-semibold text-[var(--app-ink)]">ทองรูปพรรณ</div>
                        <div class="flex justify-between gap-2 text-[var(--app-muted)]"><span>รับซื้อ</span><b class="text-[var(--app-ink)]">${formatMoney(calc.prices.priceOrnamentBuy)}</b></div>
                        <div class="flex justify-between gap-2 text-[var(--app-muted)]"><span>ขายออก</span><b class="text-[var(--app-ink)]">${formatMoney(calc.prices.priceOrnamentSell)}</b></div>
                    </div>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-1 border-t border-[var(--app-hairline)] pt-1">
                    <button id="btnFetchGoldRates" type="button" aria-busy="${goldFetchInFlight}" class="tool-text-btn text-[11px] ${goldFetchInFlight ? 'opacity-50 pointer-events-none' : ''}">
                        ${goldFetchInFlight ? 'กำลังอัปเดต...' : 'อัปเดตราคาวันนี้'}
                    </button>
                    <button id="btnToggleCustomGoldRates" type="button" class="tool-text-btn text-[11px]">กำหนดราคาเอง</button>
                    ${st.lastUpdated ? `<span class="w-full text-[10px] text-[var(--app-muted)]">อัปเดตในเครื่อง ${new Date(st.lastUpdated).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>` : ''}
                </div>

                <!-- Custom Rates Inputs (Hidden by default) -->
                <div id="goldCustomRatesPanel" class="hidden pt-2 border-t border-[var(--app-hairline)] space-y-2">
                    <div class="text-[11px] font-semibold text-[var(--app-body)]">กำหนดราคาทองตามประกาศปัจจุบัน (บาทละ)</div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[10px] block">แท่ง ขายออก</label>
                            <input id="goldBarSell" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.priceBarSell))}" class="airbnb-input w-full text-xs">
                        </div>
                        <div>
                            <label class="text-[10px] block">แท่ง รับซื้อ</label>
                            <input id="goldBarBuy" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.priceBarBuy))}" class="airbnb-input w-full text-xs">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[10px] block">รูปพรรณ ขายออก</label>
                            <input id="goldOrnamentSell" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.priceOrnamentSell))}" class="airbnb-input w-full text-xs">
                        </div>
                        <div>
                            <label class="text-[10px] block">รูปพรรณ รับซื้อ</label>
                            <input id="goldOrnamentBuy" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.priceOrnamentBuy))}" class="airbnb-input w-full text-xs">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Input Form -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)] flex items-center justify-between">
                    <span>${modeTitle}</span>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label class="font-semibold text-[var(--app-body)] block mb-1">ประเภททองคำ</label>
                        <select id="goldTypeSelect" class="airbnb-input w-full">
                            <option value="ornament" ${st.goldType === 'ornament' ? 'selected' : ''}>ทองรูปพรรณ (มีค่ากำเหน็จ)</option>
                            <option value="bar" ${st.goldType === 'bar' ? 'selected' : ''}>ทองคำแท่ง (ไม่มี/กำเหน็จน้อย)</option>
                        </select>
                    </div>
                    <div>
                        <label class="font-semibold text-[var(--app-body)] block mb-1">หน่วยน้ำหนัก</label>
                        <select id="goldUnitSelect" class="airbnb-input w-full">
                            <option value="baht" ${st.weightUnit === 'baht' ? 'selected' : ''}>บาททองคำ</option>
                            <option value="salung" ${st.weightUnit === 'salung' ? 'selected' : ''}>สลึง (1/4 บาท)</option>
                            <option value="gram" ${st.weightUnit === 'gram' ? 'selected' : ''}>กรัม (g)</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-xs font-semibold text-[var(--app-body)] block mb-1">
                            จำนวนน้ำหนัก (${st.weightUnit === 'baht' ? 'บาท' : (st.weightUnit === 'salung' ? 'สลึง' : 'กรัม')})
                        </label>
                        <input id="goldWeightInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.weightValue))}" placeholder="เช่น 1 หรือ 0.5" class="airbnb-input w-full">
                    </div>
                    ${st.mode === 'savings' ? `
                        <div>
                            <label class="text-xs font-semibold text-[var(--app-body)] block mb-1">ต้นทุนเฉลี่ยที่ซื้อมา (บาทละ)</label>
                            <input id="goldSavingsCostInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.savingsCostPerBaht))}" placeholder="เช่น 40,000" class="airbnb-input w-full">
                        </div>
                    ` : `
                        <div>
                            <label class="text-xs font-semibold text-[var(--app-body)] block mb-1">ค่ากำเหน็จ (บาท)</label>
                            <input id="goldCraftFeeInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.craftFee))}" placeholder="เช่น 800" class="airbnb-input w-full">
                        </div>
                    `}
                </div>

                <!-- Weight Equivalent Pill Badges -->
                <div class="flex flex-wrap gap-1.5 pt-1" aria-label="น้ำหนักทองเทียบเท่า">
                    <span class="tool-metric-chip">
                        <b>${formatNum(calc.bahtWeight, 4)} บาททองคำ</b>
                    </span>
                    <span class="tool-metric-chip">
                        <b>${formatNum(calc.salungWeight, 2)} สลึง</b>
                    </span>
                    <span class="tool-metric-chip">
                        <b>${formatNum(calc.totalGrams, 3)} กรัม</b>&nbsp;(${formatNum(calc.gramsPerBaht, 3)} กรัม/บาท)
                    </span>
                </div>
            </div>

            <!-- Big Result Card -->
            ${st.mode === 'buy' ? `
                <div class="themed-result-card theme-result-highlight p-5 text-center space-y-1">
                    <div class="text-xs font-semibold text-[var(--app-muted)]">ราคาซื้อสุทธิที่หน้าร้าน</div>
                    <div class="themed-result-value text-2xl md:text-3xl font-extrabold">${formatMoney(calc.totalBuyPrice)} บาท</div>
                    <div class="text-xs text-[var(--app-body)]">
                        ราคาทอง ${formatMoney(calc.rawGoldValue)} บาท + ค่ากำเหน็จ ${formatMoney(calc.craftFee)} บาท
                    </div>
                </div>
            ` : (st.mode === 'sell' ? `
                <div class="themed-result-card theme-result-highlight p-5 text-center space-y-1">
                    <div class="text-xs font-semibold text-[var(--app-muted)]">ราคารับซื้อคืนขั้นต่ำตามเกณฑ์ สคบ.</div>
                    <div class="themed-result-value text-2xl md:text-3xl font-extrabold">${formatMoney(calc.sellBackValue)} บาท</div>
                    <div class="text-xs text-[var(--app-body)]">
                        เรทรับซื้อ ${formatMoney(calc.officialSellBackRate)} บาท/บาททอง · ส่วนต่างประมาณ ${formatMoney(calc.deductionFromSellPrice)} บาท
                    </div>
                </div>
            ` : `
                <div class="themed-result-card ${calc.isProfit ? 'is-profit' : 'is-loss'} p-5 text-center space-y-1">
                    <div class="text-xs font-semibold text-[var(--app-muted)]">
                        ${calc.isProfit ? 'กำไรจากการออมทอง' : 'ขาดทุนจากการออมทอง'}
                    </div>
                    <div class="themed-result-value text-2xl md:text-3xl font-extrabold">
                        ${calc.isProfit ? '+' : ''}${formatMoney(calc.profitLoss)} บาท (${calc.isProfit ? '+' : ''}${formatNum(calc.profitLossPercent, 2)}%)
                    </div>
                    <div class="text-xs text-[var(--app-body)]">
                        มูลค่าปัจจุบัน ${formatMoney(calc.currentMarketValue)} บาท · ต้นทุน ${formatMoney(calc.totalInvested)} บาท
                    </div>
                </div>
            `)}

            <!-- Breakdown & Comparison Details -->
            <div class="themed-tool-card p-4 space-y-1 text-xs">
                <div class="font-bold text-[var(--app-ink)] pb-1">สรุปราคาและส่วนต่าง</div>
                <div class="tool-summary-row flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">ราคาขายออก (${st.goldType === 'bar' ? 'ทองแท่ง' : 'รูปพรรณ'})</span>
                    <b>${formatMoney(calc.baseBuyRate)} บาท/บาททอง</b>
                </div>
                <div class="tool-summary-row flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">ราคารับซื้อคืนสมาคม</span>
                    <b>${formatMoney(calc.officialSellBackRate)} บาท/บาททอง</b>
                </div>
                <div class="tool-summary-row flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">ส่วนต่างต่อ 1 บาททอง</span>
                    <b>-${formatMoney(calc.baseBuyRate - calc.officialSellBackRate)} บาท</b>
                </div>
                <div class="tool-summary-row flex justify-between gap-3 py-2">
                    <span class="text-[var(--app-muted)]">ค่ากำเหน็จที่กำหนด</span>
                    <b>${formatMoney(calc.craftFee)} บาท</b>
                </div>
                <div class="flex justify-end pt-3">
                    <button id="btnPrintGoldThaiSummary" type="button" class="tool-action-btn text-xs">
                        พิมพ์ใบสรุปราคาทอง / PDF
                    </button>
                </div>
            </div>
        </div>
    `;

    // Event Listeners
    container.querySelectorAll('[data-gold-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.mode = btn.getAttribute('data-gold-mode');
            persistAppState();
            renderActiveTool();
        });
    });

    const bindSelect = (id, key) => {
        document.getElementById(id)?.addEventListener('change', e => {
            st[key] = e.target.value;
            persistAppState();
            renderActiveTool();
        });
    };
    bindSelect('goldTypeSelect', 'goldType');
    bindSelect('goldUnitSelect', 'weightUnit');

    const bindInput = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            st[key] = el.value;
            persistAppState();
            renderActiveTool();
        });
        el.addEventListener('blur', () => {
            const formatted = formatInputDisplay(el.value);
            st[key] = formatted;
            el.value = formatted;
            persistAppState();
        });
    };
    bindInput('goldWeightInput', 'weightValue');
    bindInput('goldCraftFeeInput', 'craftFee');
    bindInput('goldSavingsCostInput', 'savingsCostPerBaht');
    bindInput('goldBarSell', 'priceBarSell');
    bindInput('goldBarBuy', 'priceBarBuy');
    bindInput('goldOrnamentSell', 'priceOrnamentSell');
    bindInput('goldOrnamentBuy', 'priceOrnamentBuy');

    document.getElementById('btnFetchGoldRates')?.addEventListener('click', () => {
        loadThaiGoldRates(true);
    });

    document.getElementById('btnToggleCustomGoldRates')?.addEventListener('click', () => {
        const panel = document.getElementById('goldCustomRatesPanel');
        panel?.classList.toggle('hidden');
    });

    container.querySelector('#btnPrintGoldThaiSummary')?.addEventListener('click', () => {
        triggerPrintReceipt('gold_thai');
    });

    const stale = !st.lastUpdated || (Date.now() - new Date(st.lastUpdated).getTime() > 30 * 60 * 1000);
    if (stale && !goldFetchInFlight && typeof window !== 'undefined' && typeof window.fetch === 'function') {
        loadThaiGoldRates();
    }

    if (calc.bahtWeight <= 0) {
        setStatusBanner('empty', 'กรุณาระบุน้ำหนักทองคำที่ต้องการคำนวณ');
    } else if (st.mode === 'buy') {
        setStatusBanner('success', `ราคาซื้อทอง ${formatNum(calc.bahtWeight, 2)} บาท: <b class="text-[var(--app-accent)]">${formatMoney(calc.totalBuyPrice)} บาท</b> (รวมกำเหน็จ ${formatMoney(calc.craftFee)} บ.)`);
    } else if (st.mode === 'sell') {
        setStatusBanner('success', `ราคารับซื้อคืนทอง ${formatNum(calc.bahtWeight, 2)} บาท: <b class="text-emerald-600">${formatMoney(calc.sellBackValue)} บาท</b>`);
    } else {
        setStatusBanner('success', `ออมทอง ${formatNum(calc.bahtWeight, 2)} บาท: <b class="${calc.isProfit ? 'text-emerald-600' : 'text-rose-600'}">${calc.isProfit ? '+' : ''}${formatMoney(calc.profitLoss)} บาท (${formatNum(calc.profitLossPercent, 2)}%)</b>`);
    }
}

/* -----------------------------------------------------------
 * UI RENDERER: คำนวณค่าไฟฟ้าบ้าน & เครื่องใช้ไฟฟ้า (electricity_bill)
 * ----------------------------------------------------------- */
function renderElectricityBillTool(container) {
    if (!container) return;
    const st = appState.electricity_bill = appState.electricity_bill || {
        mode: 'bill', // 'bill' | 'appliance'
        tariffType: 'type1_2', // 'type1_1' | 'type1_2'
        units: '350',
        ftRate: '0.3972',
        appliances: [
            { id: 'air12k', name: 'แอร์ Inverter 12,000 BTU', watts: 900, qty: 1, hoursPerDay: 8 },
            { id: 'fridge', name: 'ตู้เย็น 2 ประตู', watts: 100, qty: 1, hoursPerDay: 24 },
            { id: 'fan', name: 'พัดลม 16 นิ้ว', watts: 50, qty: 2, hoursPerDay: 8 },
            { id: 'tv', name: 'สมาร์ททีวี 55 นิ้ว', watts: 100, qty: 1, hoursPerDay: 4 },
            { id: 'water', name: 'เครื่องทำน้ำอุ่น', watts: 3500, qty: 1, hoursPerDay: 0.5 }
        ]
    };

    const isApplianceMode = st.mode === 'appliance';
    const calc = calculateElectricityBill(st);
    const appCalc = calculateApplianceEnergy(st.appliances, calc.avgRatePerUnit || 4.5);

    container.innerHTML = `
        <div class="electricity-tool flex flex-col gap-3 p-1">
            <!-- Mode Selector Tabs -->
            <div class="segment-group grid-cols-2 balanced-segment-modes" role="tablist" aria-label="โหมดคำนวณค่าไฟ">
                <button type="button" role="tab" aria-selected="${!isApplianceMode}" tabindex="${!isApplianceMode ? '0' : '-1'}" class="segment-btn ${!isApplianceMode ? 'active' : ''}" data-elec-mode="bill">คำนวณจากหน่วยในบิล</button>
                <button type="button" role="tab" aria-selected="${isApplianceMode}" tabindex="${isApplianceMode ? '0' : '-1'}" class="segment-btn ${isApplianceMode ? 'active' : ''}" data-elec-mode="appliance">คำนวณตามเครื่องใช้ไฟฟ้า</button>
            </div>

            ${!isApplianceMode ? `
                <!-- TAB 1: บิลค่าไฟ & ขั้นบันได -->
                <div class="themed-tool-card p-4 space-y-3">
                    <div class="text-xs font-bold text-[var(--app-ink)]">ข้อมูลประเภทบ้านและหน่วยไฟ (กฟน. / กฟภ.)</div>
                    
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <label class="font-semibold text-[var(--app-body)] block mb-1">ประเภทบ้านอยู่อาศัย</label>
                            <select id="elecTariffType" class="airbnb-input w-full">
                                <option value="type1_2" ${st.tariffType === 'type1_2' ? 'selected' : ''}>ประเภท 1.2 (เกิน 150 หน่วย/ด.)</option>
                                <option value="type1_1" ${st.tariffType === 'type1_1' ? 'selected' : ''}>ประเภท 1.1 (ไม่เกิน 150 หน่วย/ด.)</option>
                            </select>
                        </div>
                        <div>
                            <label class="font-semibold text-[var(--app-body)] block mb-1">ค่าไฟฟ้าผันแปร Ft (บาท/หน่วย) · ค่าตั้งต้น ตรวจกับบิลล่าสุด</label>
                            <input id="elecFtRate" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.ftRate))}" class="airbnb-input w-full" placeholder="0.3972">
                        </div>
                    </div>

                    <div>
                        <label class="text-xs font-semibold text-[var(--app-body)] block mb-1">จำนวนหน่วยไฟฟ้าที่ใช้ (Unit / kWh)</label>
                        <input id="elecUnitsInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.units))}" placeholder="เช่น 350" class="airbnb-input w-full text-base font-semibold">
                    </div>
                </div>

                <!-- Big Result Card -->
                <div class="themed-result-card theme-result-highlight p-5 text-center space-y-1">
                    <div class="text-xs font-semibold text-[var(--app-muted)]">ประมาณการค่าไฟฟ้ารวม</div>
                    <div class="themed-result-value text-2xl md:text-3xl font-extrabold">${formatMoney(calc.totalBill)} บาท</div>
                    <div class="text-xs text-[var(--app-body)]">
                        หน่วยไฟ ${formatNum(calc.units, 0)} หน่วย · เฉลี่ยหน่วยละ <b>${formatNum(calc.avgRatePerUnit, 2)} บาท</b>
                    </div>
                </div>

                <!-- Bill Component Breakdown -->
                <div class="themed-tool-card p-4 space-y-1 text-xs">
                    <div class="font-bold text-[var(--app-ink)] pb-1">ส่วนประกอบค่าไฟฟ้าตามบิล</div>
                    <div class="tool-summary-row flex justify-between gap-3 py-2">
                        <span class="text-[var(--app-muted)]">ค่าไฟฟ้าฐาน (ตามขั้นบันได)</span>
                        <b>${formatMoney(calc.baseEnergyCharge)} บาท</b>
                    </div>
                    <div class="tool-summary-row flex justify-between gap-3 py-2">
                        <span class="text-[var(--app-muted)]">ค่าบริการรายเดือน</span>
                        <b>${formatMoney(calc.serviceFee)} บาท</b>
                    </div>
                    <div class="tool-summary-row flex justify-between gap-3 py-2">
                        <span class="text-[var(--app-muted)]">ค่าไฟฟ้าผันแปร Ft (${formatNum(calc.ftRate, 4)} บาท/หน่วย)</span>
                        <b>${formatMoney(calc.ftCharge)} บาท</b>
                    </div>
                    <div class="tool-summary-row flex justify-between gap-3 py-2 font-semibold">
                        <span>ยอดก่อน VAT</span>
                        <b>${formatMoney(calc.preVatTotal)} บาท</b>
                    </div>
                    <div class="tool-summary-row flex justify-between gap-3 py-2">
                        <span class="text-[var(--app-muted)]">ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                        <b>+${formatMoney(calc.vat7)} บาท</b>
                    </div>
                    <div class="tool-summary-row flex justify-between gap-3 py-2 text-sm font-bold text-[var(--app-accent)]">
                        <span>รวมค่าไฟฟ้าสุทธิ</span>
                        <b>${formatMoney(calc.totalBill)} บาท</b>
                    </div>
                </div>

                <!-- Progressive Tier Table -->
                <div class="themed-tool-card p-4 space-y-2 text-xs">
                    <div class="font-semibold text-[var(--app-ink)]">ค่าไฟตามขั้นบันไดอัตราก้าวหน้า</div>
                    <div class="overflow-x-auto thin-scroll">
                        <table class="w-full text-left border-collapse text-[11px]">
                            <thead>
                                <tr class="border-b border-[var(--app-hairline)] text-[var(--app-muted)]">
                                    <th class="py-1">ขั้นหน่วยไฟฟ้า</th>
                                    <th class="py-1 text-center">อัตราต่อหน่วย</th>
                                    <th class="py-1 text-right">จำนวนหน่วยที่ใช้</th>
                                    <th class="py-1 text-right">ค่าไฟในขั้น</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${calc.tierBreakdown.map(t => `
                                    <tr class="border-b border-[var(--app-hairline)] ${t.units > 0 ? 'font-semibold text-[var(--app-ink)]' : 'text-[var(--app-muted)]'}">
                                        <td class="py-1">${t.label}</td>
                                        <td class="py-1 text-center">${formatNum(t.rate, 4)} ฿</td>
                                        <td class="py-1 text-right">${formatNum(t.units, 1)} หน่วย</td>
                                        <td class="py-1 text-right">${formatMoney(t.cost)} ฿</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="flex justify-end pt-3">
                        <button id="btnPrintElectricitySummary" type="button" class="tool-action-btn text-xs">
                            พิมพ์ใบสรุปค่าไฟฟ้า / PDF
                        </button>
                    </div>
                </div>
            ` : `
                <!-- TAB 2: เครื่องใช้ไฟฟ้าเฉพาะตัว (Wattage Calculator) -->
                <div class="themed-tool-card p-4 space-y-3">
                    <div class="flex flex-col gap-2 text-xs">
                        <span class="font-bold text-[var(--app-ink)]">รายการเครื่องใช้ไฟฟ้าในบ้าน</span>
                        <button id="btnApplyApplianceUnitsToBill" type="button" class="tool-action-btn w-full text-[11px]">
                            นำยอดหน่วยไฟไปคำนวณบิล
                        </button>
                    </div>

                    <!-- Preset Quick Pickers -->
                    <div class="space-y-1.5">
                        <div class="text-[11px] text-[var(--app-muted)] font-medium">เพิ่มเครื่องใช้ไฟฟ้ายอดนิยม</div>
                        <div class="flex flex-wrap gap-1.5">
                            <button type="button" data-add-preset="air18k" class="tool-chip-btn">แอร์ 18,000 BTU · 1,400W</button>
                            <button type="button" data-add-preset="air9k" class="tool-chip-btn">แอร์ 9,000 BTU · 600W</button>
                            <button type="button" data-add-preset="pc" class="tool-chip-btn">คอมพิวเตอร์ PC · 250W</button>
                            <button type="button" data-add-preset="iron" class="tool-chip-btn">เตารีด · 1,000W</button>
                            <button type="button" data-add-preset="fryer" class="tool-chip-btn">หม้อทอดไร้น้ำมัน · 1,400W</button>
                        </div>
                    </div>

                    <!-- Appliance Rows List -->
                    <div class="space-y-2 pt-2">
                        ${appCalc.items.length ? appCalc.items.map((item, idx) => `
                            <div class="themed-subcard p-3 text-xs space-y-2">
                                <div class="flex justify-between items-center font-semibold">
                                    <span>${item.name}</span>
                                    <button type="button" data-remove-appliance="${idx}" class="tool-danger-btn text-xs" aria-label="ลบ ${escapeHTML(item.name)}">ลบ</button>
                                </div>
                                <div class="grid grid-cols-3 gap-2">
                                    <div>
                                        <label class="text-[10px] text-[var(--app-muted)] block">กำลังไฟ (วัตต์)</label>
                                        <input type="number" data-app-field="watts" data-app-idx="${idx}" value="${item.watts}" class="airbnb-input w-full text-xs">
                                    </div>
                                    <div>
                                        <label class="text-[10px] text-[var(--app-muted)] block">จำนวนเครื่อง</label>
                                        <input type="number" min="1" data-app-field="qty" data-app-idx="${idx}" value="${item.qty}" class="airbnb-input w-full text-xs">
                                    </div>
                                    <div>
                                        <label class="text-[10px] text-[var(--app-muted)] block">ชั่วโมงเปิด/วัน</label>
                                        <input type="number" step="0.5" min="0" max="24" data-app-field="hoursPerDay" data-app-idx="${idx}" value="${item.hours}" class="airbnb-input w-full text-xs">
                                    </div>
                                </div>
                                <div class="flex flex-wrap justify-between gap-1 text-[11px] text-[var(--app-muted)] pt-2 border-t border-[var(--app-hairline)]">
                                    <span>ใช้ไฟ: <b>${formatNum(item.monthlyKwh, 1)} หน่วย/เดือน</b></span>
                                    <span>ค่าไฟประมาณ: <b class="text-[var(--app-accent)]">${formatMoney(item.monthlyCost)} ฿/เดือน</b></span>
                                </div>
                            </div>
                        `).join('') : `<div class="themed-subcard p-4 text-center text-xs text-[var(--app-muted)]">ยังไม่มีรายการ เลือกเครื่องใช้ไฟฟ้าจากด้านบนเพื่อเริ่มคำนวณ</div>`}
                    </div>

                    <!-- Appliance Total Summary Card -->
                    <div class="themed-result-card theme-result-highlight p-4 text-xs space-y-2">
                        <div class="flex justify-between gap-3">
                            <span class="text-[var(--app-muted)]">รวมการใช้ไฟทุกอุปกรณ์</span>
                            <b class="text-right">${formatNum(appCalc.totalMonthlyKwh, 1)} หน่วย/เดือน<br><span class="font-normal text-[var(--app-muted)]">${formatNum(appCalc.totalDailyKwh, 2)} หน่วย/วัน</span></b>
                        </div>
                        <div class="flex justify-between items-end gap-3 pt-2 border-t border-[var(--app-hairline)] text-sm font-bold">
                            <span>ค่าไฟโดยประมาณ</span>
                            <span class="themed-result-value text-right text-lg">${formatMoney(appCalc.totalMonthlyCost)} บาท/เดือน</span>
                        </div>
                    </div>
                </div>
                ${renderApplianceRankingTable(buildApplianceRanking(appCalc))}
            `}
        </div>
    `;

    // Event Handlers
    container.querySelectorAll('[data-elec-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.mode = btn.getAttribute('data-elec-mode');
            persistAppState();
            renderActiveTool();
        });
    });

    if (!isApplianceMode) {
        document.getElementById('elecTariffType')?.addEventListener('change', e => {
            st.tariffType = e.target.value;
            persistAppState();
            renderActiveTool();
        });

        const bindInput = (id, key) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('change', () => {
                st[key] = el.value;
                persistAppState();
                renderActiveTool();
            });
            el.addEventListener('blur', () => {
                const formatted = formatInputDisplay(el.value);
                st[key] = formatted;
                el.value = formatted;
                persistAppState();
            });
        };
        bindInput('elecUnitsInput', 'units');
        bindInput('elecFtRate', 'ftRate');

        container.querySelector('#btnPrintElectricitySummary')?.addEventListener('click', () => {
            triggerPrintReceipt('electricity_bill');
        });

        if (calc.units <= 0) {
            setStatusBanner('empty', 'กรุณาระบุจำนวนหน่วยไฟฟ้าเพื่อคำนวณค่าไฟ');
        } else {
            setStatusBanner('success', `ค่าไฟฟ้า ${formatNum(calc.units, 0)} หน่วย: <b class="text-[var(--app-accent)]">${formatMoney(calc.totalBill)} บาท</b> (เฉลี่ยหน่วยละ ${formatNum(calc.avgRatePerUnit, 2)} บ.)`);
        }
    } else {
        // Appliance Mode Handlers
        container.querySelectorAll('[data-app-field]').forEach(inp => {
            inp.addEventListener('change', () => {
                const idx = parseInt(inp.getAttribute('data-app-idx'), 10);
                const field = inp.getAttribute('data-app-field');
                if (st.appliances[idx]) {
                    st.appliances[idx][field] = parseFloat(inp.value) || 0;
                    persistAppState();
                    renderActiveTool();
                }
            });
        });

        container.querySelectorAll('[data-remove-appliance]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-remove-appliance'), 10);
                st.appliances.splice(idx, 1);
                persistAppState();
                renderActiveTool();
            });
        });

        container.querySelectorAll('[data-add-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-add-preset');
                const presetsMap = {
                    air18k: { id: 'air18k', name: 'แอร์ Inverter 18,000 BTU', watts: 1400, qty: 1, hoursPerDay: 8 },
                    air9k: { id: 'air9k', name: 'แอร์ Inverter 9,000 BTU', watts: 600, qty: 1, hoursPerDay: 8 },
                    pc: { id: 'pc', name: 'คอมพิวเตอร์ PC ทำงาน/เล่นเกม', watts: 250, qty: 1, hoursPerDay: 6 },
                    iron: { id: 'iron', name: 'เตารีดไฟฟ้า', watts: 1000, qty: 1, hoursPerDay: 0.5 },
                    fryer: { id: 'fryer', name: 'หม้อทอดไร้น้ำมัน/ไมโครเวฟ', watts: 1400, qty: 1, hoursPerDay: 0.5 }
                };
                if (presetsMap[type]) {
                    st.appliances.push(presetsMap[type]);
                    persistAppState();
                    renderActiveTool();
                }
            });
        });

        document.getElementById('btnApplyApplianceUnitsToBill')?.addEventListener('click', () => {
            st.units = Math.round(appCalc.totalMonthlyKwh).toString();
            st.mode = 'bill';
            persistAppState();
            renderActiveTool();
        });

        setStatusBanner('success', `รวมการใช้ไฟ ${st.appliances.length} รายการ: <b>${formatNum(appCalc.totalMonthlyKwh, 1)} หน่วย/เดือน</b> (ประมาณ ${formatMoney(appCalc.totalMonthlyCost)} บาท)`);
    }
}

// Module export definitions
(function(root) {
    const exportsObj = {
        parseThaiGoldApiResponse,
        loadThaiGoldRates,
        calculateGoldThai,
        calculateElectricityBill,
        calculateApplianceEnergy,
        renderGoldThaiTool,
        renderElectricityBillTool
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
