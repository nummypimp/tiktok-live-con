const axios = require('axios');

/**
 * ฟังก์ชันนี้จะเช็คว่า user ที่ค้นหา มี aweme_id (Live อยู่) หรือไม่
 * @param {string} user - ชื่อหรือ keyword ของ user
 * @returns {Promise<boolean>} - true ถ้ามี aweme_id, false ถ้าไม่มี หรือ error
 */
async function checkuserislive(user) {
  const options = {
    method: 'GET',
    url: 'https://scraptik.p.rapidapi.com/search-lives',
    params: {
      keyword: user,
      count: '20',
      offset: '0'
    },
    headers: {
      'x-rapidapi-key': 'ffe2d1586amsh7b8c7098520ec73p1b3d5ajsneef87f941500',
      'x-rapidapi-host': 'scraptik.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    // เช็คว่า data2.data[0].lives.aweme_id มีอยู่ไหม
   
    const hasAwemeId = Boolean(response.data?.data[0]?.lives?.aweme_id);
    return hasAwemeId;
  } catch (error) {
    console.error(error);
    return false; // error ถือว่าไม่เจอ
  }
}

module.exports = checkuserislive;
