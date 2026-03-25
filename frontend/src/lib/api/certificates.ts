import type { Certificate } from "@/types";

import api from "@/lib/api";

type ApiResponse<T> = {
  data?: T;
  content?: T;
  items?: T;
  results?: T;
};

function unwrap<T>(payload: T | ApiResponse<T>): T {
  const maybe = payload as ApiResponse<T>;

  if (maybe.data !== undefined) return maybe.data;
  if (maybe.content !== undefined) return maybe.content;
  if (maybe.items !== undefined) return maybe.items;
  if (maybe.results !== undefined) return maybe.results;

  return payload as T;
}

export async function getMyCertificates(): Promise<Certificate[]> {
  const response = await api.get<Certificate[] | ApiResponse<Certificate[]>>("/lms/certificates");
  return unwrap(response.data);
}

export async function downloadCertificate(certificateId: number | string): Promise<void> {
  const response = await api.get(`/lms/certificate/${certificateId}/download`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => window.URL.revokeObjectURL(url), 60000);
}

export async function verifyCertificate(code: string): Promise<Certificate> {
  const response = await api.get<Certificate | ApiResponse<Certificate>>(`/lms/certificate/verify/${code}`);
  return unwrap(response.data);
}
