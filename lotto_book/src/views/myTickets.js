/**
 * lotto_book - View 1: My Tickets & Budget Manager (สลากของฉัน)
 * Handles recording lottery tickets, budgets per draw, cumulative spending, and data export/import.
 */

(function(root) {
    'use strict';

    const THAI_MONTHS = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    function formatShortThaiDate(isoDateStr) {
        if (!isoDateStr) return '';
        const parts = isoDateStr.split('-');
        if (parts.length !== 3) return isoDateStr;
        const year = parseInt(parts[0], 10) + 543;
        const month = THAI_MONTHS[parseInt(parts[1], 10) - 1] || '';
        const day = parseInt(parts[2], 10);
        return `${day} ${month} ${year}`;
    }

    /**
     * Generates upcoming draw dates (1st and 16th of current and upcoming months).
     */
    function getUpcomingDrawDates(count = 6) {
        return root.LottoDraws.upcoming(count);
    }

    const MyTicketsView = {
        selectedDrawFilter: 'all',
        editingTicketId: null,
        pendingSharedImport: null,

        render(container) {
            if (!container) return;

            const tickets = root.LottoStorage.getTickets();
            const spendingSummary = root.LottoStorage.getSpendingSummary();
            const upcomingDates = getUpcomingDrawDates(4);
            const defaultDrawDate = root.LottoDraws.next().date;

            const editingTicket = this.editingTicketId
                ? (tickets.find(t => t.id === this.editingTicketId) || null)
                : null;
            if (this.editingTicketId && !editingTicket) {
                this.editingTicketId = null;
            }

            // Distinct draw dates from recorded tickets + upcoming dates
            const drawDateSet = new Set(upcomingDates);
            tickets.forEach(t => drawDateSet.add(t.drawDate));
            const availableDrawDates = Array.from(drawDateSet).sort((a, b) => b.localeCompare(a));

            // Selected draw budget
            const currentSelectedDraw = this.selectedDrawFilter === 'all' 
                ? defaultDrawDate
                : this.selectedDrawFilter;

            const nextDraw = root.LottoDraws.next();
            const nextBudget = root.LottoStorage.getBudgetForDraw(nextDraw.date);
            const nextSpent = spendingSummary.drawStats[nextDraw.date]?.totalCost || 0;

            const drawBudget = root.LottoStorage.getBudgetForDraw(currentSelectedDraw);
            const drawStats = spendingSummary.drawStats[currentSelectedDraw] || { totalCost: 0, ticketCount: 0 };
            const budgetPercent = drawBudget > 0 ? Math.min(100, Math.round((drawStats.totalCost / drawBudget) * 100)) : 0;
            const isOverBudget = drawBudget > 0 && drawStats.totalCost > drawBudget;

            // Filter tickets to display
            const filteredTickets = this.selectedDrawFilter === 'all'
                ? tickets
                : tickets.filter(t => t.drawDate === this.selectedDrawFilter);

            const backupReminder = root.LottoStorage.shouldRemindBackup()
                ? `<div role="status" class="bg-warning-soft text-ink p-4 rounded-lg border border-line flex flex-wrap items-center justify-between gap-3">
                        <p class="text-base">ยังไม่ได้สำรองข้อมูลสลากล่าสุด ข้อมูลนี้เก็บในเบราว์เซอร์เครื่องนี้เท่านั้น ถ้าล้างข้อมูลเบราว์เซอร์หรือเปลี่ยนเครื่อง จะหายทั้งหมด</p>
                        <div class="flex gap-2 text-base">
                            <button type="button" id="btnBackupReminder" class="px-3 py-1.5 bg-action rounded-lg font-semibold">สำรองข้อมูลตอนนี้</button>
                            <button type="button" id="btnSnoozeBackupReminder" class="px-3 py-1.5 bg-raised text-ink rounded-lg font-medium">ภายหลัง</button>
                        </div>
                    </div>`
                : '';

            const sharedBanner = (this.pendingSharedImport && Array.isArray(this.pendingSharedImport.numbers) && this.pendingSharedImport.numbers.length > 0)
                ? `<div id="sharedImportBanner" role="status" class="bg-accent-soft text-ink p-4 rounded-lg border border-line flex flex-wrap items-center justify-between gap-3">
                        <div class="space-y-1">
                            <div class="text-base font-bold text-ink">ได้รับชุดตัวเลขจากเครื่องคำนวณหวย (${this.pendingSharedImport.numbers.length} รายการ)</div>
                            <div class="text-sm text-muted font-lotto">${this.pendingSharedImport.numbers.map(n => root.LottoStorage.escapeHTML(n)).join(', ')} (ใบละ ฿${root.LottoStorage.escapeHTML(this.pendingSharedImport.price)})</div>
                        </div>
                        <div class="flex gap-2 text-base">
                            <button type="button" id="btnConfirmSharedImport" class="px-3.5 py-1.5 bg-action text-white rounded-lg font-semibold">บันทึกเข้าสมุดสลากงวดนี้</button>
                            <button type="button" id="btnDismissSharedImport" class="px-3 py-1.5 bg-raised text-ink rounded-lg font-medium">ปิด</button>
                        </div>
                    </div>`
                : '';

            const formDrawDate = editingTicket ? editingTicket.drawDate : currentSelectedDraw;
            const formNumber = editingTicket ? root.LottoStorage.escapeHTML(editingTicket.number) : '';
            const formCount = editingTicket ? editingTicket.count : 1;
            const formCost = editingTicket ? editingTicket.costPerUnit : 80;
            const formNote = editingTicket ? root.LottoStorage.escapeHTML(editingTicket.note || '') : '';

            container.innerHTML = `
                <div class="space-y-6">
                    ${sharedBanner}
                    ${backupReminder}
                    <section class="color-panel tone-yellow bg-surface p-4 rounded-lg border border-line" aria-label="งวดถัดไป" data-next-draw="${nextDraw.date}">
                        <div class="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 class="font-bold text-ink">งวดถัดไป ${formatShortThaiDate(nextDraw.date)}</h2>
                                <p class="text-muted">นับถอยหลังถึงเวลา 16:00 น. ตามเวลาประเทศไทย (กำหนดวันอาจเปลี่ยนตามประกาศ GLO)</p>
                            </div>
                            <strong id="nextDrawCountdown" class="text-xl text-warning">${root.LottoDraws.formatRemaining(nextDraw.remainingMs)}</strong>
                        </div>
                        <p class="mt-2 text-ink">${nextBudget > 0
                            ? `งบคงเหลือ ฿${Math.max(0, nextBudget - nextSpent).toLocaleString()} จาก ฿${nextBudget.toLocaleString()}${nextSpent > nextBudget ? ' (เกินงบแล้ว)' : ''}`
                            : 'ยังไม่ได้ตั้งงบสำหรับงวดนี้'}
                        </p>
                    </section>
                    <!-- Top Summary & Budget Card -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Total All-time Spent -->
                        <div class="color-panel tone-purple bg-surface p-4 rounded-lg border border-line flex flex-col justify-between">
                            <div class="flex items-center justify-between">
                                <span class="text-base font-medium text-muted ">ค่าใช้จ่ายสะสมทั้งหมด</span>
                                <span class="p-1.5 bg-accent-soft  text-accent rounded-lg text-base">฿</span>
                            </div>
                            <div class="mt-2">
                                <div class="text-2xl font-bold text-ink ">
                                    ฿${spendingSummary.totalSpent.toLocaleString()}
                                </div>
                                <div class="text-base text-muted  mt-0.5">
                                    จากสลากทั้งหมด ${spendingSummary.totalTickets.toLocaleString()} ใบ (${spendingSummary.drawCount} งวด)
                                </div>
                            </div>
                        </div>

                        <!-- Current Draw Budget Card -->
                        <div class="color-panel tone-yellow bg-surface p-4 rounded-lg border border-line md:col-span-2 flex flex-col justify-between">
                            <div class="flex items-center justify-between flex-wrap gap-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-base font-medium text-ink ">
                                        งบประมาณงวด ${formatShortThaiDate(currentSelectedDraw)}
                                    </span>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <button type="button" id="btnEditBudget" class="text-base text-accent hover:text-accent font-medium flex items-center gap-1">
                                        <span>ตั้งงบงวดนี้</span>
                                    </button>
                                </div>
                            </div>

                            <div class="mt-2">
                                <div class="flex justify-between items-baseline mb-1">
                                    <span class="text-base font-semibold text-ink ">
                                        ใช้ไป ฿${drawStats.totalCost.toLocaleString()} 
                                        <span class="text-base font-normal text-muted ">
                                            ${drawBudget > 0 ? `/ งบ ฿${drawBudget.toLocaleString()}` : '(ยังไม่ได้ตั้งงบ)'}
                                        </span>
                                    </span>
                                    <span class="text-base font-bold ${isOverBudget ? 'text-error' : 'text-success '}">
                                        ${drawBudget > 0 ? (isOverBudget ? `เกินงบ ฿${(drawStats.totalCost - drawBudget).toLocaleString()}!` : `คงเหลือ ฿${(drawBudget - drawStats.totalCost).toLocaleString()}`) : ''}
                                    </span>
                                </div>
                                
                                ${drawBudget > 0 ? `
                                    <div class="w-full bg-raised  rounded-full h-2.5 overflow-hidden">
                                        <div class="h-2.5 rounded-full transition ${isOverBudget ? 'bg-error' : (budgetPercent > 80 ? 'bg-warning' : 'bg-budget')}" style="width: ${budgetPercent}%"></div>
                                    </div>
                                ` : `
                                    <div class="text-base text-muted  ">
                                        กด "ตั้งงบงวดนี้" เพื่อกำหนดวงเงินป้องกันการซื้อสลากเกินตัว
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>

                    <!-- Add / Edit Ticket Form -->
                    <div class="form-panel bg-surface p-5 rounded-lg border border-line  ">
                        <div class="flex flex-wrap gap-3 items-center justify-between pb-3 border-b border-line  mb-4">
                            <h2 class="text-base font-bold text-ink  flex items-center gap-2">
                                ${editingTicket ? `แก้ไขรายการสลาก (${formNumber})` : 'บันทึกสลากใหม่'}
                            </h2>
                            <div class="flex gap-1.5 text-base">
                                <button type="button" id="btnScanTicket" class="px-2.5 py-1 bg-raised text-ink rounded-lg font-medium transition">สแกนสลาก</button>
                                <button type="button" id="btnExportData" class="px-2.5 py-1 bg-raised hover:bg-raised   text-ink  rounded-lg font-medium transition">
                                    สำรองข้อมูล
                                </button>
                                <button type="button" id="btnImportData" class="px-2.5 py-1 bg-raised hover:bg-raised   text-ink  rounded-lg font-medium transition">
                                    นำเข้า
                                </button>
                            </div>
                        </div>

                        <form id="addTicketForm" class="space-y-4">
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <!-- Draw Date -->
                                <div>
                                    <label for="ticketDrawDate" class="block text-base font-semibold text-ink  mb-1">
                                        งวดวันที่
                                    </label>
                                    <div class="relative">
                                        <input type="date" id="ticketDrawDate" value="${formDrawDate}" required
                                            class="w-full bg-surface  border border-line  rounded-lg px-3 py-2 text-base text-ink  focus:ring-2 focus:ring-accent focus:outline-none">
                                    </div>
                                </div>

                                <!-- Ticket Number (Strict String preserving zeros) -->
                                <div>
                                    <label for="ticketNumber" class="block text-base font-semibold text-ink  mb-1">
                                        หมายเลขสลาก (คงเลข 0 นำหน้า)
                                    </label>
                                    <input type="text" id="ticketNumber" value="${formNumber}" placeholder="เช่น 007579 หรือ 09" maxlength="6" required
                                        class="w-full font-lotto text-base font-bold text-center bg-surface  border border-line  rounded-lg px-3 py-2 text-ink  focus:ring-2 focus:ring-accent focus:outline-none">
                                </div>

                                <!-- Quantity -->
                                <div>
                                    <label for="ticketCount" class="block text-base font-semibold text-ink mb-1">
                                        จำนวนใบ
                                    </label>
                                    <div class="flex items-center gap-1">
                                        <input type="number" id="ticketCount" value="${formCount}" min="1" max="999" required
                                            class="w-full text-center font-bold bg-surface  border border-line  rounded-lg px-3 py-2 text-base text-ink  focus:ring-2 focus:ring-accent focus:outline-none">
                                        <div class="flex gap-1">
                                            <button type="button" class="btn-qty-quick px-2 py-2 bg-raised hover:bg-raised   text-base rounded-lg text-ink " data-val="1">+1</button>
                                            <button type="button" class="btn-qty-quick px-2 py-2 bg-raised hover:bg-raised   text-base rounded-lg text-ink " data-val="2">+2</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Price per unit -->
                                <div>
                                    <label for="ticketCostPerUnit" class="block text-base font-semibold text-ink mb-1">
                                        ราคาต่อใบ (บาท)
                                    </label>
                                    <div class="flex items-center gap-1">
                                        <input type="number" id="ticketCostPerUnit" value="${formCost}" min="1" required
                                            class="w-full text-center font-bold bg-surface  border border-line  rounded-lg px-3 py-2 text-base text-ink  focus:ring-2 focus:ring-accent focus:outline-none">
                                        <div class="flex gap-1">
                                            <button type="button" class="btn-cost-quick px-2 py-2 bg-raised hover:bg-raised   text-base rounded-lg text-ink " data-val="80">80</button>
                                            <button type="button" class="btn-cost-quick px-2 py-2 bg-raised hover:bg-raised   text-base rounded-lg text-ink " data-val="100">100</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="flex flex-col sm:flex-row gap-3 items-center justify-between pt-1">
                                <!-- Note Input -->
                                <div class="w-full sm:flex-1">
                                    <input type="text" aria-label="บันทึกช่วยจำ" id="ticketNote" value="${formNote}" placeholder="บันทึกช่วยจำ (เช่น เป๋าตัง, สแกนจากแผง, เลขอ่างน้ำมนต์)"
                                        class="w-full bg-surface  border border-line  rounded-lg px-3 py-2 text-base text-ink  focus:ring-2 focus:ring-accent focus:outline-none">
                                </div>

                                <!-- Submit & Cancel Buttons -->
                                <div class="flex items-center gap-2 w-full sm:w-auto">
                                    ${editingTicket ? `
                                        <button type="button" id="btnCancelEditTicket"
                                            class="px-4 py-2.5 bg-raised hover:bg-surface text-ink border border-line rounded-lg text-base font-medium transition whitespace-nowrap">
                                            ยกเลิกแก้ไข
                                        </button>
                                    ` : ''}
                                    <button type="submit" id="btnSubmitTicket"
                                        class="flex-1 sm:flex-initial px-6 py-2.5 bg-action hover:bg-action-hover text-white rounded-lg text-base font-semibold  transition flex items-center justify-center gap-2 whitespace-nowrap">
                                        ${editingTicket ? 'บันทึกการแก้ไข' : '+ บันทึกสลาก'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Tickets List Section -->
                    <div class="bg-surface  rounded-lg border border-line   overflow-hidden">
                        <!-- Filter Bar -->
                        <div class="p-4 border-b border-line  flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div class="flex items-center gap-2">
                                <h2 class="text-base font-bold text-ink ">
                                    รายการสลากที่บันทึกไว้
                                </h2>
                                <span class="px-2 py-0.5 bg-raised  text-muted  text-base font-semibold rounded-full">
                                    ${filteredTickets.length} รายการ
                                </span>
                            </div>

                            <!-- Filter by Draw Dropdown -->
                            <div class="flex items-center gap-2 w-full sm:w-auto">
                                <span class="text-base text-muted  whitespace-nowrap">กรองงวด:</span>
                                <select aria-label="กรองรายการตามงวด" id="drawFilterSelect" class="bg-surface  border border-line  rounded-lg px-3 py-1.5 text-base text-ink  focus:ring-2 focus:ring-accent focus:outline-none flex-1 sm:flex-initial">
                                    <option value="all" ${this.selectedDrawFilter === 'all' ? 'selected' : ''}>ทั้งหมดทุกงวด</option>
                                    ${availableDrawDates.map(d => `
                                        <option value="${d}" ${this.selectedDrawFilter === d ? 'selected' : ''}>
                                            งวด ${formatShortThaiDate(d)}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>

                        <!-- Ticket Table / Cards -->
                        ${filteredTickets.length === 0 ? `
                            <div class="p-12 text-center text-muted ">
                                <div class="text-base font-medium">ยังไม่มีรายการสลากในงวดนี้</div>
                                <div class="text-base mt-1">บันทึกสลากใบแรกของคุณด้วยฟอร์มด้านบน</div>
                            </div>
                        ` : `
                            <div class="divide-y divide-line ">
                                ${filteredTickets.map(t => {
                                    return `
                                        <div class="p-4 hover:bg-surface  transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div class="flex items-center gap-3">
                                                <div class="w-12 h-12 rounded-lg bg-accent-soft  text-accent flex flex-col items-center justify-center font-bold">
                                                    <span class="text-base font-normal text-muted ">สลาก</span>
                                                    <span class="text-base leading-none">${t.count} ใบ</span>
                                                </div>
                                                <div>
                                                    <div class="flex items-center gap-2">
                                                        <span class="font-lotto text-xl font-bold tracking-wider text-ink ">
                                                            ${root.LottoStorage.escapeHTML(t.number)}
                                                        </span>
                                                        <span class="text-base px-2 py-0.5 rounded-full font-medium bg-accent-soft text-accent">
                                                            ${t.number.length === 6 ? '6 หลัก' : (t.number.length === 3 ? '3 ตัว' : '2 ตัว')}
                                                        </span>
                                                    </div>
                                                    <div class="flex items-center gap-2 text-base text-muted  mt-0.5">
                                                        <span>งวด ${formatShortThaiDate(t.drawDate)}</span>
                                                        <span>•</span>
                                                        <span>ใบละ ฿${t.costPerUnit}</span>
                                                        ${t.note ? `<span>•</span> <span class="text-muted  ">"${root.LottoStorage.escapeHTML(t.note)}"</span>` : ''}
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="flex items-center justify-between w-full sm:w-auto gap-4 self-end sm:self-center">
                                                <div class="text-right">
                                                    <div class="text-base font-bold text-ink ">
                                                        ฿${t.totalCost.toLocaleString()}
                                                    </div>
                                                    <div class="text-base text-muted">
                                                        ยอดจ่ายจริง
                                                    </div>
                                                </div>
                                                <div class="flex items-center gap-1">
                                                    <button type="button" data-edit-id="${root.LottoStorage.escapeHTML(t.id)}" class="btn-edit-ticket px-2.5 py-1.5 text-sm font-medium text-accent hover:bg-accent-soft rounded-lg transition" title="แก้ไขรายการ">
                                                        แก้ไข
                                                    </button>
                                                    <button type="button" data-delete-id="${root.LottoStorage.escapeHTML(t.id)}" class="btn-delete-ticket p-2 text-muted hover:text-error hover:bg-error-soft  rounded-lg transition" title="ลบรายการ">
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                </div>
            `;

            this.bindEvents(container);
        },

        bindEvents(container) {
            container.querySelector('#btnScanTicket')?.addEventListener('click', () =>
                root.LottoScanUI.open(container.querySelector('#addTicketForm')));

            container.querySelector('#btnConfirmSharedImport')?.addEventListener('click', () => {
                if (!this.pendingSharedImport || !Array.isArray(this.pendingSharedImport.numbers)) return;
                const drawDate = container.querySelector('#ticketDrawDate')?.value || root.LottoDraws.next().date;
                const costPerUnit = Number(this.pendingSharedImport.price) || 80;
                const note = this.pendingSharedImport.note || 'ส่งมาจากเครื่องคำนวณหวย';
                let savedCount = 0;
                this.pendingSharedImport.numbers.forEach(num => {
                    try {
                        root.LottoStorage.saveTicket({
                            drawDate,
                            number: num,
                            count: 1,
                            costPerUnit,
                            note
                        });
                        savedCount++;
                    } catch (_) {}
                });
                this.pendingSharedImport = null;
                root.LottoApp.showToast(`บันทึกชุดตัวเลข ${savedCount} รายการเข้าสมุดสลากเรียบร้อยแล้ว`, 'success');
                this.render(container);
            });

            container.querySelector('#btnDismissSharedImport')?.addEventListener('click', () => {
                this.pendingSharedImport = null;
                this.render(container);
            });

            // Quick quantity buttons
            container.querySelectorAll('.btn-qty-quick').forEach(btn => {
                btn.addEventListener('click', () => {
                    const input = container.querySelector('#ticketCount');
                    if (input) input.value = parseInt(input.value || 0, 10) + parseInt(btn.dataset.val, 10);
                });
            });

            // Quick cost buttons
            container.querySelectorAll('.btn-cost-quick').forEach(btn => {
                btn.addEventListener('click', () => {
                    const input = container.querySelector('#ticketCostPerUnit');
                    if (input) input.value = btn.dataset.val;
                });
            });

            // Cancel edit button
            container.querySelector('#btnCancelEditTicket')?.addEventListener('click', () => {
                this.editingTicketId = null;
                this.render(container);
            });

            // Add / Edit Ticket Form submit
            const form = container.querySelector('#addTicketForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const drawDate = container.querySelector('#ticketDrawDate').value;
                    const number = container.querySelector('#ticketNumber').value.trim();
                    const count = parseInt(container.querySelector('#ticketCount').value, 10) || 1;
                    const costPerUnit = parseFloat(container.querySelector('#ticketCostPerUnit').value) || 80;
                    const note = container.querySelector('#ticketNote').value.trim();

                    if (!number) {
                        root.LottoApp.showToast('กรุณาระบุหมายเลขสลาก', 'error');
                        return;
                    }

                    try {
                        const isEditing = Boolean(this.editingTicketId);
                        const existingTicket = isEditing
                            ? root.LottoStorage.getTickets().find(t => t.id === this.editingTicketId)
                            : null;
                        root.LottoStorage.saveTicket({
                            id: isEditing ? this.editingTicketId : undefined,
                            createdAt: existingTicket?.createdAt,
                            drawDate,
                            number, // string preserved
                            count,
                            costPerUnit,
                            note
                        });
                        this.editingTicketId = null;
                        root.LottoApp.showToast(
                            isEditing ? `แก้ไขสลากเลข ${number} เรียบร้อยแล้ว` : `บันทึกสลากเลข ${number} เรียบร้อยแล้ว`,
                            'success'
                        );
                        form.reset();
                        container.querySelector('#ticketDrawDate').value = drawDate;
                        container.querySelector('#ticketCount').value = '1';
                        container.querySelector('#ticketCostPerUnit').value = '80';
                        this.render(container);
                    } catch (err) {
                        root.LottoApp.showToast(err.message, 'error');
                    }
                });
            }

            // Draw filter change
            const filterSelect = container.querySelector('#drawFilterSelect');
            if (filterSelect) {
                filterSelect.addEventListener('change', (e) => {
                    this.selectedDrawFilter = e.target.value;
                    this.render(container);
                });
            }

            // Edit ticket buttons
            container.querySelectorAll('.btn-edit-ticket').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.editingTicketId = btn.dataset.editId;
                    this.render(container);
                    const numInput = container.querySelector('#ticketNumber');
                    if (numInput && typeof numInput.focus === 'function') {
                        numInput.focus();
                    }
                });
            });

            // Delete ticket buttons
            container.querySelectorAll('.btn-delete-ticket').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.deleteId;
                    this.showDeleteConfirmModal(id, container);
                });
            });

            // Edit budget button
            const btnEditBudget = container.querySelector('#btnEditBudget');
            if (btnEditBudget) {
                btnEditBudget.addEventListener('click', () => {
                    const currentSelectedDraw = this.selectedDrawFilter === 'all' 
                        ? (container.querySelector('#ticketDrawDate')?.value || root.LottoDraws.next().date)
                        : this.selectedDrawFilter;
                    const currentBudget = root.LottoStorage.getBudgetForDraw(currentSelectedDraw);
                    this.showBudgetModal(currentSelectedDraw, currentBudget, container);
                });
            }

            // Export Data Button
            const btnExport = container.querySelector('#btnExportData');
            if (btnExport) {
                btnExport.addEventListener('click', () => {
                    this.showExportModal();
                });
            }

            // Import Data Button
            const btnImport = container.querySelector('#btnImportData');
            if (btnImport) {
                btnImport.addEventListener('click', () => {
                    this.showImportModal(container);
                });
            }

            // Backup reminder banner
            const btnBackupReminder = container.querySelector('#btnBackupReminder');
            if (btnBackupReminder) {
                btnBackupReminder.addEventListener('click', () => this.showExportModal());
            }
            const btnSnoozeBackup = container.querySelector('#btnSnoozeBackupReminder');
            if (btnSnoozeBackup) {
                btnSnoozeBackup.addEventListener('click', () => {
                    root.LottoStorage.snoozeBackupReminder(7);
                    this.render(container);
                });
            }
        },

        showDeleteConfirmModal(ticketId, parentContainer) {
            const ticket = root.LottoStorage.getTickets().find(t => t.id === ticketId);
            if (!ticket) return;

            if (typeof document === 'undefined' || !document.body) {
                root.LottoStorage.deleteTicket(ticketId);
                this.render(parentContainer);
                return;
            }

            const modal = document.createElement('dialog');
            modal.className = 'book-dialog';
            modal.innerHTML = `
                <div class="bg-surface w-full max-w-md rounded-lg p-6 border border-line space-y-4">
                    <div class="flex justify-between items-center">
                        <h2 class="text-base font-bold text-ink">ยืนยันการลบรายการสลาก</h2>
                        <button type="button" aria-label="ปิดหน้าต่าง" class="btn-close-modal text-muted hover:text-ink text-lg">✕</button>
                    </div>
                    <p class="text-base text-muted">
                        คุณต้องการลบสลากหมายเลข <strong class="font-lotto text-ink">${root.LottoStorage.escapeHTML(ticket.number)}</strong> (${ticket.count} ใบ) งวด ${formatShortThaiDate(ticket.drawDate)} ใช่หรือไม่?
                    </p>
                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" class="btn-close-modal px-4 py-2 text-base text-muted hover:bg-raised rounded-lg transition">ยกเลิก</button>
                        <button type="button" id="btnConfirmDeleteTicket" class="px-4 py-2 text-base font-semibold bg-error text-white rounded-lg transition">ยืนยันการลบ</button>
                    </div>
                </div>
            `;
            modal.setAttribute('aria-label', 'ยืนยันการลบรายการสลาก');
            document.body.appendChild(modal);
            modal.addEventListener('close', () => modal.remove(), { once: true });
            if (typeof modal.showModal === 'function') modal.showModal();

            const closeModal = () => {
                if (typeof modal.close === 'function') modal.close();
                else modal.remove();
            };
            modal.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', closeModal));
            modal.querySelector('#btnConfirmDeleteTicket')?.addEventListener('click', () => {
                if (this.editingTicketId === ticketId) this.editingTicketId = null;
                root.LottoStorage.deleteTicket(ticketId);
                closeModal();
                root.LottoApp.showToast('ลบรายการสลากแล้ว', 'info');
                this.render(parentContainer);
            });
        },

        showBudgetModal(drawDate, currentBudget, parentContainer) {
            if (typeof document === 'undefined' || !document.body) return;

            const modal = document.createElement('dialog');
            modal.className = 'book-dialog';
            modal.innerHTML = `
                <div class="bg-surface w-full max-w-md rounded-lg p-6 border border-line space-y-4">
                    <div class="flex justify-between items-center">
                        <h2 class="text-base font-bold text-ink">ตั้งงบประมาณงวด ${formatShortThaiDate(drawDate)}</h2>
                        <button type="button" aria-label="ปิดหน้าต่าง" class="btn-close-modal text-muted hover:text-ink text-lg">✕</button>
                    </div>
                    <form id="budgetModalForm" class="space-y-4">
                        <div>
                            <label for="budgetModalInput" class="block text-base font-semibold text-ink mb-1">วงเงินงบประมาณ (บาท)</label>
                            <input type="number" id="budgetModalInput" min="0" step="10" value="${currentBudget || 500}"
                                class="w-full bg-surface border border-line rounded-lg px-3 py-2 text-base font-bold text-ink focus:ring-2 focus:ring-accent focus:outline-none">
                            <div class="flex flex-wrap gap-1.5 mt-2">
                                ${[200, 500, 1000, 2000, 0].map(val => `
                                    <button type="button" data-budget-preset="${val}" class="px-2.5 py-1 text-sm bg-raised hover:bg-surface border border-line rounded-lg text-ink">
                                        ${val === 0 ? 'ไม่จำกัด (0)' : `฿${val.toLocaleString()}`}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        <div class="flex justify-end gap-2 pt-2">
                            <button type="button" class="btn-close-modal px-4 py-2 text-base text-muted hover:bg-raised rounded-lg transition">ยกเลิก</button>
                            <button type="submit" class="px-4 py-2 text-base font-semibold bg-action text-white rounded-lg transition">บันทึกงบประมาณ</button>
                        </div>
                    </form>
                </div>
            `;
            modal.setAttribute('aria-label', `ตั้งงบประมาณงวด ${formatShortThaiDate(drawDate)}`);
            document.body.appendChild(modal);
            modal.addEventListener('close', () => modal.remove(), { once: true });
            if (typeof modal.showModal === 'function') modal.showModal();

            const closeModal = () => {
                if (typeof modal.close === 'function') modal.close();
                else modal.remove();
            };
            modal.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', closeModal));
            const input = modal.querySelector('#budgetModalInput');
            modal.querySelectorAll('[data-budget-preset]').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (input) input.value = btn.dataset.budgetPreset;
                });
            });
            modal.querySelector('#budgetModalForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                const amount = Math.max(0, parseFloat(input?.value) || 0);
                root.LottoStorage.setBudgetForDraw(drawDate, amount);
                closeModal();
                root.LottoApp.showToast(`ตั้งงบประมาณงวด ${formatShortThaiDate(drawDate)} เป็น ฿${amount.toLocaleString()} แล้ว`, 'success');
                this.render(parentContainer);
            });
        },

        showExportModal() {
            const jsonStr = root.LottoStorage.exportDataJSON();
            const csvStr = root.LottoStorage.exportTicketsCSV();

            const modal = document.createElement('dialog');
            modal.className = 'book-dialog';
            modal.innerHTML = `
                <div class="bg-surface  w-full max-w-md rounded-lg p-6  border border-line  space-y-4">
                    <div class="flex justify-between items-center">
                        <h2 class="text-base font-bold text-ink ">สำรองข้อมูลสลาก & งบ</h2>
                        <button type="button" aria-label="ปิดหน้าต่าง" class="btn-close-modal text-muted hover:text-muted  text-lg">✕</button>
                    </div>
                    <p class="text-base text-muted ">
                        เลือกรูปแบบไฟล์ที่ต้องการสำรองข้อมูล คุณสามารถนำไฟล์นี้มานำเข้ากู้คืนในอนาคตได้ตลอดเวลา
                    </p>
                    <div class="grid grid-cols-2 gap-3 pt-2">
                        <button type="button" id="btnDownloadJSON" class="p-3 border border-line  hover:border-accent rounded-lg text-center group transition">
                            <div class="text-base font-bold text-ink  group-hover:text-accent">ดาวน์โหลด JSON</div>
                            <div class="text-base text-muted">สลาก, งบ, และผลย้อนหลัง</div>
                        </button>
                        <button type="button" id="btnDownloadCSV" class="p-3 border border-line  hover:border-accent rounded-lg text-center group transition">
                            <div class="text-base font-bold text-ink  group-hover:text-accent">ดาวน์โหลด CSV</div>
                            <div class="text-base text-muted">เปิดใน Excel / Sheets</div>
                        </button>
                    </div>
                </div>
            `;
            modal.setAttribute('aria-label', modal.querySelector('h2').textContent.trim());
            document.body.appendChild(modal);
            modal.addEventListener('close', () => modal.remove(), { once: true });
            modal.showModal();

            const closeModal = () => modal.close();
            modal.querySelector('.btn-close-modal').addEventListener('click', closeModal);

            modal.querySelector('#btnDownloadJSON').addEventListener('click', () => {
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `lotto_book_backup_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                root.LottoStorage.markBackupDone();
                closeModal();
                root.LottoApp.showToast('ดาวน์โหลดไฟล์ JSON สำรองข้อมูลเรียบร้อยแล้ว', 'success');
            });

            modal.querySelector('#btnDownloadCSV').addEventListener('click', () => {
                const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `lotto_tickets_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                closeModal();
                root.LottoApp.showToast('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว', 'success');
            });
        },

        showImportModal(parentContainer) {
            const modal = document.createElement('dialog');
            modal.className = 'book-dialog';
            modal.innerHTML = `
                <div class="bg-surface  w-full max-w-md rounded-lg p-6  border border-line  space-y-4">
                    <div class="flex justify-between items-center">
                        <h2 class="text-base font-bold text-ink ">นำเข้าข้อมูลสำรอง</h2>
                        <button type="button" aria-label="ปิดหน้าต่าง" class="btn-close-modal text-muted hover:text-muted  text-lg">✕</button>
                    </div>
                    <p class="text-base text-muted ">
                        เลือกไฟล์ JSON ที่เคยสำรองไว้เพื่อนำข้อมูลสลากและงบประมาณกลับเข้ามา
                    </p>
                    <input type="file" id="importFileInput" accept=".json" class="block w-full text-base text-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-base file:font-semibold file:bg-raised file:text-accent hover:file:bg-surface cursor-pointer">
                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" class="btn-close-modal px-4 py-2 text-base text-muted  hover:bg-raised  rounded-lg transition">ยกเลิก</button>
                    </div>
                </div>
            `;
            modal.setAttribute('aria-label', modal.querySelector('h2').textContent.trim());
            document.body.appendChild(modal);
            modal.addEventListener('close', () => modal.remove(), { once: true });
            modal.showModal();

            const closeModal = () => modal.close();
            modal.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', closeModal));

            const fileInput = modal.querySelector('#importFileInput');
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target.result;
                    const res = root.LottoStorage.importDataJSON(content, 'merge');
                    if (res.success) {
                        root.LottoApp.showToast('นำเข้าข้อมูลเรียบร้อยแล้ว', 'success');
                        closeModal();
                        this.render(parentContainer);
                    } else {
                        root.LottoApp.showToast(`เกิดข้อผิดพลาด: ${res.error}`, 'error');
                    }
                };
                reader.readAsText(file);
            });
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MyTicketsView;
    } else {
        root.LottoMyTicketsView = MyTicketsView;
    }
})(typeof window !== 'undefined' ? window : global);
