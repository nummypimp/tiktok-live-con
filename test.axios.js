import { config } from 'dotenv';
import axios from 'axios';

const roomId = '7516550777377245973';
const timestamp = Date.now();
const url = `https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=${roomId}&_=${timestamp}`;
console.log(process.env.TIKTOK_COOKIE)
try {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Referer': 'https://www.tiktok.com/',
      'Origin': 'https://www.tiktok.com',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Cookie': process.env.TIKTOK_COOKIE
    },
  });

  console.log('✅ success', response.data);
} catch (err) {
  console.error('❌ failed', err.response?.status, err.response?.data || err.message);
}
