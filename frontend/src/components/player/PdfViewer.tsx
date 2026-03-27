"use client";

import { useState } from "react";

interface Props {
  url: string;
  title: string;
  onComplete: () => void;
}

export default function PdfViewer({ url, title, onComplete }: Props) {
  const [hasMarked, setHasMarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function handleComplete() {
    if (hasMarked) return;
    setHasMarked(true);
    onComplete();
  }

  if (!url) {
    return (
      <div className="flex h-64 items-center justify-center bg-gray-900">
        <div className="text-center text-gray-500">
          <p className="mb-2 text-4xl">PDF</p>
          <p className="text-sm">No PDF uploaded for this lecture.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-950">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-lg text-gray-400">PDF</span>
          <span className="max-w-sm truncate text-sm font-medium text-white">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800"
          >
            Open in New Tab
          </a>
          <a
            href={url}
            download
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800"
          >
            Download
          </a>
          {!hasMarked ? (
            <button
              type="button"
              onClick={handleComplete}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700"
            >
              Mark as Read
            </button>
          ) : (
            <span className="rounded-lg border border-green-700 bg-green-900/30 px-3 py-1.5 text-xs text-green-400">
              Completed
            </span>
          )}
        </div>
      </div>

      <div className="relative flex-1">
        {loading && !error ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-sm text-gray-500">Loading PDF...</p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-500">
            <p className="text-4xl">PDF</p>
            <p className="text-sm">This browser could not display the PDF.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Open PDF
            </a>
          </div>
        ) : (
          <iframe
            src={`${url}#toolbar=1&navpanes=1`}
            title={title}
            className="h-full w-full"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
