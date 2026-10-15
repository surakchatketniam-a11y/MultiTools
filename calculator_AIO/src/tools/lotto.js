// ==============================================================
// Multitools Calculator - Thai Lottery & GLO UI Renderer
// ==============================================================

(function(root) {
    function renderLottoTool(container) {
        if (!container) return;
        const state = appState.lotto_calc = appState.lotto_calc || {
            activeTab: 'bet',
            betNumberInput: '579',
            numbersList: ['579', '597', '759', '795', '957', '975'],
            pricePerNumber: '20',
            payoutRate: '900',
            claimPrize: 'back2',
            claimTicketCount: '1',
            claimChannel: 'bank',
            claimCustomRate: '2.0',
            lottoSpendPerDraw: '500',
            savingsYears: '10',
            savingsRate: '7',
            luckyType: '3digit',
            luckyResult: '579'
        };

        const activeTab = state.activeTab || 'bet';

        let contentHTML = `
            <div class="space-y-4">
                <!-- Navigation Tabs -->
                <div class="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar gap-1 text-sm font-medium">
                    <button type="button" data-lotto-tab="bet" class="px-3 py-2.5 whitespace-nowrap rounded-t-lg border-b-2 transition-colors ${activeTab === 'bet' ? 'border-[#FF385C] text-[#FF385C] font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}">
                        🎯 ต้นทุน & กลับเลข
                    </button>
                    <button type="button" data-lotto-tab="claim" class="px-3 py-2.5 whitespace-nowrap rounded-t-lg border-b-2 transition-colors ${activeTab === 'claim' ? 'border-[#FF385C] text-[#FF385C] font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}">
                        🏆 ขึ้นเงินรางวัล & ภาษี
                    </button>
                    <button type="button" data-lotto-tab="reality" class="px-3 py-2.5 whitespace-nowrap rounded-t-lg border-b-2 transition-colors ${activeTab === 'reality' ? 'border-[#FF385C] text-[#FF385C] font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}">
                        💡 สถิติ & ออมเงินล้าน
                    </button>
                    <button type="button" data-lotto-tab="lucky" class="px-3 py-2.5 whitespace-nowrap rounded-t-lg border-b-2 transition-colors ${activeTab === 'lucky' ? 'border-[#FF385C] text-[#FF385C] font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}">
                        🔮 สุ่มเลขเด็ด
                    </button>
                </div>
        `;

        // ==========================================
        // TAB 1: ต้นทุน & ตัวช่วยกลับเลข
        // ==========================================
        if (activeTab === 'bet') {
            const numbers = Array.isArray(state.numbersList) ? state.numbersList : [];
            const betCalc = calculateLottoBet(numbers, state.pricePerNumber, state.payoutRate);

            contentHTML += `
                <div class="space-y-4">
                    <!-- Helper Actions & Input Box -->
                    <div class="bg-gray-50 dark:bg-gray-800/70 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-3">
                        <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            ป้อนเลขที่ต้องการคำนวณหรือกดตัวช่วยขยายเลข:
                        </label>
                        <div class="flex gap-2">
                            <input type="text" id="betNumberInput" value="${state.betNumberInput || ''}" placeholder="ใส่เลข 1, 2 หรือ 3 หลัก" maxlength="6"
                                class="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base font-mono font-semibold tracking-wider text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]">
                            <button type="button" id="btnAddManualNumber" class="px-3.5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg text-sm font-medium transition-colors">
                                + เพิ่มเลข
                            </button>
                        </div>

                        <!-- Permutation Quick Action Pills -->
                        <div class="pt-1">
                            <div class="text-[11px] text-gray-500 dark:text-gray-400 mb-1.5 font-medium">⚡ ตัวช่วยขยายเลขยอดฮิต (กดแล้วแตกเลขทันที):</div>
                            <div class="flex flex-wrap gap-1.5 text-xs">
                                <button type="button" data-lotto-expand="6doors" class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-300 rounded-md font-medium border border-rose-200 dark:border-rose-800 transition">
                                    🔀 6 ประตู (3 ตัวกลับ)
                                </button>
                                <button type="button" data-lotto-expand="2doors" class="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 rounded-md font-medium border border-blue-200 dark:border-blue-800 transition">
                                    🔁 2 ตัวกลับ
                                </button>
                                <button type="button" data-lotto-expand="19doors" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-300 rounded-md font-medium border border-amber-200 dark:border-amber-800 transition">
                                    🚪 19 ประตู (รูด 1 ตัว)
                                </button>
                                <button type="button" data-lotto-expand="frontRun" class="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 rounded-md font-medium border border-emerald-200 dark:border-emerald-800 transition">
                                    ⏩ รูดหน้า (10 หาง)
                                </button>
                                <button type="button" data-lotto-expand="backRun" class="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 rounded-md font-medium border border-indigo-200 dark:border-indigo-800 transition">
                                    ⏪ รูดหลัง (10 หาง)
                                </button>
                                <button type="button" data-lotto-expand="doubles" class="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 rounded-md font-medium border border-purple-200 dark:border-purple-800 transition">
                                    👥 เลขเบิ้ล (00-99)
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Number Tags List -->
                    <div class="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                        <div class="flex justify-between items-center text-xs">
                            <span class="font-semibold text-gray-700 dark:text-gray-300">
                                รายการตัวเลขในชุด (${numbers.length} หาง):
                            </span>
                            ${numbers.length > 0 ? `
                                <button type="button" id="btnClearLottoNumbers" class="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 font-medium transition">
                                    ล้างทั้งหมด
                                </button>
                            ` : ''}
                        </div>
                        <div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700/80">
                            ${numbers.length > 0 ? numbers.map((num, idx) => `
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-xs font-mono font-bold text-gray-800 dark:text-gray-100 shadow-sm">
                                    ${num}
                                    <button type="button" data-remove-lotto-idx="${idx}" class="text-gray-400 hover:text-rose-500 transition-colors ml-0.5">✕</button>
                                </span>
                            `).join('') : `
                                <div class="w-full text-center py-4 text-xs text-gray-400 dark:text-gray-500">
                                    ยังไม่มีตัวเลขในชุด (ป้อนตัวเลขหรือกดปุ่มตัวช่วยด้านบน)
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Cost & Rate Inputs -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="bg-gray-50 dark:bg-gray-800/70 p-3 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-2">
                            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                ราคาซื้อต่อหาง (บาท):
                            </label>
                            <input type="text" id="lottoPricePerNumber" value="${state.pricePerNumber || '20'}"
                                class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]">
                            <div class="flex gap-1 text-[11px]">
                                ${['10', '20', '50', '100'].map(p => `
                                    <button type="button" data-preset-price="${p}" class="flex-1 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-[#FF385C] text-gray-700 dark:text-gray-300 transition">
                                        ${p}฿
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="bg-gray-50 dark:bg-gray-800/70 p-3 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-2">
                            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                อัตราจ่ายเงินรางวัล (บาทละ):
                            </label>
                            <input type="text" id="lottoPayoutRate" value="${state.payoutRate || '900'}"
                                class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]">
                            <div class="flex gap-1 text-[11px]">
                                <button type="button" data-preset-rate="900" class="flex-1 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-[#FF385C] text-gray-700 dark:text-gray-300 transition">3 ตัว 900</button>
                                <button type="button" data-preset-rate="150" class="flex-1 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-[#FF385C] text-gray-700 dark:text-gray-300 transition">โต๊ด 150</button>
                                <button type="button" data-preset-rate="90" class="flex-1 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-[#FF385C] text-gray-700 dark:text-gray-300 transition">2 ตัว 90</button>
                            </div>
                        </div>
                    </div>

                    <!-- Calculation Results Summary Card -->
                    <div class="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 rounded-xl shadow-md space-y-3">
                        <div class="text-xs uppercase font-semibold tracking-wider text-rose-300">
                            💰 สรุปต้นทุนและผลตอบแทนเมื่อถูกรางวัล (1 หาง)
                        </div>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div class="bg-white/10 p-2.5 rounded-lg">
                                <div class="text-xs text-gray-300">ต้นทุนลงทุนรวม:</div>
                                <div class="text-lg font-bold text-amber-300">${formatMoney(betCalc.totalCost)} บาท</div>
                                <div class="text-[11px] text-gray-400">(${betCalc.count} หาง × ${formatMoney(betCalc.pricePerNumber)} บ.)</div>
                            </div>
                            <div class="bg-white/10 p-2.5 rounded-lg">
                                <div class="text-xs text-gray-300">เงินรางวัลที่ได้รับ:</div>
                                <div class="text-lg font-bold text-emerald-300">${formatMoney(betCalc.winningPayout)} บาท</div>
                                <div class="text-[11px] text-gray-400">(บาทละ ${formatMoney(betCalc.payoutRate)})</div>
                            </div>
                        </div>

                        <div class="pt-2 border-t border-white/10 flex justify-between items-baseline">
                            <div>
                                <span class="text-xs text-gray-300">กำไรสุทธิ (ถ้าถูก):</span>
                                <span class="text-xl font-black ${betCalc.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} ml-2">
                                    ${betCalc.netProfit >= 0 ? '+' : ''}${formatMoney(betCalc.netProfit)} บาท
                                </span>
                            </div>
                            <div class="text-xs ${betCalc.roiPercent >= 0 ? 'text-emerald-300' : 'text-rose-300'} font-semibold">
                                ROI: ${betCalc.roiPercent >= 0 ? '+' : ''}${betCalc.roiPercent.toLocaleString('th-TH', { maximumFractionDigits: 1 })}%
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // ==========================================
        // TAB 2: ขึ้นเงินรางวัล & หักภาษีสลากรัฐบาล
        // ==========================================
        else if (activeTab === 'claim') {
            const claim = calculatePrizeClaim(state.claimPrize, state.claimTicketCount, state.claimChannel, state.claimCustomRate);

            contentHTML += `
                <div class="space-y-4">
                    <!-- Prize Selection -->
                    <div class="bg-gray-50 dark:bg-gray-800/70 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-3">
                        <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            เลือกลำดับรางวัลที่ถูกสลากกินแบ่ง:
                        </label>
                        <select id="claimPrizeSelect" class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]">
                            ${Object.values(GLO_PRIZES).map(p => `
                                <option value="${p.key}" ${state.claimPrize === p.key ? 'selected' : ''}>
                                    ${p.label} — ${formatMoney(p.amount)} บาท / ใบ
                                </option>
                            `).join('')}
                        </select>

                        <!-- Quick prize buttons -->
                        <div class="flex flex-wrap gap-1.5 text-xs pt-1">
                            <button type="button" data-quick-prize="first" class="px-2.5 py-1.5 rounded-md border ${state.claimPrize === 'first' ? 'bg-[#FF385C] text-white border-[#FF385C]' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'}">
                                รางวัลที่ 1 (6 ล้าน)
                            </button>
                            <button type="button" data-quick-prize="back2" class="px-2.5 py-1.5 rounded-md border ${state.claimPrize === 'back2' ? 'bg-[#FF385C] text-white border-[#FF385C]' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'}">
                                เลขท้าย 2 ตัว (2,000)
                            </button>
                            <button type="button" data-quick-prize="back3" class="px-2.5 py-1.5 rounded-md border ${state.claimPrize === 'back3' ? 'bg-[#FF385C] text-white border-[#FF385C]' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'}">
                                ท้าย 3 ตัว (4,000)
                            </button>
                            <button type="button" data-quick-prize="front3" class="px-2.5 py-1.5 rounded-md border ${state.claimPrize === 'front3' ? 'bg-[#FF385C] text-white border-[#FF385C]' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'}">
                                หน้า 3 ตัว (4,000)
                            </button>
                        </div>
                    </div>

                    <!-- Ticket Count & Channel -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="bg-gray-50 dark:bg-gray-800/70 p-3 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-2">
                            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                จำนวนสลากที่ถูกรางวัล (ใบ):
                            </label>
                            <input type="number" id="claimTicketCount" min="1" max="1000" value="${state.claimTicketCount || '1'}"
                                class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]">
                            <div class="flex gap-1 text-[11px]">
                                ${['1', '2', '5', '10'].map(c => `
                                    <button type="button" data-preset-count="${c}" class="flex-1 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-[#FF385C] text-gray-700 dark:text-gray-300 transition">
                                        ${c} ใบ
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="bg-gray-50 dark:bg-gray-800/70 p-3 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-2">
                            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                ช่องทางขึ้นเงินรางวัล:
                            </label>
                            <select id="claimChannelSelect" class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]">
                                ${Object.values(CLAIM_CHANNELS).map(ch => `
                                    <option value="${ch.key}" ${state.claimChannel === ch.key ? 'selected' : ''}>
                                        ${ch.label} (หัก ${ch.rate}%)
                                    </option>
                                `).join('')}
                            </select>
                            ${state.claimChannel === 'shop' ? `
                                <div class="flex items-center gap-2 pt-1">
                                    <span class="text-xs text-gray-500">อัตราหักร้าน:</span>
                                    <input type="text" id="claimCustomRate" value="${state.claimCustomRate || '2.0'}" class="w-16 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 text-xs font-bold text-center">
                                    <span class="text-xs text-gray-500">%</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Prize Breakdown Card -->
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-md space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">💵 สรุปเงินรางวัลสุทธิหลังหักภาษี</span>
                            <span class="text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                                หัก ${claim.deductionRate}%
                            </span>
                        </div>

                        <div class="space-y-1.5 text-sm">
                            <div class="flex justify-between text-gray-600 dark:text-gray-400 text-xs">
                                <span>ยอดเงินรางวัลรวม (${claim.ticketCount} ใบ):</span>
                                <span class="font-semibold text-gray-900 dark:text-white">${formatMoney(claim.totalGrossPrize)} บาท</span>
                            </div>
                            <div class="flex justify-between text-rose-600 dark:text-rose-400 text-xs">
                                <span>ค่าธรรมเนียม / อากร / ภาษี (${claim.deductionRate}%):</span>
                                <span class="font-semibold">-${formatMoney(claim.deductionAmount)} บาท</span>
                            </div>
                            <div class="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-baseline">
                                <span class="font-bold text-gray-800 dark:text-gray-100">เงินสดสุทธิที่ได้รับจริง:</span>
                                <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                    ${formatMoney(claim.netPrize)} บาท
                                </span>
                            </div>
                        </div>

                        <div class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 p-2.5 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
                            ℹ️ <strong>ข้อกฎหมาย & ข้อควรรู้:</strong> ${claim.feeNote}
                        </div>
                    </div>
                </div>
            `;
        }

        // ==========================================
        // TAB 3: สถิติ & สัจธรรม เปลี่ยนค่าหวยเป็นเงินล้าน
        // ==========================================
        else if (activeTab === 'reality') {
            const stats = calculateLottoStats(80);
            const sim = calculateLottoSavingsSimulation(state.lottoSpendPerDraw, state.savingsYears, state.savingsRate);

            contentHTML += `
                <div class="space-y-4">
                    <!-- Savings Simulator Card -->
                    <div class="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white p-4 rounded-xl shadow-lg space-y-4">
                        <div class="flex items-center gap-2">
                            <span class="text-xl">💰</span>
                            <div>
                                <h3 class="font-bold text-sm text-yellow-300">โปรแกรมจำลอง: "เปลี่ยนค่าหวยเป็นเงินล้าน"</h3>
                                <p class="text-[11px] text-gray-300">ถ้าเปลี่ยนเงินซื้อหวยต่องวด มาลงทุน DCA แบบมีวินัย จะได้เงินเก็บเท่าไหร่?</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                            <div class="bg-white/10 p-2 rounded-lg">
                                <label class="text-gray-300 block mb-1">ซื้อหวยงวดละ (บ.):</label>
                                <input type="number" id="lottoSpendPerDraw" value="${state.lottoSpendPerDraw || '500'}"
                                    class="w-full bg-white/20 border border-white/30 rounded px-2 py-1 text-sm font-bold text-white focus:outline-none">
                            </div>
                            <div class="bg-white/10 p-2 rounded-lg">
                                <label class="text-gray-300 block mb-1">ระยะเวลาออม (ปี):</label>
                                <select id="savingsYearsSelect" class="w-full bg-white/20 border border-white/30 rounded px-2 py-1 text-xs font-semibold text-white focus:outline-none">
                                    <option value="5" ${state.savingsYears === '5' ? 'selected' : ''}>5 ปี</option>
                                    <option value="10" ${state.savingsYears === '10' ? 'selected' : ''}>10 ปี</option>
                                    <option value="20" ${state.savingsYears === '20' ? 'selected' : ''}>20 ปี</option>
                                    <option value="30" ${state.savingsYears === '30' ? 'selected' : ''}>30 ปี</option>
                                </select>
                            </div>
                            <div class="bg-white/10 p-2 rounded-lg">
                                <label class="text-gray-300 block mb-1">ผลตอบแทนเฉลี่ย (%/ปี):</label>
                                <select id="savingsRateSelect" class="w-full bg-white/20 border border-white/30 rounded px-2 py-1 text-xs font-semibold text-white focus:outline-none">
                                    <option value="2" ${state.savingsRate === '2' ? 'selected' : ''}>2% (ฝากประจำ/ตราสารหนี้)</option>
                                    <option value="5" ${state.savingsRate === '5' ? 'selected' : ''}>5% (กองทุนรวมผสม)</option>
                                    <option value="7" ${state.savingsRate === '7' ? 'selected' : ''}>7% (ดัชนีหุ้นไทย/โลก)</option>
                                    <option value="10" ${state.savingsRate === '10' ? 'selected' : ''}>10% (หุ้นเติบโต/S&P500)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Results -->
                        <div class="bg-white/10 p-3 rounded-lg border border-white/10 space-y-2">
                            <div class="flex justify-between text-xs text-gray-200">
                                <span>เงินต้นค่าหวยที่สะสม (${sim.years} ปี = ${sim.totalMonths} เดือน):</span>
                                <span class="font-semibold text-amber-200">${formatMoney(sim.totalPrincipal)} บาท</span>
                            </div>
                            <div class="flex justify-between text-xs text-emerald-300">
                                <span>กำไรดอกเบี้ยทบต้นที่งอกเงย:</span>
                                <span class="font-bold">+${formatMoney(sim.totalInterest)} บาท</span>
                            </div>
                            <div class="pt-2 border-t border-white/20 flex justify-between items-baseline">
                                <span class="font-bold text-sm text-yellow-300">ยอดเงินเก็บรวมทั้งหมด:</span>
                                <span class="text-2xl font-black text-yellow-400">
                                    ${formatMoney(sim.futureValue)} บาท
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Reality Check Statistics Card -->
                    <div class="bg-gray-50 dark:bg-gray-800/70 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-3">
                        <div class="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            📊 สถิติ & สัจธรรมความจริงสลากกินแบ่งรัฐบาล (1 ชุด = 1,000,000 ใบ)
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            <div class="bg-white dark:bg-gray-700/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                                <div class="text-[11px] text-gray-500 dark:text-gray-400">โอกาสถูกรางวัลใดๆ</div>
                                <div class="text-base font-bold text-emerald-600 dark:text-emerald-400">1.42%</div>
                                <div class="text-[10px] text-gray-400">14,168 ใบในล้าน</div>
                            </div>
                            <div class="bg-white dark:bg-gray-700/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                                <div class="text-[11px] text-gray-500 dark:text-gray-400">โอกาสไม่ถูกรางวัล (กินเรียบ)</div>
                                <div class="text-base font-bold text-rose-500 dark:text-rose-400">98.58%</div>
                                <div class="text-[10px] text-gray-400">985,832 ใบในล้าน</div>
                            </div>
                            <div class="col-span-2 sm:col-span-1 bg-white dark:bg-gray-700/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                                <div class="text-[11px] text-gray-500 dark:text-gray-400">มูลค่าคาดหวัง (EV)</div>
                                <div class="text-base font-bold text-indigo-600 dark:text-indigo-400">48 บาท/ใบ</div>
                                <div class="text-[10px] text-rose-500">ซื้อ 80 บ. ขาดทุน -40%</div>
                            </div>
                        </div>

                        <div class="text-[11px] text-gray-500 dark:text-gray-400 space-y-1 pt-1">
                            <div>• <strong>รางวัลที่ 1:</strong> โอกาส 1 ใน 1,000,000 (0.0001%) เปรียบเสมือนการถูกฟ้าผ่ากลางแจ้ง</div>
                            <div>• <strong>เลขท้าย 2 ตัว:</strong> โอกาส 1 ใน 100 (1%) คือรางวัลที่คนถูกบ่อยที่สุด</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // ==========================================
        // TAB 4: สุ่มเลขเด็ดมงคล
        // ==========================================
        else if (activeTab === 'lucky') {
            const luckyRes = state.luckyResult || '579';

            contentHTML += `
                <div class="space-y-4">
                    <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl border-2 border-amber-300 dark:border-amber-600/40 text-center space-y-4 shadow-sm">
                        <div class="text-xs uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400">
                            🔮 เครื่องเสี่ยงทาย & สุ่มเลขเด็ดนำโชค
                        </div>

                        <!-- Big Lucky Number Display -->
                        <div class="py-4">
                            <div id="luckyDisplayNumber" class="text-5xl sm:text-6xl font-black font-mono tracking-widest text-[#FF385C] drop-shadow-sm transition-transform duration-200">
                                ${luckyRes}
                            </div>
                        </div>

                        <!-- Selector Pills -->
                        <div class="flex justify-center gap-2 text-xs">
                            <button type="button" data-lucky-type="2digit" class="px-3 py-1.5 rounded-full border transition font-medium ${state.luckyType === '2digit' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}">
                                สุ่ม 2 ตัว
                            </button>
                            <button type="button" data-lucky-type="3digit" class="px-3 py-1.5 rounded-full border transition font-medium ${state.luckyType === '3digit' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}">
                                สุ่ม 3 ตัว
                            </button>
                            <button type="button" data-lucky-type="6digit" class="px-3 py-1.5 rounded-full border transition font-medium ${state.luckyType === '6digit' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}">
                                สุ่ม 6 ตัว (รางวัลที่ 1)
                            </button>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex flex-col sm:flex-row justify-center gap-2 pt-2">
                            <button type="button" id="btnSpinLucky" class="px-5 py-2.5 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl font-bold text-sm shadow-md transition transform active:scale-95 flex items-center justify-center gap-1.5">
                                🎲 สุ่มเลขใหม่
                            </button>
                            <button type="button" id="btnSendToBet" class="px-4 py-2.5 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-xs transition flex items-center justify-center gap-1.5">
                                🎯 ส่งเลขนี้ไปคำนวณต้นทุน
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        contentHTML += `</div>`;
        container.innerHTML = contentHTML;

        // Attach event listeners
        attachLottoListeners(container, state);
    }

    function attachLottoListeners(container, state) {
        if (!container) return;

        // Tab Switching
        container.querySelectorAll('[data-lotto-tab]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.lottoTab;
                if (tab) {
                    state.activeTab = tab;
                    renderActiveTool();
                }
            });
        });

        // Tab 1 Events (Bet & Permutations)
        const betInput = container.querySelector('#betNumberInput');
        if (betInput) {
            betInput.addEventListener('input', (e) => {
                state.betNumberInput = e.target.value.replace(/\D/g, '');
            });
        }

        const btnAddManual = container.querySelector('#btnAddManualNumber');
        if (btnAddManual) {
            btnAddManual.addEventListener('click', () => {
                const val = (state.betNumberInput || '').trim();
                if (val) {
                    state.numbersList = Array.isArray(state.numbersList) ? state.numbersList : [];
                    if (!state.numbersList.includes(val)) {
                        state.numbersList.push(val);
                    }
                    state.betNumberInput = '';
                    renderActiveTool();
                }
            });
        }

        // Permutations Expand Buttons
        container.querySelectorAll('[data-lotto-expand]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.lottoExpand;
                const raw = (state.betNumberInput || '').trim();
                let expanded = [];

                if (type === '6doors') {
                    expanded = expand6Doors(raw || '579');
                } else if (type === '2doors') {
                    expanded = expandTwoDigitReverse(raw || '28');
                } else if (type === '19doors') {
                    const d = raw ? raw.slice(-1) : '8';
                    expanded = expand19Doors(d);
                } else if (type === 'frontRun') {
                    const d = raw ? raw.slice(-1) : '8';
                    expanded = expandFrontRun(d);
                } else if (type === 'backRun') {
                    const d = raw ? raw.slice(-1) : '8';
                    expanded = expandBackRun(d);
                } else if (type === 'doubles') {
                    expanded = expandDoubleNumbers();
                }

                if (expanded.length > 0) {
                    state.numbersList = expanded;
                    if (raw) state.betNumberInput = raw;
                    renderActiveTool();
                }
            });
        });

        // Remove single number pill
        container.querySelectorAll('[data-remove-lotto-idx]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.removeLottoIdx, 10);
                if (Array.isArray(state.numbersList) && Number.isFinite(idx)) {
                    state.numbersList.splice(idx, 1);
                    renderActiveTool();
                }
            });
        });

        // Clear all numbers
        const btnClear = container.querySelector('#btnClearLottoNumbers');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                state.numbersList = [];
                renderActiveTool();
            });
        }

        // Price and Payout rate inputs
        const priceInput = container.querySelector('#lottoPricePerNumber');
        if (priceInput) {
            priceInput.addEventListener('input', (e) => {
                state.pricePerNumber = e.target.value.replace(/[^0-9.]/g, '');
                renderActiveTool();
            });
        }

        container.querySelectorAll('[data-preset-price]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                state.pricePerNumber = e.currentTarget.dataset.presetPrice;
                renderActiveTool();
            });
        });

        const rateInput = container.querySelector('#lottoPayoutRate');
        if (rateInput) {
            rateInput.addEventListener('input', (e) => {
                state.payoutRate = e.target.value.replace(/[^0-9.]/g, '');
                renderActiveTool();
            });
        }

        container.querySelectorAll('[data-preset-rate]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                state.payoutRate = e.currentTarget.dataset.presetRate;
                renderActiveTool();
            });
        });

        // Tab 2 Events (Claim)
        const prizeSelect = container.querySelector('#claimPrizeSelect');
        if (prizeSelect) {
            prizeSelect.addEventListener('change', (e) => {
                state.claimPrize = e.target.value;
                renderActiveTool();
            });
        }

        container.querySelectorAll('[data-quick-prize]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                state.claimPrize = e.currentTarget.dataset.quickPrize;
                renderActiveTool();
            });
        });

        const countInput = container.querySelector('#claimTicketCount');
        if (countInput) {
            countInput.addEventListener('input', (e) => {
                state.claimTicketCount = e.target.value.replace(/\D/g, '');
                renderActiveTool();
            });
        }

        container.querySelectorAll('[data-preset-count]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                state.claimTicketCount = e.currentTarget.dataset.presetCount;
                renderActiveTool();
            });
        });

        const channelSelect = container.querySelector('#claimChannelSelect');
        if (channelSelect) {
            channelSelect.addEventListener('change', (e) => {
                state.claimChannel = e.target.value;
                renderActiveTool();
            });
        }

        const customRateInput = container.querySelector('#claimCustomRate');
        if (customRateInput) {
            customRateInput.addEventListener('input', (e) => {
                state.claimCustomRate = e.target.value.replace(/[^0-9.]/g, '');
                renderActiveTool();
            });
        }

        // Tab 3 Events (Reality & Savings)
        const spendInput = container.querySelector('#lottoSpendPerDraw');
        if (spendInput) {
            spendInput.addEventListener('input', (e) => {
                state.lottoSpendPerDraw = e.target.value.replace(/[^0-9.]/g, '');
                renderActiveTool();
            });
        }

        const yearsSelect = container.querySelector('#savingsYearsSelect');
        if (yearsSelect) {
            yearsSelect.addEventListener('change', (e) => {
                state.savingsYears = e.target.value;
                renderActiveTool();
            });
        }

        const rateSelect = container.querySelector('#savingsRateSelect');
        if (rateSelect) {
            rateSelect.addEventListener('change', (e) => {
                state.savingsRate = e.target.value;
                renderActiveTool();
            });
        }

        // Tab 4 Events (Lucky Generator)
        container.querySelectorAll('[data-lucky-type]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.luckyType;
                state.luckyType = type;
                state.luckyResult = generateLuckyNumber(type);
                renderActiveTool();
            });
        });

        const btnSpin = container.querySelector('#btnSpinLucky');
        if (btnSpin) {
            btnSpin.addEventListener('click', () => {
                state.luckyResult = generateLuckyNumber(state.luckyType || '3digit');
                renderActiveTool();
            });
        }

        const btnSendBet = container.querySelector('#btnSendToBet');
        if (btnSendBet) {
            btnSendBet.addEventListener('click', () => {
                const num = state.luckyResult || '579';
                state.betNumberInput = num;
                if (num.length === 3) {
                    state.numbersList = expand6Doors(num);
                } else if (num.length === 2) {
                    state.numbersList = expandTwoDigitReverse(num);
                } else {
                    state.numbersList = [num];
                }
                state.activeTab = 'bet';
                renderActiveTool();
            });
        }
    }

    const exportsObj = {
        renderLottoTool,
        attachLottoListeners
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);
