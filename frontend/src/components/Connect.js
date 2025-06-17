import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConnectForm from "./ConnectForm";
import UserList from "./UserList";
import socket from './socket';



export default function Connect() {
  const [users, setUsers] = useState([]);
  const [uniqueId, setUniqueId] = useState("");
  const [recentUsers, setRecentUsers] = useState([]);
   const navigate = useNavigate();

  // โหลด recent จาก localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("recentUsers") || "[]");
    setRecentUsers(stored);
  }, []);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('เชื่อมต่อ socket แล้ว:', socket.id);
    }); 

    socket.on("status", setUsers);
    fetch('/api/status').then(res => res.json()).then(setUsers);
    return () => socket.off("status", setUsers);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!uniqueId.trim()) return;
    // เพิ่ม uniqueId ไปยัง localStorage ถ้ายังไม่มี
    const stored = JSON.parse(localStorage.getItem("recentUsers") || "[]");
    if (!stored.includes(uniqueId.trim())) {
      stored.unshift(uniqueId.trim());
      localStorage.setItem("recentUsers", JSON.stringify(stored.slice(0, 15))); // เก็บ 5 ชื่อหลังสุด
      setRecentUsers(stored.slice(0, 15));
    }

    await fetch('/api/connect', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uniqueId: uniqueId.trim() }),
    });
    
    //navigate(`/room?roomid=${encodeURIComponent(uniqueId.trim())}`);
   // setUniqueId("");
    //window.location.reload(); // รีเฟรชหน้าใหม่
  };

  // ล็อกอินซ้ำจากรายชื่อเดิม
  const handleRecentLogin = async (id) => {
    setUniqueId(id);
    await fetch('/api/connect', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uniqueId: id }),
    });
    // navigate(`/room?roomid=${encodeURIComponent(id.trim())}`);
  //  window.location.reload(); // รีเฟรชหน้าใหม่
  };

  const handleDisconnect = async (id) => {
    await fetch('api/disconnect', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uniqueId: id }),
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">
          Connect TikTok Live User
        </h2>
        <ConnectForm uniqueId={uniqueId} setUniqueId={setUniqueId} onSubmit={handleAdd} />

        {recentUsers.length > 0 && (
          <div className="mb-4">
            <div className="text-gray-600 mb-1 text-sm">ล็อกอินล่าสุด:</div>
            <div className="flex flex-wrap gap-2">
              {recentUsers.map((id) => (
                <button
                  key={id}
                  className="bg-gray-200 hover:bg-blue-200 px-3 py-1 rounded-xl text-sm"
                  onClick={() => handleRecentLogin(id)}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        )}

        <UserList users={users} onDisconnect={handleDisconnect} />
      </div>
    </div>
  );
}
