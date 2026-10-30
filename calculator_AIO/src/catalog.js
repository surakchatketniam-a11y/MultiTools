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
    { id: 'shop', name: 'ซื้อของ & ทั่วไป' },
    { id: 'biz', name: 'ธุรกิจ & ค้าขาย' },
    { id: 'engineering', name: 'ช่าง & ก่อสร้าง' },
    { id: 'finance', name: 'การเงิน & วางแผน' },
    { id: 'work', name: 'เวลา & สำนักงาน' },
    { id: 'special', name: 'สุขภาพ & พิเศษ' }
];

var TOOLS_CATALOG = [
    // หมวดหมู่ที่ 1: ซื้อของ & ทั่วไป
    { id: 'unit_price', group: 'shop', category: 'fav', menuTitle: 'ราคาต่อหน่วย', headerTitle: 'เครื่องคำนวณราคาต่อหน่วย', usesSharedKeypad: true, keywords: 'unit price ราคา ต่อหน่วย คุ้ม เปรียบเทียบ ซื้อของ ถูกกว่า' },
    { id: 'discount',   group: 'shop', category: 'fav', menuTitle: 'ส่วนลด', headerTitle: 'เครื่องคำนวณส่วนลด', usesSharedKeypad: true, keywords: 'discount ส่วนลด sale โปรโมชั่น ontop ลดราคา' },
    { id: 'gold_thai',  group: 'shop', category: 'fav', menuTitle: 'ราคาทองคำไทย', headerTitle: 'คำนวณราคาทองคำไทย (แท่ง/รูปพรรณ/กำเหน็จ)', usesSharedKeypad: false, keywords: 'gold thai ทอง ราคาทอง ทองคำ ทองแท่ง ทองรูปพรรณ สลึง กำเหน็จ เยาวราช สมาคมค้าทองคำ ออมทอง' },
    { id: 'tip',        group: 'shop', category: 'all', menuTitle: 'ทิป & หารบิล', headerTitle: 'เครื่องคำนวณทิป & หารค่าอาหาร', usesSharedKeypad: true, keywords: 'tip ทิป หารค่าข้าว บิล หารคน split bill ร้านอาหาร' },
    { id: 'unit',       group: 'shop', category: 'fav', menuTitle: 'แปลงหน่วย', headerTitle: 'ตัวแปลงหน่วย', usesSharedKeypad: true, keywords: 'unit แปลงหน่วย ตารางวา ไร่ เมตร กิโลกรัม ลิตร นิ้ว ฟุต' },

    // หมวดหมู่ช่าง & ก่อสร้าง
    { id: 'construction_calc', group: 'engineering', category: 'fav', menuTitle: 'คำนวณวัสดุก่อสร้าง', headerTitle: 'คำนวณวัสดุก่อสร้าง & ปรับปรุงบ้าน (กระเบื้อง/สี/ปูน)', usesSharedKeypad: true, keywords: 'construction calc วัสดุก่อสร้าง ปรับปรุงบ้าน ซ่อมบ้าน กระเบื้อง ปูกระเบื้อง สีทาบ้าน ทาสี ปูน คอนกรีต เทพื้น ปูนกาว ยาแนว ไวร์เมช อิฐ ตารางเมตร คิว boq ช่างปูน ค่าแรง' },
    { id: 'btu_calc', group: 'engineering', category: 'fav', menuTitle: 'ขนาดแอร์ BTU & ค่าไฟ', headerTitle: 'คำนวณขนาดแอร์ BTU & เปรียบเทียบค่าไฟ Fixed Speed vs Inverter', usesSharedKeypad: true, keywords: 'btu calc ขนาดแอร์ btu บีทียู เลือกแอร์ ซื้อแอร์ ห้องนอน แอร์ inverter อินเวอร์เตอร์ fixed speed seer เบอร์ 5 ค่าไฟแอร์ ช่างแอร์ ติดแอร์ กั้นห้อง' },
    { id: 'land_fill_calc', group: 'engineering', category: 'fav', menuTitle: 'ดินถมที่ & รถดั๊มพ์', headerTitle: 'คำนวณดินถมที่ (คิวแน่น/คิวหลวม) & จำนวนเที่ยวรถดั๊มพ์', usesSharedKeypad: true, keywords: 'land fill ดินถม ถมที่ ถมดิน คิวดิน ลูกรัง ทรายถม รถดั๊มพ์ รถ6ล้อ รถ10ล้อ บดอัด ไร่ งาน ตารางวา เกลี่ยดิน ปรับพื้นที่ ที่ดิน' },
    { id: 'wall_ceiling_calc', group: 'engineering', category: 'all', menuTitle: 'ก่ออิฐ ฉาบปูน & ฝ้าเพดาน', headerTitle: 'คำนวณก่ออิฐ ฉาบปูน & ฝ้าเพดาน (อิฐมวลเบา/อิฐมอญ/ยิปซั่ม/ทีบาร์)', usesSharedKeypad: true, keywords: 'wall ceiling ก่ออิฐ ฉาบปูน ผนัง อิฐมวลเบา อิฐมอญ อิฐบล็อก ปูนฉาบ กั้นห้อง ฝ้าเพดาน ฝ้ายิปซั่ม ยิปซั่ม ทีบาร์ t-bar แผ่นฝ้า ช่างปูน ต่อเติมบ้าน' },
    { id: 'roof_steel_calc', group: 'engineering', category: 'all', menuTitle: 'หลังคา ตัดเหล็ก & เหล็กเส้น', headerTitle: 'คำนวณหลังคา ตัดท่อนเหล็ก 6 ม. & เหล็กเส้น/คอนกรีตโครงสร้าง', usesSharedKeypad: true, keywords: 'roof steel หลังคา เมทัลชีท กระเบื้องหลังคา จันทัน แป ความลาดชัน กันสาด โรงจอดรถ ตัดเหล็ก เหล็กกล่อง เหล็ก 6 เมตร เศษเหล็ก เหล็กเส้น rb db เหล็กข้ออ้อย น้ำหนักเหล็ก คอนกรีต เสา คาน ฐานราก ช่างเหล็ก' },
    { id: 'contractor_payment', group: 'engineering', category: 'all', menuTitle: 'แบ่งงวดงานรับเหมา & เงินประกัน', headerTitle: 'แบ่งงวดงานรับเหมา เงินประกันผลงาน (Retention) VAT & หัก ณ ที่จ่าย', usesSharedKeypad: true, keywords: 'contractor payment แบ่งงวด งวดงาน รับเหมา ผู้รับเหมา จ้างเหมา ต่อเติมบ้าน สร้างบ้าน รีโนเวท เงินประกันผลงาน retention หัก ณ ที่จ่าย 3% vat ค่าจ้าง สัญญาจ้าง boq ใบเสนอราคา' },
    { id: 'plumbing_pump', group: 'engineering', category: 'all', menuTitle: 'ถังเก็บน้ำ & ปั๊มน้ำบ้าน', headerTitle: 'คำนวณขนาดถังเก็บน้ำ & กำลังวัตต์ปั๊มน้ำอัตโนมัติ', usesSharedKeypad: true, keywords: 'plumbing pump ปั๊มน้ำ ถังเก็บน้ำ ถังน้ำ แท้งค์น้ำ น้ำประปา สำรองน้ำ ช่างประปา วัตต์ปั๊ม ปั๊มอัตโนมัติ บ้าน 2 ชั้น ลิตร ถังบนดิน ถังใต้ดิน' },
    { id: 'inch_fraction', group: 'engineering', category: 'all', menuTitle: 'เศษส่วนนิ้ว หุน & มม.', headerTitle: 'แปลงเศษส่วนนิ้ว หุน เป็นมิลลิเมตร (หน่วยช่างไทย)', usesSharedKeypad: true, keywords: 'inch fraction หุน นิ้ว เศษส่วนนิ้ว มิลลิเมตร มม. ซม. 4 หุน 6 หุน 1/2 นิ้ว 3/8 แปลงหน่วย ตลับเมตร ท่อ น็อต สกรู ดอกสว่าน หน่วยช่าง' },
    { id: 'shape_calc', group: 'engineering', category: 'all', menuTitle: 'พื้นที่ & ปริมาตรรูปทรง', headerTitle: 'คำนวณพื้นที่ & ปริมาตรรูปทรงหน้างาน (คางหมู สามเหลี่ยม วงกลม ทรงกระบอก)', usesSharedKeypad: true, keywords: 'shape area volume พื้นที่ ปริมาตร รูปทรง สี่เหลี่ยมคางหมู สามเหลี่ยม เฮรอน วงกลม ครึ่งวงกลม ทรงกระบอก เสากลม ร่องน้ำ คันดิน ปริซึม คิว ตารางเมตร ตารางวา ช่าง ถอดแบบ' },
    { id: 'wire_breaker', group: 'engineering', category: 'all', menuTitle: 'สายไฟ เบรกเกอร์ & แรงดันตก', headerTitle: 'เลือกขนาดสายไฟ เบรกเกอร์ & ตรวจแรงดันตก (1 เฟส)', usesSharedKeypad: true, keywords: 'wire breaker สายไฟ เบรกเกอร์ ขนาดสาย แรงดันตก voltage drop ตร.มม. แอมป์ เครื่องทำน้ำอุ่น แอร์ ev charger wallbox ช่างไฟ ติดตั้งไฟฟ้า thw vaf iec 01 mcb วสท.' },
    { id: 'conduit_fill', group: 'engineering', category: 'all', menuTitle: 'ขนาดท่อร้อยสาย', headerTitle: 'เลือกขนาดท่อร้อยสาย & นับจำนวนสายในท่อ (สาย IEC 01 / THW)', usesSharedKeypad: false, keywords: 'conduit fill ท่อร้อยสาย ขนาดท่อ ท่อ pvc ท่อ emt ท่อเหล็ก ร้อยสายไฟ จำนวนสายในท่อ ท่อ 20 มม. ท่อ 3 หุน ท่อ 4 หุน สายไฟ thw iec 01 ช่างไฟ ร้อยท่อ 53% 40% 31%' },
    { id: 'wire_data', group: 'engineering', category: 'all', menuTitle: 'ข้อมูลสาย THW/VAF & จำนวนม้วน', headerTitle: 'ข้อมูลสายไฟ IEC 01 (THW) / VAF & คำนวณจำนวนม้วนและน้ำหนัก', usesSharedKeypad: true, keywords: 'wire data สายไฟ thw iec 01 vaf น้ำหนักสาย ม้วนสาย ดรัม เส้นผ่านศูนย์กลางสาย ความต้านทานสาย ขนาดสาย ตร.มม. สั่งซื้อสาย กี่ม้วน สายไฟ 100 เมตร ช่างไฟ yazaki ยาซากิ' },
    { id: 'solar_rooftop', group: 'engineering', category: 'all', menuTitle: 'โซลาร์เซลล์หลังคาบ้าน & คืนทุน', headerTitle: 'คำนวณขนาดโซลาร์รูฟท็อปและจุดคุ้มทุน', usesSharedKeypad: true, keywords: 'solar rooftop โซลาร์ โซลาร์เซลล์ โซลาร์รูฟท็อป แผงโซลาร์ คืนทุน ประหยัดค่าไฟ ขายไฟคืน รับซื้อไฟ 2.20 โซลาร์ภาคประชาชน กี่แผง อินเวอร์เตอร์ kw kwp ค่าไฟ' },

    // หมวดหมู่ที่ 2: ธุรกิจ & ค้าขาย
    { id: 'vat',        group: 'biz', category: 'fav', menuTitle: 'ภาษีมูลค่าเพิ่ม (VAT)', headerTitle: 'เครื่องคำนวณภาษีมูลค่าเพิ่ม', usesSharedKeypad: true, keywords: 'vat ภาษี 7% มูลค่าเพิ่ม ถอด vat รวม vat' },
    { id: 'vat_wht',    group: 'biz', category: 'fav', menuTitle: 'VAT + หัก ณ ที่จ่าย', headerTitle: 'VAT + หัก ณ ที่จ่าย', usesSharedKeypad: false, keywords: 'vat wht หัก ณ ที่จ่าย 1% 2% 3% 5% ภาษีหัก ณ ที่จ่าย วางบิล' },
    { id: 'percent',    group: 'biz', category: 'fav', menuTitle: 'เปอร์เซ็นต์ & กำไร', headerTitle: 'เครื่องคำนวณเปอร์เซ็นต์', usesSharedKeypad: true, keywords: 'percent เปอร์เซ็นต์ กำไร margin markup ร้อยละ สัดส่วน' },
    { id: 'ecommerce_profit', group: 'biz', category: 'fav', menuTitle: 'กำไรขายของออนไลน์', headerTitle: 'คำนวณกำไรขายของออนไลน์ & ค่าธรรมเนียม (Shopee/Lazada/TikTok)', usesSharedKeypad: false, keywords: 'ecommerce profit กำไร ขายของออนไลน์ shopee lazada tiktok fee ค่าธรรมเนียม คอมมิชชัน ธุรกรรม ค่าส่ง ยิงแอด จุดคุ้มทุน breakeven profit margin มาร์เก็ตเพลส' },
    { id: 'food_costing',     group: 'biz', category: 'fav', menuTitle: 'ต้นทุนอาหาร & สูตร (F&B)', headerTitle: 'คำนวณต้นทุนอาหาร & เครื่องดื่ม (F&B Recipe Costing)', usesSharedKeypad: false, keywords: 'food costing ต้นทุนอาหาร เครื่องดื่ม สูตรอาหาร recipe f&b คาเฟ่ กาแฟ ร้านอาหาร เบเกอรี่ food cost กำไรต่อจาน ค่ากล่อง delivery บรรจุภัณฑ์' },
    { id: 'salary',     group: 'biz', category: 'fav', menuTitle: 'เงินเดือนสุทธิ & 50/30/20', headerTitle: 'คำนวณเงินเดือนสุทธิรับจริง (Take-Home Pay) & วางแผน 50/30/20', usesSharedKeypad: true, keywords: 'salary เงินเดือน เงินเดือนสุทธิ สลิปเงินเดือน net salary take home pay 50 30 20 รายจ่าย เงินเก็บ ออมเงิน หนี้ ประกันสังคม ภาษี ภงด1 PVD กยศ' },

    { id: 'loan',              group: 'finance', category: 'all', menuTitle: 'เงินกู้ & ผ่อนชำระ', headerTitle: 'เครื่องคำนวณเงินกู้', usesSharedKeypad: true, keywords: 'loan เงินกู้ ผ่อนบ้าน รีไฟแนนซ์ refinance retention โปะบ้าน ดอกเบี้ย ค่างวด ดอกเบี้ยคงที่ ค่างวดผ่อน ธปท จุดคุ้มทุน' },
    { id: 'savings',           group: 'finance', category: 'all', menuTitle: 'เงินออม & เกษียณ', headerTitle: 'เครื่องคำนวณเงินออม', usesSharedKeypad: true, keywords: 'savings เงินออม เกษียณ ดอกเบี้ยทบต้น เงินเฟ้อ ออมทรัพย์' },
    { id: 'tax_personal',      group: 'finance', category: 'fav', menuTitle: 'ภาษีบุคคล (ภ.ง.ด.90/91)', headerTitle: 'คำนวณภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด. 90/91)', usesSharedKeypad: false, keywords: 'tax personal ภาษี เงินได้ บุคคลธรรมดา ภงด 90 91 เงินเดือน ลดหย่อน ประกัน กองทุน บริจาค ขอคืนภาษี คืนเงิน ภาษีรายได้' },
    { id: 'property_transfer', group: 'finance', category: 'fav', menuTitle: 'ค่าโอนที่ดิน & อสังหาฯ', headerTitle: 'ค่าธรรมเนียมโอนที่ดิน & ภาษีซื้อขายอสังหาฯ', usesSharedKeypad: false, keywords: 'property transfer ค่าโอน ที่ดิน คอนโด บ้าน ภาษีอสังหา ธุรกิจเฉพาะ อากรแสตมป์ กรมที่ดิน จำนอง ค่าธรรมเนียมโอน ซื้อขาย' },
    { id: 'car_loan',          group: 'finance', category: 'fav', menuTitle: 'สินเชื่อเช่าซื้อรถ (Car Loan)', headerTitle: 'คำนวณสินเชื่อเช่าซื้อรถยนต์ & มอเตอร์ไซค์', usesSharedKeypad: false, keywords: 'car loan รถ เช่าซื้อ ผ่อนรถ รถยนต์ มอเตอร์ไซค์ ปิดบัญชีก่อนกำหนด สคบ ดอกเบี้ยคงที่ flat rate vat รถมือสอง เงินดาวน์ ค่างวด' },
    { id: 'currency',          group: 'finance', category: 'fav', menuTitle: 'แปลงสกุลเงิน', headerTitle: 'ตัวแปลงสกุลเงิน', usesSharedKeypad: true, keywords: 'currency สกุลเงิน แลกเงิน ดอลลาร์ บาท เยน ยูโร exchange rate forex' },
    { id: 'lotto_calc',        group: 'finance', category: 'fav', menuTitle: 'หวย & สลากไทย', headerTitle: 'เครื่องคำนวณหวย & สลากไทย', usesSharedKeypad: false, keywords: 'lotto หวย สลากกินแบ่งรัฐบาล สลากออมสิน สลาก n3 เลขเด็ด 6 ประตู 19 ประตู 2 ตัว 3 ตัว รางวัลที่ 1 โต๊ด ขึ้นเงินรางวัล ภาษีสลาก' },
    { id: 'legal_interest',    group: 'finance', category: 'fav', menuTitle: 'ดอกเบี้ยผิดนัด ป.พ.พ. 5%', headerTitle: 'คำนวณดอกเบี้ยผิดนัดชำระหนี้ตามกฎหมายใหม่ (ป.พ.พ. ม.7/ม.224)', usesSharedKeypad: false, keywords: 'legal interest ดอกเบี้ย ผิดนัด กฎหมาย ปพพ 224 7 ร้อยละ 5 3 ต่อปี หนี้ค้าง วันผิดนัด เบี้ยปรับ' },
    { id: 'debt_payoff',       group: 'finance', category: 'fav', menuTitle: 'แผนปลดหนี้ (Snowball/Avalanche)', headerTitle: 'แผนปลดหนี้หลายบัญชี (Debt Snowball vs Avalanche)', usesSharedKeypad: false, keywords: 'debt payoff หนี้ บัตรเครดิต ปลดหนี้ snowball avalanche หิมะถล่ม ดอกเบี้ย โปะหนี้ สินเชื่อส่วนบุคคล บัตรกดเงินสด ตารางผ่อน แผนการเงิน' },

    // หมวดหมู่ที่ 4: เวลา & สำนักงาน
    { id: 'social_security',   group: 'work', category: 'fav', menuTitle: 'ประกันสังคม & บำนาญ', headerTitle: 'คำนวณเงินสมทบ & บำนาญชราภาพ ประกันสังคม (ม.33/39/40)', usesSharedKeypad: false, keywords: 'social security ประกันสังคม บำนาญ บำเหน็จ ชราภาพ ม33 ม39 ม40 เงินสมทบ เงินออมเกษียณ สปส เกษียณอายุ 55 ปี 60 เดือนสุดท้าย' },
    { id: 'labor_severance',   group: 'work', category: 'fav', menuTitle: 'เงินชดเชยเลิกจ้าง & ค่าตกใจ', headerTitle: 'คำนวณเงินชดเชยเลิกจ้าง & สินจ้างแทนบอกกล่าวล่วงหน้า (ม.118/ม.17)', usesSharedKeypad: false, keywords: 'labor severance เลิกจ้าง ชดเชย ค่าตกใจ กฎหมายแรงงาน ม118 ม17 อายุงาน วันลาพักร้อน ว่างงาน ไล่ออก ปลดพนักงาน' },
    { id: 'ot_calc',           group: 'work', category: 'fav', menuTitle: 'ค่าล่วงเวลา OT & วันหยุด', headerTitle: 'คำนวณค่าล่วงเวลา (OT) & ค่าทำงานวันหยุด (ม.61/ม.62/ม.63)', usesSharedKeypad: false, keywords: 'ot calc ค่าล่วงเวลา โอที วันหยุด กฎหมายแรงงาน ม61 ม62 ม63 ชั่วโมงทำงาน ค่ากะ กะดึก รายชั่วโมง ค่าแรง เงินเดือน' },
    { id: 'date_work',  group: 'work', category: 'all', menuTitle: 'นับวันทำการ (Workdays)', headerTitle: 'นับวันทำการ', usesSharedKeypad: false, keywords: 'date work วันทำการ วันทำงาน sla วันหยุด ส่งงาน วันครบกำหนด' },
    { id: 'date_calc',  group: 'work', category: 'all', menuTitle: 'คำนวณวันที่ & อายุ', headerTitle: 'เครื่องคำนวณวันที่', usesSharedKeypad: false, keywords: 'date calc วันที่ บวกวัน ลบวัน คำนวณอายุ ระยะห่างวัน' },
    { id: 'world_time', group: 'work', category: 'all', menuTitle: 'เวลาโลก & นัดหมาย', headerTitle: 'นาฬิกาเวลาโลก', usesSharedKeypad: false, keywords: 'world time เวลาโลก timezone ข้ามเขตเวลา โตเกียว นิวยอร์ก ลอนดอน นัดประชุม' },
    { id: 'gpa',        group: 'work', category: 'all', menuTitle: 'เกรดเฉลี่ย (GPA)', headerTitle: 'คำนวณเกรดเฉลี่ย (GPA)', usesSharedKeypad: false, keywords: 'gpa เกรด เฉลี่ย หน่วยกิต ผลการเรียน ตัดเกรด' },

    // หมวดหมู่ที่ 5: สุขภาพ & พิเศษ
    { id: 'health',     group: 'special', category: 'all', menuTitle: 'ตัวชี้วัดร่างกาย (BMI/BMR)', headerTitle: 'คำนวณตัวชี้วัดร่างกาย (BMI/BMR)', usesSharedKeypad: true, keywords: 'health สุขภาพ bmi bmr ส่วนสูง น้ำหนัก แคลอรี่ อ้วน ผอม' },
    { id: 'ovulation',  group: 'special', category: 'all', menuTitle: 'วันตกไข่ & รอบเดือน', headerTitle: 'คำนวณวันตกไข่และรอบเดือน', usesSharedKeypad: false, keywords: 'ovulation ตกไข่ ประจำเดือน รอบเดือน ภาวะเจริญพันธุ์ มีลูก' },
    { id: 'fuel_cost',  group: 'special', category: 'all', menuTitle: 'ค่าน้ำมัน & ค่าชาร์จรถ EV', headerTitle: 'คำนวณค่าน้ำมัน & ค่าชาร์จรถไฟฟ้า EV เทียบความคุ้มค่า', usesSharedKeypad: true, keywords: 'fuel cost น้ำมัน ค่าน้ำมัน ค่าชาร์จ ev รถยนต์ไฟฟ้า ชาร์จบ้าน tou offpeak dc fast charge เทียบน้ำมัน อัตราสิ้นเปลือง กิโลเมตร ประหยัดค่าน้ำมัน ระยะทาง ทริป เที่ยว ค่าน้ำมันไปกลับ' },
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
