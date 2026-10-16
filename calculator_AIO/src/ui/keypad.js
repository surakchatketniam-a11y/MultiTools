// ==============================================================
// Multitools Calculator - Virtual 4x4 Keypad & Physical Keyboard Mapping
// ==============================================================

function getToolFieldBindings(toolId) {
    switch (toolId) {
        case 'unit_price': {
            const list = [];
            appState.unit_price.rows.forEach((row, idx) => {
                list.push({
                    get: () => appState.unit_price.rows[idx].price,
                    set: (v) => { appState.unit_price.rows[idx].price = v; }
                });
                list.push({
                    get: () => appState.unit_price.rows[idx].qty,
                    set: (v) => { appState.unit_price.rows[idx].qty = v; }
                });
            });
            return list;
        }
        case 'currency':
            return [
                { get: () => appState.currency.amount, set: (v) => { appState.currency.amount = v; } },
                { get: () => appState.currency.customRateToTHB, set: (v) => { appState.currency.customRateToTHB = v; } }
            ];
        case 'unit':
            return [
                { get: () => appState.unit.val, set: (v) => { appState.unit.val = v; } }
            ];
        case 'discount':
            return [
                { get: () => appState.discount.price, set: (v) => { appState.discount.price = v; } },
                { get: () => appState.discount.discountPct, set: (v) => { appState.discount.discountPct = v; } },
                { get: () => appState.discount.extraPct, set: (v) => { appState.discount.extraPct = v; } }
            ];
        case 'percent':
            return [
                { get: () => appState.percent.x, set: (v) => { appState.percent.x = v; } },
                { get: () => appState.percent.y, set: (v) => { appState.percent.y = v; } },
                { get: () => appState.percent.z, set: (v) => { appState.percent.z = v; } }
            ];
        case 'vat':
            return [
                { get: () => appState.vat.amount, set: (v) => { appState.vat.amount = v; } },
                { get: () => appState.vat.rate, set: (v) => { appState.vat.rate = v; } }
            ];
        case 'fuel_cost':
            return [
                { get: () => appState.fuel_cost.distance, set: (v) => { appState.fuel_cost.distance = v; } },
                { get: () => appState.fuel_cost.efficiency, set: (v) => { appState.fuel_cost.efficiency = v; } },
                { get: () => appState.fuel_cost.oilPrice, set: (v) => { appState.fuel_cost.oilPrice = v; } }
            ];
        case 'health':
            return [
                { get: () => appState.health.weight, set: (v) => { appState.health.weight = v; } },
                { get: () => appState.health.height, set: (v) => { appState.health.height = v; } },
                { get: () => appState.health.age, set: (v) => { appState.health.age = v; } }
            ];
        case 'tip':
            return [
                { get: () => appState.tip.bill, set: (v) => { appState.tip.bill = v; } },
                { get: () => appState.tip.tipPct, set: (v) => { appState.tip.tipPct = v; } },
                { get: () => appState.tip.people, set: (v) => { appState.tip.people = v; } }
            ];
        case 'fuel_eff':
            return [
                { get: () => appState.fuel_eff.distance, set: (v) => { appState.fuel_eff.distance = v; } },
                { get: () => appState.fuel_eff.fuelUsed, set: (v) => { appState.fuel_eff.fuelUsed = v; } }
            ];
        case 'loan':
            return [
                { get: () => appState.loan.principal, set: (v) => { appState.loan.principal = v; } },
                { get: () => appState.loan.interestRate, set: (v) => { appState.loan.interestRate = v; } },
                { get: () => appState.loan.months, set: (v) => { appState.loan.months = v; } },
                { get: () => appState.loan.extra, set: (v) => { appState.loan.extra = v; } }
            ];
        case 'savings':
            return [
                { get: () => appState.savings.initial, set: (v) => { appState.savings.initial = v; } },
                { get: () => appState.savings.monthly, set: (v) => { appState.savings.monthly = v; } },
                { get: () => appState.savings.interestRate, set: (v) => { appState.savings.interestRate = v; } },
                { get: () => appState.savings.years, set: (v) => { appState.savings.years = v; } }
            ].slice(0, appState.savings.mode === 'retirement' ? 3 : 4);
        case 'salary':
            return [
                {
                    get: () => (appState.salary.mode === 'net' ? (appState.salary.baseSalary !== undefined ? appState.salary.baseSalary : appState.salary.income) : appState.salary.income),
                    set: (v) => {
                        if (appState.salary.mode === 'net') {
                            appState.salary.baseSalary = v;
                        } else {
                            appState.salary.income = v;
                        }
                    }
                },
                { get: () => appState.salary.needsPct, set: (v) => { appState.salary.needsPct = v; } },
                { get: () => appState.salary.wantsPct, set: (v) => { appState.salary.wantsPct = v; } },
                { get: () => appState.salary.savingsPct, set: (v) => { appState.salary.savingsPct = v; } }
            ];
        default:
            return [];
    }
}

function handleSharedKeyInput(key) {
    const inputs = [...document.querySelectorAll('#toolTopPanel input[data-shared-field]')];
    if (!inputs.length) return;
    const input = inputs.find(field => Number(field.dataset.sharedField) === appState.activeFieldIndex) || inputs[0];
    const clearSnapshot = key === 'CLEAR' ? captureToolSnapshot() : null;
    if (key === 'PREV' || key === 'NEXT') {
        const direction = key === 'NEXT' ? 1 : -1;
        inputs[(inputs.indexOf(input) + direction + inputs.length) % inputs.length].focus();
        return;
    }
    const selection = input.dataset.visited ? [input.selectionStart, input.selectionEnd] : [input.value.length, input.value.length];
    input.focus();
    input.setSelectionRange(...selection);
    let start = input.selectionStart, end = input.selectionEnd;
    if (key === 'CLEAR') {
        start = 0; end = input.value.length;
    } else if (key === 'BACKSPACE' && start === end) {
        if (start > 1 && input.value[start - 1] === ',') {
            start = Math.max(0, start - 2);
        } else {
            start = Math.max(0, start - 1);
        }
    }
    const replacement = key === 'CLEAR' || key === 'BACKSPACE' ? '' : key;
    if (!/^(?:CLEAR|BACKSPACE|[0-9.]|00)$/.test(key)) return;
    input.setRangeText(replacement, start, end, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    if (clearSnapshot) rememberToolClear(clearSnapshot);
}

function updateKeypadCollapseUI(collapsed) {
    if (typeof document === 'undefined') return;
    const keypad = document.getElementById('sharedKeypadSection');
    const icon = document.getElementById('toggleKeypadIcon');
    const label = document.getElementById('toggleKeypadLabel');
    const toggle = document.getElementById('toggleKeypadBtn');
    toggle?.setAttribute('aria-expanded', String(!collapsed));
    toggle?.setAttribute('aria-controls', 'sharedKeypadSection');
    toggle?.setAttribute('aria-label', collapsed ? 'แสดงแป้นตัวเลข' : 'ซ่อนแป้นตัวเลข');
    toggle?.setAttribute('title', collapsed ? 'แสดงแป้นตัวเลข' : 'ซ่อนแป้นตัวเลข');
    if (collapsed) {
        keypad?.classList.add('keypad-collapsed');
        icon?.classList.add('rotate-180');
        if (label) label.textContent = 'ขยาย';
    } else {
        keypad?.classList.remove('keypad-collapsed');
        icon?.classList.remove('rotate-180');
        if (label) label.textContent = 'ย่อ';
    }
}

// Keypad & Keyboard Event Listeners Initialization
function initKeypadListeners() {
    if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") return;
    document.querySelectorAll("#sharedKeypadSection .key-btn").forEach(btn => {
        btn.addEventListener("mousedown", event => event.preventDefault());
        btn.addEventListener("click", () => {
            const key = btn.getAttribute("data-key");
            handleSharedKeyInput(key);
        });
    });

    document.getElementById("toggleKeypadBtn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const keypad = document.getElementById("sharedKeypadSection");
        const isNowCollapsed = !keypad?.classList.contains("keypad-collapsed");
        updateKeypadCollapseUI(isNowCollapsed);
    });

    // Only fields wired to the shared keypad may open it. Native numeric
    // controls keep their own editor, so keys cannot change another field.
    const panel = document.getElementById('toolTopPanel');
    const sharedField = '#toolTopPanel input[data-shared-field]:not(:disabled):not([readonly])';
    const keypadControls = '#sharedKeypadSection, #keypadToolbar';
    panel?.addEventListener('focusin', event => {
        updateKeypadCollapseUI(!event.target.matches(sharedField));
    });
    panel?.addEventListener('focusout', () => {
        // Renderers replace focused fields synchronously and then restore focus.
        queueMicrotask(() => {
            if (!document.activeElement?.matches(sharedField) &&
                !document.activeElement?.closest(keypadControls)) updateKeypadCollapseUI(true);
        });
    });
    document.addEventListener('pointerdown', event => {
        const target = event.target;
        if (!target?.closest) return;
        if (target.closest(keypadControls)) return;
        const field = target.matches(sharedField) ? target : target.closest('#toolTopPanel [data-field-index]')?.querySelector('input[data-shared-field]:not(:disabled):not([readonly])');
        if (field) {
            updateKeypadCollapseUI(false);
            return;
        }
        updateKeypadCollapseUI(true);
        if (document.activeElement?.matches(sharedField)) document.activeElement.blur();
    });

    if (typeof window !== "undefined") {
        window.addEventListener("keydown", (e) => {
            const toolMeta = typeof TOOLS_CATALOG !== "undefined" ? TOOLS_CATALOG.find(t => t.id === appState.activeToolId) : null;
            if (!toolMeta) return;
            if (e.target?.matches?.("input, select, textarea, [contenteditable=\"true\"]")) {
                if (e.key === "Escape") { e.preventDefault(); e.target.blur(); }
                return;
            }
            if (appState.activeToolId === "calc" && !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
                const stdKey = e.key === "*" ? "×" : e.key === "/" ? "÷" : e.key === "Enter" ? "=" : e.key === "Backspace" ? "BS" : e.key === "Escape" ? "C" : e.key;
                const stdButton = document.querySelector(`#toolTopPanel [data-std="${CSS.escape(stdKey)}"]`);
                if (stdButton) { e.preventDefault(); stdButton.click(); }
                return;
            }
            if (e.key === "Escape") { e.preventDefault(); updateKeypadCollapseUI(true); return; }
            if (!toolMeta.usesSharedKeypad) return;
            if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
            if (e.target?.closest?.("button, a, [role=\"button\"]")) return;
            if (e.key >= "0" && e.key <= "9") {
                e.preventDefault();
                handleSharedKeyInput(e.key);
            } else if (e.key === ".") {
                e.preventDefault();
                handleSharedKeyInput(".");
            } else if (e.key === "Backspace") {
                e.preventDefault();
                handleSharedKeyInput("BACKSPACE");
            } else if (e.key === "Escape" || e.key === "Delete") {
                e.preventDefault();
                handleSharedKeyInput("CLEAR");
            }
        });
    }
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initKeypadListeners);
    } else {
        initKeypadListeners();
    }
}

/**************************************************************
 * 6. HELPER TO CREATE INTERACTIVE FIELD ROW FOR SHARED KEYPAD
 **************************************************************/
function createKeypadFieldHTML(fieldIndex, label, value, unitSuffix = '', placeholder = '0') {
    const isActive = appState.activeFieldIndex === fieldIndex;
    const clean = normalizeThaiDigits(String(value ?? '')).trim().replace(/,/g, '');
    const isIntermediate = clean === '' || clean === '.' || clean === '-' || clean === '-.';
    const invalid = !isIntermediate && !Number.isFinite(parseNumericInput(clean));
    const displayVal = formatInputDisplay(value);
    return `<div><div class="clev-field-box ${isActive ? 'active-field' : ''}" data-field-index="${fieldIndex}">
        <label for="numeric-field-${fieldIndex}" class="text-sm font-medium text-[#222222]">${label}</label>
        <div class="flex items-center gap-1.5 min-w-0" style="max-width:55%">
            <input id="numeric-field-${fieldIndex}" data-shared-field="${fieldIndex}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" class="shared-number-input" aria-invalid="${invalid}" ${invalid ? `aria-describedby="numeric-error-${fieldIndex}"` : ''} value="${escapeHTML(displayVal)}" placeholder="${escapeHTML(placeholder)}">
            ${unitSuffix ? `<span class="text-xs font-medium text-[#6a6a6a]">${unitSuffix}</span>` : ''}
        </div>
    </div>${invalid ? `<p id="numeric-error-${fieldIndex}" role="alert" class="text-xs px-3 py-1">กรุณากรอกตัวเลข เช่น 1,000 หรือ ๑๐๐๐</p>` : ''}</div>`;
}

function setActiveNumericField(index) {
    appState.activeFieldIndex = index;
    const input = document.querySelector(`#toolTopPanel input[data-shared-field="${index}"]`);
    if (input) input.dataset.visited = 'true';
    document.querySelectorAll('#toolTopPanel [data-field-index]').forEach(box => {
        const active = Number(box.dataset.fieldIndex) === index;
        box.classList.toggle(box.classList.contains('clev-field-box') ? 'active-field' : 'active-cell', active);
    });
}

function attachFieldClickListeners(container) {
    container.querySelectorAll('.shared-number-input').forEach(input => {
        const index = Number(input.dataset.sharedField);
        const binding = getToolFieldBindings(appState.activeToolId)[index];
        input.addEventListener('focus', () => setActiveNumericField(index));
        input.addEventListener('input', event => {
            const formatted = formatInputDisplay(input.value);
            if (binding) binding.set(formatted);
            persistAppState();
            if (!event.isComposing) renderActiveTool();
        });
        input.addEventListener('compositionend', () => renderActiveTool());
        input.addEventListener('keydown', event => {
            if (event.key === 'Backspace' && input.selectionStart === input.selectionEnd && input.selectionStart > 1) {
                if (input.value[input.selectionStart - 1] === ',') {
                    event.preventDefault();
                    const pos = input.selectionStart;
                    input.setRangeText('', pos - 2, pos, 'end');
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    return;
                }
            }
            if (event.key === 'Enter' && !event.isComposing) {
                event.preventDefault();
                input.blur();
            }
        });
        input.addEventListener('blur', () => {
            if (binding) {
                const formatted = formatInputDisplay(input.value);
                binding.set(formatted);
                input.value = formatted;
                persistAppState();
            }
        });
        input.closest('[data-field-index]').addEventListener('click', () => input.focus());
    });

}

(function(root) {
    const exportsObj = {
        getToolFieldBindings,
        handleSharedKeyInput,
        updateKeypadCollapseUI,
        createKeypadFieldHTML,
        setActiveNumericField,
        attachFieldClickListeners
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
