import React, { useState } from 'react';
import slides from '../data/lessons_tiktok_live_studio.json';
import SlideViewer from './SlideViewer';

export default function SlidePage() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => Math.min(i + 1, slides.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <SlideViewer slide={slides[index]} />
      <div className="flex gap-4">
        <button onClick={prev} disabled={index === 0} className="btn">ย้อนกลับ</button>
        <button onClick={next} disabled={index === slides.length - 1} className="btn">ถัดไป</button>
      </div>
    </div>
  );
}
