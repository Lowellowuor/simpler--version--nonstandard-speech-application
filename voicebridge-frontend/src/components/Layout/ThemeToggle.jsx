// src/components/Layout/ThemeToggle.jsx
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="p-2 rounded-full backdrop-blur-md bg-white/20 dark:bg-gray-800/30 shadow-md hover:scale-105 hover:bg-white/30 dark:hover:bg-gray-700/40 transition-all duration-300"
      title="Toggle Theme"
    >
      {darkMode ? (
        <Sun className="text-yellow-400 w-5 h-5 transition-transform duration-300 rotate-180" />
      ) : (
        <Moon className="text-blue-300 w-5 h-5 transition-transform duration-300 rotate-180" />
      )}
    </button>
  );
}
