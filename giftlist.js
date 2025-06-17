const fs = require('fs');

// อ่านไฟล์ JSON
const rawData = fs.readFileSync('data.connection.json', 'utf8');
const data = JSON.parse(rawData);

// ตรวจสอบว่า availableGifts มีอยู่
if (!data?.availableGifts || !Array.isArray(data.availableGifts)) {
  console.error('ไม่พบ availableGifts ในไฟล์ data.connection.json');
  process.exit(1);
}

// แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
const formattedGifts = data.availableGifts.map(gift => ({
  id: gift.id,
  name: gift.name,
  diamond: gift.diamond_count,
  icon: gift.icon?.url_list?.[0] || null,
  image: gift.image?.url_list?.[0] || null
}));

// บันทึกเป็นไฟล์ gifts.json
fs.writeFileSync('gifts.json', JSON.stringify(formattedGifts, null, 2), 'utf8');

console.log('✅ แปลงและบันทึกไฟล์ gifts.json สำเร็จแล้ว!');