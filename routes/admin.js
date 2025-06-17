const express = require('express');
const router = express.Router();
const PlayerManager = require('../modules/playerManager');
const playerManager = new PlayerManager();

// เริ่มลงทะเบียน
router.post('/start-register', (req, res) => {
  playerManager.startRegister();
  res.json({ status: 'register started' });
});

// หยุดลงทะเบียน
router.post('/stop-register', (req, res) => {
  playerManager.stopRegister();
  res.json({ status: 'register stopped' });
});

// เริ่มเกม
router.post('/start-game', (req, res) => {
  playerManager.startGame();
  res.json({ status: 'game started' });
});

// รีเซ็ตเกม
router.post('/reset-game', (req, res) => {
  playerManager.resetGame();
  res.json({ status: 'game reset' });
});

module.exports = router;
