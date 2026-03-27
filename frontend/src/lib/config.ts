const rawApiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
const rawStorageBase = process.env.NEXT_PUBLIC_STORAGE_URL ?? "http://localhost:8080";

const normalizedApiBase = rawApiBase.replace(/\/+$/, "");
const normalizedStorageBase = rawStorageBase.replace(/\/+$/, "");

export const API_BASE = normalizedApiBase.endsWith("/api/v1")
  ? normalizedApiBase
  : `${normalizedApiBase}/api/v1`;

export const STORAGE_BASE = normalizedStorageBase;
