import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from './firebase';
import { collection, addDoc, query, where, onSnapshot, getDocs, deleteDoc, doc,updateDoc  } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import gifts from './gifts.json';
import GiftDropdown from './GiftDropdown';
import socket from './socket';

const Dashboard = () => {
   const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const [uniqueIdInput, setUniqueIdInput] = useState("");
  const [savedUniqueId, setSavedUniqueId] = useState(sessionStorage.getItem("savedUniqueId") || "");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [addType, setAddType] = useState(null);
  const [obsEvents, setObsEvents] = useState([]);
  const [isObsConnected, setIsObsConnected] = useState(false);
  
  const [isUserConnected, setIsUserConnected] = useState(false);
  const [selectedGiftId, setSelectedGiftId] = useState(null);
  const [diamondAmount, setDiamondAmount] = useState(1);
  const [obsScenes, setObsScenes] = useState([]);
  const [obsSources, setObsSources] = useState([]);
  const [giftEvent, setGiftEvent] = useState({ sceneName: '', sourceName: '' });
  const [diamondEvent, setDiamondEvent] = useState({ sceneName: '', sourceName: '' });
  const [commentEvent, setCommentEvent] = useState({ keyword: '', sceneName: '', sourceName: '' });
  const [receiverUserId, setreceiverUserId] = useState("");
  const [receiveuniqueId, setreceiveuniqueId] = useState("");

  const obsWebSocket = useRef(null);

  const [historyList, setHistoryList] = useState([]);

useEffect(() => {
  if (!user?.email) return;

  const q = query(
    collection(db, "tiktokHistory"),
    where("email", "==", user.email)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => doc.data());
    setHistoryList(items);
  });

  return () => unsubscribe();
}, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;

    const q1 = query(collection(db, "tiktokUniqueIds"), where("email", "==", user.email));
    const unsub1 = onSnapshot(q1, (snapshot) => {
      if (!snapshot.empty) {
        const latestDoc = snapshot.docs[snapshot.docs.length - 1];
        const data = latestDoc.data();
        setSavedUniqueId(data.tiktokUniqueId);
        sessionStorage.setItem("savedUniqueId", data.tiktokUniqueId);
      } else {
        setSavedUniqueId("");
        sessionStorage.removeItem("savedUniqueId");
      }
    });

    const q2 = query(collection(db, "tiktokconfig"), where("email", "==", user.email));
    const unsub2 = onSnapshot(q2, (snapshot) => {
      if (!snapshot.empty) {
        const config = snapshot.docs[0].data();
        setObsEvents(config.obs || []);
        setIsObsConnected(true);
      }
    });

    handleconnect(sessionStorage.getItem("savedUniqueId"));
    connectOBS();

    return () => {
      obsWebSocket.current?.close();
      unsub1();
      unsub2();
    };
  }, [user?.email]);

  const connectOBS = () => {
    if (obsWebSocket.current) return;
    obsWebSocket.current = new WebSocket("ws://localhost:4455");

    obsWebSocket.current.onopen = () => {
      console.log("✅ Connected to OBS WebSocket");
      authenticateOBS();
      fetchSceneList();
    };

    obsWebSocket.current.onclose = obsWebSocket.current.onerror = () => {
      console.log("❌ OBS WebSocket Connection Failed");
      obsWebSocket.current = null;
      setTimeout(connectOBS, 1000);
    };
    obsWebSocket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.op === 7 && data.d?.requestType === "GetSceneItemList") {
        const sources = data.d.responseData?.sceneItems.map(item => item.sourceName) || [];
        setObsSources(sources);
      }
    };
  };

 const authenticateOBS = () => {
    obsWebSocket.current.send(JSON.stringify({ op: 1, d: { rpcVersion: 1 } }));
  };

  const fetchSceneList = () => {
    const requestId = `get-scenes-${Date.now()}`;
    const handleResponse = (event) => {
      const data = JSON.parse(event.data);
      if (data.op === 7 && data.d.requestId === requestId) {
        const scenes = data.d.responseData?.scenes || [];
        const sceneNames = scenes.map((s) => s.sceneName);
        setObsScenes(sceneNames);
        setObsSources([]);
        obsWebSocket.current.removeEventListener("message", handleResponse);
      }
    };
    obsWebSocket.current.addEventListener("message", handleResponse);
    obsWebSocket.current.send(JSON.stringify({
      op: 6,
      d: { requestType: "GetSceneList", requestId }
    }));
  };

 useEffect(() => {
    if (!giftEvent.sceneName || !obsWebSocket.current) return;
    const requestId = `get-sources-${Date.now()}`;
    obsWebSocket.current.send(JSON.stringify({
      op: 6,
      d: {
        requestType: "GetSceneItemList",
        requestId,
        requestData: { sceneName: giftEvent.sceneName }
      }
    }));
  }, [giftEvent.sceneName]);

  useEffect(() => {
    if (!diamondEvent.sceneName || !obsWebSocket.current) return;
    const requestId = `get-sources-${Date.now()}`;
    obsWebSocket.current.send(JSON.stringify({
      op: 6,
      d: {
        requestType: "GetSceneItemList",
        requestId,
        requestData: { sceneName: diamondEvent.sceneName }
      }
    }));
  }, [diamondEvent.sceneName]);

  useEffect(() => {
    if (!commentEvent.sceneName || !obsWebSocket.current) return;
    const requestId = `get-sources-${Date.now()}`;
    obsWebSocket.current.send(JSON.stringify({
      op: 6,
      d: {
        requestType: "GetSceneItemList",
        requestId,
        requestData: { sceneName: commentEvent.sceneName }
      }
    }));
  }, [commentEvent.sceneName]);

  const handleSaveComment = async () => {
  if (!commentEvent.keyword.trim()) return alert("กรุณาใส่คำที่ต้องตรวจจับ");

  const event = {
    event: 'comment',
    keyword: commentEvent.keyword.trim().toLowerCase(),
    scene: commentEvent.sceneName,
    source: commentEvent.sourceName
  };
  await saveObsEvents([...obsEvents, event]);
};


 const handleSaveGift = async () => {
  const gift = gifts.find((g) => g.id === selectedGiftId);

    if (!gift) return alert('กรุณาเลือกของขวัญ');
    const event = {
      event: 'gift',
      giftId: gift.id,
      giftname: gift.name,
      giftImage: gift.image,
      scene: giftEvent.sceneName,
      source: giftEvent.sourceName
    };
    await saveObsEvents([...obsEvents, event]);
  };

  const handleSaveDiamond = async () => {
    const event = {
      event: 'diamond',
      diamond: diamondAmount,
      scene: diamondEvent.sceneName,
      source: diamondEvent.sourceName
    };
    await saveObsEvents([...obsEvents, event]);
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

  const handleSave = async () => {
    try {
      if (!uniqueIdInput.trim()) {
        alert("กรุณากรอก UniqueId ก่อนบันทึก");
        return;
      }
  
      // 🔥 1. Disconnect (old uniqueId)
      if (savedUniqueId) {
        await handleDisconnect(savedUniqueId);
      }
  
      // 🔥 2. Delete old uniqueId from Firestore
      const q = query(
        collection(db, "tiktokUniqueIds"),
        where("email", "==", user.email)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(docItem =>
        deleteDoc(doc(db, "tiktokUniqueIds", docItem.id))
      );
      await Promise.all(deletePromises);
      console.log("✅ ลบ UniqueId เก่าจาก Firestore เรียบร้อยแล้ว");
  
      // 🔥 3. Remove sessionStorage
      sessionStorage.removeItem("savedUniqueId");
  
      // 🔥 4. Save new uniqueId to Firestore
      await addDoc(collection(db, "tiktokUniqueIds"), {
        userId: user?.uid || null,
        email: user?.email || null,
        tiktokUniqueId: uniqueIdInput.trim(),
        createdAt: new Date()
      });
      console.log("✅ บันทึก UniqueId ใหม่ใน Firestore เรียบร้อยแล้ว");
  
      // 🔥 5. Connect
      await fetch('/api/connect', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueId: uniqueIdInput.trim() })
      })
      .then((res) => res.json())
      .then((initial) => {
console.log(initial);

      });
      console.log("✅ ส่ง UniqueId ไป /api/connect สำเร็จแล้ว");
  
      // 🔥 6. Fetch TikTok API
      
    
  
      // ส่งคำขอสถานะไปยัง server
socket.emit("getstatus", { roomid: uniqueIdInput.trim() });

socket.once("getstatus", (data) => {
  if (!data || !data.dataconnection.id || !data.dataconnection.roomid) {
    alert("ไม่พบข้อมูลผู้ใช้จาก Server");
    return;
  }
setreceiverUserId(data.dataconnection.id);
setreceiveuniqueId(data.dataconnection.roomid);



  console.log("✅ รับข้อมูลจาก server:", data);

  // ทำต่อ: บันทึก config หรือ Firestore ตามโค้ดเดิมของคุณ
});



      // 🔥 7. Save or Update Config to Firestore
      const configQuery = query(
        collection(db, "tiktokconfig"),
        where("email", "==", user.email)
      );
      const configSnapshot = await getDocs(configQuery);
  
      const configData = {
        email: user.email,
        receiverUserId: receiverUserId,
        receiverUserName: receiveuniqueId,
        scene1: ["main", "test"],
        scene2: ["main", "test"],
        diamondThreshold: 1
      };
  
      if (!configSnapshot.empty) {
        // 🔄 Update
        const docRef = doc(db, "tiktokconfig", configSnapshot.docs[0].id);
        await updateDoc(docRef, configData);
        console.log("✅ อัปเดตข้อมูล TikTok Config สำเร็จแล้ว");
      } else {
        // ➕ Add
        await addDoc(collection(db, "tiktokconfig"), configData);
        console.log("✅ บันทึกข้อมูล TikTok Config ใหม่สำเร็จแล้ว");
      }
  
      // 🔥 8. Reset input
      setUniqueIdInput("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
await addDoc(collection(db, "tiktokHistory"), {
  email: user.email,
  uniqueId: uniqueIdInput.trim(),
  userId: receiverUserId,
  createdAt: new Date()
});
      
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      sessionStorage.clear();
      navigate('/');
    } catch (error) {
      console.error("❌ Logout failed:", error);
    }
  };
  
const handleconnect = async (id) => {
  try {
    await fetch('/api/connect', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uniqueId: id }),
    });
    console.log("✅ connected");

    // ตรวจสอบสถานะผ่าน socket
    socket.emit("getstatus", { roomid: id });

   

  } catch (error) {
    console.error("❌ connect ไม่สำเร็จ:", error);
  }
};

 useEffect(() => {
  if (savedUniqueId) {
    socket.emit("getstatus", { roomid: savedUniqueId });

    socket.removeAllListeners("getstatus"); // ✅ ป้องกันซ้อน
    socket.on("getstatus", (data) => {
      console.log("📡 socket status:", data);
      setIsUserConnected(data.online);
    });
  }
}, [savedUniqueId]);



  
  const handleDisconnect = async (id) => {
    try {
      await fetch('/api/disconnect', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueId: id }),
      });
      console.log("✅ Disconnected จาก uniqueId เก่าแล้ว");
    } catch (error) {
      console.error("❌ Disconnect ไม่สำเร็จ:", error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl">Dashboard</h1>

      {user && (
        <div className="mt-4">
          <p><strong>ชื่อผู้ใช้:</strong> {user.displayName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <img src={user.photoURL} alt="Profile" width={100} className="mt-2 rounded-full" />
        </div>
      )}

      <div className="mt-6">
        <p><strong>UniqueId ที่บันทึกไว้ล่าสุด:</strong> {savedUniqueId || "ยังไม่มีข้อมูล"} <span className={isUserConnected ? 'text-green-600 ml-2' : 'text-red-500 ml-2'}>
    {isUserConnected ? '🟢 ออนไลน์' : '🔴 ออฟไลน์'}
  </span></p>
      </div>

     <div className="mt-4">
      <label className="block mb-1 mt-4">เลือกจากประวัติที่เคยใช้:</label>
<select
  className="border rounded p-2 w-full"
  value={uniqueIdInput}
  onChange={(e) => setUniqueIdInput(e.target.value)}
>
  <option value="">-- เลือก --</option>
  {historyList.map((item, index) => (
    <option key={index} value={item.uniqueId}>
      {item.uniqueId} ({item.userId?.slice(0, 5)}...)
    </option>
  ))}
</select>

        <label htmlFor="uniqueIdInput" className="block mb-2 font-semibold">
          TikTok UniqueId
        </label>
        <input
          id="uniqueIdInput"
          type="text"
          value={uniqueIdInput}
          onChange={(e) => setUniqueIdInput(e.target.value)}
          placeholder="ใส่ TikTok UniqueId"
          className="border rounded p-2 w-full"
        />
        <button
          onClick={handleSave}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          บันทึก UniqueId
        </button>
        {saveSuccess && (
          <p className="mt-2 text-green-600">✅ บันทึก UniqueId สำเร็จแล้ว!</p>
        )}
      </div>

      <button onClick={handleLogout} className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Logout</button>

      <div className="mt-10 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-bold mb-2">สถานะ OBS:
          <span className={isObsConnected ? 'text-green-600' : 'text-red-500'}>
            {isObsConnected ? 'เชื่อมต่อสำเร็จ' : 'ยังไม่ได้เชื่อมต่อ'}
          </span>
        </h2>

        <button onClick={() => setAddType(null)} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">+ เพิ่ม Event</button>

        {addType === null && (
          <div className="mb-4">
            <label className="block mb-1">เลือกประเภท Event:</label>
            <select className="border rounded p-2" onChange={(e) => setAddType(e.target.value)} defaultValue="">
              <option value="" disabled>-- เลือก --</option>
              <option value="comment">ข้อความ</option>
               <option value="gift">ของขวัญ</option>
              <option value="diamond">จำนวนเหรียญ</option>
            </select>
          </div>
        )}

         
{addType === 'comment' && (
  <div className="space-y-2">
    <label>คำที่ต้องการตรวจจับในข้อความ:</label>
    <input
      type="text"
      className="border rounded p-2 w-full"
      value={commentEvent.keyword}
      onChange={(e) => setCommentEvent({ ...commentEvent, keyword: e.target.value })}
    />

    <label>Scene:</label>
    <select value={commentEvent.sceneName} onChange={(e) => setCommentEvent({ ...commentEvent, sceneName: e.target.value })}>
      <option value="">เลือก Scene</option>
      {obsScenes.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>

    <label>Source:</label>
    <select value={commentEvent.sourceName} onChange={(e) => setCommentEvent({ ...commentEvent, sourceName: e.target.value })}>
      <option value="">เลือก Source</option>
      {obsSources.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>

    <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSaveComment}>บันทึก</button>
  </div>
)}


        {addType === 'gift' && (
          <div className="space-y-2">
            <label>ของขวัญ:</label>
            <GiftDropdown onSelect={(gift) => setSelectedGiftId(gift.id)} />


         <label>Scene:</label>
      <select value={giftEvent.sceneName} onChange={(e) => setGiftEvent({ ...giftEvent, sceneName: e.target.value })}>
        <option value="">เลือก Scene</option>
        {obsScenes.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <label>Source:</label>
      <select value={giftEvent.sourceName} onChange={(e) => setGiftEvent({ ...giftEvent, sourceName: e.target.value })}>
        <option value="">เลือก Source</option>
        {obsSources.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSaveGift}>บันทึก</button>
          </div>
        )}

        {addType === 'diamond' && (
          <div className="space-y-2">
            <label>จำนวนเหรียญขั้นต่ำ:</label>
            <input type="number" className="border rounded p-2 w-full" value={diamondAmount} onChange={(e) => setDiamondAmount(parseInt(e.target.value))} />

            <label>Scene:</label>
      <select value={diamondEvent.sceneName} onChange={(e) => setDiamondEvent({ ...diamondEvent, sceneName: e.target.value })}>
        <option value="">เลือก Scene</option>
        {obsScenes.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <label>Source:</label>
      <select value={diamondEvent.sourceName} onChange={(e) => setDiamondEvent({ ...diamondEvent, sourceName: e.target.value })}>
        <option value="">เลือก Source</option>
        {obsSources.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSaveDiamond}>บันทึก</button>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-semibold">รายการ OBS Events</h3>
         {obsEvents.map((evt, i) => (
  <div key={i} className="border p-2 rounded mt-2 flex justify-between items-center">
    <span>
      {evt.event === 'gift' && (
        <>🎁 {evt.giftname} <img src={evt.giftImage} width={40} className="inline ml-2" /></>
      )}
      {evt.event === 'diamond' && (
        <>💎 เหรียญ ≥ {evt.diamond}</>
      )}
      {evt.event === 'comment' && (
        <>💬 คำว่า "{evt.keyword}"</>
      )}
    </span>
    <button onClick={() => handleDeleteEvent(i)} className="text-red-600 hover:underline">ลบ</button>
  </div>
))}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
