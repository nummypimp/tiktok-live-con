import React, { useState } from "react";
import "./Slot3D.css"; // เอา CSS ไปไว้ที่นี่

const SLOTS_PER_REEL = 12; // หรือ players.length ก็ได้
const REEL_RADIUS = 150;

function shuffle(array) {
  // Fisher-Yates shuffle
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Slot3D({ players, winnerCount = 3 }) {
  const [reelSeed, setReelSeed] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winners, setWinners] = useState([]);
  const slotCount = players.length;

  // จัดเรียง slot, random ผู้ชนะ, หมุนวงล้อ
  const handleSpin = () => {
    setSpinning(true);
    const shuffled = shuffle(players);
    // เลือกผู้ชนะ N คน
    const winnerIdxArr = Array.from({length: slotCount}, (_, i) => i);
    const winnerIndexes = shuffle(winnerIdxArr).slice(0, winnerCount);

    setTimeout(() => {
      setWinners(winnerIndexes);
      setReelSeed(seed => seed + Math.floor(Math.random() * 10000));
      setSpinning(false);
    }, 1600); // ตรงนี้คือเวลา animation (กำหนดตาม css)
  };

  // ใช้ random ผลลัพธ์ใหม่ทุกครั้ง
  const currentSlots = shuffle(players);

  // 3D style/slot
  const slotAngle = 360 / slotCount;

  return (
    <div style={{ textAlign: "center" }}>
      <div
        className="reel3d"
        style={{
          transform: `rotateX(${spinning ? 1440 : 0}deg)`,
          transition: spinning ? "transform 1.5s cubic-bezier(.4,2.5,.7,.9)" : "none",
        }}
      >
        {currentSlots.map((p, i) => (
          <div
            className={`slot3d${winners.includes(i) ? " slot3d-winner" : ""}`}
            key={p.id}
            style={{
              transform: `rotateX(${i * slotAngle}deg) translateZ(${REEL_RADIUS}px)`,
            }}
          >
            <img src={p.avatarUrl} alt="" style={{
              width: 52, height: 52, borderRadius: "50%", border: "2px solid #fff", marginBottom: 5
            }} />
            <div style={{ fontSize: 13 }}>{p.nickname}</div>
          </div>
        ))}
      </div>
      <button
        className="go"
        disabled={spinning}
        onClick={handleSpin}
        style={{ margin: 24 }}
      >
        {spinning ? "Spinning..." : `สุ่มผู้ชนะ ${winnerCount} คน`}
      </button>
      <div style={{ margin: 16 }}>
        {winners.length > 0 && (
          <b>
            Winner:{" "}
            {winners.map(idx => currentSlots[idx]?.nickname || "-").join(", ")}
          </b>
        )}
      </div>
    </div>
  );
}
