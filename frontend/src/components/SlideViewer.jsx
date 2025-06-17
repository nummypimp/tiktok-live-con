import React from 'react';

export default function SlideViewer({ slide }) {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 shadow-lg">
      <h1 className="text-2xl font-bold mb-2">{slide.title}</h1>
      <p className="text-gray-700 whitespace-pre-line">{slide.content}</p>
    </div>
  );
}
