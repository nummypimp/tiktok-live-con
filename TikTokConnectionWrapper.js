import { EventEmitter } from 'events';
import { WebcastPushConnection } from 'tiktok-live-connector';
import axios from 'axios';

export class TikTokConnectionWrapper extends EventEmitter {
  constructor(uniqueId, options = {}) {
    super();
    this.uniqueId = uniqueId;
    this.options = options;
    this.connection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelayMs = 10000;
    this.cooldownMs = 5 * 60 * 1000;
    this.reconnectEnabled = true;
    this.clientDisconnected = false;
  }

  connect() {
    if (this.connection) {
      // ป้องกัน connect ซ้ำซ้อน
      this.disconnect();
    }

    console.log(`🔌 Connecting to @${this.uniqueId}`);
    this.connection = new WebcastPushConnection(this.uniqueId, this.options);

    // Events สำคัญ
  this.connection.on('connected', async (data) => {
  try {
    const stream = data?.roomInfo?.stream_url;
    const roomId = stream?.id || data?.roomId || data?.roomInfo?.room_id;

    if (!stream || !stream.hls_pull_url) {
      console.warn(`@${this.uniqueId} ⚠️ hls_pull_url missing. Attempting to fetch manually...`);
      if (!roomId) throw new Error("Missing roomId");

      const timestamp = Date.now();  
     
      const infoUrl = `https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=${roomId}&_=${timestamp}`;
        const response = await axios.get(infoUrl, {
    headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Referer': 'https://www.tiktok.com/',
  'Origin': 'https://www.tiktok.com',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
   'Cookie': process.env.TIKTOK_COOKIE
}
  });

      const streamFallback = response?.data?.data?.stream_url || {};

      const ownerdata = {
        uniqueId: this.uniqueId,
        hls_pull_url: streamFallback.hls_pull_url || null,
        flv_pull_url: streamFallback.flv_pull_url?.HD1 || streamFallback.flv_pull_url?.SD1 || null,
        rtmp_pull_url: streamFallback.rtmp_pull_url || null,
        id: streamFallback.id_str || null,
        roomId: response.data?.data?.id_str || roomId,
        url:`https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=${roomId}&_=${timestamp}`
      };

      console.log(`@${this.uniqueId} ✅ Connected via fallback`, ownerdata);
      this.emit('connected', ownerdata);
      return;
    }

    // ถ้า TikTok live connector มี stream ปกติ
    const ownerdata = {
      uniqueId: this.uniqueId,
      hls_pull_url: stream.hls_pull_url,
      flv_pull_url: stream.flv_pull_url || null,
      rtmp_pull_url: stream.rtmp_pull_url || null,
      id: stream.id_str || null,
      roomId: stream.id || roomId
    };

    console.log(`@${this.uniqueId} ✅ Connected`, ownerdata);
    this.emit('connected', ownerdata);

  } catch (err) {
    console.warn(`@${this.uniqueId} ❌ Error getting stream:`, err.message);
    this.emit('connected', { uniqueId: this.uniqueId, error: err.message });
  }
});


    this.connection.on('disconnected', () => {
      console.warn(`@${this.uniqueId} ⚠️ Disconnected`);
      this.emit('disconnected', { uniqueId: this.uniqueId });
      if (this.reconnectEnabled && !this.clientDisconnected) {
        this.scheduleReconnect();
      }
    });

    this.connection.on('streamEnd', ({ action }) => {
      console.warn(`@${this.uniqueId} 📴 Stream ended with action: ${action}`);
      this.emit('streamEnd', { uniqueId: this.uniqueId, action });
      if (this.reconnectEnabled && !this.clientDisconnected) {
        this.scheduleReconnect();
      }
    });

    // ส่งออก Event อื่นๆ ที่ต้องการ
    const forwardEvents = [
      "chat", "gift", "like", "share", "member", "follow", "subscribe", "social", "envelope",
      "questionNew", "linkMicBattle", "linkMicArmies", "liveIntro", "streamEnd", "roomUser", "emote"
    ];
    forwardEvents.forEach(eventName => {
      this.connection.on(eventName, (data) => {
        this.emit(eventName, { uniqueId: this.uniqueId, data });
      });
    });

    // เริ่มเชื่อมต่อ
    this.connection.connect().catch(err => {
      console.error(`@${this.uniqueId} ❌ Initial connection failed:`, err.message);
      if (this.reconnectEnabled && !this.clientDisconnected) {
        this.scheduleReconnect();
      }
    });
  }

  scheduleReconnect() {
    if (!this.reconnectEnabled || this.clientDisconnected) return;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`@${this.uniqueId} 🔁 Reconnecting in ${this.reconnectDelayMs / 1000} seconds (attempt ${this.reconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectDelayMs);
    } else {
      console.log(`@${this.uniqueId} ⏳ Max attempts reached. Waiting ${this.cooldownMs / 60000} minutes before retry...`);
      setTimeout(() => {
        this.reconnectAttempts = 0;
        this.connect();
      }, this.cooldownMs);
    }
  }

  disconnect() {
    this.clientDisconnected = true;
    this.reconnectEnabled = false;
    if (this.connection) {
      // เช็คสถานะ isConnected (ปลอดภัยกับ v4 ขึ้นไป)
      if (this.connection.isConnected) {
        this.connection.disconnect();
      }
      // ถอด event listeners
      this.connection.removeAllListeners();
      this.connection = null;
    }
    console.log(` Client connection disconnected`);
  }
}

// วิธีใช้
// const uniqueId = "jjfamilycharcoal";
// const tiktok = new TikTokConnectionWrapper(uniqueId);
// tiktok.connect();
// tiktok.on('chat', (data) => { ... });
// tiktok.disconnect();
