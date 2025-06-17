import React from "react";

const DEFAULT_AVATAR = "/avatar-default.webp"; // ใส่รูปไว้ใน public

export default function Game1Screen({ winners = [] }) {
  const total = winners.length;
  const perRow = Math.min(10, Math.ceil(Math.sqrt(total)));
  if (!total)
    return (
      <div className="text-center text-gray-500 py-8">
        ยังไม่มีผู้เข้าแข่งขันรอบนี้
      </div>
    );

  return (
    <div>
      <h2 className="text-xl font-bold text-center mb-4">
        เกมที่ 1: แข่งส่งอิโมจิ
      </h2>
      <div
        className="grid gap-1 justify-items-center"
        style={{
          gridTemplateColumns: `repeat(${perRow}, 1fr)`,
        }}
      >
        {winners.map((u, i) => {
          const avatar = u.profilePictureUrl || u.avatar || DEFAULT_AVATAR;
          const nick = u.nickname || u.uniqueId || u.id || "-";
          return (
            <div key={i} className="text-center">
              <img
                src={avatar}
                alt={nick}
                width={100}
                height={100}
                className="w-[100px] h-[100px] object-cover bg-gray-100 border border-white ring-2 ring-offset-1 ring-offset-transparent"
                style={{  borderRadius: "0.75rem","--tw-ring-offset-color": "transparent" }}
                // tailwind ring, ring-offset
                // ถ้าใช้ tailwind 3.x ขึ้นไป ใส่ class แบบนี้ได้เลย
                // ring-offset-transparent ให้ขอบนอกใส
               
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
