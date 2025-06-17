function handleChat(data) {
 // console.log('CHAT:', data);
  const id = data.user.uniqueId;
  const msg = data.comment.trim();
  console.log('msg:', msg);
  if (registeredUsers[id]) {
    const emojiCount = (msg.match(/\p{Emoji}/gu) || []).length;
    if (emojiCount >= 1) registeredUsers[id].emoji += 1;
    if (registeredUsers[id].emoji >= 1 || registeredUsers[id].gift >= 30) {
        
       round1Passed[id] = {
          id,
          nickname: data.user.nickname,
          avatar: data.user.profilePicture.urls[0]
        };

        console.log(round1Passed[id])
       // io.emit('round1-winner', round1Passed[id]);
        //io.emit('round1-winner', data);
    }
  }
  
}

var registeredUsers={};
var round1Passed = {};
registeredUsers['may_chayapa'] = {
  like: 0,
  share: 0,
  gift: 0,
  emoji: 0
};
round1Passed['may_chayapa'];


var a = {
  event: {
    msgId: '7506568288077335314',
    createTime: '1747759133764',
    eventDetails: undefined
  },
  user: {
    userId: '6556855478025797634',
    nickname: '💎 🐯 🐫 MayMayz 🧸 💚 🦏',
    profilePicture: { urls: [Array] },
    uniqueId: 'may_chayapa',
    secUid: 'MS4wLjABAAAACfm1OOS3KvEMyDeMfvR1kGREJ7_DIjTzqhNK4cZgW7kB0ZkJcRV1sfiTDHCabCZv',
    badges: [ [Object], [Object], [Object], [Object] ],
    createTime: '0',
    bioDescription: '',
    followInfo: {
      followingCount: 328,
      followerCount: 13022,
      followStatus: 2,
      pushStatus: 0
    }
  },
  comment: 'อุ๊บส์ 😅😅',
  emotes: []
}

handleChat(a) 