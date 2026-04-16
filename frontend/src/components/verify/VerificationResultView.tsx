"use client";

import type { ReactNode } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Hash,
  Shield,
  User,
  XCircle,
} from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";

type VerifyResult = {
  status: "VALID" | "INVALID";
  valid: boolean;
  recipientName?: string;
  courseName?: string;
  issueDate?: string;
  certificateCode?: string;
  verificationUuid?: string;
  message?: string;
};

function formatDate(value: string | undefined, locale: string, fallback: string) {
  if (!value) return fallback;
  try {
    return new Date(value).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function DetailRow({
  icon,
  label,
  value,
  large = false,
  mono = false,
  isAmharic,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  large?: boolean;
  mono?: boolean;
  isAmharic: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500">{icon}</div>
      <div>
        <p className={`text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 ${isAmharic ? "ethiopic-text" : ""}`}>
          {label}
        </p>
        <p
          className={`mt-0.5 text-slate-800 dark:text-slate-100 ${
            large ? "text-xl font-bold" : "text-sm font-medium"
          } ${mono ? "font-mono" : ""} ${isAmharic ? "ethiopic-text" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function VerificationResultView({
  result,
  uuid,
}: {
  result: VerifyResult;
  uuid: string;
}) {
  const { t, language, isAmharic } = useLanguage();
  const fallback = t("common.not_available");
  const locale = language === "am" ? "am-ET" : "en-US";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-900 dark:bg-blue-800">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className={`text-2xl font-bold text-slate-900 dark:text-white ${isAmharic ? "ethiopic-text" : ""}`}>
            {t("verify.title")}
          </h1>
          <p className={`mt-1 text-sm text-slate-500 dark:text-slate-400 ${isAmharic ? "ethiopic-text" : ""}`}>
            {t("verify.portal")}
          </p>
        </div>

        {result.valid ? (
          <div className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-lg dark:border-emerald-900/50 dark:bg-slate-900">
            <div className="bg-emerald-600 px-8 py-6 text-center dark:bg-emerald-700">
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h2 className={`text-2xl font-bold text-white ${isAmharic ? "ethiopic-text" : ""}`}>{t("verify.verified")}</h2>
              <p className={`mt-1 text-sm text-emerald-100 ${isAmharic ? "ethiopic-text" : ""}`}>
                {t("verify.verified_desc")}
              </p>
            </div>

            <div className="px-8 py-6">
              <div className="space-y-4">
                <DetailRow icon={<User className="h-4 w-4" />} label={t("verify.recipient")} value={result.recipientName || fallback} large isAmharic={isAmharic} />
                <div className="border-t border-slate-100 dark:border-slate-800" />
                <DetailRow icon={<BookOpen className="h-4 w-4" />} label={t("verify.course")} value={result.courseName || fallback} isAmharic={isAmharic} />
                <DetailRow icon={<Calendar className="h-4 w-4" />} label={t("verify.date_issued")} value={formatDate(result.issueDate, locale, fallback)} isAmharic={isAmharic} />
                <DetailRow icon={<Hash className="h-4 w-4" />} label={t("verify.certificate_no")} value={result.certificateCode || fallback} mono isAmharic={isAmharic} />
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 ${isAmharic ? "ethiopic-text" : ""}`}>{t("verify.issued_by")}</p>
                    <p className={`mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100 ${isAmharic ? "ethiopic-text" : ""}`}>Ministry of Revenue</p>
                    <p className={`text-xs text-slate-500 dark:text-slate-400 ${isAmharic ? "ethiopic-text" : ""}`}>{t("verify.portal")}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 ${isAmharic ? "ethiopic-text" : ""}`}>
                      <CheckCircle2 className="h-3 w-3" />
                      {t("verify.valid")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-lg dark:border-rose-900/50 dark:bg-slate-900">
            <div className="bg-rose-600 px-8 py-6 text-center dark:bg-rose-700">
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                <XCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className={`text-2xl font-bold text-white ${isAmharic ? "ethiopic-text" : ""}`}>{t("verify.not_verified")}</h2>
              <p className={`mt-1 text-sm text-rose-100 ${isAmharic ? "ethiopic-text" : ""}`}>{t("verify.not_verified_desc")}</p>
            </div>

            <div className="px-8 py-6 text-center">
              <p className={`mb-2 text-sm text-slate-600 dark:text-slate-300 ${isAmharic ? "ethiopic-text" : ""}`}>
                {result.message || t("verify.invalid_default")}
              </p>
              <p className={`text-xs text-slate-400 dark:text-slate-500 ${isAmharic ? "ethiopic-text" : ""}`}>{t("verify.contact_revenue")}</p>
            </div>
          </div>
        )}

        <p className={`mt-6 text-center text-xs text-slate-400 dark:text-slate-500 ${isAmharic ? "ethiopic-text" : ""}`}>
          {t("verify.id")}: <span className="font-mono">{uuid}</span>
        </p>
      </div>
    </div>
  );
}
