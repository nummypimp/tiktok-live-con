require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const OBSManager = require('./modules/obsManager');
const TikTokManager = require('./modules/tiktokManager');
const PlayerManager = require('./modules/playerManager');
const CommentFilter = require('./modules/commentFilter');
const { TikTokConnectionWrapper } = require('./TikTokConnectionWrapper');
const { updateViewerStats } = require('./modules/viewerStats');


const log = require('./logger');
console.log = log;
console.log('เริ่มระบบแล้ว');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());



app.use('/admin', adminRoutes);

const obsManager = new OBSManager();
let tiktokConnectionWrapper;
let options = {
   
};
const playerManager = new PlayerManager(io);
const commentFilter = new CommentFilter();
let connections = {};
let chatHistoryMap={}
let userconnection = {}; // { roomid1: url1, roomid2: url2, ... }

function connectTikTok(uniqueId) {
  if (connections[uniqueId]) return;
  try {
    tiktokConnectionWrapper = new TikTokConnectionWrapper(uniqueId, options, true);
    tiktokConnectionWrapper.connect();
    connections[uniqueId] = tiktokConnectionWrapper;
tiktokConnectionWrapper.on("connected", (data) => {
  const roomid = tiktokConnectionWrapper.uniqueId;
  const url = data.hls_pull_url || data.rtmp_pull_url || false;

  // 1. เก็บตัว connection จริง
  connections[roomid] = tiktokConnectionWrapper;

  // 2. เก็บข้อมูลประกอบอื่น ๆ
  userconnection[roomid] = {
    pullUrl: url,
    id: data.id,
    roomid,
    connectedAt: Date.now()
  };

  console.log("✅ New connection metadata:", userconnection[roomid]);
});



    console.log('✅ เชื่อมต่อกับ TikTok LIVE',tiktokConnectionWrapper);
    
     const roomid = tiktokConnectionWrapper.uniqueId;
    listenTikTokEvents(roomid);

    
    return { status: "connected", data:userconnection[roomid] };
  } catch (err) {
    console.error('❌ เชื่อม TikTok ไม่สำเร็จ:', err);
    setTimeout(connectTikTok, 10000);
  }

}

function getconnected(uniqueId){
connections[uniqueId].emit("connected", (data) => {
  const roomid = uniqueId;
  const url = data.hls_pull_url || data.rtmp_pull_url || false;

  
  // 2. เก็บข้อมูลประกอบอื่น ๆ
  userconnection[uniqueId] = {
    pullUrl: url,
    id: data.id,
    roomid:uniqueId,
    data:data,
    connectedAt: Date.now()
  };

  console.log("✅ New connection metadata:", userconnection[roomid]);
});

return userconnection[uniqueId];
}
function disconnectUser(uniqueId) {
  if (connections[uniqueId]) {
    connections[uniqueId].disconnect(); // ใช้ได้ เพราะเป็น TikTokConnectionWrapper จริง ๆ
    delete connections[uniqueId];
  }

  // ล้าง metadata ด้วย
  delete userconnection[uniqueId];
  delete chatHistoryMap[uniqueId];

  io.emit('status', getStatus());
}

function getStatus() {
  return Object.entries(connections).map(([id, w]) => ({
      uniqueId: id,
      status: pullUrls[id] === false ? 'disconnected' : 'connected',
        }));
  
}
function listenTikTokEvents(roomid) {
  if (!tiktokConnectionWrapper || !tiktokConnectionWrapper.connection) return;
  tiktokConnectionWrapper.connection.on('like', data => {
   //console.log({roomid:roomid, click:"1"})

    updateViewerStats(data, roomid, 'likeCount');

   
  });
 tiktokConnectionWrapper.connection.on('roomUser', data => {
   //console.log({roomid:roomid, roomUser:data})
   
  });
  
   tiktokConnectionWrapper.connection.on('member', data => {
   //console.log({roomid:roomid, member:data})
   
  });
   tiktokConnectionWrapper.connection.on('gift', data => {
   //console.log({roomid:roomid, member:data})
   
      updateViewerStats(data, roomid, 'giftCount');
      updateViewerStats(data, roomid, 'totalDiamond', data.diamondCount);
    
   
  });
  tiktokConnectionWrapper.connection.on('chat', async data => {
   
    updateViewerStats(data, roomid, 'commentCount');

   if (!chatHistoryMap[roomid]) chatHistoryMap[roomid] = [];
   chatHistoryMap[roomid].push(data);
   if (chatHistoryMap[roomid].length > 100) chatHistoryMap[roomid] = chatHistoryMap[roomid].slice(-100);
   console.log({roomid:roomid, comment:data.comment})
   
   io.to(roomid).emit("chat-message", { ...data, roomid });
 
   });



}
// Attach IO events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // 1. Join room
  socket.on('join-room', ({ roomid }) => {
    socket.join(roomid);
    console.log(`Socket ${socket.id} joined room: ${roomid}`);
  });

  // 2. ✅ รับ event จาก client ที่ขอ pull_url
 socket.on("hls_pull_url", async ({ roomid }) => {
  // รอ 5 วินาที
  await new Promise(resolve => setTimeout(resolve, 5000));

  const url = userconnection[roomid]?.pullUrl || null;

  socket.emit("hls-pull-url", { roomid, url });
});


socket.on("getallroom", async () => {
  // หน่วงเวลา 5 วินาที
  await new Promise(resolve => setTimeout(resolve, 5000));

  const meta = userconnection;

  socket.emit("getallroom", {
    data:meta
  });
});


socket.on("getstatus", async ({ roomid }) => {
  // หน่วงเวลา 5 วินาที
  await new Promise(resolve => setTimeout(resolve, 5000));

  const meta = userconnection[roomid];
  const isOnline = !!meta?.pullUrl;

  socket.emit("getstatus", {
    roomid,
    online: isOnline,
    dataconnection: meta || null
  });
});



});


//obs
// สำหรับ Express backend
app.get('/api5/obs/scenes', async (req, res) => {
  const result = await obsManager.send('GetSceneList');
  res.json({ scenes: result.scenes.map(s => s.name) });
});

app.get('/api5/obs/sources', async (req, res) => {
  const currentScene = (await obsManager.send('GetCurrentProgramScene')).currentProgramSceneName;
  const result = await obs.send('GetSceneItemList', { sceneName: currentScene });
  res.json({ sources: result.sceneItems.map(item => item.sourceName) });
});
app.use('/api', apiRoutes({
  connectTikTok,disconnectUser,chatHistoryMap
}));

// Serve frontend
app.use(express.static('./frontend/build'));
app.get(/^\/(?!admin).*/, (req, res) => {
  res.sendFile(require('path').join(__dirname, './frontend/build/index.html'));
});

server.listen(process.env.PORT || 3000, () => {
  console.log('✅ Server started');
});