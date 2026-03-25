import type { CourseProgress, Enrollment, LectureCompletion, VideoProgress } from "@/types";

import api from "@/lib/api";

type ApiResponse<T> = {
  data?: T;
  content?: T;
  items?: T;
  results?: T;
};

function unwrap<T>(payload: T | ApiResponse<T>): T {
  const maybe = payload as ApiResponse<T>;

  if (maybe.data !== undefined) return maybe.data;
  if (maybe.content !== undefined) return maybe.content;
  if (maybe.items !== undefined) return maybe.items;
  if (maybe.results !== undefined) return maybe.results;

  return payload as T;
}

export async function enrollCourse(courseId: number | string): Promise<Enrollment> {
  const response = await api.post<Enrollment | ApiResponse<Enrollment>>("/lms/enroll", { courseId });
  return unwrap(response.data);
}

export async function getMyCourses(): Promise<Enrollment[]> {
  const response = await api.get<Enrollment[] | ApiResponse<Enrollment[]>>("/lms/my-courses");
  return unwrap(response.data);
}

export async function getCourseProgress(courseId: number | string): Promise<CourseProgress> {
  const response = await api.get<CourseProgress | ApiResponse<CourseProgress>>(`/lms/course/${courseId}/progress`);
  return unwrap(response.data);
}

export async function getAllCourseProgress(): Promise<CourseProgress[]> {
  const response = await api.get<CourseProgress[] | ApiResponse<CourseProgress[]>>("/lms/course-progress");
  return unwrap(response.data);
}

export async function saveVideoProgress(
  lectureId: number | string,
  watchedSeconds: number,
  lastPosition: number
): Promise<VideoProgress> {
  const response = await api.post<VideoProgress | ApiResponse<VideoProgress>>(`/content/video/${lectureId}/progress`, {
    watchedSeconds,
    lastPosition,
  });

  return unwrap(response.data);
}

export async function completeLecture(lectureId: number | string): Promise<LectureCompletion> {
  const response = await api.post<LectureCompletion | ApiResponse<LectureCompletion>>(`/lms/lesson/${lectureId}/complete`);
  return unwrap(response.data);
}
