const curl = require('curl');
const cheerio = require('cheerio');

function getTiktokUserData(username) {
  return new Promise((resolve, reject) => {
    const url = 'https://www.tiktok.com/@' + username;

    curl.get(url, (err, response, body) => {
      if (err) return reject(err);

      try {
        const $ = cheerio.load(body);
        const scriptTag = $('script#__UNIVERSAL_DATA_FOR_REHYDRATION__[type="application/json"]');
        const jsonText = scriptTag.html();

        const data = JSON.parse(jsonText);
        console.log(data);
        const user = data.__DEFAULT_SCOPE__['webapp.user-detail']?.userInfo?.user;

        if (!user) return reject("User data not found in JSON");

        const userdata = {
          id: user.id,
          uniqueId: user.uniqueId,
          nickname: user.nickname,
          signature: user.signature,
          secUid: user.secUid,
          roomId: user.roomId,
          avatarLarger: user.avatarLarger,
        };

        resolve(userdata);
      } catch (e) {
        reject('Parsing error: ' + e.message);
      }
    });
  });
}

module.exports = { getTiktokUserData };


