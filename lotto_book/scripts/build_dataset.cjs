const fs = require('fs');
const path = require('path');

// Thai month names
const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function formatThaiDate(isoDateStr) {
    if (!isoDateStr) return '';
    const parts = isoDateStr.split('-');
    if (parts.length !== 3) return isoDateStr;
    const year = parseInt(parts[0], 10) + 543;
    const month = THAI_MONTHS[parseInt(parts[1], 10) - 1] || '';
    const day = parseInt(parts[2], 10);
    return `${day} ${month} ${year}`;
}

function parseArrayField(val) {
    if (!val) return [];
    val = val.trim();
    if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
    }
    // Replace single quotes with double quotes
    try {
        const jsonStr = val.replace(/'/g, '"');
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
            return parsed.map(n => String(n).trim());
        }
    } catch (e) {
        // Fallback manual extract
        const matches = val.match(/'([^']+)'/g);
        if (matches) {
            return matches.map(m => m.replace(/'/g, '').trim());
        }
    }
    return [];
}

function parseCsvLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
        } else {
            cur += ch;
        }
    }
    result.push(cur.trim());
    return result;
}

async function run() {
    console.log('Fetching historical dataset from heart/Data-Set-Thai-Lotto...');
    const res = await fetch('https://raw.githubusercontent.com/heart/Data-Set-Thai-Lotto/master/lotto.csv');
    const csvText = await res.text();
    const lines = csvText.trim().split(/\r?\n/);
    console.log(`Read ${lines.length} lines.`);

    const records = [];

    // Skip header line 0
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < 5) continue;

        const drawDate = cols[0]; // e.g. "2024-12-16"
        const prize1st = String(cols[1]).padStart(6, '0');
        const front3 = parseArrayField(cols[2]).map(x => String(x).padStart(3, '0'));
        const back3 = parseArrayField(cols[3]).map(x => String(x).padStart(3, '0'));
        const back2 = String(cols[4]).replace(/["']/g, '').padStart(2, '0');
        const near1st = parseArrayField(cols[5] || '').map(x => String(x).padStart(6, '0'));
        const second = parseArrayField(cols[6] || '').map(x => String(x).padStart(6, '0'));
        const third = parseArrayField(cols[7] || '').map(x => String(x).padStart(6, '0'));
        const fourth = parseArrayField(cols[8] || '').map(x => String(x).padStart(6, '0'));
        const fifth = parseArrayField(cols[9] || '').map(x => String(x).padStart(6, '0'));

        // If near1st is empty, calculate based on prize1st (+1, -1)
        let resolvedNear1st = near1st;
        if (!resolvedNear1st || resolvedNear1st.length === 0) {
            const num = parseInt(prize1st, 10);
            if (!isNaN(num)) {
                const prev = num === 0 ? 999999 : num - 1;
                const next = num === 999999 ? 0 : num + 1;
                resolvedNear1st = [String(prev).padStart(6, '0'), String(next).padStart(6, '0')];
            }
        }

        records.push({
            drawDate,
            dateFormatted: formatThaiDate(drawDate),
            prizes: {
                first: prize1st,
                nearFirst: resolvedNear1st,
                front3,
                back3,
                back2,
                second,
                third,
                fourth,
                fifth
            }
        });
    }

    // Add recent 2025 draws that we verified
    const additions2025 = [
        {
            drawDate: '2025-03-16',
            dateFormatted: '16 มีนาคม 2568',
            prizes: {
                first: '757563',
                nearFirst: ['757562', '757564'],
                front3: ['595', '927'],
                back3: ['457', '309'],
                back2: '32',
                second: [],
                third: [],
                fourth: [],
                fifth: []
            }
        },
        {
            drawDate: '2025-03-01',
            dateFormatted: '1 มีนาคม 2568',
            prizes: {
                first: '818894',
                nearFirst: ['818893', '818895'],
                front3: ['139', '530'],
                back3: ['781', '656'],
                back2: '54',
                second: [],
                third: [],
                fourth: [],
                fifth: []
            }
        },
        {
            drawDate: '2025-02-16',
            dateFormatted: '16 กุมภาพันธ์ 2568',
            prizes: {
                first: '847377',
                nearFirst: ['847376', '847378'],
                front3: ['461', '648'],
                back3: ['185', '842'],
                back2: '50',
                second: [],
                third: [],
                fourth: [],
                fifth: []
            }
        },
        {
            drawDate: '2025-02-01',
            dateFormatted: '1 กุมภาพันธ์ 2568',
            prizes: {
                first: '558700',
                nearFirst: ['558699', '558701'],
                front3: ['482', '565'],
                back3: ['080', '953'],
                back2: '51',
                second: [],
                third: [],
                fourth: [],
                fifth: []
            }
        },
        {
            drawDate: '2025-01-17',
            dateFormatted: '17 มกราคม 2568',
            prizes: {
                first: '807779',
                nearFirst: ['807778', '807780'],
                front3: ['008', '409'],
                back3: ['648', '998'],
                back2: '23',
                second: [],
                third: [],
                fourth: [],
                fifth: []
            }
        }
    ];

    for (const item of additions2025) {
        if (!records.find(r => r.drawDate === item.drawDate)) {
            records.unshift(item);
        }
    }

    // Sort descending by drawDate (latest first)
    records.sort((a, b) => b.drawDate.localeCompare(a.drawDate));

    const outputPath = path.resolve(__dirname, '../data/glo_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), 'utf8');
    console.log(`Successfully generated ${records.length} draws in ${outputPath}`);
    console.log('Sample latest 3 draws:', records.slice(0, 3).map(r => `${r.drawDate} (${r.dateFormatted}): 1st=${r.prizes.first}, 2digits=${r.prizes.back2}`));
}

run().catch(console.error);
