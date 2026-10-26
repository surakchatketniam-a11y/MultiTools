const assert = require('assert');
const Storage = require('../src/storage.js');
const Checker = require('../src/checker.js');
const Stats = require('../src/stats.js');
const fs = require('fs');
const path = require('path');

// Mock localStorage for Node test environment
const mockStorage = {};
global.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => { mockStorage[key] = String(val); },
    removeItem: (key) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

console.log('Running Lotto Book Core Unit Tests...');

// ----------------------------------------------------
// TEST 1: Number string preservation & leading zeros
// ----------------------------------------------------
console.log('\n--- Test 1: String preservation & leading zeros ---');
Storage.clearAllData();

const savedTicket1 = Storage.saveTicket({
    drawDate: '2026-10-16',
    number: '007', // 3 digits with leading double zero
    type: 'digit3',
    count: 2,
    costPerUnit: 100,
    note: 'เลขดัง'
});

assert.strictEqual(typeof savedTicket1.number, 'string', 'Ticket number must be string');
assert.strictEqual(savedTicket1.number, '007', 'Leading zeros must not be stripped');
assert.strictEqual(savedTicket1.totalCost, 200, 'Total cost must be count * costPerUnit');

const tickets = Storage.getTickets();
assert.strictEqual(tickets.length, 1);
assert.strictEqual(tickets[0].number, '007');
console.log('✓ Test 1 Passed: Leading zeros preserved accurately.');

// ----------------------------------------------------
// TEST 2: Budgeting and Spending Summary
// ----------------------------------------------------
console.log('\n--- Test 2: Budgeting & Spending Summary ---');
Storage.setBudgetForDraw('2026-10-16', 500);
assert.strictEqual(Storage.getBudgetForDraw('2026-10-16'), 500);

Storage.saveTicket({
    drawDate: '2026-10-16',
    number: '09',
    type: 'digit2',
    count: 1,
    costPerUnit: 80
});

const summary = Storage.getSpendingSummary();
assert.strictEqual(summary.totalSpent, 280, 'Total spent should be 200 + 80 = 280');
assert.strictEqual(summary.totalTickets, 3, 'Total tickets should be 2 + 1 = 3');
assert.strictEqual(summary.drawStats['2026-10-16'].budget, 500);
assert.strictEqual(summary.drawStats['2026-10-16'].totalCost, 280);
console.log('✓ Test 2 Passed: Budget and spending summary calculated correctly.');

// ----------------------------------------------------
// TEST 3: Checker 4 Statuses (upcoming, no_data, won, lost)
// ----------------------------------------------------
console.log('\n--- Test 3: Checker 4 Statuses ---');

const testDrawResult = {
    drawDate: '2025-03-16',
    dateFormatted: '16 มีนาคม 2568',
    prizes: {
        first: '757563',
        nearFirst: ['757562', '757564'],
        front3: ['595', '927'],
        back3: ['457', '309'],
        back2: '32',
        second: ['111111', '222222', '333333', '444444', '555555'],
        third: [],
        fourth: [],
        fifth: []
    }
};

// 3.1 Upcoming status (future draw)
const futureTicket = {
    id: 'f1',
    drawDate: '2026-12-01',
    number: '757563',
    count: 1,
    costPerUnit: 80,
    totalCost: 80
};
const resUpcoming = Checker.checkTicket(futureTicket, testDrawResult, '2026-10-15');
assert.strictEqual(resUpcoming.status, 'upcoming', 'Future draw must be upcoming');
console.log('✓ Test 3.1: Upcoming status verified.');

// 3.2 No Data status (past draw but missing in dataset)
const missingTicket = {
    id: 'm1',
    drawDate: '2024-01-01', // draw not in testDrawResult
    number: '123456',
    count: 1,
    costPerUnit: 80,
    totalCost: 80
};
const resNoData = Checker.checkTicket(missingTicket, null, '2026-10-15');
assert.strictEqual(resNoData.status, 'no_data', 'Missing draw data must not be marked as lost');
console.log('✓ Test 3.2: No Data status verified (never wrongly marks as lost).');

// 3.3 Won 1st Prize + 2-digit tail distinction
const winning1stTicket = {
    id: 'w1',
    drawDate: '2025-03-16',
    number: '757563',
    count: 1,
    costPerUnit: 80,
    totalCost: 80
};
const resWon1st = Checker.checkTicket(winning1stTicket, testDrawResult, '2026-10-15');
assert.strictEqual(resWon1st.status, 'won');
assert.strictEqual(resWon1st.totalPrize, 6000000);
assert.strictEqual(resWon1st.prizesWon[0].code, 'first');
console.log('✓ Test 3.3: 1st Prize won verified.');

// 3.4 Won back2 prize (with leading zero / string preservation)
const winningBack2Ticket = {
    id: 'w2',
    drawDate: '2025-03-16',
    number: '000032', // standard 6-digit ticket ending in 32
    count: 2,
    costPerUnit: 80,
    totalCost: 160
};
const resWonBack2 = Checker.checkTicket(winningBack2Ticket, testDrawResult, '2026-10-15');
assert.strictEqual(resWonBack2.status, 'won');
assert.strictEqual(resWonBack2.totalPrize, 4000, '2 tickets * 2000 = 4000');
assert.strictEqual(resWonBack2.netGainLoss, 3840, '4000 - 160 = 3840');
console.log('✓ Test 3.4: Back2 prize with multi-ticket count verified.');

// 3.5 Lost ticket
const losingTicket = {
    id: 'l1',
    drawDate: '2025-03-16',
    number: '999999',
    count: 1,
    costPerUnit: 80,
    totalCost: 80
};
const resLost = Checker.checkTicket(losingTicket, testDrawResult, '2026-10-15');
assert.strictEqual(resLost.status, 'lost');
assert.strictEqual(resLost.totalPrize, 0);
assert.strictEqual(resLost.netGainLoss, -80);
console.log('✓ Test 3.5: Lost ticket verified.');

// ----------------------------------------------------
// TEST 4: Separation of 'Official back2' vs '1st Prize tail 2'
// ----------------------------------------------------
console.log('\n--- Test 4: Distinction between back2 and 1st tail ---');
// For draw 2025-03-16:
// 1st prize is 757563 -> 1st prize tail is '63'
// Official back2 prize is '32'
const ticketTail63 = {
    id: 't63',
    drawDate: '2025-03-16',
    number: '000063',
    count: 1,
    costPerUnit: 80,
    totalCost: 80
};
const resTail63 = Checker.checkTicket(ticketTail63, testDrawResult, '2026-10-15');
// In official GLO lottery, '63' did NOT win the official back2 prize ('32'), so status is 'lost'
assert.strictEqual(resTail63.status, 'lost', 'Tail of 1st prize is not official back2 prize');
// But matchesFirstPrizeTail should be flagged as true
assert.strictEqual(resTail63.matchesFirstPrizeTail, true, 'Matches 1st prize tail indicator');
assert.strictEqual(resTail63.firstPrizeTail, '63');
console.log('✓ Test 4 Passed: Strict distinction between back2 and 1st prize tail verified.');

// ----------------------------------------------------
// TEST 5: Statistics Engine & Anti-Gambler Fallacy
// ----------------------------------------------------
console.log('\n--- Test 5: Historical Statistics & Dataset Integrity ---');
const rawData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/glo_results.json'), 'utf8'));
assert(rawData.length > 400, 'Raw data should contain >400 draws');

const statsReport = Stats.computeStats(rawData.slice(0, 48)); // 48 draws = ~2 years
assert.strictEqual(statsReport.metadata.totalDraws, 48);
assert(statsReport.back2.top10.length <= 10);
assert(statsReport.back2.cold10.length <= 10);
assert(statsReport.disclaimer.includes('อิสระต่อกัน'), 'Disclaimer must mention independent events');

// Verify 0-9 distribution length
assert.strictEqual(statsReport.digitDistribution1st.pos0_hundredK.length, 10);
assert.strictEqual(statsReport.digitDistributionBack2.pos0_ten.length, 10);
console.log('✓ Test 5 Passed: Stats computed successfully with anti-fallacy disclaimer.');

// ----------------------------------------------------
// TEST 6: Export & Import Integrity
// ----------------------------------------------------
console.log('\n--- Test 6: Export and Import Data ---');
const exportedJSON = Storage.exportDataJSON();
const exportedCSV = Storage.exportTicketsCSV();

assert(exportedJSON.includes('Multitools_LottoBook'));
assert(exportedCSV.includes('007'), 'CSV must contain 007 string');

// Test import merge
const importRes = Storage.importDataJSON(exportedJSON, 'merge');
assert.strictEqual(importRes.success, true);
console.log('✓ Test 6 Passed: Export and import verified.');

// ----------------------------------------------------
// TEST 7: Automatic GLO sync settings
// ----------------------------------------------------
console.log('\n--- Test 7: Automatic GLO sync settings ---');
const savedSettings = Storage.setSettings({
    gloBackfillBaseDate: '2025-03-16',
    gloLastSyncedDrawDate: '2026-10-01'
});
assert.strictEqual(savedSettings.gloBackfillBaseDate, '2025-03-16');
assert.strictEqual(Storage.getSettings().gloLastSyncedDrawDate, '2026-10-01');

Storage.clearAllData();
assert.deepStrictEqual(Storage.getSettings(), {}, 'Clear all data must remove sync state');
console.log('✓ Test 7 Passed: Automatic sync state persists and clears correctly.');

console.log('\nALL 7 CORE ENGINE TESTS PASSED PERFECTLY!\n');
assert.strictEqual(resUpcoming.statusBadge, 'ยังไม่ออกรางวัล');
assert.strictEqual(resNoData.statusBadge, 'ยังไม่มีข้อมูลผลรางวัล');
assert.strictEqual(resWon1st.statusBadge, 'ถูกรางวัล');
assert.strictEqual(resLost.statusBadge, 'ไม่ถูกรางวัล');
assert.strictEqual(Storage.escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
assert.throws(() => Storage.saveTicket({ drawDate: '2026-10-16', number: '12345' }), /2, 3 หรือ 6 หลัก/);
const dup3Result = Checker.checkTicket({ id: 'd3', drawDate: '2025-03-16', number: '595', type: 'digit3', count: 1, costPerUnit: 80, totalCost: 80 }, { drawDate: '2025-03-16', prizes: { ...testDrawResult.prizes, front3: ['595', '595'] } }, '2026-10-15');
assert.strictEqual(dup3Result.totalPrize, 8000, 'Duplicate 3-digit spins must award both matches');
const createdTicket = Storage.saveTicket({ drawDate: '2026-10-16', number: '007579', count: 1, costPerUnit: 80, note: 'ใบแรก' });
const updatedTicket = Storage.saveTicket({ id: createdTicket.id, createdAt: createdTicket.createdAt, drawDate: '2026-10-16', number: '007579', count: 3, costPerUnit: 100, note: 'แก้ไขจำนวน' });
assert.strictEqual(updatedTicket.id, createdTicket.id);
assert.strictEqual(updatedTicket.totalCost, 300);
assert.strictEqual(Storage.getTickets().length, 1);
