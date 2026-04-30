import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const POLL_TEXT_BASE = "https://text.pollinations.ai";

const SYSTEM_PROMPT = `You are an expert AI image prompt engineer. Your job:
1. Detect the user's input language. If it's Chinese (or any non-English), translate it to natural English.
2. Expand the description with vivid visual details: subject, style, composition, lighting, color, mood, quality tags.
3. Use phrasing that works well for Flux / Stable Diffusion image generators.
4. Keep it concise (under 60 words). Output ONLY the optimized English prompt — no explanations, no quotes, no preamble.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = (await req.json()) as { prompt: string };
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Empty prompt" }, { status: 400 });
    }

    const body = {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      model: "openai-fast",
      seed: Math.floor(Math.random() * 1_000_000),
    };

    const resp = await fetch(`${POLL_TEXT_BASE}/openai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45_000),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`Pollinations text ${resp.status}: ${text.slice(0, 300)}`);
    }

    const data = await resp.json();
    const optimized = data?.choices?.[0]?.message?.content?.trim();
    if (!optimized) {
      throw new Error("Empty optimization response");
    }

    return NextResponse.json({ optimized });
  } catch (error) {
    console.error("optimize-prompt error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
