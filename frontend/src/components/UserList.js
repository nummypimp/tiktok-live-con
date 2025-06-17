import React from "react";

export default function UserList({ users, onDisconnect }) {
  return (
    <>
      <h3 className="text-lg font-semibold mb-2 text-gray-800">User ที่เชื่อมต่อ:</h3>
      <ul className="space-y-2">
        {users.length === 0 && <li className="text-gray-400 text-center">ยังไม่มี user ที่เชื่อมต่อ</li>}
        {users.map(u => (
          <li key={u.uniqueId} className="flex justify-between items-center bg-gray-50 p-2 rounded">
            <span>
              <span className="font-bold">{u.uniqueId}</span>
              <span className={`text-xs ml-2 px-2 py-1 rounded
                ${u.status === 'connected' ? 'bg-green-200 text-green-800' :
                  u.status === 'connecting' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-red-200 text-red-800'}`}>
                {u.status}
              </span>
            </span>
            <button
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              onClick={() => onDisconnect(u.uniqueId)}
            >
              Disconnect
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
