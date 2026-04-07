import type { Category, Course, CourseSection, Lecture } from "@/types";
import { type AxiosResponse } from "axios";

import api from "@/lib/api";

type ApiResponse<T> = {
  data?: T;
  content?: T;
  items?: T;
  results?: T;
};

const COURSES_BASE = "/courses";

export type QuizQuestionPayload = {
  questionText: string;
  questionType: "MCQ" | "TRUE_FALSE";
  optionsJson: string;
  correctAnswer: string;
  points: number;
  explanation?: string;
};

function unwrap<T>(payload: T | ApiResponse<T>): T {
  if (payload == null) return payload as T;
  const obj = payload as Record<string, unknown>;
  // Domain DTOs (Course, Lecture, Section, etc.) always have an 'id' field.
  // If 'id' is present, the payload is a direct DTO — not a wrapper envelope.
  // This prevents LectureDto.content from being mistaken for a wrapper key.
  if (obj.id !== undefined) return payload as T;
  if (obj.data !== undefined) return obj.data as T;
  if (obj.content !== undefined) return obj.content as T;
  if (obj.items !== undefined) return obj.items as T;
  if (obj.results !== undefined) return obj.results as T;
  return payload as T;
}

function normalizeCourse(course: Course): Course {
  const categoryId = course.category?.id ?? course.categoryId;
  const categoryName = course.category?.name ?? course.categoryName;
  const categoryDescription = course.category?.description ?? course.categoryDescription;

  return {
    ...course,
    targetAudience: course.targetAudience ?? ["TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER"],
    categoryId,
    categoryName,
    categoryDescription,
    category: {
      id: categoryId ?? "",
      name: categoryName ?? "Uncategorized",
      description: categoryDescription,
    },
  };
}

function normalizeLecture(lecture: Lecture): Lecture {
  if (!lecture) {
    return { id: 0, title: "", orderIndex: 0, preview: false, isPreview: false };
  }
  const preview = lecture.preview ?? lecture.isPreview ?? false;
  return {
    ...lecture,
    preview,
    isPreview: preview,
    contentHtml: lecture.contentHtml ?? lecture.content ?? undefined,
    contentUrl: lecture.contentUrl ?? lecture.videoUrl ?? lecture.pdfUrl ?? undefined,
  };
}

export async function getAdminCourses(): Promise<Course[]> {
  const response = await api.get<Course[] | ApiResponse<Course[]>>(`${COURSES_BASE}?admin=true`);
  return unwrap(response.data).map(normalizeCourse);
}

export async function getCourseCategories(): Promise<Category[]> {
  const response = await api.get<Category[] | ApiResponse<Category[]>>(`${COURSES_BASE}/categories`);
  return unwrap(response.data);
}

export async function createCourse(payload: {
  title: string;
  slug: string;
  description: string;
  categoryId: number | string;
  difficulty: string;
  thumbnailUrl?: string;
  targetAudience?: string[];
}): Promise<Course> {
  const response = await api.post<Course | ApiResponse<Course>>(COURSES_BASE, payload);
  return normalizeCourse(unwrap(response.data));
}

export async function getCourseById(id: number | string): Promise<Course> {
  const response = await api.get<Course | ApiResponse<Course>>(`${COURSES_BASE}/id/${id}`);
  return normalizeCourse(unwrap(response.data));
}

export async function updateCourse(
  courseId: number | string,
  data: {
    title: string;
    slug: string;
    description?: string;
    categoryId?: number | string;
    difficulty?: string;
    targetAudience?: string[];
    thumbnailUrl?: string;
    durationMinutes?: number;
  }
): Promise<Course> {
  const payload: Record<string, unknown> = {
    title: data.title,
    slug: data.slug,
  };

  if (data.description !== undefined) {
    payload.description = data.description;
  }
  if (data.categoryId !== undefined && data.categoryId !== "") {
    payload.categoryId = Number(data.categoryId);
  }
  if (data.difficulty !== undefined) {
    payload.difficulty = data.difficulty;
  }
  if (data.targetAudience !== undefined) {
    payload.targetAudience = data.targetAudience;
  }
  if (data.thumbnailUrl) {
    payload.thumbnailUrl = data.thumbnailUrl;
  }
  if (data.durationMinutes !== undefined) {
    payload.durationMinutes = data.durationMinutes;
  }

  const response = await api.put<Course | ApiResponse<Course>>(`${COURSES_BASE}/${courseId}`, payload);
  return normalizeCourse(unwrap(response.data));
}

export async function deleteCourse(id: number | string): Promise<void> {
  await api.delete(`${COURSES_BASE}/${id}`);
}

export async function publishCourse(id: number | string): Promise<void> {
  await api.put(`${COURSES_BASE}/${id}/publish`);
}

export async function unpublishCourse(id: number | string): Promise<void> {
  await api.put(`${COURSES_BASE}/${id}/unpublish`);
}

export async function uploadCourseThumbnail(courseId: number | string, file: File): Promise<Partial<Course>> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<Partial<Course> | ApiResponse<Partial<Course>>>(
    `${COURSES_BASE}/${courseId}/thumbnail`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return unwrap(response.data);
}

export async function addSection(courseId: number | string, title: string, orderIndex: number): Promise<CourseSection> {
  const response = await api.post<CourseSection | ApiResponse<CourseSection>>(
    `${COURSES_BASE}/${courseId}/sections`,
    {
      title,
      orderIndex,
    }
  );
  return unwrap(response.data);
}

export async function updateSection(
  courseId: number | string,
  sectionId: number | string,
  payload: Partial<{ title: string; orderIndex: number }>
): Promise<CourseSection> {
  const response = await api.put<CourseSection | ApiResponse<CourseSection>>(
    `${COURSES_BASE}/${courseId}/sections/${sectionId}`,
    payload
  );
  return unwrap(response.data);
}

export async function deleteSection(courseId: number | string, sectionId: number | string): Promise<void> {
  await api.delete(`${COURSES_BASE}/${courseId}/sections/${sectionId}`);
}

export async function addLecture(
  courseId: number | string,
  sectionId: number | string,
  payload: {
    title: string;
    description?: string;
    type?: string;
    orderIndex?: number;
    isPreview?: boolean;
  }
): Promise<Lecture> {
  const response = await api.post<Lecture | ApiResponse<Lecture>>(
    `${COURSES_BASE}/${courseId}/sections/${sectionId}/lectures`,
    {
      title: payload.title,
      description: payload.description ?? "",
      type: payload.type ?? "VIDEO",
      orderIndex: payload.orderIndex ?? 0,
      isPreview: payload.isPreview ?? false,
    }
  );
  return normalizeLecture(unwrap(response.data));
}

export async function updateLecture(
  courseId: number | string,
  sectionId: number | string,
  lectureId: number | string,
  payload: {
    title: string;
    description: string;
    type: string;
    isPreview: boolean;
    orderIndex?: number;
    content?: string;
  }
): Promise<Lecture> {
  const response = await api.put<Lecture | ApiResponse<Lecture>>(
    `${COURSES_BASE}/${courseId}/sections/${sectionId}/lectures/${lectureId}`,
    {
      title: payload.title,
      description: payload.description ?? "",
      type: payload.type,
      orderIndex: payload.orderIndex ?? 0,
      isPreview: payload.isPreview ?? false,
      content: payload.content ?? "",
    }
  );
  return normalizeLecture(unwrap(response.data));
}

export async function deleteLecture(courseId: number | string, sectionId: number | string, lectureId: number | string): Promise<void> {
  await api.delete(`${COURSES_BASE}/${courseId}/sections/${sectionId}/lectures/${lectureId}`);
}

export async function uploadLectureFile(
  courseId: number | string,
  sectionId: number | string,
  lectureId: number | string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<Lecture> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<Lecture | ApiResponse<Lecture>>(
    `${COURSES_BASE}/${courseId}/sections/${sectionId}/lectures/${lectureId}/upload`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 300000,
      onUploadProgress: (event) => {
        if (!event.total || !onProgress) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      },
    }
  );

  return normalizeLecture(unwrap(response.data));
}

export async function createAssessment(payload: {
  lectureId: number | string;
  title?: string;
  passingScore: number;
  maxAttempts: number;
}): Promise<{ id: number | string }> {
  const response = await api.post<{ id: number | string } | ApiResponse<{ id: number | string }>>(
    "/lms/assessment/create",
    payload
  );
  return unwrap(response.data);
}

export async function createAssessmentQuestion(
  assessmentId: number | string,
  payload: QuizQuestionPayload
): Promise<{ id: number | string }> {
  const response = await api.post<{ id: number | string } | ApiResponse<{ id: number | string }>>(
    `/lms/assessment/${assessmentId}/questions`,
    payload
  );
  return unwrap(response.data);
}

export async function deleteAssessmentQuestion(assessmentId: number | string, questionId: number | string): Promise<void> {
  await api.delete(`/lms/assessment/${assessmentId}/questions/${questionId}`);
}
