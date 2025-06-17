// logger.js
const fs = require('fs');
const path = require('path');

// log path (สามารถเปลี่ยนชื่อไฟล์หรือ path ได้)
const logFilePath = path.join(__dirname, 'log.txt');

function logToFile(...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(a =>
    typeof a === 'object' ? JSON.stringify(a) : a
  ).join(' ');
  const logLine = `[${timestamp}] ${message}\n`;

  fs.appendFile(logFilePath, logLine, (err) => {
    if (err) console.error('[Logger Error]', err);
  });

  // optional: log ไป console ตามปกติ
  process.stdout.write(logLine); // เหมือน console.log
}

// export ฟังก์ชัน
module.exports = logToFile;
