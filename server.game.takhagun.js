
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let isGame3Active = false;
let game3score = {};
let lastTagged = '';

io.on('connection', (socket) => { 


  console.log('Client connected');
  socket.on('admin-start-game3', () => {
    isGameActive = true;
    console.log('✅ เกมเริ่มแล้ว');
  });
  socket.on('admin-reset-game3', () => {
    isGameActive = false;
    scores = {};
    lastTagged = '';
    io.emit('score-list', []);
    console.log('♻️ รีเซ็ตคะแนนแล้ว');
  });

   socket.on('chat-message', (data) => {
    
  });

});




  setInterval(() => {
     broadcastScoreList(io);
});

function broadcastScoreList(io) {
  if (!isGame3Active) return;

  const sorted = Object.entries(game3score)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([uniqueId, data]) => ({ uniqueId, ...data }));

  io.emit('score-list', sorted);
}

 function handlegame3score(id, data) {
  if (!game3score) return;
 
  const match = data.comment.match(/@(\w+)\s+สวัสดี/i);

  if (match) {
    const taggedUser = match[1];
    if (taggedUser !== lastTagged) {
      lastTagged = taggedUser;
      if (!game3score[id]) {
        game3score[id] = {
           uniqueId: id,
          nickname: data.user.nickname,
          avatar: safeGetAvatar(data),
          score: 0,
        };
      }
      game3score[id].score += 1;
    }
  }
}
server.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
