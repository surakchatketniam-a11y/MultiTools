// ==============================================================
// Multitools Calculator - Exchange Rates Parser
// ==============================================================

function parseFrankfurterRates(payload, requestedQuotes) {
    if (!Array.isArray(payload) || !payload.length) throw new Error('Invalid Frankfurter response');
    const getLocalDate = typeof formatLocalDate === 'function'
        ? formatLocalDate
        : (d => `${String(d.getFullYear()).padStart(4, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);

    const rates = { THB: 1 }, dates = {};
    for (const row of payload) {
        if (!row || row.base !== 'THB' || !requestedQuotes.includes(row.quote)) continue;
        const rate = row.rate;
        if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 || !Number.isFinite(1 / rate) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || getLocalDate(new Date(`${row.date}T00:00:00`)) !== row.date ||
            Object.hasOwn(dates, row.quote)) throw new Error('Invalid Frankfurter quote');
        rates[row.quote] = 1 / rate;
        dates[row.quote] = row.date;
    }
    if (!requestedQuotes.length || requestedQuotes.some(code => !Object.hasOwn(dates, code))) throw new Error('Missing Frankfurter quote');
    return { rates, dates };
}

(function(root) {
    const exportsObj = {
        parseFrankfurterRates
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
