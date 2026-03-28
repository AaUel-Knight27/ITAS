const rawBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const rawStorageBase = process.env.NEXT_PUBLIC_STORAGE_URL ?? rawBase;

// Normalize base URL: no trailing slash
const normalizedBase = rawBase.replace(/\/+$/, "");
const normalizedStorageBase = rawStorageBase.replace(/\/+$/, "");

// Centralized API Base: ensure /api/v1 prefix
export const API_BASE = normalizedBase.endsWith("/api/v1") 
  ? normalizedBase 
  : `${normalizedBase}/api/v1`;

// Centralized Storage Base: for public assets/uploads (must include context path)
export const STORAGE_BASE = normalizedStorageBase.endsWith("/api/v1")
  ? normalizedStorageBase
  : `${normalizedStorageBase}/api/v1`;
