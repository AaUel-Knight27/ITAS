"use client";

import { memo, useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";

interface Lecture {
  id: number;
  title: string;
  type: string;
  description?: string;
}

interface SearchResult {
  id: number;
  title: string;
  relevance: "high" | "medium" | "low";
  reason: string;
}

interface Props {
  courseTitle: string;
  lectures: Lecture[];
  onSelectLecture: (id: number) => void;
}

const DOTS: Record<SearchResult["relevance"], string> = {
  high: "bg-green-400",
  medium: "bg-yellow-400",
  low: "bg-gray-500",
};

const BADGES: Record<SearchResult["relevance"], string> = {
  high: "border-green-800 bg-green-900/20 text-green-400",
  medium: "border-yellow-800 bg-yellow-900/20 text-yellow-400",
  low: "border-gray-700 bg-gray-800/20 text-gray-500",
};

const CourseSearch = memo(function CourseSearch({ courseTitle, lectures, onSelectLecture }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const search = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed || trimmed.length < 2) {
        setResults([]);
        setStatus("idle");
        setError("");
        return;
      }

      setStatus("loading");
      setError("");

      try {
        const response = await fetch("/api/ai/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: trimmed,
            lectures,
            courseTitle,
          }),
        });

        const data = (await response.json()) as { results?: SearchResult[]; error?: string };

        if (!response.ok) {
          throw new Error(data.error || "Search failed");
        }

        setResults(data.results || []);
        setStatus("done");
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Search failed");
        setStatus("error");
      }
    },
    [courseTitle, lectures]
  );

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void search(value);
    }, 650);
  };

  const reset = () => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setStatus("idle");
    setError("");
  };

  const handleSelect = (id: number) => {
    onSelectLecture(id);
    reset();
  };

  const open = () => {
    setIsOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 40);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        data-course-search="true"
        onClick={open}
        className="flex w-full items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-3 py-2.5 text-sm text-gray-400 transition-all duration-200 hover:border-gray-600 hover:bg-gray-800"
      >
        <span>🔍</span>
        <span className="flex-1 text-left text-sm">Search lessons...</span>
        <span className="rounded border border-gray-700 px-1.5 py-0.5 font-mono text-xs text-gray-600">Ctrl K</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-blue-600 bg-gray-800 px-3 py-2.5 ring-1 ring-blue-600/30">
        <span className="shrink-0 text-sm text-gray-400">{status === "loading" ? "⟳" : "🔍"}</span>
        <input
          ref={inputRef}
          value={query}
          onChange={handleInput}
          placeholder="Search lessons..."
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
        />
        <button
          type="button"
          onClick={reset}
          className="shrink-0 text-sm text-gray-500 transition-colors hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      {status !== "idle" ? (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
          {status === "loading" ? (
            <div className="px-4 py-5 text-center">
              <div className="mb-2 flex justify-center gap-1">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">Searching...</p>
            </div>
          ) : null}

          {status === "error" ? (
            <div className="px-4 py-4 text-center">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          ) : null}

          {status === "done" && results.length === 0 ? (
            <div className="px-4 py-5 text-center">
              <p className="mb-1 text-xl">🤔</p>
              <p className="text-sm text-gray-400">No matches found</p>
              <p className="mt-0.5 text-xs text-gray-600">Try different keywords</p>
            </div>
          ) : null}

          {status === "done" && results.length > 0 ? (
            <>
              <div className="border-b border-gray-800 px-3 py-2">
                <p className="text-xs text-gray-500">
                  {results.length} {results.length === 1 ? "result" : "results"}
                </p>
              </div>

              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleSelect(result.id)}
                  className="group w-full border-b border-gray-800/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-gray-800"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOTS[result.relevance]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white transition-colors group-hover:text-blue-300">
                        {result.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-gray-500">{result.reason}</p>
                    </div>
                    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${BADGES[result.relevance]}`}>
                      {result.relevance}
                    </span>
                  </div>
                </button>
              ))}

              <div className="border-t border-gray-800 px-4 py-2">
                <p className="text-center text-[10px] text-gray-700">AI search via OpenRouter (free)</p>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

export default CourseSearch;
