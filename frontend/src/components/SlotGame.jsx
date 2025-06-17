import React, { useState } from "react";
import "./SlotMachine.css";

// รับ players เป็น props หรือ state
// สมมติ external ส่ง players มาแบบนี้
const demoPlayers = Array(24).fill(0).map((_, i) => ({
  id: i + 1,
  nickname: `Player ${i + 1}`,
  avatarUrl: `https://i.pravatar.cc/80?img=${(i % 70) + 1}`,
}));

// shuffle ฟังก์ชัน
function shuffle(array) {
  return array.map(a => [Math.random(), a])
    .sort((a, b) => a[0] - b[0])
    .map(a => a[1]);
}

// คำนวณ row/col อัตโนมัติ (ตัวอย่าง: 3 แถว, n คอลัมน์/วงล้อ ตามจำนวนผู้เล่น)
function getSlotMatrix(players, rowCount = 3) {
  const shuffled = shuffle(players);
  const colCount = Math.ceil(shuffled.length / rowCount);
  const matrix = Array(rowCount)
    .fill(0)
    .map((_, row) => shuffled.slice(row * colCount, (row + 1) * colCount));
  return matrix;
}

export default function SlotMachine({ players = demoPlayers, rowCount = 3 }) {
  const [showResult, setShowResult] = useState(false);
  const [resultIdx, setResultIdx] = useState(-1);
  const matrix = getSlotMatrix(players, rowCount);

  // Start spin (สุ่มผลลัพธ์ 1 index)
  const handleSpin = () => {
    setShowResult(false);
    const allIndexes = matrix.flatMap((row, i) => row.map((_, j) => [i, j]));
    const winnerIdx = Math.floor(Math.random() * allIndexes.length);
    setTimeout(() => {
      setShowResult(true);
      setResultIdx(winnerIdx);
    }, 1500);
  };

  // หา index ที่ได้รางวัล (กรณีโชว์ไฮไลต์)
  const getSlotClass = (row, col, idx) => {
    if (!showResult) return "slot";
    const flatIndex = matrix
      .slice(0, row)
      .reduce((acc, r) => acc + r.length, 0) + col;
    return flatIndex === resultIdx ? "slot slot-winner" : "slot";
  };

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${rowCount}, 90px)`,
          gap: 8,
        }}
      >
        {matrix.map((row, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${row.length}, 90px)`,
              gap: 8,
            }}
          >
            {row.map((player, colIdx) => (
              <div
                key={player.id}
                className={getSlotClass(rowIdx, colIdx, player.id)}
                style={{
                  width: 90,
                  height: 80,
                  background: "#fff",
                  border: "2px solid #000",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.96,
                  transition: "0.3s",
                  position: "relative",
                }}
              >
                <img
                  src={player.avatarUrl}
                  alt={player.nickname}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    border: "2px solid #ddd",
                    objectFit: "cover",
                    marginBottom: 4,
                  }}
                />
                <span style={{ fontSize: 13 }}>{player.nickname}</span>
                {/* เพิ่มเลขลำดับหรือ id */}
              </div>
            ))}
          </div>
        ))}
      </div>

      <button className="go" style={{ margin: 18 }} onClick={handleSpin}>
        Spin (สุ่มผู้โชคดี)
      </button>
    </div>
  );
}
