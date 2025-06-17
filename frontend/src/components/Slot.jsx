import React, { useEffect, useRef } from 'react';
import './SlotMachine.css';

const SLOTS_PER_REEL = 12;
const REEL_RADIUS = 150;

const SlotMachine2 = () => {
  const rotateRef = useRef(null);
  const ringsRef = useRef([]);

  const createSlots = (ring, seed) => {
    const slotAngle = 360 / SLOTS_PER_REEL;
    ring.innerHTML = '';

    for (let i = 0; i < SLOTS_PER_REEL; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      const transform = `rotateX(${slotAngle * i}deg) translateZ(${REEL_RADIUS}px)`;
      slot.style.transform = transform;
      slot.innerHTML = `<p>${(seed + i) % 12}</p>`;
      ring.appendChild(slot);
    }
  };

  const getSeed = () => {
    return Math.floor(Math.random() * SLOTS_PER_REEL);
  };

  const spin = (timer) => {
    for (let i = 0; i < 5; i++) {
      const ring = ringsRef.current[i];
      if (!ring) continue;

      const oldClass = ring.className;
      const oldSeedMatch = oldClass.match(/spin-(\d+)/);
      const oldSeed = oldSeedMatch ? parseInt(oldSeedMatch[1]) : -1;

      let seed = getSeed();
      while (seed === oldSeed) {
        seed = getSeed();
      }

      ring.style.animation = `back-spin 1s, spin-${seed} ${timer + i * 0.5}s`;
      ring.className = `ring spin-${seed}`;
    }
  };

  const handleXrayToggle = (e) => {
    const isChecked = e.target.checked;
    if (rotateRef.current) {
      if (isChecked) {
        document.querySelectorAll('.slot').forEach(slot =>
          slot.classList.add('backface-on')
        );
        rotateRef.current.style.animation = 'tiltin 2s 1';
        setTimeout(() => {
          rotateRef.current?.classList.add('tilted');
        }, 2000);
      } else {
        rotateRef.current.style.animation = 'tiltout 2s 1';
        setTimeout(() => {
          rotateRef.current?.classList.remove('tilted');
          document.querySelectorAll('.slot').forEach(slot =>
            slot.classList.remove('backface-on')
          );
        }, 1900);
      }
    }
  };

  const handlePerspectiveToggle = () => {
    const stage = document.getElementById('stage');
    if (stage) {
      stage.classList.toggle('perspective-on');
      stage.classList.toggle('perspective-off');
    }
  };

  useEffect(() => {
    ringsRef.current.forEach(ring => {
      if (ring) {
        createSlots(ring, getSeed());
      }
    });
  }, []);

  return (
    <div id="stage" className="perspective-on">
      <div id="rotate" ref={rotateRef}>
        {[...Array(5)].map((_, idx) => (
          <div
            key={idx}
            className="ring"
            ref={el => (ringsRef.current[idx] = el)}
          ></div>
        ))}
      </div>
      <div>
        <button className="go" onClick={() => spin(60)}>Start spinning</button>
      </div>
      <div>
        <label>
          <input type="checkbox" id="xray" onChange={handleXrayToggle} />
          Show inner workings
        </label>
        <label>
          <input type="checkbox" id="perspective" onChange={handlePerspectiveToggle} />
          Toggle perspective
        </label>
      </div>
    </div>
  );
};

export default SlotMachine2;
