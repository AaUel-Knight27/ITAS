import { getSession } from "next-auth/react";
import axios from "axios";

import { API_BASE } from "../config";

type AxiosConfigWithSuppressedStatuses = {
  suppressErrorStatuses?: number[];
};

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const url = config.url ?? "";
  if (
    url.includes("/auth/login") ||
    url.includes("/auth/logout") ||
    url.includes("/api/auth/")
  ) {
    return config;
  }

  // Use getSession to safely retrieve the session (and token) from NextAuth
  // This is more secure than manual localStorage parsing and handles refresh logic
  const session = await getSession();
  const accessToken = (session?.user as any)?.accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && axios.isAxiosError(error)) {
      const configWithSuppressedStatuses = error.config as AxiosConfigWithSuppressedStatuses | undefined;
      const suppressedStatuses = Array.isArray(configWithSuppressedStatuses?.suppressErrorStatuses)
        ? configWithSuppressedStatuses.suppressErrorStatuses
        : [];
      const shouldSuppress = suppressedStatuses.includes(error.response?.status ?? -1);

      if (error.response?.status === 401) {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      } else if (error.response?.status === 403 && !shouldSuppress) {
        console.error("Access forbidden (403):", error.config?.url);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
