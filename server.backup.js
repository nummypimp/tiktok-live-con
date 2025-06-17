
const express = require('express');
const http = require('http');
const cors = require('cors');
const {
  Server
} = require('socket.io');
const {
  TikTokConnectionWrapper,
  getGlobalConnectionCount
} = require('./connectionWrapper');
const OBSWebSocket = require('obs-websocket-js').default;
const path = require('path');
const app = express();
const {
  getTiktokUserData
} = require('./tiktokUseFetcher');
const {
  OpenAI
} = require('openai');
const db = require('./firebase');
const axios = require('axios');
const log = require('./logger');

app.use(cors());
app.use(express.json());


console.log = log;
console.log('เริ่มระบบแล้ว');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const connections = {};


let tiktokConnectionWrapper;
//let uniqueId = 'dnkfitbody_';
let options = {};
const openai = new OpenAI({
  apiKey: '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'
});


async function fetchTiktokUserData(uniqueId) {
  try {
    var userData2 = await getTiktokUserData(uniqueId);

    return userData2;
  } catch (err) {
    console.error('Error:', err);
    throw err; // สามารถเลือกใส่หรือไม่ใส่ก็ได้ ขึ้นอยู่กับการจัดการ error ต่อไป
  }
}

async function askChatGPT(message) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{
          role: 'system',
          content: 'คุณเป็นผู้ช่วย TikTok Live Studio'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 200
    }, {
      headers: {
        'Authorization': `Bearer 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`
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
    listenTikTokEvents();
  } catch (err) {
    console.error('❌ เชื่อม TikTok ไม่สำเร็จ:', err);
    setTimeout(connectTikTok, 10000);
  }
}
//connectTikTok(uniqueId);



const obs = new OBSWebSocket();

async function connectOBS() {
  try {
    await obs.connect('ws://localhost:4455');
    console.log('✅ เชื่อมต่อ OBS สำเร็จ');
  } catch (err) {
    //console.error('❌ OBS connect error:', "no connect");
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

function safeGetAvatar(data) {
  // ป้องกัน profilePicture หรือ urls ว่าง
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

function listenTikTokEvents() {
  if (!tiktokConnectionWrapper || !tiktokConnectionWrapper.connection) return;
  tiktokConnectionWrapper.connection.on('like', data => {
    if (!data.user || !data.user.uniqueId) return;
    updateUser(data.user.uniqueId, 'like', data.likeCount, data);
    if (registeredUsers[data.user.uniqueId]) {
      //  registeredUsers[data.user.uniqueId]['like'] += data.likeCount;
    }
  });
  tiktokConnectionWrapper.connection.on('share', data => {
    console.log('SHARE:', data);
    if (!data.user || !data.user.uniqueId) return;
    updateUser(data.user.uniqueId, 'share', 1, data);
  });
  tiktokConnectionWrapper.connection.on('social', data => {
    console.log('SHARE:', data);
    if (!data.user || !data.user.uniqueId) return;
    updateUser(data.user.uniqueId, 'share', 1, data);
  });
  tiktokConnectionWrapper.connection.on('gift', data => {
    if (!data.user || !data.user.uniqueId) return;
    var totalValue = 0;
    if (!(data.giftType === 1 && !data.repeatEnd)) {
     totalValue = (data.giftDetails?.diamondCount || 0) * (data.repeatCount || 1);
     }
    updateUser(data.user.uniqueId, 'gift', totalValue, data);
  });
  tiktokConnectionWrapper.connection.on('chat', async data => {
    io.emit("chat-message", data);

    if (!data.user || !data.user.uniqueId) return;
    updateUser(data.user.uniqueId, 'chat', 1, data);
    handleChat(data);
    const question = data.comment;
    const userId = data.user.uniqueId;
    console.log('question:', question);
    //await askChatGPT(question, userId);
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

  // checkRegistration(id, data);
}

setInterval(() => {
  checkRegistrationStats(registeredUsers);
}, 10000); // เรียกทุก 10 วิ

function checkRegistrationStats(registeredUsers) {
  console.log('ยอดไลก์รวมแต่ละคน:');
  Object.values(registeredUsers).forEach(user => {
    // console.log(`${user.nickname} (${user.uniqueId}) - กด ${user.like} ครั้ง รวม ${user.likesum} ไลก์`);
  });

  Object.keys(registeredUsers).forEach(id => {
    //delete registeredUsers[id];

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

function checkRegistration(id, data) {
  if (!allowRegister || registeredUsers[id].registered) return;
  const u = registeredUsers[id];
  if (u.like >= 20 || u.share >= 30 || u.gift >= 30) {
    u.registered = true;
    u.gift = 0;
    u.round1Passed = false;
    io.emit('user-registered', {
      id,
      nickname: data.user.nickname,
      avatar: safeGetAvatar(data)
    });
  }
}

function handleChat(data) {
  const id = data.user.uniqueId;
  const msg = data.comment.trim();
  if (!registeredUsers[id]) return;
  if (registeredUsers[id].registered && !registeredUsers[id].round1Passed) {
    const emojiCount = (msg.match(/\p{Emoji}/gu) || []).length;
    if (emojiCount >= 1) registeredUsers[id].emoji += 1;
    if (registeredUsers[id].emoji >= 1 || registeredUsers[id].gift >= 30) {
      registeredUsers[id].round1Passed = true;
      registeredUsers[id].gift = 0;
      round1Passed[id] = {
        id,
        nickname: data.user.nickname,
        avatar: safeGetAvatar(data),
        emoji: registeredUsers[id].emoji
      };
      io.emit('round1-winner', round1Passed[id]);
    }
  }
  if (currentRound === 2 && round1Passed[id]) {
    if (/ซ้าย|กลาง|ขวา/.test(msg)) {
      round2Choice[id] = msg;
    }
  }
}

// REST API สำหรับ Admin
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
  const {
    uniqueId
  } = req.body;
  connectTikTok(uniqueId);
  res.json({
    ok: true
  });
});
app.post('/api/disconnect', (req, res) => {
  const {
    uniqueId
  } = req.body;
  disconnectUser(uniqueId);
  res.json({
    ok: true
  });
});
app.get('/api/status', (req, res) => {
  res.json(getStatus());
});

app.post('/tiktok-helper', async (req, res) => {
  const {
    question,
    userId
  } = req.body;
  await handleQuestion({
    question,
    userId,
    socket: null
  });
  res.json({
    status: 'processing'
  });
});


app.get('/tiktok-user', async (req, res) => {
  const {
    u
  } = req.query;
  try {
    const userData = await fetchTiktokUserData(u);
    res.json(userData);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch user data'
    });
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // เมื่อมีการ emit "chat-message" เข้ามา (จาก admin หรือผู้ชม)
  socket.on('user-profile', async (data) => {
    console.log("user-profile", data);
    try {
      const userData = await fetchTiktokUserData(data.uniqueId);
      console.log(userData);
      io.emit('user-profile', userData);
    } catch (err) {
      console.error('Error:', err);
    }
  });
});




// Serve frontend build
app.use(express.static(path.join(__dirname, './tiktok-live-game/build')));
app.get(/^\/(?!admin).*/, (req, res) => {
  res.sendFile(path.join(__dirname, './tiktok-live-game/build/index.html'));
});
server.listen(process.env.PORT || 3000, () => console.log('Server started at http://localhost:3000'));