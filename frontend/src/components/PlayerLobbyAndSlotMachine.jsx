import React, { useEffect, useState } from "react";
import socket from "./socket";
import SlotMachine from "./SlotMachine";

function shuffle(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function PlayerLobbyAndSlotMachine() {
  const [acceptingPlayers, setAcceptingPlayers] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameReady, setGameReady] = useState(false);
  const [pool, setPool] = useState([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [totalChance, setTotalChance] = useState(0);

  // ฟังสถานะเปิด/ปิดจาก server
  useEffect(() => {
    const statusListener = (data) => {
      setAcceptingPlayers(data.accepting);
      // เมื่อปิดรับ ให้เตรียมพร้อมเล่นเกม
      if (!data.accepting && pool.length > 0) setGameReady(true);
      else setGameReady(false);
    };
    socket.on("register-status", statusListener);
    return () => socket.off("register-status", statusListener);
    // eslint-disable-next-line
  }, [pool.length]);

  // ฟังเพิ่ม player เฉพาะช่วงเปิดรับ
  useEffect(() => {
    if (!acceptingPlayers) return;
    setPlayers([]); // reset เมื่อเริ่มรอบใหม่
     const listener = ({ list, pool, totalPlayers, totalChance }) => {
      setPlayers(list || []);
      setPool(pool || []);
      setTotalPlayers(totalPlayers || 0);
      setTotalChance(totalChance || 0);
    };
    socket.on("player-list", listener);
    return () => socket.off("draw-pool", listener);
  }, [acceptingPlayers]);

  // ถ้า gameReady → โชว์ SlotMachine
  return (
    <div>
      <div style={{ margin: 12 }}>
        <b>สถานะ:</b>{" "}
        {acceptingPlayers ? (
          <span style={{ color: "#0b0" }}>กำลังเปิดรับผู้เล่น</span>
        ) : (
          <span style={{ color: "#555" }}>ปิดรับสมัคร</span>
        )}
      </div>
      <div>
  <b>จำนวนผู้เล่น:</b> {pool.length}
  <ul
    style={{
      maxHeight: 150,
      overflowY: "auto",
      padding: 0,
      margin: "8px 0",
      listStyle: "none",
      display:"none"
    }}
  >
   
    {shuffle(pool).map((p, i) => (
      <li key={p.uniqueId || i} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
        <img src={p.profilePictureUrl} alt={p.nickname}
          width={28}
          style={{ borderRadius: 14, marginRight: 6, verticalAlign: "middle" }}
        />
        {p.nickname}
      </li>
    ))}
  </ul>
</div>

      {/* เมื่อปิดรับสมัครแล้ว ให้โชว์ SlotMachine */}
      { /*!acceptingPlayers && gameReady && pool.length > 0 && ( */
       pool.length > 0 && (
        <div>
          <hr />
          <SlotMachine players={shuffle(pool)} />
        </div>
      )}
    </div>
  );
}
