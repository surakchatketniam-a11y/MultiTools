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
                    <div class="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700/60">
                            <div>
                                <h3 class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span>📊</span> ตัวกรองขอบเขตสถิติย้อนหลัง
                                </h3>
                                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    เลือกช่วงเวลาและงวดที่ต้องการวิเคราะห์
                                </p>
                            </div>

                            <!-- Day Filter Pill Buttons -->
                            <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/80 p-1 rounded-xl text-xs font-semibold">
                                <button type="button" data-day-filter="all" class="px-3 py-1.5 rounded-lg transition ${this.selectedDayFilter === 'all' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}">
                                    ทุกงวด
                                </button>
                                <button type="button" data-day-filter="1" class="px-3 py-1.5 rounded-lg transition ${this.selectedDayFilter === '1' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}">
                                    งวดวันที่ 1
                                </button>
                                <button type="button" data-day-filter="16" class="px-3 py-1.5 rounded-lg transition ${this.selectedDayFilter === '16' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}">
                                    งวดวันที่ 16
                                </button>
                            </div>
                        </div>

                        <!-- Scope Preset Buttons -->
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">ช่วงย้อนหลัง:</span>
                            ${[
                                { label: '12 งวด (~6 เดือน)', limit: 12 },
                                { label: '24 งวด (~1 ปี)', limit: 24 },
                                { label: '48 งวด (~2 ปี)', limit: 48 },
                                { label: '72 งวด (~3 ปี)', limit: 72 },
                                { label: `ทั้งหมด (${allResults.length} งวด)`, limit: 9999 }
                            ].map(p => `
                                <button type="button" data-limit="${p.limit}" class="btn-limit-filter px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${this.selectedLimit === p.limit ? 'bg-[#FF385C] border-[#FF385C] text-white shadow-xs' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300'}">
                                    ${p.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Dataset Integrity & Metadata Banner -->
                    <div class="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">📋</span>
                            <div>
                                <span class="font-bold text-blue-900 dark:text-blue-200">ฐานข้อมูลที่ใช้วิเคราะห์:</span>
                                <span class="text-blue-700 dark:text-blue-300 ml-1">
                                    รวม ${meta.totalDraws} งวด (${meta.startDateFormatted || meta.startDate} ถึง ${meta.endDateFormatted || meta.endDate})
                                </span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            ${meta.missingCount > 0 ? `
                                <span class="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 rounded-lg font-medium">
                                    ⚠️ พบช่วงว่าง ${meta.missingCount} จุด (อาจเป็นงวดเลื่อนหรือสัญจร)
                                </span>
                            ` : `
                                <span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 rounded-lg font-medium">
                                    ✓ ลำดับงวดต่อเนื่องสมบูรณ์
                                </span>
                            `}
                        </div>
                    </div>

                    <!-- Statistics Navigation Tabs -->
                    <div class="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar gap-2 text-xs sm:text-sm font-semibold">
                        <button type="button" data-stats-tab="back2" class="px-3.5 py-2.5 rounded-t-xl border-b-2 transition whitespace-nowrap ${this.activeTab === 'back2' ? 'border-[#FF385C] text-[#FF385C]' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}">
                            🎯 เลขท้าย 2 ตัว (00 - 99)
                        </button>
                        <button type="button" data-stats-tab="compare1stTail" class="px-3.5 py-2.5 rounded-t-xl border-b-2 transition whitespace-nowrap ${this.activeTab === 'compare1stTail' ? 'border-[#FF385C] text-[#FF385C]' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}">
                            ⚖️ 2 ตัวท้าย รว.1 vs เลขท้าย 2 ตัว
                        </button>
                        <button type="button" data-stats-tab="digits" class="px-3.5 py-2.5 rounded-t-xl border-b-2 transition whitespace-nowrap ${this.activeTab === 'digits' ? 'border-[#FF385C] text-[#FF385C]' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}">
                            🔢 การกระจายเลข 0-9 รายหลัก
                        </button>
                        <button type="button" data-stats-tab="digits3" class="px-3.5 py-2.5 rounded-t-xl border-b-2 transition whitespace-nowrap ${this.activeTab === 'digits3' ? 'border-[#FF385C] text-[#FF385C]' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}">
                            🔺 เลขหน้า/ท้าย 3 ตัว
                        </button>
                    </div>

                    <!-- TAB CONTENT -->
                    <div class="tab-content">
                        ${this.renderTabContent(stats)}
                    </div>

                    <!-- Scientific Reality & Anti-Gambler's Fallacy Notice -->
                    <div class="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2">
                        <div class="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                            <span>💡</span> หลักคิดทางคณิตศาสตร์และข้อเท็จจริงทางสถิติ
                        </div>
                        <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            ${stats.disclaimer}
                        </p>
                        <div class="text-[11px] text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200/60 dark:border-gray-700/60 flex flex-wrap gap-4">
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
                    <div class="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <span>ℹ️</span>
                        <span>
                            <strong>ชี้แจงสำคัญ:</strong> สถิตินี้คือ <strong>รางวัลเลขท้าย 2 ตัว (รางวัลเฉพาะ)</strong> ที่หมุนวงล้อแยก ไม่ใช่เลขท้าย 2 ตัวที่ตัดมาจากรางวัลที่ 1
                        </span>
                    </div>

                    <!-- Sub-view switcher: Top 10 / Cold 10 / Full Grid -->
                    <div class="flex items-center justify-between flex-wrap gap-2">
                        <div class="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
                            <button type="button" data-b2-mode="top" class="px-3 py-1.5 rounded-lg transition ${this.back2ViewMode === 'top' ? 'bg-[#FF385C] text-white shadow-xs' : 'text-gray-600 dark:text-gray-300'}">
                                🔥 10 อันดับออกบ่อยสุด
                            </button>
                            <button type="button" data-b2-mode="cold" class="px-3 py-1.5 rounded-lg transition ${this.back2ViewMode === 'cold' ? 'bg-[#FF385C] text-white shadow-xs' : 'text-gray-600 dark:text-gray-300'}">
                                ❄️ 10 อันดับไม่ค่อยออก
                            </button>
                            <button type="button" data-b2-mode="grid" class="px-3 py-1.5 rounded-lg transition ${this.back2ViewMode === 'grid' ? 'bg-[#FF385C] text-white shadow-xs' : 'text-gray-600 dark:text-gray-300'}">
                                🔢 ตารางครบ 00 - 99
                            </button>
                        </div>
                    </div>

                    <!-- Top 10 View -->
                    ${this.back2ViewMode === 'top' ? `
                        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            ${b2.top10.map((item, idx) => {
                                const pct = totalDraws > 0 ? ((item.count / totalDraws) * 100).toFixed(1) : 0;
                                return `
                                    <div class="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col items-center justify-between text-center relative overflow-hidden">
                                        <div class="absolute top-1.5 left-2 text-[10px] font-bold text-gray-400">#${idx + 1}</div>
                                        <div class="font-lotto text-3xl font-extrabold text-[#FF385C] mt-2 mb-1">
                                            ${item.number}
                                        </div>
                                        <div class="text-xs font-bold text-gray-800 dark:text-gray-200">
                                            ออก ${item.count} ครั้ง
                                        </div>
                                        <div class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                            ความถี่ ${pct}%
                                        </div>
                                        <div class="text-[10px] text-gray-400 mt-1">
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
                                    <div class="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col items-center justify-between text-center relative overflow-hidden">
                                        <div class="absolute top-1.5 left-2 text-[10px] font-bold text-gray-400">#${idx + 1}</div>
                                        <div class="font-lotto text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2 mb-1">
                                            ${item.number}
                                        </div>
                                        <div class="text-xs font-bold text-gray-800 dark:text-gray-200">
                                            ออก ${item.count} ครั้ง
                                        </div>
                                        <div class="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                            ${item.count === 0 ? '❌ ไม่เคยออกในช่วงนี้' : `เว้นมาแล้ว ${item.drawsSinceLastSeen} งวด`}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}

                    <!-- Full 00-99 Grid View -->
                    ${this.back2ViewMode === 'grid' ? `
                        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div class="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">
                                ความถี่เลขท้าย 2 ตัว ครบทั้ง 100 หมายเลข (00 ถึง 99):
                            </div>
                            <div class="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                ${b2.allByNumber.map(item => {
                                    const intensity = item.count === 0 ? 'bg-gray-50 dark:bg-gray-750 text-gray-400' : (item.count >= 3 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 font-bold border border-rose-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200');
                                    return `
                                        <div class="p-2 rounded-xl text-center ${intensity} flex flex-col items-center justify-center" title="เลข ${item.number}: ออก ${item.count} ครั้ง">
                                            <span class="font-lotto text-base font-bold">${item.number}</span>
                                            <span class="text-[10px] opacity-75">${item.count} ครั้ง</span>
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
                    <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                        <div class="pb-3 border-b border-gray-100 dark:border-gray-700">
                            <h4 class="text-sm font-bold text-gray-900 dark:text-white">
                                เปรียบเทียบความแตกต่าง: "เลขท้าย 2 ตัว" vs "2 ตัวท้ายรางวัลที่ 1"
                            </h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                ในสลากกินแบ่งรัฐบาลไทย สองประเภทนี้คือคนละรางวัลกันอย่างสิ้นเชิง การวิเคราะห์จำเป็นต้องแยกชุดข้อมูลออกจากกัน
                            </p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Official 2-digit Prize -->
                            <div class="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-xs text-[#FF385C]">🎯 รางวัลเลขท้าย 2 ตัว (รางวัลเฉพาะ)</span>
                                    <span class="text-[10px] bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold">หมุนวงล้อเฉพาะ</span>
                                </div>
                                <div class="text-xs text-gray-600 dark:text-gray-400">
                                    5 อันดับที่ออกบ่อยที่สุดในช่วงนี้:
                                </div>
                                <div class="space-y-2">
                                    ${b2Top.map((item, idx) => `
                                        <div class="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-lg text-xs">
                                            <div class="flex items-center gap-2">
                                                <span class="font-bold text-gray-400">#${idx + 1}</span>
                                                <span class="font-lotto font-bold text-base text-[#FF385C]">${item.number}</span>
                                            </div>
                                            <span class="font-semibold text-gray-700 dark:text-gray-300">${item.count} ครั้ง</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- 1st Prize 2-digit Tail -->
                            <div class="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-xs text-purple-600 dark:text-purple-400">🏆 เลข 2 ตัวท้ายที่ตัดจากรางวัลที่ 1</span>
                                    <span class="text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">ตัดจาก 6 หลัก</span>
                                </div>
                                <div class="text-xs text-gray-600 dark:text-gray-400">
                                    5 อันดับที่ออกบ่อยที่สุดในช่วงนี้:
                                </div>
                                <div class="space-y-2">
                                    ${tail1stTop.map((item, idx) => `
                                        <div class="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-lg text-xs">
                                            <div class="flex items-center gap-2">
                                                <span class="font-bold text-gray-400">#${idx + 1}</span>
                                                <span class="font-lotto font-bold text-base text-purple-600 dark:text-purple-400">${item.number}</span>
                                            </div>
                                            <span class="font-semibold text-gray-700 dark:text-gray-300">${item.count} ครั้ง</span>
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
                    <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                        <div class="pb-3 border-b border-gray-100 dark:border-gray-700">
                            <h4 class="text-sm font-bold text-gray-900 dark:text-white">
                                การกระจายตัวเลข 0 ถึง 9 ในรางวัลที่ 1 (รายหลัก)
                            </h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                แสดงความถี่ที่ตัวเลขแต่ละตัว (0 - 9) ปรากฏในแต่ละตำแหน่งของรางวัลที่ 1 (${totalDraws} งวด)
                            </p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${positions.map(p => {
                                const maxCount = Math.max(...p.data, 1);
                                return `
                                    <div class="bg-gray-50 dark:bg-gray-750 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-2">
                                        <div class="text-xs font-bold text-gray-800 dark:text-gray-200">
                                            ${p.label}
                                        </div>
                                        <div class="space-y-1">
                                            ${p.data.map((count, digit) => {
                                                const pct = totalDraws > 0 ? ((count / totalDraws) * 100).toFixed(0) : 0;
                                                const barPct = Math.round((count / maxCount) * 100);
                                                return `
                                                    <div class="flex items-center gap-2 text-xs">
                                                        <span class="w-4 font-mono font-bold text-gray-700 dark:text-gray-300 text-center">${digit}</span>
                                                        <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                            <div class="h-2 rounded-full bg-[#FF385C]" style="width: ${barPct}%"></div>
                                                        </div>
                                                        <span class="w-12 text-right text-[11px] text-gray-500 dark:text-gray-400">${count} ครั้ง (${pct}%)</span>
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
                    <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                        <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                            <h4 class="text-xs font-bold text-blue-600 dark:text-blue-400">
                                🔹 เลขหน้า 3 ตัวที่ออกบ่อยสุด (Top 10)
                            </h4>
                            <span class="text-[10px] text-gray-400">งวดละ 2 รางวัล</span>
                        </div>
                        <div class="space-y-2">
                            ${stats.front3Top10.map((item, idx) => `
                                <div class="flex justify-between items-center bg-gray-50 dark:bg-gray-750 p-2.5 rounded-xl text-xs">
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold text-gray-400">#${idx + 1}</span>
                                        <span class="font-lotto font-bold text-base text-blue-600 dark:text-blue-400">${item.number}</span>
                                    </div>
                                    <span class="font-semibold text-gray-700 dark:text-gray-300">ออก ${item.count} ครั้ง</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Back 3 Digits Top 10 -->
                    <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                        <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                            <h4 class="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                🔹 เลขท้าย 3 ตัวที่ออกบ่อยสุด (Top 10)
                            </h4>
                            <span class="text-[10px] text-gray-400">งวดละ 2 รางวัล</span>
                        </div>
                        <div class="space-y-2">
                            ${stats.back3Top10.map((item, idx) => `
                                <div class="flex justify-between items-center bg-gray-50 dark:bg-gray-750 p-2.5 rounded-xl text-xs">
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold text-gray-400">#${idx + 1}</span>
                                        <span class="font-lotto font-bold text-base text-indigo-600 dark:text-indigo-400">${item.number}</span>
                                    </div>
                                    <span class="font-semibold text-gray-700 dark:text-gray-300">ออก ${item.count} ครั้ง</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        },

        bindEvents(container) {
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
