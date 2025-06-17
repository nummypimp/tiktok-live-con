const fs = require("fs");
const path = require("path");

const configPath = path.resolve(__dirname, "./register-config.json");

class PlayerRegisterManager {
  constructor(io) {
    this.io = io;
    this.acceptingPlayers = false;
    this.players = [];
    this.timer = null;
    this.config = { acceptTime: 20 };

    // โหลด config ครั้งแรก
    if (fs.existsSync(configPath)) {
      try { this.config = JSON.parse(fs.readFileSync(configPath, "utf8")); } catch {}
    }
  }

  saveConfig() {
    fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
  }

  handleOpen(payload) {
    this.acceptingPlayers = true;
    this.players = [];
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
    this.players = [];
    if (this.timer) clearTimeout(this.timer);
    this.io.emit("reset-game");
    this.io.emit("register-status", { accepting: false });
  }

  handleAddPlayer(player) {
    if (
      this.acceptingPlayers &&
      !this.players.some(p => p.uniqueId === player.uniqueId)
    ) {
      this.players.push(player);
      this.io.emit("player-list", player);
    }
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
}

module.exports = PlayerRegisterManager;