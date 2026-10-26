# รายงานการวิเคราะห์โปรเจคต์และแนวทางการพัฒนา (Project Analysis & Improvement Report)

**โปรเจคต์:** Multitools (`index.html`, `calculator_AIO`, `lotto_book`, `api/glo-results.js`)  
**วันที่วิเคราะห์:** 27 ตุลาคม 2026  
**ข้อกำหนดหลักของระบบ:** ห้ามใช้ Emoji ในส่วนติดต่อผู้ใช้ ข้อความสถานะ และซอร์สโค้ดทั้งหมด (Zero-Emoji Policy)

---

## สรุปภาพรวม (Executive Summary)

จากการตรวจสอบโครงสร้างซอร์สโค้ดและรันชุดทดสอบอัตโนมัติทั้งหมดของโปรเจคต์ พบว่า:
- **จุดแข็ง:** ตรรกะการคำนวณหลักและชุดทดสอบมีความแม่นยำสูง โดยฝั่ง `calculator_AIO` ผ่านการทดสอบทั้ง 46 รายการ (`correctness.test.cjs`) และฝั่ง `lotto_book` ผ่านการทดสอบทั้ง 3 ชุดทดสอบ (`glo_api.test.cjs`, `lotto_core.test.cjs`, `phase1.test.cjs`)
- **สิ่งที่ต้องปรับปรุง:** ยังพบการใช้งาน Emoji ค้างอยู่ในระบบ, ฟีเจอร์ที่เขียนโค้ดเสร็จแล้วแต่ยังไม่ได้เชื่อมเข้ากับ UI, ช่องโหว่ DOM XSS และการตรวจสอบข้อมูลขาเข้าใน `lotto_book`, ความไม่สม่ำเสมอของระบบธีมในเครื่องมือรุ่นเก่า, รวมถึงการตั้งค่า Service Worker และ Tailwind CDN ที่กระทบการทำงานแบบ Offline

---

## หมวดที่ 1: การกำจัด Emoji และสัญลักษณ์ตกแต่งออกจากระบบ (Zero-Emoji Compliance)

แม้ใน `calculator_AIO/AGENTS.md` (บรรทัดที่ 38) จะระบุห้ามใส่อีโมจิหรือไอคอนตกแต่งนำหน้าหัวข้อ ป้ายช่องกรอก ข้อความช่วย และข้อความปุ่ม แต่จากการสแกนซอร์สโค้ดทั้งโปรเจคต์ยังพบจุดที่ต้องล้างออกดังนี้:

### 1.1 ฝั่ง `lotto_book`
| ไฟล์ | บรรทัด | รายละเอียดปัญหา | แนวทางแก้ไข |
| --- | --- | --- | --- |
| `lotto_book/src/checker.js` | 66, 84, 268 | ใช้ Emoji (นาฬิกาทราย, ป้ายเตือน, พลุฉลอง, กากบาทสีแดง) ในค่า `statusBadge` ของฟังก์ชัน `checkTicket` | เปลี่ยนเป็นข้อความสถานะล้วน เช่น `ยังไม่ออกรางวัล`, `ยังไม่มีข้อมูลผลรางวัล`, `ถูกรางวัล`, `ไม่ถูกรางวัล` |
| `lotto_book/src/views/checkResults.js` | 239, 298 | แสดง Emoji ขนาดใหญ่ในกล่องแจ้งเตือนไม่มีข้อมูลงวด และในไอคอนสถานะของรายการสลากแต่ละใบ | เปลี่ยนเป็นป้ายสัญลักษณ์ข้อความหรือ SVG ที่ใช้สีตามสถานะ (`text-success`, `text-warning`, `text-muted`) |
| `lotto_book/src/views/historicalStats.js` | 87, 162, 223 | ใช้ Emoji ป้ายเตือน กล่องข้อมูล และกากบาทในแบนเนอร์ความสมบูรณ์ของข้อมูลและในการ์ดสถิติ | แทนที่ด้วยข้อความตัวหนาหรือป้ายกำกับสถานะตามระบบดีไซน์ |
| `lotto_book/src/app.js` | 199 | ฟังก์ชัน `showToast` ใช้ Emoji ป้ายเตือนและกล่องข้อมูลนำหน้าข้อความแจ้งเตือน | ใช้สัญลักษณ์ข้อความมาตรฐานหรือจุดสีบอกสถานะแทน |
| `lotto_book/tests/lotto_core.test.cjs` | 17, 228 | ใช้ Emoji ในข้อความ `console.log` ของชุดทดสอบ | ลบออกให้เป็นข้อความธรรมดา และอัปเดตการตรวจสอบค่า `statusBadge` ในไฟล์ทดสอบให้ตรงกัน |

### 1.2 ฝั่ง `calculator_AIO`
| ไฟล์ | บรรทัด | รายละเอียดปัญหา | แนวทางแก้ไข |
| --- | --- | --- | --- |
| `calculator_AIO/tests/correctness.test.cjs` | 588, 594 | มี Emoji ค้างอยู่ในตัวแปรข้อความทดสอบ `loanSummary` | ลบ Emoji ออกจากสตริงในไฟล์ทดสอบ |
| `calculator_AIO/src/tools/special.js` | 41, 42 | ปุ่มเลือกเพศใน `renderHealthTool` มีสัญลักษณ์เพศนำหน้าข้อความ `ชาย (Male)` / `หญิง (Female)` | ลบสัญลักษณ์นำหน้าออกให้เหลือเฉพาะข้อความตามกฎ `AGENTS.md` |
| `calculator_AIO/src/tools/work.js` | 282 | หัวข้อเกรดเฉลี่ยใน `renderGpaTool` มีสัญลักษณ์ดาวนำหน้าข้อความ `เกรดเฉลี่ยสะสม (GPA)` | ลบสัญลักษณ์ดาวนำหน้าหัวข้อออก |

---

## หมวดที่ 2: ข้อบกพร่องที่ส่งผลต่อการทำงานจริง (Functional Bugs & Unwired Features)

### 2.1 ฟีเจอร์ Quick Compare รองรับ 19 เครื่องมือในโค้ด แต่ UI เปิดให้เลือกเพียง 6 เครื่องมือ
- **ไฟล์ที่เกี่ยวข้อง:** `calculator_AIO/src/core/compare.js` (บรรทัดที่ 8-350, 1715-1731) และ `calculator_AIO/index.html` (บรรทัดที่ 1687-1694)
- **สาเหตุ:** ใน `compare.js` มีชุดข้อมูลตัวอย่าง (`getComparisonPresets`) และตรรกะเปรียบเทียบ (`compareCalculations`) สำหรับ 19 เครื่องมือ แต่ใน `<select id="compareToolSelect">` ของ `calculator_AIO/index.html` มี `<option>` เพียง 6 เครื่องมือ (`loan`, `savings`, `vat_wht`, `salary`, `discount`, `unit_price`)
- **ผลกระทบ:** เครื่องมืออีก 13 รายการที่เขียนโค้ดเปรียบเทียบไว้เสร็จแล้ว (ได้แก่ `tax_personal`, `property_transfer`, `gold_thai`, `electricity_bill`, `car_loan`, `social_security`, `labor_severance`, `legal_interest`, `ot_calc`, `ecommerce_profit`, `debt_payoff`, `food_costing`, `fuel_cost`, `construction_calc`) ไม่สามารถเลือกเปรียบเทียบจากหน้า UI ได้ และเมื่อกดปุ่มเปรียบเทียบขณะเปิดเครื่องมือเหล่านี้ ระบบจะดีดกลับไปหน้า `loan` เสมอ
- **แนวทางแก้ไข:** เพิ่ม `<option>` ใน `#compareToolSelect` ให้ครบทั้ง 19 เครื่องมือ (หรือสร้าง `<option>` อัตโนมัติจากรายการที่ `compare.js` รองรับ)

### 2.2 การจัดวาง CSS Grid บนหน้าจอ Desktop (`>=1024px`) ทำแบนเนอร์ด้านล่างตกขอบ
- **ไฟล์ที่เกี่ยวข้อง:** `calculator_AIO/index.html` (บรรทัดที่ 452-512 และ 1604)
- **สาเหตุ:** ใน `@media (min-width: 1024px)` กำหนด `.app-shell` เป็น Grid 2 คอลัมน์ (`280px minmax(0, 1fr)`) และ 2 แถว (`auto minmax(0, 1fr)`) แต่ไม่ได้กำหนด `grid-column` ให้ `<footer id="pwaFooterBanner">`
- **ผลกระทบ:** บนหน้าจอขนาดใหญ่ `#pwaFooterBanner` จะถูกดันลงไปอยู่แถวที่ 3 คอลัมน์ที่ 1 (ความกว้าง 280px ใต้เมนูด้านซ้าย)
- **แนวทางแก้ไข:** กำหนดให้ `.app-shell > #pwaFooterBanner` อยู่คอลัมน์ที่ 2 (`grid-column: 2; max-width: 960px; width: 100%; justify-self: center;`) และปรับ `.sidebar-drawer` ให้ครอบคลุมถึงแถวล่างสุด (`grid-row: 1 / span 3`)

### 2.3 การลงทะเบียน PWA Manifest ด้วย `Blob URL` และตัวเลขจำนวนเครื่องมือไม่ตรงกับความจริง
- **ไฟล์ที่เกี่ยวข้อง:** `calculator_AIO/src/ui/modals.js` (บรรทัดที่ 49, 66-110), `calculator_AIO/index.html` (บรรทัดที่ 1-35, 1631-1633), `calculator_AIO/manifest.json`
- **สาเหตุ:**
  1. `setupPWA()` ใน `modals.js` สร้าง `<link rel="manifest">` จาก `URL.createObjectURL(manifestBlob)` ตอนรันไทม์ ซึ่งเบราว์เซอร์มาตรฐานไม่รองรับการใช้ `blob:` URL สำหรับ PWA Manifest อย่างสมบูรณ์ ทั้งที่มีไฟล์ `calculator_AIO/manifest.json` อยู่แล้ว
  2. หน้าต่าง `#infoModal` ใน `calculator_AIO/index.html` แสดงตัวเลข `18` ตายตัว และค่าสำรองใน `modals.js` ยังระบุ `22` ในขณะที่ `TOOLS_CATALOG` ปัจจุบันมี 36 เครื่องมือ
- **แนวทางแก้ไข:** เพิ่ม `<link rel="manifest" href="./manifest.json">` ลงใน `<head>` ของ `calculator_AIO/index.html` โดยตรง, ยกเลิกการสร้าง `blob:` manifest ซ้ำใน `modals.js` และอัปเดตตัวเลขจำนวนเครื่องมือใน `#infoModal` ให้ดึงค่าจาก `TOOLS_CATALOG.length`

### 2.4 ปัญหา Timezone UTC และการตัดสินสถานะงวดวันหวยออกใน `lotto_book`
- **ไฟล์ที่เกี่ยวข้อง:** `lotto_book/src/checker.js` (บรรทัดที่ 51, 58, 211-230) และ `lotto_book/src/draws.js`
- **สาเหตุ:**
  1. `checkTicket()` ใช้ `new Date().toISOString().slice(0, 10)` ซึ่งอ้างอิงเวลา UTC แทนเวลาประเทศไทย (`Asia/Bangkok`) ทำให้ช่วงเวลา 00:00 - 06:59 น. ตามเวลาไทยได้วันที่ย้อนหลังไป 1 วัน
  2. ในวันออกรางวัลช่วงก่อนเวลา 16:00 น. เงื่อนไข `drawDate > today` เป็นเท็จ ทำให้ระบบแสดงสถานะเป็น `no_data` แทนที่จะเป็น `upcoming`
  3. การตรวจสลากแบบเลข 3 ตัว (`digit3`) ใช้ `.includes(padded3)` เพียงครั้งเดียว หากผลรางวัลเลขหน้า 3 ตัวหรือเลขท้าย 3 ตัวหมุนออกเลขซ้ำกันทั้ง 2 ครั้ง จะคำนวณเงินรางวัลตกหล่นไป 1 รางวัล (ต่างจากสลาก 6 หลักที่ใช้ `.filter()` นับจำนวนครั้งที่ตรงอย่างถูกต้องแล้ว)
- **แนวทางแก้ไข:** ใช้เวลาประเทศไทยจาก `LottoDraws.thailandNow()` ในการเปรียบเทียบวันที่/เวลา และปรับการตรวจรางวัล `digit3` ให้ใช้ `.filter()` นับจำนวนครั้งที่ตรงเหมือนสลาก 6 หลัก

### 2.5 ฟีเจอร์แก้ไขรายการสลากใน `lotto_book` ยังไม่มีปุ่มเรียกใช้งานใน UI
- **ไฟล์ที่เกี่ยวข้อง:** `lotto_book/src/views/myTickets.js` (บรรทัดที่ 33, 310-315) และ `lotto_book/src/storage.js` (บรรทัดที่ 58-62)
- **สาเหตุ:** มีการเตรียมตัวแปร `editingTicketId: null` และระบบบันทึกทับตาม `id` ไว้แล้ว แต่ในหน้ารายการสลากมีเฉพาะปุ่มลบ (`btn-delete-ticket`)
- **แนวทางแก้ไข:** เพิ่มปุ่มแก้ไขรายการสลากในแต่ละแถว เพื่อดึงข้อมูลสลากใบนั้นกลับขึ้นไปแก้ไขบนฟอร์มได้

---

## หมวดที่ 3: ความปลอดภัยและการตรวจสอบข้อมูล (Security & Data Validation)

### 3.1 ช่องโหว่ Stored DOM XSS ใน `lotto_book`
- **ไฟล์ที่เกี่ยวข้อง:** `lotto_book/src/views/myTickets.js` (บรรทัดที่ 286-297), `lotto_book/src/views/checkResults.js` (บรรทัดที่ 107, 303), `lotto_book/src/app.js` (บรรทัดที่ 198-201)
- **สาเหตุ:** ข้อมูลที่ผู้ใช้กรอกหรือนำเข้าจากไฟล์ JSON เช่น `t.note` (บันทึกช่วยจำ), `t.number`, `t.drawDate` และข้อความ `message` ใน `showToast` ถูกแทรกลงใน `.innerHTML` โดยตรงโดยไม่มีการแปลงอักขระพิเศษ (`escapeHTML`)
- **แนวทางแก้ไข:** เพิ่มฟังก์ชันกลาง `escapeHTML` ใน `lotto_book` แล้วครอบข้อมูลทุกจุดก่อนแสดงผลผ่าน `.innerHTML` หรือใช้ `textContent` ใน `showToast`

### 3.2 การตรวจสอบความถูกต้องของข้อมูลสลากและไฟล์ JSON ที่นำเข้า
- **ไฟล์ที่เกี่ยวข้อง:** `lotto_book/src/storage.js` (บรรทัดที่ 38-67, 249-300) และ `lotto_book/src/views/myTickets.js` (บรรทัดที่ 350-380)
- **สาเหตุ:**
  1. `saveTicket()` ไม่ได้ตรวจสอบว่า `ticket.number` เป็นตัวเลขล้วนจำนวน 2, 3 หรือ 6 หลัก (`/^(?:\d{2}|\d{3}|\d{6})$/`) และไม่ได้ตรวจสอบรูปแบบวันที่ `YYYY-MM-DD`
  2. `importDataJSON()` ในโหมด `replace` บันทึกอาเรย์จากไฟล์ JSON ลง `localStorage` ทันทีโดยไม่ตรวจสอบโครงสร้างข้อมูลแต่ละรายการ
- **แนวทางแก้ไข:** เพิ่มการตรวจสอบรูปแบบหมายเลขสลาก (ต้องเป็นตัวเลข 2, 3 หรือ 6 หลักเท่านั้น), ตรวจสอบวันที่งวด และกรองข้อมูลทุกใบผ่านฟังก์ชันทำความสะอาดข้อมูลก่อนบันทึกลง `localStorage`

---

## หมวดที่ 4: ความสม่ำเสมอของระบบธีมและส่วนประกอบ UI (Design System & Theme Compliance)

### 4.1 การใช้คลาส `dark:`, `bg-white` และสี HEX ตายตัวใน `calculator_AIO`
ตามกฎใน `calculator_AIO/AGENTS.md` (บรรทัดที่ 29-39) ระบบธีมทำงานผ่านแอตทริบิวต์ `html[data-theme]` ทั้ง 5 ธีม (Airbnb, Classic, Dark Luxe, Together, Ferrari) จึงห้ามใช้ `dark:` และห้ามกำหนดสีตายตัว แต่จากการตรวจสอบซอร์สโค้ดพบจุดที่ยังต้องปรับให้ใช้ `themed-tool-card`, `themed-result-card` และตัวแปรสีกลาง (`--app-ink`, `--app-muted`, `--app-surface-soft` ฯลฯ) ดังนี้:

| ไฟล์โมดูล | จำนวน `bg-white` | จำนวน `dark:` | จำนวนสี HEX ตายตัว | จำนวน `themed-*-card` | สถานะ |
| --- | :---: | :---: | :---: | :---: | --- |
| `src/tools/finance_thai.js` | 0 | 0 | 0 | 8 | เป็นไปตามมาตรฐาน |
| `src/tools/legal_labor.js` | 0 | 0 | 0 | 10 | เป็นไปตามมาตรฐาน |
| `src/tools/lotto.js` | 0 | 0 | 0 | 0 (ใช้ `.lotto-card`) | เป็นไปตามมาตรฐาน |
| `src/tools/biz.js` | 2 | 0 | 7 | 18 | ต้องเก็บตกบางส่วน |
| `src/tools/shop.js` | 6 | 0 | 16 | 9 | ต้องปรับปรุงเครื่องมือเก่า |
| `src/tools/special.js` | 5 | 0 | 20 | 8 | ต้องปรับปรุงเครื่องมือเก่า |
| `src/tools/finance.js` | 8 | 0 | 21 | 10 | ต้องปรับปรุงเครื่องมือเก่า |
| `src/tools/work.js` | 15 | 0 | 31 | 0 | ต้องปรับปรุงทั้งหมด |
| `src/tools/tax_property.js` | 0 | 13 | 13 | 14 | ต้องลบ `dark:` และสี HEX |
| `src/tools/lifestyle_thai.js` | 0 | 8 | 8 | 12 | ต้องลบ `dark:` และสี HEX |
| `src/core/history.js` | 4 | 9 | 13 | 0 | ต้องเปลี่ยนไปใช้ตัวแปรสีกลาง |
| `src/core/compare.js` | 3 | 10 | 0 | 0 | ต้องเปลี่ยนไปใช้ตัวแปรสีกลาง |

### 4.2 การใช้ `window.prompt()` และ `window.confirm()`
- **ไฟล์ที่เกี่ยวข้อง:** `calculator_AIO/src/core/history.js` (บรรทัดที่ 359, 391), `calculator_AIO/src/ui/modals.js` (บรรทัดที่ 190), `lotto_book/src/views/myTickets.js` (บรรทัดที่ 396, 412)
- **ปัญหา:** การใช้กล่องโต้ตอบพื้นฐานของเบราว์เซอร์ทำให้เธรดหลักหยุดชะงัก ไม่สอดคล้องกับหน้าตาของธีม และอาจถูกบล็อกในบางสภาพแวดล้อมของ PWA/WebView
- **แนวทางแก้ไข:** เปลี่ยนไปใช้ `<dialog>` หรือ Modal ของระบบแทน

---

## หมวดที่ 5: ประสิทธิภาพ การทำงานแบบ Offline (PWA) และสถาปัตยกรรม

### 5.1 การใช้ Tailwind Play CDN (`cdn.tailwindcss.com`) บน Production และปัญหา Offline ใน `lotto_book`
- **ไฟล์ที่เกี่ยวข้อง:** `calculator_AIO/index.html` (บรรทัดที่ 28), `lotto_book/index.html` (บรรทัดที่ 17), `lotto_book/sw.js` (บรรทัดที่ 59)
- **ปัญหา:**
  1. `cdn.tailwindcss.com` เป็นสคริปต์สำหรับนักพัฒนาที่ต้องรัน JavaScript ขนาดใหญ่เพื่อสแกน DOM และสร้าง CSS ตอนเปิดหน้าเว็บทุกครั้ง
  2. ใน `lotto_book/sw.js` บรรทัดที่ 59 กำหนดเงื่อนไข `if (response && response.status === 200 && response.type === 'basic')` ซึ่งทรัพยากรข้ามโดเมนอย่าง `cdn.tailwindcss.com` มีค่า `response.type` เป็น `'cors'` หรือ `'opaque'` ทำให้ **Service Worker ของ `lotto_book` ไม่เคยบันทึก Tailwind CSS ลงใน Cache เลย** เมื่อเปิดใช้งานขณะไม่มีอินเทอร์เน็ตเลย์เอาต์ของ `lotto_book` จะพัง
- **แนวทางแก้ไข:**
  - ระยะสั้น: ปรับ `lotto_book/sw.js` ให้รองรับการแคช `response.type === 'cors'` และ `'opaque'` เหมือนฝั่ง `calculator_AIO/sw.js`
  - ระยะยาว: คอมไพล์ Tailwind CSS ออกมาเป็นไฟล์ `.css` ภายในโปรเจคต์ เพื่อให้โหลดเร็วขึ้นและทำงานแบบ Offline ได้ 100% โดยไม่ต้องพึ่ง CDN ภายนอก

### 5.2 การแคชไฟล์ซ้ำซ้อนและการดักจับ API สดใน `calculator_AIO/sw.js`
- **ไฟล์ที่เกี่ยวข้อง:** `calculator_AIO/sw.js` (บรรทัดที่ 2-26, 69-91)
- **ปัญหา:**
  1. `STATIC_ASSETS` สั่ง Pre-cache ทั้ง `./src/bundle.js?v=40` และไฟล์ซอร์สย่อยใน `./src/` อีก 18 ไฟล์ ทั้งที่ `index.html` โหลดเฉพาะ `bundle.js` เพียงไฟล์เดียว (และรายการไฟล์ย่อยนั้นก็ขาดไฟล์ใหม่อีก 4 ไฟล์) ทำให้โหลดข้อมูลซ้ำซ้อนเกือบ 2 เท่าขณะติดตั้ง PWA
  2. ตัวดักจับ `fetch` ใน `calculator_AIO/sw.js` ใช้กลยุทธ์ Cache-First กับทุก GET request โดยไม่ได้ยกเว้น API ภายนอก (เช่น Frankfurter API สำหรับอัตราแลกเปลี่ยน หรือ API ราคาทองคำ) ทำให้เมื่อผู้ใช้กดอัปเดตเรทราคา ระบบอาจส่งค่าเก่าจาก Cache กลับมาก่อน
- **แนวทางแก้ไข:**
  - เอาไฟล์ย่อยใน `./src/core/`, `./src/tools/`, `./src/ui/` ออกจาก `STATIC_ASSETS` ใน `sw.js` โดยคงไว้เฉพาะ `./src/bundle.js?v=...` และไฟล์หลักที่หน้าเว็บใช้งานจริง
  - สำหรับการเรียก API ภายนอก (ข้ามโดเมนที่ไม่ใช่ Font/CDN หรือ URL ข้อมูลเรทสด) ให้ใช้กลยุทธ์ Network-First

### 5.3 การบล็อกการเรนเดอร์หน้าแรกของ `lotto_book` ด้วยไฟล์ `glo_results.json` (1.15 MB)
- **ไฟล์ที่เกี่ยวข้อง:** `lotto_book/src/app.js` (บรรทัดที่ 18-21, 41-54)
- **ปัญหา:** `App.init()` สั่ง `await this.loadHistoricalData()` ซึ่งต้องดาวน์โหลดและแปลงไฟล์ `./data/glo_results.json` ขนาด 1.15 MB ให้เสร็จก่อนจึงจะเริ่มเรนเดอร์แท็บแรก (`#tickets`) ทั้งที่หน้าสมุดสลากใช้ข้อมูลจาก `localStorage` เป็นหลัก
- **แนวทางแก้ไข:** เรนเดอร์หน้า `#tickets` ทันทีจากข้อมูลในเครื่อง แล้วโหลด `glo_results.json` แบบ Asynchronous ในพื้นหลัง เมื่อโหลดเสร็จจึงอัปเดตสถานะการตรวจผล

---

## หมวดที่ 6: การเชื่อมโยงระบบและการจัดการไฟล์ในโปรเจคต์ (Integration & Project Hygiene)

1. **การเชื่อมโยงระหว่าง `calculator_AIO`, `lotto_book` และหน้าหลัก (`index.html`):**
   - เพิ่มทางลัดไป `lotto_book` ใน Sidebar และหน้า Entry Home ของ `calculator_AIO`
   - เชื่อมต่อการส่งเลขชุดจากเครื่องมือ `lotto_calc` (ใน `calculator_AIO`) ไปยังหน้าบันทึกสลากใน `lotto_book` ได้โดยตรง
   - ปรับให้หน้าหลัก `index.html` รองรับธีมที่ผู้ใช้เลือกไว้ในแอปย่อย
2. **การจัดการไฟล์สำรองและไฟล์ที่ไม่ใช้งานใน `calculator_AIO/`:**
   - ย้ายหรือลบไฟล์เก่าที่ไม่ได้ใช้งานแล้วออกจากโฟลเดอร์ Production ได้แก่ `calculator_AIO/pwa.html`, `calculator_AIO/index.mvp-backup.html` และไฟล์ต้นแบบชื่อภาษาไทยที่มีปัญหาการเข้ารหัสชื่อไฟล์
3. **การเพิ่มไฟล์ควบคุมมาตรฐานของโปรเจคต์:**
   - เพิ่ม `package.json` ที่รากของโปรเจคต์สำหรับรันคำสั่ง `npm run build` และ `npm test` รวมศูนย์
   - เพิ่ม `.gitattributes` (`* text=auto eol=lf`) เพื่อแก้ปัญหาคำเตือน `LF will be replaced by CRLF` บน Windows

---

## แผนการดำเนินงานอย่างปลอดภัย (Step-by-Step & Rollback Plan)

เพื่อให้สามารถตรวจสอบและย้อนกลับ (Rollback) ได้ตลอดเวลาหากพบปัญหา แนะนำให้แบ่งการแก้ไขออกเป็น 3 ระยะ ดังนี้:

1. **ระยะที่ 1: ความถูกต้องเร่งด่วนและกฎไร้ Emoji (Quick Wins & Zero-Emoji)**
   - ลบ Emoji และสัญลักษณ์ตกแต่งที่ค้างอยู่ใน `lotto_book` และ `calculator_AIO` ทั้งหมด พร้อมอัปเดตชุดทดสอบ
   - เพิ่ม `<option>` ให้ครบทั้ง 19 เครื่องมือใน `#compareToolSelect` และแก้ตำแหน่ง `#pwaFooterBanner` บนหน้าจอ Desktop
   - เพิ่ม `escapeHTML`, การตรวจรูปแบบเลขสลาก และการใช้วันที่ตามเวลาประเทศไทยใน `lotto_book`
   - รันชุดทดสอบทั้งหมด (`correctness.test.cjs`, `lotto_core.test.cjs`, `phase1.test.cjs`, `glo_api.test.cjs`)
2. **ระยะที่ 2: มาตรฐานธีมและประสิทธิภาพ PWA (Theme Unification & PWA)**
   - ปรับปรุงเครื่องมือที่ยังมี `bg-white`, `dark:` และสี HEX ตายตัว ให้ใช้คลาสกลาง `themed-tool-card` และตัวแปรสีของระบบครบทั้ง 5 ธีม
   - ปรับปรุง `sw.js` และ `manifest.json` ของทั้งสองแอปให้ทำงานแบบ Offline ได้สมบูรณ์และไม่แคชไฟล์ซ้ำซ้อน
3. **ระยะที่ 3: ประสบการณ์ผู้ใช้และการเชื่อมโยงข้อมูล (UX & Integration)**
   - เพิ่มปุ่มแก้ไขรายการสลากใน `lotto_book` และเปลี่ยน `prompt()` / `confirm()` เป็น Modal ของระบบ
   - ปรับการโหลด `glo_results.json` ไม่ให้บล็อกการเปิดหน้าแรก และเชื่อมโยงการส่งข้อมูลระหว่าง `calculator_AIO` กับ `lotto_book`
