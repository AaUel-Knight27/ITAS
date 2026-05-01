"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { searchApi } from "@/lib/api";

interface Props {
  placeholder?: string;
  autoFocus?: boolean;
  onSearch?: (query: string) => void;
  compact?: boolean;
}

export default function SearchBar({
  placeholder = "Search courses...",
  autoFocus = false,
  onSearch,
  compact = false,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (value: string) => {
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const res = await searchApi.suggest(value);
      setSuggestions(res.data);
      setShowSuggestions(res.data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    setActiveSuggestion(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(value);
    }, 300);
  };

  const handleSearch = (value?: string) => {
    const searchQuery = value || query;
    if (!searchQuery.trim()) return;

    setShowSuggestions(false);
    setQuery(searchQuery);

    if (onSearch) {
      onSearch(searchQuery);
      return;
    }

    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        handleSearch(suggestions[activeSuggestion]);
      } else {
        handleSearch();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((prev) => Math.max(prev - 1, -1));
      return;
    }

    if (event.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${compact ? "w-56" : "w-full max-w-xl"}`}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          <Search className="h-4 w-4" />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-gray-300 bg-white pl-9 pr-9 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            compact ? "py-1.5" : "py-2.5"
          }`}
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setShowSuggestions(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        ) : null}

        {loading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-3 w-3 animate-spin rounded-full border border-blue-500 border-t-transparent" />
          </div>
        ) : null}
      </div>

      {showSuggestions && suggestions.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSearch(suggestion)}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                index === activeSuggestion ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Search className="h-3 w-3 text-gray-400" />
              <span>{highlightMatch(suggestion, query)}</span>
            </button>
          ))}
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
            <button
              type="button"
              onClick={() => handleSearch()}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Search for "{query}" →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function highlightMatch(text: string, query: string) {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return <span>{text}</span>;

  return (
    <>
      {text.slice(0, index)}
      <strong className="text-blue-700">{text.slice(index, index + query.length)}</strong>
      {text.slice(index + query.length)}
    </>
  );
}
