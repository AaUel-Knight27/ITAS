/** Public: backend REST base (see `API_BASE` - `/api/v1` is appended when missing). */
const rawBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// Normalize base URL: no trailing slash
const normalizedBase = rawBase.replace(/\/+$/, "");
const defaultStorageBase = normalizedBase.endsWith("/api/v1")
  ? normalizedBase
  : `${normalizedBase}/api/v1`;
const normalizedStorageBase = (process.env.NEXT_PUBLIC_STORAGE_URL ?? defaultStorageBase).replace(/\/+$/, "");

// Centralized API Base: ensure /api/v1 prefix
export const API_BASE = normalizedBase.endsWith("/api/v1")
  ? normalizedBase
  : `${normalizedBase}/api/v1`;

// Static uploads are served by the backend app and inherit the servlet context path when present.
export const STORAGE_BASE = normalizedStorageBase;
