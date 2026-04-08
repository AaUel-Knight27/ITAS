import axios from "axios";

import { API_BASE } from "../config";

type AxiosConfigWithSuppressedStatuses = {
  suppressErrorStatuses?: number[];
};

function readAccessTokenFromStorage(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem("itas-auth-storage");
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
      const token = parsed?.state?.accessToken;
      if (token) {
        return token;
      }
    }

    const keys = Object.keys(window.localStorage);
    for (const key of keys) {
      if (key.startsWith("nextauth.message") || key.includes("session")) {
        try {
          const value = JSON.parse(window.localStorage.getItem(key) ?? "{}") as {
            accessToken?: string;
            user?: { accessToken?: string };
          };
          const token = value?.accessToken ?? value?.user?.accessToken;
          if (token) {
            return token;
          }
        } catch {
          // Skip malformed session entries.
        }
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

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

  const accessToken = readAccessTokenFromStorage();
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
