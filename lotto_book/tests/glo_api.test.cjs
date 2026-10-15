const assert = require('node:assert/strict');
const Api = require('../../api/glo-results.js');

function numbers(count, width) {
    return Array.from({ length: count }, (_, index) => ({
        round: index + 1,
        value: String(index).padStart(width, '0')
    }));
}

const detailedPayload = {
    status: true,
    statusCode: 200,
    response: {
        date: '2026-10-01',
        data: {
            first: { number: [{ round: 1, value: '402701' }] },
            near1: { number: [{ round: 1, value: '402700' }, { round: 2, value: '402702' }] },
            last3f: { number: [{ round: 1, value: '791' }, { round: 2, value: '912' }] },
            last3b: { number: [{ round: 1, value: '058' }, { round: 2, value: '396' }] },
            last2: { number: [{ round: 1, value: '70' }] },
            second: { number: numbers(5, 6) },
            third: { number: numbers(10, 6) },
            fourth: { number: numbers(50, 6) },
            fifth: { number: numbers(100, 6) }
        }
    }
};

function mockResponse() {
    return {
        statusCode: 0,
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        end(value) { this.body = JSON.parse(value); }
    };
}

async function run() {
    assert.equal(Api.isValidDate('2026-10-01'), true);
    assert.equal(Api.isValidDate('2026-02-30'), false);

    const normalized = Api.normalizeDetailedResult(detailedPayload);
    assert.equal(normalized.drawDate, '2026-10-01');
    assert.equal(normalized.prizes.first, '402701');
    assert.equal(normalized.prizes.back3[0], '058');
    assert.equal(normalized.prizes.fifth.length, 100);

    const calls = [];
    const fetcher = async (url, options) => {
        calls.push({ url, body: JSON.parse(options.body) });
        if (url.endsWith('/getLotteryResultByPage')) {
            return {
                ok: true,
                json: async () => ({ status: true, response: { lottery: [{ date: '2026-10-01' }] } })
            };
        }
        return { ok: true, json: async () => detailedPayload };
    };
    const response = mockResponse();
    await Api.handle({ method: 'GET', query: {} }, response, fetcher);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.prizes.back2, '70');
    assert.equal(response.headers['X-Content-Type-Options'], 'nosniff');
    assert.match(response.headers['Cache-Control'], /s-maxage=300/);
    assert.deepEqual(calls.map(call => call.body), [
        { page: 1 },
        { date: '01', month: '10', year: '2026' }
    ]);

    const badResponse = mockResponse();
    await Api.handle({ method: 'GET', query: { date: '2026-02-30' } }, badResponse, fetcher);
    assert.equal(badResponse.statusCode, 400);
    assert.equal(badResponse.body.error, 'INVALID_DRAW_DATE');
    assert.equal(calls.length, 2);

    console.log('Vercel GLO proxy checks passed.');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
