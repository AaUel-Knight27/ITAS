"use client";

import { memo } from "react";

interface Props {
  content: string;
  title: string;
  lectureId?: number;
  onComplete?: () => void;
}

const ArticleReader = memo(function ArticleReader({ content, title, onComplete }: Props) {
  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {onComplete ? (
          <button
            type="button"
            onClick={onComplete}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            ✓ Mark as Read
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto w-full max-w-4xl">
          <div
            className="
              prose prose-slate
              max-w-none
              prose-headings:font-semibold
              prose-h1:text-2xl
              prose-h2:text-xl
              prose-h3:text-lg
              prose-p:leading-relaxed
              prose-p:text-gray-700
              prose-strong:text-gray-900
              prose-ul:list-disc
              prose-ol:list-decimal
              prose-li:my-1
              prose-a:text-blue-600
              prose-a:underline
              hover:prose-a:text-blue-800
              prose-blockquote:border-l-4
              prose-blockquote:border-blue-400
              prose-blockquote:pl-4
              prose-blockquote:italic
              prose-code:rounded
              prose-code:bg-gray-100
              prose-code:px-1.5
              prose-code:py-0.5
              prose-code:text-sm
              prose-pre:rounded-xl
              prose-pre:bg-gray-900
              prose-pre:text-gray-100
              prose-img:rounded-xl
              prose-img:shadow-md
              prose-hr:border-gray-200
              prose-table:border-collapse
              prose-th:border
              prose-th:border-gray-300
              prose-th:bg-gray-50
              prose-td:border
              prose-td:border-gray-200
              prose-td:px-3
              prose-td:py-2
              dark:prose-invert
              dark:prose-p:text-gray-300
              dark:prose-strong:text-white
              dark:prose-code:bg-gray-800
              dark:prose-hr:border-gray-700
            "
            dangerouslySetInnerHTML={{
              __html: content || '<p class="text-gray-400">No content available.</p>',
            }}
          />
        </div>
      </div>
    </div>
  );
});

export default ArticleReader;
