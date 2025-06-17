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
    console.log('chatGpt', answer);
    return answer;

  } catch (err) {
    //console.error("Error calling assistant:", err.response?.data || err.message);
    return 'ขออภัย เกิดข้อผิดพลาด';
  }
}

async function aa(){
var message = "สนใจเดรสเพชร"
 try {
    const answer = await askChatGPT(message, assistantId);
    
    console.log(answer)
  } catch (err) {
    console.error("Error getting answer from ChatGPT:", err);
  }

}

aa()
