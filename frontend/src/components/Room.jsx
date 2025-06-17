import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function IndexPage() {
  // รับ roomid จาก query param
  const params = new URLSearchParams(useLocation().search);
  const roomid = params.get("roomid") || "nummy_tt"; // กรณีไม่มีให้ default หรือ redirect ออก

  // ป้องกันกรณีที่ไม่มี roomid
  if (!roomid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl px-8 py-12 w-full max-w-md text-center">
          <h2 className="text-xl text-red-600">กรุณาเข้าผ่านลิงก์ที่มี roomid</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 to-pink-100">
      <div className="bg-white rounded-2xl shadow-xl px-8 py-12 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">
          TikTok Live Game Studio
        </h1>
        <ul className="space-y-4">
          <li>
            <Link
              to={`/control?roomid=${encodeURIComponent(roomid)}`}
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl shadow transition"
            >
              🛠️ Control Panel
            </Link>
          </li>
          <li>
            <Link
              to={`/game?roomid=${encodeURIComponent(roomid)}`}
              className="block w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl shadow transition"
            >
              🎮 Game
            </Link>
          </li>
          <li>
            <Link
              to={`/game3?roomid=${encodeURIComponent(roomid)}`}
              className="block w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl shadow transition"
            >
              🏆 Game 3
            </Link>
          </li>
          <li>
            <Link
              to={`/chat?roomid=${encodeURIComponent(roomid)}`}
              className="block w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl shadow transition"
            >
              💬 Chat
            </Link>
          </li>
          <li>
            {/* ลิงก์สำหรับกลับหน้า connect หรือหน้าอื่น */}
            <Link
              to="/connect"
              className="block w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl shadow transition"
            >
              🔗 Connect TikTok
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
