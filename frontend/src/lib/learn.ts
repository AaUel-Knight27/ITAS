export function getCourseLearnHref(courseSlug: string, lectureId?: number | string | null): string {
  if (lectureId === undefined || lectureId === null || lectureId === "") {
    return `/courses/${courseSlug}`;
  }

  return `/courses/${courseSlug}/learn/${lectureId}`;
}
