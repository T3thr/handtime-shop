"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children, initialTheme = "light" }) {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first (client-side persistence)
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) return storedTheme;
    }
    // Fall back to initialTheme prop (from server-side cookie or default)
    return initialTheme;
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");

    // Store in localStorage for persistence across sessions
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme);
    }
    // Update cookie with secure settings as a fallback
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000; SameSite=Strict`;
  };

  useEffect(() => {
    // Apply the theme to the document on mount
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};