import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import socket from './socket';

export default function ChatViewer() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [profileSignature, setProfileSignature] = useState("");
  const messagesEndRef = useRef(null);

  // 1. ดึง roomid จาก query param
  const params = new URLSearchParams(useLocation().search);
  const roomid = params.get("roomid");

  // 2. join room เมื่อรู้ roomid
  // เมื่อเข้า /chat?roomid=xxxx
useEffect(() => {
  if (!roomid) return;
  socket.emit("join-room", { roomid });
  fetch(`/api/chat?roomid=${encodeURIComponent(roomid)}`)
    .then(res => res.json())
    .then(setMessages);

  const chatListener = (msg) => {
    if (msg.roomid === roomid) setMessages((prev) => [...prev, msg]);
  };
  socket.on("chat-message", chatListener);

   socket.on("user-profile", (data) => {
      if (data && data.signature) setProfileSignature(data.signature);
    });

  return () => {
   // socket.emit("leave-room", { roomid });
    socket.off("chat-message", chatListener);
  };
}, [roomid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

// เวลาส่ง message
const handleSend = () => {
  if (input.trim() && roomid) {
    const msg = {
      text: input,
      sender: "admin",
      time: Date.now(),
      roomid,
    };
    socket.emit("chat-message", msg);
    setMessages((prev) => [...prev, msg]);
    setInput("");
  }
};

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100">
      {/* ... เหมือนเดิม ... */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className="flex items-start gap-2">
            <img
              src={msg.userDetails?.profilePictureUrls?.[0] || "/avatar-default.webp"}
              alt="avatar"
              className="w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition"
              onClick={() => {
                if (msg.uniqueId) {
                  socket.emit("user-profile", { uniqueId: msg.uniqueId, roomid });
                }
              }}
            />
            <div>
              <div className="text-sm font-semibold">{msg.nickname || "ผู้ชม"}</div>
              <div className="bg-white rounded px-3 py-1 shadow text-gray-800">{msg.comment}</div>
              <div className="text-xs text-gray-400">{msg.time ? new Date(msg.time).toLocaleTimeString() : ""}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex p-2 border-t gap-2">
        <input
          className="flex-1 rounded border px-2 py-1 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์ข้อความตอบกลับ..."
          onKeyDown={e => e.key === "Enter" && handleSend()}
        />
        <button
          className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
          onClick={handleSend}
        >
          ส่ง
        </button>
      </div>
    </div>
  );
}
