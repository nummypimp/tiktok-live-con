import React, { useState } from "react";
import gifts from "./gifts.json"; // ต้องมี field imageUrl, name, diamond, id

const GiftDropdown = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);

  const handleSelect = (gift) => {
    setSelectedGift(gift);
    setIsOpen(false);
    onSelect(gift);
  };

  return (
    <div className="relative w-72">
      {/* Selected Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between border border-gray-300 bg-white rounded-lg px-4 py-2 cursor-pointer shadow-sm hover:border-blue-500"
      >
        {selectedGift ? (
          <div className="flex items-center gap-3">
            <img
              src={selectedGift.image}
              alt={selectedGift.name}
              className="w-8 h-8 rounded"
            />
            <span className="font-medium text-gray-800">
              {selectedGift.name} ({selectedGift.diamond}💎)
            </span>
          </div>
        ) : (
          <span className="text-gray-400">เลือกของขวัญ</span>
        )}
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown Items */}
      {isOpen && (
        <ul className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
        {gifts
  .sort((a, b) => a.diamond - b.diamond)
  .map((gift) => (
    <li
      key={gift.id}
      onClick={() => handleSelect(gift)}
      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer"
    >
      <img
        src={gift.image}
        alt={gift.name}
        className="w-8 h-8 rounded"
      />
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-800">
          {gift.name}
        </div>
        <div className="text-xs text-gray-500">
          {gift.diamond} 💎
        </div>
      </div>
    </li>
))}

        </ul>
      )}
    </div>
  );
};

export default GiftDropdown;
