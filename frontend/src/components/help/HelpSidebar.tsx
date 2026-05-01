"use client";

import { BookOpen, CircleHelp, Eye, Search, SearchX } from "lucide-react";
import { useEffect, useState } from "react";

import { helpApi } from "@/lib/api";
import type { HelpArticleDto } from "@/lib/types";

interface Props {
  pageId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpSidebar({ pageId, isOpen, onClose }: Props) {
  const [articles, setArticles] = useState<HelpArticleDto[]>([]);
  const [searchResults, setSearchResults] = useState<HelpArticleDto[] | null>(null);
  const [selected, setSelected] = useState<HelpArticleDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (isOpen && pageId) {
      void fetchPageArticles();
    }
  }, [isOpen, pageId]);

  useEffect(() => {
    if (!isOpen) {
      setSelected(null);
      setSearchQuery("");
      setSearchResults(null);
    }
  }, [isOpen]);

  const fetchPageArticles = async () => {
    setLoading(true);
    try {
      const res = await helpApi.getByPage(pageId);
      setArticles(res.data);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const res = await helpApi.search(query);
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const displayArticles = searchResults !== null ? searchResults : articles;

  return (
    <>
      {isOpen ? <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} /> : null}

      <div
        className={`fixed bottom-0 right-0 top-0 z-50 flex w-80 max-w-[90vw] flex-col border-l border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-blue-600 px-5 py-4">
          <div className="flex items-center gap-2">
            <CircleHelp className="h-5 w-5 text-white" />
            <div>
              <h2 className="text-sm font-semibold text-white">Help Center</h2>
              <p className="text-xs capitalize text-blue-200">{pageId.replace(/-/g, " ")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-white hover:text-blue-200"
          >
            ×
          </button>
        </div>

        <div className="border-b border-gray-100 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => void handleSearch(event.target.value)}
              placeholder="Search help articles..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searching ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-3 w-3 animate-spin rounded-full border border-blue-500 border-t-transparent" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="p-5">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mb-4 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                ← Back to articles
              </button>

              <h3 className="mb-3 font-semibold text-gray-900">{selected.title}</h3>
              <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{selected.content}</div>

              {selected.tags ? (
                <div className="mt-4 flex flex-wrap gap-1 border-t border-gray-100 pt-4">
                  {selected.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span key={tag} className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600">
                        {tag}
                      </span>
                    ))}
                </div>
              ) : null}

              <div className="mt-4 border-t border-gray-100 pt-4 text-xs text-gray-400">
                <p className="flex items-center gap-1"><Eye className="inline h-3 w-3" /> {selected.viewCount} views</p>
                <p className="mt-0.5">Updated: {new Date(selected.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          ) : loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : displayArticles.length === 0 ? (
            <div className="mt-8 p-5 text-center text-gray-500">
              {searchQuery ? (
                <>
                  <SearchX className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                  <p className="text-sm font-medium">No results for "{searchQuery}"</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults(null);
                    }}
                    className="mt-2 text-xs text-blue-600 underline"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <BookOpen className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                  <p className="text-sm font-medium">No help articles yet</p>
                  <p className="mt-1 text-xs">for this page</p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {searchQuery && searchResults ? (
                <div className="bg-blue-50 px-4 py-2">
                  <p className="text-xs font-medium text-blue-600">
                    {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
                  </p>
                </div>
              ) : null}

              {displayArticles.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => setSelected(article)}
                  className="w-full px-5 py-4 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {article.category ? (
                        <span className="text-xs font-medium text-blue-600">{article.category}</span>
                      ) : null}
                      <p className="mt-0.5 line-clamp-1 text-sm font-medium text-gray-900">{article.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{article.content}</p>
                    </div>
                    <svg
                      className="mt-1 h-4 w-4 shrink-0 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-center text-xs text-gray-400">
          {displayArticles.length} article{displayArticles.length !== 1 ? "s" : ""} available
        </div>
      </div>
    </>
  );
}
