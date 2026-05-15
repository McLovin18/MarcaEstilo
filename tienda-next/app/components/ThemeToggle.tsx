"use client";
import React, { useEffect, useState } from "react";
import { themeManager } from "./themeManager";

const ThemeToggle = () => {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setTheme(themeManager.getTheme());
    const handler = (e) => setTheme(e.detail.theme);
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  const handleToggleTheme = () => {
    themeManager.toggleTheme();
    setTheme(themeManager.getTheme());
  };

  return (
    <button
      className="px-2 rounded-2 py-0  dark:hover:bg-white/10"
      onClick={handleToggleTheme}
      title="Cambiar tema"
      style={{ marginLeft: 8 }}
    >
      <span className="material-icons-round text-xl">
        {theme === "dark" ? "dark_mode" : "light_mode"}
      </span>
    </button>
  );
};

export default ThemeToggle;

