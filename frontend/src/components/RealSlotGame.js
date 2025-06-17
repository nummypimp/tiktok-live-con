import React, { useState } from "react";

// สุ่มผู้เล่น 1 คน ตาม chance/weight
function getRandomPlayer(players) {
  if (!players.length) return null;
  const weightSum = players.reduce((a, b) => a + (b.chance || 1), 0);
  let r = Math.random() * weightSum;
  for (let p of players) {
    r -= (p.chance || 1);
    if (r < 0) return p;
  }
  return players[0];
}

function getInitialReels(players) {
  // 3 แถว 3 รีล
  return [
    Array(3).fill().map(() => getRandomPlayer(players)),
    Array(3).fill().map(() => getRandomPlayer(players)),
    Array(3).fill().map(() => getRandomPlayer(players)),
  ];
}

export default function PlayerSlotGame({ players = [] }) {
  const [reels, setReels] = useState(getInitialReels(players));
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("");

  // ตรวจสอบรางวัลแนวนอน (แถวกลาง)
  const checkWin = (reels) => {
    const row = [reels[0][1], reels[1][1], reels[2][1]];
    // เช็คว่าทั้ง 3 ช่องคือคนเดียวกัน (เทียบ uniqueId หรือ nickname)
    if (row.every(p => p && p.uniqueId === row[0].uniqueId)) {
      return `🎉 ชนะ! ผู้โชคดี: ${row[0].nickname}`;
    }
    return "ลองใหม่!";
  };

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setMessage("");
    let spins = 2000;
    let interval = 60;
    let timer = setInterval(() => {
      setReels(getInitialReels(players));
      spins--;
      if (spins <= 0) {
        clearInterval(timer);
        setSpinning(false);
        setReels((last) => {
          setMessage(checkWin(last));
          return last;
        });
      }
    }, interval);
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-gray-900 text-white rounded-xl shadow-lg p-6 font-[Prompt]">
      <div className="flex flex-col space-y-2 mb-4">
        {[0, 1, 2].map(row => (
          <div key={row} className="flex justify-center space-x-4">
            {[0, 1, 2].map(col => {
              const player = reels[col][row];
              return (
                <div key={col}
                  className="w-20 h-20 flex flex-col items-center justify-center bg-gray-800 rounded-xl border border-gray-600"
                >
                  {player ? (
                    <>
                      <img src={player.profilePictureUrl}
                        alt={player.nickname}
                        className="w-20 h-20 rounded-xl mb-1"
                      />
                      <span set-id="{}" className="text-xs hidden">{player.nickname}</span>
                      <span className="text-xs text-pink-300 hidden">
                        chance: {player.chance}
                      </span>
                    </>
                  ) : (
                    <span>?</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <button
        className="w-full py-3 mt-2 bg-pink-500 rounded-xl font-bold text-2xl hover:bg-pink-600 transition"
        onClick={spin}
        disabled={spinning || !players.length}
      >
        {spinning ? "กำลังหมุน..." : "หมุนสล็อต"}
      </button>
      {message && <div className="text-center mt-4 text-xl">{message}</div>}
    </div>
  );
}
