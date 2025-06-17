import React, { useEffect, useState } from 'react';

import Game3Screen from './Game3Screen';

import socket from './socket';

export default function Game3Page() {
const [scores, setScores] = useState([]);

useEffect(() => {
    socket.on('score-list', (data) => {
      setScores(data);
    });

    
  }, []);

  return (
    <div>
       <Game3Screen scores={scores} />
    </div>
  );
}
