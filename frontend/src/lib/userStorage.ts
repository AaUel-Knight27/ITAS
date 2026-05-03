export const GLOBAL_STORAGE_KEYS = {
  LANGUAGE: "itas-language",
  SIDEBAR_COLLAPSED: "sidebar-collapsed",
} as const;

const USER_SCOPED_STORAGE_PREFIXES = [
  "video_progress_local_",
  "pdf_highlights_",
  "pdf_progress_",
  "course_notes_",
] as const;

function normalizeUserId(userId: string | null | undefined) {
  return String(userId ?? "anonymous");
}

export function getVideoProgressStorageKey(userId: string | null | undefined, courseId: string | number) {
  return `video_progress_local_${normalizeUserId(userId)}_${courseId}`;
}

export function getCourseNotesStorageKey(userId: string | null | undefined, courseId: string | number) {
  return `course_notes_${normalizeUserId(userId)}_${courseId}`;
}

export function getPdfHighlightsStorageKey(
  userId: string | null | undefined,
  lectureIdOrUrl: string | number
) {
  return `pdf_highlights_${normalizeUserId(userId)}_${lectureIdOrUrl}`;
}

export function getPdfProgressStorageKey(userId: string | null | undefined, lectureIdOrUrl: string | number) {
  return `pdf_progress_${normalizeUserId(userId)}_${lectureIdOrUrl}`;
}

export function clearUserStorage(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const scopedUserId = normalizeUserId(userId);
  const keysToRemove: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && key.includes(`_${scopedUserId}_`)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}

export function clearAllUserStorage() {
  if (typeof window === "undefined") {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && USER_SCOPED_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}
