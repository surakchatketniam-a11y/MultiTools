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
        rateSource: 'สมาคมค้าทองคำ',
        lastUpdated: null,
        apiUpdateDate: '',
        apiUpdateTime: ''
    };

    const calc = calculateGoldThai(st);

    let modeTitle = '🛒 คำนวณราคาซื้อทองคำ';
    if (st.mode === 'sell') modeTitle = '💰 คำนวณราคารับซื้อคืน (สคบ./เยาวราช)';
    else if (st.mode === 'savings') modeTitle = '📈 จำลองกำไร/ขาดทุนการออมทอง';

    container.innerHTML = `
        <div class="flex flex-col gap-3 p-1">
            <!-- Mode Switcher Tabs -->
            <div class="segment-group grid-cols-3 balanced-segment-modes" role="tablist" aria-label="โหมดราคาทองคำ">
                <button type="button" class="segment-btn ${st.mode === 'buy' ? 'active' : ''}" data-gold-mode="buy">🛒 ซื้อทอง</button>
                <button type="button" class="segment-btn ${st.mode === 'sell' ? 'active' : ''}" data-gold-mode="sell">💰 ขายคืน</button>
                <button type="button" class="segment-btn ${st.mode === 'savings' ? 'active' : ''}" data-gold-mode="savings">📈 ออมทอง</button>
            </div>

            <!-- Reference Prices Banner (Gold Association Bar) -->
            <div class="bg-amber-500/10 border border-amber-500/30 rounded-[var(--app-card-radius)] p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1.5" style="box-shadow:var(--app-elevation)">
                <div class="flex justify-between items-center font-bold">
                    <span class="flex items-center gap-1.5 truncate">
                        👑 ราคาทองสมาคมค้าทองคำ (96.5%)
                    </span>
                    <div class="flex items-center gap-2 shrink-0">
                        <button id="btnFetchGoldRates" type="button" class="flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:underline cursor-pointer ${goldFetchInFlight ? 'opacity-50 pointer-events-none' : ''}">
                            <span class="${goldFetchInFlight ? 'animate-spin inline-block' : ''}">🔄</span> ${goldFetchInFlight ? 'กำลังดึง...' : 'ดึงราคาวันนี้'}
                        </button>
                        <span class="text-neutral-300 dark:text-neutral-700">|</span>
                        <button id="btnToggleCustomGoldRates" type="button" class="text-[11px] underline text-neutral-500 hover:text-neutral-700 dark:text-neutral-400">ปรับราคาเอง</button>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-[11px]">
                    <div class="bg-white/80 dark:bg-black/20 p-2 rounded-lg">
                        <span class="text-neutral-500 block">ทองคำแท่ง 96.5%</span>
                        <b>รับซื้อ: ${formatMoney(calc.prices.priceBarBuy)} | ขายออก: ${formatMoney(calc.prices.priceBarSell)}</b>
                    </div>
                    <div class="bg-white/80 dark:bg-black/20 p-2 rounded-lg">
                        <span class="text-neutral-500 block">ทองรูปพรรณ 96.5%</span>
                        <b>รับซื้อ: ${formatMoney(calc.prices.priceOrnamentBuy)} | ขายออก: ${formatMoney(calc.prices.priceOrnamentSell)}</b>
                    </div>
                </div>

                <div class="flex justify-between items-center text-[10px] text-neutral-500 dark:text-neutral-400 pt-0.5">
                    <span>แหล่งข้อมูล: ${escapeHTML(st.rateSource || 'สมาคมค้าทองคำ')} ${st.apiUpdateTime ? `(${escapeHTML(st.apiUpdateTime)})` : ''}</span>
                    ${st.lastUpdated ? `<span>อัปเดต: ${new Date(st.lastUpdated).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>` : ''}
                </div>

                <!-- Custom Rates Inputs (Hidden by default) -->
                <div id="goldCustomRatesPanel" class="hidden pt-2 border-t border-amber-300 dark:border-amber-800 space-y-2">
                    <div class="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">กำหนดราคาทองตามประกาศปัจจุบัน (บาทละ):</div>
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
            <div class="bg-white dark:bg-[#1f1f1f] border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-3" style="box-shadow:var(--app-elevation)">
                <div class="text-xs font-bold text-[#1f2937] dark:text-[#f3f4f6] flex items-center justify-between">
                    <span>${modeTitle}</span>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label class="font-semibold text-[#6a6a6a] dark:text-neutral-400 block mb-1">ประเภททองคำ</label>
                        <select id="goldTypeSelect" class="airbnb-input w-full">
                            <option value="ornament" ${st.goldType === 'ornament' ? 'selected' : ''}>ทองรูปพรรณ (มีค่ากำเหน็จ)</option>
                            <option value="bar" ${st.goldType === 'bar' ? 'selected' : ''}>ทองคำแท่ง (ไม่มี/กำเหน็จน้อย)</option>
                        </select>
                    </div>
                    <div>
                        <label class="font-semibold text-[#6a6a6a] dark:text-neutral-400 block mb-1">หน่วยน้ำหนัก</label>
                        <select id="goldUnitSelect" class="airbnb-input w-full">
                            <option value="baht" ${st.weightUnit === 'baht' ? 'selected' : ''}>บาททองคำ</option>
                            <option value="salung" ${st.weightUnit === 'salung' ? 'selected' : ''}>สลึง (1/4 บาท)</option>
                            <option value="gram" ${st.weightUnit === 'gram' ? 'selected' : ''}>กรัม (g)</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-xs font-semibold text-[#6a6a6a] dark:text-neutral-400 block mb-1">
                            จำนวนน้ำหนัก (${st.weightUnit === 'baht' ? 'บาท' : (st.weightUnit === 'salung' ? 'สลึง' : 'กรัม')})
                        </label>
                        <input id="goldWeightInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.weightValue))}" placeholder="เช่น 1 หรือ 0.5" class="airbnb-input w-full">
                    </div>
                    ${st.mode === 'savings' ? `
                        <div>
                            <label class="text-xs font-semibold text-[#6a6a6a] dark:text-neutral-400 block mb-1">ต้นทุนเฉลี่ยที่ซื้อมา (บาทละ)</label>
                            <input id="goldSavingsCostInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.savingsCostPerBaht))}" placeholder="เช่น 40,000" class="airbnb-input w-full">
                        </div>
                    ` : `
                        <div>
                            <label class="text-xs font-semibold text-[#6a6a6a] dark:text-neutral-400 block mb-1">ค่ากำเหน็จ (บาท)</label>
                            <input id="goldCraftFeeInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.craftFee))}" placeholder="เช่น 800" class="airbnb-input w-full">
                        </div>
                    `}
                </div>

                <!-- Weight Equivalent Pill Badges -->
                <div class="flex flex-wrap gap-1.5 pt-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                    <span class="bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full font-medium">
                        ⚖️ เทียบเท่า: <b>${formatNum(calc.bahtWeight, 4)} บาท</b>
                    </span>
                    <span class="bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full font-medium">
                        🪙 <b>${formatNum(calc.salungWeight, 2)} สลึง</b>
                    </span>
                    <span class="bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full font-medium">
                        🏷️ <b>${formatNum(calc.totalGrams, 3)} กรัม</b> (${formatNum(calc.gramsPerBaht, 3)}g/บาท)
                    </span>
                </div>
            </div>

            <!-- Big Result Card -->
            ${st.mode === 'buy' ? `
                <div class="border rounded-[var(--app-card-radius)] p-4 text-center border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-1" style="box-shadow:var(--app-elevation)">
                    <div class="text-xs font-semibold uppercase tracking-wider">💰 ราคาซื้อสุทธิที่หน้าร้าน</div>
                    <div class="text-2xl md:text-3xl font-extrabold text-[var(--app-accent)]">${formatMoney(calc.totalBuyPrice)} บาท</div>
                    <div class="text-xs opacity-90">
                        (ราคาทองคำ: ${formatMoney(calc.rawGoldValue)} บ. + ค่ากำเหน็จ: ${formatMoney(calc.craftFee)} บ.)
                    </div>
                </div>
            ` : (st.mode === 'sell' ? `
                <div class="border rounded-[var(--app-card-radius)] p-4 text-center border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 space-y-1" style="box-shadow:var(--app-elevation)">
                    <div class="text-xs font-semibold uppercase tracking-wider">💵 ราคารับซื้อคืนขั้นต่ำ (ตามเกณฑ์ สคบ.)</div>
                    <div class="text-2xl md:text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">${formatMoney(calc.sellBackValue)} บาท</div>
                    <div class="text-xs opacity-90">
                        เรทรับซื้อ: ${formatMoney(calc.officialSellBackRate)} ฿/บาท | หักจากราคาขายออกประมาณ: ${formatMoney(calc.deductionFromSellPrice)} ฿
                    </div>
                </div>
            ` : `
                <div class="border rounded-[var(--app-card-radius)] p-4 text-center ${calc.isProfit ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200'} space-y-1" style="box-shadow:var(--app-elevation)">
                    <div class="text-xs font-semibold uppercase tracking-wider">
                        ${calc.isProfit ? '🎉 ผลกำไรจากการออมทอง' : '⚠️ ผลขาดทุนจากการออมทอง'}
                    </div>
                    <div class="text-2xl md:text-3xl font-extrabold">
                        ${calc.isProfit ? '+' : ''}${formatMoney(calc.profitLoss)} บาท (${calc.isProfit ? '+' : ''}${formatNum(calc.profitLossPercent, 2)}%)
                    </div>
                    <div class="text-xs opacity-90">
                        มูลค่าตลาดปัจจุบัน: ${formatMoney(calc.currentMarketValue)} บ. | ต้นทุนที่ซื้อ: ${formatMoney(calc.totalInvested)} บ.
                    </div>
                </div>
            `)}

            <!-- Breakdown & Comparison Details -->
            <div class="bg-white dark:bg-[#1f1f1f] border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-2 text-xs" style="box-shadow:var(--app-elevation)">
                <div class="font-bold text-neutral-800 dark:text-neutral-200 mb-1">สรุปข้อมูลเชิงเปรียบเทียบการซื้อ-ขาย</div>
                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                    <span class="text-neutral-600 dark:text-neutral-400">ราคาขายออกสมาคม (${st.goldType === 'bar' ? 'ทองแท่ง' : 'รูปพรรณ'})</span>
                    <b>${formatMoney(calc.baseBuyRate)} บาท/บาททอง</b>
                </div>
                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                    <span class="text-neutral-600 dark:text-neutral-400">ราคารับซื้อคืนสมาคม</span>
                    <b>${formatMoney(calc.officialSellBackRate)} บาท/บาททอง</b>
                </div>
                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                    <span class="text-neutral-600 dark:text-neutral-400">ส่วนต่างรับซื้อ-ขายออกต่อ 1 บาท</span>
                    <b class="text-rose-600 dark:text-rose-400">-${formatMoney(calc.baseBuyRate - calc.officialSellBackRate)} บาท</b>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-neutral-600 dark:text-neutral-400">ค่ากำเหน็จเฉลี่ยที่ตั้งไว้</span>
                    <b>${formatMoney(calc.craftFee)} บาท</b>
                </div>
                <div class="flex justify-end pt-2">
                    <button id="btnPrintGoldThaiSummary" type="button" class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
                        🖨️ พิมพ์ใบสรุปราคาทอง / PDF
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
        <div class="flex flex-col gap-3 p-1">
            <!-- Mode Selector Tabs -->
            <div class="segment-group grid-cols-2 balanced-segment-modes" role="tablist" aria-label="โหมดคำนวณค่าไฟ">
                <button type="button" class="segment-btn ${!isApplianceMode ? 'active' : ''}" data-elec-mode="bill">⚡ คำนวณจากหน่วยในบิล</button>
                <button type="button" class="segment-btn ${isApplianceMode ? 'active' : ''}" data-elec-mode="appliance">🔌 คำนวณตามเครื่องใช้ไฟฟ้า</button>
            </div>

            ${!isApplianceMode ? `
                <!-- TAB 1: บิลค่าไฟ & ขั้นบันได -->
                <div class="bg-white dark:bg-[#1f1f1f] border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-3" style="box-shadow:var(--app-elevation)">
                    <div class="text-xs font-bold text-[#1f2937] dark:text-[#f3f4f6]">🏠 ข้อมูลประเภทบ้านและหน่วยไฟ (กฟน. / กฟภ.)</div>
                    
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <label class="font-semibold text-[#6a6a6a] dark:text-neutral-400 block mb-1">ประเภทบ้านอยู่อาศัย</label>
                            <select id="elecTariffType" class="airbnb-input w-full">
                                <option value="type1_2" ${st.tariffType === 'type1_2' ? 'selected' : ''}>ประเภท 1.2 (เกิน 150 หน่วย/ด.)</option>
                                <option value="type1_1" ${st.tariffType === 'type1_1' ? 'selected' : ''}>ประเภท 1.1 (ไม่เกิน 150 หน่วย/ด.)</option>
                            </select>
                        </div>
                        <div>
                            <label class="font-semibold text-[#6a6a6a] dark:text-neutral-400 block mb-1">ค่าไฟฟ้าผันแปร Ft (บาท/หน่วย)</label>
                            <input id="elecFtRate" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.ftRate))}" class="airbnb-input w-full" placeholder="0.3972">
                        </div>
                    </div>

                    <div>
                        <label class="text-xs font-semibold text-[#6a6a6a] dark:text-neutral-400 block mb-1">จำนวนหน่วยไฟฟ้าที่ใช้ (Unit / kWh)</label>
                        <input id="elecUnitsInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.units))}" placeholder="เช่น 350" class="airbnb-input w-full text-base font-semibold">
                    </div>
                </div>

                <!-- Big Result Card -->
                <div class="border rounded-[var(--app-card-radius)] p-4 text-center border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-1" style="box-shadow:var(--app-elevation)">
                    <div class="text-xs font-semibold uppercase tracking-wider">⚡ ประมาณการยอดค่าไฟฟ้ารวมทั้งสิ้น</div>
                    <div class="text-2xl md:text-3xl font-extrabold text-[var(--app-accent)]">${formatMoney(calc.totalBill)} บาท</div>
                    <div class="text-xs opacity-90">
                        หน่วยไฟ ${formatNum(calc.units, 0)} หน่วย · เฉลี่ยหน่วยละ <b>${formatNum(calc.avgRatePerUnit, 2)} บาท</b>
                    </div>
                </div>

                <!-- Bill Component Breakdown -->
                <div class="bg-white dark:bg-[#1f1f1f] border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-2 text-xs" style="box-shadow:var(--app-elevation)">
                    <div class="font-bold text-neutral-800 dark:text-neutral-200 mb-1">ส่วนประกอบค่าไฟฟ้าตามบิลทางการ</div>
                    <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                        <span class="text-neutral-600 dark:text-neutral-400">1. ค่าไฟฟ้าฐาน (ตามขั้นบันได)</span>
                        <b>${formatMoney(calc.baseEnergyCharge)} บาท</b>
                    </div>
                    <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                        <span class="text-neutral-600 dark:text-neutral-400">2. ค่าบริการรายเดือน</span>
                        <b>${formatMoney(calc.serviceFee)} บาท</b>
                    </div>
                    <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                        <span class="text-neutral-600 dark:text-neutral-400">3. ค่าไฟฟ้าผันแปร Ft (${formatNum(calc.ftRate, 4)} ฿/หน่วย)</span>
                        <b>${formatMoney(calc.ftCharge)} บาท</b>
                    </div>
                    <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800 font-semibold">
                        <span>ยอดก่อน VAT</span>
                        <b>${formatMoney(calc.preVatTotal)} บาท</b>
                    </div>
                    <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                        <span class="text-neutral-600 dark:text-neutral-400">4. ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                        <b>+${formatMoney(calc.vat7)} บาท</b>
                    </div>
                    <div class="flex justify-between py-1 text-sm font-bold text-[var(--app-accent)]">
                        <span>รวมค่าไฟฟ้าสุทธิ</span>
                        <b>${formatMoney(calc.totalBill)} บาท</b>
                    </div>
                </div>

                <!-- Progressive Tier Table -->
                <div class="bg-white dark:bg-[#1f1f1f] border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3.5 space-y-2 text-xs" style="box-shadow:var(--app-elevation)">
                    <div class="font-semibold text-neutral-800 dark:text-neutral-200">แจกแจงค่าไฟตามขั้นบันไดอัตราก้าวหน้า</div>
                    <div class="overflow-x-auto thin-scroll">
                        <table class="w-full text-left border-collapse text-[11px]">
                            <thead>
                                <tr class="border-b border-neutral-200 dark:border-neutral-700 text-[#6a6a6a] dark:text-neutral-400">
                                    <th class="py-1">ขั้นหน่วยไฟฟ้า</th>
                                    <th class="py-1 text-center">อัตราต่อหน่วย</th>
                                    <th class="py-1 text-right">จำนวนหน่วยที่ใช้</th>
                                    <th class="py-1 text-right">ค่าไฟในขั้น</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${calc.tierBreakdown.map(t => `
                                    <tr class="border-b border-neutral-100 dark:border-neutral-800 ${t.units > 0 ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-600'}">
                                        <td class="py-1">${t.label}</td>
                                        <td class="py-1 text-center">${formatNum(t.rate, 4)} ฿</td>
                                        <td class="py-1 text-right">${formatNum(t.units, 1)} หน่วย</td>
                                        <td class="py-1 text-right">${formatMoney(t.cost)} ฿</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="flex justify-end pt-1">
                        <button id="btnPrintElectricitySummary" type="button" class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
                            🖨️ พิมพ์ใบสรุปค่าไฟฟ้า / PDF
                        </button>
                    </div>
                </div>
            ` : `
                <!-- TAB 2: เครื่องใช้ไฟฟ้าเฉพาะตัว (Wattage Calculator) -->
                <div class="bg-white dark:bg-[#1f1f1f] border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-3" style="box-shadow:var(--app-elevation)">
                    <div class="flex justify-between items-center text-xs">
                        <span class="font-bold text-[#1f2937] dark:text-[#f3f4f6]">รายการเครื่องใช้ไฟฟ้าในบ้าน</span>
                        <button id="btnApplyApplianceUnitsToBill" class="px-2.5 py-1 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition">
                            ⚡ นำยอดหน่วยไฟไปคำนวณบิล
                        </button>
                    </div>

                    <!-- Preset Quick Pickers -->
                    <div class="space-y-1.5">
                        <div class="text-[11px] text-[#6a6a6a] dark:text-neutral-400 font-medium">+ เพิ่มเครื่องใช้ไฟฟ้ายอดนิยม:</div>
                        <div class="flex flex-wrap gap-1 text-[11px]">
                            <button type="button" data-add-preset="air18k" class="px-2 py-0.5 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800">แอร์ 18,000 BTU (1,400W)</button>
                            <button type="button" data-add-preset="air9k" class="px-2 py-0.5 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800">แอร์ 9,000 BTU (600W)</button>
                            <button type="button" data-add-preset="pc" class="px-2 py-0.5 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800">คอมพิวเตอร์ PC (250W)</button>
                            <button type="button" data-add-preset="iron" class="px-2 py-0.5 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800">เตารีด (1,000W)</button>
                            <button type="button" data-add-preset="fryer" class="px-2 py-0.5 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800">หม้อทอดไร้น้ำมัน (1,400W)</button>
                        </div>
                    </div>

                    <!-- Appliance Rows List -->
                    <div class="space-y-2 pt-2">
                        ${appCalc.items.map((item, idx) => `
                            <div class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5 text-xs space-y-2 bg-neutral-50/50 dark:bg-neutral-800/20">
                                <div class="flex justify-between items-center font-semibold">
                                    <span>${item.name}</span>
                                    <button type="button" data-remove-appliance="${idx}" class="text-rose-500 hover:text-rose-700 text-xs">✕ ลบ</button>
                                </div>
                                <div class="grid grid-cols-3 gap-2">
                                    <div>
                                        <label class="text-[10px] text-neutral-500 block">กำลังไฟ (วัตต์)</label>
                                        <input type="number" data-app-field="watts" data-app-idx="${idx}" value="${item.watts}" class="airbnb-input w-full text-xs">
                                    </div>
                                    <div>
                                        <label class="text-[10px] text-neutral-500 block">จำนวนเครื่อง</label>
                                        <input type="number" min="1" data-app-field="qty" data-app-idx="${idx}" value="${item.qty}" class="airbnb-input w-full text-xs">
                                    </div>
                                    <div>
                                        <label class="text-[10px] text-neutral-500 block">ชั่วโมงเปิด/วัน</label>
                                        <input type="number" step="0.5" min="0" max="24" data-app-field="hoursPerDay" data-app-idx="${idx}" value="${item.hours}" class="airbnb-input w-full text-xs">
                                    </div>
                                </div>
                                <div class="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                                    <span>ใช้ไฟ: <b>${formatNum(item.monthlyKwh, 1)} หน่วย/เดือน</b></span>
                                    <span>ค่าไฟประมาณ: <b class="text-[var(--app-accent)]">${formatMoney(item.monthlyCost)} ฿/เดือน</b></span>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Appliance Total Summary Card -->
                    <div class="border rounded-xl p-3 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-xs space-y-1">
                        <div class="flex justify-between">
                            <span class="text-blue-900 dark:text-blue-300">รวมการใช้ไฟทุกอุปกรณ์:</span>
                            <b class="text-blue-900 dark:text-blue-200">${formatNum(appCalc.totalMonthlyKwh, 1)} หน่วย/เดือน (${formatNum(appCalc.totalDailyKwh, 2)} หน่วย/วัน)</b>
                        </div>
                        <div class="flex justify-between text-sm font-bold text-blue-900 dark:text-blue-200">
                            <span>ประมาณการค่าไฟฟ้ารวม:</span>
                            <span class="text-[var(--app-accent)]">${formatMoney(appCalc.totalMonthlyCost)} บาท/เดือน</span>
                        </div>
                    </div>
                </div>
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
