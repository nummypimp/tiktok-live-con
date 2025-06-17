// Game2Screen.js
import React, { useEffect, useState } from 'react';
import Countdown from './Countdown';

export default function Game2Screen({ socket }) {
  const [countdown, setCountdown] = useState(true);
  const [round, setRound] = useState(1);
  const [eliminated, setEliminated] = useState(null);
  const [survivors, setSurvivors] = useState([]);
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    socket.on('game-2-result', (data) => {
      setEliminated(data.eliminated);
      setSurvivors(data.survivors);
      setRound(data.round);
    });

    socket.on('game-2-finish', (finalWinners) => {
      setWinners(finalWinners);
    });

    return () => {
      socket.off('game-2-result');
      socket.off('game-2-finish');
    };
  }, [socket]);

  return (
    <div>
      <h2>เกมที่ 2: รอบที่ {round}</h2>
      {countdown && <Countdown seconds={60} onFinish={() => setCountdown(false)} />}

      {!countdown && eliminated && (
        <>
          <p>ตกรอบ: <strong>{eliminated}</strong></p>
          <p>ผู้รอด: {survivors.length} คน</p>
        </>
      )}

      {winners.length > 0 && (
        <div>
          <h3>ผู้ชนะสุดท้าย:</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {winners.map((u, i) => (
              <div key={i} style={{ margin: 10, textAlign: 'center' }}>
                <img src={u.avatar} alt={u.id} width={60} style={{
                  border: '3px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  objectFit: 'cover'
                }} />
                <div>{u.nickname}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
