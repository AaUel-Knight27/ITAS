"use client";

import { useEffect, useState } from "react";

import HelpButton from "@/components/help/HelpButton";
import { learnerApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { CertificateDto } from "@/lib/types";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    learnerApi
      .getMyCertificates()
      .then((res) => setCertificates(res.data))
      .catch((error) => setError(getErrorMessage(error) || "Could not load certificates. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(""), 3000);
  };

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
    } catch (error) {
      showToast(getErrorMessage(error));
    }
  };

  const handleShare = async (cert: CertificateDto) => {
    try {
      await learnerApi.shareCertificate(cert.id);
      showToast("Certificate link sent to your email!");
    } catch (error) {
      showToast(getErrorMessage(error));
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
        <p className="mt-1 text-sm text-gray-500">Download or share your earned certificates</p>
      </div>

      {toastMsg && (
        <div className="animate-fade-in fixed bottom-6 right-6 z-50 rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">
          {toastMsg}
        </div>
      )}

      {error && <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <p className="mb-4 text-4xl">Trophy</p>
          <p className="text-lg font-medium">No certificates yet</p>
          <p className="mt-1 text-sm">Complete a course and pass the quiz to earn your certificate</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex min-h-[11rem] flex-col justify-between rounded-xl border border-gray-200 bg-white p-5"
            >
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl">Award</span>
                  <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{cert.courseTitle}</h3>
                </div>
                <p className="w-fit rounded bg-gray-50 px-2 py-1 font-mono text-xs text-gray-500">
                  {cert.certificateCode}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Issued:{" "}
                  {new Date(cert.issuedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleShare(cert)}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    Link
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const verifyPath = cert.verifyUrl
                        ? new URL(
                            cert.verifyUrl,
                            window.location.origin,
                          ).pathname
                        : `/verify/${
                            cert.verificationUuid ||
                            cert.certificateCode
                          }`;
                      window.open(verifyPath, "_blank");
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Verify
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(cert)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Download
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
