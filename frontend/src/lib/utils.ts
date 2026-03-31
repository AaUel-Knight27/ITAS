import { STORAGE_BASE } from "./config";

export function getFileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (/^(data|blob):/i.test(path)) return path;

  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${STORAGE_BASE}${clean}`;
}
