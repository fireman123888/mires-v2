import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const POLL_TEXT_BASE = "https://text.pollinations.ai";

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = (await req.json()) as { text: string; voice?: string };
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Empty text" }, { status: 400 });
    }
    // Cap text length to avoid abuse + Pollinations rate limits.
    const safeText = text.slice(0, 500);
    const safeVoice = voice && /^[a-z0-9_-]+$/i.test(voice) ? voice : "nova";

    // Pollinations TTS uses OpenAI-compatible /openai/audio/speech endpoint.
    const resp = await fetch(`${POLL_TEXT_BASE}/openai/audio/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai-audio",
        input: safeText,
        voice: safeVoice,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`Pollinations TTS ${resp.status}: ${errText.slice(0, 200)}`);
    }

    const buf = await resp.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": resp.headers.get("Content-Type") || "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    console.error("tts error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
