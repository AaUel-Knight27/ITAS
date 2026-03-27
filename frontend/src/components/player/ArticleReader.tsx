"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  title: string;
  content: string;
  onComplete: () => void;
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function renderMarkdownish(text: string) {
  return text.split("\n").map((line, index) => {
    if (line.startsWith("# ")) {
      return (
        <h1 key={index} className="mb-4 mt-6 text-2xl font-bold text-white">
          {line.slice(2)}
        </h1>
      );
    }

    if (line.startsWith("## ")) {
      return (
        <h2 key={index} className="mb-3 mt-5 text-xl font-semibold text-white">
          {line.slice(3)}
        </h2>
      );
    }

    if (line.startsWith("### ")) {
      return (
        <h3 key={index} className="mb-2 mt-4 text-lg font-semibold text-gray-200">
          {line.slice(4)}
        </h3>
      );
    }

    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <li key={index} className="mb-1 ml-6 list-disc text-gray-300">
          {line.slice(2)}
        </li>
      );
    }

    if (line.trim() === "") {
      return <div key={index} className="h-4" />;
    }

    return (
      <p key={index} className="mb-3 leading-relaxed text-gray-300">
        {line}
      </p>
    );
  });
}

export default function ArticleReader({ title, content, onComplete }: Props) {
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [hasMarked, setHasMarked] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!bottomRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasReachedBottom(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, []);

  function handleComplete() {
    if (hasMarked) return;
    setHasMarked(true);
    onComplete();
  }

  return (
    <div className="flex h-full flex-col bg-gray-950">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-2">
        <div className="flex items-center gap-3">
          <span className="text-gray-400">Article</span>
          <span className="text-sm text-gray-500">Read through and mark complete</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFontSize((previous) => Math.max(12, previous - 2))}
              className="h-6 w-6 rounded border border-gray-700 text-xs text-gray-400 hover:text-white"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize((previous) => Math.min(24, previous + 2))}
              className="h-6 w-6 rounded border border-gray-700 text-xs text-gray-400 hover:text-white"
            >
              A+
            </button>
          </div>

          {hasMarked ? (
            <span className="rounded-lg border border-green-700 bg-green-900/30 px-3 py-1.5 text-xs text-green-400">
              Completed
            </span>
          ) : hasReachedBottom ? (
            <button
              type="button"
              onClick={handleComplete}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700"
            >
              Mark as Read
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-10" style={{ fontSize: `${fontSize}px` }}>
          <h1 className="mb-6 border-b border-gray-800 pb-4 text-3xl font-bold text-white">{title}</h1>

          {content ? (
            looksLikeHtml(content) ? (
              <article
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="prose prose-invert max-w-none">{renderMarkdownish(content)}</div>
            )
          ) : (
            <p className="italic text-gray-500">No content for this article.</p>
          )}

          <div ref={bottomRef} className="mt-8 h-4" />

          {hasReachedBottom && !hasMarked ? (
            <div className="mt-6 rounded-xl border border-green-700 bg-green-900/20 p-4 text-center">
              <p className="mb-3 text-sm text-green-400">You reached the end of this article.</p>
              <button
                type="button"
                onClick={handleComplete}
                className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Mark as Complete
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
