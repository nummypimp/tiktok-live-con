// backend/modules/viewerStats.js
const admin = require('firebase-admin'); // ⬅️ เพิ่มบรรทัดนี้
const db = require('../firebase');


// บันทึกสถิติของผู้ใช้
async function updateViewerStats(user, roomId, type, diamond = 0) {
  const ref = db.collection('liveViewers').doc(user.uniqueId);
  const snap = await ref.get();

  const baseData = {
    uniqueId: user.uniqueId,
    nickname: user.nickname || '',
    profilePicture: user.profilePictureUrl || '',
    rooms: [roomId],
    stats: {
      giftCount: 0,
      totalDiamond: 0,
      commentCount: 0,
      likeCount: 0
    }
  };

  if (!snap.exists) {
    await ref.set({
      ...baseData,
      [`stats.${type}`]: type === "totalDiamond" ? diamond : 1
    });
  } else {
    const update = {
      rooms: admin.firestore.FieldValue.arrayUnion(roomId),
      [`stats.${type}`]: admin.firestore.FieldValue.increment(
        type === "totalDiamond" ? diamond : 1
      )
    };
    await ref.update(update);
  }
}

// บันทึกลงห้องแยก (subcollection)
async function saveUserToRoom(user, roomId) {
  const roomRef = db
    .collection('rooms')
    .doc(roomId)
    .collection('viewers')
    .doc(user.uniqueId);

  const snap = await roomRef.get();
  if (!snap.exists) {
    await roomRef.set({
      uniqueId: user.uniqueId,
      nickname: user.nickname || '',
      profilePicture: user.profilePictureUrl || '',
      firstSeen: new Date().toISOString()
    });
  }
}

module.exports = {
  updateViewerStats,
  saveUserToRoom
};
