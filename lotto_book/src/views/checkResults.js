/**
 * lotto_book - View 2: Check Prize Results (ตรวจผลรางวัล)
 * Verifies tickets against official GLO results, separates 4 statuses:
 * upcoming (ยังไม่ออก), no_data (ยังไม่มีข้อมูล), won (ถูกรางวัล), lost (ไม่ถูกรางวัล),
 * and provides full financial gain/loss summaries.
 */

(function(root) {
    'use strict';

    const THAI_MONTHS = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    function formatThaiDate(isoDateStr) {
        if (!isoDateStr) return '';
        const parts = isoDateStr.split('-');
        if (parts.length !== 3) return isoDateStr;
        const year = parseInt(parts[0], 10) + 543;
        const month = THAI_MONTHS[parseInt(parts[1], 10) - 1] || '';
        const day = parseInt(parts[2], 10);
        return `${day} ${month} ${year}`;
    }

    const CheckResultsView = {
        selectedDrawDate: null,
        manualCheckNumber: '',
        manualCheckResult: null,
        isMinorPrizesExpanded: false,

        render(container) {
            if (!container) return;

            const resultsList = root.LottoApp.historicalResults || [];
            const resultsMap = root.LottoApp.resultsMap || {};
            const userTickets = root.LottoStorage.getTickets();

            // Auto-select latest draw in dataset if not set
            if (!this.selectedDrawDate) {
                if (resultsList.length > 0) {
                    this.selectedDrawDate = resultsList[0].drawDate;
                } else if (userTickets.length > 0) {
                    this.selectedDrawDate = userTickets[0].drawDate;
                } else {
                    this.selectedDrawDate = new Date().toISOString().slice(0, 10);
                }
            }

            const currentDrawResult = resultsMap[this.selectedDrawDate] || null;
            const drawTickets = userTickets.filter(t => t.drawDate === this.selectedDrawDate);

            // Evaluate all tickets for this draw
            const evaluatedTickets = drawTickets.map(t => root.LottoChecker.checkTicket(t, currentDrawResult));
            const summary = root.LottoChecker.summarizeCheckResults(evaluatedTickets);

            container.innerHTML = `
                <div class="space-y-6">
                    <!-- Top Controls: Select Draw Date & Quick Check -->
                    <div class="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700/60">
                            <div>
                                <h3 class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span>🔍</span> เลือกงวดเพื่อตรวจผลรางวัล
                                </h3>
                                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    ตรวจสลากที่บันทึกไว้ในงวดนี้อัตโนมัติ หรือพิมพ์เลขตรวจทันที
                                </p>
                            </div>

                            <!-- Draw Date Picker Dropdown -->
                            <div class="flex items-center gap-2 w-full sm:w-auto">
                                <select id="checkDrawSelect" class="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#FF385C] focus:outline-none w-full sm:w-auto">
                                    ${resultsList.slice(0, 48).map(r => `
                                        <option value="${r.drawDate}" ${r.drawDate === this.selectedDrawDate ? 'selected' : ''}>
                                            งวด ${r.dateFormatted || formatThaiDate(r.drawDate)}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>

                        <!-- Manual Quick Number Checker -->
                        <div class="bg-gray-50 dark:bg-gray-750 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/60">
                            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                ⚡ พิมพ์เลขตรวจทันทีในงวดนี้ (6 หลัก, 3 ตัว, หรือ 2 ตัว):
                            </label>
                            <div class="flex gap-2">
                                <input type="text" id="manualCheckInput" value="${this.manualCheckNumber || ''}" placeholder="ระบุเลขสลาก เช่น 757563 หรือ 32" maxlength="6"
                                    class="flex-1 font-lotto text-base font-bold text-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF385C] focus:outline-none">
                                <button type="button" id="btnManualCheck" class="px-5 py-2 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl text-sm font-semibold transition">
                                    ตรวจเลข
                                </button>
                            </div>

                            <!-- Manual Check Result Badge -->
                            ${this.manualCheckResult ? `
                                <div class="mt-3 p-3 rounded-xl border ${this.manualCheckResult.status === 'won' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800' : (this.manualCheckResult.status === 'lost' ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800')}">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <span class="font-lotto font-bold text-base text-gray-900 dark:text-white">${this.manualCheckResult.ticketNumber}</span>
                                            <span class="text-xs font-bold ${this.manualCheckResult.status === 'won' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}">
                                                ${this.manualCheckResult.statusBadge}
                                            </span>
                                        </div>
                                        ${this.manualCheckResult.totalPrize > 0 ? `
                                            <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                +฿${this.manualCheckResult.totalPrize.toLocaleString()}
                                            </span>
                                        ` : ''}
                                    </div>
                                    <div class="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                        ${this.manualCheckResult.statusText}
                                    </div>
                                    ${this.manualCheckResult.matchesFirstPrizeTail ? `
                                        <div class="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-medium">
                                            💡 หมายเหตุ: เลข 2 ตัวท้ายตรงกับ 2 ตัวท้ายของรางวัลที่ 1 (${this.manualCheckResult.firstPrizeTail}) แต่ในสลากกินแบ่งรัฐบาล รางวัลเลขท้าย 2 ตัวเป็นรางวัลเฉพาะที่แยกต่างหาก
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Official Winning Numbers Board for Selected Draw -->
                    ${currentDrawResult ? `
                        <div class="bg-gradient-to-br from-rose-500/10 via-white to-amber-500/10 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 p-5 rounded-2xl border border-rose-200/60 dark:border-gray-700 shadow-sm space-y-4">
                            <div class="flex justify-between items-center">
                                <div>
                                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#FF385C]">ผลการออกรางวัลอย่างเป็นทางการ</span>
                                    <h4 class="text-base font-bold text-gray-900 dark:text-white">
                                        งวดประจำวันที่ ${currentDrawResult.dateFormatted || formatThaiDate(currentDrawResult.drawDate)}
                                    </h4>
                                </div>
                                <span class="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full font-semibold">
                                    ✓ ฐานข้อมูล GLO
                                </span>
                            </div>

                            <!-- Primary Prizes Grid -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <!-- First Prize -->
                                <div class="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-rose-100 dark:border-gray-700 shadow-xs sm:col-span-2 flex flex-col justify-between">
                                    <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        <span class="font-bold text-[#FF385C]">🏆 รางวัลที่ 1</span>
                                        <span>รางวัลละ 6,000,000 บาท</span>
                                    </div>
                                    <div class="text-center py-2">
                                        <span class="font-lotto text-3xl font-extrabold tracking-widest text-[#FF385C]">
                                            ${currentDrawResult.prizes.first || '------'}
                                        </span>
                                    </div>
                                    <div class="text-[11px] text-center text-gray-400">
                                        ข้างเคียง: ${(currentDrawResult.prizes.nearFirst || []).join(', ') || '-'}
                                    </div>
                                </div>

                                <!-- Back 2 Digits Prize (Highlighted) -->
                                <div class="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-amber-200 dark:border-gray-700 shadow-xs flex flex-col justify-between">
                                    <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        <span class="font-bold text-amber-600 dark:text-amber-400">🎯 เลขท้าย 2 ตัว</span>
                                        <span>2,000 บ.</span>
                                    </div>
                                    <div class="text-center py-2">
                                        <span class="font-lotto text-3xl font-extrabold tracking-widest text-amber-600 dark:text-amber-400">
                                            ${currentDrawResult.prizes.back2 || '--'}
                                        </span>
                                    </div>
                                    <div class="text-[10px] text-center text-gray-400 italic">
                                        *รางวัลเฉพาะ (ไม่ใช่ 2 ตัวท้าย รว.1)
                                    </div>
                                </div>

                                <!-- Front 3 & Back 3 Digits -->
                                <div class="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-blue-100 dark:border-gray-700 shadow-xs flex flex-col justify-between">
                                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1 flex justify-between">
                                        <span class="font-bold text-blue-600 dark:text-blue-400">เลขหน้า 3 ตัว (4,000 บ.)</span>
                                    </div>
                                    <div class="flex justify-around items-center py-0.5">
                                        ${(currentDrawResult.prizes.front3 || []).map(f => `
                                            <span class="font-lotto text-lg font-bold text-blue-600 dark:text-blue-400">${f}</span>
                                        `).join('')}
                                    </div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1 border-t border-gray-100 dark:border-gray-700 pt-1">
                                        <span class="font-bold text-indigo-600 dark:text-indigo-400">เลขท้าย 3 ตัว (4,000 บ.)</span>
                                    </div>
                                    <div class="flex justify-around items-center py-0.5">
                                        ${(currentDrawResult.prizes.back3 || []).map(b => `
                                            <span class="font-lotto text-lg font-bold text-indigo-600 dark:text-indigo-400">${b}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>

                            <!-- Expand Minor Prizes (2nd - 5th) -->
                            <div class="pt-1">
                                <button type="button" id="btnToggleMinorPrizes" class="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#FF385C] flex items-center gap-1">
                                    <span>${this.isMinorPrizesExpanded ? '▼ ซ่อนรางวัลที่ 2 - 5' : '▶ ดูรางวัลที่ 2, 3, 4, 5'}</span>
                                </button>

                                ${this.isMinorPrizesExpanded ? `
                                    <div class="mt-3 space-y-3 bg-white/80 dark:bg-gray-800/80 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                                        <div>
                                            <div class="font-bold text-gray-800 dark:text-gray-200 mb-1">รางวัลที่ 2 (5 รางวัล ละ 200,000 บาท):</div>
                                            <div class="flex flex-wrap gap-2 font-lotto font-semibold text-gray-700 dark:text-gray-300">
                                                ${(currentDrawResult.prizes.second || []).join('   ') || 'ไม่มีข้อมูล'}
                                            </div>
                                        </div>
                                        <div>
                                            <div class="font-bold text-gray-800 dark:text-gray-200 mb-1">รางวัลที่ 3 (10 รางวัล ละ 80,000 บาท):</div>
                                            <div class="flex flex-wrap gap-2 font-lotto text-gray-700 dark:text-gray-300">
                                                ${(currentDrawResult.prizes.third || []).join('   ') || 'ไม่มีข้อมูล'}
                                            </div>
                                        </div>
                                        <div>
                                            <div class="font-bold text-gray-800 dark:text-gray-200 mb-1">รางวัลที่ 4 (50 รางวัล ละ 40,000 บาท):</div>
                                            <div class="flex flex-wrap gap-2 font-lotto text-[11px] text-gray-600 dark:text-gray-400">
                                                ${(currentDrawResult.prizes.fourth || []).join(' ') || 'ไม่มีข้อมูล'}
                                            </div>
                                        </div>
                                        <div>
                                            <div class="font-bold text-gray-800 dark:text-gray-200 mb-1">รางวัลที่ 5 (100 รางวัล ละ 20,000 บาท):</div>
                                            <div class="flex flex-wrap gap-2 font-lotto text-[11px] text-gray-600 dark:text-gray-400">
                                                ${(currentDrawResult.prizes.fifth || []).join(' ') || 'ไม่มีข้อมูล'}
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : `
                        <div class="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                            <div class="text-3xl mb-1">⚠️</div>
                            <h4 class="text-sm font-bold text-amber-800 dark:text-amber-200">ยังไม่มีข้อมูลผลรางวัลในระบบสำหรับงวดนี้</h4>
                            <p class="text-xs text-amber-600 dark:text-amber-400 mt-1 max-w-md mx-auto">
                                งวดนี้อาจยังไม่ถึงกำหนดออกรางวัล หรือยังไม่มีการนำเข้าผลรางวัลในฐานข้อมูล ระบบจะไม่ตัดสินว่าสลากของคุณไม่ถูกรางวัลจนกว่าจะมีข้อมูลผลที่ถูกต้อง
                            </p>
                        </div>
                    `}

                    <!-- Auto-Checked Saved Tickets Section -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <h3 class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span>🎯</span> สลากของคุณในงวดนี้ (${drawTickets.length} ใบ)
                                </h3>
                                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    ผลการตรวจตามฐานข้อมูลผลรางวัล
                                </p>
                            </div>

                            <!-- Net Financial Gain/Loss Badge -->
                            <div class="flex items-center gap-3">
                                <div class="text-right">
                                    <div class="text-xs text-gray-500 dark:text-gray-400">
                                        ลงทุน ฿${summary.totalSpent.toLocaleString()} | ได้รางวัล ฿${summary.totalPrizeWon.toLocaleString()}
                                    </div>
                                    <div class="text-sm font-bold ${summary.netProfitLoss > 0 ? 'text-emerald-600 dark:text-emerald-400' : (summary.netProfitLoss < 0 ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300')}">
                                        ${summary.netProfitLoss > 0 ? `+฿${summary.netProfitLoss.toLocaleString()} (กำไร)` : (summary.netProfitLoss < 0 ? `-฿${Math.abs(summary.netProfitLoss).toLocaleString()} (ขาดทุน)` : '฿0')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tickets List -->
                        ${drawTickets.length === 0 ? `
                            <div class="p-10 text-center text-gray-400 dark:text-gray-500">
                                <div class="text-3xl mb-2">🎟️</div>
                                <div class="text-sm font-medium">คุณยังไม่ได้บันทึกสลากในงวดนี้</div>
                                <div class="text-xs mt-1">
                                    ไปที่แท็บ <a href="#tickets" class="text-[#FF385C] underline font-semibold">"สลากของฉัน"</a> เพื่อเพิ่มสลาก
                                </div>
                            </div>
                        ` : `
                            <div class="divide-y divide-gray-100 dark:divide-gray-700/60">
                                ${evaluatedTickets.map(evalItem => {
                                    const isWon = evalItem.status === 'won';
                                    const isLost = evalItem.status === 'lost';
                                    const isUpcoming = evalItem.status === 'upcoming';
                                    const isNoData = evalItem.status === 'no_data';

                                    let badgeClass = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
                                    if (isWon) badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300';
                                    if (isUpcoming) badgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
                                    if (isNoData) badgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';

                                    return `
                                        <div class="p-4 hover:bg-gray-50/80 dark:hover:bg-gray-750 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div class="flex items-center gap-3">
                                                <div class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${isWon ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}">
                                                    ${isWon ? '🎉' : (isUpcoming ? '⏳' : (isNoData ? '⚠️' : '❌'))}
                                                </div>
                                                <div>
                                                    <div class="flex items-center gap-2">
                                                        <span class="font-lotto text-xl font-bold tracking-wider text-gray-900 dark:text-white">
                                                            ${evalItem.ticketNumber}
                                                        </span>
                                                        <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${badgeClass}">
                                                            ${evalItem.statusBadge}
                                                        </span>
                                                    </div>
                                                    <div class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                        <span>${evalItem.count} ใบ (ต้นทุน ฿${evalItem.totalCost.toLocaleString()})</span>
                                                        <span>•</span>
                                                        <span class="${isWon ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}">
                                                            ${evalItem.statusText}
                                                        </span>
                                                    </div>
                                                    ${evalItem.matchesFirstPrizeTail ? `
                                                        <div class="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5 font-medium">
                                                            💡 2 ตัวท้ายตรงกับ 2 ตัวท้ายรางวัลที่ 1 (${evalItem.firstPrizeTail})
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            </div>

                                            <div class="text-right self-end sm:self-center">
                                                ${isWon ? `
                                                    <div class="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                                        +฿${evalItem.totalPrize.toLocaleString()}
                                                    </div>
                                                    <div class="text-[11px] text-gray-500">
                                                        กำไรสุทธิ ฿${evalItem.netGainLoss.toLocaleString()}
                                                    </div>
                                                ` : (isLost ? `
                                                    <div class="text-sm font-semibold text-gray-400">
                                                        -฿${evalItem.totalCost.toLocaleString()}
                                                    </div>
                                                    <div class="text-[10px] text-gray-400">
                                                        ไม่ถูกรางวัล
                                                    </div>
                                                ` : `
                                                    <div class="text-xs text-gray-400">
                                                        รอการตรวจ
                                                    </div>
                                                `)}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                </div>
            `;

            this.bindEvents(container);
        },

        bindEvents(container) {
            // Check draw select change
            const drawSelect = container.querySelector('#checkDrawSelect');
            if (drawSelect) {
                drawSelect.addEventListener('change', (e) => {
                    this.selectedDrawDate = e.target.value;
                    this.manualCheckResult = null;
                    this.render(container);
                });
            }

            // Toggle minor prizes
            const btnToggleMinor = container.querySelector('#btnToggleMinorPrizes');
            if (btnToggleMinor) {
                btnToggleMinor.addEventListener('click', () => {
                    this.isMinorPrizesExpanded = !this.isMinorPrizesExpanded;
                    this.render(container);
                });
            }

            // Manual check submit
            const manualBtn = container.querySelector('#btnManualCheck');
            const manualInput = container.querySelector('#manualCheckInput');
            if (manualBtn && manualInput) {
                const doManualCheck = () => {
                    const num = manualInput.value.trim();
                    if (!num) {
                        root.LottoApp.showToast('กรุณาระบุเลขที่ต้องการตรวจ', 'error');
                        return;
                    }
                    this.manualCheckNumber = num;
                    const resultsMap = root.LottoApp.resultsMap || {};
                    const currentResult = resultsMap[this.selectedDrawDate];
                    
                    this.manualCheckResult = root.LottoChecker.checkTicket({
                        number: num,
                        count: 1,
                        costPerUnit: 80,
                        totalCost: 80,
                        drawDate: this.selectedDrawDate
                    }, currentResult);

                    this.render(container);
                };

                manualBtn.addEventListener('click', doManualCheck);
                manualInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') doManualCheck();
                });
            }
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CheckResultsView;
    } else {
        root.LottoCheckResultsView = CheckResultsView;
    }
})(typeof window !== 'undefined' ? window : global);
