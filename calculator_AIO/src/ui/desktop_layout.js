// ==============================================================
// Multitools Calculator - Desktop Two-Column Arrangement (Phase 8)
// At >=1024px, a tool whose root holds result cards / chart panels gets its
// children regrouped into a form column and a results column, so the columns
// stay flush with no grid gaps. Mobile never runs this: its DOM is untouched.
// ==============================================================

const DESKTOP_MIN_WIDTH = 1024;
const DESKTOP_RESULT_SELECTOR = '.themed-result-card, .desktop-chart, .appliance-ranking, .social-security-insight';
// Mode switchers, intros and wide tables stay full width above/below the two columns.
const DESKTOP_FULL_SELECTOR = '.segment-group, [class*="-intro"], .transfer-split-compare, .car-payoff-schedule, .loan-schedule-card, .loan-mode-tabs';
const DESKTOP_SPLIT_OPT_OUT = ['calc'];

function isDesktopLayout() {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        && window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`).matches;
}

// Pure planner: items = [{ result, full }] in DOM order -> index groups, or null if no split applies.
function planDesktopColumns(items) {
    const list = Array.isArray(items) ? items : [];
    let start = 0;
    while (start < list.length && list[start].full && !list[start].result) start++;
    let end = list.length;
    while (end > start && list[end - 1].full && !list[end - 1].result) end--;
    const form = [];
    const results = [];
    for (let i = start; i < end; i++) (list[i].result ? results : form).push(i);
    if (!results.length || !form.length) return null;
    const range = (from, to) => Array.from({ length: Math.max(0, to - from) }, (_, k) => from + k);
    return { leading: range(0, start), form, results, trailing: range(end, list.length) };
}

function arrangeDesktopColumns(panel) {
    if (!panel || !isDesktopLayout()) return;
    if (DESKTOP_SPLIT_OPT_OUT.includes(panel.dataset.toolId)) return;
    const root = panel.firstElementChild;
    if (!root || root.querySelector(':scope > .desktop-split')) return;
    const kids = Array.from(root.children);
    const plan = planDesktopColumns(kids.map(el => ({
        result: el.matches(DESKTOP_RESULT_SELECTOR),
        full: el.matches(DESKTOP_FULL_SELECTOR)
    })));
    if (!plan) return;
    const split = document.createElement('div');
    split.className = 'desktop-split';
    const formCol = document.createElement('div');
    formCol.className = 'desktop-col';
    const resultsCol = document.createElement('div');
    resultsCol.className = 'desktop-col';
    split.append(formCol, resultsCol);
    root.insertBefore(split, kids[plan.form[0] < plan.results[0] ? plan.form[0] : plan.results[0]]);
    plan.form.forEach(i => formCol.appendChild(kids[i]));
    plan.results.forEach(i => resultsCol.appendChild(kids[i]));
}

// Crossing the breakpoint (resize / rotate) rebuilds the tool so the DOM matches the layout.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && !globalThis.__desktopLayoutBound) {
    globalThis.__desktopLayoutBound = true;
    const query = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`);
    const rerender = () => { if (typeof renderActiveTool === 'function') renderActiveTool(); };
    if (typeof query.addEventListener === 'function') query.addEventListener('change', rerender);
    else if (typeof query.addListener === 'function') query.addListener(rerender);
}
