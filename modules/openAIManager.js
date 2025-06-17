const axios = require('axios');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const assistantId = process.env.ASSISTANT_ID || 'asst_xxx';

async function askChatGPT(message) {
  try {
    const HEADERS = {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2'
    };
    const threadRes = await axios.post('https://api.openai.com/v1/threads', {}, { headers: HEADERS });
    const threadId = threadRes.data.id;

    await axios.post(`https://api.openai.com/v1/threads/${threadId}/messages`,
      { role: 'user', content: message },
      { headers: HEADERS });

    const runRes = await axios.post(`https://api.openai.com/v1/threads/${threadId}/runs`,
      { assistant_id: assistantId },
      { headers: HEADERS });

    const runId = runRes.data.id;

    let status = 'in_progress';
    while (status === 'in_progress' || status === 'queued') {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await axios.get(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, { headers: HEADERS });
      status = statusRes.data.status;
    }

    const messagesRes = await axios.get(`https://api.openai.com/v1/threads/${threadId}/messages`, { headers: HEADERS });
    const assistantMsg = messagesRes.data.data.reverse().find(m => m.role === 'assistant');
    return assistantMsg ? assistantMsg.content[0].text.value : 'ไม่มีคำตอบ';
  } catch (err) {
    console.error('OpenAI error:', err.message);
    return 'ขออภัย เกิดข้อผิดพลาด';
  }
}

module.exports = { askChatGPT };