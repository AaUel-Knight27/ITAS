import { NextRequest, NextResponse } from "next/server";

import { callOpenRouter } from "@/lib/openrouter";

type SearchInputLecture = {
  id?: number;
  title?: string;
  type?: string;
  description?: string;
};

type SearchResult = {
  id: number;
  title: string;
  relevance: "high" | "medium" | "low";
  reason: string;
};

function sanitizeRelevance(value: unknown): SearchResult["relevance"] {
  return value === "high" || value === "medium" || value === "low" ? value : "low";
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "AI features not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { query, lectures, courseTitle } = body as {
      query?: string;
      lectures?: SearchInputLecture[];
      courseTitle?: string;
    };

    if (!query?.trim() || query.trim().length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
    }

    if (!Array.isArray(lectures) || lectures.length === 0) {
      return NextResponse.json({ error: "No lessons provided" }, { status: 400 });
    }

    const compactLectures = lectures
      .filter((lecture): lecture is Required<Pick<SearchInputLecture, "id" | "title">> & SearchInputLecture => {
        return Number.isFinite(lecture?.id) && typeof lecture?.title === "string" && lecture.title.trim().length > 0;
      })
      .slice(0, 30);

    if (compactLectures.length === 0) {
      return NextResponse.json({ error: "No valid lessons provided" }, { status: 400 });
    }

    const lectureIndex = compactLectures
      .map((lecture, index) => {
        const desc = lecture.description ? ` — ${String(lecture.description).slice(0, 100)}` : "";
        return `${index + 1}. [ID:${lecture.id}] "${lecture.title}" (${lecture.type || "VIDEO"})${desc}`;
      })
      .join("\n");

    const systemPrompt =
      "You are a search assistant for the ITAS Taxpayer Education Portal. Your job is to find the most relevant lessons for a user's query.\n\nReturn ONLY valid JSON with no markdown, no code blocks, and no explanation.";

    const userPrompt =
      `Course: "${courseTitle || "Untitled course"}"\n\n` +
      `Available lessons:\n${lectureIndex}\n\n` +
      `User searched for: "${query.trim()}"\n\n` +
      "Return a JSON array of the most relevant lessons. Maximum 5 results. Order by relevance.\n\n" +
      "Format:\n" +
      "[\n" +
      '  {\n    "id": <number>,\n    "title": "<string>",\n    "relevance": "high"|"medium"|"low",\n    "reason": "<one sentence>"\n  }\n' +
      "]\n\n" +
      "Return [] if nothing matches. Raw JSON only.";

    const { text, model } = await callOpenRouter([{ role: "user", content: userPrompt }], {
      systemPrompt,
      maxTokens: 400,
      temperature: 0.1,
    });

    let results: SearchResult[] = [];

    try {
      const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      const jsonStr = match ? match[0] : cleaned;
      const parsed = JSON.parse(jsonStr) as unknown;

      if (Array.isArray(parsed)) {
        results = parsed
          .map((item): SearchResult | null => {
            const id = Number((item as { id?: unknown }).id);
            const title = (item as { title?: unknown }).title;
            if (!Number.isFinite(id) || typeof title !== "string" || !title.trim()) {
              return null;
            }

            return {
              id,
              title: title.trim(),
              relevance: sanitizeRelevance((item as { relevance?: unknown }).relevance),
              reason:
                typeof (item as { reason?: unknown }).reason === "string" && (item as { reason?: string }).reason?.trim()
                  ? (item as { reason: string }).reason.trim()
                  : "This lesson appears relevant to your search.",
            };
          })
          .filter((item): item is SearchResult => item !== null)
          .slice(0, 5);
      }
    } catch {
      results = [];
    }

    return NextResponse.json({
      results,
      model,
      query: query.trim(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("[AI Search]", message);

    if (message.toLowerCase().includes("rate")) {
      return NextResponse.json({ error: "AI search is busy. Try again shortly." }, { status: 429 });
    }

    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}
