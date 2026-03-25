"use client";

import { useRouter } from "next/navigation";

import type { SearchResultDto } from "@/lib/types";
import { getFileUrl } from "@/lib/utils";

interface Props {
  result: SearchResultDto;
}

export default function SearchResultCard({ result }: Props) {
  const router = useRouter();

  const handleClick = () => {
    if (result.slug) {
      router.push(`/courses/${result.slug}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex cursor-pointer gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md"
    >
      {result.type === "COURSE" ? (
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {result.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getFileUrl(result.thumbnailUrl) || ""}
              alt={result.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
              <span className="text-xl text-white">📚</span>
            </div>
          )}
        </div>
      ) : null}

      {result.type === "LECTURE" ? (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100">
          <span className="text-2xl">🎬</span>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              result.type === "COURSE" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
            }`}
          >
            {result.type}
          </span>
          {result.categoryName ? <span className="text-xs text-gray-400">{result.categoryName}</span> : null}
        </div>

        <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 transition-colors hover:text-blue-600">
          {result.title}
        </h3>

        {result.description ? <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{result.description}</p> : null}

        {result.highlight ? <p className="mt-1 text-xs font-medium text-blue-600">{result.highlight}</p> : null}
      </div>

      <div className="flex shrink-0 items-center text-gray-300">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
