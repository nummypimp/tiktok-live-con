import React, { useEffect, useState, useRef } from "react";

const WINNER_COUNT = 5;           // จำนวนผู้ชนะทั้งหมด (แก้ได้)
const FIRST_SPIN_TIME = 1;        // คนแรก 1 วินาที
const SECOND_SPIN_TIME = 120;     // คนที่สอง 120 วินาที
const NEXT_SPIN_TIME = 20;        // คนที่ 3+ 20 วินาที

export default function SlotMachine({ players = [] }) {
  const [spinningIndex, setSpinningIndex] = useState(-1); // -1 = ยังไม่เริ่ม, 0 = ช่องแรก
  const [winners, setWinners] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [status, setStatus] = useState("waiting"); // "waiting" | "countdown" | "spinning" | "finished"
  const timerRef = useRef();

  // กำหนดเวลารอของแต่ละคน
  function getSpinTime(idx) {
    if (idx === 0) return FIRST_SPIN_TIME;
    if (idx === 1) return SECOND_SPIN_TIME;
    return NEXT_SPIN_TIME;
  }

  // เมื่อครบ 8 คน เริ่ม logic
  useEffect(() => {
    if (players.length >= 8 && spinningIndex === -1) {
      setSpinningIndex(0);
      setCountdown(getSpinTime(0));
      setStatus("countdown");
    }
    if (players.length < 8) {
      handleReset();
    }
    // eslint-disable-next-line
  }, [players.length]);

  // นับถอยหลังสำหรับแต่ละช่อง
  useEffect(() => {
    if (spinningIndex === -1 || winners.length >= WINNER_COUNT) {
      clearInterval(timerRef.current);
      return;
    }
    if (status === "countdown") {
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setStatus("spinning");
            spinCurrentSlot(spinningIndex);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [spinningIndex, status, winners.length]);

  // หลังสุ่มแต่ละคนเสร็จ
  function spinCurrentSlot(index) {
    // สุ่มผู้ชนะ (ไม่ซ้ำ)
    let winner;
    let remain = players.filter(
      (p) => !winners.some((w) => w.uniqueId === p.uniqueId)
    );
    if (remain.length > 0) {
      winner = remain[Math.floor(Math.random() * remain.length)];
    } else {
      winner = players[Math.floor(Math.random() * players.length)];
    }
    setTimeout(() => {
      setWinners(prev => [...prev, winner]);
      if (index + 1 < WINNER_COUNT) {
        setSpinningIndex(index + 1);
        setCountdown(getSpinTime(index + 1));
        setStatus("countdown");
      } else {
        setStatus("finished");
        setSpinningIndex(-1);
      }
    }, 1200); // เวลาโชว์ effect (1.2 วิ)
  }

  function handleReset() {
    setSpinningIndex(-1);
    setWinners([]);
    setCountdown(0);
    setStatus("waiting");
    clearInterval(timerRef.current);
  }

  // UI แสดงสถานะ
  let message = "";
  if (status === "waiting") {
    message = players.length < 8
      ? "รอผู้เล่นครบ 8 คนขึ้นไป..."
      : "กำลังเตรียมนับถอยหลัง";
  } else if (status === "countdown") {
    message = `จะสุ่มผู้โชคดีลำดับที่ ${spinningIndex + 1} ในอีก ${countdown} วินาที`;
  } else if (status === "spinning") {
    message = `กำลังสุ่มผู้โชคดีลำดับที่ ${spinningIndex + 1} ...`;
  } else if (status === "finished") {
    message = "สุ่มผู้โชคดีครบแล้ว!";
  }

  return (
    <div>
      <div className="text-center text-lg my-4 font-bold text-blue-700">
        {message}
      </div>

      {/* แถวแสดงผลผู้โชคดี */}
      <div className="flex justify-center gap-4 mb-8">
        {Array.from({ length: WINNER_COUNT }).map((_, idx) => (
          <div key={idx}
            className={`w-[90px] h-[100px] border-2 rounded-lg flex flex-col items-center justify-center shadow
              ${winners[idx] ? "border-yellow-400 bg-yellow-100" : "border-gray-300 bg-white"}
            `}
          >
            {winners[idx] ? (
              <img
                src={winners[idx]?.profilePictureUrl || winners[idx]?.avatarUrl || "/avatar-default.webp"}
                alt={winners[idx]?.nickname || ""}
                className="w-[54px] h-[54px] rounded-full border-2 border-gray-400 mb-2"
              />
            ) : (
              <div className="w-[54px] h-[54px] rounded-full border-2 border-gray-200 mb-2 bg-gray-50"></div>
            )}
            <div className="text-xs text-center text-yellow-700 font-bold">
              {winners[idx]?.nickname || `ผู้โชคดีลำดับที่ ${idx + 1}`}
            </div>
          </div>
        ))}
      </div>

      {/* แถวล่าง: รูปผู้เล่น */}
      {players.length > 8 && (
        <div
          className="
            grid grid-cols-8 gap-2 mx-auto mb-6 max-w-[760px] overflow-hidden
          "
        >
          {players.map((p, idx) => (
            <div
              key={p.uniqueId || idx}
              className="w-[90px] h-[100px] border-2 border-gray-300 rounded-[10px] bg-white shadow flex flex-col items-center justify-center"
            >
              <img
                src={p.profilePictureUrl || p.avatarUrl || "/avatar-default.webp"}
                alt={p.nickname}
                className="w-[80px] h-[80px] rounded-xl border-2 border-gray-400 mb-0"
              />
              <div className="hidden font-normal text-[13px] text-gray-800 text-center">
                {p.nickname}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ปุ่มรีเซ็ต */}
      <div className="text-center mt-4">
        <button
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
          onClick={handleReset}
        >
          รีเซ็ต
        </button>
      </div>
    </div>
  );
}
