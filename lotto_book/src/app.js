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

            this.initTheme();
            await this.loadHistoricalData();
            this.initNavigation();
            this.handleHashChange();
            this.registerServiceWorker();

            // Listen to browser hash changes
            window.addEventListener('hashchange', () => this.handleHashChange());
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

            // Update Header & Nav active states
            document.querySelectorAll('[data-nav-tab]').forEach(btn => {
                const isActive = btn.dataset.navTab === this.currentTab;
                if (isActive) {
                    btn.classList.add('bg-[#FF385C]', 'text-white', 'shadow-xs');
                    btn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
                } else {
                    btn.classList.remove('bg-[#FF385C]', 'text-white', 'shadow-xs');
                    btn.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
                }
            });

            // Update mobile bottom nav active states
            document.querySelectorAll('[data-mobile-nav]').forEach(btn => {
                const isActive = btn.dataset.mobileNav === this.currentTab;
                if (isActive) {
                    btn.classList.add('text-[#FF385C]');
                    btn.classList.remove('text-gray-500', 'dark:text-gray-400');
                } else {
                    btn.classList.remove('text-[#FF385C]');
                    btn.classList.add('text-gray-500', 'dark:text-gray-400');
                }
            });

            this.renderCurrentView();
        },

        renderCurrentView() {
            const container = document.getElementById('viewContainer');
            if (!container) return;

            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (this.currentTab === 'tickets') {
                root.LottoMyTicketsView.render(container);
            } else if (this.currentTab === 'check') {
                root.LottoCheckResultsView.render(container);
            } else if (this.currentTab === 'stats') {
                root.LottoHistoricalStatsView.render(container);
            }
        },

        // Theme management
        initTheme() {
            const savedTheme = localStorage.getItem('lotto_theme') || 'system';
            this.applyTheme(savedTheme);

            const themeToggleBtn = document.getElementById('themeToggleBtn');
            if (themeToggleBtn) {
                themeToggleBtn.addEventListener('click', () => {
                    const isDark = document.documentElement.classList.contains('dark');
                    const newTheme = isDark ? 'light' : 'dark';
                    localStorage.setItem('lotto_theme', newTheme);
                    this.applyTheme(newTheme);
                });
            }
        },

        applyTheme(theme) {
            const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            const themeIcon = document.getElementById('themeIcon');
            if (themeIcon) {
                themeIcon.textContent = isDark ? '☀️' : '🌙';
            }
        },

        // Toast notifications
        showToast(message, type = 'info') {
            const toastContainer = document.getElementById('toastContainer');
            if (!toastContainer) return;

            const toast = document.createElement('div');
            const bgClass = type === 'success' 
                ? 'bg-emerald-600 text-white' 
                : (type === 'error' ? 'bg-rose-600 text-white' : 'bg-gray-800 text-white');

            toast.className = `${bgClass} px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0`;
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
