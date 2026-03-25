import type { ContentResource } from "@/types";

import api from "@/lib/api";

type ApiResponse<T> = {
  data?: T;
  content?: T;
  items?: T;
  results?: T;
};

export type ContentLibraryPage = {
  content: ContentResource[];
  totalPages: number;
  number: number;
  size: number;
  totalElements?: number;
};

function unwrap<T>(payload: T | ApiResponse<T>): T {
  const maybe = payload as ApiResponse<T>;

  if (maybe.data !== undefined) return maybe.data;
  if (maybe.content !== undefined) return maybe.content;
  if (maybe.items !== undefined) return maybe.items;
  if (maybe.results !== undefined) return maybe.results;

  return payload as T;
}

export async function getContentLibrary(page: number): Promise<ContentLibraryPage> {
  const response = await api.get<
    | ContentLibraryPage
    | ApiResponse<ContentLibraryPage>
    | ContentResource[]
    | ApiResponse<ContentResource[]>
  >("/content", {
    params: { page, size: 10 },
  });

  const payload = unwrap(response.data);
  if (Array.isArray(payload)) {
    return {
      content: payload,
      totalPages: 1,
      number: page,
      size: 10,
      totalElements: payload.length,
    };
  }

  return {
    content: payload.content ?? [],
    totalPages: payload.totalPages ?? 1,
    number: payload.number ?? page,
    size: payload.size ?? 10,
    totalElements: payload.totalElements,
  };
}

export async function uploadContent(
  formData: FormData,
  onProgress?: (progressPercent: number) => void
): Promise<ContentResource> {
  const response = await api.post<ContentResource | ApiResponse<ContentResource>>("/content/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (event) => {
      if (!event.total || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });

  return unwrap(response.data);
}

export async function deleteContent(id: number | string): Promise<void> {
  await api.delete(`/content/${id}`);
}
