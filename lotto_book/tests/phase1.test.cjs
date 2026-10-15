const assert = require('node:assert/strict');
const Draws = require('../src/draws.js');
const Scanner = require('../src/scanner.js');
const Sync = require('../src/sync.js');

assert.deepEqual(Draws.upcoming(2, new Date('2026-12-29T12:00:00Z')),
    ['2026-12-30', '2027-01-17']);
assert.equal(Draws.next(new Date('2026-10-16T10:00:00Z')).date, '2026-11-01');
assert.equal(Draws.next(new Date('2026-10-15T12:00:00Z')).date, '2026-10-16');

assert.deepEqual(Scanner.parse('007579'), { number: '007579', drawDate: null, count: null });
assert.deepEqual(Scanner.parse('number=007579; draw=2569-10-16; count=2'),
    { number: '007579', drawDate: '2026-10-16', count: 2 });
assert.equal(Scanner.parse('https://example.org/123456/20261016'), null);
assert.equal(Scanner.parse('number=123456; draw=2026-02-30').drawDate, null);

const sequence = (count, width) => Array.from({ length: count }, (_, index) =>
    String(index).padStart(width, '0'));
const complete = {
    drawDate: '2569-10-16',
    prizes: {
        first: '000001', nearFirst: ['000000', '000002'],
        front3: ['001', '002'], back3: ['003', '004'], back2: '05',
        second: sequence(5, 6), third: sequence(10, 6),
        fourth: sequence(50, 6), fifth: sequence(100, 6)
    }
};
const normalized = Sync.normalize({ data: { items: [complete] } });
assert.equal(normalized.drawDate, '2026-10-16');
assert.equal(normalized.prizes.first, '000001');
assert.equal(normalized.prizes.back2, '05');
assert.equal(normalized.source, 'GLO');
assert.throws(() => Sync.normalize({ ...complete, prizes: { ...complete.prizes, fifth: [] } }),
    /ยังไม่ครบ/);

Sync.fetchLatest(async (url, options) => {
    assert.equal(url, '/api/glo-results');
    assert.equal(options.method, 'GET');
    return { ok: true, json: async () => complete };
}).then(result => {
    assert.equal(result.prizes.first, '000001');
    return Sync.fetchSince('2025-03-16', async (url, options) => {
        assert.equal(url, '/api/glo-results?after=2025-03-16');
        assert.equal(options.method, 'GET');
        return {
            ok: true,
            json: async () => ({ results: [complete], failedDates: [], complete: true })
        };
    });
}).then(backfill => {
    assert.equal(backfill.results.length, 1);
    assert.equal(backfill.results[0].drawDate, '2026-10-16');
    assert.equal(backfill.complete, true);
    console.log('Phase 1 date, scan, and result-validation checks passed.');
}).catch(error => { console.error(error); process.exitCode = 1; });
