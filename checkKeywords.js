let KEYWORDS = [
  "ราคา",
  "ไซส์",
  "stock",
  "สต๊อก",
  "สินค้า",
  "product"
];

function shouldFilterMessage(text) {
  if (!text || text.trim() === "") {
    console.log("ข้อความว่าง");
    return true;
  }

  const lowerText = text.toLowerCase();
  console.log("ตรวจข้อความ:", lowerText);

  const greetings = ["สวัสดี", "hello", "hi", "ดีค่ะ", "ดีครับ", "หวัดดี"];
  if (greetings.some(greet => lowerText.includes(greet))) {
    console.log("เป็นคำทักทาย");
    return true;
  }


  // 👇 ลองตัด regex ตัวนี้ออกก่อน
  /*
  if (/^[\uD800-\uDBFF][\uDC00-\uDFFF]$/.test(text) || /^[^\w\s]+$/.test(text)) {
    console.log("เป็น emoji หรือ symbol");
    return true;
  }
  */

  // 👇 แทนที่ด้วย เช็ค emoji สั้น ๆ
  // (ถ้าอยากเช็ค emoji จริงๆ ควรใช้ emoji regex หรือ emoji-detection library)
  if (/^[\p{Emoji}\p{P}\p{S}]+$/u.test(text)) {
    console.log("เป็น emoji ล้วนหรือ symbol");
    return true;
  }

  if (text.length === 1 && /\p{Emoji}/u.test(text)) {
  console.log("เป็น emoji ตัวเดียว");
  return true;
}

  if (/^@[\wก-๙]+$/.test(text)) {
    console.log("เป็น mention");
    return true;
  }

  if (KEYWORDS.some(keyword => lowerText.includes(keyword))) {
    console.log("พบ keyword ในข้อความ:", lowerText);
    return false;
  }

  console.log("ไม่พบ keyword ที่ต้องตอบ");
  return true;
}

let comment = "ราคาเท่าไหร่คะ";
let ans =  shouldFilterMessage(comment);
console.log("ผลลัพธ์สุดท้าย:", ans);