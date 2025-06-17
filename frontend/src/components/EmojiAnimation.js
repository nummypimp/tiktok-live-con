import React, { useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import socket from './socket';
import './EmojiAnimation.css'; // move your CSS here
import { useLocation } from "react-router-dom";

const EmojiAnimation = () => {
  const [previewIndex, setPreviewIndex] = useState(0);
  const previewEnabled = useRef(true);
  const emojiContainerRef = useRef(null);
  const settings = useRef({
    emojify_animationDuration: 3,
    emojify_emojiSize: 50,
    emojify_opacity: 100,
    emojify_rotations: 4,
    emojify_disappearAfter: 1,
    emojify_showPictures: true,
    emojify_showEmojis: true,
    emojify_showSubEmotes: true
  });

  // 1. ดึง roomid จาก query param
  const params = new URLSearchParams(useLocation().search);
  const roomid = params.get("roomid");

  const extractEmojis = (text) => {
    const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    return text.match(emojiRegex) || [];
  };

  const animateEmoji = (emoji, baseEndPos, delay, numEmojis, isEmote = false) => {
    const $container = $(emojiContainerRef.current);
    const isImage = emoji.startsWith('https://');
    const $emojiElement = isImage
      ? $('<img>').addClass('emoji').attr("src", emoji).css('border-radius', '50%').attr('onerror', "this.src='/img/nothumb.webp'")
      : $('<div>').addClass('emoji').text(emoji);

    $container.append($emojiElement);

    const initialSize = 0;
    const roationDirection = Math.random() > 0.5 ? 360 : -360;
    const finalSize = settings.current.emojify_emojiSize;
    const startBaseLeft = $(window).width() / 2;
    const startPos = {
      top: $(window).height() - 20,
      left: startBaseLeft + (Math.random() * 200 - 100)
    };

    let variation = 150 * (numEmojis / 4);
    if (variation > 500) variation = 500;

    const endPos = {
      top: baseEndPos.top + (Math.random() * variation - variation / 2),
      left: baseEndPos.left + (Math.random() * variation - variation / 2)
    };

    $emojiElement.css({
      position: 'absolute',
      fontSize: initialSize,
      width: isImage ? initialSize : 'unset',
      top: startPos.top,
      left: startPos.left,
      opacity: 0,
      transform: 'rotate(0deg)'
    });

    setTimeout(() => {
      $emojiElement.css({
        opacity: settings.current.emojify_opacity / 100,
        transform: `rotate(${settings.current.emojify_rotations * roationDirection}deg)`
      });

      const width = isImage ? (isEmote ? settings.current.emojify_emoteSize || 70 : settings.current.emojify_profilePictureSize || 50) : 'unset';

      $emojiElement.animate({
        fontSize: finalSize,
        width: width,
        top: endPos.top,
        left: endPos.left
      }, settings.current.emojify_animationDuration * 1000, 'swing')
        .animate({
          opacity: 0
        }, settings.current.emojify_disappearAfter * 1000, function () {
          $(this).remove();
        });
    }, delay);
  };

  const onChatMessage = (baseEndPos, message, profilePictureUrl) => {
    const emojis = extractEmojis(message);
    let showProfilePictureCount = 1;

    emojis.forEach((emoji, index) => {
      const delay = (emojis.length < 5 ? 200 : 100) * index;
      animateEmoji(emoji, baseEndPos, delay, emojis.length);

      showProfilePictureCount += 1;
      if (showProfilePictureCount === 2 && settings.current.emojify_showPictures) {
        showProfilePictureCount = 0;
        animateEmoji(profilePictureUrl, baseEndPos, delay, emojis.length);
      }
    });
  };

  const onEmotes = (baseEndPos, emotes, profilePictureUrl) => {
    let showProfilePictureCount = 1;

    emotes.forEach((emote, index) => {
      const delay = (emotes.length < 5 ? 200 : 100) * index;
      animateEmoji(emote.emoteImageUrl, baseEndPos, delay, emotes.length, true);

      showProfilePictureCount += 1;
      if (showProfilePictureCount === 2 && settings.current.emojify_showPictures) {
        showProfilePictureCount = 0;
        animateEmoji(profilePictureUrl, baseEndPos, delay, emotes.length);
      }
    });
  };

  useEffect(() => {
     if (!roomid) return;
    socket.emit("join-room", { roomid });

    socket.on("chat-message", (chatData) => {
      if (!chatData.isTest) previewEnabled.current = false;

      const baseEndPos = {
        top: Math.random() * window.innerHeight / 2,
        left: Math.random() * window.innerWidth
      };

      if (settings.current.emojify_showEmojis && chatData.comment)
        onChatMessage(baseEndPos, chatData.comment, chatData.profilePictureUrl || 'https://');

      if (settings.current.emojify_showSubEmotes && Array.isArray(chatData.emotes))
        onEmotes(baseEndPos, chatData.emotes, chatData.profilePictureUrl || 'https://');
    });

    return () => socket.disconnect();
  }, []);

  return <div id="emoji-container" ref={emojiContainerRef}></div>;
};

export default EmojiAnimation;
