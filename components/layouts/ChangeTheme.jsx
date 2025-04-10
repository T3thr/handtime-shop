"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/Theme";

export default function ChangeTheme() {
  const { theme, toggleTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(true); // State for showing/hiding toggle button

  return (
    <div className="z-30 fixed bottom-0 right-4">
      {/* Fixed Up/Down Toggle Button */}
      <button
        onClick={() => setIsVisible((prev) => !prev)}
        className={`z-30 w-20 h-6 flex items-center justify-center rounded-tl-lg rounded-tr-lg bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg hover:bg-gray-900 duration-300 fixed bottom-0 right-4 transition-all`}
      >
        {/* The Text Icon that will Rotate */}
        <span
          className={`transform transition-all duration-300 ${
            isVisible ? "rotate-180" : "rotate-0"
          }`}
        >
          ⏏
        </span>
      </button>

      {/* Animated Theme Toggle Button */}
      <div
        className={`z-20 transform transition-all duration-500 ease-out absolute bottom-10 right-1 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <button
          onClick={toggleTheme}
          disabled={!isVisible} // Disable the button when it's not visible
          className={`w-16 h-16 flex items-center justify-center rounded-full shadow-xl transition-all duration-300 transform ${
            theme === "dark"
              ? "bg-blue-700 text-white hover:bg-blue-800"
              : "bg-gray-200 text-black hover:bg-gray-300"
          } ${!isVisible ? "opacity-50" : ""}`} // Disabled styling
        >
          <span className="text-3xl">{theme === "dark" ? "🌙" : "🌞"}</span>
        </button>
      </div>
    </div>
  );
}