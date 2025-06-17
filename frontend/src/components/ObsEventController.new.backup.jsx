
// ✅ รวม OBS Event Logic + Firestore UI Config
// ต้องเชื่อมต่อ Firebase, OBS WebSocket, TikTok Event WebSocket

import React, { useState, useEffect, useRef } from "react";
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const ObsEventController = () => {
  const [status, setStatus] = useState("Connecting...");
  const [queueCount, setQueueCount] = useState(0);
  const [log, setLog] = useState("");
  const [config, setConfig] = useState({});
  const [sceneList, setSceneList] = useState([]);
  const [sourceList, setSourceList] = useState([]);
  const [customEvents, setCustomEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    type: "gift",
    giftId: 0,
    sceneName: "",
    sourceName: "",
    minDiamond: 1,
    maxDiamond: 9999
  });

  const eventQueue = useRef([]);
  const isProcessing = useRef(false);
  const websocket = useRef(null);
  const obsWebSocket = useRef(null);

  useEffect(() => {
    const userString = sessionStorage.getItem("user");
    if (!userString) {
      alert("กรุณา login ก่อน หรือ savedUniqueId ไม่ถูกต้อง");
      return;
    }
    const user = JSON.parse(userString);

    const fetchOrCreateConfig = async () => {
      try {
        const q = query(collection(db, "tiktokconfig"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          const configData = {
            receiverUserId: docData.receiverUserId,
            receiverUserName: docData.receiverUserName,
            scene1: docData.scene1,
            scene2: docData.scene2,
            diamondThreshold: docData.diamondThreshold,
          };
          setConfig(configData);
          logMessage(`โหลด config สำเร็จ: ${JSON.stringify(configData)}`);
        } else {
          const defaultConfig = {
            email: user.email,
            receiverUserId: "7045538699479778330",
            receiverUserName: "test",
            scene1: ["main", "test"],
            scene2: ["main", "test"],
            diamondThreshold: 1,
          };
          await addDoc(collection(db, "tiktokconfig"), defaultConfig);
          setConfig(defaultConfig);
          logMessage(`สร้าง config ใหม่สำเร็จ: ${JSON.stringify(defaultConfig)}`);
        }
      } catch (error) {
        console.error("โหลด/สร้าง config ไม่ได้:", error);
        alert("โหลด/สร้าง config ไม่ได้!");
      }
    };

    fetchOrCreateConfig();
    connectOBS();
    loadCustomEvents();

    return () => {
      websocket.current?.close();
      obsWebSocket.current?.close();
    };
  }, []);

  useEffect(() => {
    if (config.receiverUserName) connect();
  }, [config.receiverUserName]);

  const connect = () => {
    if (websocket.current) return;
    websocket.current = new WebSocket("ws://localhost:21213/");
    websocket.current.onopen = () => {
      setStatus(`Connected to Event Server ${config.receiverUserName}`);
    };
    websocket.current.onclose = websocket.current.onerror = () => {
      setStatus("Event Server Connection Failed");
      websocket.current = null;
      setTimeout(connect, 1000);
    };
    websocket.current.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        if (eventQueue.current.length >= 5) {
          logMessage("⚠️ Queue เต็มแล้ว (5) — รอให้ queue ว่างก่อน");
          return;
        }
        if (parsedData.data?.tikfinityUsername !== config.receiverUserName) {
          setStatus(`Different User Detected: ${config.receiverUserName}`);
        }
        logMessage("Received event: " + parsedData.event);

        if (parsedData.event === "gift" && parsedData.data.giftId === 7934) {
          eventQueue.current.push(() => heartMe(parsedData));
        }

        if (parsedData.event === "gift" &&
            parsedData.data.diamondCount >= config.diamondThreshold) {
          eventQueue.current.push(() => giftCost(parsedData));
        }

        customEvents.forEach((evt) => {
          const matchGift = evt.type === "gift" && parsedData.data.giftId === evt.giftId;
          const matchRange = evt.type === "range" &&
            parsedData.data.diamondCount >= evt.minDiamond &&
            parsedData.data.diamondCount <= evt.maxDiamond;

          if (parsedData.event === "gift" && (matchGift || matchRange)) {
            eventQueue.current.push(() =>
              new Promise((resolve) => {
                logMessage("🎯 Triggered Custom Event: " + JSON.stringify(evt));
                getSceneItemId(evt.sceneName, evt.sourceName, async (sceneItemId) => {
                  if (!sceneItemId) return resolve();
                  await toggleRabbitSource(evt.sceneName, sceneItemId, true);
                  await sleep(10000);
                  await toggleRabbitSource(evt.sceneName, sceneItemId, false);
                  resolve();
                });
              })
            );
          }
        });

        setQueueCount(eventQueue.current.length);
        if (!isProcessing.current) processQueue();
      } catch (err) {
        console.error("Error parsing event data:", err);
      }
    };
  };

  const connectOBS = () => {
    if (obsWebSocket.current) return;
    obsWebSocket.current = new WebSocket("ws://localhost:4455");
    obsWebSocket.current.onopen = () => {
      logMessage("Connected to OBS WebSocket");
      authenticateOBS();
      fetchSceneList();
    };
    obsWebSocket.current.onclose = obsWebSocket.current.onerror = () => {
      logMessage("OBS WebSocket Connection Failed");
      obsWebSocket.current = null;
      setTimeout(connectOBS, 1000);
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
        setSceneList(scenes.map((s) => s.sceneName));
        setSourceList([]);
        obsWebSocket.current.removeEventListener("message", handleResponse);
      }
    };
    obsWebSocket.current.addEventListener("message", handleResponse);
    obsWebSocket.current.send(JSON.stringify({
      op: 6, d: { requestType: "GetSceneList", requestId }
    }));
  };

  useEffect(() => {
    if (!newEvent.sceneName) return;
    const requestId = `get-sources-${Date.now()}`;
    const handleResponse = (event) => {
      const data = JSON.parse(event.data);
      if (data.op === 7 && data.d.requestId === requestId) {
        const sources = data.d.responseData?.sceneItems || [];
        setSourceList(sources.map((s) => s.sourceName));
        obsWebSocket.current.removeEventListener("message", handleResponse);
      }
    };
    obsWebSocket.current.addEventListener("message", handleResponse);
    obsWebSocket.current.send(JSON.stringify({
      op: 6,
      d: {
        requestType: "GetSceneItemList",
        requestId,
        requestData: { sceneName: newEvent.sceneName }
      }
    }));
  }, [newEvent.sceneName]);

  const getSceneItemId = (sceneName, sourceName, callback) => {
    const requestId = `get-scene-items-${Date.now()}`;
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.op === 7 && data.d.requestId === requestId) {
        const sceneItems = data.d.responseData?.sceneItems || [];
        const found = sceneItems.find((item) => item.sourceName === sourceName);
        callback(found?.sceneItemId || null);
        obsWebSocket.current.removeEventListener("message", handler);
      }
    };
    obsWebSocket.current.addEventListener("message", handler);
    obsWebSocket.current.send(JSON.stringify({
      op: 6,
      d: {
        requestType: "GetSceneItemList",
        requestId,
        requestData: { sceneName }
      }
    }));
  };

  const toggleRabbitSource = (sceneName, sceneItemId, enable) => {
    obsWebSocket.current.send(JSON.stringify({
      op: 6,
      d: {
        requestType: "SetSceneItemEnabled",
        requestId: `toggle-${Date.now()}`,
        requestData: { sceneName, sceneItemId, sceneItemEnabled: enable }
      }
    }));
    logMessage(`สั่ง ${enable ? "เปิด" : "ปิด"} source ใน scene "${sceneName}"`);
    return sleep(300);
  };

  const heartMe = (data) => {
    return new Promise((resolve) => {
      logMessage("🔥 HeartMe Triggered");
      getSceneItemId(config.scene1[0], config.scene1[1], async (sceneItemId) => {
        if (!sceneItemId) return resolve();
        await toggleRabbitSource(config.scene1[0], sceneItemId, true);
        await sleep(10000);
        await toggleRabbitSource(config.scene1[0], sceneItemId, false);
        resolve();
      });
    });
  };

  const giftCost = (data) => {
    return new Promise((resolve) => {
      logMessage("💎 GiftCost Triggered");
      getSceneItemId(config.scene2[0], config.scene2[1], async (sceneItemId) => {
        if (!sceneItemId) return resolve();
        await toggleRabbitSource(config.scene2[0], sceneItemId, true);
        await sleep(10000);
        await toggleRabbitSource(config.scene2[0], sceneItemId, false);
        resolve();
      });
    });
  };

  const loadCustomEvents = async () => {
    const giftSnap = await getDocs(collection(db, "customGiftEvents"));
    const rangeSnap = await getDocs(collection(db, "customRangeEvents"));
    const gifts = giftSnap.docs.map((d) => d.data());
    const ranges = rangeSnap.docs.map((d) => d.data());
    setCustomEvents([...gifts, ...ranges]);
  };

  const addCustomEvent = async () => {
    const collectionName = newEvent.type === "gift" ? "customGiftEvents" : "customRangeEvents";
    const eventData = {
      ...newEvent,
      ...(newEvent.type === "gift" ? { giftId: Number(newEvent.giftId) } : {})
    };
    await addDoc(collection(db, collectionName), eventData);
    setCustomEvents([...customEvents, eventData]);
    logMessage(`✅ เพิ่ม Event: ${JSON.stringify(eventData)}`);
  };
 

    const processQueue = () => {
    if (eventQueue.current.length === 0) {
      isProcessing.current = false;
      setQueueCount(0);
      return;
    }

    isProcessing.current = true;
    setQueueCount(eventQueue.current.length);

    const nextTask = eventQueue.current.shift();
    Promise.resolve(nextTask()).then(() => {
      setTimeout(() => processQueue(), 500);
    });
  };
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const logMessage = (msg) => setLog((prev) => `${prev}[${new Date().toLocaleTimeString()}] ${msg}`);
  const clearLog = () => setLog("");

  return (
    <div style={{ padding: "20px", background: "#1c1c1c", color: "#fff" }}>
      <h2>🎛️ OBS Event Controller (รวม Config ทั้งหมด)</h2>
      <select value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}>
        <option value="gift">🎁 Gift ID</option>
        <option value="range">💎 Diamond Range</option>
      </select>
      {newEvent.type === "gift" && (
        <input type="number" value={newEvent.giftId} onChange={(e) => setNewEvent({ ...newEvent, giftId: e.target.value })} />
      )}
      <input type="number" value={newEvent.minDiamond} onChange={(e) => setNewEvent({ ...newEvent, minDiamond: e.target.value })} />
      <input type="number" value={newEvent.maxDiamond} onChange={(e) => setNewEvent({ ...newEvent, maxDiamond: e.target.value })} />
      <select value={newEvent.sceneName} onChange={(e) => setNewEvent({ ...newEvent, sceneName: e.target.value })}>
        <option value="">เลือก Scene</option>
        {sceneList.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={newEvent.sourceName} onChange={(e) => setNewEvent({ ...newEvent, sourceName: e.target.value })}>
        <option value="">เลือก Source</option>
        {sourceList.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={addCustomEvent}>➕ เพิ่ม Event</button>
      <pre style={{ background: "#2a2a2a", padding: "10px", marginTop: "20px" }}>{log}</pre>
      <button onClick={clearLog}>🧹 ล้าง Log</button>
    </div>
  );
};

export default ObsEventController;
