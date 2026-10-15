'use strict';

const GLO_BASE_URL = 'https://www.glo.or.th/api/lottery';
const GLO_TIMEOUT_MS = 20000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PRIZE_SHAPES = {
    first: 1,
    nearFirst: 2,
    front3: 2,
    back3: 2,
    back2: 1,
    second: 5,
    third: 10,
    fourth: 50,
    fifth: 100
};

function isValidDate(value) {
    if (!DATE_PATTERN.test(value || '')) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;
}

function prizeValues(group, width) {
    const numbers = Array.isArray(group?.number) ? group.number : [];
    return numbers.map(item => String(item?.value ?? '').trim())
        .filter(value => new RegExp(`^\\d{${width}}$`).test(value));
}

function normalizeDetailedResult(payload) {
    if (!payload?.status || payload.statusCode !== 200) {
        throw new Error('GLO_RESPONSE_NOT_SUCCESSFUL');
    }

    const response = payload.response;
    const data = response?.data;
    const drawDate = response?.date;
    if (!isValidDate(drawDate) || !data) throw new Error('GLO_RESULT_FORMAT_INVALID');

    const prizes = {
        first: prizeValues(data.first, 6)[0],
        nearFirst: prizeValues(data.near1, 6),
        front3: prizeValues(data.last3f, 3),
        back3: prizeValues(data.last3b, 3),
        back2: prizeValues(data.last2, 2)[0],
        second: prizeValues(data.second, 6),
        third: prizeValues(data.third, 6),
        fourth: prizeValues(data.fourth, 6),
        fifth: prizeValues(data.fifth, 6)
    };

    for (const [key, expected] of Object.entries(PRIZE_SHAPES)) {
        const actual = Array.isArray(prizes[key]) ? prizes[key].length : Number(Boolean(prizes[key]));
        if (actual !== expected) throw new Error(`GLO_PRIZE_${key.toUpperCase()}_INCOMPLETE`);
    }

    return {
        drawDate,
        dateFormatted: new Intl.DateTimeFormat('th-TH', {
            day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok'
        }).format(new Date(`${drawDate}T00:00:00+07:00`)),
        prizes,
        source: 'GLO',
        fetchedAt: new Date().toISOString()
    };
}

async function postGlo(path, body, fetcher) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GLO_TIMEOUT_MS);
    try {
        const response = await fetcher(`${GLO_BASE_URL}/${path}`, {
            method: 'POST',
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                Origin: 'https://www.glo.or.th',
                Referer: 'https://www.glo.or.th/mission/awarding/lottery-result',
                'User-Agent': 'Multitools-LottoBook/1.0'
            },
            body: JSON.stringify(body),
            signal: controller.signal
        });
        if (!response.ok) throw new Error(`GLO_HTTP_${response.status}`);
        return response.json();
    } finally {
        clearTimeout(timer);
    }
}

async function getLatestDate(fetcher) {
    const payload = await postGlo('getLotteryResultByPage', { page: 1 }, fetcher);
    const date = payload?.response?.lottery?.[0]?.date;
    if (!isValidDate(date)) throw new Error('GLO_LATEST_DATE_INVALID');
    return date;
}

async function getDetailedResult(drawDate, fetcher) {
    const [year, month, day] = drawDate.split('-');
    const payload = await postGlo('getLotteryResult', { date: day, month, year }, fetcher);
    return normalizeDetailedResult(payload);
}

function sendJson(response, status, body, cacheControl = 'no-store') {
    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', cacheControl);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(JSON.stringify(body));
}

async function handle(request, response, fetcher = fetch) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        return sendJson(response, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    const requestedDate = Array.isArray(request.query?.date) ? request.query.date[0] : request.query?.date;
    if (requestedDate && !isValidDate(requestedDate)) {
        return sendJson(response, 400, { ok: false, error: 'INVALID_DRAW_DATE' });
    }

    try {
        const drawDate = requestedDate || await getLatestDate(fetcher);
        const result = await getDetailedResult(drawDate, fetcher);
        return sendJson(response, 200, result, 'public, s-maxage=300, stale-while-revalidate=86400');
    } catch (error) {
        const timedOut = error?.name === 'AbortError';
        console.error('[glo-results]', {
            message: error?.message,
            drawDate: requestedDate || 'latest',
            timedOut
        });
        return sendJson(response, timedOut ? 504 : 502, {
            ok: false,
            error: timedOut ? 'GLO_TIMEOUT' : 'GLO_UPSTREAM_ERROR'
        });
    }
}

module.exports = (request, response) => handle(request, response);
module.exports.handle = handle;
module.exports.isValidDate = isValidDate;
module.exports.normalizeDetailedResult = normalizeDetailedResult;
