// backend/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',     // เปลี่ยนเป็น IP หรือ host ของจริงเมื่อ deploy
  user: 'idcom_tiktok2',           // หรือ user ที่คุณสร้างไว้
  password: 'Pppppp999',           // ใส่รหัสผ่านของ MySQL
  database: 'idcom_tiktok2',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
