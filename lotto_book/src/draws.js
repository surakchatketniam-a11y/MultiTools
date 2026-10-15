/** Draw dates and countdowns use Thailand time, regardless of the device timezone. */
(function(root) {
    'use strict';

    const zone = 'Asia/Bangkok';
    const dateParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });

    function thailandNow(now = new Date()) {
        return Object.fromEntries(dateParts.formatToParts(now)
            .filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
    }

    function isoDate(year, month, day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    function candidates(year, month) {
        if (month === 1) return [isoDate(year, 1, 17)];
        if (month === 5) return [isoDate(year, 5, 2), isoDate(year, 5, 16)];
        if (month === 12) return [isoDate(year, 12, 1), isoDate(year, 12, 30)];
        return [isoDate(year, month, 1), isoDate(year, month, 16)];
    }

    function upcoming(count = 6, now = new Date()) {
        const current = thailandNow(now);
        const today = isoDate(current.year, current.month, current.day);
        const dates = [];
        for (let offset = 0; dates.length < count && offset < 12; offset++) {
            const monthIndex = current.year * 12 + current.month - 1 + offset;
            const year = Math.floor(monthIndex / 12);
            const month = monthIndex % 12 + 1;
            dates.push(...candidates(year, month).filter(date => date >= today));
        }
        return dates.slice(0, count);
    }

    function next(now = new Date()) {
        const dates = upcoming(2, now);
        let date = dates[0];
        // Official dates can move for holidays. Count down to the usual 16:00 ICT.
        if (now.getTime() >= Date.parse(`${date}T16:00:00+07:00`)) date = dates[1];
        const target = Date.parse(`${date}T16:00:00+07:00`);
        return { date, target, remainingMs: Math.max(0, target - now.getTime()) };
    }

    function formatRemaining(ms) {
        const seconds = Math.max(0, Math.floor(ms / 1000));
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor(seconds % 86400 / 3600);
        const minutes = Math.floor(seconds % 3600 / 60);
        return `${days} วัน ${hours} ชม. ${minutes} นาที`;
    }

    const Draws = { thailandNow, upcoming, next, formatRemaining };
    if (typeof module !== 'undefined' && module.exports) module.exports = Draws;
    else root.LottoDraws = Draws;
})(typeof window !== 'undefined' ? window : global);
