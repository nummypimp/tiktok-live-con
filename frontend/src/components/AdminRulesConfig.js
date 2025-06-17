import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminRulesConfig() {
  const [rules, setRules] = useState([]);
  const [matchMode, setMatchMode] = useState("any");

  useEffect(() => {
    axios.get("/admin/get-rules").then((res) => {
      setRules(res.data.rules || []);
      setMatchMode(res.data.matchMode || "any");
    });
  }, []);

  const handleChange = (index, key, value) => {
    const newRules = [...rules];
    newRules[index][key] = value;
    setRules(newRules);
  };

  const addRule = () => {
    setRules([...rules, { type: "mention_greeting" }]);
  };

  const removeRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
  };

  const saveRules = async () => {
    try {
      await axios.post("/admin/save-rules", { rules, matchMode });
      alert("บันทึกกติกาเรียบร้อยแล้ว");
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded-xl space-y-4">
      <h2 className="text-xl font-bold text-center">ตั้งค่ากติกา</h2>

      <div className="flex items-center gap-4">
        <label className="font-semibold text-sm">โหมดการตรวจ:</label>
        <select
          value={matchMode}
          onChange={(e) => setMatchMode(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="any">ผ่านอย่างใดอย่างหนึ่ง</option>
          <option value="all">ต้องผ่านทุกกฎ</option>
        </select>
      </div>

      <div className="space-y-4">
        {rules.map((rule, index) => (
          <div key={index} className="p-3 bg-gray-100 rounded-lg space-y-2">
            <select
              value={rule.type}
              onChange={(e) => handleChange(index, "type", e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="mention_greeting">@mention + สวัสดี</option>
              <option value="emoji_count">จำนวนอิโมจิ ≥</option>
              <option value="contains_word">มีคำว่า...</option>
            </select>

            {rule.type === "emoji_count" && (
              <input
                type="number"
                value={rule.min || ""}
                onChange={(e) => handleChange(index, "min", parseInt(e.target.value))}
                className="w-full border px-2 py-1 rounded"
                placeholder="จำนวนขั้นต่ำ"
              />
            )}

            {rule.type === "contains_word" && (
              <>
                <input
                  type="text"
                  value={rule.word || ""}
                  onChange={(e) => handleChange(index, "word", e.target.value)}
                  className="w-full border px-2 py-1 rounded"
                  placeholder="คำที่ต้องมี"
                />
                <input
                  type="number"
                  value={rule.minLength || ""}
                  onChange={(e) => handleChange(index, "minLength", parseInt(e.target.value))}
                  className="w-full border px-2 py-1 rounded"
                  placeholder="ความยาวคอมเมนต์ขั้นต่ำ"
                />
              </>
            )}

            <button
              onClick={() => removeRule(index)}
              className="text-red-500 text-sm underline"
            >
              ลบกติกานี้
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addRule}
        className="w-full bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
      >
        ➕ เพิ่มกติกาใหม่
      </button>

      <button
        onClick={saveRules}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        💾 บันทึกกติกา
      </button>
    </div>
  );
}