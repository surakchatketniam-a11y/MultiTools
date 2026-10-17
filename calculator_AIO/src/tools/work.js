// ==============================================================
// Multitools Calculator - Time & Office Tools
// (date_work, date_calc, world_time, gpa)
// ==============================================================

/* -----------------------------------------------------------
 * TOOL: นับวันทำการ (Workday / SLA Calculator)
 * ----------------------------------------------------------- */
function renderWorkdayTool(container) {
    const st = appState.date_work;
    const originalDays = JSON.stringify(st.workDays);
    st.workDays = normalizeWorkDays(st.workDays);
    const recoveredDays = originalDays !== JSON.stringify(st.workDays);
    if (recoveredDays) persistAppState();
    if (typeof st.includeThaiHolidays !== 'boolean') st.includeThaiHolidays = true;
    const start = new Date(st.startDate + 'T00:00:00');
    const end = new Date(st.endDate + 'T00:00:00');
    const customHolidayDays = new Set(String(st.customHolidays || '').split(',').map(value => parseDateInputThai(value.trim(), st.calendarEra)).filter(Boolean));
    const isWorkday = (date) => {
        const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return st.workDays.includes(date.getDay()) && !(st.includeThaiHolidays && isThaiOfficialHoliday(date)) && !customHolidayDays.has(iso);
    };
    let result = 0, target = new Date(NaN), calculationError = '';
    try {
        if (st.mode === 'between') result = countWorkingDays(start, end, isWorkday);
        else target = offsetWorkingDays(start, integerOrDefault(st.offset, 0), isWorkday);
    } catch (error) { calculationError = error.message; }
    container.innerHTML = `<div class="flex flex-col gap-3 p-1"><div class="segment-group grid-cols-2 balanced-segment-modes"><button class="segment-btn work-mode ${st.mode === 'between' ? 'active' : ''}" data-mode="between">นับวันทำการ</button><button class="segment-btn work-mode ${st.mode === 'add' ? 'active' : ''}" data-mode="add">เพิ่ม/ลดวันทำการ</button></div><div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-3" style="box-shadow:var(--app-elevation)"><div><label class="text-xs font-semibold text-[#6a6a6a] block mb-1">วันที่เริ่มต้น</label><input id="workStart" type="date" value="${st.startDate}" class="airbnb-input w-full"></div>${st.mode === 'between' ? `<div><label class="text-xs font-semibold text-[#6a6a6a] block mb-1">วันที่สิ้นสุด</label><input id="workEnd" type="date" value="${st.endDate}" class="airbnb-input w-full"></div>` : `<div><label class="text-xs font-semibold text-[#6a6a6a] block mb-1">จำนวนวันทำการ (+/-)</label><input id="workOffset" type="number" value="${st.offset}" class="airbnb-input w-full"></div>`}</div><div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-5 text-center" style="box-shadow:var(--app-elevation)"><div class="text-xs text-[#6a6a6a]">${st.mode === 'between' ? 'วันทำการทั้งหมด' : 'วันที่ได้ผลลัพธ์'}</div><div class="text-2xl font-bold text-[var(--app-accent)]">${st.mode === 'between' ? result.toLocaleString('th-TH') + ' วัน' : formatThaiDate(formatLocalDate(target))}</div></div></div>`;
    const workEraBar = document.createElement('div');
    workEraBar.className = 'segment-group grid-cols-2 balanced-segment-modes';
    workEraBar.innerHTML = `<button class="segment-btn work-era ${st.calendarEra === 'BE' ? 'active' : ''}" data-era="BE">พ.ศ.</button><button class="segment-btn work-era ${st.calendarEra === 'CE' ? 'active' : ''}" data-era="CE">ค.ศ.</button>`;
    container.querySelector('.work-mode').parentElement.insertAdjacentElement('afterend', workEraBar);
    container.querySelector('.work-mode').parentElement.insertAdjacentHTML('beforeend', `<button class="segment-btn work-mode ${st.mode === 'sla' ? 'active' : ''}" data-mode="sla">กำหนดวันครบกำหนด / SLA</button><button class="segment-btn work-mode ${st.mode === 'list' ? 'active' : ''}" data-mode="list">แสดงรายการวันทำการ</button>`);
    if (st.mode === 'list') {
        const listCount = calculationError ? 0 : Math.min(Math.abs(integerOrDefault(st.offset, 0)), 100);
        const direction = (integerOrDefault(st.offset, 0)) >= 0 ? 1 : -1;
        const dates = [];
        const cursor = new Date(start);
        let searched = 0;
        while (dates.length < listCount && searched++ < 36600) {
            cursor.setDate(cursor.getDate() + direction);
            if (isWorkday(cursor)) dates.push(formatThaiDate(formatLocalDate(cursor)));
        }
        const listPanel = document.createElement('div');
        listPanel.className = 'bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-2';
        listPanel.innerHTML = `<div class="text-xs font-semibold text-[#6a6a6a]">รายการวันทำการ ${listCount} วัน</div><div class="text-sm leading-7">${dates.length ? dates.map((date, index) => `${index + 1}. ${date}`).join('<br>') : 'กรอกจำนวนวันทำการเพื่อแสดงรายการ'}</div>`;
        container.querySelector('.work-mode').parentElement.parentElement.appendChild(listPanel);
    }
    const workOptions = document.createElement('div');
    workOptions.className = 'bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3 space-y-2';
    workOptions.innerHTML = `<div class="text-xs font-semibold text-[#6a6a6a]">ตั้งค่าวันทำการ</div><div class="flex flex-wrap gap-2">${[['1','จ'],['2','อ'],['3','พ'],['4','พฤ'],['5','ศ'],['6','ส'],['0','อา']].map(([day, label]) => `<label class="text-xs flex items-center gap-1"><input type="checkbox" class="work-day" value="${day}" ${st.workDays.includes(Number(day)) ? 'checked' : ''}>${label}</label>`).join('')}</div><label class="text-xs flex items-center gap-2"><input type="checkbox" id="workThaiHolidays" ${st.includeThaiHolidays ? 'checked' : ''}> ตัดวันหยุดไทยพื้นฐาน</label><div><label class="text-xs font-semibold text-[#6a6a6a] block mb-1">วันหยุดเพิ่มเติม (คั่นด้วย , เช่น 13/04/2569,14/04/2569)</label><input id="workCustomHolidays" type="text" value="${st.customHolidays || ''}" placeholder="วว/ดด/ปปปป" class="airbnb-input w-full"></div>`;
    workEraBar.insertAdjacentElement('afterend', workOptions);
    if (calculationError || recoveredDays) {
        const message = document.createElement('p');
        message.className = 'text-sm p-3';
        message.setAttribute('role', 'alert');
        message.textContent = calculationError || 'กู้คืนการตั้งค่าวันทำงานที่ไม่ถูกต้องแล้ว กรุณาตรวจวันที่เลือกอีกครั้ง';
        workOptions.after(message);
    }
    if (calculationError) container.querySelector('.text-2xl').textContent = '—';
    ['workStart', 'workEnd'].forEach(id => {
        const field = document.getElementById(id);
        if (field) { field.type = 'text'; field.inputMode = 'numeric'; field.placeholder = 'วว/ดด/ปปปป'; field.value = formatDateInputThai(id === 'workStart' ? st.startDate : st.endDate, st.calendarEra); }
    });
    container.querySelectorAll('.work-mode').forEach(btn => btn.addEventListener('click', () => { st.mode = btn.dataset.mode; renderActiveTool(); }));
    container.querySelectorAll('.work-era').forEach(btn => btn.addEventListener('click', () => { st.calendarEra = btn.dataset.era; renderActiveTool(); }));
    container.querySelectorAll('.work-day').forEach(input => input.addEventListener('change', () => { const selectedDays = [...container.querySelectorAll('.work-day:checked')].map(item => Number(item.value)); if (selectedDays.length) { st.workDays = selectedDays; renderActiveTool(); } else { input.checked = true; } }));
    document.getElementById('workThaiHolidays').addEventListener('change', e => { st.includeThaiHolidays = e.target.checked; renderActiveTool(); });
    document.getElementById('workCustomHolidays').addEventListener('change', e => { st.customHolidays = e.target.value; renderActiveTool(); });
    document.getElementById('workStart').addEventListener('change', e => { const parsed = parseDateInputThai(e.target.value, st.calendarEra); if (parsed) st.startDate = parsed; });
    document.getElementById('workEnd')?.addEventListener('change', e => { const parsed = parseDateInputThai(e.target.value, st.calendarEra); if (parsed) st.endDate = parsed; });
    document.getElementById('workOffset')?.addEventListener('change', e => { st.offset = e.target.value; });
    const workFields = [...container.querySelectorAll('input:not([type="checkbox"]), select')];
    workFields.forEach((field, index) => field.addEventListener('keydown', event => {
        if (event.key !== 'Tab' && event.key !== 'Enter') return;
        const next = workFields[index + (event.shiftKey ? -1 : 1)];
        if (!next) { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); field.dispatchEvent(new Event('change', { bubbles: true })); renderActiveTool(); } return; }
        event.preventDefault();
        field.dispatchEvent(new Event('change', { bubbles: true }));
        next.focus();
        if (typeof next.select === 'function') next.select();
    }));
    container.onfocusout = () => setTimeout(() => { if (appState.activeToolId === 'date_work' && !container.contains(document.activeElement)) renderActiveTool(); }, 0);
    setStatusBanner(calculationError ? 'error' : 'success', calculationError || 'คำนวณตามวันทำงานและวันหยุดที่เลือก');
}

/* -----------------------------------------------------------
 * TOOL 13: วันที่ (Date Difference & Add/Subtract Days)
 * ----------------------------------------------------------- */
function renderDateCalcTool(container) {
            const st = appState.date_calc;
            const d1 = new Date(st.startDate + 'T00:00:00');
            const d2 = new Date(st.endDate + 'T00:00:00');
            const diffDays = Math.round(Math.abs(d2 - d1) / 86400000);

            const offset = integerOrDefault(st.daysOffset, 0);
            const targetDate = addCalendarDays(d1, st.op === 'add' ? offset : -offset);
            const isBusinessDay = (date) => {
                const day = date.getDay();
                return day !== 0 && day !== 6 && (!st.includeThaiHolidays || !isThaiOfficialHoliday(date));
            };
            let countedDiffDays = NaN, adjustedTargetDate = new Date(NaN), calculationError = '';
            try {
                if (st.mode === 'diff') countedDiffDays = st.workdays
                    ? countWorkingDays(d1, d2, isBusinessDay) - (!st.inclusive && isBusinessDay(d1) ? 1 : 0)
                    : diffDays + (st.inclusive ? 1 : 0);
                if (st.mode === 'add_sub') {
                    if (!Number.isSafeInteger(offset)) throw new RangeError('จำนวนวันต้องเป็นจำนวนเต็ม');
                    adjustedTargetDate = st.workdays ? offsetWorkingDays(d1, st.op === 'add' ? offset : -offset, isBusinessDay) : targetDate;
                    validateCalendarDate(adjustedTargetDate);
                }
            } catch (error) { calculationError = error.message; }
            const birthDate = new Date(st.birthDate + 'T00:00:00');
            const referenceDate = new Date(st.referenceDate + 'T00:00:00');
            let ageText = 'กรุณาเลือกวันเกิด';
            if (birthDate <= referenceDate) {
                let years = referenceDate.getFullYear() - birthDate.getFullYear();
                let months = referenceDate.getMonth() - birthDate.getMonth();
                let days = referenceDate.getDate() - birthDate.getDate();
                if (days < 0) { months--; days += new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0).getDate(); }
                if (months < 0) { years--; months += 12; }
                ageText = `${years} ปี ${months} เดือน ${days} วัน`;
            }

            container.innerHTML = `
                <div class="flex flex-col gap-3 p-1">
<div class="segment-group grid-cols-3">
                        <button class="segment-btn date-mode ${st.mode === 'diff' ? 'active' : ''}" data-m="diff">ระยะห่าง</button>
                        <button class="segment-btn date-mode ${st.mode === 'add_sub' ? 'active' : ''}" data-m="add_sub">บวก / ลบวัน</button>
                        <button class="segment-btn date-mode ${st.mode === 'age' ? 'active' : ''}" data-m="age">คำนวณอายุ</button>
                    </div>
                    <div class="segment-group grid-cols-2">
                        <button class="segment-btn era-btn ${st.calendarEra === 'BE' ? 'active' : ''}" data-era="BE">พ.ศ.</button>
                        <button class="segment-btn era-btn ${st.calendarEra === 'CE' ? 'active' : ''}" data-era="CE">ค.ศ.</button>
                    </div>
                    ${st.mode !== 'age' ? `<div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3 space-y-2"><label class="flex items-center gap-2 text-sm"><input type="checkbox" id="dateInclusive" ${st.inclusive ? 'checked' : ''}> นับรวมวันเริ่มต้น</label><label class="flex items-center gap-2 text-sm"><input type="checkbox" id="dateWorkdays" ${st.workdays ? 'checked' : ''}> นับเฉพาะวันทำการ (ตัดเสาร์-อาทิตย์)</label><label class="flex items-center gap-2 text-sm"><input type="checkbox" id="dateThaiHolidays" ${st.includeThaiHolidays ? 'checked' : ''}> ตัดวันหยุดไทยพื้นฐาน</label></div>` : ''}

                    ${st.mode === 'age' ? `
                        <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-3">
                            <div><label class="text-xs font-semibold text-[#6a6a6a] block mb-1">วันเกิด (วัน/เดือน/ปี)</label><input type="text" inputmode="numeric" id="birthDateInp" value="${formatDateInputThai(st.birthDate, st.calendarEra)}" placeholder="เช่น 01/01/2533" class="airbnb-input w-full"></div>
                            <div><label class="text-xs font-semibold text-[#6a6a6a] block mb-1">คำนวณถึงวันที่ (วัน/เดือน/ปี)</label><input type="text" inputmode="numeric" id="referenceDateInp" value="${formatDateInputThai(st.referenceDate, st.calendarEra)}" placeholder="เช่น 14/10/2569" class="airbnb-input w-full"></div>
                        </div>
                        <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-5 text-center"><div class="text-xs text-[#6a6a6a]">อายุ</div><div id="ageResult" class="text-2xl font-bold text-[var(--app-accent)]">${ageText}</div></div>
                    ` : st.mode === 'diff' ? `
                        <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-3" style="box-shadow: var(--app-elevation);">
                            <div>
                                <label class="text-xs font-semibold text-[#6a6a6a] block mb-1">วันที่เริ่มต้น</label>
                                <input type="text" inputmode="numeric" id="dateStartInp" value="${formatDateInputThai(st.startDate, st.calendarEra)}" placeholder="วว/ดด/ปปปป" class="airbnb-input w-full">
                            </div>
                            <div>
                                <label class="text-xs font-semibold text-[#6a6a6a] block mb-1">วันที่สิ้นสุด</label>
                                <input type="text" inputmode="numeric" id="dateEndInp" value="${formatDateInputThai(st.endDate, st.calendarEra)}" placeholder="วว/ดด/ปปปป" class="airbnb-input w-full">
                            </div>
                        </div>
                        <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-5 text-center space-y-1" style="box-shadow: var(--app-elevation);">
                            <div class="text-xs text-[#6a6a6a]">ระยะห่างทั้งหมด</div>
                            <div class="text-3xl font-bold text-[var(--app-accent)]">${formatNum(countedDiffDays)} วัน</div>
                            <div class="text-xs text-[#6a6a6a]">${st.workdays ? 'นับตามวันทำงานและวันหยุดที่เลือก' : (Number.isFinite(countedDiffDays) ? `(${Math.floor(countedDiffDays / 7)} สัปดาห์ กับ ${countedDiffDays % 7} วัน)` : '')}</div>
                        </div>
                    ` : `
                        <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-4 space-y-3" style="box-shadow: var(--app-elevation);">
                            <div>
                                <label class="text-xs font-semibold text-[#6a6a6a] block mb-1">วันที่ตั้งต้น</label>
                                <input type="text" inputmode="numeric" id="dateStartInp" value="${formatDateInputThai(st.startDate, st.calendarEra)}" placeholder="วว/ดด/ปปปป" class="airbnb-input w-full">
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="text-xs font-semibold text-[#6a6a6a] block mb-1">การคำนวณ</label>
                                    <select id="dateOpSel" class="airbnb-input w-full">
                                        <option value="add" ${st.op === 'add' ? 'selected' : ''}>+ บวกเพิ่ม (วันข้างหน้า)</option>
                                        <option value="sub" ${st.op === 'sub' ? 'selected' : ''}>- ลบออก (ย้อนหลัง)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-xs font-semibold text-[#6a6a6a] block mb-1">จำนวนวัน</label>
                                    <input type="number" id="dateOffsetInp" value="${st.daysOffset}" min="0" class="airbnb-input w-full">
                                </div>
                            </div>
                        </div>
                        <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-5 text-center space-y-1" style="box-shadow: var(--app-elevation);">
                            <div class="text-xs text-[#6a6a6a]">ตรงกับวันที่</div>
                            <div class="text-xl font-bold text-[var(--app-accent)]">${formatThaiDate(formatLocalDate(adjustedTargetDate))}</div>
                        </div>
                    `}
                </div>
            `;

            if (calculationError) {
                const message = document.createElement('p');
                message.setAttribute('role', 'alert');
                message.className = 'text-sm p-3';
                message.textContent = calculationError;
                container.firstElementChild.appendChild(message);
            }
            container.querySelectorAll('.date-mode').forEach(btn => {
                btn.addEventListener('click', () => {
                    st.mode = btn.getAttribute('data-m');
                    renderActiveTool();
                });
            });
            container.querySelectorAll('.era-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    st.calendarEra = btn.getAttribute('data-era');
                    renderActiveTool();
                });
            });
            document.getElementById('dateStartInp')?.addEventListener('change', (e) => {
                const parsed = parseDateInputThai(e.target.value, st.calendarEra);
                if (parsed) st.startDate = parsed;
            });
            document.getElementById('dateEndInp')?.addEventListener('change', (e) => {
                const parsed = parseDateInputThai(e.target.value, st.calendarEra);
                if (parsed) st.endDate = parsed;
            });
            document.getElementById('dateOpSel')?.addEventListener('change', (e) => {
                st.op = e.target.value; renderActiveTool();
            });
            document.getElementById('dateOffsetInp')?.addEventListener('change', (e) => {
                st.daysOffset = e.target.value;
            });
            document.getElementById('dateInclusive')?.addEventListener('change', (e) => { st.inclusive = e.target.checked; renderActiveTool(); });
            document.getElementById('dateWorkdays')?.addEventListener('change', (e) => { st.workdays = e.target.checked; renderActiveTool(); });
            document.getElementById('dateThaiHolidays')?.addEventListener('change', (e) => { st.includeThaiHolidays = e.target.checked; renderActiveTool(); });
            document.getElementById('birthDateInp')?.addEventListener('change', (e) => { const parsed = parseDateInputThai(e.target.value, st.calendarEra); if (parsed) st.birthDate = parsed; });
            document.getElementById('referenceDateInp')?.addEventListener('change', (e) => { const parsed = parseDateInputThai(e.target.value, st.calendarEra); if (parsed) st.referenceDate = parsed; });
            const dateNavigationFields = [...container.querySelectorAll('input:not([type="checkbox"]), select')];
            dateNavigationFields.forEach((field, index) => {
                field.addEventListener('keydown', (event) => {
                    if (event.key !== 'Tab' && event.key !== 'Enter') return;
                    const nextIndex = index + (event.shiftKey ? -1 : 1);
                    const nextField = dateNavigationFields[nextIndex];
                    if (!nextField) {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            field.dispatchEvent(new Event('change', { bubbles: true }));
                            renderActiveTool();
                        }
                        return;
                    }
                    event.preventDefault();
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    nextField.focus();
                    if (typeof nextField.select === 'function') nextField.select();
                });
            });
            container.onfocusout = () => setTimeout(() => {
                if (appState.activeToolId === 'date_calc' && !container.contains(document.activeElement)) renderActiveTool();
            }, 0);
        }

/* -----------------------------------------------------------
 * TOOL 14: เกรดเฉลี่ย (GPA Calculator - Uses Airbnb Rating Display 64px)
 * ----------------------------------------------------------- */
function renderGpaTool(container) {
    const st = appState.gpa;
    const gradeOptions = [
        { label: 'A (4.0)', val: '4.0' },
        { label: 'B+ (3.5)', val: '3.5' },
        { label: 'B (3.0)', val: '3.0' },
        { label: 'C+ (2.5)', val: '2.5' },
        { label: 'C (2.0)', val: '2.0' },
        { label: 'D+ (1.5)', val: '1.5' },
        { label: 'D (1.0)', val: '1.0' },
        { label: 'F (0.0)', val: '0.0' }
    ];

    let totalCredits = 0;
    let totalPoints = 0;
    st.courses.forEach(c => {
        const cr = numberOrDefault(c.credit, 0);
        const gr = numberOrDefault(c.grade, 0);
        totalCredits += cr;
        totalPoints += (cr * gr);
    });
    const gpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;

    container.innerHTML = `
        <div class="flex flex-col gap-2.5 h-full">
            <!-- Airbnb Rating Display Card Style (64px/700 in Airbnb theme) -->
            <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3.5 flex items-center justify-between" style="box-shadow: var(--app-elevation);">
                <div>
                    <div class="text-xs font-semibold text-[#6a6a6a]">★ เกรดเฉลี่ยสะสม (GPA)</div>
                    <div class="text-4xl font-bold text-[#222222] leading-tight mt-0.5">${gpa.toFixed(2)}</div>
                </div>
                <div class="text-right">
                    <div class="text-xs text-[#6a6a6a] mb-1.5">หน่วยกิตรวม: <b class="text-[#222222]">${totalCredits}</b></div>
                    <button id="addCourseBtn" class="bg-[var(--app-accent)] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold">+ เพิ่มวิชา</button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto space-y-1.5 thin-scroll pr-0.5">
                ${st.courses.map((c, idx) => `
                    <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-btn-radius)] p-2.5 flex items-center gap-2">
                        <span class="text-xs font-bold text-[#6a6a6a] w-14 shrink-0">วิชาที่ ${idx + 1}</span>
                        <select class="gpa-credit border border-[#dddddd] rounded-md px-2 py-1 text-xs font-semibold flex-1 text-[#222222]" data-idx="${idx}">
                            ${[1, 1.5, 2, 2.5, 3, 4, 6].map(cr => `<option value="${cr}" ${Number(c.credit) === cr ? 'selected' : ''}>${cr} หน่วยกิต</option>`).join('')}
                        </select>
                        <select class="gpa-grade border border-[#dddddd] rounded-md px-2 py-1 text-xs font-bold text-[var(--app-accent)] flex-1" data-idx="${idx}">
                            ${gradeOptions.map(g => `<option value="${g.val}" ${c.grade === g.val ? 'selected' : ''}>เกรด ${g.label}</option>`).join('')}
                        </select>
                        <button class="del-course text-[#c13515] hover:bg-red-50 w-7 h-7 rounded-full text-xs font-bold" data-idx="${idx}">✕</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    document.getElementById('addCourseBtn').addEventListener('click', () => {
        st.courses.push({ name: `วิชาที่ ${st.courses.length + 1}`, credit: 3, grade: '4.0' });
        renderActiveTool();
    });
    container.querySelectorAll('.gpa-credit').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const i = parseInt(sel.getAttribute('data-idx'), 10);
            st.courses[i].credit = parseNumericInput(e.target.value);
            renderActiveTool();
        });
    });
    container.querySelectorAll('.gpa-grade').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const i = parseInt(sel.getAttribute('data-idx'), 10);
            st.courses[i].grade = e.target.value;
            renderActiveTool();
        });
    });
    container.querySelectorAll('.del-course').forEach(btn => {
        btn.addEventListener('click', () => {
            if (st.courses.length <= 1) return;
            const i = parseInt(btn.getAttribute('data-idx'), 10);
            st.courses.splice(i, 1);
            renderActiveTool();
        });
    });
}

/* -----------------------------------------------------------
 * TOOL 18: เวลาโลก (World Clock)
 * ----------------------------------------------------------- */
function updateWorldClocks(container) {
    const now = new Date();
    const st = appState.world_time;
    container.querySelectorAll('[data-world-time]').forEach(node => {
        node.textContent = now.toLocaleTimeString('en-GB', { timeZone: node.dataset.worldTime, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !st.use24h });
    });
    container.querySelectorAll('[data-world-date]').forEach(node => {
        node.textContent = now.toLocaleDateString('th-TH', { timeZone: node.dataset.worldDate, dateStyle: 'medium' });
    });
}

function updateWorldMeeting(container) {
    const st = appState.world_time;
    const date = new Date(`${st.meetingDate}T${st.meetingTime}:00+07:00`);
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(st.meetingDate) && /^\d{2}:\d{2}$/.test(st.meetingTime) && Number.isFinite(date.getTime());
    container.querySelector('#worldMeetingResult').textContent = valid ? 'เวลานัดหมายด้านล่างแสดงตามเขตเวลาของแต่ละเมือง' : 'กรุณาระบุวันที่และเวลานัดหมายให้ครบ';
    container.querySelectorAll('[data-world-meeting]').forEach(node => {
        node.textContent = valid ? 'นัดหมาย: ' + date.toLocaleString('th-TH', { timeZone: node.dataset.worldMeeting, dateStyle: 'medium', timeStyle: 'short', hour12: !st.use24h }) : 'นัดหมาย: —';
    });
}

function filterWorldCities(container) {
    const query = String(appState.world_time.search || '').trim().toLocaleLowerCase();
    let count = 0;
    container.querySelectorAll('[data-world-search]').forEach(card => {
        card.hidden = !card.dataset.worldSearch.includes(query);
        if (!card.hidden) count++;
    });
    container.querySelector('#worldNoResults').hidden = count > 0;
}

function renderWorldTimeTool(container) {
    const st = appState.world_time;
    if (!Array.isArray(st.favoriteCities)) st.favoriteCities = ['Asia/Bangkok'];
    if (!st.meetingTime) st.meetingTime = '09:00';
    if (!st.meetingDate) st.meetingDate = formatDateInTimezone(new Date(), 'Asia/Bangkok');
    const cities = [
        { name: 'กรุงเทพฯ (Bangkok)', country: 'ประเทศไทย', tz: 'Asia/Bangkok', diff: 'เวลามาตรฐานไทย' },
        { name: 'โตเกียว (Tokyo)', country: 'ญี่ปุ่น', tz: 'Asia/Tokyo', diff: '+2 ชั่วโมง' },
        { name: 'โซล (Seoul)', country: 'เกาหลีใต้', tz: 'Asia/Seoul', diff: '+2 ชั่วโมง' },
        { name: 'สิงคโปร์ (Singapore)', country: 'สิงคโปร์', tz: 'Asia/Singapore', diff: '+1 ชั่วโมง' },
        { name: 'ปักกิ่ง (Beijing)', country: 'จีน', tz: 'Asia/Shanghai', diff: '+1 ชั่วโมง' },
        { name: 'ซิดนีย์ (Sydney)', country: 'ออสเตรเลีย', tz: 'Australia/Sydney', diff: '+3/+4 ชั่วโมง' },
        { name: 'ดูไบ (Dubai)', country: 'สหรัฐอาหรับเอมิเรตส์', tz: 'Asia/Dubai', diff: '-3 ชั่วโมง' },
        { name: 'ปารีส (Paris)', country: 'ฝรั่งเศส', tz: 'Europe/Paris', diff: '-5/-6 ชั่วโมง' },
        { name: 'ลอนดอน (London)', country: 'สหราชอาณาจักร', tz: 'Europe/London', diff: '-6/-7 ชั่วโมง' },
        { name: 'นิวยอร์ก (New York)', country: 'สหรัฐอเมริกา', tz: 'America/New_York', diff: '-11/-12 ชั่วโมง' },
        { name: 'ลอสแอนเจลิส (Los Angeles)', country: 'สหรัฐอเมริกา', tz: 'America/Los_Angeles', diff: '-14/-15 ชั่วโมง' }
    ];

    const orderedCities = [...cities].sort((a, b) => Number(st.favoriteCities.includes(b.tz)) - Number(st.favoriteCities.includes(a.tz)));
    container.innerHTML = `
        <div class="flex flex-col gap-2 h-full">
            <div class="bg-[var(--app-accent)] text-white rounded-[var(--app-card-radius)] p-3.5 flex items-center justify-between">
                <div><div class="text-xs">เวลาประเทศไทยปัจจุบัน</div><div class="text-2xl font-bold font-mono" data-world-time="Asia/Bangkok"></div></div>
                <div class="text-right text-xs" data-world-date="Asia/Bangkok"></div>
            </div>
            <div class="bg-white border border-[var(--app-hairline)] rounded-[var(--app-card-radius)] p-3 space-y-2">
                <div class="flex gap-2"><input id="worldSearch" type="search" aria-label="ค้นหาเมืองหรือประเทศ" value="${escapeHTML(st.search)}" placeholder="ค้นหาเมือง/ประเทศ" class="airbnb-input w-full min-w-0"><button id="worldFormat" class="airbnb-input whitespace-nowrap" aria-label="เปลี่ยนรูปแบบเวลา">${st.use24h ? '24 ชั่วโมง' : '12 ชั่วโมง'}</button></div>
                <div class="grid grid-cols-2 gap-2"><label class="text-xs">วันที่นัดหมายที่กรุงเทพฯ<input id="worldMeetingDate" type="date" value="${escapeHTML(st.meetingDate)}" class="airbnb-input w-full mt-1"></label><label class="text-xs">เวลานัดหมายที่กรุงเทพฯ<input id="worldMeetingTime" type="time" value="${escapeHTML(st.meetingTime)}" class="airbnb-input w-full mt-1"></label></div>
                <div id="worldMeetingResult" class="text-xs text-[#6a6a6a]"></div>
            </div>
            <div class="flex-1 overflow-y-auto space-y-1.5 thin-scroll pr-0.5">
                ${orderedCities.map(city => `<div data-world-search="${escapeHTML((city.name + ' ' + city.country).toLocaleLowerCase())}" class="world-city-card bg-white border border-[var(--app-hairline)] rounded-[var(--app-btn-radius)] px-3.5 py-2.5">
                    <div class="flex items-center justify-between gap-2"><div><div class="font-semibold text-sm">${city.name}</div><div class="text-[11px] text-[#6a6a6a]">${city.country}</div></div><div class="text-right"><div class="font-mono font-bold text-lg text-[var(--app-accent)]" data-world-time="${city.tz}"></div><div class="text-[11px] text-[#6a6a6a]" data-world-date="${city.tz}"></div></div><button type="button" data-world-pin="${city.tz}" aria-label="ปักหมุด ${city.name}" aria-pressed="${st.favoriteCities.includes(city.tz)}" class="p-2 text-xl">${st.favoriteCities.includes(city.tz) ? '★' : '☆'}</button></div>
                    <div class="text-xs text-[#6a6a6a] mt-1" data-world-meeting="${city.tz}"></div>
                </div>`).join('')}
                <p id="worldNoResults" class="p-3 text-sm" hidden>ไม่พบเมืองที่ค้นหา</p>
            </div>
        </div>`;
    container.querySelector('#worldSearch').addEventListener('input', event => { st.search = event.target.value; filterWorldCities(container); persistAppState(); });
    container.querySelector('#worldFormat').addEventListener('click', () => {
        st.use24h = !st.use24h;
        persistAppState();
        renderWorldTimeTool(container);
        container.querySelector('#worldFormat').focus({ preventScroll: true });
    });
    for (const [id, key] of [['worldMeetingDate', 'meetingDate'], ['worldMeetingTime', 'meetingTime']]) {
        container.querySelector('#' + id).addEventListener('input', event => { st[key] = event.target.value; updateWorldMeeting(container); persistAppState(); });
    }
    container.querySelectorAll('[data-world-pin]').forEach(button => button.addEventListener('click', () => {
        const tz = button.dataset.worldPin;
        st.favoriteCities = st.favoriteCities.includes(tz) ? st.favoriteCities.filter(value => value !== tz) : [...st.favoriteCities, tz];
        persistAppState();
        renderWorldTimeTool(container);
        container.querySelector(`[data-world-pin="${tz}"]`).focus({ preventScroll: true });
    }));
    updateWorldClocks(container);
    updateWorldMeeting(container);
    filterWorldCities(container);
}

// Update only clock text so editing, search and scrolling remain intact.
if (typeof window !== 'undefined' && typeof window.setInterval === 'function') {
    window.setInterval(() => {
        if (typeof appState !== 'undefined' && appState.activeToolId === 'world_time') {
            const panel = document.getElementById('toolTopPanel');
            if (panel) updateWorldClocks(panel);
        }
    }, 1000);
}

(function(root) {
    const exportsObj = {
        renderWorkdayTool,
        renderDateCalcTool,
        updateWorldClocks,
        updateWorldMeeting,
        filterWorldCities,
        renderWorldTimeTool,
        renderGpaTool
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
