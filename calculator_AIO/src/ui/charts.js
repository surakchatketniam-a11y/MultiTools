// ==============================================================
// Multitools Calculator - Desktop Charts (Phase 8)
// Pure data helpers + SVG/HTML renderers. Colours come from the
// shared theme variables only. Panels are wrapped in the
// `desktop-chart hidden lg:block` shell so mobile never renders them.
// ==============================================================

const CHART_TONES = {
    accent: { color: 'var(--app-accent)', opacity: 1 },
    ink: { color: 'var(--app-ink)', opacity: 0.75 },
    muted: { color: 'var(--app-muted)', opacity: 0.55 },
    soft: { color: 'var(--app-surface-strong)', opacity: 1 }
};

// numberOrDefault returns NaN for invalid text; charts and what-if sliders want 0 instead.
function safeNumber(value, fallback = 0) {
    const n = numberOrDefault(value, fallback);
    return Number.isFinite(n) ? n : fallback;
}

function chartPercent(value, total) {
    return total > 0 ? (value / total) * 100 : 0;
}

/* ---------- pure data helpers (unit-tested) ---------- */

// Loan: split totals + a downsampled balance curve (max ~60 points).
function buildLoanChartData(schedule, maxPoints = 60) {
    const rows = Array.isArray(schedule) ? schedule : [];
    if (!rows.length) {
        return { totalPrincipal: 0, totalInterest: 0, totalPaid: 0, interestSharePct: 0, points: [] };
    }
    const totalPrincipal = rows.reduce((sum, r) => sum + r.principal, 0);
    const totalInterest = rows.reduce((sum, r) => sum + r.interest, 0);
    const totalPaid = totalPrincipal + totalInterest;
    const points = [{ month: 0, balance: rows[0].balance + rows[0].principal }];
    const step = Math.max(1, Math.ceil(rows.length / Math.max(2, maxPoints)));
    rows.forEach((r, i) => {
        if ((i + 1) % step === 0 || i === rows.length - 1) {
            points.push({ month: r.month, balance: r.balance });
        }
    });
    return {
        totalPrincipal,
        totalInterest,
        totalPaid,
        interestSharePct: chartPercent(totalInterest, totalPaid),
        points
    };
}

// Tax: waterfall steps from gross income down to net taxable income.
function buildTaxWaterfallSteps(calc) {
    if (!calc || !(calc.grossIncome > 0)) return [];
    const gross = calc.grossIncome;
    const steps = [{ label: 'เงินได้ทั้งปี', amount: gross, kind: 'total', start: 0, end: gross }];
    let running = gross;
    const pushMinus = (label, amount) => {
        const value = Math.max(0, Math.min(amount, running));
        if (value <= 0) return;
        steps.push({ label, amount: value, kind: 'minus', start: running - value, end: running });
        running -= value;
    };
    pushMinus('หักค่าใช้จ่าย', calc.expenses);
    pushMinus('ลดหย่อนส่วนตัว/ครอบครัว', calc.personalTotal);
    pushMinus('ลดหย่อนประกัน/ลงทุน', calc.savingsTotal);
    pushMinus('เงินบริจาค', calc.totalDonations);
    steps.push({ label: 'เงินได้สุทธิ', amount: running, kind: 'total', start: 0, end: running });
    return steps;
}

// Tax: where the net taxable income sits inside its bracket.
function buildTaxBracketGauge(calc) {
    if (!calc) return null;
    const start = calc.bracketStart || 0;
    const next = calc.nextBracketStart == null ? null : calc.nextBracketStart;
    const net = calc.netTaxableIncome || 0;
    const progress = next == null ? 1 : Math.min(1, Math.max(0, (net - start) / (next - start)));
    return {
        currentRatePercent: calc.marginalRate || 0,
        nextRatePercent: calc.nextRatePercent == null ? null : calc.nextRatePercent,
        amountToNext: next == null ? null : Math.max(0, next - net),
        progress
    };
}

// Salary: 50/30/20 split; leftover share (if percents < 100) is its own slice.
function buildSalarySplitData(params) {
    const p = params || {};
    const income = Math.max(0, safeNumber(p.income, 0));
    const needsPct = Math.max(0, safeNumber(p.needsPct, 0));
    const wantsPct = Math.max(0, safeNumber(p.wantsPct, 0));
    const savingsPct = Math.max(0, safeNumber(p.savingsPct, 0));
    const totalPct = needsPct + wantsPct + savingsPct;
    const slices = [
        { label: 'จำเป็น', pct: needsPct, amount: income * needsPct / 100, tone: 'accent' },
        { label: 'ไลฟ์สไตล์', pct: wantsPct, amount: income * wantsPct / 100, tone: 'ink' },
        { label: 'ออม/ลงทุน', pct: savingsPct, amount: income * savingsPct / 100, tone: 'muted' }
    ];
    if (totalPct < 100) {
        slices.push({ label: 'ยังไม่ได้จัดสรร', pct: 100 - totalPct, amount: income * (100 - totalPct) / 100, tone: 'soft' });
    }
    return { income, totalPct, overAllocated: totalPct > 100, slices };
}

/* ---------- renderers ---------- */

function chartToneStyle(tone) {
    const t = CHART_TONES[tone] || CHART_TONES.muted;
    return `color:${t.color};opacity:${t.opacity}`;
}

function renderChartLegend(items) {
    return `<ul class="chart-legend space-y-1 text-xs">${items.map(item => `
        <li class="flex items-center justify-between gap-2">
            <span class="flex items-center gap-1.5 min-w-0">
                <span class="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style="background:currentColor;${chartToneStyle(item.tone)}" aria-hidden="true"></span>
                <span class="truncate text-[var(--app-body)]">${escapeHTML(item.label)}</span>
            </span>
            <b class="text-[var(--app-ink)] whitespace-nowrap">${item.text}</b>
        </li>`).join('')}</ul>`;
}

// Donut (or pie when pie=true) built from stroked circles.
function renderDonutChart(slices, options = {}) {
    const visible = slices.filter(s => s.value > 0);
    const total = visible.reduce((sum, s) => sum + s.value, 0);
    if (total <= 0) return '';
    const pie = !!options.pie;
    const radius = pie ? 25 : 38;
    const stroke = pie ? 50 : 20;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const arcs = visible.map(s => {
        const length = (s.value / total) * circumference;
        // thin gap between neighbouring slices so they stay distinguishable when tones are close
        const gap = visible.length > 1 ? Math.min(1.2, length * 0.2) : 0;
        const drawn = length - gap;
        const arc = `<circle cx="60" cy="60" r="${radius}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-dasharray="${drawn.toFixed(3)} ${(circumference - drawn).toFixed(3)}" stroke-dashoffset="${(-offset).toFixed(3)}" transform="rotate(-90 60 60)" style="${chartToneStyle(s.tone)}"></circle>`;
        offset += length;
        return arc;
    }).join('');
    const center = !pie && options.centerText
        ? `<text x="60" y="58" text-anchor="middle" font-size="12" font-weight="700" fill="var(--app-ink)">${escapeHTML(options.centerText)}</text><text x="60" y="71" text-anchor="middle" font-size="7" fill="var(--app-muted)">${escapeHTML(options.centerSub || '')}</text>`
        : '';
    return `<svg viewBox="0 0 120 120" class="w-32 h-32 shrink-0" role="img" aria-label="${escapeHTML(options.ariaLabel || 'แผนภูมิสัดส่วน')}">${arcs}${center}</svg>`;
}

// Area/line chart of a value series (x = index, y = value).
function renderLineChart(points, options = {}) {
    if (!Array.isArray(points) || points.length < 2) return '';
    const width = 300, height = 110, padX = 4, padTop = 8, padBottom = 6;
    const maxY = Math.max(...points.map(p => p.balance), 1);
    const maxX = Math.max(points[points.length - 1].month, 1);
    const xy = p => [
        padX + (p.month / maxX) * (width - padX * 2),
        padTop + (1 - p.balance / maxY) * (height - padTop - padBottom)
    ];
    const coords = points.map(xy);
    const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const baseY = height - padBottom;
    const area = `${line} L${coords[coords.length - 1][0].toFixed(1)} ${baseY} L${coords[0][0].toFixed(1)} ${baseY} Z`;
    return `<svg viewBox="0 0 ${width} ${height}" class="w-full h-auto" role="img" aria-label="${escapeHTML(options.ariaLabel || 'กราฟยอดคงเหลือ')}" preserveAspectRatio="none">
        <line x1="${padX}" y1="${baseY}" x2="${width - padX}" y2="${baseY}" stroke="var(--app-hairline)" stroke-width="1"></line>
        <path d="${area}" fill="var(--app-accent)" fill-opacity="0.14"></path>
        <path d="${line}" fill="none" stroke="var(--app-accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"></path>
    </svg>`;
}

// Horizontal waterfall: one row per step, bar offset/width as % of gross.
function renderWaterfallChart(steps) {
    if (!steps.length) return '';
    const max = Math.max(...steps.map(s => s.end), 1);
    return `<div class="space-y-1.5" role="list">${steps.map(s => {
        const left = chartPercent(s.start, max);
        const width = Math.max(chartPercent(s.end - s.start, max), 0.8);
        const tone = s.kind === 'total' ? 'ink' : 'accent';
        return `<div role="listitem" class="text-[11px]">
            <div class="flex justify-between gap-2 text-[var(--app-body)]"><span>${escapeHTML(s.label)}</span><b class="text-[var(--app-ink)]">${s.kind === 'minus' ? '−' : ''}${formatMoney(s.amount)}</b></div>
            <div class="h-2 rounded-full relative overflow-hidden" style="box-shadow: inset 0 0 0 1px var(--app-hairline)"><span class="absolute top-0 bottom-0 rounded-full" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%;background:currentColor;${chartToneStyle(tone)}"></span></div>
        </div>`;
    }).join('')}</div>`;
}

function renderChartPanel(title, bodyHTML) {
    return `<div class="desktop-chart themed-tool-card hidden lg:block p-4 space-y-3 text-xs" data-desktop-chart>
        <div class="font-bold text-[var(--app-ink)]">${escapeHTML(title)}</div>
        ${bodyHTML}
    </div>`;
}

function renderLoanChartPanel(schedule) {
    const data = buildLoanChartData(schedule);
    if (!data.points.length) return '';
    const donut = renderDonutChart([
        { value: data.totalPrincipal, tone: 'accent' },
        { value: data.totalInterest, tone: 'ink' }
    ], {
        centerText: `${data.interestSharePct.toFixed(1)}%`,
        centerSub: 'ดอกเบี้ย',
        ariaLabel: `เงินต้น ${formatMoney(data.totalPrincipal)} บาท ดอกเบี้ย ${formatMoney(data.totalInterest)} บาท`
    });
    const last = data.points[data.points.length - 1];
    return renderChartPanel('ภาพรวมสินเชื่อ', `
        <div class="flex items-center gap-4">
            ${donut}
            <div class="flex-1 min-w-0">${renderChartLegend([
                { label: 'เงินต้น', tone: 'accent', text: `${formatMoney(data.totalPrincipal)} ฿` },
                { label: 'ดอกเบี้ย', tone: 'ink', text: `${formatMoney(data.totalInterest)} ฿` },
                { label: 'รวมจ่ายทั้งหมด', tone: 'soft', text: `${formatMoney(data.totalPaid)} ฿` }
            ])}</div>
        </div>
        <div>
            <div class="font-semibold text-[var(--app-body)] mb-1">ยอดหนี้คงเหลือตลอดสัญญา</div>
            ${renderLineChart(data.points, { ariaLabel: `ยอดหนี้ลดจาก ${formatMoney(data.points[0].balance)} เหลือ ${formatMoney(last.balance)} บาท ใน ${last.month} งวด` })}
            <div class="flex justify-between text-[10px] text-[var(--app-body)] mt-0.5"><span>งวดที่ 0 · ${formatMoney(data.points[0].balance)}</span><span>งวดที่ ${last.month} · ${formatMoney(last.balance)}</span></div>
        </div>
        ${renderLoanWhatIfSection(schedule)}`);
}

function renderTaxChartPanel(calc, params) {
    const steps = buildTaxWaterfallSteps(calc);
    if (!steps.length) return '';
    const gauge = buildTaxBracketGauge(calc);
    const gaugeText = gauge.amountToNext == null
        ? `อยู่ในฐานภาษีสูงสุด ${gauge.currentRatePercent}%`
        : `ฐานภาษี ${gauge.currentRatePercent}% · อีก ${formatMoney(gauge.amountToNext)} บาท จะขึ้นฐาน ${gauge.nextRatePercent}%`;
    return renderChartPanel('จากเงินได้ถึงเงินได้สุทธิ', `
        ${renderWaterfallChart(steps)}
        <div class="space-y-1">
            <div class="font-semibold text-[var(--app-body)]">ระยะห่างถึงฐานภาษีถัดไป</div>
            <div class="h-2.5 rounded-full overflow-hidden" style="box-shadow: inset 0 0 0 1px var(--app-hairline)" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(gauge.progress * 100)}" aria-label="${escapeHTML(gaugeText)}"><div class="h-full rounded-full" style="width:${(gauge.progress * 100).toFixed(1)}%;background:var(--app-accent)"></div></div>
            <div class="text-[var(--app-body)]">${escapeHTML(gaugeText)}</div>
        </div>
        ${params ? renderTaxInsightsSection(params) : ''}`);
}

function renderSalaryChartPanel(params) {
    const data = buildSalarySplitData(params);
    if (data.income <= 0 || data.totalPct <= 0) return '';
    const pie = renderDonutChart(data.slices.map(s => ({ value: s.pct, tone: s.tone })), {
        pie: true,
        ariaLabel: data.slices.map(s => `${s.label} ${s.pct}%`).join(' ')
    });
    return renderChartPanel('สัดส่วนการจัดสรรเงินเดือน', `
        <div class="flex items-center gap-4">
            ${pie}
            <div class="flex-1 min-w-0">${renderChartLegend(data.slices.map(s => ({
                label: `${s.label} ${s.pct}%`,
                tone: s.tone,
                text: `${formatMoney(s.amount)} ฿`
            })))}</div>
        </div>
        ${data.overAllocated ? `<div class="text-[var(--app-body)]">สัดส่วนรวมเกิน 100% (${data.totalPct}%) กรุณาปรับให้ไม่เกินเงินเดือน</div>` : ''}
        ${renderSalaryWhatIfSection(params)}`);
}
