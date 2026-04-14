import type { Course } from "@/types";

export type ApiResponse<T> = {
  data?: T;
  content?: T;
  items?: T;
  results?: T;
};

export function unwrap<T>(payload: T | ApiResponse<T>): T {
  const maybe = payload as ApiResponse<T>;
  if (maybe.data !== undefined) return maybe.data;
  if (maybe.content !== undefined) return maybe.content;
  if (maybe.items !== undefined) return maybe.items;
  if (maybe.results !== undefined) return maybe.results;
  return payload as T;
}

export function normalizeCourse(course: Course): Course {
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
