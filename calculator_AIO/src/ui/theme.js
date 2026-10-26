// ==============================================================
// Multitools Calculator - Theme Management (Airbnb, Classic, Dark, Together, Ferrari)
// ==============================================================

const THEME_CONFIG = {
    airbnb: { label: 'Airbnb', sidebar: 'ธีม: Airbnb Rausch', color: '#ffffff', dot: 'bg-[#ff385c]' },
    classic: { label: 'Classic', sidebar: 'ธีม: Classic ต้นฉบับ', color: '#333333', dot: 'bg-[#60a5fa]' },
    dark: { label: 'Dark Luxe', sidebar: 'ธีม: Dark Luxe', color: '#211c25', dot: 'bg-[#d98cff]' },
    together: { label: 'Together', sidebar: 'ธีม: Together AI', color: '#010120', dot: 'bg-[#fc4c02]' },
    ferrari: { label: 'Ferrari', sidebar: 'ธีม: Ferrari', color: '#181818', dot: 'bg-[#da291c]' }
};

function applyTheme(themeName) {
    if (typeof document === 'undefined') return;
    const state = typeof appState !== 'undefined' ? appState : null;
    const selected = THEME_CONFIG[themeName] ? themeName : 'airbnb';
    if (state) state.theme = selected;
    document.documentElement.setAttribute('data-theme', selected);
    try {
        localStorage.setItem('calc_pwa_theme', selected);
    } catch (e) {}

    const isAirbnb = selected === 'airbnb';
    const isDark = selected === 'dark';
    const isTogether = selected === 'together';
    const isFerrari = selected === 'ferrari';
    const details = THEME_CONFIG[selected];

    const metaThemeColor = document.getElementById('metaThemeColor');
    if (metaThemeColor) metaThemeColor.setAttribute('content', details.color);

    const headerThemeBtnText = document.getElementById('headerThemeBtnText');
    if (headerThemeBtnText) headerThemeBtnText.textContent = details.label;

    const themeDotIndicator = document.getElementById('themeDotIndicator');
    if (themeDotIndicator) themeDotIndicator.className = `w-2.5 h-2.5 rounded-full inline-block ${details.dot}`;

    const sidebarThemeLabel = document.getElementById('sidebarThemeLabel');
    if (sidebarThemeLabel) sidebarThemeLabel.textContent = details.sidebar;

    // Highlight active theme button inside 3-dots menu
    const btnAirbnb = document.getElementById('menuThemeAirbnb');
    const btnClassic = document.getElementById('menuThemeClassic');
    const btnDark = document.getElementById('menuThemeDark');
    const btnTogether = document.getElementById('menuThemeTogether');
    const btnFerrari = document.getElementById('menuThemeFerrari');
    if (btnAirbnb && btnClassic && btnDark && btnTogether && btnFerrari) {
        btnAirbnb.className = `py-1.5 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${isAirbnb ? 'border-[#222222] bg-[#f7f7f7] text-[#222222]' : 'border-[var(--app-hairline)] text-[var(--app-muted)]'}`;
        btnClassic.className = `py-1.5 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${selected === 'classic' ? 'border-[#2b3990] bg-[#eef1ff] text-[#2b3990]' : 'border-[var(--app-hairline)] text-[var(--app-muted)]'}`;
        btnDark.className = `py-1.5 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${isDark ? 'border-[#d98cff] bg-[#3a2348] text-[#d98cff]' : 'border-[var(--app-hairline)] text-[var(--app-muted)]'}`;
        btnTogether.className = `py-1.5 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${isTogether ? 'border-[#fc4c02] bg-[#313641] text-white' : 'border-[var(--app-hairline)] text-[var(--app-muted)]'}`;
        btnFerrari.className = `col-span-2 py-1.5 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${isFerrari ? 'border-[#da291c] bg-[#303030] text-white' : 'border-[var(--app-hairline)] text-[var(--app-muted)]'}`;
    }

    if (typeof renderActiveTool === 'function') {
        renderActiveTool();
    }
}

function toggleTheme() {
    const themes = Object.keys(THEME_CONFIG);
    const currentTheme = (typeof appState !== 'undefined' && appState.theme) ? appState.theme : 'airbnb';
    const nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
    applyTheme(nextTheme);
}

function initThemeListeners() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    const addSafe = (id, handler) => {
        const el = document.getElementById(id);
        if (el && typeof el.addEventListener === 'function') {
            el.addEventListener('click', handler);
        }
    };
    const closeDropdown = () => {
        const dd = document.getElementById('dropdownMenu');
        if (dd && dd.classList) dd.classList.add('hidden');
    };
    addSafe('headerThemeBtn', toggleTheme);
    addSafe('sidebarThemeToggleBtn', toggleTheme);
    addSafe('menuThemeAirbnb', () => { applyTheme('airbnb'); closeDropdown(); });
    addSafe('menuThemeClassic', () => { applyTheme('classic'); closeDropdown(); });
    addSafe('menuThemeDark', () => { applyTheme('dark'); closeDropdown(); });
    addSafe('menuThemeTogether', () => { applyTheme('together'); closeDropdown(); });
    addSafe('menuThemeFerrari', () => { applyTheme('ferrari'); closeDropdown(); });
}

if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeListeners);
    } else {
        initThemeListeners();
    }
}

(function(root) {
    const exportsObj = {
        THEME_CONFIG,
        applyTheme,
        toggleTheme,
        initThemeListeners
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
