// routes/apiRouter.js
const express = require('express');
const { askChatGPT } = require('../modules/openAIManager');

module.exports = ({
  connectTikTok,
  disconnectUser,
  chatHistoryMap,
  getconnected           // <— ฉีดเข้ามา
}) => {
  const router = express.Router();

  // 1) ประวัติแชต
  router.get('/chat', (req, res) => {
    const { roomid } = req.query;
    if (!roomid) return res.json([]);               // no room -> empty array
    return res.json(chatHistoryMap[roomid] ?? []);  // undefined -> []
  });

  // 2) คีย์เวิร์ดที่รองรับ
  router.get('/keywords', (_req, res) => {
    res.json(['ราคา', 'ไซส์', 'สินค้า']);
  });

  // 3) ถาม OpenAI
  router.post('/ask', async (req, res) => {
    try {
      const { question } = req.body;
      if (!question) return res.status(400).json({ message: 'question is required' });

      const answer = await askChatGPT(question);
      res.json({ answer });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'openai error' });
    }
  });

  // 4) เชื่อม TikTok
 router.post('/connect', async (req, res) => {
  const { uniqueId } = req.body;
  if (!uniqueId) return res.status(400).json({ message: 'uniqueId is required' });

  try {
    const result = await connectTikTok(uniqueId); // ✅ รอจน connected สำเร็จ
    res.json({ status: 'connected', result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});


  // 5) ตัด TikTok
  router.post('/disconnect', (req, res) => {
    const { uniqueId } = req.body;
    if (!uniqueId) return res.status(400).json({ message: 'uniqueId is required' });

    disconnectUser(uniqueId);
    res.json({ status: 'disconnected', uniqueId });
  });

  return router;
};
