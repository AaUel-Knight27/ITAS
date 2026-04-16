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
    const { title, type, content, description, courseTitle, sectionTitle, learnerNotes, pageText, captions } = body as {
      title?: string;
      type?: string;
      content?: string;
      description?: string;
      courseTitle?: string;
      sectionTitle?: string;
      learnerNotes?: string;
      pageText?: string;
      captions?: string;
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    let context = `Lesson: "${title.trim()}"\nType: ${type || "VIDEO"}\n`;

    if (courseTitle?.trim()) {
      context += `Course: ${courseTitle.trim()}\n`;
    }

    if (sectionTitle?.trim()) {
      context += `Section: ${sectionTitle.trim()}\n`;
    }

    if (description?.trim()) {
      context += `Description: ${description.trim()}\n`;
    }

    if (content?.trim()) {
      context += `Content preview: ${content.trim().slice(0, 4000)}\n`;
    }

    if (pageText?.trim()) {
      context += `Learning material detected on page: ${pageText.trim().slice(0, 5000)}\n`;
    }

    if (captions?.trim()) {
      context += `Video captions or transcript: ${captions.trim().slice(0, 7000)}\n`;
    }

    if (learnerNotes?.trim()) {
      context += `My own notes so far: ${learnerNotes.trim().slice(0, 2000)}\n`;
    }

    const systemPrompt =
      "You are helping a learner create a short personal study note after watching a lesson on the ITAS Taxpayer Education Portal.\n\nWrite in simple, natural English as if the learner is jotting down their own quick notes. Keep it brief, clear, and practical. Do not sound formal, robotic, or like a textbook.";

    const userPrompt =
      `Write a short learner note for this lesson as if I watched the whole lesson and I am jotting down my own short notes.\n\n${context}\n\n` +
      "Instructions:\n" +
      "- If video captions are available, use them as the main signal for what the video taught.\n" +
      "- Also use the learning material detected on the page as supporting context.\n" +
      "- Focus on the whole lesson or video.\n" +
      "- Keep it short and easy to review later.\n" +
      "- Use first-person learner note style when natural.\n" +
      "- Include 4 to 6 short bullet points.\n" +
      "- End with one very short takeaway line.\n" +
      "- Do not use long paragraphs.\n" +
      "- Return only the short note.";

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

    if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
      return NextResponse.json(
        {
          error: "AI features are configured with an invalid OpenRouter API key.",
        },
        { status: 502 }
      );
    }

    if (message.includes("402")) {
      return NextResponse.json(
        {
          error: "The configured OpenRouter account cannot serve this request right now.",
        },
        { status: 502 }
      );
    }

    if (message.includes("403")) {
      return NextResponse.json(
        {
          error: "OpenRouter rejected this request. Check the configured API key and model access.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: message || "Could not generate summary. Please try again.",
      },
      { status: 500 }
    );
  }
}
