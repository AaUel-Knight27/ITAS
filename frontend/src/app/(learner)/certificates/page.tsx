"use client";

import { Award, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import HelpButton from "@/components/help/HelpButton";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/context/LanguageContext";
import { learnerApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { CertificateDto } from "@/lib/types";

export default function CertificatesPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const { t, isAmharic, language } = useLanguage();
  const [certificates, setCertificates] = useState<CertificateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    learnerApi
      .getMyCertificates()
      .then((res) => setCertificates(res.data))
      .catch((responseError) => setError(getErrorMessage(responseError) || "Could not load certificates. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (cert: CertificateDto) => {
    try {
      const res = await learnerApi.downloadCertificate(cert.id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${cert.certificateCode}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      success("Certificate download started.");
    } catch (responseError) {
      showError(getErrorMessage(responseError));
    }
  };

  const handleShare = async (cert: CertificateDto) => {
    try {
      const res = await learnerApi.shareCertificate(cert.id);
      const email = res.data?.email || "your email";
      success(<div className="flex items-center gap-2"><Mail className="h-4 w-4" /> <span>Certificate link sent to {email}</span></div>);
    } catch (responseError) {
      showError(getErrorMessage(responseError));
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold text-gray-900 dark:text-white ${isAmharic ? "ethiopic-text" : ""}`}>{t("certs.title")}</h1>
        <p className={`mt-1 text-sm text-gray-500 dark:text-gray-400 ${isAmharic ? "ethiopic-text" : ""}`}>{t("certs.subtitle")}</p>
      </div>

      {error && <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="mx-auto max-w-4xl p-0">
          <div className="mb-6 space-y-2">
            <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
                <div className="flex justify-between border-t pt-3 dark:border-gray-700">
                  <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-200" />
                  <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={<Award className="h-12 w-12 text-gray-400" />}
          title={t("certs.none_title")}
          description={t("certs.none_desc")}
          action={{
            label: t("dashboard.browse_courses"),
            onClick: () => router.push("/courses"),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex min-h-[11rem] flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
            >
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-gray-500"><Award className="h-6 w-6 text-yellow-500" /></span>
                  <h3 className={`line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white ${isAmharic ? "ethiopic-text" : ""}`}>
                    {cert.courseTitle}
                  </h3>
                </div>
                <p className="w-fit rounded bg-gray-50 px-2 py-1 font-mono text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {cert.certificateCode}
                </p>
                <p className={`mt-1 text-xs text-gray-400 dark:text-gray-500 ${isAmharic ? "ethiopic-text" : ""}`}>
                  {t("certs.issued")}:{" "}
                  {new Date(cert.issuedAt).toLocaleDateString(language === "am" ? "am-ET" : "en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleShare(cert)}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-4 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    <span className={`flex items-center gap-1.5 ${isAmharic ? "ethiopic-text" : ""}`}><Mail className="h-3 w-3" /> Email Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const verifyPath = cert.verifyUrl
                        ? new URL(cert.verifyUrl, window.location.origin).pathname
                        : `/verify/${cert.verificationUuid || cert.certificateCode}`;
                      window.open(verifyPath, "_blank");
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <span className={isAmharic ? "ethiopic-text" : undefined}>{t("certs.verify")}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(cert)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <span className={isAmharic ? "ethiopic-text" : undefined}>{t("certs.download")}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <HelpButton pageId="certificates" />
    </div>
  );
}
