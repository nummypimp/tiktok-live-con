import React, { useState } from "react";

// กำหนดสัญลักษณ์และน้ำหนัก
const symbols = [
  { icon: "🍒", weight: 4 },
  { icon: "🍋", weight: 3 },
  { icon: "🍉", weight: 2 },
  { icon: "⭐", weight: 1 },
  { icon: "🔔", weight: 1 },
  { icon: "7️⃣", weight: 1 },
];

// ฟังก์ชันสุ่มแบบมีน้ำหนัก
function getRandomSymbol({ players=[]}) {
  const weightSum = symbols.reduce((a, b) => a + b.weight, 0);
  let r = Math.floor(Math.random() * weightSum);
  for (let s of symbols) {
    r -= s.weight;
    if (r < 0) return s.icon;
  }
  return symbols[0].icon;
}

function getInitialReels() {
  return [
    Array(3).fill().map(getRandomSymbol),
    Array(3).fill().map(getRandomSymbol),
    Array(3).fill().map(getRandomSymbol)
  ];
}

export default function RealSlotGame() {
  const [reels, setReels] = useState(getInitialReels());
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("");

  // ตรวจสอบรางวัลแนวนอน (บรรทัดกลาง)
  const checkWin = (reels) => {
    const midRow = [reels[0][1], reels[1][1], reels[2][1]];
    if (midRow.every(s => s === midRow[0])) {
      return "ชนะ! ได้ " + midRow[0];
    }
    return "ลองใหม่!";
  };

  // หมุนสล็อต
  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setMessage("");
    let spins = 20; // จำนวนรอบหมุน (จะเร็วแล้วช้าลง)
    let interval = 60;
    let timer = setInterval(() => {
      setReels(getInitialReels());
      spins--;
      if (spins <= 0) {
        clearInterval(timer);
        setSpinning(false);
        setMessage(checkWin(getInitialReels()));
      }
    }, interval);
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-gray-900 text-white rounded-xl shadow-lg p-6 font-[Prompt]">
      <div className="flex flex-col space-y-2 mb-4">
        {/* สล็อต 3 รีล 3 แถว */}
        {[0, 1, 2].map(row => (
          <div key={row} className="flex justify-center space-x-4 text-4xl">
            {[0, 1, 2].map(col => (
              <span key={col} className="w-14 h-14 flex items-center justify-center bg-gray-800 rounded-xl border border-gray-600">
                {reels[col][row]}
              </span>
            ))}
          </div>
        ))}
      </div>
      <button
        className="w-full py-3 mt-2 bg-pink-500 rounded-xl font-bold text-2xl hover:bg-pink-600 transition"
        onClick={spin}
        disabled={spinning}
      >
        {spinning ? "กำลังหมุน..." : "หมุนสล็อต"}
      </button>
      {message && <div className="text-center mt-4 text-xl">{message}</div>}
    </div>
  );
}
