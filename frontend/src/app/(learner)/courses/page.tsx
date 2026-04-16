"use client";

import axios from "axios";
import { Loader2, Search, X, Filter, BookOpen } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import CourseCard from "@/components/course/CourseCard";
import EmptyState from "@/components/ui/EmptyState";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import api, { searchApi } from "@/lib/api";
import { getCategories } from "@/lib/api/courses";
import { CACHE_KEYS, courseCache } from "@/lib/courseCache";
import { getErrorMessage } from "@/lib/errors";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { canAccessCourses } from "@/lib/roles";
import { normalizeCourse, unwrap, type ApiResponse } from "@/lib/utils/api-utils";
import type { Category, Course } from "@/types";
import type { SearchResultDto } from "@/lib/types";

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
  useScrollMemory();

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

  function handleClearFilters() {
    setQuery("");
    setSelectedCategory("all");
  }

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const cacheKey = CACHE_KEYS.categories();
        let data = courseCache.get<Category[]>(cacheKey);
        if (!data) {
          data = await getCategories();
          courseCache.set(cacheKey, data, 10 * 60 * 1000);
        }
        if (!active) return;
        setCategories(data);
      } catch (err) {
        if (!active) return;
        console.error("Failed to load categories:", err);
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
          const cacheKey = CACHE_KEYS.courses();
          let data = courseCache.get<Course[]>(cacheKey);

          if (!data) {
            const response = await api.get<Course[] | ApiResponse<Course[]>>("/courses");
            data = unwrap(response.data).map(normalizeCourse).filter(isPublished);
            courseCache.set(cacheKey, data, 3 * 60 * 1000);
          }

          if (!active) return;
          setCourses(data);
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
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 h-10 max-w-md animate-pulse rounded-xl bg-gray-200" />
        <div className="mb-6 flex gap-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-8 w-20 animate-pulse rounded-full bg-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <div className="h-40 animate-pulse bg-gray-200" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="mt-3 h-8 animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
          ))}
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
            <div className="rounded-xl border-2 border-dashed border-border bg-card/50">
              <EmptyState
                icon="🔍"
                title="No courses found"
                description="Try adjusting your search or filters."
                action={{
                  label: "Clear Filters",
                  onClick: handleClearFilters,
                }}
              />
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
