import React from "react";
import { useEffect, useState } from 'react';
import socket from './socket';
import { motion } from "framer-motion";

const DEFAULT_AVATAR = "/avatar-default.webp"; // ใส่รูปไว้ใน public



export default function Game3Screen() {
  const [scores, setScores] = useState([]);

  const total = scores.length;
  const perRow = Math.min(10, Math.ceil(Math.sqrt(total)));

  useEffect(() => {
    socket.on('score-list', (data) => {
      setScores(data);
    });
  }, []);

  if (scores.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        ยังไม่มีผู้เล่นในระบบ
      </div>
    );
  }

   const sorted = [...scores].sort(
    (a, b) => (b.score || 0) - (a.score || 0)
  );

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.08 },
    },
  };
  const item = {
    hidden: { opacity: 0, scale: 0.8, y: 30 },
    show: { opacity: 1, scale: 1, y: 0 },
  };

   return (
    <div>
      <h2 className="text-xl font-bold text-center mb-4">
       
      </h2>
      <motion.div
        className="grid gap-1 justify-items-center"
        style={{ gridTemplateColumns: `repeat(${perRow}, 1fr)` }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {sorted.map((u, i) => {
          const avatar = u.profilePictureUrl || u.avatar || DEFAULT_AVATAR;
          const nick = u.nickname || u.uniqueId || u.id || "-";
          return (
            <motion.div
              key={i}
              className="text-center"
              variants={item}
              whileHover={{ scale: 1.09 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <img
                src={avatar}
                alt={nick}
                width={100}
                height={100}
                className="w-[100px] h-[100px] object-cover bg-gray-100 border border-white ring-2 ring-offset-1 ring-offset-transparent"
                style={{
                  borderRadius: "0.75rem",
                  "--tw-ring-offset-color": "transparent",
                }}
              />
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white bg-opacity-80 text-xs text-gray-800 px-2 py-0.5 rounded">
    {nick}
  </div>
              {/* แสดงจำนวน emoji */}
              <div className="text-xs text-blue-500 font-semibold">
                {u.score ? `score: ${u.score}` : ""}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}


