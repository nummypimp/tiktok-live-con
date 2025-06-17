import React, { useState, useEffect } from "react";
import socket from "./socket";

export default function AdminSlot() {
  const [isOpen, setIsOpen] = useState(false);
  const [acceptTime, setAcceptTime] = useState(20); // ค่า default 20 วิ

  useEffect(() => {
    const listener = (data) => setIsOpen(data.accepting);
    socket.on("register-status", listener);

    // ฟังเวลารับสมัครจาก server (กรณี reload/คนอื่นตั้ง)
    const configListener = (cfg) => {
      if (cfg && typeof cfg.acceptTime === "number") setAcceptTime(cfg.acceptTime);
    };
    socket.on("register-config", configListener);

    // ขอดึงค่า config ปัจจุบันตอน mount
    socket.emit("get-register-config");

    return () => {
      socket.off("register-status", listener);
      socket.off("register-config", configListener);
    };
  }, []);

  const handleOpen = () => socket.emit("open-register", { acceptTime });
  const handleClose = () => socket.emit("close-register");
  const handleReset = () => socket.emit("reset-game");
  //const handleReset = () => socket.emit("reset-all");
  const handleSave = () => socket.emit("save-register-config", { acceptTime: +acceptTime });

  return (
    <div style={{ margin: 18, padding: 14, background: "#f6faff", borderRadius: 8 }}>
      <b>Admin Control:</b>
      <div style={{ margin: "12px 0" }}>
        <label>
          <span>ระยะเวลารับสมัคร (วินาที): </span>
          <input
            type="number"
            min={5}
            max={300}
            value={acceptTime}
            onChange={e => setAcceptTime(Math.max(5, Math.min(300, +e.target.value)))}
            style={{ width: 70, fontSize: 16, marginRight: 8 }}
          />
        </label>
        <button onClick={handleSave} style={{ marginLeft: 8 }}>บันทึก</button>
      </div>
      <button onClick={handleOpen} disabled={isOpen} style={{ margin: 8 }}>
        เปิดรับผู้เล่น
      </button>
      <button onClick={handleClose} disabled={!isOpen} style={{ margin: 8 }}>
        ปิดรับผู้เล่น
      </button>
      <button onClick={handleReset} style={{ margin: 8, background: "#fff2f2", color: "#b00" }}>
        รีเซ็ตเริ่มใหม่
      </button>
      <div>
        สถานะ:{" "}
        {isOpen ? <span style={{ color: "#090" }}>เปิดรับ</span> : <span style={{ color: "#888" }}>ปิดรับ</span>}
      </div>
    </div>
  );
}
