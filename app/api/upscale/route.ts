import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import { COSTS, deductCredits, refundCredits, getClientIp } from "@/lib/credits";
import { acquireConcurrency, getUserRateLimit, retryAfterSeconds } from "@/lib/ratelimit";

export const maxDuration = 300;

const POLLINATIONS_BASE = (process.env.POLLINATIONS_BASE_URL || "https://image.pollinations.ai").replace(/\/+$/, "");

/**
 * Watermark for upscaled output (mirrors generate-images route).
 */
async function addWatermark(input: Buffer): Promise<Buffer> {
  const meta = await sharp(input).metadata();
  const w = meta.width ?? 2048;
  const h = meta.height ?? 2048;
  const wmWidth = Math.round(w * 0.18);
  const wmHeight = Math.round(wmWidth * 0.32);
  const fontSize = Math.round(wmHeight * 0.55);
  const margin = Math.round(w * 0.025);
  const svg = `
    <svg width="${wmWidth}" height="${wmHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#25F4EE" stop-opacity="0.95"/>
          <stop offset="1" stop-color="#FE2C55" stop-opacity="0.95"/>
        </linearGradient>
        <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="black" flood-opacity="0.5"/></filter>
      </defs>
      <rect x="0" y="0" width="${wmWidth}" height="${wmHeight}" rx="${wmHeight / 2}" ry="${wmHeight / 2}" fill="black" fill-opacity="0.55"/>
      <text x="${wmWidth / 2}" y="${wmHeight * 0.7}" text-anchor="middle"
            font-family="-apple-system, system-ui, sans-serif"
            font-weight="900" font-size="${fontSize}"
            fill="url(#g)" filter="url(#shadow)">Mires</text>
    </svg>
  `;
  return sharp(input)
    .composite([{ input: Buffer.from(svg), top: h - wmHeight - margin, left: w - wmWidth - margin }])
    .jpeg({ quality: 92 })
    .toBuffer();
}

export async function POST(req: NextRequest) {
  const { prompt, model, seed } = (await req.json()) as {
    prompt: string;
    model?: string;
    seed?: number;
  };
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: await nextHeaders() });
  if (!session?.user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  // Rate limit
  const limiter = getUserRateLimit();
  if (limiter) {
    const r = await limiter.limit(`upscale:${session.user.id}`);
    if (!r.success) {
      return NextResponse.json(
        { error: "rate_limited", retryAfter: retryAfterSeconds(r.reset) },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds(r.reset)) } }
      );
    }
  }

  // Concurrency cap
  const cc = await acquireConcurrency({ userId: session.user.id, ip: getClientIp(req) });
  if (!cc.ok) {
    return NextResponse.json({ error: cc.reason }, { status: 429, headers: { "Retry-After": "10" } });
  }

  const deduct = await deductCredits(session.user.id, COSTS.upscale, "upscale", { prompt: prompt.slice(0, 200), model });
  if ("error" in deduct) {
    await cc.release();
    return NextResponse.json(
      { error: deduct.error === "insufficient" ? "credits_insufficient" : "user_not_found" },
      { status: 402 }
    );
  }
  const userId = session.user.id;

  try {

    // Re-generate at 2048x2048 (Pollinations max). Reuse the seed if provided
    // so the upscaled version is "the same image, sharper".
    const url = new URL(`${POLLINATIONS_BASE}/prompt/${encodeURIComponent(prompt)}`);
    url.searchParams.set("width", "2048");
    url.searchParams.set("height", "2048");
    url.searchParams.set("model", model || "flux");
    url.searchParams.set("nologo", "true");
    url.searchParams.set("private", "true");
    if (seed !== undefined) url.searchParams.set("seed", String(seed));

    const resp = await fetch(url, { headers: { Accept: "image/*" } });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`Pollinations ${resp.status}: ${text.slice(0, 200)}`);
    }
    const ct = resp.headers.get("content-type") || "image/jpeg";
    if (!ct.startsWith("image/")) throw new Error(`Non-image response: ${ct}`);
    const raw = Buffer.from(await resp.arrayBuffer());
    if (raw.byteLength < 5000) throw new Error(`Suspiciously small: ${raw.byteLength}`);

    const final = await addWatermark(raw);
    return NextResponse.json({ image: final.toString("base64") });
  } catch (error) {
    console.error("upscale error:", error);
    await refundCredits(userId, COSTS.upscale, "upscale_refund", { prompt: prompt.slice(0, 200) }).catch(() => {});
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  } finally {
    await cc.release();
  }
}
