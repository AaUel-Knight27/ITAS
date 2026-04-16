import "server-only";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-r1:free",
  "google/gemma-3-27b-it:free",
  "openrouter/free",
] as const;

export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterResponse {
  model: string;
  choices: Array<{
    message?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  } = {}
): Promise<{
  text: string;
  model: string;
}> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not set");
  }

  const allMessages: OpenRouterMessage[] = [];

  if (options.systemPrompt) {
    allMessages.push({
      role: "system",
      content: options.systemPrompt,
    });
  }

  allMessages.push(...messages);

  let lastError: Error | null = null;

  for (const model of FREE_MODELS) {
    try {
      const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "ITAS Portal",
        },
        body: JSON.stringify({
          model,
          messages: allMessages,
          max_tokens: options.maxTokens ?? 800,
          temperature: options.temperature ?? 0.4,
          stream: false,
        }),
        cache: "no-store",
      });

      if (response.status === 429) {
        lastError = new Error(`Rate limited on ${model}`);
        continue;
      }

      if (!response.ok) {
        const body = await response.text();
        lastError = new Error(`${model} returned ${response.status}: ${body}`);
        continue;
      }

      const data = (await response.json()) as OpenRouterResponse;
      const text = data.choices?.[0]?.message?.content?.trim() || "";

      if (!text) {
        lastError = new Error(`${model} returned an empty response`);
        continue;
      }

      return {
        text,
        model: data.model || model,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown OpenRouter error");
    }
  }

  throw lastError || new Error("All AI models unavailable");
}
