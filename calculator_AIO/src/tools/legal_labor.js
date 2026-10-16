// ==============================================================
// Multitools Calculator - Thai Labor Law & Legal Interest Tools
// (labor_severance, legal_interest) - Phase 7
// ==============================================================

/* -----------------------------------------------------------
 * PURE ENGINE: คำนวณเงินชดเชยเลิกจ้าง & ค่าตกใจ (Labor Severance)
 * พ.ร.บ. คุ้มครองแรงงาน พ.ศ. 2541 ม.118, ม.17 และสิทธิยกเว้นภาษี
 * ----------------------------------------------------------- */
function calculateLaborSeverance(params) {
    const p = params || {};
    const salaryMonthly = Math.max(0, numberOrDefault(p.salaryMonthly, 35000));
    const mode = p.mode || 'duration'; // 'duration' (ระบุอายุงาน) | 'dates' (ระบุวันเริ่มงาน-สิ้นสุด)
    const startDate = p.startDate || '';
    const endDate = p.endDate || '';
    
    // อายุงาน
    let years = Math.max(0, integerOrDefault(p.serviceYears, 3));
    let months = Math.max(0, Math.min(11, integerOrDefault(p.serviceMonths, 6)));
    let days = Math.max(0, Math.min(30, integerOrDefault(p.serviceDays, 0)));

    if (mode === 'dates' && startDate && endDate) {
        const d1 = new Date(startDate + 'T00:00:00');
        const d2 = new Date(endDate + 'T00:00:00');
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1) {
            let totalDays = Math.round((d2 - d1) / 86400000);
            years = Math.floor(totalDays / 365);
            const remDays = totalDays % 365;
            months = Math.floor(remDays / 30);
            days = remDays % 30;
        }
    }

    const totalDaysWorked = (years * 365) + (months * 30) + days;
    const dailyWage = salaryMonthly > 0 ? (salaryMonthly / 30) : 0;

    // 1. เกณฑ์เงินชดเชยเลิกจ้างตามกฎหมายแรงงาน (ม.118)
    // - 120 วัน แต่ไม่ถึง 1 ปี: 30 วัน (1 เดือน)
    // - 1 ปี แต่ไม่ถึง 3 ปี: 90 วัน (3 เดือน)
    // - 3 ปี แต่ไม่ถึง 6 ปี: 180 วัน (6 เดือน)
    // - 6 ปี แต่ไม่ถึง 10 ปี: 240 วัน (8 เดือน)
    // - 10 ปี แต่ไม่ถึง 20 ปี: 300 วัน (10 เดือน)
    // - 20 ปีขึ้นไป: 400 วัน (~13.33 เดือน)
    let severanceDays = 0;
    let tierLabel = 'อายุงานไม่ถึง 120 วัน (ไม่ได้รับเงินชดเชย)';
    let tierDescription = 'ทำงานยังไม่ครบ 120 วัน นายจ้างไม่ต้องจ่ายค่าชดเชยตาม ม.118';

    if (years >= 20) {
        severanceDays = 400;
        tierLabel = 'อายุงาน 20 ปีขึ้นไป (ชดเชย 400 วัน)';
        tierDescription = 'ได้รับค่าชดเชยอัตราสูงสุด 400 วันตามกฎหมายแรงงาน';
    } else if (years >= 10) {
        severanceDays = 300;
        tierLabel = 'อายุงาน 10 ปี แต่ไม่ถึง 20 ปี (ชดเชย 300 วัน)';
        tierDescription = 'ได้รับค่าชดเชย 300 วัน (ประมาณ 10 เดือน)';
    } else if (years >= 6) {
        severanceDays = 240;
        tierLabel = 'อายุงาน 6 ปี แต่ไม่ถึง 10 ปี (ชดเชย 240 วัน)';
        tierDescription = 'ได้รับค่าชดเชย 240 วัน (ประมาณ 8 เดือน)';
    } else if (years >= 3) {
        severanceDays = 180;
        tierLabel = 'อายุงาน 3 ปี แต่ไม่ถึง 6 ปี (ชดเชย 180 วัน)';
        tierDescription = 'ได้รับค่าชดเชย 180 วัน (ประมาณ 6 เดือน)';
    } else if (years >= 1) {
        severanceDays = 90;
        tierLabel = 'อายุงาน 1 ปี แต่ไม่ถึง 3 ปี (ชดเชย 90 วัน)';
        tierDescription = 'ได้รับค่าชดเชย 90 วัน (ประมาณ 3 เดือน)';
    } else if (totalDaysWorked >= 120) {
        severanceDays = 30;
        tierLabel = 'อายุงาน 120 วัน แต่ไม่ถึง 1 ปี (ชดเชย 30 วัน)';
        tierDescription = 'ได้รับค่าชดเชย 30 วัน (ประมาณ 1 เดือน)';
    }

    const severancePay = dailyWage * severanceDays;

    // 2. สินจ้างแทนการบอกกล่าวล่วงหน้า (ค่าตกใจ ม.17)
    // กรณีเลิกจ้างทันทีโดยไม่บอกกล่าวล่วงหน้าตามงวดการจ่ายค่าจ้าง
    const noticeGiven = p.noticeGiven || 'no'; // 'yes' (บอกล่วงหน้าถูกต้อง) | 'no' (เลิกจ้างทันที)
    const noticeMonths = Math.max(0, numberOrDefault(p.noticeMonths, 1));
    const noticePay = noticeGiven === 'no' ? (salaryMonthly * noticeMonths) : 0;

    // 3. ค่าจ้างสำหรับวันหยุดพักผ่อนประจำปีสะสมที่ไม่ได้ใช้ (พักร้อนคงเหลือ)
    const unusedLeaveDays = Math.max(0, numberOrDefault(p.unusedLeaveDays, 0));
    const leavePay = unusedLeaveDays * dailyWage;

    // รวมยอดเงินชดเชยทั้งหมดที่ลูกจ้างต้องได้รับ
    const totalSeverancePackage = severancePay + noticePay + leavePay;

    // 4. สิทธิยกเว้นภาษีเงินได้บุคคลธรรมดา
    // กฎกระทรวงกำหนด: เงินชดเชยตามกฎหมายแรงงานได้รับยกเว้นภาษีสำหรับเงินชดเชย 300 วันสุดท้าย แต่ไม่เกิน 300,000 บาท
    const taxExemptDays = Math.min(severanceDays, 300);
    const taxExemptByDays = dailyWage * taxExemptDays;
    const taxExemptLimit = Math.min(300000, taxExemptByDays);
    const taxExemptAmount = Math.min(severancePay, taxExemptLimit);
    const taxableSeverance = Math.max(0, severancePay - taxExemptAmount) + noticePay + leavePay;

    return {
        salaryMonthly,
        mode,
        startDate,
        endDate,
        serviceYears: years,
        serviceMonths: months,
        serviceDays: days,
        totalDaysWorked,
        dailyWage,
        severanceDays,
        tierLabel,
        tierDescription,
        severancePay,
        noticeGiven,
        noticeMonths,
        noticePay,
        unusedLeaveDays,
        leavePay,
        totalSeverancePackage,
        taxExemptAmount,
        taxableSeverance
    };
}

/* -----------------------------------------------------------
 * PURE ENGINE: คำนวณดอกเบี้ยผิดนัดชำระหนี้ตามกฎหมายใหม่ (Legal Interest)
 * ประมวลกฎหมายแพ่งและพาณิชย์ ม.7 และ ม.224 (ปรับปรุง 2564)
 * ----------------------------------------------------------- */
function calculateLegalInterest(params) {
    const p = params || {};
    const principal = Math.max(0, numberOrDefault(p.principal, 100000));
    const ratePreset = p.ratePreset || 'default_5'; // 'default_5' (5% ม.224) | 'statutory_3' (3% ม.7) | 'custom'
    let interestRate = 5.0;
    if (ratePreset === 'statutory_3') {
        interestRate = 3.0;
    } else if (ratePreset === 'custom') {
        interestRate = Math.max(0, numberOrDefault(p.customRate, 5.0));
    }

    const calcMode = p.calcMode || 'dates'; // 'dates' (ระบุช่วงวันที่) | 'days' (ระบุจำนวนวัน)
    const startDate = p.startDate || formatLocalDate(addCalendarDays(new Date(), -60));
    const endDate = p.endDate || formatLocalDate(new Date());
    let overdueDays = 0;

    if (calcMode === 'dates') {
        const d1 = new Date(startDate + 'T00:00:00');
        const d2 = new Date(endDate + 'T00:00:00');
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
            overdueDays = Math.max(0, Math.round((d2 - d1) / 86400000));
        }
    } else {
        overdueDays = Math.max(0, integerOrDefault(p.overdueDays, 60));
    }

    // การคำนวณดอกเบี้ยรายวันตามเกณฑ์สากลและ ป.พ.พ. (ฐาน 365 วัน)
    // ดอกเบี้ย = เงินต้น * (อัตราดอกเบี้ย / 100) * (จำนวนวันผิดนัด / 365)
    const dailyRate = (interestRate / 100) / 365;
    const dailyInterest = principal * dailyRate;
    const monthlyInterestApprox = dailyInterest * 30;
    const totalInterest = principal * (interestRate / 100) * (overdueDays / 365);
    const totalPayable = principal + totalInterest;

    return {
        principal,
        ratePreset,
        interestRate,
        calcMode,
        startDate,
        endDate,
        overdueDays,
        dailyInterest,
        monthlyInterestApprox,
        totalInterest,
        totalPayable
    };
}

/* -----------------------------------------------------------
 * UI RENDERER: คำนวณเงินชดเชยเลิกจ้าง & ค่าตกใจ (labor_severance)
 * ----------------------------------------------------------- */
function renderLaborSeveranceTool(container) {
    if (!container) return;
    const st = appState.labor_severance = appState.labor_severance || {
        salaryMonthly: '35000',
        mode: 'duration', // 'duration' | 'dates'
        serviceYears: '3',
        serviceMonths: '6',
        serviceDays: '0',
        startDate: formatLocalDate(addCalendarDays(new Date(), -1277)),
        endDate: formatLocalDate(new Date()),
        noticeGiven: 'no', // 'yes' | 'no'
        noticeMonths: '1',
        unusedLeaveDays: '5'
    };

    const calc = calculateLaborSeverance(st);

    container.innerHTML = `
        <div class="legal-labor-tool flex flex-col gap-3 p-1">
            <!-- Mode Switch: Duration vs Dates -->
            <div class="segment-group grid-cols-2 balanced-segment-modes" role="group" aria-label="วิธีระบุอายุงาน">
                <button type="button" aria-pressed="${st.mode === 'duration'}" class="segment-btn ${st.mode === 'duration' ? 'active' : ''}" data-mode="duration">ระบุอายุงาน</button>
                <button type="button" aria-pressed="${st.mode === 'dates'}" class="segment-btn ${st.mode === 'dates' ? 'active' : ''}" data-mode="dates">ระบุช่วงวันที่</button>
            </div>

            <!-- Main Input Form -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)]">
                    ข้อมูลค่าจ้างและอายุงาน
                </div>

                <div>
                    <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">เงินเดือนล่าสุด / ค่าจ้างเฉลี่ย 30 วันสุดท้าย (บาท)</label>
                    <input id="sevSalaryInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.salaryMonthly))}" placeholder="เช่น 35,000" class="airbnb-input w-full text-base font-semibold">
                    <div class="text-[11px] text-[var(--app-muted)] mt-0.5">คิดเป็นค่าจ้างรายวัน: <b>${formatMoney(calc.dailyWage)} บาท/วัน</b> (เงินเดือน ÷ 30)</div>
                </div>

                ${st.mode === 'duration' ? `
                    <div>
                        <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">อายุการทำงานที่ผ่านมา</label>
                        <div class="grid grid-cols-3 gap-2">
                            <div>
                                <span class="text-[11px] text-[var(--app-muted)] block mb-0.5">ปี</span>
                                <input id="sevYearsInput" type="number" min="0" max="60" value="${escapeHTML(st.serviceYears)}" class="airbnb-input w-full text-center font-bold">
                            </div>
                            <div>
                                <span class="text-[11px] text-[var(--app-muted)] block mb-0.5">เดือน</span>
                                <input id="sevMonthsInput" type="number" min="0" max="11" value="${escapeHTML(st.serviceMonths)}" class="airbnb-input w-full text-center font-bold">
                            </div>
                            <div>
                                <span class="text-[11px] text-[var(--app-muted)] block mb-0.5">วัน</span>
                                <input id="sevDaysInput" type="number" min="0" max="30" value="${escapeHTML(st.serviceDays)}" class="airbnb-input w-full text-center font-bold">
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">วันเริ่มงาน</label>
                            <input id="sevStartDateInput" type="date" value="${escapeHTML(st.startDate)}" class="airbnb-input w-full text-xs font-semibold">
                        </div>
                        <div>
                            <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">วันเลิกจ้าง / วันสุดท้าย</label>
                            <input id="sevEndDateInput" type="date" value="${escapeHTML(st.endDate)}" class="airbnb-input w-full text-xs font-semibold">
                        </div>
                    </div>
                    <div class="text-[11px] text-[var(--app-muted)]">
                        คำนวณอายุงานได้: <b>${calc.serviceYears} ปี ${calc.serviceMonths} เดือน ${calc.serviceDays} วัน</b> (รวม ${calc.totalDaysWorked} วัน)
                    </div>
                `}

                <!-- Notice & Vacation Leave -->
                <div class="border-t border-[var(--app-hairline)] pt-3 space-y-3">
                    <div class="text-xs font-bold text-[var(--app-ink)]">
                        สิทธิเพิ่มเติมและวันพักร้อนคงเหลือ
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">การบอกกล่าวล่วงหน้า</label>
                            <select id="sevNoticeSelect" class="airbnb-input w-full text-xs font-semibold">
                                <option value="no" ${st.noticeGiven === 'no' ? 'selected' : ''}>เลิกจ้างทันที (ได้ค่าตกใจ ม.17)</option>
                                <option value="yes" ${st.noticeGiven === 'yes' ? 'selected' : ''}>แจ้งล่วงหน้าถูกต้อง (ไม่ได้ค่าตกใจ)</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">วันพักร้อนคงเหลือ (วัน)</label>
                            <input id="sevLeaveInput" type="number" min="0" max="60" value="${escapeHTML(st.unusedLeaveDays)}" placeholder="0" class="airbnb-input w-full text-xs font-semibold">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Results Card -->
            <div class="themed-result-card theme-result-highlight p-5 space-y-3">
                <div class="flex flex-col items-center gap-2 text-center">
                    <div class="text-xs font-bold text-[var(--app-ink)]">
                        ประมาณการเงินชดเชยและสิทธิรวม
                    </div>
                    <span class="tool-metric-chip max-w-full">${calc.tierLabel}</span>
                </div>

                <div class="themed-result-value text-center text-2xl md:text-3xl font-extrabold" id="sevTotalResult">
                    ${formatMoney(calc.totalSeverancePackage)} บาท
                </div>

            </div>

            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)]">รายละเอียดการคำนวณ</div>
                <div class="space-y-1 text-xs">
                    <div class="flex justify-between gap-3 tool-summary-row py-2">
                        <span class="text-[var(--app-muted)]">1. ค่าชดเชยตามกฎหมาย ม.118 (${calc.severanceDays} วัน):</span>
                        <b class="font-bold text-[var(--app-ink)]">${formatMoney(calc.severancePay)} บาท</b>
                    </div>
                    <div class="flex justify-between gap-3 tool-summary-row py-2">
                        <span class="text-[var(--app-muted)]">2. ค่าบอกกล่าวล่วงหน้า (ค่าตกใจ ม.17):</span>
                        <b class="font-semibold text-[var(--app-ink)]">${calc.noticePay > 0 ? `+${formatMoney(calc.noticePay)} บาท` : '0.00 บาท'}</b>
                    </div>
                    <div class="flex justify-between gap-3 tool-summary-row py-2">
                        <span class="text-[var(--app-muted)]">3. ค่าจ้างวันหยุดพักผ่อนคงเหลือ (${calc.unusedLeaveDays} วัน):</span>
                        <b class="font-semibold text-[var(--app-ink)]">${calc.leavePay > 0 ? `+${formatMoney(calc.leavePay)} บาท` : '0.00 บาท'}</b>
                    </div>
                    <div class="flex justify-between gap-3 tool-summary-row py-2 border-t border-dashed border-[var(--app-hairline)]">
                        <span class="text-[var(--app-ink)] font-medium">สิทธิยกเว้นภาษีเงินได้ (ตามกฎกระทรวง):</span>
                        <b class="font-bold text-[var(--app-ink)]">ยกเว้น ${formatMoney(calc.taxExemptAmount)} บาท</b>
                    </div>
                    <div class="text-[10px] text-[var(--app-muted)]">
                        *เงินชดเชยตามกฎหมายได้รับยกเว้นภาษีสำหรับ 300 วันสุดท้ายแต่ไม่เกิน 300,000 บาท ส่วนที่เหลือ (${formatMoney(calc.taxableSeverance)} บ.) นำไปคำนวณภาษีเงินได้ตามปกติ
                    </div>
                </div>

                <div class="flex justify-end pt-1">
                    <button id="btnPrintSeveranceSummary" type="button" class="tool-action-btn text-xs">
                        พิมพ์เอกสารสรุปเงินชดเชยเลิกจ้าง / PDF
                    </button>
                </div>
            </div>
        </div>
    `;

    // Event Bindings
    container.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.mode = btn.dataset.mode;
            persistAppState();
            renderActiveTool();
        });
    });

    const bindInput = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', e => {
            st[key] = e.target.value;
            persistAppState();
            const liveCalc = calculateLaborSeverance(st);
            const resEl = document.getElementById('sevTotalResult');
            if (resEl) resEl.textContent = `${formatMoney(liveCalc.totalSeverancePackage)} บาท`;
        });
        el.addEventListener('blur', () => {
            if (key === 'salaryMonthly') {
                const formatted = formatInputDisplay(el.value);
                st[key] = formatted;
                el.value = formatted;
            }
            persistAppState();
            renderActiveTool();
        });
    };

    bindInput('sevSalaryInput', 'salaryMonthly');
    bindInput('sevYearsInput', 'serviceYears');
    bindInput('sevMonthsInput', 'serviceMonths');
    bindInput('sevDaysInput', 'serviceDays');
    bindInput('sevStartDateInput', 'startDate');
    bindInput('sevEndDateInput', 'endDate');
    bindInput('sevLeaveInput', 'unusedLeaveDays');

    document.getElementById('sevNoticeSelect')?.addEventListener('change', e => {
        st.noticeGiven = e.target.value;
        persistAppState();
        renderActiveTool();
    });

    container.querySelector('#btnPrintSeveranceSummary')?.addEventListener('click', () => {
        triggerPrintReceipt('labor_severance');
    });

    setStatusBanner('success', `เงินชดเชยและสิทธิเลิกจ้าง (${calc.tierLabel}): <b class="text-[var(--app-accent)]">${formatMoney(calc.totalSeverancePackage)} บาท</b> (ยกเว้นภาษี ${formatMoney(calc.taxExemptAmount)} บ.)`);
}

/* -----------------------------------------------------------
 * UI RENDERER: คำนวณดอกเบี้ยผิดนัดชำระหนี้ ป.พ.พ. 5% (legal_interest)
 * ----------------------------------------------------------- */
function renderLegalInterestTool(container) {
    if (!container) return;
    const st = appState.legal_interest = appState.legal_interest || {
        principal: '100000',
        ratePreset: 'default_5', // 'default_5' (5% ม.224) | 'statutory_3' (3% ม.7) | 'custom'
        customRate: '5.0',
        calcMode: 'dates', // 'dates' | 'days'
        startDate: formatLocalDate(addCalendarDays(new Date(), -90)),
        endDate: formatLocalDate(new Date()),
        overdueDays: '90'
    };

    const calc = calculateLegalInterest(st);

    container.innerHTML = `
        <div class="legal-labor-tool flex flex-col gap-3 p-1">
            <!-- Rate Presets Segment -->
            <div class="segment-group grid-cols-3 balanced-segment-modes" role="group" aria-label="อัตราดอกเบี้ยตามกฎหมาย">
                <button type="button" aria-pressed="${st.ratePreset === 'default_5'}" class="segment-btn ${st.ratePreset === 'default_5' ? 'active' : ''}" data-rate="default_5">ผิดนัด 5% (ม.224)</button>
                <button type="button" aria-pressed="${st.ratePreset === 'statutory_3'}" class="segment-btn ${st.ratePreset === 'statutory_3' ? 'active' : ''}" data-rate="statutory_3">กฎหมาย 3% (ม.7)</button>
                <button type="button" aria-pressed="${st.ratePreset === 'custom'}" class="segment-btn ${st.ratePreset === 'custom' ? 'active' : ''}" data-rate="custom">กำหนดเอง</button>
            </div>

            <!-- Main Input Form -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)]">
                    ข้อมูลหนี้และอัตราดอกเบี้ย
                </div>

                <div>
                    <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">ยอดเงินต้นที่ผิดนัดชำระ (บาท)</label>
                    <input id="legPrincipalInput" type="text" inputmode="decimal" value="${escapeHTML(formatInputDisplay(st.principal))}" placeholder="เช่น 100,000" class="airbnb-input w-full text-base font-semibold">
                </div>

                ${st.ratePreset === 'custom' ? `
                    <div>
                        <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">อัตราดอกเบี้ยต่อปี (% ต่อปี)</label>
                        <input id="legCustomRateInput" type="number" step="0.1" min="0" max="100" value="${escapeHTML(st.customRate)}" class="airbnb-input w-full text-sm font-semibold">
                    </div>
                ` : `
                    <div class="p-2.5 rounded-lg bg-[var(--app-surface-soft)] text-xs text-[var(--app-muted)] border border-[var(--app-hairline)]">
                        อัตราดอกเบี้ยที่ใช้: <b class="text-[var(--app-ink)]">${calc.interestRate}% ต่อปี</b>
                        ${st.ratePreset === 'default_5' ? '(อัตราตาม ป.พ.พ. ม.224 ใหม่ = อัตราตาม ม.7 บวก 2%)' : '(อัตราดอกเบี้ยที่มิได้กำหนดไว้ในนิติกรรม ป.พ.พ. ม.7)'}
                    </div>
                `}

                <!-- Overdue Period Mode -->
                <div class="border-t border-[var(--app-hairline)] pt-3 space-y-2">
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-bold text-[var(--app-ink)]">ระยะเวลาผิดนัดชำระ</label>
                        <div class="grid grid-cols-2 gap-2 text-[11px]" role="group" aria-label="วิธีระบุระยะเวลาผิดนัด">
                            <button type="button" class="tool-chip-btn" aria-pressed="${st.calcMode === 'dates'}" data-calcmode="dates">เลือกช่วงวันที่</button>
                            <button type="button" class="tool-chip-btn" aria-pressed="${st.calcMode === 'days'}" data-calcmode="days">ระบุจำนวนวัน</button>
                        </div>
                    </div>

                    ${st.calcMode === 'dates' ? `
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <span class="text-[11px] text-[var(--app-muted)] block mb-0.5">วันครบกำหนดชำระ (เริ่มผิดนัด)</span>
                                <input id="legStartDateInput" type="date" value="${escapeHTML(st.startDate)}" class="airbnb-input w-full text-xs font-semibold">
                            </div>
                            <div>
                                <span class="text-[11px] text-[var(--app-muted)] block mb-0.5">วันชำระจริง / วันปัจจุบัน</span>
                                <input id="legEndDateInput" type="date" value="${escapeHTML(st.endDate)}" class="airbnb-input w-full text-xs font-semibold">
                            </div>
                        </div>
                        <div class="text-[11px] text-[var(--app-muted)]">
                            คำนวณจำนวนวันที่ผิดนัด: <b class="text-[var(--app-ink)]">${calc.overdueDays} วัน</b>
                        </div>
                    ` : `
                        <div>
                            <span class="text-[11px] text-[var(--app-muted)] block mb-0.5">จำนวนวันผิดนัดชำระจริง (วัน)</span>
                            <input id="legDaysInput" type="number" min="1" max="10000" value="${escapeHTML(st.overdueDays)}" class="airbnb-input w-full text-sm font-semibold">
                        </div>
                    `}
                </div>
            </div>

            <!-- Results Card -->
            <div class="themed-result-card theme-result-highlight p-5 space-y-3">
                <div class="flex flex-col items-center gap-2 text-center">
                    <div class="text-xs font-bold text-[var(--app-ink)]">
                        ยอดชำระรวมเงินต้นและดอกเบี้ย
                    </div>
                    <span class="tool-metric-chip max-w-full">${calc.overdueDays} วัน (${calc.interestRate}%)</span>
                </div>

                <div class="themed-result-value text-center text-2xl md:text-3xl font-extrabold" id="legTotalResult">
                    ${formatMoney(calc.totalPayable)} บาท
                </div>

            </div>

            <div class="themed-tool-card p-4 space-y-3">
                <div class="text-xs font-bold text-[var(--app-ink)]">รายละเอียดการคำนวณ</div>
                <div class="space-y-1 text-xs">
                    <div class="flex justify-between gap-3 tool-summary-row py-2">
                        <span class="text-[var(--app-muted)]">เงินต้นที่ค้างชำระ:</span>
                        <b class="font-bold text-[var(--app-ink)]">${formatMoney(calc.principal)} บาท</b>
                    </div>
                    <div class="flex justify-between gap-3 tool-summary-row py-2">
                        <span class="text-[var(--app-muted)]">ดอกเบี้ยผิดนัดชำระรวม (${calc.overdueDays} วัน):</span>
                        <b class="font-bold text-[var(--app-ink)]">+${formatMoney(calc.totalInterest)} บาท</b>
                    </div>
                    <div class="flex justify-between gap-3 tool-summary-row py-2">
                        <span class="text-[var(--app-muted)]">เฉลี่ยดอกเบี้ยต่อวัน:</span>
                        <span class="text-[var(--app-ink)]">${formatMoney(calc.dailyInterest)} บาท/วัน</span>
                    </div>
                    <div class="flex justify-between gap-3 tool-summary-row py-2">
                        <span class="text-[var(--app-muted)]">ประมาณการดอกเบี้ยต่อเดือน (30 วัน):</span>
                        <span class="text-[var(--app-ink)]">${formatMoney(calc.monthlyInterestApprox)} บาท/เดือน</span>
                    </div>
                    <div class="text-[10px] text-[var(--app-muted)] pt-1">
                        *หมายเหตุตาม ป.พ.พ. ม.224/1: การคิดดอกเบี้ยผิดนัดในหนี้ผ่อนส่งเป็นงวด ห้ามคิดดอกเบี้ยจากเงินต้นงวดที่ยังไม่ถึงกำหนดชำระ
                    </div>
                </div>

                <div class="flex justify-end pt-1">
                    <button id="btnPrintLegalInterestSummary" type="button" class="tool-action-btn text-xs">
                        พิมพ์เอกสารคำนวณดอกเบี้ยผิดนัด / PDF
                    </button>
                </div>
            </div>
        </div>
    `;

    // Event Bindings
    container.querySelectorAll('[data-rate]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.ratePreset = btn.dataset.rate;
            persistAppState();
            renderActiveTool();
        });
    });

    container.querySelectorAll('[data-calcmode]').forEach(btn => {
        btn.addEventListener('click', () => {
            st.calcMode = btn.dataset.calcmode;
            persistAppState();
            renderActiveTool();
        });
    });

    const bindInput = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', e => {
            st[key] = e.target.value;
            persistAppState();
            const liveCalc = calculateLegalInterest(st);
            const resEl = document.getElementById('legTotalResult');
            if (resEl) resEl.textContent = `${formatMoney(liveCalc.totalPayable)} บาท`;
        });
        el.addEventListener('blur', () => {
            if (key === 'principal') {
                const formatted = formatInputDisplay(el.value);
                st[key] = formatted;
                el.value = formatted;
            }
            persistAppState();
            renderActiveTool();
        });
    };

    bindInput('legPrincipalInput', 'principal');
    bindInput('legCustomRateInput', 'customRate');
    bindInput('legStartDateInput', 'startDate');
    bindInput('legEndDateInput', 'endDate');
    bindInput('legDaysInput', 'overdueDays');

    container.querySelector('#btnPrintLegalInterestSummary')?.addEventListener('click', () => {
        triggerPrintReceipt('legal_interest');
    });

    setStatusBanner('success', `ดอกเบี้ยผิดนัดชำระ (${calc.interestRate}% ต่อปี ${calc.overdueDays} วัน): <b class="text-[var(--app-accent)] font-bold">+${formatMoney(calc.totalInterest)} บาท</b> (ยอดหนี้รวม ${formatMoney(calc.totalPayable)} บ.)`);
}

/* -----------------------------------------------------------
 * PURE ENGINE: คำนวณค่าล่วงเวลา (OT) & ค่าทำงานในวันหยุด (ม.61, ม.62, ม.63)
 * พ.ร.บ. คุ้มครองแรงงาน พ.ศ. 2541
 * ----------------------------------------------------------- */
function calculateOvertimePay(params) {
    const p = params || {};
    const wageType = p.wageType || 'monthly'; // 'monthly' | 'daily' | 'hourly'
    const wageBase = Math.max(0, numberOrDefault(p.wageBase, wageType === 'monthly' ? 25000 : (wageType === 'daily' ? 500 : 65)));
    const workHoursPerDay = Math.max(1, Math.min(24, numberOrDefault(p.workHoursPerDay, 8)));
    const workDaysPerMonth = Math.max(1, Math.min(31, numberOrDefault(p.workDaysPerMonth, 30))); // ฐาน 30 วันตามกฎหมายแรงงานสำหรับพนักงานรายเดือน

    // 1. คำนวณอัตราค่าจ้างรายชั่วโมง (Base Hourly Rate)
    let dailyRate = 0;
    let hourlyRate = 0;
    if (wageType === 'monthly') {
        dailyRate = wageBase / workDaysPerMonth;
        hourlyRate = dailyRate / workHoursPerDay;
    } else if (wageType === 'daily') {
        dailyRate = wageBase;
        hourlyRate = dailyRate / workHoursPerDay;
    } else { // hourly
        hourlyRate = wageBase;
        dailyRate = hourlyRate * workHoursPerDay;
    }

    // 2. อัตราตามกฎหมายแรงงาน (ม.61, ม.62, ม.63)
    // ม.61: OT วันทำงานปกติ = 1.5 เท่า
    const rate1_5 = hourlyRate * 1.5;

    // ม.62: ทำงานในวันหยุดตามเวลาทำงานปกติ
    // - ลูกจ้างรายเดือน: ได้รับเพิ่ม 1 เท่า (เนื่องจากได้รับเงินเดือนในวันหยุดอยู่แล้ว)
    // - ลูกจ้างรายวัน: ได้รับ 2 เท่า (เนื่องจากไม่ได้รับค่าจ้างในวันหยุด)
    const holidayMultiplier = wageType === 'monthly' ? 1.0 : 2.0;
    const rateHolidayWork = hourlyRate * holidayMultiplier;

    // ม.63: OT ในวันหยุด (ทำงานล่วงเวลาเกินเวลาปกติ 8 ชม. ในวันหยุด) = 3 เท่า
    const rate3_0 = hourlyRate * 3.0;

    // 3. ชั่วโมงที่ทำงาน
    const otWeekdayHours = Math.max(0, numberOrDefault(p.otWeekdayHours, 10));
    const holidayWorkHours = Math.max(0, numberOrDefault(p.holidayWorkHours, 8));
    const holidayOtHours = Math.max(0, numberOrDefault(p.holidayOtHours, 4));
    const shiftAllowance = Math.max(0, numberOrDefault(p.shiftAllowance, 0));

    // คำนวณยอดเงินแต่ละส่วน
    const otWeekdayPay = otWeekdayHours * rate1_5;
    const holidayWorkPay = holidayWorkHours * rateHolidayWork;
    const holidayOtPay = holidayOtHours * rate3_0;

    // รวมยอดเงิน OT และเงินพิเศษ
    const totalOtPay = otWeekdayPay + holidayWorkPay + holidayOtPay + shiftAllowance;
    const totalHours = otWeekdayHours + holidayWorkHours + holidayOtHours;

    // ประมาณการเงินเดือน/ค่าจ้างฐานประจำเดือน
    const basePayMonthly = wageType === 'monthly' ? wageBase : (dailyRate * 26);
    const totalEarnings = basePayMonthly + totalOtPay;

    return {
        wageType,
        wageBase,
        workHoursPerDay,
        workDaysPerMonth,
        dailyRate,
        hourlyRate,
        rate1_5,
        rateHolidayWork,
        holidayMultiplier,
        rate3_0,
        otWeekdayHours,
        holidayWorkHours,
        holidayOtHours,
        shiftAllowance,
        otWeekdayPay,
        holidayWorkPay,
        holidayOtPay,
        totalOtPay,
        totalHours,
        basePayMonthly,
        totalEarnings
    };
}

/* -----------------------------------------------------------
 * UI RENDERER: คำนวณค่าล่วงเวลา OT & ค่าทำงานวันหยุด (ot_calc)
 * ----------------------------------------------------------- */
function renderOvertimeTool(container) {
    if (!container) return;
    if (!appState.ot_calc) {
        appState.ot_calc = {
            wageType: 'monthly',
            wageBase: '25000',
            workHoursPerDay: '8',
            otWeekdayHours: '10',
            holidayWorkHours: '8',
            holidayOtHours: '4',
            shiftAllowance: '0'
        };
    }
    const st = appState.ot_calc;
    const calc = calculateOvertimePay(st);

    container.innerHTML = `
        <div class="finance-thai-tool flex flex-col gap-4 p-1">
            <!-- 1. Wage Type Selector -->
            <div class="segment-group grid-cols-3 balanced-segment-modes">
                <button type="button" class="segment-btn ot-type-btn ${st.wageType === 'monthly' ? 'active' : ''}" data-type="monthly">
                    💼 พนักงานรายเดือน
                </button>
                <button type="button" class="segment-btn ot-type-btn ${st.wageType === 'daily' ? 'active' : ''}" data-type="daily">
                    ⏱️ พนักงานรายวัน
                </button>
                <button type="button" class="segment-btn ot-type-btn ${st.wageType === 'hourly' ? 'active' : ''}" data-type="hourly">
                    ⌛ รายชั่วโมง
                </button>
            </div>

            <!-- 2. Base Wage Input Card -->
            <div class="themed-tool-card p-4 space-y-3">
                <div class="font-bold text-sm text-[var(--app-ink)] flex items-center justify-between">
                    <span>1. ข้อมูลฐานค่าจ้าง (Base Wage)</span>
                    <span class="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--app-accent-soft)] text-[var(--app-ink)]">
                        อัตราคิดฐาน ${formatMoney(calc.hourlyRate)} บ./ชม.
                    </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">
                            ${st.wageType === 'monthly' ? 'เงินเดือนฐาน (บาท/เดือน)' : (st.wageType === 'daily' ? 'ค่าจ้างรายวัน (บาท/วัน)' : 'ค่าจ้างรายชั่วโมง (บาท/ชม.)')}
                        </label>
                        <div class="relative">
                            <input id="otWageBaseInput" type="text" inputmode="decimal" value="${formatInputDisplay(st.wageBase)}" placeholder="เช่น 25,000" class="airbnb-input w-full pr-12 text-sm font-semibold">
                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--app-muted)]">บาท</span>
                        </div>
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">
                            ชั่วโมงทำงานปกติใน 1 วัน
                        </label>
                        <div class="relative">
                            <input id="otWorkHoursInput" type="number" min="1" max="24" value="${st.workHoursPerDay || '8'}" class="airbnb-input w-full pr-14 text-sm font-semibold">
                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--app-muted)]">ชม./วัน</span>
                        </div>
                    </div>
                </div>

                <div class="text-[11px] text-[var(--app-muted)] pt-1 flex items-center gap-1.5">
                    <span>ℹ️ เกณฑ์กฎหมายแรงงาน:</span>
                    <span>รายวัน = ${formatMoney(calc.dailyRate)} บ. | ต่อชั่วโมง = <b>${formatMoney(calc.hourlyRate)} บ.</b></span>
                </div>
            </div>

            <!-- 3. OT Hours Input Card -->
            <div class="themed-tool-card p-4 space-y-4">
                <div class="font-bold text-sm text-[var(--app-ink)] flex items-center justify-between">
                    <span>2. บันทึกจำนวนชั่วโมงล่วงเวลา & วันหยุด</span>
                    <span class="text-xs text-[var(--app-muted)]">รวม ${formatNum(calc.totalHours, 1)} ชั่วโมง</span>
                </div>

                <!-- Section 61: OT Weekday (1.5x) -->
                <div class="p-3 rounded-lg border border-[var(--app-hairline)] bg-[var(--app-surface-soft)] space-y-2">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="font-semibold text-xs text-[var(--app-ink)]">ล่วงเวลาวันทำงานปกติ (OT 1.5 เท่า)</span>
                            <span class="text-[11px] text-[var(--app-muted)] block">พ.ร.บ. คุ้มครองแรงงาน ม.61</span>
                        </div>
                        <span class="text-xs font-bold text-[var(--app-accent)]">+${formatMoney(calc.rate1_5)} บ./ชม.</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="relative flex-1">
                            <input id="otWeekdayHoursInput" type="number" min="0" step="0.5" value="${st.otWeekdayHours || '0'}" class="airbnb-input w-full pr-12 text-sm font-semibold">
                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--app-muted)]">ชม.</span>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                            <button type="button" class="tool-chip-btn text-xs px-2 py-1 ot-add-btn" data-target="otWeekdayHoursInput" data-add="1">+1</button>
                            <button type="button" class="tool-chip-btn text-xs px-2 py-1 ot-add-btn" data-target="otWeekdayHoursInput" data-add="2">+2</button>
                            <button type="button" class="tool-chip-btn text-xs px-2 py-1 ot-add-btn" data-target="otWeekdayHoursInput" data-add="4">+4</button>
                        </div>
                    </div>
                    <div class="text-right text-xs font-semibold text-[var(--app-ink)]">
                        รวมยอด ม.61: <b class="text-[var(--app-accent)]">${formatMoney(calc.otWeekdayPay)}</b> บาท
                    </div>
                </div>

                <!-- Section 62: Holiday Work (1x or 2x) -->
                <div class="p-3 rounded-lg border border-[var(--app-hairline)] bg-[var(--app-surface-soft)] space-y-2">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="font-semibold text-xs text-[var(--app-ink)]">ทำงานในวันหยุดตามเวลาปกติ (${calc.holidayMultiplier} เท่า)</span>
                            <span class="text-[11px] text-[var(--app-muted)] block">พ.ร.บ. คุ้มครองแรงงาน ม.62 (${st.wageType === 'monthly' ? 'รายเดือนได้เพิ่ม 1 เท่า' : 'รายวันได้ 2 เท่า'})</span>
                        </div>
                        <span class="text-xs font-bold text-[var(--app-accent)]">+${formatMoney(calc.rateHolidayWork)} บ./ชม.</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="relative flex-1">
                            <input id="otHolidayWorkHoursInput" type="number" min="0" step="0.5" value="${st.holidayWorkHours || '0'}" class="airbnb-input w-full pr-12 text-sm font-semibold">
                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--app-muted)]">ชม.</span>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                            <button type="button" class="tool-chip-btn text-xs px-2 py-1 ot-add-btn" data-target="otHolidayWorkHoursInput" data-add="4">+4</button>
                            <button type="button" class="tool-chip-btn text-xs px-2 py-1 ot-add-btn" data-target="otHolidayWorkHoursInput" data-add="8">+8</button>
                        </div>
                    </div>
                    <div class="text-right text-xs font-semibold text-[var(--app-ink)]">
                        รวมยอด ม.62: <b class="text-[var(--app-accent)]">${formatMoney(calc.holidayWorkPay)}</b> บาท
                    </div>
                </div>

                <!-- Section 63: Holiday OT (3.0x) -->
                <div class="p-3 rounded-lg border border-[var(--app-hairline)] bg-[var(--app-surface-soft)] space-y-2">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="font-semibold text-xs text-[var(--app-ink)]">ล่วงเวลาในวันหยุดเกินเวลาปกติ (OT 3 เท่า)</span>
                            <span class="text-[11px] text-[var(--app-muted)] block">พ.ร.บ. คุ้มครองแรงงาน ม.63 (ทำเกิน 8 ชม. ในวันหยุด)</span>
                        </div>
                        <span class="text-xs font-bold text-[var(--app-accent)]">+${formatMoney(calc.rate3_0)} บ./ชม.</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="relative flex-1">
                            <input id="otHolidayOtHoursInput" type="number" min="0" step="0.5" value="${st.holidayOtHours || '0'}" class="airbnb-input w-full pr-12 text-sm font-semibold">
                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--app-muted)]">ชม.</span>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                            <button type="button" class="tool-chip-btn text-xs px-2 py-1 ot-add-btn" data-target="otHolidayOtHoursInput" data-add="1">+1</button>
                            <button type="button" class="tool-chip-btn text-xs px-2 py-1 ot-add-btn" data-target="otHolidayOtHoursInput" data-add="2">+2</button>
                            <button type="button" class="tool-chip-btn text-xs px-2 py-1 ot-add-btn" data-target="otHolidayOtHoursInput" data-add="4">+4</button>
                        </div>
                    </div>
                    <div class="text-right text-xs font-semibold text-[var(--app-ink)]">
                        รวมยอด ม.63: <b class="text-[var(--app-accent)]">${formatMoney(calc.holidayOtPay)}</b> บาท
                    </div>
                </div>

                <!-- Shift Allowance -->
                <div class="pt-1">
                    <label class="text-xs font-semibold text-[var(--app-muted)] block mb-1">
                        เงินค่ากะ / เบี้ยเลี้ยงพิเศษอื่นๆ (ถ้ามี)
                    </label>
                    <div class="relative">
                        <input id="otAllowanceInput" type="text" inputmode="decimal" value="${formatInputDisplay(st.shiftAllowance)}" placeholder="0" class="airbnb-input w-full pr-12 text-sm">
                        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--app-muted)]">บาท</span>
                    </div>
                </div>
            </div>

            <!-- 4. Result Highlight Card -->
            <div class="themed-result-card theme-result-highlight p-5 text-center space-y-1">
                <div class="text-xs font-semibold text-[var(--app-muted)]">รวมค่าล่วงเวลาและค่าทำงานวันหยุดสุทธิ</div>
                <div class="themed-result-value text-2xl md:text-3xl font-extrabold text-[var(--app-accent)]">
                    +${formatMoney(calc.totalOtPay)} บาท
                </div>
                <div class="text-xs text-[var(--app-body)] font-medium">
                    (รวมเงินได้ทั้งหมดประจำงวด: <b>${formatMoney(calc.totalEarnings)}</b> บาท)
                </div>
            </div>

            <!-- 5. Breakdown Summary Table -->
            <div class="themed-tool-card p-4 space-y-1 text-xs">
                <div class="font-bold text-[var(--app-ink)] mb-1">สรุปแจกแจงสิทธิประโยชน์ตามกฎหมายแรงงาน</div>
                
                <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                    <span class="text-[var(--app-muted)]">ฐานค่าจ้างเฉลี่ยต่อชั่วโมง (หาร 30 วัน/8 ชม.)</span>
                    <b>${formatMoney(calc.hourlyRate)} บาท/ชม.</b>
                </div>
                <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                    <span class="text-[var(--app-muted)]">OT วันทำงานปกติ ม.61 (1.5 เท่า × ${calc.otWeekdayHours} ชม.)</span>
                    <b class="text-[var(--app-ink)]">+${formatMoney(calc.otWeekdayPay)} บาท</b>
                </div>
                <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                    <span class="text-[var(--app-muted)]">ทำงานในวันหยุด ม.62 (${calc.holidayMultiplier} เท่า × ${calc.holidayWorkHours} ชม.)</span>
                    <b class="text-[var(--app-ink)]">+${formatMoney(calc.holidayWorkPay)} บาท</b>
                </div>
                <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                    <span class="text-[var(--app-muted)]">OT ในวันหยุด ม.63 (3.0 เท่า × ${calc.holidayOtHours} ชม.)</span>
                    <b class="text-[var(--app-ink)]">+${formatMoney(calc.holidayOtPay)} บาท</b>
                </div>
                ${calc.shiftAllowance > 0 ? `
                    <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)]">
                        <span class="text-[var(--app-muted)]">เงินค่ากะ / เบี้ยเลี้ยงพิเศษ</span>
                        <b>+${formatMoney(calc.shiftAllowance)} บาท</b>
                    </div>
                ` : ''}
                <div class="tool-summary-row flex justify-between gap-3 py-2 border-b border-[var(--app-hairline)] font-bold text-sm">
                    <span class="text-[var(--app-ink)]">รวมเงินค่าล่วงเวลาทั้งหมด</span>
                    <b class="text-[var(--app-accent)]">+${formatMoney(calc.totalOtPay)} บาท</b>
                </div>

                <div class="flex justify-end pt-2">
                    <button id="btnPrintOvertimeSummary" type="button" class="tool-action-btn text-xs">
                        พิมพ์ใบสรุปค่าล่วงเวลา / PDF
                    </button>
                </div>
            </div>
        </div>
    `;

    // Event Bindings
    container.querySelectorAll('.ot-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            st.wageType = btn.dataset.type;
            if (st.wageType === 'daily' && numberOrDefault(st.wageBase, 0) > 3000) {
                st.wageBase = '500';
            } else if (st.wageType === 'hourly' && numberOrDefault(st.wageBase, 0) > 500) {
                st.wageBase = '65';
            } else if (st.wageType === 'monthly' && numberOrDefault(st.wageBase, 0) < 1000) {
                st.wageBase = '25000';
            }
            persistAppState();
            renderActiveTool();
        });
    });

    container.querySelectorAll('.ot-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const addVal = parseFloat(btn.dataset.add) || 0;
            const input = container.querySelector('#' + targetId);
            if (input) {
                const cur = parseFloat(input.value) || 0;
                input.value = String(Math.max(0, cur + addVal));
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    });

    const bindInput = (id, key, isMoney = false) => {
        const el = container.querySelector('#' + id);
        if (!el) return;
        el.addEventListener('input', () => {
            st[key] = isMoney ? el.value.replace(/,/g, '') : el.value;
            persistAppState();
            const liveCalc = calculateOvertimePay(st);
            const resVal = container.querySelector('.themed-result-value');
            if (resVal) resVal.textContent = `+${formatMoney(liveCalc.totalOtPay)} บาท`;
            setStatusBanner('success', `ค่าล่วงเวลา OT (${formatNum(liveCalc.totalHours, 1)} ชม.): <b class="text-[var(--app-accent)] font-bold">+${formatMoney(liveCalc.totalOtPay)} บาท</b> (ยอดรวมทั้งสิ้น ${formatMoney(liveCalc.totalEarnings)} บ.)`);
        });
        el.addEventListener('blur', () => {
            if (isMoney) {
                const formatted = formatInputDisplay(el.value);
                st[key] = formatted;
                el.value = formatted;
            }
            persistAppState();
            renderActiveTool();
        });
    };

    bindInput('otWageBaseInput', 'wageBase', true);
    bindInput('otWorkHoursInput', 'workHoursPerDay');
    bindInput('otWeekdayHoursInput', 'otWeekdayHours');
    bindInput('otHolidayWorkHoursInput', 'holidayWorkHours');
    bindInput('otHolidayOtHoursInput', 'holidayOtHours');
    bindInput('otAllowanceInput', 'shiftAllowance', true);

    container.querySelector('#btnPrintOvertimeSummary')?.addEventListener('click', () => {
        triggerPrintReceipt('ot_calc');
    });

    setStatusBanner('success', `ค่าล่วงเวลา OT (${formatNum(calc.totalHours, 1)} ชม.): <b class="text-[var(--app-accent)] font-bold">+${formatMoney(calc.totalOtPay)} บาท</b> (ยอดรวมทั้งสิ้น ${formatMoney(calc.totalEarnings)} บ.)`);
}

// Module export definitions
(function(root) {
    const exportsObj = {
        calculateLaborSeverance,
        calculateLegalInterest,
        calculateOvertimePay,
        renderLaborSeveranceTool,
        renderLegalInterestTool,
        renderOvertimeTool
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);

