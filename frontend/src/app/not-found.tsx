"use client";

import Link from "next/link";

import { useLanguage } from "@/context/LanguageContext";

export default function NotFound() {
  const { t, isAmharic } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <span className="mb-6 text-8xl">404</span>
      <h1 className={`mb-2 text-2xl font-bold text-foreground ${isAmharic ? "ethiopic-text" : ""}`}>
        {t("not_found.title")}
      </h1>
      <p className={`mb-6 max-w-sm text-muted-foreground ${isAmharic ? "ethiopic-text" : ""}`}>
        {t("not_found.description")}
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700"
      >
        {t("not_found.go_dashboard")}
      </Link>
    </div>
  );
}
