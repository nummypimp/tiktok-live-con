// backend/modules/saveUserToRoom.js
const db = require('../db');

/**
 * บันทึกผู้ชมเข้า room_viewers (ครั้งแรกเท่านั้น)
 * @param {Object} user - ข้อมูลผู้ชม
 * @param {string} roomId - ID ของห้องไลฟ์
 */
// saveUserToRoom.js
async function saveUserToRoom(conn, user, roomId) {
  await conn.query(`
    INSERT IGNORE INTO room_viewers (roomId, uniqueId, firstSeen)
    VALUES (?, ?, ?)
  `, [roomId, user.uniqueId, new Date()]);
}


module.exports = saveUserToRoom;