"use client";

import { Frown, Search } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { searchApi } from "@/lib/api";
import type { SearchResponseDto } from "@/lib/types";
import SearchBar from "@/components/search/SearchBar";
import SearchFilters from "@/components/search/SearchFilters";
import SearchResultCard from "@/components/search/SearchResultCard";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<SearchResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "");
  const [activeType, setActiveType] = useState<"all" | "courses" | "lectures">("all");

  useEffect(() => {
    setCategory(searchParams.get("category") || "");
    setDifficulty(searchParams.get("difficulty") || "");
  }, [searchParams]);

  useEffect(() => {
    if (query) {
      void fetchResults(query);
    } else {
      setResults(null);
    }
  }, [query, category, difficulty]);

  const fetchResults = async (searchQuery: string) => {
    setLoading(true);
    setError("");
    try {
      let data: SearchResponseDto;

      if (category || difficulty) {
        const res = await searchApi.filter({
          query: searchQuery,
          category: category || undefined,
          difficulty: difficulty || undefined,
        });
        data = {
          query: searchQuery,
          totalResults: res.data.length,
          searchTimeMs: 0,
          courses: res.data,
          lectures: [],
          suggestions: [],
        };
      } else {
        const res = await searchApi.search(searchQuery);
        data = res.data;
      }

      setResults(data);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = (searchQuery: string) => {
    const params = new URLSearchParams();
    params.set("q", searchQuery);
    if (category) params.set("category", category);
    if (difficulty) params.set("difficulty", difficulty);
    router.push(`/search?${params.toString()}`);
  };

  const handleFilterChange = (filters: { category: string; difficulty: string }) => {
    setCategory(filters.category);
    setDifficulty(filters.difficulty);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filters.category) params.set("category", filters.category);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    router.push(`/search?${params.toString()}`);
  };

  const displayCourses = results?.courses || [];
  const displayLectures = results?.lectures || [];
  const filteredCourses = activeType === "lectures" ? [] : displayCourses;
  const filteredLectures = activeType === "courses" ? [] : displayLectures;
  const totalShown = filteredCourses.length + filteredLectures.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <SearchBar
          placeholder="Search courses, lectures..."
          autoFocus={!query}
          onSearch={handleNewSearch}
        />
      </div>

      {query ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {loading
                ? "Searching..."
                : results
                  ? `${results.totalResults} result${results.totalResults !== 1 ? "s" : ""} for "${query}"`
                  : `Search results for "${query}"`}
            </h1>
            {results && !loading ? (
              <p className="mt-0.5 text-xs text-gray-400">Found in {results.searchTimeMs}ms</p>
            ) : null}
          </div>

          {results && results.totalResults > 0 ? (
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              {[
                { id: "all" as const, label: "All", count: results.totalResults },
                { id: "courses" as const, label: "Courses", count: displayCourses.length },
                { id: "lectures" as const, label: "Lectures", count: displayLectures.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveType(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeType === tab.id ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 ? <span className="ml-1 text-gray-400">({tab.count})</span> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-6">
        <aside className="hidden w-48 shrink-0 lg:block">
          <SearchFilters category={category} difficulty={difficulty} onChange={handleFilterChange} />
        </aside>

        <div className="min-w-0 flex-1">
          {results?.suggestions && results.suggestions.length > 0 ? (
            <div className="mb-4 text-sm text-gray-500">
              Did you mean:{" "}
              {results.suggestions.map((suggestion, index) => (
                <span key={suggestion}>
                  {index > 0 ? ", " : null}
                  <button
                    type="button"
                    onClick={() => handleNewSearch(suggestion)}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {suggestion}
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          {error ? <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : !query ? (
            <div className="py-16 text-center text-gray-500">
              <Search className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-lg font-medium">Search for courses</p>
              <p className="mt-1 text-sm">Enter a topic, course name, or keyword above</p>
            </div>
          ) : totalShown === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Frown className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-lg font-medium">No results for "{query}"</p>
              <p className="mb-4 mt-1 text-sm">Try different keywords or browse the course catalog</p>
              <button
                type="button"
                onClick={() => router.push("/courses")}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Browse All Courses
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCourses.length > 0 ? (
                <section>
                  {activeType === "all" ? (
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                      Courses ({filteredCourses.length})
                    </h2>
                  ) : null}
                  <div className="space-y-3">
                    {filteredCourses.map((result) => (
                      <SearchResultCard key={`course-${result.id}`} result={result} />
                    ))}
                  </div>
                </section>
              ) : null}

              {filteredLectures.length > 0 ? (
                <section>
                  {activeType === "all" ? (
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                      Lectures ({filteredLectures.length})
                    </h2>
                  ) : null}
                  <div className="space-y-3">
                    {filteredLectures.map((result) => (
                      <SearchResultCard key={`lecture-${result.id}`} result={result} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
