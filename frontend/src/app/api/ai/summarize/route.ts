import { NextRequest, NextResponse } from "next/server";

import { callOpenRouter } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      {
        error: "AI features not configured. Add OPENROUTER_API_KEY to .env.local",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { title, type, content, description } = body as {
      title?: string;
      type?: string;
      content?: string;
      description?: string;
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    let context = `Lesson: "${title.trim()}"\nType: ${type || "VIDEO"}\n`;

    if (description?.trim()) {
      context += `Description: ${description.trim()}\n`;
    }

    if (content?.trim()) {
      context += `Content preview: ${content.trim().slice(0, 4000)}\n`;
    }

    const systemPrompt =
      "You are a helpful tutor for the ITAS Taxpayer Education Portal, a government learning platform that teaches tax law, VAT, income tax, and compliance to taxpayers and tax agents.\n\nKeep your language simple, clear, professional, and encouraging. Format responses with clear sections.";

    const userPrompt =
      `Summarize this lesson for a learner who just finished it:\n\n${context}\n\n` +
      "Provide:\n" +
      "1. Overview (2-3 sentences)\n" +
      "2. Key Points (3-5 bullets)\n" +
      "3. Practical Takeaway (1 sentence)\n\n" +
      "Be concise. Use plain English.";

    const { text, model } = await callOpenRouter([{ role: "user", content: userPrompt }], {
      systemPrompt,
      maxTokens: 500,
      temperature: 0.3,
    });

    return NextResponse.json({
      summary: text,
      model,
      lectureTitle: title.trim(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("[AI Summarize]", message);

    if (message.includes("not set") || message.includes("configured")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }

    if (message.toLowerCase().includes("rate")) {
      return NextResponse.json(
        {
          error: "AI is busy right now. Please wait a moment and try again.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "Could not generate summary. Please try again.",
      },
      { status: 500 }
    );
  }
}
