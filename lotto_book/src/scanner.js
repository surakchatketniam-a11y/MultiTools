/** Decode only unambiguous lottery details; never guess from opaque QR payloads. */
(function(root) {
    'use strict';

    function validDate(value) {
        const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return null;
        let year = Number(match[1]);
        if (year > 2400) year -= 543;
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
        return `${year}-${match[2]}-${match[3]}`;
    }

    function parse(raw) {
        const text = String(raw || '').trim();
        if (!text || text.length > 2048) return null;
        if (/^\d{6}$/.test(text)) return { number: text, drawDate: null, count: null };
        // Recognize only labeled fields. Most physical-ticket codes are opaque IDs.
        const number = text.match(/(?:number|ticket|เลขสลาก|หมายเลข)\s*[:=]\s*(\d{6})(?!\d)/i);
        if (!number) return null;
        const date = text.match(/(?:date|draw|งวดวันที่|งวด)\s*[:=]\s*(\d{4}-\d{2}-\d{2})/i);
        const count = text.match(/(?:count|quantity|จำนวนใบ)\s*[:=]\s*(\d{1,3})(?!\d)/i);
        const parsedCount = count ? Number(count[1]) : null;
        return {
            number: number[1],
            drawDate: date ? validDate(date[1]) : null,
            count: parsedCount > 0 ? parsedCount : null
        };
    }

    const Scanner = { parse, validDate };
    if (typeof module !== 'undefined' && module.exports) module.exports = Scanner;
    else root.LottoScanner = Scanner;
})(typeof window !== 'undefined' ? window : global);
