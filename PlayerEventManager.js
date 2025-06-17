const fs = require("fs");
const path = require("path");
const configPath = path.resolve(__dirname, "./register-config.json");

class PlayerGameManager {
  constructor(io) {
    this.io = io;

    // REGISTER CONTROL
    this.acceptingPlayers = false;
    this.timer = null;
    this.config = { acceptTime: 20 };
    if (fs.existsSync(configPath)) {
      try { this.config = JSON.parse(fs.readFileSync(configPath, "utf8")); } catch {}
    }

    // PLAYER STATS & CHANCE
    this.users = {}; // { uniqueId: { likeCount, shareCount, giftValue, chatHistory, profile } }
  }

  // --- CONFIG REGISTER ADMIN ---
  saveConfig() {
    fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
  }
  handleOpen(payload) {
    this.acceptingPlayers = true;
    this.users = {}; // reset users ทุกครั้งที่เปิดใหม่
    this.io.emit("register-status", { accepting: true });
    if (this.timer) clearTimeout(this.timer);

    const time = (payload && payload.acceptTime) || this.config.acceptTime || 20;
    this.timer = setTimeout(() => this.handleClose(), time * 1000);
  }
  handleClose() {
    this.acceptingPlayers = false;
    if (this.timer) clearTimeout(this.timer);
    this.io.emit("register-status", { accepting: false });
  }
  handleReset() {
    this.acceptingPlayers = false;
    this.users = {};
    if (this.timer) clearTimeout(this.timer);
    this.io.emit("reset-game");
    this.io.emit("register-status", { accepting: false });
    this.emitPlayerList();
  }
  handleSaveConfig(cfg) {
    if (cfg && typeof cfg.acceptTime === "number") {
      this.config.acceptTime = cfg.acceptTime;
      this.saveConfig();
      this.io.emit("register-config", this.config);
    }
  }
  handleGetConfig(socket) {
    socket.emit("register-config", this.config);
  }

  // --- PLAYER EVENT LOGIC ---
  _getUser(uniqueId) {
    if (!this.users[uniqueId]) {
      this.users[uniqueId] = {
        likeCount: 0,
        shareCount: 0,
        giftValue: 0,
        chatHistory: [],
        profile: {},
      };
    }
    return this.users[uniqueId];
  }

  addLike(uniqueId, profile) {
    if (!this.acceptingPlayers) return;
    const user = this._getUser(uniqueId);
    user.likeCount++;
    if (profile) user.profile = profile;
    this.emitPlayerList();
  }
  addShare(uniqueId, profile) {
    if (!this.acceptingPlayers) return;
    const user = this._getUser(uniqueId);
    user.shareCount++;
    if (profile) user.profile = profile;
    this.emitPlayerList();
  }
  addGift(uniqueId, value, profile) {
    if (!this.acceptingPlayers) return;
    const user = this._getUser(uniqueId);
    user.giftValue += value;
    if (profile) user.profile = profile;
    this.emitPlayerList();
  }
  addChat(uniqueId, text, profile) {
    if (!this.acceptingPlayers) return;
    const user = this._getUser(uniqueId);
    user.chatHistory.push({ text });
    if (profile) user.profile = profile;
    this.emitPlayerList();
  }

  calcChance(stats) {
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

  emitPlayerList() {
    const list = Object.entries(this.users)
      .map(([uniqueId, stats]) => ({
        uniqueId,
        ...stats.profile,
        likeCount: stats.likeCount,
        shareCount: stats.shareCount,
        giftValue: stats.giftValue,
        chance: this.calcChance(stats),
      }))
      .filter(u => u.chance > 0);

    const totalPlayers = list.length;
    const totalChance = list.reduce((sum, u) => sum + u.chance, 0);
    const pool = this.makeDrawPool();

    this.io.emit("player-list", { list, pool, totalPlayers, totalChance });
  }
}

module.exports = PlayerGameManager;
