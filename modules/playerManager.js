class PlayerManager {
  constructor(io) {
    this.io = io;
    this.registeredUsers = {};
    this.allowRegister = false;
    this.currentRound = 0;
  }

  startRegister() {
    this.allowRegister = true;
    this.registeredUsers = {};
    this.io.emit('register-start');
  }

  stopRegister() {
    this.allowRegister = false;
    this.io.emit('register-end', this.registeredUsers);
  }

  startGame() {
    this.currentRound = 1;
    this.io.emit('game-start');
  }

  resetGame() {
    this.registeredUsers = {};
    this.currentRound = 0;
    this.io.emit('game-reset');
  }
}

module.exports = PlayerManager;
