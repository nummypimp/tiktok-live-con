import React from "react";
import { Link } from "react-router-dom";

export default function IndexPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 to-pink-100">
      <div className="bg-white rounded-2xl shadow-xl px-8 py-12 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">
          TikTok Live Game Studio
        </h1>
        <ul className="space-y-4">
           <li>
            <Link
              to="/login"
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl shadow transition"
            >
              🛠️ login
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard"
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl shadow transition"
            >
              🛠️ dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/control"
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl shadow transition"
            >
              🛠️ Control Panel
            </Link>
          </li>
          <li>
            <Link
              to="/connect"
              className="block w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl shadow transition"
            >
              🔗 Connect TikTok
            </Link>
          </li>
          <li>
            <Link
              to="/game"
              className="block w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl shadow transition"
            >
              🎮 Game
            </Link>
          </li>
          <li>
            <Link
              to="/game3"
              className="block w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl shadow transition"
            >
              🏆 Game 3
            </Link>
          </li>
          <li>
            <Link
              to="/chat"
              className="block w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl shadow transition"
            >
              💬 Chat
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
