/**
 * lotto_book - Lottery Checking Engine
 * Accurately checks lottery tickets against official GLO prize results.
 * 
 * Distinctly tracks 4 evaluation statuses:
 * - 'upcoming': Draw date is in the future.
 * - 'no_data': Draw date has passed but results are not present in dataset. (Never shows as 'lost'!)
 * - 'won': Ticket matched one or more prize tiers.
 * - 'lost': Ticket matched 0 prize tiers after verification against official results.
 * 
 * Strict String preservation ensures leading zeros ('007', '09') are maintained.
 */

(function(root) {
    'use strict';

    // Standard GLO Prize definitions (Prize amount per 1 ticket)
    const PRIZE_DEFINITIONS = {
        first: { name: 'รางวัลที่ 1', reward: 6000000, priority: 1 },
        nearFirst: { name: 'รางวัลข้างเคียงรางวัลที่ 1', reward: 100000, priority: 2 },
        second: { name: 'รางวัลที่ 2', reward: 200000, priority: 3 },
        third: { name: 'รางวัลที่ 3', reward: 80000, priority: 4 },
        fourth: { name: 'รางวัลที่ 4', reward: 40000, priority: 5 },
        fifth: { name: 'รางวัลที่ 5', reward: 20000, priority: 6 },
        front3: { name: 'รางวัลเลขหน้า 3 ตัว', reward: 4000, priority: 7 },
        back3: { name: 'รางวัลเลขท้าย 3 ตัว', reward: 4000, priority: 8 },
        back2: { name: 'รางวัลเลขท้าย 2 ตัว', reward: 2000, priority: 9 }
    };

    const Checker = {
        PRIZE_DEFINITIONS,

        /**
         * Checks a single ticket against a draw result.
         * 
         * @param {Object} ticket - { number: string, count: number, costPerUnit: number, totalCost: number, drawDate: string, type: string }
         * @param {Object|null} drawResult - Result object from GLO database for this drawDate
         * @param {string} [referenceDate] - ISO YYYY-MM-DD date to compare for upcoming status (defaults to today)
         */
        checkTicket(ticket, drawResult, referenceDate) {
            if (!ticket || !ticket.number) {
                return {
                    status: 'invalid',
                    statusText: 'ข้อมูลสลากไม่ถูกต้อง',
                    prizesWon: [],
                    totalPrize: 0,
                    netGainLoss: 0
                };
            }

            const today = referenceDate || new Date().toISOString().slice(0, 10);
            const drawDate = ticket.drawDate || '';
            const ticketNumber = String(ticket.number).trim();
            const count = Number(ticket.count) || 1;
            const totalCost = Number(ticket.totalCost) || (count * (Number(ticket.costPerUnit) || 80));

            // Status 1: UPCOMING (งวดในอนาคต ยังไม่ออกรางวัล)
            if (drawDate > today) {
                return {
                    ticketId: ticket.id,
                    ticketNumber,
                    drawDate,
                    count,
                    totalCost,
                    status: 'upcoming',
                    statusBadge: '⏳ ยังไม่ออกรางวัล',
                    statusText: 'งวดนี้ยังไม่ออกรางวัล (รอการออกรางวัลตามกำหนด)',
                    prizesWon: [],
                    totalPrize: 0,
                    netGainLoss: -totalCost,
                    isEvaluated: false
                };
            }

            // Status 2: NO DATA (ถึงกำหนดออกแล้ว แต่ยังไม่มีฐานข้อมูลผลรางวัล)
            if (!drawResult || !drawResult.prizes || !drawResult.prizes.first) {
                return {
                    ticketId: ticket.id,
                    ticketNumber,
                    drawDate,
                    count,
                    totalCost,
                    status: 'no_data',
                    statusBadge: '⚠️ ยังไม่มีข้อมูลผลรางวัล',
                    statusText: 'ยังไม่มีผลรางวัลของงวดนี้ในฐานข้อมูล (ห้ามตัดสินว่าไม่ถูกรางวัล)',
                    prizesWon: [],
                    totalPrize: 0,
                    netGainLoss: 0,
                    isEvaluated: false
                };
            }

            // Status 3 or 4: EVALUATE MATCHES
            const prizes = drawResult.prizes;
            const prizesWon = [];
            const type = ticket.type || (ticketNumber.length === 6 ? 'standard' : ticketNumber.length === 3 ? 'digit3' : 'digit2');

            // 1. Check 6-digit Standard Ticket
            if (type === 'standard' || ticketNumber.length === 6) {
                const paddedNum = ticketNumber.padStart(6, '0');

                // รางวัลที่ 1
                if (prizes.first && paddedNum === prizes.first) {
                    prizesWon.push({
                        code: 'first',
                        name: PRIZE_DEFINITIONS.first.name,
                        rewardPerUnit: PRIZE_DEFINITIONS.first.reward,
                        totalReward: PRIZE_DEFINITIONS.first.reward * count,
                        matchedNumber: paddedNum
                    });
                }

                // ข้างเคียงรางวัลที่ 1
                if (Array.isArray(prizes.nearFirst) && prizes.nearFirst.includes(paddedNum)) {
                    prizesWon.push({
                        code: 'nearFirst',
                        name: PRIZE_DEFINITIONS.nearFirst.name,
                        rewardPerUnit: PRIZE_DEFINITIONS.nearFirst.reward,
                        totalReward: PRIZE_DEFINITIONS.nearFirst.reward * count,
                        matchedNumber: paddedNum
                    });
                }

                // รางวัลที่ 2
                if (Array.isArray(prizes.second) && prizes.second.includes(paddedNum)) {
                    prizesWon.push({
                        code: 'second',
                        name: PRIZE_DEFINITIONS.second.name,
                        rewardPerUnit: PRIZE_DEFINITIONS.second.reward,
                        totalReward: PRIZE_DEFINITIONS.second.reward * count,
                        matchedNumber: paddedNum
                    });
                }

                // รางวัลที่ 3
                if (Array.isArray(prizes.third) && prizes.third.includes(paddedNum)) {
                    prizesWon.push({
                        code: 'third',
                        name: PRIZE_DEFINITIONS.third.name,
                        rewardPerUnit: PRIZE_DEFINITIONS.third.reward,
                        totalReward: PRIZE_DEFINITIONS.third.reward * count,
                        matchedNumber: paddedNum
                    });
                }

                // รางวัลที่ 4
                if (Array.isArray(prizes.fourth) && prizes.fourth.includes(paddedNum)) {
                    prizesWon.push({
                        code: 'fourth',
                        name: PRIZE_DEFINITIONS.fourth.name,
                        rewardPerUnit: PRIZE_DEFINITIONS.fourth.reward,
                        totalReward: PRIZE_DEFINITIONS.fourth.reward * count,
                        matchedNumber: paddedNum
                    });
                }

                // รางวัลที่ 5
                if (Array.isArray(prizes.fifth) && prizes.fifth.includes(paddedNum)) {
                    prizesWon.push({
                        code: 'fifth',
                        name: PRIZE_DEFINITIONS.fifth.name,
                        rewardPerUnit: PRIZE_DEFINITIONS.fifth.reward,
                        totalReward: PRIZE_DEFINITIONS.fifth.reward * count,
                        matchedNumber: paddedNum
                    });
                }

                // เลขหน้า 3 ตัว (front3)
                const front3 = paddedNum.slice(0, 3);
                if (Array.isArray(prizes.front3)) {
                    const matchCount = prizes.front3.filter(x => x === front3).length;
                    for (let i = 0; i < matchCount; i++) {
                        prizesWon.push({
                            code: 'front3',
                            name: PRIZE_DEFINITIONS.front3.name,
                            rewardPerUnit: PRIZE_DEFINITIONS.front3.reward,
                            totalReward: PRIZE_DEFINITIONS.front3.reward * count,
                            matchedNumber: front3
                        });
                    }
                }

                // เลขท้าย 3 ตัว (back3)
                const back3 = paddedNum.slice(3);
                if (Array.isArray(prizes.back3)) {
                    const matchCount = prizes.back3.filter(x => x === back3).length;
                    for (let i = 0; i < matchCount; i++) {
                        prizesWon.push({
                            code: 'back3',
                            name: PRIZE_DEFINITIONS.back3.name,
                            rewardPerUnit: PRIZE_DEFINITIONS.back3.reward,
                            totalReward: PRIZE_DEFINITIONS.back3.reward * count,
                            matchedNumber: back3
                        });
                    }
                }

                // เลขท้าย 2 ตัว (back2)
                const back2 = paddedNum.slice(4);
                if (prizes.back2 && back2 === String(prizes.back2).padStart(2, '0')) {
                    prizesWon.push({
                        code: 'back2',
                        name: PRIZE_DEFINITIONS.back2.name,
                        rewardPerUnit: PRIZE_DEFINITIONS.back2.reward,
                        totalReward: PRIZE_DEFINITIONS.back2.reward * count,
                        matchedNumber: back2
                    });
                }
            } 
            // 2. Check 3-digit Ticket
            else if (type === 'digit3' || ticketNumber.length === 3) {
                const padded3 = ticketNumber.padStart(3, '0');
                if (Array.isArray(prizes.back3) && prizes.back3.includes(padded3)) {
                    prizesWon.push({
                        code: 'back3',
                        name: 'เลขท้าย 3 ตัว',
                        rewardPerUnit: PRIZE_DEFINITIONS.back3.reward,
                        totalReward: PRIZE_DEFINITIONS.back3.reward * count,
                        matchedNumber: padded3
                    });
                }
                if (Array.isArray(prizes.front3) && prizes.front3.includes(padded3)) {
                    prizesWon.push({
                        code: 'front3',
                        name: 'เลขหน้า 3 ตัว',
                        rewardPerUnit: PRIZE_DEFINITIONS.front3.reward,
                        totalReward: PRIZE_DEFINITIONS.front3.reward * count,
                        matchedNumber: padded3
                    });
                }
            } 
            // 3. Check 2-digit Ticket
            else if (type === 'digit2' || ticketNumber.length === 2) {
                const padded2 = ticketNumber.padStart(2, '0');
                if (prizes.back2 && padded2 === String(prizes.back2).padStart(2, '0')) {
                    prizesWon.push({
                        code: 'back2',
                        name: 'เลขท้าย 2 ตัว',
                        rewardPerUnit: PRIZE_DEFINITIONS.back2.reward,
                        totalReward: PRIZE_DEFINITIONS.back2.reward * count,
                        matchedNumber: padded2
                    });
                }
            }

            // Informational: 2 digits matching last 2 digits of First Prize (distinct from back2)
            let matchesFirstPrizeTail = false;
            let firstPrizeTail = '';
            if (prizes.first && prizes.first.length === 6) {
                firstPrizeTail = prizes.first.slice(4);
                const ticketTail = ticketNumber.length >= 2 ? ticketNumber.slice(-2) : '';
                if (ticketTail === firstPrizeTail) {
                    matchesFirstPrizeTail = true;
                }
            }

            const totalPrize = prizesWon.reduce((sum, p) => sum + p.totalReward, 0);
            const isWon = prizesWon.length > 0;
            const netGainLoss = totalPrize - totalCost;

            return {
                ticketId: ticket.id,
                ticketNumber,
                drawDate,
                count,
                totalCost,
                status: isWon ? 'won' : 'lost',
                statusBadge: isWon ? '🎉 ถูกรางวัล' : '❌ ไม่ถูกรางวัล',
                statusText: isWon 
                    ? `ถูก ${prizesWon.map(p => p.name).join(', ')} รวม ${totalPrize.toLocaleString()} บาท`
                    : 'ไม่ตรงกับรางวัลใดๆ ในงวดนี้',
                prizesWon,
                totalPrize,
                netGainLoss,
                isEvaluated: true,
                matchesFirstPrizeTail,
                firstPrizeTail
            };
        },

        /**
         * Checks multiple tickets against available draw results.
         */
        checkAllTickets(tickets, resultsMap, referenceDate) {
            if (!Array.isArray(tickets)) return [];
            return tickets.map(ticket => {
                const result = resultsMap ? resultsMap[ticket.drawDate] : null;
                return this.checkTicket(ticket, result, referenceDate);
            });
        },

        /**
         * Summarizes checking results for a set of tickets.
         */
        summarizeCheckResults(evaluatedList) {
            let totalSpent = 0;
            let totalPrizeWon = 0;
            let wonCount = 0;
            let lostCount = 0;
            let upcomingCount = 0;
            let noDataCount = 0;

            evaluatedList.forEach(item => {
                totalSpent += item.totalCost || 0;
                if (item.status === 'won') {
                    wonCount++;
                    totalPrizeWon += item.totalPrize || 0;
                } else if (item.status === 'lost') {
                    lostCount++;
                } else if (item.status === 'upcoming') {
                    upcomingCount++;
                } else if (item.status === 'no_data') {
                    noDataCount++;
                }
            });

            const netProfitLoss = totalPrizeWon - totalSpent;
            const roiPercent = totalSpent > 0 ? ((netProfitLoss / totalSpent) * 100) : 0;

            return {
                totalTickets: evaluatedList.length,
                totalSpent,
                totalPrizeWon,
                netProfitLoss,
                roiPercent,
                wonCount,
                lostCount,
                upcomingCount,
                noDataCount
            };
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Checker;
    } else {
        root.LottoChecker = Checker;
    }
})(typeof window !== 'undefined' ? window : global);
