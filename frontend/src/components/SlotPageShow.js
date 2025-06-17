import React, { useEffect, useState } from 'react';
import SlotMachine from "./SlotMachine";
import socket from './socket';


export default function SlotPageShow() {  
const [pool, setPool] = useState([]);

useEffect(() => {
    
    socket.emit('get-draw-pool');
    socket.on('draw-pool', (data) => {
      setPool(data);
    });
    socket.emit('get-draw-pool');
   // return () => socket.off('draw-pool');
  }, []);
    const handleClose = () => {
        socket.emit("close-register"); 
        socket.emit("startSpin");
        
    };
  const getPool = () => {
    socket.emit('get-draw-pool');
    socket.on('draw-pool', (data) => {
      setPool(data);
    });
  };
  // ส่ง players ไป SlotMachine
  return (
    <div>
        <button onClick={getPool} style={{ margin: 8 }}>
        รับผู้เล่น
      </button>
      <button onClick={handleClose} style={{ margin: 8 }}>
        ปิดรับรันระบบ
      </button>
      <SlotMachine players={pool} />      
    </div>
  );
  // return <SlotMachine players={players} />;
}
