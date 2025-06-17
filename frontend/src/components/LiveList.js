import React, { useEffect, useState } from "react";
import socket from './socket';
import { Link } from "react-router-dom";

const LiveList = () => {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    socket.emit("getallroom");

    socket.on("getallroom", (res) => {
      const roomObj = res.data || {};
      const roomArray = Object.keys(roomObj).map((key) => ({
        uniqueId: key,
        ...roomObj[key],
      }));
      setRooms(roomArray);
    });

    return () => {
      socket.off("getallroom");
    };
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">🔴 คนที่กำลังไลฟ์</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rooms.map((room, index) => (
          <div key={index} className="border p-3 rounded shadow bg-white">
            <div className="font-semibold text-center mb-2">
              @{room.uniqueId}
            </div>
            <Link
              to={`/chat?roomid=${room.uniqueId}`}
              className="block bg-blue-600 text-white text-center py-1 rounded hover:bg-blue-700"
            >
              ▶️ เข้าห้องแชท
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveList;
