import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import ReactPlayer from "react-player"; // npm i react-player
import socket from "./socket";

/**
 * Utility: true when viewport < 768 px (tailwind md breakpoint)
 */
const useIsMobile = () => {
  const mql = useRef(window.matchMedia("(max-width: 767px)"));
  const [isMobile, setIsMobile] = useState(mql.current.matches);
  useEffect(() => {
    const handler = (e) => setIsMobile(e.matches);
    mql.current.addEventListener("change", handler);
    return () => mql.current.removeEventListener("change", handler);
  }, []);
  return isMobile;
};

/** Regex‑based emoji stripper (Unicode 13+) */
const stripEmoji = (text) =>
  text.replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, "").trim();

export default function ChatViewer() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [profileSignature, setProfileSignature] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [filterEmoji, setFilterEmoji] = useState(true);

  const messagesEndRef = useRef(null);
  const isMobile = useIsMobile();

  /** roomid from query‑param */
  const params = new URLSearchParams(useLocation().search);
  const roomid = params.get("roomid");

  const [muted, setMuted] = useState(true);

  /** ask backend for HLS pull‑url once */
  useEffect(() => {
    if (!roomid) return;

    socket.emit("hls_pull_url", { roomid });
    const handler = (payload) => {
      if (payload?.roomid === roomid && payload?.url) {
        console.log(payload);
        setVideoUrl(payload.url);
      }
    };
    socket.on("hls-pull-url", handler); // <- emit‑response event name (adjust if different)
    return () => socket.off("hls-pull-url", handler);
  }, [roomid]);

  /** join‑room + chat listeners */
  useEffect(() => {
    if (!roomid) return;

    socket.emit("join-room", { roomid });
    fetch(`/api/chat?roomid=${encodeURIComponent(roomid)}`)
      .then((res) => res.json())
      .then((initial) => setMessages(initial || []));

    const chatListener = (msg) => {
      if (msg.roomid !== roomid) return;

      const text = filterEmoji ? stripEmoji(msg.comment || "") : msg.comment;
      if (filterEmoji && !text) return; // skip empty after stripping

      setMessages((prev) => [...prev, { ...msg, comment: text }]);
    };

    const profileListener = (data) => {
      if (data?.signature) setProfileSignature(data.signature);
    };

    socket.on("chat-message", chatListener);
    socket.on("user-profile", profileListener);

    return () => {
      socket.off("chat-message", chatListener);
      socket.off("user-profile", profileListener);
    };
  }, [roomid, filterEmoji]);

  /** auto‑scroll (desktop mode) */
  useEffect(() => {
    if (!isMobile) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isMobile]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !roomid) return;
    const msg = {
      comment: input,
      nickname: "admin",
      sender: "admin",
      time: Date.now(),
      roomid,
    };
    socket.emit("chat-message", msg);
    setMessages((prev) => [...prev, msg]);
    setInput("");
  }, [input, roomid]);

  /* ----------  RENDER  ---------- */
  const ChatListDesktop = (
    <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50" id="chat-scrollable">
      {messages.map((msg, i) => (
        <div key={i} className="flex items-start gap-2">
          <img
            src={msg.userDetails?.profilePictureUrls?.[0] || "/avatar-default.webp"}
            alt="avatar"
            className="w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition"
            onClick={() =>
              msg.uniqueId && socket.emit("user-profile", { uniqueId: msg.uniqueId, roomid })
            }
          />
          <div>
            <div className="text-sm font-semibold">{msg.nickname || "ผู้ชม"}</div>
            <div className="bg-white rounded px-3 py-1 shadow text-gray-800 break-words max-w-xs">
              {msg.comment}
            </div>
            <div className="text-xs text-gray-400">
              {msg.time ? new Date(msg.time).toLocaleTimeString() : ""}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );

  /** Mobile overlay: newest 30 msgs overlay as ticker from right */
  const ChatOverlayMobile = (
    <div className="pointer-events-none absolute inset-0 p-2 flex flex-col justify-end space-y-1 overflow-hidden">
      {messages.slice(-30).map((msg, i) => (
        <div
          key={i}
          className="self-end bg-black/50 text-white rounded px-2 py-0.5 text-xs mb-0.5 animate-slide-in"
        >
          <span className="font-semibold mr-1">{msg.nickname || "ผู้ชม"}</span>
          {msg.comment}
        </div>
      ))}
    </div>
  );

  return (
     <div className="h-screen w-screen bg-gray-900 text-gray-100">
    {/* ---------- DESKTOP LAYOUT ---------- */}
    {!isMobile && (
      <div className="flex h-full">
        {/* VIDEO */}
        <div className="flex-1 bg-black relative">
          {videoUrl ? (
            <>
              <ReactPlayer
                url={videoUrl}
                playing
                controls
                muted={muted}
                width="100%"
                height="100%"
                config={{ file: { forceHLS: true } }}
              />

              {/* 🔊 ปุ่มเปิดเสียง (ถ้ายัง mute อยู่) */}
              {muted && (
                <button
                  onClick={() => setMuted(false)}
                  className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded shadow-lg hover:bg-black/90"
                >
                  🔈 เปิดเสียง
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              กำลังโหลดวิดีโอ…
            </div>
          )}
        </div>

          {/* CHAT */}
          <div className="w-96 flex flex-col border-l bg-gray-100 text-gray-900">
            {ChatListDesktop}
            <div className="flex p-2 border-t gap-2 bg-white">
              <input
                className="flex-1 rounded border px-2 py-1 focus:outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="พิมพ์ข้อความตอบกลับ…"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                 onClick={() => setMuted(false)}
              >
                ส่ง
              </button>
            </div>
            {/* toggle emoji filter */}
            <label className="flex items-center gap-2 p-2 text-xs bg-gray-50 border-t">
              <input
                type="checkbox"
                checked={filterEmoji}
                onChange={(e) => setFilterEmoji(e.target.checked)}
              />
              กรอง emoji (เว้นว่างไม่แสดง)
            </label>
          </div>
        </div>
      )}

      {/* ---------- MOBILE LAYOUT ---------- */}
     {isMobile && (
  <div className="relative h-full w-full bg-black">
    {videoUrl ? (
      <ReactPlayer
        url={videoUrl}
        playing
        controls={false}
        width="100%"
        height="100%"
        muted={muted}
        config={{ file: { forceHLS: true } }}
      />
    ) : (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        กำลังโหลดวิดีโอ…
      </div>
    )}

    {/* 🔳 chat overlay — สูง 30% ด้านล่าง */}
    <div className="absolute bottom-12 left-0 w-full h-[30%] overflow-y-auto px-2 pb-1 pointer-events-none">
      <div className="flex flex-col justify-end space-y-1">
        {messages.slice(-30).map((msg, i) => (
          <div
            key={i}
            className="self-end bg-black/50 text-white rounded px-2 py-0.5 text-xs mb-0.5 animate-slide-in"
          >
            <span className="font-semibold mr-1">{msg.nickname || "ผู้ชม"}</span>
            {msg.comment}
          </div>
        ))}
      </div>
    </div>

    {/* send box (fixed bottom) */}
    <div className="absolute bottom-0 left-0 w-full flex gap-1 p-1 bg-black/70">
      <input
        className="flex-1 rounded px-2 py-1 text-sm bg-white/90 text-black placeholder:text-gray-500"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="พิมพ์…"
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <button
        className="px-3 py-1 text-sm rounded bg-blue-500 text-white"
        onClick={() => {
          handleSend();
          setMuted(false); // เปิดเสียงหลังส่งข้อความ
        }}
      >
        เปิดเสียง
      </button>
    </div>
  </div>
)}

    </div>
  );
}

/* Tailwind ‑ add once in your global CSS
@keyframes slide-in {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
*/
