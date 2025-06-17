import React, { useEffect, useRef, useState } from "react";
import socket from "./socket"; // สมมุติ import client ที่ connect ไว้

export default function PlayerLobby({ onFinish }) {
  const [players, setPlayers] = useState([]);
  const [acceptingPlayers, setAcceptingPlayers] = useState(false);
  const [timer, setTimer] = useState(20);
  const timerRef = useRef();

  // เริ่มรับเมื่อกดปุ่ม
  const startAccepting = () => {
    setPlayers([]); // clear รายชื่อเก่า
    setAcceptingPlayers(true);
    setTimer(20);

    // นับถอยหลัง
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setAcceptingPlayers(false);
          if (onFinish) onFinish(players); // callback (optional)
        }
        return prev - 1;
      });
    }, 1000);
  };

  // รับ socket เฉพาะตอนเปิดรับ
  useEffect(() => {
    if (!acceptingPlayers) return;
    /*const listener = (player) => {
      setPlayers(prev =>
        prev.some(p => p.uniqueId === player.uniqueId)
          ? prev
          : [...prev, player]
      );
    }; */
    const listener = (player) => {
    setPlayers(prev => [...prev, player]);
        };
    socket.on("player-list", listener);
console.log('players',players); console.log("listener",listener);
    return () => socket.off("player-list", listener);
  }, [acceptingPlayers]);

  // cleanup timer
  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div>
      <button
        onClick={startAccepting}
        disabled={acceptingPlayers}
        style={{ fontSize: 18, margin: 12 }}
      >
        {acceptingPlayers ? "กำลังเปิดรับผู้เล่น..." : "เริ่มเปิดรับผู้เล่น (20 วินาที)"}
      </button>
      <div style={{ margin: 8 }}>
        {acceptingPlayers
          ? <span style={{ color: "#3c6", fontWeight: "bold" }}>รับสมัคร ({timer} วินาที)</span>
          : <span style={{ color: "#999" }}>ปิดรับสมัครแล้ว</span>}
      </div>
      <div>
        <strong>จำนวนผู้เล่น: {players.length}</strong>
        <ul>
          {players.map((p, idx) => (
         <li key={idx}>
              <img src={p.pictureprofileurl} alt={p.nickname}
                width={24} style={{ borderRadius: 12, marginRight: 6, verticalAlign: "middle" }} />
              {p.nickname}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
