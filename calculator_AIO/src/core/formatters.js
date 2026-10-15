// ==============================================================
// Multitools Calculator - Formatters & Numeric Core Helpers
// ==============================================================

function normalizeThaiDigits(value) {
    return String(value ?? '').replace(/[๐-๙]/g, digit => String(digit.charCodeAt(0) - 0x0E50));
}

// A comma is a thousands separator, never a decimal separator.
// Reject partial matches such as 100abc, 1,00 and non-finite values.
function parseNumericInput(value) {
    const text = normalizeThaiDigits(value).trim();
    if (!/^[+-]?(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?|\.\d+)$/.test(text)) return NaN;
    const number = Number(text.replace(/,/g, ''));
    return Number.isFinite(number) ? number : NaN;
}

function numberOrDefault(value, fallback = 0) {
    return String(value ?? '').trim() === '' ? fallback : parseNumericInput(value);
}

function integerOrDefault(value, fallback = 0) {
    const number = numberOrDefault(value, fallback);
    return Number.isSafeInteger(number) ? number : NaN;
}

function hasInvalidNumericInput(toolId, stateObj) {
    const state = stateObj || (typeof appState !== 'undefined' ? appState : null);
    if (!state) return false;
    const curToolId = toolId || state.activeToolId;
    if (!curToolId || !state[curToolId]) return false;

    const fields = {
        currency: ['amount', 'customRateToTHB'], unit: ['val'], discount: ['price', 'discountPct', 'extraPct'],
        percent: ['x', 'y', ...(state.percent && state.percent.mode === 'compound' ? ['z'] : [])], vat: ['amount', 'rate'],
        vat_wht: ['amount', 'vatRate', 'whtRate'], fuel_cost: ['distance', 'efficiency', 'oilPrice'],
        health: ['weight', 'height', 'age', 'activity'], tip: ['bill', 'tipPct', 'people'], fuel_eff: ['distance', 'fuelUsed'],
        area_cost: ['rai', 'ngan', 'wa', 'rate', 'rounds'],
        loan: ['principal', 'interestRate', 'months', 'extra', ...(state.loan && state.loan.rateType === 'step' ? ['rateAfter', 'promoMonths'] : [])],
        savings: ['initial', 'monthly', 'interestRate', 'annualIncrease', 'inflationRate',
            ...(state.savings && state.savings.mode === 'retirement' ? ['currentAge', 'retirementAge', 'retirementMonthly'] : ['years']),
            ...(state.savings && state.savings.mode === 'goal' ? ['goalTarget'] : []),
            ...(state.savings && state.savings.mode === 'emergency' ? ['monthlyExpenses', 'emergencyMonths'] : [])],
        salary: ['income', 'needsPct', 'wantsPct', 'savingsPct', 'emergencyPct', 'debtPct']
    };
    const invalid = value => {
        const text = normalizeThaiDigits(String(value ?? '')).trim().replace(/,/g, '');
        if (text === '' || text === '.' || text === '-' || text === '-.') return false;
        return !Number.isFinite(parseNumericInput(text));
    };
    if (curToolId === 'unit_price') return state.unit_price.rows.some(row => invalid(row.price) || invalid(row.qty));
    const integers = { tip: ['people'], loan: ['months', ...(state.loan && state.loan.rateType === 'step' ? ['promoMonths'] : [])] };
    if ((integers[curToolId] || []).some(key => !Number.isFinite(integerOrDefault(state[curToolId][key])))) return true;
    return (fields[curToolId] || []).some(key => invalid(state[curToolId][key]));
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function formatLocalDate(date) {
    if (!date || typeof date.getTime !== 'function' || !Number.isFinite(date.getTime())) return '';
    return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addCalendarDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatInputDisplay(valStr) {
    if (valStr === undefined || valStr === null || valStr === '') return '';
    const clean = normalizeThaiDigits(String(valStr)).trim().replace(/,/g, '');
    if (clean === '-' || clean === '.' || clean === '-.') return clean;
    if (!Number.isFinite(parseNumericInput(clean))) return escapeHTML(String(valStr));
    const parts = clean.split('.');
    const intPart = parts[0];
    const decPart = parts.length > 1 ? '.' + parts[1] : '';
    if (intPart === '' && decPart !== '') return '0' + decPart;
    if (intPart === '-' && decPart !== '') return '-0' + decPart;
    const sign = intPart.startsWith('-') ? '-' : '';
    let digits = intPart.replace(/^-/, '');
    if (digits.length > 1) digits = digits.replace(/^0+(?=\d)/, '');
    const formattedInt = digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0';
    return sign + formattedInt + decPart;
}

function formatCalcExpr(expr) {
    if (!expr) return '';
    return String(expr).replace(/(?:\d[\d,.]*|\.\d+)/g, token => {
        const clean = token.replace(/,/g, '');
        const parts = clean.split('.');
        if (!/^\d+$/.test(parts[0])) return token;
        let digits = parts[0];
        if (digits.length > 1) digits = digits.replace(/^0+(?=\d)/, '');
        const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.length > 1 ? formatted + '.' + parts[1] : formatted;
    });
}

function formatNum(num, maxDec = 2) {
    if (!Number.isFinite(num)) return '—';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDec
    });
}

function formatMoney(num) {
    if (!Number.isFinite(num)) return '—';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatUnitPrice(num) {
    if (!Number.isFinite(num)) return '—';
    const hasThreeDec = Math.abs(Math.round(num * 100) - num * 100) > 1e-4;
    return num.toLocaleString('en-US', {
        minimumFractionDigits: hasThreeDec ? 3 : 2,
        maximumFractionDigits: 3
    });
}

function formatThaiDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '-';
    const thaiDate = d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short'
    });
    return `${thaiDate} (${dateStr})`;
}

function formatDateInputThai(dateStr, era = 'CE') {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const displayYear = Number(year) + (era === 'BE' ? 543 : 0);
    return `${day}/${month}/${displayYear}`;
}

function parseDateInputThai(value, era = 'CE') {
    let text = normalizeThaiDigits(value).trim();
    if (/^\d{8}$/.test(text)) text = `${text.slice(0, 2)}/${text.slice(2, 4)}/${text.slice(4)}`;
    const match = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (!match) return '';
    const day = Number(match[1]);
    const month = Number(match[2]);
    let year = Number(match[3]);
    // Two-digit years mean 20xx CE or 25xx BE (e.g. 69 = 2569).
    if (match[3].length === 2) year += era === 'BE' ? 2500 : 2000;
    else if (match[3].length !== 4) return '';
    if (era === 'BE') year -= 543;
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return '';
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDateInTimezone(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const get = type => parts.find(part => part.type === type).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
}

function evaluateArithmeticExpression(value) {
    let invalidNumber = false;
    const expression = normalizeThaiDigits(value).trim().replace(/(?:\d[\d,.]*|\.\d+)/g, token => {
        const number = parseNumericInput(token);
        if (!Number.isFinite(number)) invalidNumber = true;
        return String(number);
    });
    if (invalidNumber) return NaN;
    if (!expression || !/^[0-9+\-*/().\s]+$/.test(expression)) return NaN;
    try {
        const result = Function(`"use strict"; return (${expression})`)();
        return Number.isFinite(result) ? result : NaN;
    } catch (error) {
        return NaN;
    }
}

(function(root) {
    const exportsObj = {
        normalizeThaiDigits,
        parseNumericInput,
        numberOrDefault,
        integerOrDefault,
        hasInvalidNumericInput,
        escapeHTML,
        formatLocalDate,
        addCalendarDays,
        formatInputDisplay,
        formatCalcExpr,
        formatNum,
        formatMoney,
        formatUnitPrice,
        formatThaiDate,
        formatDateInputThai,
        parseDateInputThai,
        formatDateInTimezone,
        evaluateArithmeticExpression
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
