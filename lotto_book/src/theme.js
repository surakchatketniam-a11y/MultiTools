/* Apply before paint; saved choices take priority over the device theme. */
(function(root) {
    'use strict';
    const media = root.matchMedia('(prefers-color-scheme: dark)');
    let preference = null;
    try {
        const saved = root.localStorage.getItem('lotto_theme');
        if (saved === 'light' || saved === 'dark') preference = saved;
    } catch (_) { /* The switch also works when storage is unavailable. */ }

    function apply() {
        const theme = preference || (media.matches ? 'dark' : 'light');
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
        const dark = theme === 'dark';
        const button = document.getElementById('themeToggleBtn');
        if (button) {
            button.setAttribute('aria-checked', String(dark));
            button.title = dark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด';
            document.getElementById('themeIcon').textContent = dark ? '☾' : '☼';
            document.getElementById('themeLabel').textContent = dark ? 'โหมดมืด' : 'โหมดสว่าง';
        }
        document.querySelector('meta[name="theme-color"]').content = dark ? '#000000' : '#f7f8fc';
    }

    root.LottoTheme = {
        init() {
            apply();
            document.getElementById('themeToggleBtn').addEventListener('click', () => {
                preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
                try { root.localStorage.setItem('lotto_theme', preference); } catch (_) {}
                apply();
            });
            media.addEventListener('change', () => { if (!preference) apply(); });
            root.addEventListener('storage', event => {
                if (event.key === 'lotto_theme' || event.key === null) {
                    preference = event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : null;
                    apply();
                }
            });
        }
    };
    apply();
})(window);
