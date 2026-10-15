/**
 * lotto_book - Historical Statistics Engine
 * Analyzes Thai GLO past results with mathematical objectivity and transparency.
 * 
 * Key Principles:
 * 1. String preservation for all numbers ('00' to '99', '000' to '999').
 * 2. Strict separation of "Official 2-digit Prize (เลขท้าย 2 ตัว)" vs "Last 2 digits of 1st Prize (เลข 2 ตัวท้ายรางวัลที่ 1)".
 * 3. Clear dataset metadata: Date range, total draws, and any missing draws in sequence.
 * 4. Anti-Gambler's Fallacy: Emphasizes that past frequency does NOT influence future draw probability (Independent Events).
 */

(function(root) {
    'use strict';

    const Stats = {
        /**
         * Filters draw records based on scope and options.
         * 
         * @param {Array} drawRecords - Sorted descending by drawDate
         * @param {Object} options - { limit: number, dayFilter: 'all' | '1' | '16' }
         */
        filterRecords(drawRecords, options = {}) {
            if (!Array.isArray(drawRecords)) return [];
            let list = [...drawRecords];

            // Filter by day of month if specified
            if (options.dayFilter === '1') {
                list = list.filter(r => {
                    const day = parseInt(r.drawDate.split('-')[2], 10);
                    return day <= 3; // Accounts for holiday shifts (1st, 2nd, 3rd)
                });
            } else if (options.dayFilter === '16') {
                list = list.filter(r => {
                    const day = parseInt(r.drawDate.split('-')[2], 10);
                    return day >= 15 && day <= 18; // Accounts for 16th, 17th
                });
            }

            // Apply limit (e.g. 12, 24, 48, 72, or all)
            if (options.limit && options.limit > 0 && options.limit < list.length) {
                list = list.slice(0, options.limit);
            }

            return list;
        },

        /**
         * Detects potential missing draws between the oldest and newest draw in the list.
         */
        detectMissingDraws(drawRecords) {
            if (!drawRecords || drawRecords.length < 2) return [];
            // In Thailand, draws normally happen ~24 times a year (around 1st and 16th).
            // We sort ascending to find large gaps
            const sorted = [...drawRecords].sort((a, b) => a.drawDate.localeCompare(b.drawDate));
            const missing = [];

            for (let i = 0; i < sorted.length - 1; i++) {
                const d1 = new Date(sorted[i].drawDate);
                const d2 = new Date(sorted[i + 1].drawDate);
                const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
                // If gap between consecutive draws is > 25 days, there might be a missing draw
                if (diffDays > 25) {
                    missing.push({
                        from: sorted[i].drawDate,
                        to: sorted[i + 1].drawDate,
                        gapDays: diffDays,
                        description: `ช่วงว่างระหว่าง ${sorted[i].drawDate} ถึง ${sorted[i + 1].drawDate} (${diffDays} วัน)`
                    });
                }
            }

            return missing;
        },

        /**
         * Computes full statistical report on the given records.
         */
        computeStats(drawRecords) {
            if (!Array.isArray(drawRecords) || drawRecords.length === 0) {
                return {
                    metadata: { totalDraws: 0, startDate: null, endDate: null, missingDraws: [] },
                    back2Stats: {},
                    firstTail2Stats: {},
                    digitDistribution1st: {},
                    digitDistributionBack2: {},
                    front3Stats: {},
                    back3Stats: {}
                };
            }

            const totalDraws = drawRecords.length;
            const newest = drawRecords[0];
            const oldest = drawRecords[drawRecords.length - 1];
            const missingDraws = this.detectMissingDraws(drawRecords);

            // 1. Initialize Frequency Map for '00' to '99'
            const back2Freq = {};
            const firstTail2Freq = {};
            for (let i = 0; i < 100; i++) {
                const str = String(i).padStart(2, '0');
                back2Freq[str] = { number: str, count: 0, lastSeenDraw: null, drawsSinceLastSeen: 0, drawDates: [] };
                firstTail2Freq[str] = { number: str, count: 0, lastSeenDraw: null, drawsSinceLastSeen: 0, drawDates: [] };
            }

            // 2. Initialize Digit Distribution (0 to 9)
            // Position 0..5 for 1st Prize (แสน, หมื่น, พัน, ร้อย, สิบ, หน่วย)
            const digitDist1st = {
                pos0_hundredK: Array(10).fill(0),
                pos1_tenK: Array(10).fill(0),
                pos2_thousand: Array(10).fill(0),
                pos3_hundred: Array(10).fill(0),
                pos4_ten: Array(10).fill(0),
                pos5_unit: Array(10).fill(0)
            };

            // Digit Distribution for 2-digit Prize (สิบ, หน่วย)
            const digitDistBack2 = {
                pos0_ten: Array(10).fill(0),
                pos1_unit: Array(10).fill(0)
            };

            // 3-digit frequency maps
            const front3Freq = {};
            const back3Freq = {};

            // Loop through each draw record
            drawRecords.forEach((record, drawIndex) => {
                const prizes = record.prizes || {};

                // A. Official 2-digit Prize (รางวัลเลขท้าย 2 ตัว)
                if (prizes.back2 !== undefined && prizes.back2 !== null && prizes.back2 !== '') {
                    const b2 = String(prizes.back2).padStart(2, '0');
                    if (back2Freq[b2]) {
                        back2Freq[b2].count++;
                        back2Freq[b2].drawDates.push(record.drawDate);
                        if (!back2Freq[b2].lastSeenDraw) {
                            back2Freq[b2].lastSeenDraw = record.drawDate;
                            back2Freq[b2].drawsSinceLastSeen = drawIndex;
                        }
                    }

                    // Digit distribution for back2
                    const dTen = parseInt(b2[0], 10);
                    const dUnit = parseInt(b2[1], 10);
                    if (!isNaN(dTen)) digitDistBack2.pos0_ten[dTen]++;
                    if (!isNaN(dUnit)) digitDistBack2.pos1_unit[dUnit]++;
                }

                // B. First Prize & Last 2 Digits of First Prize (2 ตัวท้ายรางวัลที่ 1)
                if (prizes.first && String(prizes.first).length === 6) {
                    const p1 = String(prizes.first);
                    const tail2 = p1.slice(4);
                    if (firstTail2Freq[tail2]) {
                        firstTail2Freq[tail2].count++;
                        firstTail2Freq[tail2].drawDates.push(record.drawDate);
                        if (!firstTail2Freq[tail2].lastSeenDraw) {
                            firstTail2Freq[tail2].lastSeenDraw = record.drawDate;
                            firstTail2Freq[tail2].drawsSinceLastSeen = drawIndex;
                        }
                    }

                    // Digit distribution for 1st Prize
                    for (let pos = 0; pos < 6; pos++) {
                        const digit = parseInt(p1[pos], 10);
                        if (!isNaN(digit)) {
                            if (pos === 0) digitDist1st.pos0_hundredK[digit]++;
                            else if (pos === 1) digitDist1st.pos1_tenK[digit]++;
                            else if (pos === 2) digitDist1st.pos2_thousand[digit]++;
                            else if (pos === 3) digitDist1st.pos3_hundred[digit]++;
                            else if (pos === 4) digitDist1st.pos4_ten[digit]++;
                            else if (pos === 5) digitDist1st.pos5_unit[digit]++;
                        }
                    }
                }

                // C. Front 3 Digits
                if (Array.isArray(prizes.front3)) {
                    prizes.front3.forEach(f3 => {
                        const str = String(f3).padStart(3, '0');
                        if (!front3Freq[str]) front3Freq[str] = { number: str, count: 0, drawDates: [] };
                        front3Freq[str].count++;
                        front3Freq[str].drawDates.push(record.drawDate);
                    });
                }

                // D. Back 3 Digits
                if (Array.isArray(prizes.back3)) {
                    prizes.back3.forEach(b3 => {
                        const str = String(b3).padStart(3, '0');
                        if (!back3Freq[str]) back3Freq[str] = { number: str, count: 0, drawDates: [] };
                        back3Freq[str].count++;
                        back3Freq[str].drawDates.push(record.drawDate);
                    });
                }
            });

            // Mark drawsSinceLastSeen for numbers never seen in period
            for (let i = 0; i < 100; i++) {
                const str = String(i).padStart(2, '0');
                if (back2Freq[str].count === 0) {
                    back2Freq[str].drawsSinceLastSeen = totalDraws;
                }
                if (firstTail2Freq[str].count === 0) {
                    firstTail2Freq[str].drawsSinceLastSeen = totalDraws;
                }
            }

            // Prepare Top Lists
            const back2List = Object.values(back2Freq);
            const back2SortedByFreq = [...back2List].sort((a, b) => b.count - a.count || a.number.localeCompare(b.number));
            const back2SortedByNumber = [...back2List].sort((a, b) => a.number.localeCompare(b.number));
            const back2Top10 = back2SortedByFreq.slice(0, 10);
            const back2Cold10 = [...back2List].sort((a, b) => a.count - b.count || b.drawsSinceLastSeen - a.drawsSinceLastSeen).slice(0, 10);

            const firstTail2List = Object.values(firstTail2Freq);
            const firstTail2SortedByFreq = [...firstTail2List].sort((a, b) => b.count - a.count || a.number.localeCompare(b.number));
            const firstTail2Top10 = firstTail2SortedByFreq.slice(0, 10);

            const front3Top10 = Object.values(front3Freq).sort((a, b) => b.count - a.count).slice(0, 10);
            const back3Top10 = Object.values(back3Freq).sort((a, b) => b.count - a.count).slice(0, 10);

            return {
                metadata: {
                    totalDraws,
                    startDate: oldest.drawDate,
                    startDateFormatted: oldest.dateFormatted,
                    endDate: newest.drawDate,
                    endDateFormatted: newest.dateFormatted,
                    missingDraws,
                    missingCount: missingDraws.length
                },
                back2: {
                    allByNumber: back2SortedByNumber,
                    allByFreq: back2SortedByFreq,
                    top10: back2Top10,
                    cold10: back2Cold10
                },
                firstTail2: {
                    allByNumber: firstTail2List.sort((a, b) => a.number.localeCompare(b.number)),
                    allByFreq: firstTail2SortedByFreq,
                    top10: firstTail2Top10
                },
                digitDistribution1st: digitDist1st,
                digitDistributionBack2: digitDistBack2,
                front3Top10,
                back3Top10,
                disclaimer: 'หมายเหตุทางสถิติ: ข้อมูลข้างต้นเป็นการสรุปผลที่เกิดขึ้นจริงในอดีตเพื่อประโยชน์ในการศึกษา การออกรางวัลแต่ละงวดเป็นอิสระต่อกัน (Independent Event) ตามหลักทฤษฎีความน่าจะเป็น เลขที่ออกบ่อยหรือเว้นช่วงนานไม่ได้เพิ่มหรือลดโอกาสในการออกรางวัลในงวดถัดไปแต่อย่างใด'
            };
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Stats;
    } else {
        root.LottoStats = Stats;
    }
})(typeof window !== 'undefined' ? window : global);
