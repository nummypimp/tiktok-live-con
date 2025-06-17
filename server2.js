require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');
const OBSWebSocket = require('obs-websocket-js').default;
const path = require('path');
const app = express();
const { getTiktokUserData } = require('./tiktokUseFetcher');
const { OpenAI } = require('openai');
const db = require('./firebase');
const axios = require('axios');
const log = require('./logger');
const fs = require('fs');

app.use(cors());
app.use(express.json());

console.log = log;
console.log('เริ่มระบบแล้ว');

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const connections = {};
let matchMode = "any";
let commentRules = [];
try {
  const raw = fs.readFileSync('./comment-rules.json');
  const config = JSON.parse(raw);
  commentRules = config.rules || [];
  matchMode = config.matchMode || "any";
} catch {
  commentRules = [];
  matchMode = "any";
}

let tiktokConnectionWrapper;
let options = {};
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function fetchTiktokUserData(uniqueId) {
  try {
    var userData2 = await getTiktokUserData(uniqueId);
    return userData2;
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}

async function askChatGPT(message) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'คุณเป็นผู้ช่วย TikTok Live Studio' },
        { role: 'user', content: message }
      ],
      max_tokens: 200
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    }
  );
  console.log(response.data.choices[0].message.content);
  return response.data.choices[0].message.content;
}

function connectTikTok(uniqueId) {
  if (connections[uniqueId]) return;
  try {
    tiktokConnectionWrapper = new TikTokConnectionWrapper(uniqueId, options, true);
    tiktokConnectionWrapper.connect();
    connections[uniqueId] = tiktokConnectionWrapper;
    console.log('✅ เชื่อมต่อกับ TikTok LIVE');
    // listenTikTokEvents(); // ไม่ต้องเรียกตรงนี้ ให้ไปเซตทีเดียวใน server!
  } catch (err) {
    console.error('❌ เชื่อม TikTok ไม่สำเร็จ:', err);
    setTimeout(() => connectTikTok(uniqueId), 10000);
  }
}

const obs = new OBSWebSocket();
async function connectOBS() {
  try {
    await obs.connect('ws://localhost:4455');
    console.log('✅ เชื่อมต่อ OBS สำเร็จ');
  } catch (err) {
    setTimeout(connectOBS, 25000);
  }
}
connectOBS();

let registeredUsers = {};
let round1Passed = {};
let round2Choice = {};
let currentRound = 0;
let game2Round = 0;
let allowRegister = true;

let isGame3Active = true;
let game3score = {};
let lastTagged = '';
let chatHistory = [];


function safeGetAvatar(data) {
  if (
    data &&
    data.user &&
    data.user.profilePicture &&
    Array.isArray(data.user.profilePicture.urls) &&
    data.user.profilePicture.urls.length > 0
  ) {
    return data.user.profilePicture.urls[0];
  }
  return '/avatar-default.webp';
}

function listenTikTokEvents(io) {
  if (!tiktokConnectionWrapper || !tiktokConnectionWrapper.connection) return;
  tiktokConnectionWrapper.connection.on('like', data => {
    if (!data.user || !data.user.uniqueId) return;
   // updateUser(data.user.uniqueId, 'like', data.likeCount, data);
  });
  tiktokConnectionWrapper.connection.on('share', data => {
    if (!data.user || !data.user.uniqueId) return;
   // updateUser(data.user.uniqueId, 'share', 1, data);
  });
  tiktokConnectionWrapper.connection.on('social', data => {
    if (!data.user || !data.user.uniqueId) return;
  //  updateUser(data.user.uniqueId, 'share', 1, data);
  });
  tiktokConnectionWrapper.connection.on('gift', data => {
    if (!data.user || !data.user.uniqueId) return;
    var totalValue = 0;
    if (!(data.giftType === 1 && !data.repeatEnd)) {
     totalValue = (data.giftDetails?.diamondCount || 0) * (data.repeatCount || 1);
    }
 //   updateUser(data.user.uniqueId, 'gift', totalValue, data);
  });
  tiktokConnectionWrapper.connection.on('chat', async data => {
    chatHistory.push(data);
    if (chatHistory.length > 100) chatHistory = chatHistory.slice(-100); // limit 100
    io.emit("chat-message", data);
    handlegame3score(data.user.uniqueId, data);
  });
}

function updateUser(id, type, count, data) {
  if (!id) return;
  if (!registeredUsers[id]) registeredUsers[id] = {
    uniqueId: id,
    nickname: data.user.nickname,
    avatar: safeGetAvatar(data),
    like: 0,
    likesum: 0,
    share: 0,
    gift: 0,
    emoji: 0,
    registered: false,
    chat: 0
  };
  registeredUsers[id][type] += count;
  if (type === 'like') {
    registeredUsers[id].likesum += count;
  }
}

function checkRegistrationStats(registeredUsers) {
  Object.keys(registeredUsers).forEach(id => {
    if (!allowRegister || registeredUsers[id].registered) return;
    const u = registeredUsers[id];
    if (u.like >= 20 || u.share >= 30 || u.gift >= 30) {
      u.registered = true;
      u.gift = 0;
      u.round1Passed = false;
      io.emit('user-registered', {
        id,
        nickname: u.nickname,
        avatar: u.avatar,
        like: u.like
      });
    }
  });
}

function disconnectUser(uniqueId) {
  if (connections[uniqueId]) {
    connections[uniqueId].disconnect();
    delete connections[uniqueId];
    io.emit('status', getStatus());
  }
}

function getStatus() {
  return Object.entries(connections).map(([id, w]) => ({
    uniqueId: id,
    status: w.connection && w.connection.state === "OPEN" ? 'connected' : 'connected',
  }));
}

function handlegame3score(id, data) {
  if (!isGame3Active) return;
  const match = isCommentValid(data.comment)
  if (match) {
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

function broadcastScoreList(io) {
  if (!isGame3Active) return;
  const sorted = Object.entries(game3score)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([uniqueId, data]) => ({ uniqueId, ...data }));
  io.emit('score-list', sorted);
}

function isCommentValid(comment) {
  let passed = 0;
  for (const rule of commentRules) {
    switch (rule.type) {
      case "mention_greeting":
        if (/@\w+\s+สวัสดี/.test(comment)) passed++;
        break;
      case "emoji_count":
        const emojis = [...comment].filter(c => /\p{Extended_Pictographic}/u.test(c));
        if (emojis.length >= (rule.min || 1)) passed++;
        break;
      case "contains_word":
        if (comment.includes(rule.word) && comment.length >= (rule.minLength || 0)) passed++;
        break;
    }
  }
  return matchMode === "any" ? passed > 0 : passed === commentRules.length;
}


// ========== ROUTES ==========
// ... (เหมือนเดิม)

app.post('/admin/start-register', (req, res) => {
  allowRegister = true;
  registeredUsers = {};
  round1Passed = {};
  round2Choice = {};
  currentRound = 0;
  game2Round = 0;
  io.emit('register-start');
  io.emit('reset-winners');
  res.sendStatus(200);
});
app.post('/admin/stop-register', (req, res) => {
  allowRegister = false;
  io.emit('register-end', Object.keys(registeredUsers).filter(id => registeredUsers[id].registered));
  res.sendStatus(200);
});
app.post('/admin/start-game-1', (req, res) => {
  currentRound = 1;
  round1Passed = {};
  io.emit('game-1-start');
  res.sendStatus(200);
});
app.post('/admin/start-game-2', (req, res) => {
  currentRound = 2;
  round2Choice = {};
  game2Round = 0;
  io.emit('game-2-start');
  res.sendStatus(200);
});
app.post('/admin/start-game-3', (req, res) => {
  isGame3Active = true;
  game3score = {};  
  lastTagged = '';
  io.emit('game-3-start');
  res.sendStatus(200);
});
app.post('/admin/finish-game-2-round', (req, res) => {
  game2Round++;
  const doors = ['ซ้าย', 'กลาง', 'ขวา'];
  const eliminated = doors[Math.floor(Math.random() * 3)];
  const survivors = Object.keys(round2Choice).filter(id => round2Choice[id] !== eliminated);
  round1Passed = Object.fromEntries(Object.entries(round1Passed).filter(([id]) => survivors.includes(id)));
  io.emit('game-2-result', {
    round: game2Round,
    eliminated,
    survivors
  });
  if (game2Round >= 3) {
    io.emit('game-2-finish', Object.values(round1Passed));
    currentRound = 0;
  }
  res.sendStatus(200);
});
app.post('/admin/save-rules', (req, res) => {
  commentRules = req.body.rules || [];
  matchMode = req.body.matchMode || "any";
  fs.writeFileSync('./comment-rules.json', JSON.stringify({ rules: commentRules, matchMode }, null, 2));
  res.sendStatus(200);
});
app.post('/admin/reset-game-3', (req, res) => {
  isGame3Active = false;
  game3score = {};  
  lastTagged = '';
  io.emit('game-3-reset');
  res.sendStatus(200);
});
app.post('/admin/reset-game', (req, res) => {
  registeredUsers = {};
  round1Passed = {};
  round2Choice = {};
  currentRound = 0;
  game2Round = 0;
  io.emit('game-reset');
  io.emit('reset-winners');
  res.sendStatus(200);
});
app.post('/api/connect', (req, res) => {
  const { uniqueId } = req.body;
  connectTikTok(uniqueId);
  res.json({ ok: true });
});
app.post('/api/disconnect', (req, res) => {
  const { uniqueId } = req.body;
  disconnectUser(uniqueId);
  res.json({ ok: true });
});
app.get('/api/status', (req, res) => {
  res.json(getStatus());
});
app.get('/admin/get-rules', (req, res) => {
  res.json({ rules: commentRules, matchMode });
});
app.get('/api/chat', (req, res) => {
  res.json(chatHistory);
});
app.get('/tiktok-user', async (req, res) => {
  const { u } = req.query;
  try {
    const userData = await fetchTiktokUserData(u);
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// ========== SOCKET.IO EVENTS ==========

let intervalsStarted = false;
let tiktokEventsStarted = false;

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Event สำหรับคลิก user profile
  socket.on('user-profile', async (data) => {
    console.log("user-profile", data);
    try {
      const userData = await fetchTiktokUserData(data.uniqueId);
      io.emit('user-profile', userData);
    } catch (err) {
      console.error('Error:', err);
    }
  });

  // เริ่ม event TikTok และ Interval เพียงครั้งเดียว
  if (!intervalsStarted) {
    setInterval(() => {
      checkRegistrationStats(registeredUsers);
    }, 10000);
    setInterval(() => {
      broadcastScoreList(io);
    }, 5000);
    intervalsStarted = true;
  }
  if (!tiktokEventsStarted && tiktokConnectionWrapper) {
    listenTikTokEvents(io);
    tiktokEventsStarted = true;
  }
});

// Serve frontend build
app.use(express.static(path.join(__dirname, './tiktok-live-game/build')));
app.get(/^\/(?!admin).*/, (req, res) => {
  res.sendFile(path.join(__dirname, './tiktok-live-game/build/index.html'));
});

server.listen(process.env.PORT || 3000, () => console.log('Server started at http://localhost:3000'));
