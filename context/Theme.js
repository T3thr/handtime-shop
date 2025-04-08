"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children, initialTheme = "light" }) {
  const [theme, setTheme] = useState(initialTheme);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    // Update cookie with secure settings
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000; SameSite=Strict`;
  };

  useEffect(() => {
    // Set initial theme when component mounts
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, [initialTheme]);

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