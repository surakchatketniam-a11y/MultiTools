// ==============================================================
// Multitools Calculator - Modals, Dropdown & PWA Setup
// ==============================================================

let deferredInstallPrompt = null;

function openModal() {
    if (typeof document === 'undefined') return;
    const infoModal = document.getElementById('infoModal');
    if (infoModal) infoModal.classList.remove('hidden');
}

function closeModal() {
    if (typeof document === 'undefined') return;
    const infoModal = document.getElementById('infoModal');
    if (infoModal) infoModal.classList.add('hidden');
}

function createAppIconDataURL(size = 192) {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(0, 0, size, size, size * 0.24);
    } else {
        ctx.rect(0, 0, size, size);
    }
    ctx.fill();

    ctx.fillStyle = '#ff385c';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8, size * 0.2);
    } else {
        ctx.rect(size * 0.1, size * 0.1, size * 0.8, size * 0.8);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(size * 0.22)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const catalogLen = (typeof TOOLS_CATALOG !== 'undefined') ? TOOLS_CATALOG.length : 22;
    ctx.fillText(`${catalogLen} in 1`, size / 2, size * 0.36);

    const cols = [0.3, 0.5, 0.7];
    const rows = [0.62, 0.76];
    rows.forEach(ry => {
        cols.forEach((cx) => {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(size * cx, size * ry, size * 0.055, 0, Math.PI * 2);
            ctx.fill();
        });
    });

    return canvas.toDataURL('image/png');
}

function setupPWA() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    try {
        const icon192 = createAppIconDataURL(192);
        const icon512 = createAppIconDataURL(512);

        const appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        appleIcon.href = icon192;
        document.head.appendChild(appleIcon);

        const catalogLen = (typeof TOOLS_CATALOG !== 'undefined') ? TOOLS_CATALOG.length : 22;
        const manifest = {
            name: 'เครื่องคำนวณครบวงจร (All-in-One Calculator)',
            short_name: 'เครื่องคำนวณ',
            description: `รวม ${catalogLen} เครื่องคำนวณในแอปเดียว พร้อมดีไซน์ Airbnb Rausch และ Classic`,
            start_url: window.location.href,
            display: 'standalone',
            orientation: 'portrait',
            background_color: '#ffffff',
            theme_color: '#ff385c',
            icons: [
                { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
                { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
            ]
        };

        const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
        const manifestURL = URL.createObjectURL(manifestBlob);
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = manifestURL;
        document.head.appendChild(manifestLink);

        if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
            navigator.serviceWorker.register('./sw.js').then(reg => {
                console.log('PWA ServiceWorker registered with scope:', reg.scope);
            }).catch(err => {
                console.warn('PWA ServiceWorker registration failed:', err);
            });
        }
    } catch (e) {
        console.warn('PWA setup skipped:', e);
    }
}

async function triggerInstallFlow() {
    if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') deferredInstallPrompt = null;
    } else {
        openModal();
    }
}

function initDropdownListeners() {
    if (typeof document === 'undefined') return;
    const moreBtn = document.getElementById('moreBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    moreBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu?.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        dropdownMenu?.classList.add('hidden');
    });

    document.getElementById('menuClearCurrent')?.addEventListener('click', () => {
        if (typeof clearCurrentTool === 'function') clearCurrentTool();
    });
    document.getElementById('menuUndoClear')?.addEventListener('click', () => {
        if (typeof undoLastClear === 'function') undoLastClear();
    });
    document.getElementById('menuLoadSample')?.addEventListener('click', () => {
        if (typeof loadDemoForCurrentTool === 'function') loadDemoForCurrentTool();
    });
    document.getElementById('menuSaveCurrent')?.addEventListener('click', () => {
        dropdownMenu?.classList.add('hidden');
        if (typeof promptSaveCurrentSet === 'function') promptSaveCurrentSet();
    });
    document.getElementById('menuOpenHistory')?.addEventListener('click', () => {
        dropdownMenu?.classList.add('hidden');
        if (typeof openSidebar === 'function') openSidebar();
        if (typeof switchDrawerTab === 'function') switchDrawerTab('history');
    });
    document.getElementById('menuPrintPDF')?.addEventListener('click', () => {
        dropdownMenu?.classList.add('hidden');
        if (typeof triggerPrintReceipt === 'function') triggerPrintReceipt();
    });
    document.getElementById('bannerPrintBtn')?.addEventListener('click', () => {
        if (typeof triggerPrintReceipt === 'function') triggerPrintReceipt();
    });

    if (typeof window !== 'undefined') {
        window.addEventListener('beforeprint', () => {
            const printEl = document.getElementById('printFormalReceipt');
            if (printEl && (!printEl.innerHTML || !printEl.innerHTML.trim())) {
                if (typeof generateFormalPrintHTML === 'function' && typeof appState !== 'undefined') {
                    printEl.innerHTML = generateFormalPrintHTML(appState.activeToolId, appState);
                }
            }
        });
    }

    document.getElementById('sidebarTabTools')?.addEventListener('click', () => {
        if (typeof switchDrawerTab === 'function') switchDrawerTab('tools');
    });
    document.getElementById('sidebarTabHistory')?.addEventListener('click', () => {
        if (typeof switchDrawerTab === 'function') switchDrawerTab('history');
    });
    document.getElementById('btnSaveCurrentSet')?.addEventListener('click', () => {
        if (typeof promptSaveCurrentSet === 'function') promptSaveCurrentSet();
    });
    document.getElementById('btnClearHistory')?.addEventListener('click', () => {
        if (typeof getCalculationHistory !== 'function') return;
        const list = getCalculationHistory();
        const unpinned = list.filter(h => !h.isSaved);
        if (!unpinned.length) {
            if (typeof showHistoryToast === 'function') showHistoryToast('ไม่มีประวัติล่าสุดให้ล้าง');
            return;
        }
        if (typeof confirm === 'function' && confirm(`ล้างประวัติการคำนวณล่าสุดทั้งหมด ${unpinned.length} รายการหรือไม่?\n(ชุดที่คุณบันทึกไว้จะไม่ถูกลบ)`)) {
            if (typeof clearCalculationHistory === 'function') clearCalculationHistory(true);
            if (typeof renderHistoryPanel === 'function') renderHistoryPanel();
            if (typeof updateHistoryBadge === 'function') updateHistoryBadge();
            if (typeof showHistoryToast === 'function') showHistoryToast('✓ ล้างประวัติการคำนวณล่าสุดแล้ว');
        }
    });
}

function initModalListeners() {
    if (typeof document === 'undefined') return;
    const infoModal = document.getElementById('infoModal');

    document.getElementById('menuInstallPWA')?.addEventListener('click', triggerInstallFlow);
    document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
    document.getElementById('modalOkBtn')?.addEventListener('click', closeModal);
    infoModal?.addEventListener('click', (e) => {
        if (e.target === infoModal) closeModal();
    });
}

function initCompareModalListeners() {
    if (typeof document === 'undefined') return;
    const dropdownMenu = document.getElementById('dropdownMenu');
    const compareModal = document.getElementById('compareModal');

    document.getElementById('btnOpenCompareModal')?.addEventListener('click', () => {
        if (typeof closeSidebar === 'function') closeSidebar();
        if (typeof openCompareModal === 'function') openCompareModal();
    });
    document.getElementById('menuQuickCompare')?.addEventListener('click', () => {
        dropdownMenu?.classList.add('hidden');
        if (typeof openCompareModal === 'function') openCompareModal();
    });
    document.getElementById('closeCompareModalBtn')?.addEventListener('click', () => {
        if (typeof closeCompareModal === 'function') closeCompareModal();
    });
    document.getElementById('closeCompareModalOkBtn')?.addEventListener('click', () => {
        if (typeof closeCompareModal === 'function') closeCompareModal();
    });
    compareModal?.addEventListener('click', (e) => {
        if (e.target === compareModal && typeof closeCompareModal === 'function') closeCompareModal();
    });
    document.getElementById('compareToolSelect')?.addEventListener('change', () => {
        if (typeof populateCompareSlots === 'function') populateCompareSlots();
        if (typeof renderCompareMatrix === 'function') renderCompareMatrix();
    });
    document.getElementById('compareSlotA')?.addEventListener('change', () => {
        if (typeof renderCompareMatrix === 'function') renderCompareMatrix();
    });
    document.getElementById('compareSlotB')?.addEventListener('change', () => {
        if (typeof renderCompareMatrix === 'function') renderCompareMatrix();
    });
    document.getElementById('compareSlotC')?.addEventListener('change', () => {
        if (typeof renderCompareMatrix === 'function') renderCompareMatrix();
    });
    document.getElementById('btnToggleSlotC')?.addEventListener('click', () => {
        if (typeof isCompareSlotCActive !== 'undefined') {
            isCompareSlotCActive = !isCompareSlotCActive;
        }
        if (typeof updateSlotCUI === 'function') updateSlotCUI();
        if (typeof renderCompareMatrix === 'function') renderCompareMatrix();
    });
    document.getElementById('btnComparePreset')?.addEventListener('click', () => {
        const toolId = document.getElementById('compareToolSelect')?.value || 'loan';
        if (typeof getComparisonPresets !== 'function') return;
        const presets = getComparisonPresets(toolId);
        if (!presets || presets.length < 2) return;
        if (typeof isCompareSlotCActive !== 'undefined') {
            isCompareSlotCActive = presets.length >= 3;
        }
        if (typeof updateSlotCUI === 'function') updateSlotCUI();
        const slotA = document.getElementById('compareSlotA');
        const slotB = document.getElementById('compareSlotB');
        const slotC = document.getElementById('compareSlotC');
        if (slotA) slotA.value = 'preset_0';
        if (slotB) slotB.value = 'preset_1';
        if (slotC && presets.length >= 3) slotC.value = 'preset_2';
        if (typeof renderCompareMatrix === 'function') renderCompareMatrix();
        if (typeof showHistoryToast === 'function') showHistoryToast('โหลดตัวอย่างเปรียบเทียบเรียบร้อย');
    });
    document.getElementById('btnPrintCompareSummary')?.addEventListener('click', () => {
        if (typeof currentCompareData === 'undefined' || !currentCompareData) return;
        const printEl = document.getElementById('printFormalReceipt');
        if (printEl && typeof generateComparePrintHTML === 'function') {
            printEl.innerHTML = generateComparePrintHTML(currentCompareData);
        }
        if (typeof window !== 'undefined') window.print();
    });
}

function initPwaListeners() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        document.getElementById('modalDirectInstallBtn')?.classList.remove('hidden');
    });

    document.getElementById('footerInstallBtn')?.addEventListener('click', triggerInstallFlow);
    document.getElementById('modalDirectInstallBtn')?.addEventListener('click', triggerInstallFlow);
}

function initAppListeners() {
    initDropdownListeners();
    initModalListeners();
    initCompareModalListeners();
    initPwaListeners();
    if (typeof initThemeListeners === 'function') initThemeListeners();
}

(function(root) {
    const exportsObj = {
        openModal,
        closeModal,
        createAppIconDataURL,
        setupPWA,
        triggerInstallFlow,
        initDropdownListeners,
        initModalListeners,
        initCompareModalListeners,
        initPwaListeners,
        initAppListeners
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
