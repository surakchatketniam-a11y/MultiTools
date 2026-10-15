// ==============================================================
// Multitools Calculator - Catalog & Group Definitions
// ==============================================================

var UNIT_DEFINITIONS = {
    unit: { key: 'unit', label: 'หน่วย', family: 'general', factor: 1,     baseUnit: 'หน่วย' },
    pcs:  { key: 'pcs',  label: 'ชิ้น',  family: 'count',   factor: 1,     baseUnit: 'ชิ้น' },
    doz:  { key: 'doz',  label: 'โหล',  family: 'count',   factor: 12,    baseUnit: 'ชิ้น' },
    g:    { key: 'g',    label: 'g',    family: 'weight',  factor: 0.001, baseUnit: 'กก.' },
    kg:   { key: 'kg',   label: 'kg',   family: 'weight',  factor: 1,     baseUnit: 'กก.' },
    ml:   { key: 'ml',   label: 'ml',   family: 'volume',  factor: 0.001, baseUnit: 'ลิตร' },
    L:    { key: 'L',    label: 'L',    family: 'volume',  factor: 1,     baseUnit: 'ลิตร' }
};

var TOOL_GROUPS = [
    { id: 'shop', name: '🛒 ซื้อของ & ทั่วไป' },
    { id: 'biz', name: '💼 ธุรกิจ & ค้าขาย' },
    { id: 'finance', name: '🏦 การเงิน & วางแผน' },
    { id: 'work', name: '📅 เวลา & สำนักงาน' },
    { id: 'special', name: '🩺 สุขภาพ & พิเศษ' }
];

var TOOLS_CATALOG = [
    // หมวดหมู่ที่ 1: ซื้อของ & ทั่วไป
    { id: 'unit_price', group: 'shop', category: 'fav', menuTitle: 'ราคาต่อหน่วย', headerTitle: 'เครื่องคำนวณราคาต่อหน่วย', usesSharedKeypad: true, keywords: 'unit price ราคา ต่อหน่วย คุ้ม เปรียบเทียบ ซื้อของ ถูกกว่า' },
    { id: 'discount',   group: 'shop', category: 'fav', menuTitle: 'ส่วนลด', headerTitle: 'เครื่องคำนวณส่วนลด', usesSharedKeypad: true, keywords: 'discount ส่วนลด sale โปรโมชั่น ontop ลดราคา' },
    { id: 'gold_thai',  group: 'shop', category: 'fav', menuTitle: 'ราคาทองคำไทย', headerTitle: 'คำนวณราคาทองคำไทย (แท่ง/รูปพรรณ/กำเหน็จ)', usesSharedKeypad: false, keywords: 'gold thai ทอง ราคาทอง ทองคำ ทองแท่ง ทองรูปพรรณ สลึง กำเหน็จ เยาวราช สมาคมค้าทองคำ ออมทอง' },
    { id: 'tip',        group: 'shop', category: 'all', menuTitle: 'ทิป & หารบิล', headerTitle: 'เครื่องคำนวณทิป & หารค่าอาหาร', usesSharedKeypad: true, keywords: 'tip ทิป หารค่าข้าว บิล หารคน split bill ร้านอาหาร' },
    { id: 'unit',       group: 'shop', category: 'fav', menuTitle: 'แปลงหน่วย', headerTitle: 'ตัวแปลงหน่วย', usesSharedKeypad: true, keywords: 'unit แปลงหน่วย ตารางวา ไร่ เมตร กิโลกรัม ลิตร นิ้ว ฟุต' },

    // หมวดหมู่ที่ 2: ธุรกิจ & ค้าขาย
    { id: 'vat',        group: 'biz', category: 'fav', menuTitle: 'ภาษีมูลค่าเพิ่ม (VAT)', headerTitle: 'เครื่องคำนวณภาษีมูลค่าเพิ่ม', usesSharedKeypad: true, keywords: 'vat ภาษี 7% มูลค่าเพิ่ม ถอด vat รวม vat' },
    { id: 'vat_wht',    group: 'biz', category: 'fav', menuTitle: 'VAT + หัก ณ ที่จ่าย', headerTitle: 'VAT + หัก ณ ที่จ่าย', usesSharedKeypad: false, keywords: 'vat wht หัก ณ ที่จ่าย 1% 2% 3% 5% ภาษีหัก ณ ที่จ่าย วางบิล' },
    { id: 'percent',    group: 'biz', category: 'fav', menuTitle: 'เปอร์เซ็นต์ & กำไร', headerTitle: 'เครื่องคำนวณเปอร์เซ็นต์', usesSharedKeypad: true, keywords: 'percent เปอร์เซ็นต์ กำไร margin markup ร้อยละ สัดส่วน' },
    { id: 'salary',     group: 'biz', category: 'all', menuTitle: 'จัดการเงินเดือน 50/30/20', headerTitle: 'เครื่องมือจัดการเงินเดือน', usesSharedKeypad: true, keywords: 'salary เงินเดือน 50 30 20 รายจ่าย เงินเก็บ ออมเงิน หนี้' },

    // หมวดหมู่ที่ 3: การเงิน & วางแผน
    { id: 'loan',              group: 'finance', category: 'all', menuTitle: 'เงินกู้ & ผ่อนชำระ', headerTitle: 'เครื่องคำนวณเงินกู้', usesSharedKeypad: true, keywords: 'loan เงินกู้ ผ่อนบ้าน ผ่อนรถ ดอกเบี้ย ค่างวด ดอกเบี้ยคงที่ ค่างวดผ่อน' },
    { id: 'savings',           group: 'finance', category: 'all', menuTitle: 'เงินออม & เกษียณ', headerTitle: 'เครื่องคำนวณเงินออม', usesSharedKeypad: true, keywords: 'savings เงินออม เกษียณ ดอกเบี้ยทบต้น เงินเฟ้อ ออมทรัพย์' },
    { id: 'tax_personal',      group: 'finance', category: 'fav', menuTitle: 'ภาษีบุคคล (ภ.ง.ด.90/91)', headerTitle: 'คำนวณภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด. 90/91)', usesSharedKeypad: false, keywords: 'tax personal ภาษี เงินได้ บุคคลธรรมดา ภงด 90 91 เงินเดือน ลดหย่อน ประกัน กองทุน บริจาค ขอคืนภาษี คืนเงิน ภาษีรายได้' },
    { id: 'property_transfer', group: 'finance', category: 'fav', menuTitle: 'ค่าโอนที่ดิน & อสังหาฯ', headerTitle: 'ค่าธรรมเนียมโอนที่ดิน & ภาษีซื้อขายอสังหาฯ', usesSharedKeypad: false, keywords: 'property transfer ค่าโอน ที่ดิน คอนโด บ้าน ภาษีอสังหา ธุรกิจเฉพาะ อากรแสตมป์ กรมที่ดิน จำนอง ค่าธรรมเนียมโอน ซื้อขาย' },
    { id: 'car_loan',          group: 'finance', category: 'fav', menuTitle: 'สินเชื่อเช่าซื้อรถ (Car Loan)', headerTitle: 'คำนวณสินเชื่อเช่าซื้อรถยนต์ & มอเตอร์ไซค์', usesSharedKeypad: false, keywords: 'car loan รถ เช่าซื้อ ผ่อนรถ รถยนต์ มอเตอร์ไซค์ ปิดบัญชีก่อนกำหนด สคบ ดอกเบี้ยคงที่ flat rate vat รถมือสอง เงินดาวน์ ค่างวด' },
    { id: 'currency',          group: 'finance', category: 'fav', menuTitle: 'แปลงสกุลเงิน', headerTitle: 'ตัวแปลงสกุลเงิน', usesSharedKeypad: true, keywords: 'currency สกุลเงิน แลกเงิน ดอลลาร์ บาท เยน ยูโร exchange rate forex' },
    { id: 'lotto_calc',        group: 'finance', category: 'fav', menuTitle: 'หวย & สลากไทย', headerTitle: 'เครื่องคำนวณหวย & สลากไทย', usesSharedKeypad: false, keywords: 'lotto หวย สลากกินแบ่งรัฐบาล สลากออมสิน สลาก n3 เลขเด็ด 6 ประตู 19 ประตู 2 ตัว 3 ตัว รางวัลที่ 1 โต๊ด ขึ้นเงินรางวัล ภาษีสลาก' },
    { id: 'legal_interest',    group: 'finance', category: 'fav', menuTitle: 'ดอกเบี้ยผิดนัด ป.พ.พ. 5%', headerTitle: 'คำนวณดอกเบี้ยผิดนัดชำระหนี้ตามกฎหมายใหม่ (ป.พ.พ. ม.7/ม.224)', usesSharedKeypad: false, keywords: 'legal interest ดอกเบี้ย ผิดนัด กฎหมาย ปพพ 224 7 ร้อยละ 5 3 ต่อปี หนี้ค้าง วันผิดนัด เบี้ยปรับ' },

    // หมวดหมู่ที่ 4: เวลา & สำนักงาน
    { id: 'social_security',   group: 'work', category: 'fav', menuTitle: 'ประกันสังคม & บำนาญ', headerTitle: 'คำนวณเงินสมทบ & บำนาญชราภาพ ประกันสังคม (ม.33/39/40)', usesSharedKeypad: false, keywords: 'social security ประกันสังคม บำนาญ บำเหน็จ ชราภาพ ม33 ม39 ม40 เงินสมทบ เงินออมเกษียณ สปส เกษียณอายุ 55 ปี 60 เดือนสุดท้าย' },
    { id: 'labor_severance',   group: 'work', category: 'fav', menuTitle: 'เงินชดเชยเลิกจ้าง & ค่าตกใจ', headerTitle: 'คำนวณเงินชดเชยเลิกจ้าง & สินจ้างแทนบอกกล่าวล่วงหน้า (ม.118/ม.17)', usesSharedKeypad: false, keywords: 'labor severance เลิกจ้าง ชดเชย ค่าตกใจ กฎหมายแรงงาน ม118 ม17 อายุงาน วันลาพักร้อน ว่างงาน ไล่ออก ปลดพนักงาน' },
    { id: 'date_work',  group: 'work', category: 'all', menuTitle: 'นับวันทำการ (Workdays)', headerTitle: 'นับวันทำการ', usesSharedKeypad: false, keywords: 'date work วันทำการ วันทำงาน sla วันหยุด ส่งงาน วันครบกำหนด' },
    { id: 'date_calc',  group: 'work', category: 'all', menuTitle: 'คำนวณวันที่ & อายุ', headerTitle: 'เครื่องคำนวณวันที่', usesSharedKeypad: false, keywords: 'date calc วันที่ บวกวัน ลบวัน คำนวณอายุ ระยะห่างวัน' },
    { id: 'world_time', group: 'work', category: 'all', menuTitle: 'เวลาโลก & นัดหมาย', headerTitle: 'นาฬิกาเวลาโลก', usesSharedKeypad: false, keywords: 'world time เวลาโลก timezone ข้ามเขตเวลา โตเกียว นิวยอร์ก ลอนดอน นัดประชุม' },
    { id: 'gpa',        group: 'work', category: 'all', menuTitle: 'เกรดเฉลี่ย (GPA)', headerTitle: 'คำนวณเกรดเฉลี่ย (GPA)', usesSharedKeypad: false, keywords: 'gpa เกรด เฉลี่ย หน่วยกิต ผลการเรียน ตัดเกรด' },

    // หมวดหมู่ที่ 5: สุขภาพ & พิเศษ
    { id: 'health',     group: 'special', category: 'all', menuTitle: 'ตัวชี้วัดร่างกาย (BMI/BMR)', headerTitle: 'คำนวณตัวชี้วัดร่างกาย (BMI/BMR)', usesSharedKeypad: true, keywords: 'health สุขภาพ bmi bmr ส่วนสูง น้ำหนัก แคลอรี่ อ้วน ผอม' },
    { id: 'ovulation',  group: 'special', category: 'all', menuTitle: 'วันตกไข่ & รอบเดือน', headerTitle: 'คำนวณวันตกไข่และรอบเดือน', usesSharedKeypad: false, keywords: 'ovulation ตกไข่ ประจำเดือน รอบเดือน ภาวะเจริญพันธุ์ มีลูก' },
    { id: 'fuel_cost',  group: 'special', category: 'all', menuTitle: 'ค่าใช้จ่ายเชื้อเพลิง', headerTitle: 'คำนวณค่าใช้จ่ายเชื้อเพลิง', usesSharedKeypad: true, keywords: 'fuel cost น้ำมัน ค่าน้ำมัน ระยะทาง ทริป เที่ยว ค่าน้ำมันไปกลับ' },
    { id: 'fuel_eff',         group: 'special', category: 'all', menuTitle: 'ประสิทธิภาพเชื้อเพลิง', headerTitle: 'คำนวณประสิทธิภาพเชื้อเพลิง', usesSharedKeypad: true, keywords: 'fuel efficiency ประสิทธิภาพน้ำมัน อัตราสิ้นเปลือง กิโลเมตรต่อลิตร l/100km' },
    { id: 'electricity_bill', group: 'special', category: 'fav', menuTitle: 'ค่าไฟฟ้า & อุปกรณ์', headerTitle: 'คำนวณค่าไฟฟ้าบ้าน & เครื่องใช้ไฟฟ้า', usesSharedKeypad: false, keywords: 'electricity bill ค่าไฟ ค่าไฟฟ้า การไฟฟ้า กฟน กฟภ ft ขั้นบันได แอร์ ค่าไฟบ้าน วัตต์ watt' },
    { id: 'area_cost',  group: 'special', category: 'all', menuTitle: 'ต้นทุนต่อพื้นที่ (ที่ดิน)', headerTitle: 'คำนวณต้นทุนต่อพื้นที่', usesSharedKeypad: false, keywords: 'area cost ต้นทุน ที่ดิน ไร่ งาน ตารางวา เกษตร ค่าปุ๋ย ค่าไถ' },
    { id: 'hex',        group: 'special', category: 'all', menuTitle: 'แปลงเลขฐาน (HEX/BIN)', headerTitle: 'แปลงเลขฐาน (DEC/HEX/BIN/OCT)', usesSharedKeypad: false, keywords: 'hex bin oct dec เลขฐาน ฐานสิบ ฐานสิบหก ฐานสอง ไบนารี โปรแกรมเมอร์' },
    { id: 'calc',       group: 'special', category: 'fav', menuTitle: 'เครื่องคิดเลขทั่วไป', headerTitle: 'เครื่องคิดเลข', usesSharedKeypad: false, keywords: 'calc เครื่องคิดเลข คิดเลข บวก ลบ คูณ หาร' }
];

(function(root) {
    const exportsObj = {
        UNIT_DEFINITIONS,
        TOOL_GROUPS,
        TOOLS_CATALOG
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }
    if (root) {
        Object.assign(root, exportsObj);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
