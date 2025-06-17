const OBSWebSocket = require('obs-websocket-js').default;

class OBSManager {
  constructor() {
    this.obs = new OBSWebSocket();
    this.connect();
  }

  async connect() {
    try {
      await this.obs.connect('ws://localhost:4455');
      console.log('✅ OBS connected');
    } catch (err) {
     // console.error('❌ OBS connection failed:', err.message);
      setTimeout(() => this.connect(), 25000);
    }
  }

  getInstance() {
    return this.obs;
  }
}

module.exports = OBSManager;