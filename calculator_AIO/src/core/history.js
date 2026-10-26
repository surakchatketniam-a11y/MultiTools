// ==============================================================
// Multitools Calculator - Calculation History & Saved Sets
// ==============================================================

const HISTORY_STORAGE_KEY = 'calc_aio_history';
const MAX_HISTORY_UNPINNED = 20;

function getCalculationHistory() {
    try {
        if (typeof localStorage === 'undefined') return [];
        const storageKey = typeof HISTORY_STORAGE_KEY !== 'undefined' ? HISTORY_STORAGE_KEY : 'calc_aio_history';
        const raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveCalculationHistory(list) {
    try {
        if (typeof localStorage === 'undefined') return;
        const storageKey = typeof HISTORY_STORAGE_KEY !== 'undefined' ? HISTORY_STORAGE_KEY : 'calc_aio_history';
        localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (e) {
        console.error('Failed to save calculation history:', e);
    }
}

function formatHistoryTime(date) {
    const d = (date instanceof Date) ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (isToday) return `วันนี้ ${timeStr} น.`;
    const day = d.getDate();
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${day} ${months[d.getMonth()]} ${timeStr} น.`;
}

function extractShortSummary(summaryText) {
    if (!summaryText) return '';
    const lines = summaryText.split('\n').map(l => l.trim()).filter(Boolean);
    const highlight = lines.find(l => /^(?:ยอด|ค่า|ราคา|ผล|ตัวเลือก|เงิน)/.test(l))
        || lines.find(l => !l.startsWith('---') && !l.startsWith('•') && !l.startsWith('(') && !l.includes('สรุป'));
    if (highlight) {
        return highlight.replace(/^[^\wก-๙]+/, '').trim();
    }
    const fallback = lines.find(l => !l.startsWith('---') && !l.includes('สรุป') && !l.includes('Multitools'));
    return fallback ? fallback.replace(/^[•\-\*]\s*/, '').trim() : lines[0] || '';
}

function extractDetailText(summaryText) {
    if (!summaryText) return '';
    const bullets = summaryText.split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('•') && !l.includes('กติกา'))
        .map(l => l.replace(/^•\s*/, ''));
    return bullets.slice(0, 2).join(' · ');
}

function recordCalculationHistory(stateObj, toolId, isSaved = false, customLabel = '', summaryOverride = '') {
    if (!stateObj || !toolId || !stateObj[toolId]) return null;
    const history = getCalculationHistory();
    const toolMeta = (typeof TOOLS_CATALOG !== 'undefined' ? TOOLS_CATALOG.find(t => t.id === toolId) : null) || { menuTitle: toolId, headerTitle: toolId };
    const toolTitle = toolMeta.menuTitle || toolMeta.headerTitle;
    const summary = summaryOverride || (typeof getToolSummaryText === 'function' ? getToolSummaryText(toolId) : '');
    const shortSum = extractShortSummary(summary);
    const detail = extractDetailText(summary);

    const entry = {
        id: 'hist_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        toolId,
        toolTitle,
        timestamp: Date.now(),
        timeDisplay: formatHistoryTime(new Date()),
        shortSummary: shortSum,
        fullSummary: summary,
        detailText: detail,
        state: JSON.parse(JSON.stringify(stateObj[toolId])),
        isSaved: Boolean(isSaved),
        label: String(customLabel || '').trim()
    };

    const unpinned = [];
    const pinned = [];
    const nextList = [entry, ...history];

    const maxCap = typeof MAX_HISTORY_UNPINNED !== 'undefined' ? MAX_HISTORY_UNPINNED : 20;

    for (const item of nextList) {
        if (item.isSaved) {
            pinned.push(item);
        } else {
            if (unpinned.length < maxCap) {
                unpinned.push(item);
            }
        }
    }
    const finalList = [...pinned, ...unpinned];
    saveCalculationHistory(finalList);
    return entry;
}

function pinCalculationHistory(id, customLabel = '') {
    const history = getCalculationHistory();
    const target = history.find(h => h.id === id);
    if (!target) return null;
    target.isSaved = true;
    if (customLabel) target.label = customLabel.trim();
    saveCalculationHistory(history);
    return target;
}

function unpinCalculationHistory(id) {
    const history = getCalculationHistory();
    const target = history.find(h => h.id === id);
    if (!target) return null;
    target.isSaved = false;
    saveCalculationHistory(history);
    return target;
}

function renameCalculationHistory(id, newLabel) {
    const history = getCalculationHistory();
    const target = history.find(h => h.id === id);
    if (!target) return null;
    target.label = String(newLabel || '').trim();
    saveCalculationHistory(history);
    return target;
}

function deleteCalculationHistory(id) {
    const history = getCalculationHistory();
    const next = history.filter(h => h.id !== id);
    saveCalculationHistory(next);
    return next;
}

function clearCalculationHistory(onlyUnsaved = true) {
    const history = getCalculationHistory();
    const next = onlyUnsaved ? history.filter(h => h.isSaved) : [];
    saveCalculationHistory(next);
    return next;
}

// Copies a saved set into a new saved set placed right after it. The copy keeps the original values,
// so the user can load it, change values, and leave the original untouched.
function duplicateCalculationHistory(id) {
    const history = getCalculationHistory();
    const index = history.findIndex(h => h.id === id);
    if (index < 0 || !history[index].isSaved) return null;
    const original = history[index];
    const copy = {
        ...original,
        id: 'hist_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        timestamp: Date.now(),
        timeDisplay: formatHistoryTime(new Date()),
        state: JSON.parse(JSON.stringify(original.state)),
        isSaved: true,
        label: `${original.label || original.toolTitle} (สำเนา)`
    };
    history.splice(index + 1, 0, copy);
    saveCalculationHistory(history);
    return copy;
}

function restoreCalculationHistory(id, stateObj) {
    const history = getCalculationHistory();
    const target = history.find(h => h.id === id);
    if (!target || !stateObj) return null;
    stateObj[target.toolId] = JSON.parse(JSON.stringify(target.state));
    stateObj.activeToolId = target.toolId;
    stateObj.activeFieldIndex = 0;
    return target;
}

let historyDebounceTimer = null;
const lastRecordedSignatures = {};

function scheduleRecordHistory(toolId) {
    if (typeof window === 'undefined') return;
    if (historyDebounceTimer) clearTimeout(historyDebounceTimer);
    historyDebounceTimer = setTimeout(() => {
        try {
            if (!appState || appState.activeToolId !== toolId) return;
            const curState = appState[toolId];
            if (!curState) return;
            const stateStr = JSON.stringify(curState);
            if (lastRecordedSignatures[toolId] === stateStr) return;

            const summary = (typeof getToolSummaryText === 'function') ? getToolSummaryText(toolId) : '';
            const shortSum = extractShortSummary(summary);
            if (!shortSum || shortSum.includes('กรุณา') || shortSum.includes('ป้อนข้อมูล')) return;

            recordCalculationHistory(appState, toolId, false);
            lastRecordedSignatures[toolId] = stateStr;
            updateHistoryBadge();
            if (activeDrawerTab === 'history') {
                renderHistoryPanel();
            }
        } catch (e) {
            console.warn('Auto record history error:', e);
        }
    }, 1200);
}

function showHistoryToast(message, isSuccess = true) {
    if (typeof document === 'undefined') return;
    let toast = document.getElementById('historyFloatingToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'historyFloatingToast';
        toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold shadow-lg transition-all duration-300 pointer-events-none opacity-0 translate-y-2';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold shadow-lg transition-all duration-300 pointer-events-none ${isSuccess ? 'bg-[var(--app-ink)] text-[var(--color-canvas)]' : 'bg-red-600 text-white'} opacity-100 translate-y-0`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-2');
    }, 2200);
}

let activeDrawerTab = 'tools';

function switchDrawerTab(tab) {
    if (typeof document === 'undefined') return;
    activeDrawerTab = tab;
    const tabTools = document.getElementById('sidebarTabTools');
    const tabHistory = document.getElementById('sidebarTabHistory');
    const searchContainer = document.getElementById('sidebarSearchContainer');
    const contentArea = document.getElementById('sidebarContentArea');
    const historyArea = document.getElementById('sidebarHistoryArea');

    if (tab === 'history') {
        if (tabHistory) tabHistory.className = 'py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 bg-[var(--color-canvas)] text-[var(--app-ink)] shadow-sm cursor-pointer';
        if (tabTools) tabTools.className = 'py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 text-[var(--app-muted)] hover:text-[var(--app-ink)] cursor-pointer';
        searchContainer?.classList.add('hidden');
        contentArea?.classList.add('hidden');
        historyArea?.classList.remove('hidden');
        renderHistoryPanel();
    } else {
        if (tabTools) tabTools.className = 'py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 bg-[var(--color-canvas)] text-[var(--app-ink)] shadow-sm cursor-pointer';
        if (tabHistory) tabHistory.className = 'py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 text-[var(--app-muted)] hover:text-[var(--app-ink)] cursor-pointer';
        searchContainer?.classList.remove('hidden');
        contentArea?.classList.remove('hidden');
        historyArea?.classList.add('hidden');
        renderSidebarMenu();
    }
    updateHistoryBadge();
}

function updateHistoryBadge() {
    if (typeof document === 'undefined') return;
    const list = getCalculationHistory();
    const badge = document.getElementById('sidebarHistoryBadge');
    if (badge) {
        badge.textContent = list.length;
        badge.style.display = list.length > 0 ? 'inline-block' : 'none';
    }
}

function createHistoryCardHTML(item) {
    return `
        <div class="history-item-card themed-subcard rounded-xl p-2.5 shadow-sm hover:border-[var(--app-accent)] transition cursor-pointer group" data-id="${item.id}">
            <div class="flex items-start justify-between gap-1.5">
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                            ${escapeHTML(item.toolTitle)}
                        </span>
                        ${item.label ? `<span class="text-xs font-bold text-[var(--app-ink)] truncate max-w-[160px]">${escapeHTML(item.label)}</span>` : ''}
                    </div>
                    <div class="text-xs font-semibold text-[var(--app-ink)] mt-1 truncate">
                        ${escapeHTML(item.shortSummary || 'ผลการคำนวณ')}
                    </div>
                    ${item.detailText ? `<div class="text-[11px] text-[var(--app-body)] mt-0.5 truncate">${escapeHTML(item.detailText)}</div>` : ''}
                </div>
                <div class="flex items-center gap-0.5 shrink-0 ml-1">
                    <button type="button" class="btn-pin-history p-1.5 rounded-full hover:bg-[var(--app-surface-soft)] text-sm" title="${item.isSaved ? 'เลิกบันทึก' : 'บันทึกเป็นชุดเปรียบเทียบ'}" data-id="${item.id}">
                        ${item.isSaved ? '★' : '☆'}
                    </button>
                    ${item.isSaved ? `<button type="button" class="btn-dup-history p-1.5 rounded-full hover:bg-[var(--app-surface-soft)] text-xs" title="ทำสำเนาชุดนี้" data-id="${item.id}">ทำสำเนา</button>` : ''}
                    ${item.isSaved ? `<button type="button" class="btn-rename-history p-1.5 rounded-full hover:bg-[var(--app-surface-soft)] text-xs" title="เปลี่ยนชื่อ" data-id="${item.id}">เปลี่ยนชื่อ</button>` : ''}
                    <button type="button" class="btn-del-history p-1.5 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-500 text-xs" title="ลบรายการนี้" data-id="${item.id}">✕</button>
                </div>
            </div>
            <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-[var(--app-hairline)] text-[10px] text-[var(--app-muted)]">
                <span>${escapeHTML(item.timeDisplay)}</span>
                <span class="text-[var(--app-accent)] font-semibold group-hover:underline">แตะเพื่อโหลด ↗</span>
            </div>
        </div>
    `;
}

function renderHistoryPanel() {
    if (typeof document === 'undefined') return;
    const list = getCalculationHistory();
    const savedList = list.filter(item => item.isSaved);
    const recentList = list.filter(item => !item.isSaved);

    const savedContainer = document.getElementById('historySavedList');
    const recentContainer = document.getElementById('historyRecentList');
    const savedSection = document.getElementById('historySavedSection');
    const recentSection = document.getElementById('historyRecentSection');
    const emptyState = document.getElementById('historyEmptyState');
    const savedCountEl = document.getElementById('historySavedCount');
    const recentCountEl = document.getElementById('historyRecentCount');

    if (savedCountEl) savedCountEl.textContent = `${savedList.length} ชุด`;
    if (recentCountEl) recentCountEl.textContent = `${recentList.length} รายการ`;

    if (!list.length) {
        if (savedSection) savedSection.classList.add('hidden');
        if (recentSection) recentSection.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (savedSection) savedSection.classList.toggle('hidden', savedList.length === 0);
    if (recentSection) recentSection.classList.toggle('hidden', recentList.length === 0);



    if (savedContainer) {
        savedContainer.innerHTML = savedList.map(createHistoryCardHTML).join('');
    }
    if (recentContainer) {
        recentContainer.innerHTML = recentList.map(createHistoryCardHTML).join('');
    }

    document.querySelectorAll('.history-item-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const id = card.dataset.id;
            const restored = restoreCalculationHistory(id, appState);
            if (restored) {
                closeSidebar();
                selectTool(restored.toolId);
                showHistoryToast(`✓ โหลด "${restored.label || restored.toolTitle}" สำเร็จ`);
            }
        });
    });

    document.querySelectorAll('.btn-pin-history').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const history = getCalculationHistory();
            const item = history.find(h => h.id === id);
            if (!item) return;
            if (item.isSaved) {
                unpinCalculationHistory(id);
                showHistoryToast('ยกเลิกการบันทึกชุดคำนวณแล้ว');
                renderHistoryPanel();
                updateHistoryBadge();
            } else {
                showAppDialogModal({
                    title: 'บันทึกชุดคำนวณไว้เปรียบเทียบ',
                    message: 'ตั้งชื่อชุดคำนวณนี้ (เช่น บ้านโครงการ A):',
                    defaultValue: item.label || item.toolTitle,
                    showInput: true,
                    confirmText: 'บันทึก',
                    onConfirm: (label) => {
                        pinCalculationHistory(id, label);
                        showHistoryToast(`✓ บันทึก "${label || item.toolTitle}" เรียบร้อย`);
                        renderHistoryPanel();
                        updateHistoryBadge();
                    }
                });
            }
        });
    });

    document.querySelectorAll('.btn-dup-history').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const copy = duplicateCalculationHistory(btn.dataset.id);
            if (!copy) return;
            const restored = restoreCalculationHistory(copy.id, appState);
            if (restored) {
                closeSidebar();
                selectTool(restored.toolId);
                showHistoryToast(`✓ สร้างสำเนา "${copy.label}" แล้ว แก้ค่าได้เลย`);
            }
        });
    });

    document.querySelectorAll('.btn-rename-history').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const history = getCalculationHistory();
            const item = history.find(h => h.id === id);
            if (!item) return;
            showAppDialogModal({
                title: 'เปลี่ยนชื่อชุดคำนวณ',
                message: 'ระบุชื่อใหม่สำหรับชุดคำนวณนี้:',
                defaultValue: item.label || item.toolTitle,
                showInput: true,
                confirmText: 'บันทึกชื่อใหม่',
                onConfirm: (newLabel) => {
                    if (newLabel && newLabel.trim()) {
                        renameCalculationHistory(id, newLabel.trim());
                        renderHistoryPanel();
                    }
                }
            });
        });
    });

    document.querySelectorAll('.btn-del-history').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            deleteCalculationHistory(id);
            renderHistoryPanel();
            updateHistoryBadge();
        });
    });
}

function showAppDialogModal(options = {}) {
    const {
        title = 'ยืนยันรายการ',
        message = '',
        defaultValue = '',
        showInput = false,
        confirmText = 'ตกลง',
        cancelText = 'ยกเลิก',
        danger = false,
        onConfirm = () => {}
    } = options;

    if (typeof document === 'undefined' || !document.body) {
        if (showInput && typeof prompt === 'function') {
            const val = prompt(message || title, defaultValue);
            if (val !== null) onConfirm(val);
        } else if (!showInput && typeof confirm === 'function') {
            if (confirm(message || title)) onConfirm(true);
        }
        return;
    }

    const existing = document.getElementById('appGenericDialogModal');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'appGenericDialogModal';
    wrapper.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-[1px]';
    wrapper.setAttribute('role', 'dialog');
    wrapper.setAttribute('aria-modal', 'true');
    wrapper.innerHTML = `
        <div class="themed-tool-card w-full max-w-sm rounded-[20px] p-5 text-[var(--app-ink)] space-y-3" style="box-shadow: var(--airbnb-shadow);">
            <div class="flex justify-between items-center border-b border-[var(--app-hairline)] pb-2.5">
                <h3 class="font-bold text-sm text-[var(--app-ink)]">${escapeHTML(title)}</h3>
                <button type="button" id="appDialogCloseBtn" class="text-[var(--app-muted)] hover:text-[var(--app-ink)] p-1 rounded-full" aria-label="ปิดหน้าต่าง">✕</button>
            </div>
            ${message ? `<p class="text-xs text-[var(--app-body)] leading-relaxed whitespace-pre-line">${escapeHTML(message)}</p>` : ''}
            ${showInput ? `
                <div>
                    <input type="text" id="appDialogInput" value="${escapeHTML(defaultValue)}" class="airbnb-input w-full text-xs font-semibold" autocomplete="off">
                </div>
            ` : ''}
            <div class="flex justify-end gap-2 pt-2">
                <button type="button" id="appDialogCancelBtn" class="px-3.5 py-2 rounded-lg text-xs font-semibold border border-[var(--app-hairline)] text-[var(--app-body)] bg-[var(--app-surface-soft)] hover:opacity-90 transition">${escapeHTML(cancelText)}</button>
                <button type="button" id="appDialogConfirmBtn" class="px-4 py-2 rounded-lg text-xs font-semibold text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[var(--app-accent)] hover:opacity-90'} transition">${escapeHTML(confirmText)}</button>
            </div>
        </div>
    `;
    document.body.appendChild(wrapper);

    const inputEl = wrapper.querySelector('#appDialogInput');
    const closeDialog = () => wrapper.remove();
    const submitDialog = () => {
        const val = showInput ? (inputEl ? inputEl.value : '') : true;
        closeDialog();
        onConfirm(val);
    };

    wrapper.querySelector('#appDialogCloseBtn')?.addEventListener('click', closeDialog);
    wrapper.querySelector('#appDialogCancelBtn')?.addEventListener('click', closeDialog);
    wrapper.querySelector('#appDialogConfirmBtn')?.addEventListener('click', submitDialog);
    wrapper.addEventListener('click', (e) => {
        if (e.target === wrapper) closeDialog();
    });
    if (inputEl) {
        inputEl.focus();
        if (typeof inputEl.select === 'function') inputEl.select();
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitDialog();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeDialog();
            }
        });
    }
}

function promptSaveCurrentSet() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const toolId = appState.activeToolId;
    const toolMeta = (typeof TOOLS_CATALOG !== 'undefined' ? TOOLS_CATALOG.find(t => t.id === toolId) : null) || { menuTitle: toolId };
    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    const defaultName = `${toolMeta.menuTitle || toolId} (${timeStr})`;
    showAppDialogModal({
        title: 'บันทึกชุดคำนวณนี้ (Save Set)',
        message: 'ตั้งชื่อชุดคำนวณนี้สำหรับเปรียบเทียบ (เช่น บ้านโครงการ A):',
        defaultValue: defaultName,
        showInput: true,
        confirmText: 'บันทึกชุดนี้',
        onConfirm: (label) => {
            const finalLabel = (label && label.trim()) ? label.trim() : defaultName;
            const entry = recordCalculationHistory(appState, toolId, true, finalLabel);
            if (entry) {
                showHistoryToast(`บันทึกชุดคำนวณ "${finalLabel}" แล้ว`);
                updateHistoryBadge();
                if (activeDrawerTab === 'history') {
                    renderHistoryPanel();
                }
            }
        }
    });
}

(function(root) {
    const exportsObj = {
        HISTORY_STORAGE_KEY,
        MAX_HISTORY_UNPINNED,
        getCalculationHistory,
        saveCalculationHistory,
        formatHistoryTime,
        extractShortSummary,
        extractDetailText,
        recordCalculationHistory,
        pinCalculationHistory,
        unpinCalculationHistory,
        renameCalculationHistory,
        deleteCalculationHistory,
        clearCalculationHistory,
        restoreCalculationHistory,
        duplicateCalculationHistory,
        scheduleRecordHistory,
        showHistoryToast,
        switchDrawerTab,
        updateHistoryBadge,
        renderHistoryPanel,
        createHistoryCardHTML,
        showAppDialogModal,
        promptSaveCurrentSet
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
