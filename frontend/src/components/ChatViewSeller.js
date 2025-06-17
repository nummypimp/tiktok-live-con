import React, { useEffect, useRef, useState } from "react";
import socket from './socket';

export default function ChatViewSeller() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [profileSignature, setProfileSignature] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('เชื่อมต่อ socket แล้ว:', socket.id);
    });
  }, []);

  useEffect(() => {
    fetch("/api/chat")
      .then(res => res.json())
      .then(setMessages);

    socket.on("chat-message2", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user-profile", (data) => {
      if (data && data.signature) setProfileSignature(data.signature);
    });

    return () => {
      socket.off("chat-message2");
      socket.off("user-profile");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      const msg = {
        text: input,
        sender: "admin",
        time: Date.now(),
        avatar: "/avatar-default.webp",
      };
      socket.emit("chat-message", msg);
      setMessages((prev) => [...prev, msg]);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100">
      {/* Navbar (แสดงบนสุดเสมอ) */}
      <nav className="bg-white shadow flex items-center px-4 h-14 sticky top-0 z-20">
        <div className="font-bold text-lg text-blue-600 flex-1">แชท</div>
        {/* (จะใส่ hamburger หรือเมนูอื่นๆ ก็ได้) */}
      </nav>
      {/* Chat container */}
      <div className="flex-1 flex flex-col bg-white w-full max-w-none">
        <div className="p-2 text-lg font-bold border-b hidden sm:block">แชทจากผู้ชม</div>
        {profileSignature && (
          <div className="text-2xl font-extrabold text-red-600 text-center py-2">
            {profileSignature}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className="flex items-start gap-2">
              <img
                src={msg.userDetails?.profilePictureUrls?.[0] || "/avatar-default.webp"}
                alt="avatar"
                className="w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition"
                onClick={() => {
                  if (msg.uniqueId) {
                    socket.emit("user-profile", { uniqueId: msg.uniqueId, ...msg });
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
    </div>
  );
}
