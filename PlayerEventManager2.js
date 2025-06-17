class PlayerEventManager {
  constructor(io) {
    this.users = {};
    this.io = io;
  }

  // ... โค้ดอื่นๆ เช่น _getUser, addLike, addShare, addGift, addChat, calcChance, resetAll

  // สร้าง pool ที่ 1 user ปรากฏ n ครั้ง (n = chance)
  makeDrawPool() {
    const pool = [];
    Object.entries(this.users).forEach(([uniqueId, stats]) => {
      const n = this.calcChance(stats);
      for (let i = 0; i < n; i++) {
        pool.push({
          uniqueId,
          ...stats.profile,
          chance: n,
        });
      }
    });
    return pool;
  }

  // broadcast pool ได้ (optional)
  emitDrawPool() {
    const pool = this.makeDrawPool();
    this.io.emit("draw-pool", pool);
  }

  // เพิ่มใน emitPlayerList ก็ได้ (broadcast player-list + draw-pool)
  emitPlayerList() {
    const list = Object.entries(this.users)
      .map(([uniqueId, stats]) => ({
        uniqueId,
        ...stats.profile,
        chance: this.calcChance(stats),
      }))
      .filter(u => u.chance > 0);

    // ส่ง pool ไปด้วย (ถ้าต้องการ)
    const pool = this.makeDrawPool();
    this.io.emit("player-list", { list, pool });
  }

  // ... (method addLike/addShare/addGift/addChat) ต้องเรียก emitPlayerList หรือ emitDrawPool ด้วย
  addLike(uniqueId, profile) {
    const user = this._getUser(uniqueId);
    user.likeCount++;
    if (profile) user.profile = profile;
    this.emitPlayerList();
  }
  // ... addShare, addGift, addChat เหมือนกัน
  addShare(uniqueId, profile) {
    const user = this._getUser(uniqueId);
    user.shareCount++;
    if (profile) user.profile = profile;
    this.emitPlayerList();
  }

  addGift(uniqueId, value, profile) {
    const user = this._getUser(uniqueId);
    user.giftValue += value;
    if (profile) user.profile = profile;
    this.emitPlayerList();
  }

  addChat(uniqueId, text, profile) {
    const user = this._getUser(uniqueId);
    user.chatHistory.push({ text });
    if (profile) user.profile = profile;
    this.emitPlayerList();
  }

  // ... อื่นๆ เหมือนเดิม ...
  calcChance(stats) {
    // ... โค้ดเดิม ...
    let chance = 0;
    if (stats.likeCount) chance += Math.floor(stats.likeCount / 100);
    if (stats.shareCount) chance += Math.floor(stats.shareCount / 5);
    if (stats.giftValue) chance += Math.floor(stats.giftValue);
    if (Array.isArray(stats.chatHistory)) {
      stats.chatHistory.forEach(chat => {
        const txt = String(chat.text || "");
        const emojiArr = [...txt].filter(c => /\p{Extended_Pictographic}/u.test(c));
        if (emojiArr.length >= 3) {
          chance += 1;
        } else {
          const words = txt.trim().split(/\s+/);
          if (words.length >= 4) chance += 1;
        }
      });
    }
    return chance;
  }

  resetAll() {
    this.users = {};
    this.emitPlayerList();
  }
}
