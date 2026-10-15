/**
 * lotto_book - Application Bootstrap & Navigation Controller
 */

(function(root) {
    'use strict';

    const App = {
        currentTab: 'tickets', // 'tickets', 'check', 'stats'
        historicalResults: [],
        resultsMap: {},

        async init() {
            console.log('[LottoBook] Initializing application...');

            root.LottoTheme.init();
            await this.loadHistoricalData();
            this.initNavigation();
            this.handleHashChange();
            this.registerServiceWorker();

            // Listen to browser hash changes
            window.addEventListener('hashchange', () => {
                if (window.location.hash !== '#mainContent') this.handleHashChange();
            });
        },

        async loadHistoricalData() {
            try {
                // Fetch curated historical results JSON
                const res = await fetch('./data/glo_results.json');
                const builtInResults = await res.json();

                // Merge with any custom results saved by user
                const customResults = root.LottoStorage ? root.LottoStorage.getCustomResults() : [];

                const mergedMap = new Map();
                builtInResults.forEach(r => mergedMap.set(r.drawDate, r));
                customResults.forEach(r => mergedMap.set(r.drawDate, r));

                this.historicalResults = Array.from(mergedMap.values()).sort((a, b) => b.drawDate.localeCompare(a.drawDate));

                this.resultsMap = {};
                this.historicalResults.forEach(r => {
                    this.resultsMap[r.drawDate] = r;
                });

                console.log(`[LottoBook] Loaded ${this.historicalResults.length} historical draw records.`);
            } catch (err) {
                console.error('[LottoBook] Failed to load historical results:', err);
                this.showToast('ไม่สามารถโหลดข้อมูลสถิติผลรางวัลย้อนหลังได้', 'error');
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
                <span>${type === 'success' ? '✓' : (type === 'error' ? '⚠️' : 'ℹ️')}</span>
                <span>${message}</span>
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
