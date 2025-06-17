8import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import gifts from './gifts.json';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [addType, setAddType] = useState(null);
  const [obsEvents, setObsEvents] = useState([]);
  const [isObsConnected, setIsObsConnected] = useState(false);

  const [selectedGiftId, setSelectedGiftId] = useState(null);
  const [giftScene, setGiftScene] = useState('main');
  const [giftSource, setGiftSource] = useState('');

  const [diamondAmount, setDiamondAmount] = useState(1);
  const [diamondScene, setDiamondScene] = useState('main');
  const [diamondSource, setDiamondSource] = useState('');

  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, "tiktokconfig"), where("email", "==", user.email));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const config = snapshot.docs[0].data();
        setObsEvents(config.obs || []);
        setIsObsConnected(true);
      }
    });
    return () => unsub();
  }, [user?.email]);

  const handleSaveGift = async () => {
    const gift = gifts.find((g) => g.id === parseInt(selectedGiftId));
    if (!gift) return alert('กรุณาเลือกของขวัญ');

    const newEvent = {
      event: 'gift',
      giftId: gift.id,
      giftname: gift.name,
      giftImage: gift.image,
      scene: giftScene,
      source: giftSource
    };
    await saveObsEvents([...obsEvents, newEvent]);
  };

  const handleSaveDiamond = async () => {
    const newEvent = {
      event: 'diamond',
      diamond: diamondAmount,
      scene: diamondScene,
      source: diamondSource
    };
    await saveObsEvents([...obsEvents, newEvent]);
  };

  const handleDeleteEvent = async (index) => {
    const newList = obsEvents.filter((_, i) => i !== index);
    await saveObsEvents(newList);
  };

  const saveObsEvents = async (updated) => {
    const q = query(collection(db, "tiktokconfig"), where("email", "==", user.email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docRef = doc(db, "tiktokconfig", snapshot.docs[0].id);
      await updateDoc(docRef, { obs: updated });
      setObsEvents(updated);
    }
  };

  return (
    <div className="mt-10 p-4 border rounded bg-gray-50">
      <h2 className="text-xl font-bold mb-2">สถานะ OBS:
        <span className={isObsConnected ? 'text-green-600' : 'text-red-500'}>
          {isObsConnected ? 'เชื่อมต่อสำเร็จ' : 'ยังไม่ได้เชื่อมต่อ'}
        </span>
      </h2>

      <button
        onClick={() => setAddType(null)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >+ เพิ่ม Event</button>

      {addType === null && (
        <div className="mb-4">
          <label className="block mb-1">เลือกประเภท Event:</label>
          <select
            className="border rounded p-2"
            onChange={(e) => setAddType(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>-- เลือก --</option>
            <option value="gift">ของขวัญ</option>
            <option value="diamond">จำนวนเหรียญ</option>
          </select>
        </div>
      )}

      {addType === 'gift' && (
        <div className="space-y-2">
          <label>ของขวัญ:</label>
          <select
            className="border p-2 rounded w-full"
            value={selectedGiftId || ''}
            onChange={(e) => setSelectedGiftId(e.target.value)}
          >
            <option value="" disabled>-- เลือกของขวัญ --</option>
            {gifts.map((gift) => (
              <option key={gift.id} value={gift.id}>{gift.name}</option>
            ))}
          </select>

          {selectedGiftId && (
            <div className="flex items-center gap-4 mt-2">
              <img
                src={gifts.find((g) => g.id === parseInt(selectedGiftId))?.image}
                alt="preview"
                width={80}
                height={80}
              />
              <span>{gifts.find((g) => g.id === parseInt(selectedGiftId))?.name}</span>
            </div>
          )}

          <label>Scene:</label>
          <select className="border p-2 rounded w-full" value={giftScene} onChange={(e) => setGiftScene(e.target.value)}>
            <option>main</option>
            <option>scene2</option>
          </select>

          <label>Source:</label>
          <select className="border p-2 rounded w-full" value={giftSource} onChange={(e) => setGiftSource(e.target.value)}>
            <option value="">-- เลือก --</option>
            <option value="heart overlay">heart overlay</option>
            <option value="text">text</option>
          </select>

          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSaveGift}>บันทึก</button>
        </div>
      )}

      {addType === 'diamond' && (
        <div className="space-y-2">
          <label>จำนวนเหรียญขั้นต่ำ:</label>
          <input type="number" className="border rounded p-2 w-full" value={diamondAmount} onChange={(e) => setDiamondAmount(parseInt(e.target.value))} />

          <label>Scene:</label>
          <select className="border p-2 rounded w-full" value={diamondScene} onChange={(e) => setDiamondScene(e.target.value)}>
            <option>main</option>
            <option>scene2</option>
          </select>

          <label>Source:</label>
          <select className="border p-2 rounded w-full" value={diamondSource} onChange={(e) => setDiamondSource(e.target.value)}>
            <option value="">-- เลือก --</option>
            <option value="diamondOverlay">diamondOverlay</option>
            <option value="text">text</option>
          </select>

          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSaveDiamond}>บันทึก</button>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold">รายการ OBS Events</h3>
        {obsEvents.map((evt, i) => (
          <div key={i} className="border p-2 rounded mt-2 flex justify-between items-center">
            <span>
              {evt.event === 'gift'
                ? <>🎁 {evt.giftname} <img src={evt.giftImage} width={40} className="inline ml-2" /></>
                : <>💎 เหรียญ ≥ {evt.diamond}</>}
            </span>
            <button onClick={() => handleDeleteEvent(i)} className="text-red-600 hover:underline">ลบ</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
