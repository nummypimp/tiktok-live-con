import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

const menus = [
  { path: "/", label: "🏠 Home" },
  { path: "/control", label: "🛠️ Control" },
  { path: "/dashboard", label: "🔗 Dashboard" },
   { path: "/obs", label: "🔗 obs" },
  { path: "/game", label: "🎮 Game" },
  { path: "/game3", label: "🏆 Game3" },
  { path: "/slot", label: "🏆 slot" },
  { path: "/chat", label: "💬 Chat" },
];

const chatMenus = [
  { path: "live-now", label: "👥 Live" },
  { path: "connect", label: "🎁 Connect" },
  { path: "roomUser", label: "🙋 Room User" },
  { path: "like", label: "👍 Like" },
  { path: "social", label: "🌐 Social" },
  { path: "emote", label: "😎 Emote" },
  { path: "envelope", label: "✉️ Envelope" },
  { path: "questionNew", label: "❓ Question" },
  { path: "linkMicBattle", label: "🎤 Battle" },
  { path: "linkMicArmies", label: "🎖️ Armies" },
  { path: "subscribe", label: "⭐ Subscribe" },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);
  const uniqueId = sessionStorage.getItem("savedUniqueId") || "";

  const isChatPage = location.pathname === "/chat";

  return (
    <>
      {/* Navbar Top */}
      <nav className="bg-white shadow sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center">
            <button
              className="p-2 rounded-lg hover:bg-blue-100"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={28} />
            </button>
            <span className="ml-4 font-bold text-xl text-blue-600">My App</span>
          </div>

          {/* 👇 ปุ่ม Toggle Chat Sidebar (เฉพาะหน้า /chat) */}
          {isChatPage && (
            <button
              className="p-2 bg-gray-200 hover:bg-blue-100 rounded-lg text-blue-800 text-sm font-medium"
              onClick={() => setChatSidebarOpen(!chatSidebarOpen)}
            >
              📋 Chat Menu
            </button>
          )}
        </div>
      </nav>

      {/* Overlay Left Drawer */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Side Drawer (Left) */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <span className="font-bold text-lg text-blue-600">เมนู</span>
          <button
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
        <nav className="flex flex-col p-2 gap-2">
          {menus.map(menu => (
            <Link
              key={menu.path}
              to={`${menu.path}?roomid=${uniqueId}`}
              onClick={() => setOpen(false)}
              className={`px-4 py-2 rounded-xl font-medium transition ${
                location.pathname === menu.path
                  ? "bg-blue-600 text-white shadow"
                  : "hover:bg-blue-100 text-blue-800"
              }`}
            >
              {menu.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Chat Sidebar (Right) */}
      {isChatPage && (
        <>
          {chatSidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-40"
              onClick={() => setChatSidebarOpen(false)}
            />
          )}
          <aside
            className={`fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
              chatSidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <span className="font-bold text-lg text-blue-600">
                แชทเมนู
              </span>
              <button
                className="p-2 hover:bg-gray-100 rounded-lg"
                onClick={() => setChatSidebarOpen(false)}
                aria-label="Close chat menu"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <nav className="flex flex-col p-2 gap-2">
              {chatMenus.map(menu => (
                <Link
                  key={menu.path}
                  to={`/chat/${menu.path}?roomid=${uniqueId}`}
                  onClick={() => setChatSidebarOpen(false)}
                  className="px-4 py-2 rounded-xl font-medium hover:bg-blue-100 text-blue-800"
                >
                  {menu.label}
                </Link>
              ))}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
