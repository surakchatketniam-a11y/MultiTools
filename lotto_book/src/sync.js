/** Official-result adapter. Reject incomplete draws so they cannot mark tickets as lost. */
(function(root) {
    'use strict';

    const ENDPOINT = '/api/glo-results';
    const fields = {
        first: ['first', 'firstPrize', 'prize1'],
        nearFirst: ['nearFirst', 'nearFirstPrize', 'near1'],
        front3: ['front3', 'frontThree', 'front3Digit'],
        back3: ['back3', 'backThree', 'back3Digit'],
        back2: ['back2', 'last2', 'lastTwo', 'back2Digit'],
        second: ['second', 'prize2'], third: ['third', 'prize3'],
        fourth: ['fourth', 'prize4'], fifth: ['fifth', 'prize5']
    };
    const widths = { first: 6, nearFirst: 6, front3: 3, back3: 3, back2: 2,
        second: 6, third: 6, fourth: 6, fifth: 6 };

    function pick(obj, names) {
        for (const key of names) if (obj && obj[key] !== undefined) return obj[key];
        return undefined;
    }

    function values(value, width) {
        const list = Array.isArray(value) ? value : [value];
        return list.map(item => typeof item === 'object' && item !== null
            ? pick(item, ['number', 'value', 'result', 'lotteryNo']) : item)
            .map(item => String(item ?? '').trim())
            .filter(item => new RegExp(`^\\d{${width}}$`).test(item));
    }

    function isoDate(value) {
        if (typeof value !== 'string') return null;
        const match = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (!match) return null;
        let year = Number(match[1]);
        if (year > 2400) year -= 543;
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    function normalize(payload) {
        const outer = payload?.data ?? payload;
        const list = Array.isArray(outer) ? outer :
            (outer?.items ?? outer?.results ?? outer?.content ?? outer?.list);
        const record = Array.isArray(list) ? list[0] : outer;
        if (!record || typeof record !== 'object') throw new Error('รูปแบบข้อมูลจาก GLO ไม่รองรับ');
        const drawDate = isoDate(pick(record, ['drawDate', 'date', 'lotteryDate', 'periodDate']));
        if (!drawDate) throw new Error('ไม่พบวันที่งวดที่ถูกต้อง');
        const source = record.prizes && typeof record.prizes === 'object' ? record.prizes : record;
        const prizes = {};
        for (const [field, aliases] of Object.entries(fields)) {
            const found = pick(source, aliases);
            const parsed = values(found, widths[field]);
            if (field === 'first' || field === 'back2') prizes[field] = parsed[0];
            else prizes[field] = parsed;
        }
        const required = ['first', 'back2'];
        if (required.some(field => !prizes[field]) || prizes.front3.length !== 2 ||
            prizes.back3.length !== 2 || prizes.nearFirst.length !== 2 ||
            prizes.second.length !== 5 || prizes.third.length !== 10 ||
            prizes.fourth.length !== 50 || prizes.fifth.length !== 100) {
            throw new Error('ผลรางวัลจาก GLO ยังไม่ครบทุกประเภท จึงยังไม่บันทึก');
        }
        return { drawDate, dateFormatted: new Intl.DateTimeFormat('th-TH', {
            day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok'
        }).format(new Date(`${drawDate}T00:00:00+07:00`)), prizes, source: 'GLO' };
    }

    async function fetchLatest(fetcher = fetch) {
        if (typeof location !== 'undefined' && location.protocol === 'file:') {
            throw new Error('กรุณาเปิด LottoBook ผ่านเว็บไซต์ HTTPS เพื่ออัปเดตผล GLO');
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        let response;
        try {
            response = await fetcher(ENDPOINT, {
            method: 'GET', mode: 'cors', cache: 'no-store',
            headers: { Accept: 'application/json' }, signal: controller.signal
            });
        } catch (error) {
            throw new Error(error.name === 'AbortError'
                ? 'GLO ไม่ตอบกลับภายใน 12 วินาที'
                : 'เชื่อมต่อ API อัปเดตผลไม่ได้');
        } finally { clearTimeout(timeout); }
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            if (errorBody.error === 'GLO_TIMEOUT') throw new Error('GLO ไม่ตอบกลับภายในเวลาที่กำหนด');
            throw new Error(`API อัปเดตผลตอบกลับ HTTP ${response.status}`);
        }
        return normalize(await response.json());
    }

    async function fetchSince(after, fetcher = fetch) {
        if (!isoDate(after)) throw new Error('วันที่เริ่มต้นสำหรับอัปเดตไม่ถูกต้อง');
        if (typeof location !== 'undefined' && location.protocol === 'file:') {
            throw new Error('กรุณาเปิด LottoBook ผ่านเว็บไซต์ HTTPS เพื่ออัปเดตผล GLO');
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 55000);
        let response;
        try {
            response = await fetcher(`${ENDPOINT}?after=${encodeURIComponent(after)}`, {
                method: 'GET', mode: 'cors', cache: 'no-store',
                headers: { Accept: 'application/json' }, signal: controller.signal
            });
        } catch (error) {
            throw new Error(error.name === 'AbortError'
                ? 'การเติมข้อมูลงวดย้อนหลังใช้เวลานานเกินไป'
                : 'เชื่อมต่อ API อัปเดตผลไม่ได้');
        } finally { clearTimeout(timeout); }
        if (!response.ok) throw new Error(`API อัปเดตผลตอบกลับ HTTP ${response.status}`);
        const payload = await response.json();
        if (!Array.isArray(payload.results)) throw new Error('รูปแบบข้อมูลย้อนหลังไม่ถูกต้อง');
        return {
            results: payload.results.map(normalize),
            failedDates: Array.isArray(payload.failedDates) ? payload.failedDates : [],
            complete: payload.complete !== false
        };
    }

    const Sync = { ENDPOINT, normalize, fetchLatest, fetchSince };
    if (typeof module !== 'undefined' && module.exports) module.exports = Sync;
    else root.LottoSync = Sync;
})(typeof window !== 'undefined' ? window : global);
