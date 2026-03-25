import type { Category, Course } from "@/types";

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

function normalizeCourse(course: Course): Course {
  const categoryId = course.category?.id ?? course.categoryId;
  const categoryName = course.category?.name ?? course.categoryName;
  const categoryDescription = course.category?.description ?? course.categoryDescription;

  return {
    ...course,
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

export async function getCourses(): Promise<Course[]> {
  const response = await api.get<Course[] | ApiResponse<Course[]>>("/courses");
  return unwrap(response.data).map(normalizeCourse);
}

export async function getCourseBySlug(slug: string): Promise<Course> {
  const response = await api.get<Course | ApiResponse<Course>>(`/courses/${slug}`);
  return normalizeCourse(unwrap(response.data));
}

export async function getCategories(): Promise<Category[]> {
  const response = await api.get<Category[] | ApiResponse<Category[]>>("/courses/categories");
  return unwrap(response.data);
}

export async function enrollInCourse(courseId: number | string): Promise<void> {
  await api.post("/lms/enroll", { courseId });
}
