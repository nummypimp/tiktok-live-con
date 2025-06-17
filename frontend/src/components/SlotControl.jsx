import React, { useState } from "react";

export default function SlotControl({ onStart }) {
  const [timeLimit, setTimeLimit] = useState(30);

  const handleStart = () => {
    if (onStart) onStart(timeLimit);
  };

  return (
    <div className="p-4 border rounded mb-4 bg-gray-100">
      <h2 className="text-lg font-semibold mb-2">Admin Control</h2>
      <div className="flex items-center gap-2">
        <label>ระยะเวลาเปิดรับ (วินาที):</label>
        <input
          type="number"
          value={timeLimit}
          onChange={e => setTimeLimit(Number(e.target.value))}
          className="border p-1 rounded w-20"
        />
        <button onClick={handleStart} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
          เริ่มเกม
        </button>
      </div>
    </div>
  );
}