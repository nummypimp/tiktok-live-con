import React, { useState, useEffect, useRef } from "react";
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const ObsEventController = () => {
  const [status, setStatus] = useState("Connecting...");
  const [queueCount, setQueueCount] = useState(0);
  const [log, setLog] = useState("");
  const [config, setConfig] = useState({});
  const eventQueue = useRef([]);
  const isProcessing = useRef(false);
  const websocket = useRef(null);
  const obsWebSocket = useRef(null);

  // Load config from Firestore
  useEffect(() => {
    const userString = sessionStorage.getItem("user");
    if (!userString) {
      alert("กรุณา login ก่อน หรือ savedUniqueId ไม่ถูกต้อง");
      return;
    }
    const user = JSON.parse(userString);

    const fetchOrCreateConfig = async () => {
      try {
        const q = query(
          collection(db, "tiktokconfig"),
          where("email", "==", user.email)
        );
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

    return () => {
      websocket.current?.close();
      obsWebSocket.current?.close();
    };
  }, []);

  // Connect after config is loaded
  useEffect(() => {
    if (config.receiverUserName) {
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.receiverUserName]);

  const connect = () => {
    if (websocket.current) return;

    websocket.current = new WebSocket("ws://localhost:21213/");

    websocket.current.onopen = () => {
      setStatus(`Connected to Event Server ${config.receiverUserName}`);
      connectOBS();
    };

    websocket.current.onclose = () => {
      setStatus("Disconnected from Event Server");
      websocket.current = null;
      setTimeout(connect, 1000);
    };

    websocket.current.onerror = () => {
      setStatus("Event Server Connection Failed");
      websocket.current = null;
      setTimeout(connect, 1000);
    };

    websocket.current.onmessage = (event) => {
  try {
    const parsedData = JSON.parse(event.data);

    // 🔥 ถ้า queue > 5 ให้หยุดรับจนกว่าจะว่าง
    if (eventQueue.current.length >= 5) {
      logMessage("⚠️ Queue เต็มแล้ว (5) — รอให้ queue ว่างก่อน");
      return;
    }

    if (
      parsedData.data &&
      parsedData.data.tikfinityUsername &&
      parsedData.data.tikfinityUsername !== config.receiverUserName
    ) {
      setStatus(`Different User Detected: ${config.receiverUserName}`);
    }

    logMessage("Received event: " + parsedData.event);

    if (parsedData.event === "gift" && parsedData.data.giftId === 7934) {
      eventQueue.current.push(() => heartMe(parsedData));
    }

    if (
      parsedData.event === "gift" &&
      parsedData.data.diamondCount >= config.diamondThreshold
    ) {
      eventQueue.current.push(() => giftCost(parsedData, config.diamondThreshold));
    }

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
    };

    obsWebSocket.current.onclose = () => {
      logMessage("Disconnected from OBS WebSocket");
      obsWebSocket.current = null;
      setTimeout(connectOBS, 1000);
    };

    obsWebSocket.current.onerror = () => {
      logMessage("OBS WebSocket Connection Failed");
      obsWebSocket.current = null;
      setTimeout(connectOBS, 1000);
    };
  };

  const authenticateOBS = () => {
    const payload = { op: 1, d: { rpcVersion: 1 } };
    obsWebSocket.current.send(JSON.stringify(payload));
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

  const heartMe = (parsedData) => {
    return new Promise((resolve) => {
      logMessage("Triggered HeartMe: " + JSON.stringify(parsedData.data));
      getSceneItemId(config.scene1[0], config.scene1[1], async (sceneItemId) => {
        if (!sceneItemId) {
          resolve();
          return;
        }
        await toggleRabbitSource(config.scene1[0], sceneItemId, true);
        await sleep(10000);
        await toggleRabbitSource(config.scene1[0], sceneItemId, false);
        resolve();
      });
    });
  };

  const giftCost = (parsedData, threshold) => {
    return new Promise((resolve) => {
      logMessage("Triggered giftCost: " + JSON.stringify(parsedData.data));
      getSceneItemId(config.scene2[0], config.scene2[1], async (sceneItemId) => {
        if (!sceneItemId) {
          resolve();
          return;
        }
        await toggleRabbitSource(config.scene2[0], sceneItemId, true);
        await sleep(10000);
        await toggleRabbitSource(config.scene2[0], sceneItemId, false);
        resolve();
      });
    });
  };

  const getSceneItemId = (sceneName, sourceName, callback) => {
    if (!obsWebSocket.current || obsWebSocket.current.readyState !== 1) {
      callback(null);
      return;
    }

    const requestId = `get-scene-items-${Date.now()}`;
    const handleResponse = (event) => {
  const data = JSON.parse(event.data);
  if (data.op === 7 && data.d.requestId === requestId) {
    if (!data.d.responseData || !data.d.responseData.sceneItems) {
      logMessage(`ไม่พบข้อมูล sceneItems ของ ${sceneName}`);
      callback(null);
      obsWebSocket.current.removeEventListener("message", handleResponse);
      return;
    }

    const sceneItems = data.d.responseData.sceneItems;
    const found = sceneItems.find((item) => item.sourceName === sourceName);
    callback(found ? found.sceneItemId : null);
    obsWebSocket.current.removeEventListener("message", handleResponse);
  }
};


    obsWebSocket.current.addEventListener("message", handleResponse);

    const payload = {
      op: 6,
      d: {
        requestType: "GetSceneItemList",
        requestId,
        requestData: { sceneName },
      },
    };
    obsWebSocket.current.send(JSON.stringify(payload));
  };

  const toggleRabbitSource = (sceneName, sceneItemId, enable) => {
    if (!obsWebSocket.current || obsWebSocket.current.readyState !== 1)
      return Promise.resolve();

    const payload = {
      op: 6,
      d: {
        requestType: "SetSceneItemEnabled",
        requestId: `toggle-rabbit-${Date.now()}`,
        requestData: {
          sceneName,
          sceneItemId,
          sceneItemEnabled: enable,
        },
      },
    };
    obsWebSocket.current.send(JSON.stringify(payload));
    logMessage(
      `สั่ง ${enable ? "เปิด" : "ปิด"} source ใน scene "${sceneName}"`
    );
    return sleep(300);
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const logMessage = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLog((prev) => `${prev}[${time}] ${msg}\n`);
  };

  const clearLog = () => setLog("");

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>OBS Event Controller</h1>
      <div style={styles.status}>{status}</div>
      <div style={styles.queueStatus}>Queue: {queueCount}</div>
      <pre style={styles.log}>{log}</pre>
      <button style={styles.button} onClick={clearLog}>
        Clear Log
      </button>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    background: "#1c1c1c",
    color: "#f0f0f0",
    margin: "20px",
  },
  header: { color: "#00bfff" },
  status: {
    padding: "10px",
    background: "#333",
    borderRadius: "5px",
    marginBottom: "10px",
  },
  queueStatus: {
    padding: "5px",
    background: "#444",
    borderRadius: "5px",
    marginBottom: "10px",
    fontSize: "14px",
  },
  log: {
    maxHeight: "300px",
    overflowY: "auto",
    background: "#2a2a2a",
    padding: "10px",
    borderRadius: "5px",
    whiteSpace: "pre-wrap",
    fontSize: "12px",
  },
  button: {
    background: "#00bfff",
    border: "none",
    color: "white",
    padding: "8px 16px",
    marginTop: "10px",
    cursor: "pointer",
    borderRadius: "4px",
  },
};

export default ObsEventController;
