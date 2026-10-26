/**
 * lotto_book - Application Bootstrap & Navigation Controller
 */

(function(root) {
    'use strict';

    const App = {
        currentTab: 'tickets', // 'tickets', 'check', 'stats'
        historicalResults: [],
        builtInResults: [],
        resultsMap: {},
        syncInProgress: false,

        async init() {
            console.log('[LottoBook] Initializing application...');

            root.LottoTheme.init();
            this.mergeResults();
            this.consumeSharedParams();
            this.initNavigation();
            this.handleHashChange();
            this.registerServiceWorker();

            await this.loadHistoricalData();
            if (this.currentTab !== 'tickets') {
                this.renderCurrentView();
            }

            if (navigator.onLine) this.syncLatestResult(false);
            window.setInterval(() => this.maybeSyncResults(), 15 * 60 * 1000);
            window.addEventListener('online', () => this.syncLatestResult(false));
            window.setInterval(() => {
                const countdown = document.getElementById('nextDrawCountdown');
                if (countdown) {
                    const nextDraw = root.LottoDraws.next();
                    if (countdown.closest('[data-next-draw]')?.dataset.nextDraw !== nextDraw.date) this.renderCurrentView();
                    else countdown.textContent = root.LottoDraws.formatRemaining(nextDraw.remainingMs);
                }
            }, 60 * 1000);

            // Listen to browser hash changes
            window.addEventListener('hashchange', () => {
                if (window.location.hash !== '#mainContent') this.handleHashChange();
            });
        },

        consumeSharedParams() {
            try {
                if (!root.location || !root.location.search) return;
                const params = new URLSearchParams(root.location.search);
                const rawNumbers = params.get('importNumbers') || params.get('number') || '';
                if (!rawNumbers) return;

                const validNumbers = rawNumbers
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => /^(?:\d{2}|\d{3}|\d{6})$/.test(s));

                if (validNumbers.length > 0 && root.LottoMyTicketsView) {
                    const price = Math.max(1, parseFloat(params.get('price')) || 80);
                    const note = (params.get('note') || 'ส่งมาจากเครื่องคำนวณหวย').trim().slice(0, 120);
                    root.LottoMyTicketsView.pendingSharedImport = {
                        numbers: validNumbers,
                        price,
                        note
                    };
                }

                if (root.history && typeof root.history.replaceState === 'function') {
                    const cleanUrl = root.location.pathname + (root.location.hash || '#tickets');
                    root.history.replaceState(null, '', cleanUrl);
                }
            } catch (err) {
                console.error('[LottoBook] Failed to parse shared parameters:', err);
            }
        },

        async loadHistoricalData() {
            try {
                // Fetch curated historical results JSON
                const res = await fetch('./data/glo_results.json');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                this.builtInResults = await res.json();

                this.mergeResults();
                console.log(`[LottoBook] Loaded ${this.historicalResults.length} historical draw records.`);
            } catch (err) {
                console.error('[LottoBook] Failed to load historical results:', err);
                this.showToast('ไม่สามารถโหลดข้อมูลสถิติผลรางวัลย้อนหลังได้', 'error');
            }
        },

        mergeResults() {
            const customResults = root.LottoStorage ? root.LottoStorage.getCustomResults() : [];

            const mergedMap = new Map();
            this.builtInResults.forEach(r => mergedMap.set(r.drawDate, r));
            customResults.forEach(r => mergedMap.set(r.drawDate, r));

            this.historicalResults = Array.from(mergedMap.values()).sort((a, b) => b.drawDate.localeCompare(a.drawDate));

            this.resultsMap = {};
            this.historicalResults.forEach(r => {
                this.resultsMap[r.drawDate] = r;
            });
        },

        async syncLatestResult(manual = false) {
            if (this.syncInProgress) return;
            this.syncInProgress = true;
            try {
                const baseDate = this.builtInResults[0]?.drawDate;
                const settings = root.LottoStorage.getSettings();
                const hasCompletedBackfill = Boolean(baseDate && settings.gloBackfillBaseDate === baseDate);
                const latestLocalDate = this.historicalResults[0]?.drawDate || baseDate;
                const afterDate = manual || !hasCompletedBackfill ? baseDate : latestLocalDate;

                if (!afterDate) throw new Error('ไม่พบงวดตั้งต้นสำหรับตรวจสอบผล GLO');

                const syncPayload = await root.LottoSync.fetchSince(afterDate);
                const today = root.LottoDraws.thailandNow();
                const todayIso = `${today.year}-${String(today.month).padStart(2, '0')}-${String(today.day).padStart(2, '0')}`;
                let changed = 0;
                syncPayload.results.forEach(result => {
                    if (result.drawDate > todayIso) throw new Error('GLO ส่งข้อมูลงวดอนาคต');
                    const previous = this.resultsMap[result.drawDate];
                    if (!previous || JSON.stringify(previous.prizes) !== JSON.stringify(result.prizes)) {
                        root.LottoStorage.saveCustomResult(result);
                        changed++;
                    }
                });
                if (changed > 0) {
                    this.mergeResults();
                    if (this.currentTab === 'check') {
                        root.LottoCheckResultsView.selectedDrawDate = syncPayload.results[0].drawDate;
                    }
                    this.renderCurrentView();
                    const failed = syncPayload.failedDates.length;
                    this.showToast(failed
                        ? `เพิ่มผลรางวัล ${changed} งวด ยังขาด ${failed} งวด ลองอัปเดตอีกครั้ง`
                        : `อัปเดตผลรางวัลครบ ${changed} งวดแล้ว`, failed ? 'info' : 'success');
                } else if (manual) {
                    this.showToast('ผลรางวัลทุกงวดเป็นข้อมูลล่าสุดแล้ว', 'info');
                }

                if (syncPayload.complete) {
                    root.LottoStorage.setSettings({
                        gloBackfillBaseDate: baseDate,
                        gloBackfillCompletedAt: hasCompletedBackfill
                            ? settings.gloBackfillCompletedAt
                            : new Date().toISOString(),
                        gloLastSyncAt: new Date().toISOString(),
                        gloLastSyncedDrawDate: syncPayload.results[0]?.drawDate || latestLocalDate
                    });
                }
            } catch (err) {
                console.error('[LottoBook] GLO sync failed:', err);
                if (manual) this.showToast(`อัปเดตผลไม่ได้: ${err.message}`, 'error');
            } finally {
                this.syncInProgress = false;
            }
        },

        maybeSyncResults() {
            if (!navigator.onLine) return;
            const now = root.LottoDraws.thailandNow();
            const today = `${now.year}-${String(now.month).padStart(2, '0')}-${String(now.day).padStart(2, '0')}`;
            const isDrawDay = root.LottoDraws.upcoming(1)[0] === today;
            if (isDrawDay && (now.hour > 16 || now.hour === 16 && now.minute >= 30)) {
                this.syncLatestResult(false);
            }
        },

        initNavigation() {
            document.querySelectorAll('[data-nav-tab]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = btn.dataset.navTab;
                    window.location.hash = `#${target}`;
                });
            });
        },

        handleHashChange() {
            const hash = window.location.hash.replace('#', '') || 'tickets';
            const validTabs = ['tickets', 'check', 'stats'];
            this.currentTab = validTabs.includes(hash) ? hash : 'tickets';

            document.documentElement.dataset.page = this.currentTab;
            document.querySelectorAll('[data-nav-tab], [data-mobile-nav]').forEach(link => {
                const active = (link.dataset.navTab || link.dataset.mobileNav) === this.currentTab;
                if (active) link.setAttribute('aria-current', 'page');
                else link.removeAttribute('aria-current');
            });
            const headings = {
                tickets: ['สมุดสลากของคุณ', 'บันทึกสลาก ดูยอดใช้จ่าย และกำหนดงบในแต่ละงวด'],
                check: ['ตรวจผลรางวัล', 'ตรวจเลขที่สนใจ หรือดูผลสลากที่บันทึกไว้ในแต่ละงวด'],
                stats: ['สำรวจสถิติย้อนหลัง', 'ดูความถี่และการกระจายของตัวเลขจากผลรางวัลที่ผ่านมา']
            };
            document.getElementById('pageTitle').textContent = headings[this.currentTab][0];
            document.getElementById('pageDescription').textContent = headings[this.currentTab][1];

            this.renderCurrentView();
        },

        renderCurrentView() {
            const container = document.getElementById('viewContainer');
            if (!container) return;

            window.scrollTo({ top: 0, behavior: 'instant' });

            if (this.currentTab === 'tickets') {
                root.LottoMyTicketsView.render(container);
            } else if (this.currentTab === 'check') {
                root.LottoCheckResultsView.render(container);
            } else if (this.currentTab === 'stats') {
                root.LottoHistoricalStatsView.render(container);
            }
            container.setAttribute('aria-busy', 'false');
        },

        // Toast notifications
        showToast(message, type = 'info') {
            const toastContainer = document.getElementById('toastContainer');
            if (!toastContainer) return;

            const toast = document.createElement('div');
            const bgClass = type === 'success'
                ? 'toast-success'
                : (type === 'error' ? 'toast-error' : 'toast-info');

            toast.className = `${bgClass} px-4 py-2.5 rounded-lg text-base font-semibold flex items-center gap-2 transform toast-motion translate-y-2 opacity-0`;
            toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
            toast.innerHTML = `
                <span aria-hidden="true">${type === 'success' ? '✓' : (type === 'error' ? '!' : 'i')}</span>
                <span>${root.LottoStorage ? root.LottoStorage.escapeHTML(message) : String(message ?? '')}</span>
            `;

            toastContainer.appendChild(toast);
            requestAnimationFrame(() => {
                toast.classList.remove('translate-y-2', 'opacity-0');
            });

            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-2');
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        },

        registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('./sw.js').catch(err => {
                        console.log('SW registration error:', err);
                    });
                });
            }
        }
    };

    root.LottoApp = App;

    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
})(typeof window !== 'undefined' ? window : global);
