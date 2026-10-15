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
            const selectableDates = Array.from(new Set([
                ...resultsList.slice(0, 48).map(r => r.drawDate),
                ...userTickets.map(t => t.drawDate), this.selectedDrawDate
            ].filter(Boolean))).sort((a, b) => b.localeCompare(a));

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
                    <div class="bg-surface  p-4 sm:p-5 rounded-lg border border-line   space-y-4">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-line ">
                            <div>
                                <h2 class="text-base font-bold text-ink  flex items-center gap-2">
                                    <span>⌕</span> เลือกงวดเพื่อตรวจผลรางวัล
                                </h2>
                                <p class="text-base text-muted  mt-0.5">
                                    ตรวจสลากที่บันทึกไว้ในงวดนี้อัตโนมัติ หรือพิมพ์เลขตรวจทันที
                                </p>
                            </div>

                            <!-- Draw Date Picker Dropdown -->
                            <div class="flex items-center gap-2 w-full sm:w-auto">
                                <button type="button" id="btnSyncResults" class="px-3 py-2 bg-action rounded-lg font-semibold whitespace-nowrap">↻ อัปเดตผล GLO</button>
                                <a href="https://www.glo.or.th/mission/reward-payment/check-reward" target="_blank" rel="noopener noreferrer" class="text-accent underline whitespace-nowrap">ตรวจที่ GLO ↗</a>
                                <select aria-label="งวดที่ต้องการตรวจผล" id="checkDrawSelect" class="bg-surface  border border-line  rounded-lg px-3 py-2 text-base text-ink  font-medium focus:ring-2 focus:ring-accent focus:outline-none w-full sm:w-auto">
                                    ${selectableDates.map(d => `
                                        <option value="${d}" ${d === this.selectedDrawDate ? 'selected' : ''}>
                                            งวด ${formatThaiDate(d)}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>

                        <!-- Manual Quick Number Checker -->
                        <div class="bg-surface  p-3.5 rounded-lg border border-line ">
                            <label for="manualCheckInput" class="block text-base font-semibold text-ink mb-1.5">
                                ↳ พิมพ์เลขตรวจทันทีในงวดนี้ (6 หลัก, 3 ตัว, หรือ 2 ตัว):
                            </label>
                            <div class="flex gap-2">
                                <input type="text" id="manualCheckInput" value="${this.manualCheckNumber || ''}" placeholder="ระบุเลขสลาก เช่น 757563 หรือ 32" maxlength="6"
                                    class="flex-1 font-lotto text-base font-bold text-center bg-surface  border border-line  rounded-lg px-3 py-2 text-ink  focus:ring-2 focus:ring-accent focus:outline-none">
                                <button type="button" id="btnManualCheck" class="px-5 py-2 bg-action hover:bg-action-hover text-white rounded-lg text-base font-semibold transition">
                                    ตรวจเลข
                                </button>
                            </div>

                            <!-- Manual Check Result Badge -->
                            ${this.manualCheckResult ? `
                                <div class="mt-3 p-3 rounded-lg border ${this.manualCheckResult.status === 'won' ? 'bg-success-soft  border-line ' : (this.manualCheckResult.status === 'lost' ? 'bg-raised  border-line ' : 'bg-warning-soft  border-line ')}">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <span class="font-lotto font-bold text-base text-ink ">${this.manualCheckResult.ticketNumber}</span>
                                            <span class="text-base font-bold ${this.manualCheckResult.status === 'won' ? 'text-success ' : 'text-muted '}">
                                                ${this.manualCheckResult.statusBadge}
                                            </span>
                                        </div>
                                        ${this.manualCheckResult.totalPrize > 0 ? `
                                            <span class="text-base font-bold text-success ">
                                                +฿${this.manualCheckResult.totalPrize.toLocaleString()}
                                            </span>
                                        ` : ''}
                                    </div>
                                    <div class="text-base text-muted  mt-1">
                                        ${this.manualCheckResult.statusText}
                                    </div>
                                    ${this.manualCheckResult.matchesFirstPrizeTail ? `
                                        <div class="text-base text-accent  mt-1 font-medium">
                                            i หมายเหตุ: เลข 2 ตัวท้ายตรงกับ 2 ตัวท้ายของรางวัลที่ 1 (${this.manualCheckResult.firstPrizeTail}) แต่ในสลากกินแบ่งรัฐบาล รางวัลเลขท้าย 2 ตัวเป็นรางวัลเฉพาะที่แยกต่างหาก
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Official Winning Numbers Board for Selected Draw -->
                    ${currentDrawResult ? `
                        <div class="bg-surface    p-5 rounded-lg border border-line   space-y-4">
                            <div class="flex justify-between items-center">
                                <div>
                                    <span class="text-base font-bold  text-accent">ผลการออกรางวัลอย่างเป็นทางการ</span>
                                    <h3 class="text-base font-bold text-ink ">
                                        งวดประจำวันที่ ${currentDrawResult.dateFormatted || formatThaiDate(currentDrawResult.drawDate)}
                                    </h3>
                                </div>
                                <span class="text-base bg-success-soft  text-success  px-2.5 py-1 rounded-full font-semibold">
                                    ✓ ${currentDrawResult.source === 'GLO' ? 'อัปเดตจาก GLO' : 'ข้อมูลในเครื่อง'}
                                </span>
                            </div>

                            <!-- Primary Prizes Grid -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <!-- First Prize -->
                                <div class="color-panel tone-purple bg-surface p-3.5 rounded-lg border border-line sm:col-span-2 flex flex-col justify-between">
                                    <div class="flex justify-between items-center text-base text-muted  mb-1">
                                        <span class="font-bold text-accent">★ รางวัลที่ 1</span>
                                        <span>รางวัลละ 6,000,000 บาท</span>
                                    </div>
                                    <div class="text-center py-2">
                                        <span class="font-lotto text-3xl font-extrabold tracking-widest text-accent">
                                            ${currentDrawResult.prizes.first || '------'}
                                        </span>
                                    </div>
                                    <div class="text-base text-center text-muted">
                                        ข้างเคียง: ${(currentDrawResult.prizes.nearFirst || []).join(', ') || '-'}
                                    </div>
                                </div>

                                <!-- Back 2 Digits Prize (Highlighted) -->
                                <div class="color-panel tone-yellow bg-surface p-3.5 rounded-lg border border-line flex flex-col justify-between">
                                    <div class="flex justify-between items-center text-base text-muted  mb-1">
                                        <span class="font-bold text-warning ">◎ เลขท้าย 2 ตัว</span>
                                        <span>2,000 บ.</span>
                                    </div>
                                    <div class="text-center py-2">
                                        <span class="font-lotto text-3xl font-extrabold tracking-widest text-warning ">
                                            ${currentDrawResult.prizes.back2 || '--'}
                                        </span>
                                    </div>
                                    <div class="text-base text-center text-muted ">
                                        *รางวัลเฉพาะ (ไม่ใช่ 2 ตัวท้าย รว.1)
                                    </div>
                                </div>

                                <!-- Front 3 & Back 3 Digits -->
                                <div class="color-panel tone-blue bg-surface p-3.5 rounded-lg border border-line flex flex-col justify-between">
                                    <div class="text-base text-muted  mb-1 flex justify-between">
                                        <span class="font-bold text-accent ">เลขหน้า 3 ตัว (4,000 บ.)</span>
                                    </div>
                                    <div class="flex justify-around items-center py-0.5">
                                        ${(currentDrawResult.prizes.front3 || []).map(f => `
                                            <span class="font-lotto text-lg font-bold text-accent ">${f}</span>
                                        `).join('')}
                                    </div>
                                    <div class="text-base text-muted  mt-2 mb-1 border-t border-line  pt-1">
                                        <span class="font-bold text-accent ">เลขท้าย 3 ตัว (4,000 บ.)</span>
                                    </div>
                                    <div class="flex justify-around items-center py-0.5">
                                        ${(currentDrawResult.prizes.back3 || []).map(b => `
                                            <span class="font-lotto text-lg font-bold text-accent ">${b}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>

                            <!-- Expand Minor Prizes (2nd - 5th) -->
                            <div class="pt-1">
                                <button type="button" id="btnToggleMinorPrizes" class="text-base font-semibold text-muted  hover:text-accent flex items-center gap-1">
                                    <span>${this.isMinorPrizesExpanded ? '▼ ซ่อนรางวัลที่ 2 - 5' : '▶ ดูรางวัลที่ 2, 3, 4, 5'}</span>
                                </button>

                                ${this.isMinorPrizesExpanded ? `
                                    <div class="mt-3 space-y-3 bg-surface  p-4 rounded-lg border border-line  text-base">
                                        <div>
                                            <div class="font-bold text-ink  mb-1">รางวัลที่ 2 (5 รางวัล ละ 200,000 บาท):</div>
                                            <div class="flex flex-wrap gap-2 font-lotto font-semibold text-ink ">
                                                ${(currentDrawResult.prizes.second || []).join('   ') || 'ไม่มีข้อมูล'}
                                            </div>
                                        </div>
                                        <div>
                                            <div class="font-bold text-ink  mb-1">รางวัลที่ 3 (10 รางวัล ละ 80,000 บาท):</div>
                                            <div class="flex flex-wrap gap-2 font-lotto text-ink ">
                                                ${(currentDrawResult.prizes.third || []).join('   ') || 'ไม่มีข้อมูล'}
                                            </div>
                                        </div>
                                        <div>
                                            <div class="font-bold text-ink  mb-1">รางวัลที่ 4 (50 รางวัล ละ 40,000 บาท):</div>
                                            <div class="flex flex-wrap gap-2 font-lotto text-base text-muted ">
                                                ${(currentDrawResult.prizes.fourth || []).join(' ') || 'ไม่มีข้อมูล'}
                                            </div>
                                        </div>
                                        <div>
                                            <div class="font-bold text-ink  mb-1">รางวัลที่ 5 (100 รางวัล ละ 20,000 บาท):</div>
                                            <div class="flex flex-wrap gap-2 font-lotto text-base text-muted ">
                                                ${(currentDrawResult.prizes.fifth || []).join(' ') || 'ไม่มีข้อมูล'}
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : `
                        <div class="p-6 rounded-lg bg-warning-soft  border border-line  text-center">
                            <div class="text-3xl mb-1">⚠️</div>
                            <h3 class="text-base font-bold text-warning ">ยังไม่มีข้อมูลผลรางวัลในระบบสำหรับงวดนี้</h3>
                            <p class="text-base text-warning  mt-1 max-w-md mx-auto">
                                งวดนี้อาจยังไม่ถึงกำหนดออกรางวัล หรือยังไม่มีการนำเข้าผลรางวัลในฐานข้อมูล ระบบจะไม่ตัดสินว่าสลากของคุณไม่ถูกรางวัลจนกว่าจะมีข้อมูลผลที่ถูกต้อง
                            </p>
                        </div>
                    `}

                    <!-- Auto-Checked Saved Tickets Section -->
                    <div class="bg-surface  rounded-lg border border-line   overflow-hidden">
                        <div class="p-4 border-b border-line  flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <h2 class="text-base font-bold text-ink  flex items-center gap-2">
                                    <span>◎</span> สลากของคุณในงวดนี้ (${drawTickets.length} ใบ)
                                </h2>
                                <p class="text-base text-muted  mt-0.5">
                                    ผลการตรวจตามฐานข้อมูลผลรางวัล
                                </p>
                            </div>

                            <!-- Net Financial Gain/Loss Badge -->
                            <div class="flex items-center gap-3">
                                <div class="text-right">
                                    <div class="text-base text-muted ">
                                        ลงทุน ฿${summary.totalSpent.toLocaleString()} | ได้รางวัล ฿${summary.totalPrizeWon.toLocaleString()}
                                    </div>
                                    <div class="text-base font-bold ${summary.netProfitLoss > 0 ? 'text-success ' : (summary.netProfitLoss < 0 ? 'text-accent' : 'text-ink ')}">
                                        ${summary.netProfitLoss > 0 ? `+฿${summary.netProfitLoss.toLocaleString()} (กำไร)` : (summary.netProfitLoss < 0 ? `-฿${Math.abs(summary.netProfitLoss).toLocaleString()} (ขาดทุน)` : '฿0')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tickets List -->
                        ${drawTickets.length === 0 ? `
                            <div class="p-10 text-center text-muted ">
                                <div class="text-3xl mb-2">▤</div>
                                <div class="text-base font-medium">คุณยังไม่ได้บันทึกสลากในงวดนี้</div>
                                <div class="text-base mt-1">
                                    ไปที่แท็บ <a href="#tickets" class="text-accent underline font-semibold">"สลากของฉัน"</a> เพื่อเพิ่มสลาก
                                </div>
                            </div>
                        ` : `
                            <div class="divide-y divide-line ">
                                ${evaluatedTickets.map(evalItem => {
                                    const isWon = evalItem.status === 'won';
                                    const isLost = evalItem.status === 'lost';
                                    const isUpcoming = evalItem.status === 'upcoming';
                                    const isNoData = evalItem.status === 'no_data';

                                    let badgeClass = 'bg-raised text-muted  ';
                                    if (isWon) badgeClass = 'bg-success-soft text-success   border border-line';
                                    if (isUpcoming) badgeClass = 'bg-accent-soft text-accent  ';
                                    if (isNoData) badgeClass = 'bg-warning-soft text-warning  ';

                                    return `
                                        <div class="p-4 hover:bg-surface  transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div class="flex items-center gap-3">
                                                <div class="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${isWon ? 'bg-success-soft text-success ' : 'bg-raised text-muted '}">
                                                    ${isWon ? '🎉' : (isUpcoming ? '⏳' : (isNoData ? '⚠️' : '❌'))}
                                                </div>
                                                <div>
                                                    <div class="flex items-center gap-2">
                                                        <span class="font-lotto text-xl font-bold tracking-wider text-ink ">
                                                            ${evalItem.ticketNumber}
                                                        </span>
                                                        <span class="text-base px-2.5 py-0.5 rounded-full font-bold ${badgeClass}">
                                                            ${evalItem.statusBadge}
                                                        </span>
                                                    </div>
                                                    <div class="text-base text-muted  mt-0.5">
                                                        <span>${evalItem.count} ใบ (ต้นทุน ฿${evalItem.totalCost.toLocaleString()})</span>
                                                        <span>•</span>
                                                        <span class="${isWon ? 'text-success  font-semibold' : ''}">
                                                            ${evalItem.statusText}
                                                        </span>
                                                    </div>
                                                    ${evalItem.matchesFirstPrizeTail ? `
                                                        <div class="text-base text-accent  mt-0.5 font-medium">
                                                            i 2 ตัวท้ายตรงกับ 2 ตัวท้ายรางวัลที่ 1 (${evalItem.firstPrizeTail})
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            </div>

                                            <div class="text-right self-end sm:self-center">
                                                ${isWon ? `
                                                    <div class="text-base font-bold text-success ">
                                                        +฿${evalItem.totalPrize.toLocaleString()}
                                                    </div>
                                                    <div class="text-base text-muted">
                                                        กำไรสุทธิ ฿${evalItem.netGainLoss.toLocaleString()}
                                                    </div>
                                                ` : (isLost ? `
                                                    <div class="text-base font-semibold text-muted">
                                                        -฿${evalItem.totalCost.toLocaleString()}
                                                    </div>
                                                    <div class="text-base text-muted">
                                                        ไม่ถูกรางวัล
                                                    </div>
                                                ` : `
                                                    <div class="text-base text-muted">
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
            container.querySelector('#btnSyncResults')?.addEventListener('click', () => root.LottoApp.syncLatestResult(true));
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
