import React, { useEffect, useState } from 'react';
import AdminSlot from "./AdminSlot";
import PlayerLobbyAndSlotMachine from "./PlayerLobbyAndSlotMachine2";

export default function SlotGameWrapper() {  

  // ส่ง players ไป SlotMachine
  return (
    <div>
      <AdminSlot />
      <PlayerLobbyAndSlotMachine />
    </div>
  );
  // return <SlotMachine players={players} />;
}
