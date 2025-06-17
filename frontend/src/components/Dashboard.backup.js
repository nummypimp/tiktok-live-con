import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { collection, addDoc, query, where, onSnapshot, getDocs, deleteDoc, doc,updateDoc  } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const [uniqueIdInput, setUniqueIdInput] = useState("");
  const [savedUniqueId, setSavedUniqueId] = useState(sessionStorage.getItem("savedUniqueId") || "");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user?.email) return;

    const q = query(
      collection(db, "tiktokUniqueIds"),
      where("email", "==", user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
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

    return () => unsubscribe();
  }, [user?.email]);

const handleconnect = async (id) => {
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
    });
    console.log("✅ ส่ง UniqueId ไป /api/connect สำเร็จแล้ว");

    // 🔥 6. Fetch TikTok API
    const url = `https://tiktok-api23.p.rapidapi.com/api/user/info-with-region?uniqueId=${uniqueIdInput.trim()}`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': 'ffe2d1586amsh7b8c7098520ec73p1b3d5ajsneef87f941500',
        'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
      }
    };

    const response = await fetch(url, options);
    const result = await response.json();

    if (!result || !result.userInfo || !result.userInfo.user) {
      alert("ไม่พบข้อมูลผู้ใช้จาก TikTok API");
      return;
    }

    const receiverUserId = result.userInfo.user.id;
    const receiveuniqueId = result.userInfo.user.uniqueId;
    console.log("✅ TikTok API response:", result);

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

      {/* แสดง UniqueId ที่บันทึกไว้ */}
      <div className="mt-6">
        <p className="mb-2">
          <strong>UniqueId ที่บันทึกไว้ล่าสุด:</strong> {savedUniqueId || "ยังไม่มีข้อมูล"}
        </p>
      </div>

      {/* Input บันทึก UniqueId */}
      <div className="mt-4">
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

      <button
        onClick={handleLogout}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
