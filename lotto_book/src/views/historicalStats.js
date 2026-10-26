/**
 * lotto_book - View 3: Historical Statistics & Distribution (สถิติย้อนหลัง)
 * Analyzes Thai GLO past results, 2-digit and 3-digit frequencies, 0-9 digit distributions per position,
 * with full dataset transparency and anti-gambler's fallacy notes.
 */

(function(root) {
    'use strict';

    const HistoricalStatsView = {
        selectedLimit: 48, // default 2 years (48 draws)
        selectedDayFilter: 'all', // 'all', '1', '16'
        activeTab: 'back2', // 'back2', 'compare1stTail', 'digits', 'digits3'
        back2ViewMode: 'top', // 'top', 'cold', 'grid'

        render(container) {
            if (!container) return;

            const allResults = root.LottoApp.historicalResults || [];
            const filteredResults = root.LottoStats.filterRecords(allResults, {
                limit: this.selectedLimit,
                dayFilter: this.selectedDayFilter
            });

            const stats = root.LottoStats.computeStats(filteredResults);
            const meta = stats.metadata;

            container.innerHTML = `
                <div class="space-y-6">
                    <!-- Filters & Scope Card -->
                    <div class="bg-surface  p-4 sm:p-5 rounded-lg border border-line   space-y-4">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-line ">
                            <div>
                                <h2 class="text-base font-bold text-ink  flex items-center gap-2">
                                    <span>▥</span> ตัวกรองขอบเขตสถิติย้อนหลัง
                                </h2>
                                <p class="text-base text-muted  mt-0.5">
                                    เลือกช่วงเวลาและงวดที่ต้องการวิเคราะห์
                                </p>
                            </div>

                            <!-- Day Filter Pill Buttons -->
                            <div class="flex flex-wrap items-center gap-1 bg-raised  p-1 rounded-lg text-base font-semibold">
                                <button type="button" data-day-filter="all" class="px-3 py-1.5 rounded-lg transition ${this.selectedDayFilter === 'all' ? 'bg-surface  text-ink  ' : 'text-muted hover:text-ink '}">
                                    ทุกงวด
                                </button>
                                <button type="button" data-day-filter="1" class="px-3 py-1.5 rounded-lg transition ${this.selectedDayFilter === '1' ? 'bg-surface  text-ink  ' : 'text-muted hover:text-ink '}">
                                    งวดวันที่ 1
                                </button>
                                <button type="button" data-day-filter="16" class="px-3 py-1.5 rounded-lg transition ${this.selectedDayFilter === '16' ? 'bg-surface  text-ink  ' : 'text-muted hover:text-ink '}">
                                    งวดวันที่ 16
                                </button>
                            </div>
                        </div>

                        <!-- Scope Preset Buttons -->
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-base text-muted  font-medium">ช่วงย้อนหลัง:</span>
                            ${[
                                { label: '12 งวด (~6 เดือน)', limit: 12 },
                                { label: '24 งวด (~1 ปี)', limit: 24 },
                                { label: '48 งวด (~2 ปี)', limit: 48 },
                                { label: '72 งวด (~3 ปี)', limit: 72 },
                                { label: `ทั้งหมด (${allResults.length} งวด)`, limit: 9999 }
                            ].map(p => `
                                <button type="button" data-limit="${p.limit}" class="btn-limit-filter px-3 py-1.5 rounded-lg text-base font-semibold transition border ${this.selectedLimit === p.limit ? 'bg-action border-accent text-white ' : 'bg-surface  border-line  text-ink  hover:border-line'}">
                                    ${p.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Dataset Integrity & Metadata Banner -->
                    <div class="bg-accent-soft  border border-line  p-4 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-base">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">▤</span>
                            <div>
                                <span class="font-bold text-accent ">ฐานข้อมูลที่ใช้วิเคราะห์:</span>
                                <span class="text-accent  ml-1">
                                    รวม ${meta.totalDraws} งวด (${meta.startDateFormatted || meta.startDate} ถึง ${meta.endDateFormatted || meta.endDate})
                                </span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            ${meta.missingCount > 0 ? `
                                <span class="px-2.5 py-1 bg-warning-soft text-warning   rounded-lg font-medium">
                                    พบช่วงว่าง ${meta.missingCount} จุด (อาจเป็นงวดเลื่อนหรือสัญจร)
                                </span>
                            ` : `
                                <span class="px-2.5 py-1 bg-success-soft text-success   rounded-lg font-medium">
                                    ✓ ลำดับงวดต่อเนื่องสมบูรณ์
                                </span>
                            `}
                        </div>
                    </div>

                    <!-- Statistics Navigation Tabs -->
                    <div class="flex border-b border-line  overflow-x-auto no-scrollbar gap-2 text-base sm:text-base font-semibold">
                        <button type="button" data-stats-tab="back2" class="px-3.5 py-2.5 rounded-t-xl border-b-2 transition whitespace-nowrap ${this.activeTab === 'back2' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink  '}">
                            ◎ เลขท้าย 2 ตัว (00 - 99)
                        </button>
                        <button type="button" data-stats-tab="compare1stTail" class="px-3.5 py-2.5 rounded-t-xl border-b-2 transition whitespace-nowrap ${this.activeTab === 'compare1stTail' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink  '}">
                            ⇄ 2 ตัวท้าย รว.1 vs เลขท้าย 2 ตัว
                        </button>
                        <button type="button" data-stats-tab="digits" class="px-3.5 py-2.5 rounded-t-xl border-b-2 transition whitespace-nowrap ${this.activeTab === 'digits' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink  '}">
                            ▦ การกระจายเลข 0-9 รายหลัก
                        </button>
                        <button type="button" data-stats-tab="digits3" class="px-3.5 py-2.5 rounded-t-xl border-b-2 transition whitespace-nowrap ${this.activeTab === 'digits3' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink  '}">
                            △ เลขหน้า/ท้าย 3 ตัว
                        </button>
                    </div>

                    <!-- TAB CONTENT -->
                    <div class="tab-content">
                        ${this.renderTabContent(stats)}
                    </div>

                    <!-- Scientific Reality & Anti-Gambler's Fallacy Notice -->
                    <div class="bg-surface  p-4 rounded-lg border border-line  space-y-2">
                        <div class="flex items-center gap-2 text-base font-bold text-ink ">
                            <span>i</span> หลักคิดทางคณิตศาสตร์และข้อเท็จจริงทางสถิติ
                        </div>
                        <p class="text-base text-muted  leading-relaxed">
                            ${stats.disclaimer}
                        </p>
                        <div class="text-base text-muted  pt-1 border-t border-line  flex flex-wrap gap-4">
                            <span>• ความน่าจะเป็นถูกเลขท้าย 2 ตัว: 1 ใน 100 (1.00%) เท่ากันทุกหมายเลข</span>
                            <span>• ความน่าจะเป็นถูกรางวัลที่ 1: 1 ใน 1,000,000 (0.0001%)</span>
                            <span>• อัตราผลตอบแทนคืนผู้ซื้อตามกฎหมายสลาก: ~60% ของยอดจำหน่าย</span>
                        </div>
                    </div>
                </div>
            `;

            this.bindEvents(container);
        },

        renderTabContent(stats) {
            if (this.activeTab === 'back2') {
                return this.renderBack2Tab(stats);
            } else if (this.activeTab === 'compare1stTail') {
                return this.renderCompareTab(stats);
            } else if (this.activeTab === 'digits') {
                return this.renderDigitsTab(stats);
            } else if (this.activeTab === 'digits3') {
                return this.renderDigits3Tab(stats);
            }
            return '';
        },

        // ----------------------------------------------------
        // TAB 1: เลขท้าย 2 ตัว (00 - 99)
        // ----------------------------------------------------
        renderBack2Tab(stats) {
            const b2 = stats.back2;
            const totalDraws = stats.metadata.totalDraws;

            return `
                <div class="space-y-4">
                    <!-- Clarifying Distinction Badge -->
                    <div class="bg-warning-soft  p-3 rounded-lg border border-line  text-base text-warning  flex items-center gap-2">
                        <span aria-hidden="true" class="font-bold">i</span>
                        <span>
                            <strong>ชี้แจงสำคัญ:</strong> สถิตินี้คือ <strong>รางวัลเลขท้าย 2 ตัว (รางวัลเฉพาะ)</strong> ที่หมุนวงล้อแยก ไม่ใช่เลขท้าย 2 ตัวที่ตัดมาจากรางวัลที่ 1
                        </span>
                    </div>

                    <!-- Sub-view switcher: Top 10 / Cold 10 / Full Grid -->
                    <div class="flex items-center justify-between flex-wrap gap-2">
                        <div class="flex flex-wrap items-center gap-1.5 bg-raised  p-1 rounded-lg text-base font-semibold">
                            <button type="button" data-b2-mode="top" class="px-3 py-1.5 rounded-lg transition ${this.back2ViewMode === 'top' ? 'bg-action text-white ' : 'text-muted '}">
                                ↑ 10 อันดับออกบ่อยสุด
                            </button>
                            <button type="button" data-b2-mode="cold" class="px-3 py-1.5 rounded-lg transition ${this.back2ViewMode === 'cold' ? 'bg-action text-white ' : 'text-muted '}">
                                ↓ 10 อันดับไม่ค่อยออก
                            </button>
                            <button type="button" data-b2-mode="grid" class="px-3 py-1.5 rounded-lg transition ${this.back2ViewMode === 'grid' ? 'bg-action text-white ' : 'text-muted '}">
                                ▦ ตารางครบ 00 - 99
                            </button>
                        </div>
                    </div>

                    <!-- Top 10 View -->
                    ${this.back2ViewMode === 'top' ? `
                        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            ${b2.top10.map((item, idx) => {
                                const pct = totalDraws > 0 ? ((item.count / totalDraws) * 100).toFixed(1) : 0;
                                return `
                                    <div class="frequency-card bg-surface p-3.5 rounded-lg border border-line flex flex-col items-center justify-between text-center relative overflow-hidden">
                                        <div class="absolute top-1.5 left-2 text-base font-bold text-muted">#${idx + 1}</div>
                                        <div class="font-lotto text-3xl font-extrabold text-accent mt-2 mb-1">
                                            ${item.number}
                                        </div>
                                        <div class="text-base font-bold text-ink ">
                                            ออก ${item.count} ครั้ง
                                        </div>
                                        <div class="text-base text-muted  mt-0.5">
                                            ความถี่ ${pct}%
                                        </div>
                                        <div class="text-base text-muted mt-1">
                                            ${item.lastSeenDraw ? `ล่าสุด: ${item.lastSeenDraw}` : 'ยังไม่ออกในรอบนี้'}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}

                    <!-- Cold 10 View -->
                    ${this.back2ViewMode === 'cold' ? `
                        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            ${b2.cold10.map((item, idx) => {
                                return `
                                    <div class="frequency-card bg-surface p-3.5 rounded-lg border border-line flex flex-col items-center justify-between text-center relative overflow-hidden">
                                        <div class="absolute top-1.5 left-2 text-base font-bold text-muted">#${idx + 1}</div>
                                        <div class="font-lotto text-3xl font-extrabold text-accent  mt-2 mb-1">
                                            ${item.number}
                                        </div>
                                        <div class="text-base font-bold text-ink ">
                                            ออก ${item.count} ครั้ง
                                        </div>
                                        <div class="text-base text-muted  mt-1">
                                            ${item.count === 0 ? 'ไม่เคยออกในช่วงนี้' : `เว้นมาแล้ว ${item.drawsSinceLastSeen} งวด`}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}

                    <!-- Full 00-99 Grid View -->
                    ${this.back2ViewMode === 'grid' ? `
                        <div class="bg-surface  p-4 rounded-lg border border-line  ">
                            <div class="text-base font-bold text-ink  mb-3">
                                ความถี่เลขท้าย 2 ตัว ครบทั้ง 100 หมายเลข (00 ถึง 99):
                            </div>
                            <div class="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2">
                                ${b2.allByNumber.map(item => {
                                    const intensity = item.count === 0 ? 'bg-surface  text-muted' : (item.count >= 3 ? 'bg-accent-soft text-accent   font-bold border border-line' : 'bg-raised  text-ink ');
                                    return `
                                        <div class="p-2 rounded-lg text-center ${intensity} flex flex-col items-center justify-center" title="เลข ${item.number}: ออก ${item.count} ครั้ง">
                                            <span class="font-lotto text-base font-bold">${item.number}</span>
                                            <span class="text-base opacity-75">${item.count} ครั้ง</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        },

        // ----------------------------------------------------
        // TAB 2: Compare 2 ตัวท้าย รว.1 vs เลขท้าย 2 ตัว
        // ----------------------------------------------------
        renderCompareTab(stats) {
            const b2Top = stats.back2.top10.slice(0, 5);
            const tail1stTop = stats.firstTail2.top10.slice(0, 5);

            return `
                <div class="space-y-4">
                    <div class="bg-surface  p-5 rounded-lg border border-line   space-y-4">
                        <div class="pb-3 border-b border-line ">
                            <h3 class="text-base font-bold text-ink ">
                                เปรียบเทียบความแตกต่าง: "เลขท้าย 2 ตัว" vs "2 ตัวท้ายรางวัลที่ 1"
                            </h3>
                            <p class="text-base text-muted  mt-1">
                                ในสลากกินแบ่งรัฐบาลไทย สองประเภทนี้คือคนละรางวัลกันอย่างสิ้นเชิง การวิเคราะห์จำเป็นต้องแยกชุดข้อมูลออกจากกัน
                            </p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Official 2-digit Prize -->
                            <div class="color-panel tone-cyan p-4 rounded-lg bg-accent-soft border border-line space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-base text-accent">◎ รางวัลเลขท้าย 2 ตัว (รางวัลเฉพาะ)</span>
                                    <span class="text-base bg-accent-soft  text-accent  px-2 py-0.5 rounded-full font-bold">หมุนวงล้อเฉพาะ</span>
                                </div>
                                <div class="text-base text-muted ">
                                    5 อันดับที่ออกบ่อยที่สุดในช่วงนี้:
                                </div>
                                <div class="space-y-2">
                                    ${b2Top.map((item, idx) => `
                                        <div class="flex justify-between items-center bg-surface  p-2 rounded-lg text-base">
                                            <div class="flex items-center gap-2">
                                                <span class="font-bold text-muted">#${idx + 1}</span>
                                                <span class="font-lotto font-bold text-base text-accent">${item.number}</span>
                                            </div>
                                            <span class="font-semibold text-ink ">${item.count} ครั้ง</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- 1st Prize 2-digit Tail -->
                            <div class="color-panel tone-purple p-4 rounded-lg bg-accent-soft border border-line space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-base text-accent ">★ เลข 2 ตัวท้ายที่ตัดจากรางวัลที่ 1</span>
                                    <span class="text-base bg-accent-soft  text-accent  px-2 py-0.5 rounded-full font-bold">ตัดจาก 6 หลัก</span>
                                </div>
                                <div class="text-base text-muted ">
                                    5 อันดับที่ออกบ่อยที่สุดในช่วงนี้:
                                </div>
                                <div class="space-y-2">
                                    ${tail1stTop.map((item, idx) => `
                                        <div class="flex justify-between items-center bg-surface  p-2 rounded-lg text-base">
                                            <div class="flex items-center gap-2">
                                                <span class="font-bold text-muted">#${idx + 1}</span>
                                                <span class="font-lotto font-bold text-base text-accent ">${item.number}</span>
                                            </div>
                                            <span class="font-semibold text-ink ">${item.count} ครั้ง</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        // ----------------------------------------------------
        // TAB 3: การกระจายตัวเลข 0 - 9 แต่ละหลัก
        // ----------------------------------------------------
        renderDigitsTab(stats) {
            const dist1st = stats.digitDistribution1st;
            const distB2 = stats.digitDistributionBack2;
            const totalDraws = stats.metadata.totalDraws;

            const positions = [
                { label: 'หลักแสน (ตำแหน่ง 1)', data: dist1st.pos0_hundredK },
                { label: 'หลักหมื่น (ตำแหน่ง 2)', data: dist1st.pos1_tenK },
                { label: 'หลักพัน (ตำแหน่ง 3)', data: dist1st.pos2_thousand },
                { label: 'หลักร้อย (ตำแหน่ง 4)', data: dist1st.pos3_hundred },
                { label: 'หลักสิบ (ตำแหน่ง 5)', data: dist1st.pos4_ten },
                { label: 'หลักหน่วย (ตำแหน่ง 6)', data: dist1st.pos5_unit }
            ];

            return `
                <div class="space-y-4">
                    <div class="bg-surface  p-5 rounded-lg border border-line   space-y-4">
                        <div class="pb-3 border-b border-line ">
                            <h3 class="text-base font-bold text-ink ">
                                การกระจายตัวเลข 0 ถึง 9 ในรางวัลที่ 1 (รายหลัก)
                            </h3>
                            <p class="text-base text-muted  mt-1">
                                แสดงความถี่ที่ตัวเลขแต่ละตัว (0 - 9) ปรากฏในแต่ละตำแหน่งของรางวัลที่ 1 (${totalDraws} งวด)
                            </p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${positions.map(p => {
                                const maxCount = Math.max(...p.data, 1);
                                return `
                                    <div class="bg-surface  p-3.5 rounded-lg border border-line  space-y-2">
                                        <div class="text-base font-bold text-ink ">
                                            ${p.label}
                                        </div>
                                        <div class="space-y-1">
                                            ${p.data.map((count, digit) => {
                                                const pct = totalDraws > 0 ? ((count / totalDraws) * 100).toFixed(0) : 0;
                                                const barPct = Math.round((count / maxCount) * 100);
                                                return `
                                                    <div class="flex items-center gap-2 text-base">
                                                        <span class="w-4 font-mono font-bold text-ink  text-center">${digit}</span>
                                                        <div class="flex-1 bg-raised  rounded-full h-2 overflow-hidden">
                                                            <div class="chart-bar h-2 rounded-full" style="width: ${barPct}%"></div>
                                                        </div>
                                                        <span class="w-12 text-right text-base text-muted ">${count} ครั้ง (${pct}%)</span>
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        },

        // ----------------------------------------------------
        // TAB 4: เลขหน้า/ท้าย 3 ตัว
        // ----------------------------------------------------
        renderDigits3Tab(stats) {
            return `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Front 3 Digits Top 10 -->
                    <div class="color-panel tone-blue bg-surface  p-5 rounded-lg border border-line   space-y-3">
                        <div class="flex items-center justify-between pb-2 border-b border-line ">
                            <h3 class="text-base font-bold text-accent ">
                                · เลขหน้า 3 ตัวที่ออกบ่อยสุด (Top 10)
                            </h3>
                            <span class="text-base text-muted">งวดละ 2 รางวัล</span>
                        </div>
                        <div class="space-y-2">
                            ${stats.front3Top10.map((item, idx) => `
                                <div class="flex justify-between items-center bg-surface  p-2.5 rounded-lg text-base">
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold text-muted">#${idx + 1}</span>
                                        <span class="font-lotto font-bold text-base text-accent ">${item.number}</span>
                                    </div>
                                    <span class="font-semibold text-ink ">ออก ${item.count} ครั้ง</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Back 3 Digits Top 10 -->
                    <div class="color-panel tone-purple bg-surface  p-5 rounded-lg border border-line   space-y-3">
                        <div class="flex items-center justify-between pb-2 border-b border-line ">
                            <h3 class="text-base font-bold text-accent ">
                                · เลขท้าย 3 ตัวที่ออกบ่อยสุด (Top 10)
                            </h3>
                            <span class="text-base text-muted">งวดละ 2 รางวัล</span>
                        </div>
                        <div class="space-y-2">
                            ${stats.back3Top10.map((item, idx) => `
                                <div class="flex justify-between items-center bg-surface  p-2.5 rounded-lg text-base">
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold text-muted">#${idx + 1}</span>
                                        <span class="font-lotto font-bold text-base text-accent ">${item.number}</span>
                                    </div>
                                    <span class="font-semibold text-ink ">ออก ${item.count} ครั้ง</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        },

        bindEvents(container) {
            const filters = [
                ['[data-day-filter]', 'dayFilter', this.selectedDayFilter],
                ['[data-limit]', 'limit', String(this.selectedLimit)],
                ['[data-stats-tab]', 'statsTab', this.activeTab],
                ['[data-b2-mode]', 'b2Mode', this.back2ViewMode]
            ];
            filters.forEach(([selector, key, value]) => {
                container.querySelectorAll(selector).forEach(button => {
                    button.setAttribute('aria-pressed', String(button.dataset[key] === value));
                });
            });

            // Day filter buttons
            container.querySelectorAll('[data-day-filter]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.selectedDayFilter = btn.dataset.dayFilter;
                    this.render(container);
                });
            });

            // Limit filter buttons
            container.querySelectorAll('.btn-limit-filter').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.selectedLimit = parseInt(btn.dataset.limit, 10);
                    this.render(container);
                });
            });

            // Stats navigation tabs
            container.querySelectorAll('[data-stats-tab]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.activeTab = btn.dataset.statsTab;
                    this.render(container);
                });
            });

            // Back 2 sub-mode switcher
            container.querySelectorAll('[data-b2-mode]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.back2ViewMode = btn.dataset.b2Mode;
                    this.render(container);
                });
            });
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = HistoricalStatsView;
    } else {
        root.LottoHistoricalStatsView = HistoricalStatsView;
    }
})(typeof window !== 'undefined' ? window : global);
