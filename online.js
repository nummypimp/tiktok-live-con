const mysql = require('mysql2/promise');
const { TikTokConnectionWrapper} = require('./TikTokConnectionWrapper');
const fs = require('fs');
const path = require('path');

// ✅ รายชื่อผู้ใช้ที่ต้องการตรวจสอบ
const usernames = ['morthak168','idurian99'];

// ✅ ตั้งค่า MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'idcom_tiktok'
};

// ✅ สร้าง connection pool
const pool = mysql.createPool(dbConfig);
let tiktokConnectionWrapper;
// ✅ ตรวจสอบทุก 5 นาที
setInterval(() => {
    usernames.forEach(username => {
        checkLiveStatus(username);
    });
}, 5 * 60 * 1000); // 5 นาที
let online = true;
// ✅ ตรวจสอบสถานะไลฟ์
async function checkLiveStatus(username) {

  
  const [rows] = await pool.query(
            'SELECT * FROM tiktok_live_log WHERE username = ? AND is_live = TRUE ORDER BY id DESC LIMIT 1',
            [username]
        );

        if (rows.length === 0) {
            // เริ่มไลฟ์ใหม่
            console.log(`${username} เริ่มไลฟ์`);
            await pool.query(
                'INSERT INTO tiktok_live_log (username, start_time, is_live) VALUES (?, NOW(), TRUE)',
                [username]
            );
        }
     try {
        
        tiktokConnectionWrapper = new TikTokConnectionWrapper(username);
      await  tiktokConnectionWrapper.connect();
console.log(tiktokConnectionWrapper)
       // connections[uniqueId] = tiktokConnectionWrapper;
        console.log('✅ เชื่อมต่อกับ TikTok LIVE');
        online = true;
       // listenTikTokEvents();
      } catch (err) {
        online = false;
        tiktokConnectionWrapper.disconnect();
        console.error('❌ เชื่อม TikTok ไม่สำเร็จ:', err);
       
      //  setTimeout(connectTikTok, 10000);
      }

      if(online){
        await pool.query(
                    'UPDATE tiktok_live_log SET start_time = NOW(), is_live = TRUE WHERE username = ?',
                    [username]
                );

      } else {
         await pool.query(
                    'UPDATE tiktok_live_log SET end_time = NOW(), is_live = FALSE WHERE username = ?',
                    [username]
                );
      }

   
   
}

// ✅ เริ่มตรวจสอบทันที (รอบแรก)
usernames.forEach(username => {
    checkLiveStatus(username);
});

console.log("📡 ระบบตรวจสอบ TikTok Live เริ่มทำงานแล้ว (MySQL)...");
