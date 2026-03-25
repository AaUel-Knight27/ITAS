"use client";

import axios from "axios";
import { Loader2, Search, X, Filter, BookOpen } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import CourseCard from "@/components/course/CourseCard";
import api, { searchApi } from "@/lib/api";
import { getCategories } from "@/lib/api/courses";
import { getErrorMessage } from "@/lib/errors";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { canAccessCourses } from "@/lib/roles";
import type { Category, Course } from "@/types";
import type { SearchResultDto } from "@/lib/types";

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

function searchResultToCourse(result: SearchResultDto): Course {
  const categoryName = result.categoryName ?? "Uncategorized";

  return normalizeCourse({
    id: result.id,
    title: result.title,
    slug: result.slug ?? String(result.id),
    description: result.description ?? "",
    thumbnailUrl: result.thumbnailUrl ?? undefined,
    durationMinutes: 0,
    difficulty: "BEGINNER",
    published: true,
    category: {
      id: categoryName,
      name: categoryName,
    },
    categoryName,
    targetAudience: [],
  });
}

function isPublished(course: Course) {
  return course.published !== false;
}

export default function CoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = session?.user?.role ?? "";

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  const debouncedQuery = useDebounce(query.trim(), 500);
  const isSearchActive = debouncedQuery.length > 0;

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const data = await getCategories();
        if (!active) return;
        setCategories(data);
      } catch {
        if (!active) return;
      }
    }

    void loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      try {
        setError(null);
        setNeedsLogin(false);
        if (isSearchActive) {
          setIsSearching(true);
          const selectedCategoryName =
            selectedCategory === "all"
              ? undefined
              : categories.find((category) => String(category.id) === selectedCategory)?.name;
          const response = await searchApi.filter({
            query: debouncedQuery,
            category: selectedCategoryName,
            difficulty: selectedDifficulty || undefined,
          });
          if (!active) return;
          const list = response.data.map(searchResultToCourse).filter(isPublished);
          setCourses(list);
        } else {
          setIsLoading(true);
          const response = await api.get<Course[] | ApiResponse<Course[]>>("/courses");
          if (!active) return;
          const list = unwrap(response.data).map(normalizeCourse).filter(isPublished);
          setCourses(list);
        }
      } catch (err) {
        if (!active) return;
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setNeedsLogin(true);
          setError(null);
        } else {
          setError(getErrorMessage(err) || "Could not load courses. Please refresh.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
          setIsSearching(false);
        }
      }
    }

    void loadCourses();
    return () => {
      active = false;
    };
  }, [categories, debouncedQuery, isSearchActive, selectedCategory, selectedDifficulty]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && !canAccessCourses(role)) {
      router.replace("/dashboard");
    }
  }, [role, router, status]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const categoryId = course.category?.id ?? course.categoryId;
      return selectedCategory === "all" || String(categoryId) === selectedCategory;
    });
  }, [courses, selectedCategory]);

  if (status === "authenticated" && !canAccessCourses(role)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (needsLogin) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Sign in required</h2>
          <p className="mt-2 text-muted-foreground">Please sign in to browse courses.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Course Catalog</h1>
          <p className="mt-1 text-muted-foreground">
            Browse available learning content and start your educational journey.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses..."
              className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-12 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 pr-8 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        {/* Results */}
        {filteredCourses.length === 0 ? (
          isSearchActive ? (
            <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                No results for "{debouncedQuery}"
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try different keywords or browse all courses.
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">No courses found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedCategory !== "all"
                  ? "No courses found for the selected category."
                  : "Check back later for new courses."}
              </p>
            </div>
          )
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  highlightTerm={isSearchActive ? debouncedQuery : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
