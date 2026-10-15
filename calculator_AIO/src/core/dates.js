// ==============================================================
// Multitools Calculator - Thai Calendar & Workday Core Helpers
// ==============================================================

const THAI_FIXED_PUBLIC_HOLIDAYS = new Set([
    '01-01', // วันขึ้นปีใหม่
    '04-06', // วันจักรี
    '04-13', '04-14', '04-15', // วันสงกรานต์
    '05-01', // วันแรงงานแห่งชาติ
    '05-04', // วันฉัตรมงคล
    '06-03', // วันเฉลิมพระชนมพรรษาพระราชินี
    '07-28', // วันเฉลิมพระชนมพรรษา ร.10
    '08-12', // วันแม่แห่งชาติ
    '10-13', // วันนวมินทรมหาราช
    '10-23', // วันปิยมหาราช
    '12-05', // วันพ่อแห่งชาติ
    '12-10', // วันรัฐธรรมนูญ
    '12-31'  // วันสิ้นปี
]);

const THAI_LUNAR_AND_SUBSTITUTE_HOLIDAYS = new Set([
    // 2024 (2567)
    '2024-02-26', '2024-05-22', '2024-07-22',
    // 2025 (2568)
    '2025-02-12', '2025-05-12', '2025-07-10', '2025-07-11',
    // 2026 (2569)
    '2026-03-03', '2026-06-01', '2026-07-29', '2026-07-30',
    // 2027 (2570)
    '2027-02-22', '2027-05-20', '2027-07-19'
]);

function isThaiOfficialHoliday(date) {
    if (!date || typeof date.getTime !== 'function' || !Number.isFinite(date.getTime())) return false;
    const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const iso = `${date.getFullYear()}-${mmdd}`;
    return THAI_FIXED_PUBLIC_HOLIDAYS.has(mmdd) || THAI_LUNAR_AND_SUBSTITUTE_HOLIDAYS.has(iso);
}

function validateCalendarDate(date) {
    if (!date || typeof date.getTime !== 'function' || !Number.isFinite(date.getTime())) {
        throw new RangeError('วันที่ไม่ถูกต้อง');
    }
}

function countWorkingDays(start, end, isWorkday, limit = 36600) {
    validateCalendarDate(start);
    validateCalendarDate(end);
    const direction = start <= end ? 1 : -1;
    const cursor = new Date(start);
    let count = 0, searched = 0;
    while (direction > 0 ? cursor <= end : cursor >= end) {
        if (++searched > limit) throw new RangeError('ช่วงวันที่ต้องไม่เกิน 36,600 วันปฏิทิน');
        if (isWorkday(cursor)) count++;
        cursor.setDate(cursor.getDate() + direction);
    }
    return count;
}

function offsetWorkingDays(start, amount, isWorkday, limit = 36600) {
    validateCalendarDate(start);
    if (!Number.isSafeInteger(amount) || Math.abs(amount) > limit) throw new RangeError('จำนวนวันต้องเป็นจำนวนเต็มไม่เกิน 36,600 วัน');
    const cursor = new Date(start), direction = amount < 0 ? -1 : 1;
    let remaining = Math.abs(amount), searched = 0;
    while (remaining > 0) {
        if (++searched > limit) throw new RangeError('ไม่พบวันทำการภายใน 36,600 วันปฏิทิน กรุณาตรวจวันทำงานและวันหยุด');
        cursor.setDate(cursor.getDate() + direction);
        validateCalendarDate(cursor);
        if (isWorkday(cursor)) remaining--;
    }
    return cursor;
}

function normalizeWorkDays(days) {
    const valid = Array.isArray(days) ? [...new Set(days.filter(day => Number.isInteger(day) && day >= 0 && day <= 6))] : [];
    return valid.length ? valid : [1, 2, 3, 4, 5];
}

(function(root) {
    const exportsObj = {
        THAI_FIXED_PUBLIC_HOLIDAYS,
        THAI_LUNAR_AND_SUBSTITUTE_HOLIDAYS,
        isThaiOfficialHoliday,
        validateCalendarDate,
        countWorkingDays,
        offsetWorkingDays,
        normalizeWorkDays
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
