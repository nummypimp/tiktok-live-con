// Countdown.js
import React, { useEffect, useState } from 'react';

export default function Countdown({ seconds, onFinish }) {
  const [count, setCount] = useState(seconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          clearInterval(interval);
          onFinish?.();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <h3 style={{ fontSize: '2rem', color: 'red' }}>
      เริ่มใน {count} วินาที
    </h3>
  );
}
