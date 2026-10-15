// ==============================================================
// Multitools Calculator - Thai Lottery & GLO Core Engine
// ==============================================================

(function(root) {
    /**
     * Permutes a 3-digit string into all unique permutations (6 ประตู / 3 ตัวกลับ)
     * e.g. '789' -> ['789', '798', '879', '897', '978', '987'] (6 items)
     *      '787' -> ['778', '787', '877'] (3 items)
     *      '777' -> ['777'] (1 item)
     * @param {string} digitsStr
     * @returns {string[]} sorted array of unique 3-digit strings
     */
    function expand6Doors(digitsStr) {
        const clean = String(digitsStr || '').replace(/\D/g, '').slice(0, 3);
        if (clean.length < 3) return clean ? [clean] : [];

        const chars = clean.split('');
        const results = new Set();

        function permute(arr, m = []) {
            if (arr.length === 0) {
                results.add(m.join(''));
            } else {
                for (let i = 0; i < arr.length; i++) {
                    const curr = arr.slice();
                    const next = curr.splice(i, 1);
                    permute(curr, m.concat(next));
                }
            }
        }
        permute(chars);
        return Array.from(results).sort();
    }

    /**
     * Expands a single digit into 19 numbers (19 ประตู / รูด 1 ตัว)
     * Returns all 2-digit numbers containing this digit in either tens or units place.
     * @param {string|number} digit
     * @returns {string[]} 19 two-digit strings
     */
    function expand19Doors(digit) {
        const d = String(digit).replace(/\D/g, '').slice(-1);
        if (d === '') return [];
        const set = new Set();
        // Tens place: d0 to d9
        for (let i = 0; i <= 9; i++) {
            set.add(`${d}${i}`);
        }
        // Units place: 0d to 9d
        for (let i = 0; i <= 9; i++) {
            set.add(`${i}${d}`);
        }
        return Array.from(set).sort();
    }

    /**
     * Expands front-run (รูดหน้า / หลักสิบ) for a single digit: d0 to d9
     * @param {string|number} digit
     * @returns {string[]} 10 two-digit strings
     */
    function expandFrontRun(digit) {
        const d = String(digit).replace(/\D/g, '').slice(-1);
        if (d === '') return [];
        const res = [];
        for (let i = 0; i <= 9; i++) {
            res.push(`${d}${i}`);
        }
        return res;
    }

    /**
     * Expands back-run (รูดหลัง / หลักหน่วย) for a single digit: 0d to 9d
     * @param {string|number} digit
     * @returns {string[]} 10 two-digit strings
     */
    function expandBackRun(digit) {
        const d = String(digit).replace(/\D/g, '').slice(-1);
        if (d === '') return [];
        const res = [];
        for (let i = 0; i <= 9; i++) {
            res.push(`${i}${d}`);
        }
        return res;
    }

    /**
     * Returns all 10 two-digit double numbers (เลขเบิ้ล 00, 11, ..., 99)
     * @returns {string[]}
     */
    function expandDoubleNumbers() {
        const res = [];
        for (let i = 0; i <= 9; i++) {
            res.push(`${i}${i}`);
        }
        return res;
    }

    /**
     * Expands a 2-digit number with its reverse (2 ตัวกลับ เช่น '28' -> ['28', '82'])
     * @param {string} digitsStr
     * @returns {string[]}
     */
    function expandTwoDigitReverse(digitsStr) {
        const clean = String(digitsStr || '').replace(/\D/g, '').slice(0, 2);
        if (clean.length < 2) return clean ? [clean] : [];
        const rev = clean[1] + clean[0];
        return clean === rev ? [clean] : [clean, rev].sort();
    }

    /**
     * Calculates bet costs, payout, and net profit
     * @param {string[]|number} numbersListOrCount 
     * @param {number} pricePerNumber 
     * @param {number} payoutRate 
     * @returns {Object}
     */
    function calculateLottoBet(numbersListOrCount, pricePerNumber, payoutRate) {
        const count = Array.isArray(numbersListOrCount) ? numbersListOrCount.length : Math.max(0, parseInt(numbersListOrCount, 10) || 0);
        const price = Math.max(0, parseFloat(pricePerNumber) || 0);
        const rate = Math.max(0, parseFloat(payoutRate) || 0);

        const totalCost = count * price;
        const winningPayout = price * rate;
        const netProfit = count > 0 && price > 0 ? winningPayout - totalCost : 0;
        const roiPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

        return {
            count,
            pricePerNumber: price,
            payoutRate: rate,
            totalCost,
            winningPayout,
            netProfit,
            roiPercent
        };
    }

    /**
     * GLO Prize Definitions (สำนักงานสลากกินแบ่งรัฐบาล)
     */
    const GLO_PRIZES = {
        first:     { key: 'first',     label: 'รางวัลที่ 1',              amount: 6000000, desc: '6,000,000 บาท / ใบ', defaultCount: 1 },
        adjacent:  { key: 'adjacent',  label: 'ข้างเคียงรางวัลที่ 1',       amount: 100000,  desc: '100,000 บาท / ใบ',   defaultCount: 2 },
        second:    { key: 'second',    label: 'รางวัลที่ 2',              amount: 200000,  desc: '200,000 บาท / ใบ',   defaultCount: 5 },
        third:     { key: 'third',     label: 'รางวัลที่ 3',              amount: 80000,   desc: '80,000 บาท / ใบ',    defaultCount: 10 },
        fourth:    { key: 'fourth',    label: 'รางวัลที่ 4',              amount: 40000,   desc: '40,000 บาท / ใบ',    defaultCount: 50 },
        fifth:     { key: 'fifth',     label: 'รางวัลที่ 5',              amount: 20000,   desc: '20,000 บาท / ใบ',    defaultCount: 100 },
        front3:    { key: 'front3',    label: 'รางวัลเลขหน้า 3 ตัว (2 รางวัล)', amount: 4000,    desc: '4,000 บาท / ใบ',     defaultCount: 2000 },
        back3:     { key: 'back3',     label: 'รางวัลเลขท้าย 3 ตัว (2 รางวัล)', amount: 4000,    desc: '4,000 บาท / ใบ',     defaultCount: 2000 },
        back2:     { key: 'back2',     label: 'รางวัลเลขท้าย 2 ตัว (1 รางวัล)', amount: 2000,    desc: '2,000 บาท / ใบ',     defaultCount: 10000 }
    };

    /**
     * Claim channels and deductions
     */
    const CLAIM_CHANNELS = {
        glo_regular: { key: 'glo_regular', label: 'สำนักงานสลากฯ (สลากทั่วไป)', rate: 0.5, feeNote: 'หักค่าอากรแสตมป์ 0.5% (ได้รับการยกเว้นภาษีเงินได้บุคคลธรรมดา)' },
        glo_charity: { key: 'glo_charity', label: 'สำนักงานสลากฯ (สลากการกุศล)', rate: 1.0, feeNote: 'หักภาษีเงินได้ ณ ที่จ่าย 1.0% (ไม่ต้องนำไปคำนวณภาษีสิ้นปี)' },
        bank:        { key: 'bank',        label: 'ธนาคารรัฐ/พาณิชย์ (กรุงไทย/ออมสิน/ธ.ก.ส.)', rate: 1.5, feeNote: 'หักค่าธรรมเนียมธนาคาร 1.0% + อากรแสตมป์ 0.5% = รวม 1.5%' },
        shop:        { key: 'shop',        label: 'แผงรับซื้อรางวัลเอกชน', rate: 2.0, feeNote: 'หักค่าบริการร้านรับซื้อตามตกลง (ปกติ 2.0% - 3.0%)' }
    };

    /**
     * Calculates ticket prize claims with deduction and net money
     * @param {string} prizeKey 
     * @param {number|string} ticketCount 
     * @param {string} channelKey 
     * @param {number|string} customDeductionRate 
     * @returns {Object}
     */
    function calculatePrizeClaim(prizeKey, ticketCount, channelKey = 'bank', customDeductionRate = 0) {
        const prizeInfo = GLO_PRIZES[prizeKey] || GLO_PRIZES.back2;
        const count = Math.max(1, parseInt(ticketCount, 10) || 1);
        const channel = CLAIM_CHANNELS[channelKey] || CLAIM_CHANNELS.bank;

        let rate = channel.rate;
        if (channelKey === 'shop' && customDeductionRate !== undefined && customDeductionRate !== '') {
            const customRate = parseFloat(customDeductionRate);
            if (Number.isFinite(customRate) && customRate >= 0) {
                rate = customRate;
            }
        }

        const unitPrize = prizeInfo.amount;
        const totalGrossPrize = unitPrize * count;
        const deductionAmount = Math.round((totalGrossPrize * (rate / 100)) * 100) / 100;
        const netPrize = totalGrossPrize - deductionAmount;

        return {
            prizeKey: prizeInfo.key,
            prizeLabel: prizeInfo.label,
            unitPrize,
            ticketCount: count,
            totalGrossPrize,
            channelKey: channel.key,
            channelLabel: channel.label,
            deductionRate: rate,
            deductionAmount,
            netPrize,
            feeNote: channel.feeNote
        };
    }

    /**
     * Returns statistical probabilities and expected value for Thai GLO tickets
     * @param {number|string} ticketCost - actual purchase price (default 80 or 100)
     * @returns {Object}
     */
    function calculateLottoStats(ticketCost = 80) {
        const cost = Math.max(1, parseFloat(ticketCost) || 80);
        const totalTickets = 1000000;
        const totalPrizeMoney = 48000000; // 48 million baht per series of 1M tickets
        const expectedValue = totalPrizeMoney / totalTickets; // 48 baht

        const totalWinningTickets = 14168; // 1 + 2 + 5 + 10 + 50 + 100 + 2000 + 2000 + 10000
        const winChancePercent = (totalWinningTickets / totalTickets) * 100; // 1.4168%
        const loseChancePercent = 100 - winChancePercent; // 98.5832%

        const netExpectedLoss = cost - expectedValue;
        const houseEdgePercent = (netExpectedLoss / cost) * 100;

        return {
            totalTickets,
            totalPrizeMoney,
            expectedValue,
            ticketCost: cost,
            totalWinningTickets,
            winChancePercent,
            loseChancePercent,
            netExpectedLoss,
            houseEdgePercent,
            prizes: [
                { name: 'รางวัลที่ 1 (6,000,000 บ.)', chance: '1 ใน 1,000,000', pct: 0.0001 },
                { name: 'ข้างเคียงรางวัลที่ 1 (100,000 บ.)', chance: '2 ใน 1,000,000', pct: 0.0002 },
                { name: 'รางวัลที่ 2 (200,000 บ.)', chance: '5 ใน 1,000,000', pct: 0.0005 },
                { name: 'รางวัลที่ 3 (80,000 บ.)', chance: '10 ใน 1,000,000', pct: 0.0010 },
                { name: 'รางวัลที่ 4 (40,000 บ.)', chance: '50 ใน 1,000,000', pct: 0.0050 },
                { name: 'รางวัลที่ 5 (20,000 บ.)', chance: '100 ใน 1,000,000', pct: 0.0100 },
                { name: 'เลขหน้า 3 ตัว (4,000 บ.)', chance: '2 ใน 1,000', pct: 0.2000 },
                { name: 'เลขท้าย 3 ตัว (4,000 บ.)', chance: '2 ใน 1,000', pct: 0.2000 },
                { name: 'เลขท้าย 2 ตัว (2,000 บ.)', chance: '1 ใน 100', pct: 1.0000 }
            ]
        };
    }

    /**
     * Calculates "Lotto to Wealth" compound savings simulation
     * (2 draws per month = 24 draws/year)
     * @param {number|string} spendPerDraw 
     * @param {number|string} years 
     * @param {number|string} annualReturnPct 
     * @returns {Object}
     */
    function calculateLottoSavingsSimulation(spendPerDraw, years = 10, annualReturnPct = 7) {
        const spend = Math.max(0, parseFloat(spendPerDraw) || 0);
        const y = Math.max(1, parseInt(years, 10) || 10);
        const r = Math.max(0, parseFloat(annualReturnPct) || 0) / 100;

        const monthlyDeposit = spend * 2; // 2 draws per month
        const totalMonths = y * 12;
        const totalPrincipal = monthlyDeposit * totalMonths;

        let futureValue = 0;
        const monthlyRate = r / 12;

        if (monthlyRate === 0) {
            futureValue = totalPrincipal;
        } else {
            // Future value of regular annuity: FV = PMT * [((1 + i)^n - 1) / i]
            futureValue = monthlyDeposit * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
        }

        const totalInterest = Math.max(0, futureValue - totalPrincipal);

        return {
            spendPerDraw: spend,
            monthlyDeposit,
            years: y,
            totalMonths,
            annualReturnPct: r * 100,
            totalPrincipal,
            futureValue,
            totalInterest
        };
    }

    /**
     * Generates lucky numbers
     * @param {string} type - '2digit' | '3digit' | '6digit'
     * @returns {string}
     */
    function generateLuckyNumber(type = '3digit') {
        if (type === '2digit') {
            return String(Math.floor(Math.random() * 100)).padStart(2, '0');
        }
        if (type === '6digit') {
            return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
        }
        // default 3digit
        return String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    }

    const exportsObj = {
        expand6Doors,
        expand19Doors,
        expandFrontRun,
        expandBackRun,
        expandDoubleNumbers,
        expandTwoDigitReverse,
        calculateLottoBet,
        GLO_PRIZES,
        CLAIM_CHANNELS,
        calculatePrizeClaim,
        calculateLottoStats,
        calculateLottoSavingsSimulation,
        generateLuckyNumber
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);
