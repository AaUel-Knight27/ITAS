"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { useLanguage } from "@/context/LanguageContext";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-8 w-8 rounded-lg" aria-hidden="true" />;
  }

  const isDark = theme === "dark";
  const nextThemeLabel = isDark ? t("theme.light") : t("theme.dark");

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={nextThemeLabel}
      aria-label={nextThemeLabel}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-white"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
