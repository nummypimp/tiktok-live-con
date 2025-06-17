import React from "react";
import { motion } from "framer-motion";

const DEFAULT_AVATAR = "/avatar-default.webp"; // default ใน public

export default function RegisterScreen({ users = [] }) {
  const total = users.length;
  const perRow = Math.min(10, Math.ceil(Math.sqrt(total)));

  if (!total) {
    return (
      <div className="text-center text-gray-400 py-8">
        ยังไม่มีผู้สมัคร
      </div>
    );
  }


  // Motion config (สำหรับแต่ละแถว)
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08, // หน่วงเวลาต่ออันนิดหน่อย
      },
    },
  };
  const item = {
    hidden: { opacity: 0, scale: 0.8, y: 40 },
    show: { opacity: 1, scale: 1, y: 0 },
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-center mb-4">
        กำลังลงทะเบียน <span className="text-blue-500">({total} คน)</span>
      </h2>
      <motion.div
        className="grid gap-2 justify-center mx-auto max-w-2xl"
        style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {users.map((u, i) => {
          const avatar = u.avatar || DEFAULT_AVATAR;
          const nick = u.nickname || u.id || "-";
          return (
            <motion.div
              key={i}
              className="flex flex-col items-center p-1"
              variants={item}
              whileHover={{ scale: 1.08, boxShadow: "0 0 16px #60a5fa" }} // ขยายตอน hover
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <img
                src={avatar}
                alt={nick}
                width={100}
                height={100}
                className="w-[100px] h-[100px] object-cover border-2 border-white shadow rounded-none ring-2 ring-blue-500 ring-offset-1"
                style={{
                  borderRadius: "0.75rem",
                  "--tw-ring-offset-color": "transparent",
                }}
              />
              {/* หากต้องการโชว์ nickname ให้ลบ hidden ออก */}
              <div className="text-xs mt-1 text-gray-700 hidden">{nick}</div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
