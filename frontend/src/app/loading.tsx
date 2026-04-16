"use client";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/context/LanguageContext";

export default function Loading() {
  const { t, isAmharic } = useLanguage();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="md" color="blue" />
        <p className={`text-sm text-gray-500 dark:text-gray-400 ${isAmharic ? "ethiopic-text" : ""}`}>
          {t("common.loading")}
        </p>
      </div>
    </div>
  );
}
