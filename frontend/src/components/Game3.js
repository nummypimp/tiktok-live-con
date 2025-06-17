import { useEffect, useState } from 'react';
import socket from './socket';

export default function Game3() {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    socket.on('score-list', (data) => {
      setScores(data);
    });
  }, []);

  if (scores.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        ยังไม่มีผู้เล่นในระบบ
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-3 md:grid-cols-5 gap-4 justify-items-center">
      {scores.map((user) => (
        <img
          key={user.uniqueId}
          src={user.avatar}
          alt={user.nickname}
          className="w-20 h-20 rounded-full border-2 border-white shadow"
        />
      ))}
    </div>
  );
}