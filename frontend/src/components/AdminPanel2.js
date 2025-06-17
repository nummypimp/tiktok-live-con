
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from "axios";
import socket from './socket';

export default function AdminPanel() {
  const [scores, setScores] = useState([]);

  


   const post = (url, body) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

  useEffect(() => {
    socket.on('score-list', (data) => {
      setScores(data);
    });
  }, []);

  const handleStart = () => {
    socket.emit('admin-start-game');
  };

  const handleReset = () => {
    socket.emit('admin-reset-game');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-4 rounded-xl shadow text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">แผงควบคุมแอดมิน</h2>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => post('/admin/start-game-3')}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            เริ่มเกม
          </button>
          <button
            onClick={() => post('/admin/reset-game-3')}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            รีเซ็ต
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="text-xl font-bold mb-3 text-gray-700 text-center">อันดับผู้เล่น</h3>
        <ul className="space-y-3">
          <AnimatePresence>
            {scores.map((user, index) => (
              <motion.li
                key={user.uniqueId}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-4 p-2 bg-gray-50 rounded-lg shadow-sm"
              >
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt={user.nickname}
                    className="w-14 h-14 rounded-full border-2 border-white shadow"
                  />
                  <span className="absolute -top-2 -left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-base">{user.nickname}</div>
                  <div className="text-xs text-gray-500">{user.uniqueId}</div>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {user.score}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
