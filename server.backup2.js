require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const {
  Server
} = require('socket.io');
const { TikTokConnectionWrapper} = require('./TikTokConnectionWrapper');
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
const fs = require('fs');
const PlayerEventManager = require("./PlayerEventManager");
const adb = require('adbkit');


app.use(cors());
app.use(express.json());

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");


console.log = log;
console.log('เริ่มระบบแล้ว');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const eventMgr = new PlayerEventManager(io);
const connections = {};
let matchMode = "any";

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
//let uniqueId = 'dnkfitbody_';
let options = {
    sessionId: '74e284c2c5f10b2497223eafce414429' // Replace this with the Session ID of your TikTok account
};
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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


const OPENAI_API_KEY = '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';
const assistantId = 'asst_MJlmk6iRWEGRoWtcE4rZEtYo';  // ตัวอย่าง Assistant ID

async function askChatGPT(message, assistantId) {
  try {
    //console.log("Starting Assistant call...");

    const HEADERS = {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2'
    };

    // STEP 1: Create Thread
    const threadResponse = await axios.post(
      'https://api.openai.com/v1/threads',
      {},
      { headers: HEADERS }
    );
    const threadId = threadResponse.data.id;
    //console.log("Thread created:", threadId);

    // STEP 2: Post Message
    const msgResponse = await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      { role: 'user', content: message },
      { headers: HEADERS }
    );
    //console.log("Message posted:", msgResponse.data);

    // STEP 3: Run Assistant
    const runResponse = await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      { assistant_id: assistantId },
      { headers: HEADERS }
    );
    //console.log("Run started:", runResponse.data);
    const runId = runResponse.data.id;

    // STEP 4: Poll Run status
    let status = 'in_progress';
    let answer = '';
    while (status === 'in_progress' || status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const runStatusResponse = await axios.get(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        { headers: HEADERS }
      );
      status = runStatusResponse.data.status;
      //console.log("Run status:", status);
    }

    // STEP 5: Get Messages
    const messagesResponse = await axios.get(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      { headers: HEADERS }
    );
    const assistantMessage = messagesResponse.data.data
      .reverse()
      .find(msg => msg.role === 'assistant');

    answer = assistantMessage ? assistantMessage.content[0].text.value : 'ไม่มีคำตอบ';
    //console.log('chatGpt', answer);
    return answer;

  } catch (err) {
    //console.error("Error calling assistant:", err.response?.data || err.message);
    return 'ขออภัย เกิดข้อผิดพลาด';
  }
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

let isGame3Active = true;
let game3score = {};
let lastTagged = '';
let chatHistoryMap = {}; 
let chatHistory = [];

function safeGetAvatar(data) {
  // ป้องกัน profilePicture หรือ urls ว่าง
  if (
    data &&
    data &&
    data.userDetails &&
    Array.isArray(data.userDetails.profilePictureUrls) &&
    data.userDetails.profilePictureUrls.length > 0
  ) {
    return data.userDetails.profilePictureUrls[0];
  }
  return '/avatar-default.webp';
}

function listenTikTokEvents() {
  if (!tiktokConnectionWrapper || !tiktokConnectionWrapper.connection) return;
  tiktokConnectionWrapper.connection.on('like', data => {
   eventMgr.addLike(data.uniqueId, data);

    if (!data || !data.uniqueId) return;
    updateUser(data.uniqueId, 'like', data.likeCount, data);
    if (registeredUsers[data.uniqueId]) {
      //  registeredUsers[data.uniqueId]['like'] += data.likeCount;
    }
  });
  tiktokConnectionWrapper.connection.on('share', data => {
    
    if (!data || !data.uniqueId) return;
    updateUser(data.uniqueId, 'share', 1, data);
    eventMgr.addShare(data.uniqueId, data)
  });
  tiktokConnectionWrapper.connection.on('social', data => {
  
    if (!data || !data.uniqueId) return;
    updateUser(data.uniqueId, 'share', 1, data);
  });
  tiktokConnectionWrapper.connection.on('gift', data => {
    if (!data || !data.uniqueId) return;
    var totalValue = 0;
    if ((data.giftType === 1 && data.repeatEnd)) {
     totalValue = (data.diamondCount || 0) * (data.repeatCount || 1);
     }
     console.log('totalValue:', data.diamondCount);
     eventMgr.addGift(data.uniqueId, data.diamondCount, data)
    updateUser(data.uniqueId, 'gift', totalValue, data);
  });
  tiktokConnectionWrapper.connection.on('chat', async data => {
    console.log(tiktokConnectionWrapper.uniqueId)
    const roomid = tiktokConnectionWrapper.uniqueId;
  if (!chatHistoryMap[roomid]) chatHistoryMap[roomid] = [];
  chatHistoryMap[roomid].push(data);
  if (chatHistoryMap[roomid].length > 100) chatHistoryMap[roomid] = chatHistoryMap[roomid].slice(-100);

  io.to(roomid).emit("chat-message", { ...data, roomid });

  eventMgr.addChat(data.uniqueId, data.comment, data);

  handlegame3score(data.uniqueId, data);

  const question = data.comment;
  const userId = data.uniqueId;

  // ✅ ตัวกรองข้อความ
  if (shouldFilterMessage(question)) {
  
  //  console.log("Filtered message: ", question);
    return; // ข้ามการตอบกลับ
  }

  try {
    const answer = await askChatGPT(question, assistantId);
    
    io.emit("chat-message2", {
      uniqueId: "ChatGpt",
      nickname: "Chat Gpt",
      comment: answer
    });
  } catch (err) {
    console.error("Error getting answer from ChatGPT:", err);
  }
  });


}

let KEYWORDS = [
  "ราคา",
  "ไซส์",
  "stock",
  "สต๊อก",
  "สินค้า",
  "product"
];

// ดึง keyword
app.get('/api/keywords', (req, res) => {
  console.log(res.json(KEYWORDS))
  res.json(KEYWORDS);
});

// อัพเดท keyword
app.post('/api/keywords', (req, res) => {
  const { keywords } = req.body;
  if (Array.isArray(keywords)) {
    KEYWORDS = keywords;
    res.json({ success: true, keywords: KEYWORDS });
  } else {
    res.status(400).json({ success: false, message: "Invalid data" });
  }
});

// ===============================
// ฟังก์ชันกรองข้อความ
// ===============================
function shouldFilterMessage(text) {
  if (!text || text.trim() === "") {
    console.log("ข้อความว่าง");
    return true;
  }

  const lowerText = text.toLowerCase();
  console.log("ตรวจข้อความ:", lowerText);

  const greetings = ["สวัสดี", "hello", "hi", "ดีค่ะ", "ดีครับ", "หวัดดี"];
  if (greetings.some(greet => lowerText.includes(greet))) {
    console.log("เป็นคำทักทาย");
    return true;
  }


  // 👇 ลองตัด regex ตัวนี้ออกก่อน
  /*
  if (/^[\uD800-\uDBFF][\uDC00-\uDFFF]$/.test(text) || /^[^\w\s]+$/.test(text)) {
    console.log("เป็น emoji หรือ symbol");
    return true;
  }
  */

  // 👇 แทนที่ด้วย เช็ค emoji สั้น ๆ
  // (ถ้าอยากเช็ค emoji จริงๆ ควรใช้ emoji regex หรือ emoji-detection library)
  if (/^[\p{Emoji}\p{P}\p{S}]+$/u.test(text)) {
    console.log("เป็น emoji ล้วนหรือ symbol");
    return true;
  }

  if (text.length === 1 && /\p{Emoji}/u.test(text)) {
  console.log("เป็น emoji ตัวเดียว");
  return true;
}

  if (/^@[\wก-๙]+$/.test(text)) {
    console.log("เป็น mention");
    return true;
  }

  if (KEYWORDS.some(keyword => lowerText.includes(keyword))) {
    console.log("พบ keyword ในข้อความ:", lowerText);
    return false;
  }

  console.log("ไม่พบ keyword ที่ต้องตอบ");
  return true;
}

function updateUser(id, type, count, data) {
  if (!id) return;
  if (!registeredUsers[id]) registeredUsers[id] = {
    uniqueId: id,
    nickname: data.nickname,
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
    chatHistory = [];
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
      nickname: data.nickname,
      avatar: safeGetAvatar(data)
    });
  }
}

function handleChat(data) {
  const id = data.uniqueId;
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
        nickname: data.nickname,
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

app.get('/admin/get-rules', (req, res) => {
  res.json({ rules: commentRules, matchMode });
});


app.get('/api/chat', (req, res) => {
  const roomid = req.query.roomid;
  console.log(roomid)
  if (!roomid) return res.json([]);
  console.log(chatHistoryMap[roomid])
  res.json(chatHistoryMap[roomid] || []);
});


io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  console.log("Client connected:", socket.id);

  // ===== JOIN/LEAVE ROOM =====
  socket.on('join-room', ({ roomid }) => {
    if (roomid) {
      socket.join(roomid);
      console.log(`Socket ${socket.id} joined room: ${roomid}`);
    }
  });

  socket.on('leave-room', ({ roomid }) => {
    if (roomid) {
      socket.leave(roomid);
      console.log(`Socket ${socket.id} left room: ${roomid}`);
    }
  });

  // ===== รับ chat-message (เฉพาะห้อง) =====
  socket.on('chat-message', (data) => {
    const roomid = data.roomid;
    if (!roomid) return;

    // เก็บ chat ต่อห้อง
   // if (!chatHistoryMap[roomid]) chatHistoryMap[roomid] = [];
   // chatHistoryMap[roomid].push(data);
    //if (chatHistoryMap[roomid].length > 100) chatHistoryMap[roomid] = chatHistoryMap[roomid].slice(-100);

    // ส่งเฉพาะห้องนี้
   // io.to(roomid).emit('chat-message', data);
  });

  // ===== รับ profile =====
  socket.on('user-profile', async (data) => {
    if (!data || !data.roomid) return;
    try {
      const userData = await fetchTiktokUserData(data.uniqueId);
      io.to(data.roomid).emit('user-profile', { ...userData, roomid: data.roomid });
    } catch (err) {
      console.error('Error:', err);
    }
  });

  socket.on("get-register-config", () => eventMgr.handleGetConfig(socket));
  socket.on("save-register-config", cfg => eventMgr.handleSaveConfig(cfg));
  socket.on("open-register", payload => eventMgr.handleOpen(payload));
  socket.on("close-register", () => eventMgr.handleClose());
  socket.on("reset-game", () => eventMgr.handleReset());
  socket.on("player-list", player => eventMgr.handleAddPlayer(player));
  socket.on("reset-all", () => eventMgr.resetAll());
  socket.on("get-draw-pool", () => {
    const pool = eventMgr.makeDrawPool();
    socket.emit("draw-pool", pool);
  });
  socket.on("startSpin", () => {
   
    socket.emit("startSpin");
  });
 
  


});



function handlegame3score(id, data) {
  if (!isGame3Active) return;
 
  const match = isCommentValid(data.comment)

  if (match) {
    const taggedUser = data.nickname;
      if (!game3score[id]) {
          game3score[id] = {
          uniqueId: id,
          nickname: data.nickname,
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

setInterval(() => {
  
 //   if (chatHistory.length > 100) chatHistory = chatHistory.slice(-100);
  broadcastScoreList(io);
  const pool = eventMgr.makeDrawPool();
    io.emit("draw-pool", pool);
}, 5000);

function isCommentValid(comment) {
 // console.log("comment", comment);
  let passed = 0;

  for (const rule of commentRules) {
    switch (rule.type) {
      case "mention_greeting":
        if (/@\w+\s+สวัสดี/.test(comment)) passed++;
        break;
      case "emoji_count":
        let safeComment = typeof comment === "string" ? comment : String(comment || "");
        const emojis = [...safeComment].filter(
          c => /\p{Extended_Pictographic}/u.test(c)
        );
        if (emojis.length >= (rule.min || 1)) passed++;
        break;
      case "contains_word":
        if (comment.includes(rule.word) && comment.length >= (rule.minLength || 0)) passed++;
        break;
    }
  }

  return matchMode === "any" ? passed > 0 : passed === commentRules.length;
}



const sampleUsers = Array.from({ length: 10 }, (_, i) => ({
  uniqueId: "user" + (i + 1),
  nickname: "User " + (i + 1),
  profilePictureUrl: "https://via.placeholder.com/80?text=U" + (i + 1)
}));

app.get('/api/users', (req, res) => {
  res.json(sampleUsers);
});

// Serve frontend build
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get(/^\/(?!admin).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});
server.listen(process.env.PORT || 3000, () => console.log('Server started at http://localhost:3000'));