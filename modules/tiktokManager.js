const { TikTokConnectionWrapper } = require('../TikTokConnectionWrapper');

class TikTokManager {
  constructor(io) {
    this.tiktokConnectionWrapper;
    this.options = {
      sessionId: '74e284c2c5f10b2497223eafce414429'
    };
    this.io = io;
  }

  connect(uniqueId) {
    console.log(`Connecting to TikTok: ${uniqueId}`);

   

    try {
      this.tiktokConnectionWrapper = new TikTokConnectionWrapper(uniqueId, this.options, true);
      this.tiktokConnectionWrapper.connect();     
      console.log('✅ เชื่อมต่อกับ TikTok LIVE');

    
    } catch (err) {
      console.error('❌ เชื่อม TikTok ไม่สำเร็จ:', err);
      setTimeout(this.connect.bind(this, uniqueId), 10000); // ใช้ bind(this)
    }
  }

  
}

module.exports = TikTokManager;
