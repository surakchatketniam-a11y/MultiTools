/**
 * lotto_book - Storage & Persistence Engine
 * Handles tickets, budgets, custom draw results, and local export/import.
 * Preserves strict String types for lottery numbers (leading zeros like '007', '09').
 */

(function(root) {
    'use strict';

    const STORAGE_KEYS = {
        TICKETS: 'lotto_book_tickets_v1',
        BUDGETS: 'lotto_book_budgets_v1',
        CUSTOM_RESULTS: 'lotto_book_custom_results_v1',
        SETTINGS: 'lotto_book_settings_v1'
    };

    const Storage = {
        escapeHTML(value) {
            return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
        },
        sanitizeTicketRecord(t) {
            if (!t || typeof t !== 'object') return null;
            const num = String(t.number ?? '').trim();
            if (!/^(?:\d{2}|\d{3}|\d{6})$/.test(num)) return null;
            const drawDate = String(t.drawDate ?? '').trim();
            if (!/^\d{4}-\d{2}-\d{2}$/.test(drawDate)) return null;
            const count = Math.max(1, Math.min(999, Math.floor(Number(t.count) || 1)));
            const costPerUnit = Math.max(0, Number(t.costPerUnit) || 80);
            const now = new Date().toISOString();
            return {
                id: String(t.id || `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
                drawDate,
                number: num,
                type: t.type || (num.length === 6 ? 'standard' : num.length === 3 ? 'digit3' : 'digit2'),
                count,
                costPerUnit,
                totalCost: count * costPerUnit,
                note: t.note ? String(t.note).trim().slice(0, 200) : '',
                createdAt: t.createdAt ? String(t.createdAt) : now,
                updatedAt: now
            };
        },
        // ----------------------------------------------------
        // TICKETS MANAGEMENT
        // ----------------------------------------------------
        getTickets() {
            try {
                const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
                if (!data) return [];
                const parsed = JSON.parse(data);
                if (!Array.isArray(parsed)) return [];
                // Ensure number field is strictly string
                return parsed.map(t => ({
                    ...t,
                    number: String(t.number || '').trim()
                }));
            } catch (e) {
                console.error('[Storage] Error loading tickets:', e);
                return [];
            }
        },

        saveTicket(ticket) {
            if (!ticket || !ticket.number) {
                throw new Error('กรุณาระบุหมายเลขสลาก');
            }
            if (!/^(?:\d{2}|\d{3}|\d{6})$/.test(String(ticket.number).trim())) {
                throw new Error('หมายเลขสลากต้องเป็นตัวเลข 2, 3 หรือ 6 หลักเท่านั้น');
            }
            if (ticket.drawDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(ticket.drawDate).trim())) {
                throw new Error('รูปแบบวันที่งวดไม่ถูกต้อง');
            }
            const tickets = this.getTickets();
            const now = new Date().toISOString();
            
            const newTicket = {
                id: ticket.id || `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                drawDate: ticket.drawDate, // 'YYYY-MM-DD'
                number: String(ticket.number).trim(), // STRICT STRING PRESERVATION
                type: ticket.type || 'standard', // 'standard' (6 digits), 'digit3', 'digit2'
                count: Number(ticket.count) || 1,
                costPerUnit: Number(ticket.costPerUnit) || 80,
                totalCost: (Number(ticket.count) || 1) * (Number(ticket.costPerUnit) || 80),
                note: ticket.note ? String(ticket.note).trim() : '',
                createdAt: ticket.createdAt || now,
                updatedAt: now
            };

            const existingIndex = tickets.findIndex(t => t.id === newTicket.id);
            if (existingIndex >= 0) {
                tickets[existingIndex] = newTicket;
            } else {
                tickets.unshift(newTicket);
            }

            localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
            return newTicket;
        },

        deleteTicket(id) {
            const tickets = this.getTickets().filter(t => t.id !== id);
            localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
            return true;
        },

        getTicketsByDraw(drawDate) {
            return this.getTickets().filter(t => t.drawDate === drawDate);
        },

        // ----------------------------------------------------
        // BUDGETS MANAGEMENT
        // ----------------------------------------------------
        getBudgets() {
            try {
                const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
                return data ? JSON.parse(data) : {};
            } catch (e) {
                console.error('[Storage] Error loading budgets:', e);
                return {};
            }
        },

        getBudgetForDraw(drawDate) {
            const budgets = this.getBudgets();
            return Number(budgets[drawDate]) || 0;
        },

        setBudgetForDraw(drawDate, amount) {
            const budgets = this.getBudgets();
            budgets[drawDate] = Math.max(0, Number(amount) || 0);
            localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
            return budgets[drawDate];
        },

        // ----------------------------------------------------
        // SPENDING SUMMARY
        // ----------------------------------------------------
        getSpendingSummary() {
            const tickets = this.getTickets();
            const budgets = this.getBudgets();

            let totalSpent = 0;
            let totalTickets = 0;
            const drawStats = {};

            tickets.forEach(t => {
                totalSpent += t.totalCost;
                totalTickets += t.count;

                if (!drawStats[t.drawDate]) {
                    drawStats[t.drawDate] = {
                        drawDate: t.drawDate,
                        ticketCount: 0,
                        totalCost: 0,
                        budget: Number(budgets[t.drawDate]) || 0
                    };
                }
                drawStats[t.drawDate].ticketCount += t.count;
                drawStats[t.drawDate].totalCost += t.totalCost;
            });

            return {
                totalSpent,
                totalTickets,
                drawCount: Object.keys(drawStats).length,
                drawStats
            };
        },

        // ----------------------------------------------------
        // CUSTOM RESULTS MANAGEMENT
        // ----------------------------------------------------
        getCustomResults() {
            try {
                const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_RESULTS);
                return data ? JSON.parse(data) : [];
            } catch (e) {
                console.error('[Storage] Error loading custom results:', e);
                return [];
            }
        },

        saveCustomResult(drawRecord) {
            if (!drawRecord || !drawRecord.drawDate) {
                throw new Error('ข้อมูลผลรางวัลไม่ถูกต้อง');
            }
            const list = this.getCustomResults();
            const idx = list.findIndex(r => r.drawDate === drawRecord.drawDate);
            if (idx >= 0) {
                list[idx] = drawRecord;
            } else {
                list.unshift(drawRecord);
            }
            list.sort((a, b) => b.drawDate.localeCompare(a.drawDate));
            localStorage.setItem(STORAGE_KEYS.CUSTOM_RESULTS, JSON.stringify(list));
            return drawRecord;
        },

        // ----------------------------------------------------
        // APPLICATION SETTINGS
        // ----------------------------------------------------
        getSettings() {
            try {
                const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
                if (!data) return {};
                const parsed = JSON.parse(data);
                return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
            } catch (e) {
                console.error('[Storage] Error loading settings:', e);
                return {};
            }
        },

        setSettings(patch) {
            if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
                return this.getSettings();
            }
            const settings = { ...this.getSettings(), ...patch };
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return settings;
        },

        // ----------------------------------------------------
        // BACKUP REMINDER
        // ----------------------------------------------------
        markBackupDone() {
            this.setSettings({ lastBackupAt: new Date().toISOString(), backupRemindSnoozedUntil: null });
        },

        snoozeBackupReminder(days = 7) {
            const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
            this.setSettings({ backupRemindSnoozedUntil: until });
        },

        // Remind only when tickets exist, no backup yet or last backup is older than maxAgeDays, and not snoozed.
        shouldRemindBackup(maxAgeDays = 30) {
            if (this.getTickets().length === 0) return false;
            const settings = this.getSettings();
            const now = Date.now();
            if (settings.backupRemindSnoozedUntil && Date.parse(settings.backupRemindSnoozedUntil) > now) return false;
            const last = Date.parse(settings.lastBackupAt);
            if (!Number.isFinite(last)) return true;
            return now - last > maxAgeDays * 24 * 60 * 60 * 1000;
        },

        // ----------------------------------------------------
        // EXPORT & IMPORT
        // ----------------------------------------------------
        exportDataJSON() {
            const data = {
                app: 'Multitools_LottoBook',
                version: '1.0',
                exportedAt: new Date().toISOString(),
                tickets: this.getTickets(),
                budgets: this.getBudgets(),
                customResults: this.getCustomResults()
            };
            return JSON.stringify(data, null, 2);
        },

        exportTicketsCSV() {
            const tickets = this.getTickets();
            const headers = ['id', 'drawDate', 'number', 'type', 'count', 'costPerUnit', 'totalCost', 'note', 'createdAt'];
            
            const rows = tickets.map(t => [
                `"${t.id || ''}"`,
                `"${t.drawDate || ''}"`,
                `"${t.number || ''}"`, // preserve string
                `"${t.type || 'standard'}"`,
                t.count || 1,
                t.costPerUnit || 80,
                t.totalCost || 80,
                `"${(t.note || '').replace(/"/g, '""')}"`,
                `"${t.createdAt || ''}"`
            ]);

            return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
        },

        importDataJSON(jsonStr, mode = 'merge') {
            try {
                const parsed = JSON.parse(jsonStr);
                if (!parsed || typeof parsed !== 'object') {
                    throw new Error('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
                }

                if (mode === 'replace') {
                    if (Array.isArray(parsed.tickets)) {
                        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(parsed.tickets.map(t => this.sanitizeTicketRecord(t)).filter(Boolean)));
                    }
                    if (parsed.budgets && typeof parsed.budgets === 'object') {
                        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(parsed.budgets));
                    }
                    if (Array.isArray(parsed.customResults)) {
                        localStorage.setItem(STORAGE_KEYS.CUSTOM_RESULTS, JSON.stringify(parsed.customResults));
                    }
                } else {
                    // Merge mode
                    if (Array.isArray(parsed.tickets)) {
                        const current = this.getTickets();
                        const currentMap = new Map(current.map(t => [t.id, t]));
                        parsed.tickets.forEach(t => {
                            if (t && t.number) {
                                currentMap.set(t.id || `tkt_${Date.now()}_${Math.random()}`, {
                                    ...t,
                                    number: String(t.number).trim()
                                });
                            }
                        });
                        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(Array.from(currentMap.values()).map(t => this.sanitizeTicketRecord(t)).filter(Boolean)));
                    }

                    if (parsed.budgets && typeof parsed.budgets === 'object') {
                        const currentBudgets = this.getBudgets();
                        Object.assign(currentBudgets, parsed.budgets);
                        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(currentBudgets));
                    }

                    if (Array.isArray(parsed.customResults)) {
                        const currentResults = this.getCustomResults();
                        const map = new Map(currentResults.map(r => [r.drawDate, r]));
                        parsed.customResults.forEach(r => {
                            if (r && r.drawDate) map.set(r.drawDate, r);
                        });
                        localStorage.setItem(STORAGE_KEYS.CUSTOM_RESULTS, JSON.stringify(Array.from(map.values())));
                    }
                }
                return { success: true };
            } catch (e) {
                return { success: false, error: e.message };
            }
        },

        clearAllData() {
            localStorage.removeItem(STORAGE_KEYS.TICKETS);
            localStorage.removeItem(STORAGE_KEYS.BUDGETS);
            localStorage.removeItem(STORAGE_KEYS.CUSTOM_RESULTS);
            localStorage.removeItem(STORAGE_KEYS.SETTINGS);
            return true;
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Storage;
    } else {
        root.LottoStorage = Storage;
    }
})(typeof window !== 'undefined' ? window : global);
