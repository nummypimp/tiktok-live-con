const db = require('../db');

/**
 * บันทึกผู้ชมว่าเคยเข้าห้องนี้แล้ว
 * @param {object} conn - MySQL connection
 * @param {object} user - ข้อมูลผู้ใช้ { uniqueId, nickname, profilePictureUrl }
 * @param {string} roomId - รหัสห้อง
 */
async function saveUserToRoom(conn, user, roomId) {
  await conn.query(`
    INSERT IGNORE INTO room_viewers (roomId, uniqueId, firstSeen)
    VALUES (?, ?, ?)
  `, [roomId, user.uniqueId, new Date()]);
}

/**
 * อัปเดตสถิติผู้ชมในตาราง viewers และผูกกับห้องใน room_viewers
 * @param {object} user - ข้อมูลผู้ชม
 * @param {string} roomId - ห้องไลฟ์
 * @param {string} type - ประเภทสถิติ ('giftCount', 'totalDiamond', 'commentCount', 'likeCount')
 * @param {number} diamond - เพชร (ใช้เฉพาะเมื่อ type === 'totalDiamond')
 */
async function updateViewerStats(user, roomId, type, diamond = 0) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // เช็คว่ามี user นี้อยู่หรือยัง
    const [rows] = await conn.query('SELECT * FROM viewers WHERE uniqueId = ?', [user.uniqueId]);

    if (rows.length === 0) {
      const stats = {
        giftCount: 0,
        totalDiamond: 0,
        commentCount: 0,
        likeCount: 0
      };

      if (type === 'totalDiamond') stats.totalDiamond = diamond;
      else stats[type] = 1;

      await conn.query(`
        INSERT INTO viewers (uniqueId, nickname, profilePicture, giftCount, totalDiamond, commentCount, likeCount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        user.uniqueId,
        user.nickname || '',
        user.profilePictureUrl || '',
        stats.giftCount,
        stats.totalDiamond,
        stats.commentCount,
        stats.likeCount
      ]);
    } else {
      const field = type === 'totalDiamond' ? 'totalDiamond' : type;
      const value = type === 'totalDiamond' ? diamond : 1;

      await conn.query(`
        UPDATE viewers SET ${field} = ${field} + ? WHERE uniqueId = ?
      `, [value, user.uniqueId]);
    }

    // ผูก user เข้ากับห้อง
    await saveUserToRoom(conn, user, roomId);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error('❌ updateViewerStats error:', err);
  } finally {
    conn.release();
  }
}

module.exports = {
  updateViewerStats
};
