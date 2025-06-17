import React from "react";

export default function ConnectForm({ uniqueId, setUniqueId, onSubmit }) {
  return (
    <form className="flex gap-2 mb-4" onSubmit={onSubmit}>
      <input
        value={uniqueId}
        onChange={e => setUniqueId(e.target.value)}
        className="border rounded p-2 flex-1"
        placeholder="กรอก TikTok Username"
        required
        autoFocus
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Connect</button>
    </form>
  );
}
