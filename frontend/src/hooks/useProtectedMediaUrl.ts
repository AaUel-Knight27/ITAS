"use client";

import { useMemo } from "react";

import { API_BASE, STORAGE_BASE } from "@/lib/config";
import { getFileUrl } from "@/lib/utils";

function shouldFetchAsProtectedAsset(value: string) {
  return value.startsWith(STORAGE_BASE) || value.startsWith(API_BASE);
}

export function useProtectedMediaUrl(path: string | null | undefined) {
  const sourceUrl = useMemo(() => getFileUrl(path) ?? "", [path]);
  const resolvedUrl = useMemo(() => {
    if (!sourceUrl) {
      return "";
    }

    if (!shouldFetchAsProtectedAsset(sourceUrl)) {
      return sourceUrl;
    }

    const params = new URLSearchParams({ src: sourceUrl });
    return `/api/media?${params.toString()}`;
  }, [sourceUrl]);

  return {
    resolvedUrl,
    originalUrl: sourceUrl,
    isLoading: false,
    error: null,
  };
}
