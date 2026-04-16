"use client";

import { memo, useCallback, useState } from "react";

interface Props {
  lectureId: number;
  lectureTitle: string;
  lectureType: string;
  description?: string;
  content?: string;
}

type Status = "idle" | "loading" | "done" | "error";

const AiSummaryPanel = memo(function AiSummaryPanel({
  lectureId,
  lectureTitle,
  lectureType,
  description,
  content,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [usedModel, setUsedModel] = useState("");

  const generate = useCallback(async () => {
    setStatus("loading");
    setError("");
    setSummary("");
    setUsedModel("");

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lectureId,
          title: lectureTitle,
          type: lectureType,
          description,
          content,
        }),
      });

      const data = (await response.json()) as { summary?: string; model?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate");
      }

      setSummary(data.summary || "");
      setUsedModel(data.model || "");
      setStatus("done");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong");
      setStatus("error");
    }
  }, [content, description, lectureId, lectureTitle, lectureType]);

  const renderSummary = (text: string) =>
    text.split("\n").map((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <div key={index} className="h-1.5" />;
      }

      if (/^\d+\.\s+\*{0,2}[A-Z]/.test(trimmed)) {
        return (
          <p key={index} className="mt-3 mb-1 text-sm font-semibold text-white first:mt-0">
            {trimmed.replace(/\*\*/g, "")}
          </p>
        );
      }

      if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("* ")) {
        return (
          <div key={index} className="flex gap-2 text-sm leading-relaxed text-gray-300">
            <span className="mt-0.5 shrink-0 text-purple-400">▸</span>
            <span>{trimmed.slice(2).replace(/\*\*/g, "")}</span>
          </div>
        );
      }

      return (
        <p key={index} className="text-sm leading-relaxed text-gray-300">
          {trimmed.replace(/\*\*/g, "")}
        </p>
      );
    });

  if (status === "idle") {
    return (
      <div className="p-4">
        <button
          type="button"
          onClick={generate}
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-purple-700/60 bg-purple-900/20 px-4 py-3 text-sm font-medium text-purple-300 transition-all duration-200 hover:border-purple-600 hover:bg-purple-900/40"
        >
          <span className="text-base transition-transform duration-200 group-hover:scale-110">✨</span>
          Generate AI Summary
          <span className="ml-1 rounded border border-purple-700 px-1.5 py-0.5 font-mono text-[10px] text-purple-500">
            free
          </span>
        </button>
        <p className="mt-2 text-center text-xs text-gray-600">Powered by free AI via OpenRouter</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-xl border border-purple-800 bg-purple-900/20 px-4 py-3">
          <div className="flex shrink-0 gap-1">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400"
                style={{ animationDelay: `${index * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-purple-300">Reading this lesson...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-3 p-4">
        <div className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">{error}</div>
        <button
          type="button"
          onClick={generate}
          className="w-full rounded-lg border border-gray-700 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">AI Summary</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setSummary("");
            setError("");
            setUsedModel("");
          }}
          className="text-xs text-gray-600 transition-colors hover:text-gray-400"
        >
          ✕ Dismiss
        </button>
      </div>

      <div className="space-y-1.5 rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">{renderSummary(summary)}</div>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={generate}
          className="flex items-center gap-1 text-xs text-gray-600 transition-colors hover:text-gray-400"
        >
          <span>↺</span>
          Regenerate
        </button>
        {usedModel ? (
          <p className="max-w-[180px] truncate font-mono text-[10px] text-gray-700" title={usedModel}>
            {usedModel.split("/")[1]?.replace(":free", "") || "AI"}
          </p>
        ) : null}
      </div>
    </div>
  );
});

export default AiSummaryPanel;
