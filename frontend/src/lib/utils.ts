import { STORAGE_BASE } from "./config";

export function getFileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${STORAGE_BASE}/${clean}`;
}

