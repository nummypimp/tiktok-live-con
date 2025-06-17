import React, { useEffect, useState } from 'react';

const KeywordSettings = () => {
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');

  // โหลด keyword จาก server
  useEffect(() => {
    fetch('/api/keywords')
      .then(res => res.json())
      .then(data => setKeywords(data))
      .catch(err => console.error('Failed to load keywords:', err));
  }, []);

  // เพิ่ม keyword ใหม่
  const addKeyword = () => {
    const updatedKeywords = [...keywords, newKeyword];
    fetch('/api/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: updatedKeywords })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setKeywords(data.keywords);
          setNewKeyword('');
        }
      })
      .catch(err => console.error('Failed to update keywords:', err));
  };

  return (
    <div>
      <h2>จัดการ Keyword</h2>
      <ul>
        {keywords.map((k, index) => (
          <li key={index}>{k}</li>
        ))}
      </ul>
      <input
        type="text"
        value={newKeyword}
        onChange={e => setNewKeyword(e.target.value)}
        placeholder="เพิ่ม keyword"
      />
      <button onClick={addKeyword}>เพิ่ม</button>
    </div>
  );
};

export default KeywordSettings;
