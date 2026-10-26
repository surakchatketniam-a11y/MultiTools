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
            <div class="lotto-tool flex flex-col gap-3 p-1">
                <div class="segment-group grid-cols-2 balanced-segment-modes" role="tablist" aria-label="โหมดเครื่องคำนวณหวยและสลากไทย">
                    ${[['bet','ต้นทุน & กลับเลข'],['claim','ขึ้นเงินรางวัล & ภาษี'],['reality','สถิติ & ออมเงินล้าน'],['lucky','สุ่มเลขเด็ด']].map(([tab,label]) => `
                        <button type="button" role="tab" id="lotto-tab-${tab}" aria-selected="${activeTab === tab}" tabindex="${activeTab === tab ? 0 : -1}" aria-controls="lotto-panel" data-lotto-tab="${tab}" class="segment-btn ${activeTab === tab ? 'active' : ''}">${label}</button>
                    `).join('')}
                </div>
                <div id="lotto-panel" role="tabpanel" aria-labelledby="lotto-tab-${activeTab}">
        `;

        // ==========================================
        // TAB 1: ต้นทุน & ตัวช่วยกลับเลข
        // ==========================================
        if (activeTab === 'bet') {
            const numbers = Array.isArray(state.numbersList) ? state.numbersList : [];
            const betCalc = calculateLottoBet(numbers, state.pricePerNumber, state.payoutRate);

            contentHTML += `
                <div class="space-y-3">
                    <!-- Helper Actions & Input Box -->
                    <div class="lotto-card space-y-3">
                        <label for="betNumberInput" class="block text-xs font-semibold lotto-muted">
                            ป้อนเลขที่ต้องการคำนวณหรือกดตัวช่วยขยายเลข:
                        </label>
                        <div class="flex gap-2">
                            <input type="text" id="betNumberInput" value="${state.betNumberInput || ''}" placeholder="ใส่เลข 1, 2 หรือ 3 หลัก" maxlength="6"
                                class="airbnb-input w-full lotto-input">
                            <button type="button" id="btnAddManualNumber" class="lotto-button lotto-primary">
                                + เพิ่มเลข
                            </button>
                        </div>

                        <!-- Permutation Quick Action Pills -->
                        <div class="pt-1">
                            <div class="text-[11px] lotto-muted mb-1.5 font-medium">ตัวช่วยขยายเลขยอดฮิต (กดแล้วแตกเลขทันที):</div>
                            <div class="flex flex-wrap gap-1.5 text-xs">
                                <button type="button" data-lotto-expand="6doors" class="lotto-button lotto-compact">
                                    6 ประตู (3 ตัวกลับ)
                                </button>
                                <button type="button" data-lotto-expand="2doors" class="lotto-button lotto-compact">
                                    2 ตัวกลับ
                                </button>
                                <button type="button" data-lotto-expand="19doors" class="lotto-button lotto-compact">
                                    19 ประตู (รูด 1 ตัว)
                                </button>
                                <button type="button" data-lotto-expand="frontRun" class="lotto-button lotto-compact">
                                    รูดหน้า (10 หาง)
                                </button>
                                <button type="button" data-lotto-expand="backRun" class="lotto-button lotto-compact">
                                    รูดหลัง (10 หาง)
                                </button>
                                <button type="button" data-lotto-expand="doubles" class="lotto-button lotto-compact">
                                    เลขเบิ้ล (00-99)
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Number Tags List -->
                    <div class="lotto-card space-y-3">
                        <div class="flex justify-between items-center text-xs">
                            <span class="font-semibold lotto-muted">
                                รายการตัวเลขในชุด (${numbers.length} หาง):
                            </span>
                            ${numbers.length > 0 ? `
                                <div class="flex items-center gap-3">
                                    <button type="button" id="btnSendToLottoBook" class="lotto-link-button">
                                        ส่งไปสมุดสลาก
                                    </button>
                                    <button type="button" id="btnClearLottoNumbers" class="lotto-link-button">
                                        ล้างทั้งหมด
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                        <div class="lotto-number-list flex flex-wrap gap-2">
                            ${numbers.length > 0 ? numbers.map((num, idx) => `
                                <span class="lotto-number-chip">
                                    ${num}
                                    <button type="button" data-remove-lotto-idx="${idx}" aria-label="ลบเลข ${num}" class="lotto-remove-number">✕</button>
                                </span>
                            `).join('') : `
                                <div class="w-full text-center py-4 text-xs lotto-muted">
                                    ยังไม่มีตัวเลขในชุด (ป้อนตัวเลขหรือกดปุ่มตัวช่วยด้านบน)
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Cost & Rate Inputs -->
                    <div class="lotto-form-grid grid gap-3">
                        <div class="lotto-card space-y-3">
                            <label for="lottoPricePerNumber" class="block text-xs font-medium lotto-muted">
                                ราคาซื้อต่อหาง (บาท):
                            </label>
                            <input type="text" id="lottoPricePerNumber" value="${state.pricePerNumber || '20'}"
                                class="airbnb-input w-full lotto-input">
                            <div class="flex gap-1 text-[11px]">
                                ${['10', '20', '50', '100'].map(p => `
                                    <button type="button" data-preset-price="${p}" class="lotto-button lotto-compact flex-1">
                                        ${p}฿
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="lotto-card space-y-3">
                            <label for="lottoPayoutRate" class="block text-xs font-medium lotto-muted">
                                อัตราจ่ายเงินรางวัล (บาทละ):
                            </label>
                            <input type="text" id="lottoPayoutRate" value="${state.payoutRate || '900'}"
                                class="airbnb-input w-full lotto-input">
                            <div class="flex gap-1 text-[11px]">
                                <button type="button" data-preset-rate="900" class="lotto-button lotto-compact flex-1">3 ตัว 900</button>
                                <button type="button" data-preset-rate="150" class="lotto-button lotto-compact flex-1">โต๊ด 150</button>
                                <button type="button" data-preset-rate="90" class="lotto-button lotto-compact flex-1">2 ตัว 90</button>
                            </div>
                        </div>
                    </div>

                    <!-- Calculation Results Summary Card -->
                    <div class="lotto-card lotto-result space-y-3">
                        <div class="text-xs uppercase font-semibold tracking-wider lotto-accent">
                            สรุปต้นทุนและผลตอบแทนเมื่อถูกรางวัล (1 หาง)
                        </div>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div class="lotto-inset p-3 space-y-2">
                                <div class="text-xs lotto-muted">ต้นทุนลงทุนรวม:</div>
                                <div class="text-lg font-bold lotto-accent">${formatMoney(betCalc.totalCost)} บาท</div>
                                <div class="text-[11px] lotto-muted">(${betCalc.count} หาง × ${formatMoney(betCalc.pricePerNumber)} บ.)</div>
                            </div>
                            <div class="lotto-inset p-3 space-y-2">
                                <div class="text-xs lotto-muted">เงินรางวัลที่ได้รับ:</div>
                                <div class="text-lg font-bold lotto-accent">${formatMoney(betCalc.winningPayout)} บาท</div>
                                <div class="text-[11px] lotto-muted">(บาทละ ${formatMoney(betCalc.payoutRate)})</div>
                            </div>
                        </div>

                        <div class="pt-2 border-t lotto-hairline flex justify-between items-baseline">
                            <div>
                                <span class="text-xs lotto-muted">กำไรสุทธิ (ถ้าถูก):</span>
                                <span class="text-xl font-semibold lotto-accent ml-2">
                                    ${betCalc.netProfit >= 0 ? '+' : ''}${formatMoney(betCalc.netProfit)} บาท
                                </span>
                            </div>
                            <div class="text-xs lotto-accent font-semibold">
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
                <div class="space-y-3">
                    <!-- Prize Selection -->
                    <div class="lotto-card space-y-3">
                        <label for="claimPrizeSelect" class="block text-xs font-semibold lotto-muted">
                            เลือกลำดับรางวัลที่ถูกสลากกินแบ่ง:
                        </label>
                        <select id="claimPrizeSelect" class="airbnb-input w-full lotto-input">
                            ${Object.values(GLO_PRIZES).map(p => `
                                <option value="${p.key}" ${state.claimPrize === p.key ? 'selected' : ''}>
                                    ${p.label} — ${formatMoney(p.amount)} บาท / ใบ
                                </option>
                            `).join('')}
                        </select>

                        <!-- Quick prize buttons -->
                        <div class="flex flex-wrap gap-1.5 text-xs pt-1">
                            <button type="button" data-quick-prize="first" class="lotto-button lotto-compact ${state.claimPrize === 'first' ? 'is-selected' : ''}">
                                รางวัลที่ 1 (6 ล้าน)
                            </button>
                            <button type="button" data-quick-prize="back2" class="lotto-button lotto-compact ${state.claimPrize === 'back2' ? 'is-selected' : ''}">
                                เลขท้าย 2 ตัว (2,000)
                            </button>
                            <button type="button" data-quick-prize="back3" class="lotto-button lotto-compact ${state.claimPrize === 'back3' ? 'is-selected' : ''}">
                                ท้าย 3 ตัว (4,000)
                            </button>
                            <button type="button" data-quick-prize="front3" class="lotto-button lotto-compact ${state.claimPrize === 'front3' ? 'is-selected' : ''}">
                                หน้า 3 ตัว (4,000)
                            </button>
                        </div>
                    </div>

                    <!-- Ticket Count & Channel -->
                    <div class="lotto-form-grid grid gap-3">
                        <div class="lotto-card space-y-3">
                            <label for="claimTicketCount" class="block text-xs font-medium lotto-muted">
                                จำนวนสลากที่ถูกรางวัล (ใบ):
                            </label>
                            <input type="number" id="claimTicketCount" min="1" max="1000" value="${state.claimTicketCount || '1'}"
                                class="airbnb-input w-full lotto-input">
                            <div class="flex gap-1 text-[11px]">
                                ${['1', '2', '5', '10'].map(c => `
                                    <button type="button" data-preset-count="${c}" class="lotto-button lotto-compact flex-1">
                                        ${c} ใบ
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="lotto-card space-y-3">
                            <label for="claimChannelSelect" class="block text-xs font-medium lotto-muted">
                                ช่องทางขึ้นเงินรางวัล:
                            </label>
                            <select id="claimChannelSelect" class="airbnb-input w-full lotto-input">
                                ${Object.values(CLAIM_CHANNELS).map(ch => `
                                    <option value="${ch.key}" ${state.claimChannel === ch.key ? 'selected' : ''}>
                                        ${ch.label} (หัก ${ch.rate}%)
                                    </option>
                                `).join('')}
                            </select>
                            ${state.claimChannel === 'shop' ? `
                                <div class="flex items-center gap-2 pt-1">
                                    <span class="text-xs lotto-muted">อัตราหักร้าน:</span>
                                    <input type="text" id="claimCustomRate" aria-label="อัตราหักร้าน (%)" value="${state.claimCustomRate || '2.0'}" class="airbnb-input w-full lotto-input">
                                    <span class="text-xs lotto-muted">%</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Prize Breakdown Card -->
                    <div class="lotto-card lotto-result space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold uppercase lotto-accent">สรุปเงินรางวัลสุทธิหลังหักภาษี</span>
                            <span class="text-xs px-2 py-0.5 rounded lotto-soft lotto-accent font-semibold">
                                หัก ${claim.deductionRate}%
                            </span>
                        </div>

                        <div class="space-y-1.5 text-sm">
                            <div class="flex justify-between lotto-muted text-xs">
                                <span>ยอดเงินรางวัลรวม (${claim.ticketCount} ใบ):</span>
                                <span class="font-semibold lotto-ink">${formatMoney(claim.totalGrossPrize)} บาท</span>
                            </div>
                            <div class="flex justify-between lotto-accent text-xs">
                                <span>ค่าธรรมเนียม / อากร / ภาษี (${claim.deductionRate}%):</span>
                                <span class="font-semibold">-${formatMoney(claim.deductionAmount)} บาท</span>
                            </div>
                            <div class="pt-2 border-t lotto-hairline flex justify-between items-baseline">
                                <span class="font-bold lotto-ink">เงินสดสุทธิที่ได้รับจริง:</span>
                                <span class="text-2xl font-semibold lotto-accent">
                                    ${formatMoney(claim.netPrize)} บาท
                                </span>
                            </div>
                        </div>

                        <div class="lotto-note text-xs">
                            <strong>ข้อกฎหมาย & ข้อควรรู้:</strong> ${claim.feeNote}
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
                <div class="space-y-3">
                    <!-- Savings Simulator Card -->
                    <div class="lotto-card space-y-3">
                        <div class="flex items-center gap-2">
                            <div>
                                <h3 class="font-bold text-sm lotto-accent">โปรแกรมจำลอง: "เปลี่ยนค่าหวยเป็นเงินล้าน"</h3>
                                <p class="text-[11px] lotto-muted">ถ้าเปลี่ยนเงินซื้อหวยต่องวด มาลงทุน DCA แบบมีวินัย จะได้เงินเก็บเท่าไหร่?</p>
                            </div>
                        </div>

                        <div class="lotto-form-grid grid gap-3 text-xs">
                            <div class="lotto-inset p-3 space-y-2">
                                <label for="lottoSpendPerDraw" class="lotto-muted block mb-1">ซื้อหวยงวดละ (บ.):</label>
                                <input type="number" id="lottoSpendPerDraw" value="${state.lottoSpendPerDraw || '500'}"
                                    class="airbnb-input w-full lotto-input">
                            </div>
                            <div class="lotto-inset p-3 space-y-2">
                                <label for="savingsYearsSelect" class="lotto-muted block mb-1">ระยะเวลาออม (ปี):</label>
                                <select id="savingsYearsSelect" class="airbnb-input w-full lotto-input">
                                    <option value="5" ${state.savingsYears === '5' ? 'selected' : ''}>5 ปี</option>
                                    <option value="10" ${state.savingsYears === '10' ? 'selected' : ''}>10 ปี</option>
                                    <option value="20" ${state.savingsYears === '20' ? 'selected' : ''}>20 ปี</option>
                                    <option value="30" ${state.savingsYears === '30' ? 'selected' : ''}>30 ปี</option>
                                </select>
                            </div>
                            <div class="lotto-inset p-3 space-y-2">
                                <label for="savingsRateSelect" class="lotto-muted block mb-1">ผลตอบแทนเฉลี่ย (%/ปี):</label>
                                <select id="savingsRateSelect" class="airbnb-input w-full lotto-input">
                                    <option value="2" ${state.savingsRate === '2' ? 'selected' : ''}>2% (ฝากประจำ/ตราสารหนี้)</option>
                                    <option value="5" ${state.savingsRate === '5' ? 'selected' : ''}>5% (กองทุนรวมผสม)</option>
                                    <option value="7" ${state.savingsRate === '7' ? 'selected' : ''}>7% (ดัชนีหุ้นไทย/โลก)</option>
                                    <option value="10" ${state.savingsRate === '10' ? 'selected' : ''}>10% (หุ้นเติบโต/S&P500)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Results -->
                        <div class="lotto-inset lotto-result p-3 space-y-2">
                            <div class="flex justify-between text-xs lotto-muted">
                                <span>เงินต้นค่าหวยที่สะสม (${sim.years} ปี = ${sim.totalMonths} เดือน):</span>
                                <span class="font-semibold lotto-accent">${formatMoney(sim.totalPrincipal)} บาท</span>
                            </div>
                            <div class="flex justify-between text-xs lotto-accent">
                                <span>กำไรดอกเบี้ยทบต้นที่งอกเงย:</span>
                                <span class="font-bold">+${formatMoney(sim.totalInterest)} บาท</span>
                            </div>
                            <div class="pt-2 border-t lotto-hairline flex justify-between items-baseline">
                                <span class="font-bold text-sm lotto-accent">ยอดเงินเก็บรวมทั้งหมด:</span>
                                <span class="text-2xl font-semibold lotto-accent">
                                    ${formatMoney(sim.futureValue)} บาท
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Reality Check Statistics Card -->
                    <div class="lotto-card space-y-3">
                        <div class="text-xs font-bold lotto-muted flex items-center gap-1.5">
                            สถิติ & สัจธรรมความจริงสลากกินแบ่งรัฐบาล (1 ชุด = 1,000,000 ใบ)
                        </div>
                        <div class="lotto-stats-grid grid gap-2 text-xs">
                            <div class="lotto-stat text-center">
                                <div class="text-[11px] lotto-muted">โอกาสถูกรางวัลใดๆ</div>
                                <div class="text-base font-bold lotto-accent">1.42%</div>
                                <div class="text-[10px] lotto-muted">14,168 ใบในล้าน</div>
                            </div>
                            <div class="lotto-stat text-center">
                                <div class="text-[11px] lotto-muted">โอกาสไม่ถูกรางวัล (กินเรียบ)</div>
                                <div class="text-base font-bold lotto-accent">98.58%</div>
                                <div class="text-[10px] lotto-muted">985,832 ใบในล้าน</div>
                            </div>
                            <div class="lotto-stat text-center">
                                <div class="text-[11px] lotto-muted">มูลค่าคาดหวัง (EV)</div>
                                <div class="text-base font-bold lotto-accent">48 บาท/ใบ</div>
                                <div class="text-[10px] lotto-accent">ซื้อ 80 บ. ขาดทุน -40%</div>
                            </div>
                        </div>

                        <div class="text-[11px] lotto-muted space-y-1 pt-1">
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
                <div class="space-y-3">
                    <div class="lotto-card lotto-result space-y-3 text-center">
                        <div class="text-xs uppercase tracking-wider font-bold lotto-accent">
                            เครื่องเสี่ยงทาย & สุ่มเลขเด็ดนำโชค
                        </div>

                        <!-- Big Lucky Number Display -->
                        <div class="py-4">
                            <div id="luckyDisplayNumber" class="text-5xl sm:text-6xl font-semibold font-mono tracking-widest lotto-accent transition-transform duration-200">
                                ${luckyRes}
                            </div>
                        </div>

                        <!-- Selector Pills -->
                        <div class="flex justify-center gap-2 text-xs">
                            <button type="button" data-lucky-type="2digit" class="lotto-button lotto-compact ${state.luckyType === '2digit' ? 'is-selected' : ''}">
                                สุ่ม 2 ตัว
                            </button>
                            <button type="button" data-lucky-type="3digit" class="lotto-button lotto-compact ${state.luckyType === '3digit' ? 'is-selected' : ''}">
                                สุ่ม 3 ตัว
                            </button>
                            <button type="button" data-lucky-type="6digit" class="lotto-button lotto-compact ${state.luckyType === '6digit' ? 'is-selected' : ''}">
                                สุ่ม 6 ตัว (รางวัลที่ 1)
                            </button>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex flex-col sm:flex-row justify-center gap-2 pt-2">
                            <button type="button" id="btnSpinLucky" class="lotto-button lotto-primary">
                                สุ่มเลขใหม่
                            </button>
                            <button type="button" id="btnSendToBet" class="lotto-button">
                                ส่งเลขนี้ไปคำนวณต้นทุน
                            </button>
                            <button type="button" id="btnSendLuckyToLottoBook" class="lotto-button">
                                ส่งเลขนี้ไปสมุดสลาก
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        contentHTML += `</div>
            <div class="lotto-card lotto-book-link">
                <div><div class="text-sm font-semibold">สมุดสลาก & สถิติย้อนหลัง</div><p class="text-xs lotto-muted">บันทึกสลาก งบต่องวด และดูผลย้อนหลัง</p></div>
                <a href="../lotto_book/" class="lotto-button whitespace-nowrap">เปิดแอป <span aria-hidden="true">→</span></a>
            </div>
        </div>`;
        container.innerHTML = contentHTML;

        // Attach event listeners
        attachLottoListeners(container, state);
    }

    function attachLottoListeners(container, state) {
        if (!container) return;

        // Match the app's segmented controls, including keyboard navigation.
        const tabs = [...container.querySelectorAll('[data-lotto-tab]')];
        tabs.forEach((btn, index) => {
            btn.addEventListener('click', event => {
                const tab = event.currentTarget.dataset.lottoTab;
                if (tab) {
                    state.activeTab = tab;
                    renderActiveTool();
                    container.querySelector(`[data-lotto-tab="${tab}"]`)?.focus({ preventScroll: true });
                }
            });
            btn.addEventListener('keydown', event => {
                const offsets = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 2, ArrowUp: -2 };
                let target;
                if (Object.hasOwn(offsets, event.key)) target = (index + offsets[event.key] + tabs.length) % tabs.length;
                else if (event.key === 'Home') target = 0;
                else if (event.key === 'End') target = tabs.length - 1;
                else return;
                event.preventDefault();
                tabs[target].click();
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

        // Send numbers list to LottoBook
        const btnSendBook = container.querySelector('#btnSendToLottoBook');
        if (btnSendBook) {
            btnSendBook.addEventListener('click', () => {
                const nums = (Array.isArray(state.numbersList) ? state.numbersList : [])
                    .map(n => String(n).trim())
                    .filter(n => /^(?:\d{2}|\d{3}|\d{6})$/.test(n));
                if (!nums.length) return;
                const price = encodeURIComponent(state.pricePerNumber || '80');
                const query = encodeURIComponent(nums.join(','));
                window.location.href = `../lotto_book/?importNumbers=${query}&price=${price}#tickets`;
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

        const btnSendLuckyBook = container.querySelector('#btnSendLuckyToLottoBook');
        if (btnSendLuckyBook) {
            btnSendLuckyBook.addEventListener('click', () => {
                const num = String(state.luckyResult || '579').trim();
                if (!/^(?:\d{2}|\d{3}|\d{6})$/.test(num)) return;
                const price = encodeURIComponent(state.pricePerNumber || '80');
                window.location.href = `../lotto_book/?importNumbers=${encodeURIComponent(num)}&price=${price}#tickets`;
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
