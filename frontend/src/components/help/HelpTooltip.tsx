"use client";

import { useEffect, useRef, useState } from "react";

import { helpApi } from "@/lib/api";
import type { HelpArticleDto } from "@/lib/types";

interface Props {
  pageId: string;
  fieldId: string;
  position?: "top" | "bottom" | "left" | "right";
}

export default function HelpTooltip({ pageId, fieldId, position = "right" }: Props) {
  const [article, setArticle] = useState<HelpArticleDto | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = async () => {
    setIsOpen((prev) => !prev);

    if (!fetched) {
      setLoading(true);
      try {
        const res = await helpApi.getContextual(pageId, fieldId);
        if (res.data.articles.length > 0) {
          setArticle(res.data.articles[0]);
        }
        setFetched(true);
      } catch {
        setFetched(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const positionClasses = {
    right: "left-full top-0 ml-2",
    left: "right-full top-0 mr-2",
    top: "bottom-full left-0 mb-2",
    bottom: "top-full left-0 mt-2",
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => void handleClick()}
        className={`flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
          isOpen
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-500 hover:bg-blue-100 hover:text-blue-600"
        }`}
        aria-label="Help"
      >
        ?
      </button>

      {isOpen ? (
        <div
          className={`absolute z-50 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-4 shadow-xl ${positionClasses[position]}`}
        >
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="h-3 w-3 animate-spin rounded-full border border-blue-500 border-t-transparent" />
              Loading help...
            </div>
          ) : article ? (
            <>
              <div className="mb-2 flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold leading-tight text-gray-900">{article.title}</h4>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="shrink-0 text-lg leading-none text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <p className="text-xs leading-relaxed text-gray-600">{article.content}</p>
              {article.tags ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {article.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span key={tag} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
                        {tag}
                      </span>
                    ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="py-2 text-center text-sm text-gray-500">No help available for this field.</div>
          )}

          {position === "right" ? (
            <div className="absolute left-0 top-3 h-2.5 w-2.5 -translate-x-1.5 rotate-45 border-b border-l border-gray-200 bg-white" />
          ) : null}
          {position === "left" ? (
            <div className="absolute right-0 top-3 h-2.5 w-2.5 translate-x-1.5 rotate-45 border-r border-t border-gray-200 bg-white" />
          ) : null}
          {position === "bottom" ? (
            <div className="absolute left-3 top-0 h-2.5 w-2.5 -translate-y-1.5 rotate-45 border-l border-t border-gray-200 bg-white" />
          ) : null}
          {position === "top" ? (
            <div className="absolute bottom-0 left-3 h-2.5 w-2.5 translate-y-1.5 rotate-45 border-b border-r border-gray-200 bg-white" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
