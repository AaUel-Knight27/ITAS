"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  const isAmharic = language === "am";

  return (
    <button
      type="button"
      onClick={() => setLanguage(isAmharic ? "en" : "am")}
      title={isAmharic ? t("language.switch_to_english") : t("language.switch_to_amharic")}
      aria-label={isAmharic ? t("language.switch_to_english") : t("language.switch_to_amharic")}
      className="flex h-8 min-w-[64px] items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-600 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-white"
    >
      {isAmharic ? (
        <>
          <span className="text-sm leading-none" aria-hidden="true">
            🇬🇧
          </span>
          <span className="tracking-wide">EN</span>
        </>
      ) : (
        <>
          <span className="text-sm leading-none" aria-hidden="true">
            🇪🇹
          </span>
          <span className="font-ethiopic text-[13px] tracking-normal">አማ</span>
        </>
      )}
    </button>
  );
}
