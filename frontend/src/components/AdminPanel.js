import React from 'react';

export default function AdminPanel({ socket }) {
  const post = (url, body) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

  return (
    <div className=" top-3 left-3 bg-[#111] text-white p-4 rounded-xl z-[999] shadow-xl w-56">
      <h3 className="font-bold text-lg mb-2">แผงควบคุม Admin</h3>
      <div className="flex flex-col gap-2">
        <button
          className="bg-white text-black px-3 py-2 rounded-md hover:bg-gray-200 transition"
          onClick={() => post('/admin/start-register')}
        >
          เริ่มลงทะเบียน
        </button>
        <button
          className="bg-white text-black px-3 py-2 rounded-md hover:bg-gray-200 transition"
          onClick={() => post('/admin/stop-register')}
        >
          ปิดลงทะเบียน
        </button>
        <hr className="my-1 border-gray-600" />
        <button
          className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition"
          onClick={() => post('/admin/start-game-1')}
        >
          เริ่มเกมที่ 1 (ส่งอิโมจิ)
        </button>
        <hr className="my-1 border-gray-600" />
        <button
          className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition"
          onClick={() => post('/admin/start-game-2')}
        >
          เริ่มเกมที่ 2 (เลือกประตู)
        </button>
        <button
          className="bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-800 transition"
          onClick={() => post('/admin/finish-game-2-round')}
        >
          จบรอบเกมที่ 2
        </button>
        <hr className="my-1 border-gray-600" />
        <button
          className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-800 transition font-bold"
          onClick={() => post('/admin/reset-game')}
        >
          RESET ระบบ
        </button>
      </div>
    </div>
  );
}
