"use client";

import { memo, useCallback, useState } from "react";

import { API_BASE } from "@/lib/config";

interface Props {
  lectureId: number;
  lectureTitle: string;
  lectureType: string;
  description?: string;
  content?: string;
  courseTitle?: string;
  sectionTitle?: string;
  learnerNotes?: string;
}

type Status = "idle" | "loading" | "done" | "error";

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripVtt(value: string) {
  return value
    .replace(/^WEBVTT[\s\S]*?\n\n/i, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) {
        return false;
      }
      if (/^\d+$/.test(line)) {
        return false;
      }
      if (/^\d{2}:\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}$/.test(line)) {
        return false;
      }
      return true;
    })
    .join(" ");
}

const AiSummaryPanel = memo(function AiSummaryPanel({
  lectureId,
  lectureTitle,
  lectureType,
  description,
  content,
  courseTitle,
  sectionTitle,
  learnerNotes,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [usedModel, setUsedModel] = useState("");

  const collectPageText = useCallback(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-ai-note-source]"));
    const chunks = elements
      .map((element) => cleanText(element.innerText || element.textContent || ""))
      .filter(Boolean);

    return Array.from(new Set(chunks)).join("\n").slice(0, 6000);
  }, []);

  const loadVideoCaptions = useCallback(async () => {
    if (lectureType.toUpperCase() !== "VIDEO" || !Number.isFinite(lectureId)) {
      return "";
    }

    try {
      const src = `${API_BASE}/content/video/${lectureId}/captions`;
      const response = await fetch(`/api/media?src=${encodeURIComponent(src)}`);
      if (!response.ok) {
        return "";
      }

      const text = await response.text();
      return cleanText(stripVtt(text)).slice(0, 8000);
    } catch {
      return "";
    }
  }, [lectureId, lectureType]);

  const generate = useCallback(async () => {
    setStatus("loading");
    setError("");
    setSummary("");
    setUsedModel("");

    try {
      const [pageText, captions] = await Promise.all([Promise.resolve(collectPageText()), loadVideoCaptions()]);

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
          courseTitle,
          sectionTitle,
          learnerNotes,
          pageText,
          captions,
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
  }, [collectPageText, content, courseTitle, description, learnerNotes, lectureId, lectureTitle, lectureType, loadVideoCaptions, sectionTitle]);

  const renderSummary = (text: string) =>
    text.split("\n").map((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <div key={index} className="h-1.5" />;
      }

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <div key={index} className="flex gap-2 text-sm leading-relaxed text-gray-300">
            <span className="mt-0.5 shrink-0 text-purple-400">-</span>
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
          <span className="text-base transition-transform duration-200 group-hover:scale-110">*</span>
          Generate Short Note
          <span className="ml-1 rounded border border-purple-700 px-1.5 py-0.5 font-mono text-[10px] text-purple-500">
            free
          </span>
        </button>
        <p className="mt-2 text-center text-xs text-gray-600">Get a quick learner-style note for this lesson</p>
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
          <p className="text-sm text-purple-300">Writing your short note...</p>
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
          <span className="text-base">*</span>
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">Short Note</p>
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
          Close
        </button>
      </div>

      <div className="space-y-1.5 rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">{renderSummary(summary)}</div>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={generate}
          className="flex items-center gap-1 text-xs text-gray-600 transition-colors hover:text-gray-400"
        >
          Refresh note
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
