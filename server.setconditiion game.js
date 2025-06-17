const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let scores = {};
let lastTagged = '';
let isGameActive = false;

function handleScoreUpdate(data) {
  if (!isGameActive) return;

  const { uniqueId, nickname, comment, profilePictureUrl } = data;
  const match = comment.match(/@(\w+)\s+สวัสดี/i);
  if (match) {
    const taggedUser = match[1];
    if (taggedUser !== lastTagged) {
      lastTagged = taggedUser;
      if (!scores[uniqueId]) {
        scores[uniqueId] = {
          nickname,
          avatar: profilePictureUrl,
          score: 0,
        };
      }
      scores[uniqueId].score += 1;
    }
  }
}

function broadcastScoreList(io) {
  if (!isGameActive) return;

  const sorted = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([uniqueId, data]) => ({ uniqueId, ...data }));

  io.emit('score-list', sorted);
}

io.on('connection', (socket) => {
  console.log("🔌 Client connected");

  socket.on('chat-message', handleScoreUpdate);

  socket.on('admin-start-game', () => {
    isGameActive = true;
    console.log("🟢 Game started");
  });

  socket.on('admin-reset-game', () => {
    scores = {};
    lastTagged = '';
    isGameActive = false;
    io.emit('score-list', []);
    console.log("🔄 Game reset");
  });

  setInterval(() => {
    broadcastScoreList(io);
  }, 5000);
});

server.listen(3001, () => {
  console.log("🚀 Server running on port 3001");
});