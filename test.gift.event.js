var data =  {
  event: {
    msgId: '7506603662207535880',
    createTime: '1747767439058',
    eventDetails: {
      displayType: 'webcast_aweme_gift_send_messageNew',
      label: '{0:user} sent {1:gift} × {2:string}'
    }
  },
  giftId: 13651,
  repeatCount: 4,
  user: {
    userId: '7043491540345603077',
    nickname: 'ابو انورين',
    profilePicture: { urls: [Array] },
    uniqueId: 'dyh0blrt8eb1',
    secUid: 'MS4wLjABAAAAZs91ogl8D9I84FZASpFnH4hwq5D_alNNaKLpd-5F0a5qtTndcIV8DLb9Hd97KshG',
    badges: [ [Object], [Object] ],
    createTime: '0',
    bioDescription: '',
    followInfo: {
      followingCount: 9894,
      followerCount: 17803,
      followStatus: 3,
      pushStatus: 0
    }
  },
  repeatEnd: 0,
  groupId: '1747767436002',
  giftDetails: {
    giftImage: {
      giftPictureUrl: 'https://p19-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/b342e28d73dac6547e0b3e2ad57f6597.png~tplv-obj.png'
    },
    giftName: 'Popular Vote',
    describe: 'Sent Popular Vote',
    giftType: 1,
    diamondCount: 1
  },
  monitorExtra: '',
  giftExtra: { timestamp: '1747767439060', receiverUserId: '6966248095990989830' }
}

  if (data.giftType === 1 && !data.repeatEnd) {
        
    } else {
        // Streak ended or non-streakable gift => process the gift with final repeat_count
        console.log(`${data.user.uniqueId} has sent gift ${data.giftDetails.giftName} x${data.repeatCount} = ${data.repeatCount * data.giftDetails.diamondCount}`);
    }