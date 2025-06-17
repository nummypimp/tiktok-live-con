import React, { useEffect, useState } from 'react';

import RegisterScreen from './RegisterScreen';
import Game1Screen from './Game1Screen';
import Game2Screen from './Game2Screen';
import socket from './socket';

export default function GamePage() {
  const [stage, setStage] = useState('register');
  const [users, setUsers] = useState([]);
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    socket.on('register-start', () => {
      setStage('register');
      setUsers([]);
    });

    socket.on('user-registered', user => setUsers(prev => [...prev, user]));
    socket.on('game-1-start', () => {
      setStage('game1');
      setWinners([]);
    });
    socket.on('round1-winner', user => setWinners(prev => [...prev, user]));
    socket.on('game-2-start', () => setStage('game2'));
    socket.on('game-reset', () => {
      setStage('register');
      setUsers([]);
      setWinners([]);
    });
  }, []);

  return (
    <div>
      {stage === 'register' && <RegisterScreen users={users} />}
      {stage === 'game1' && <Game1Screen winners={winners} />}
      {stage === 'game2' && <Game2Screen socket={socket} />}
    </div>
  );
}
