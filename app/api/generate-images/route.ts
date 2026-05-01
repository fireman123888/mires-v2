import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { ProviderKey } from "@/lib/provider-config";
import { ASPECT_DIMS, AspectRatio, GenerateImageRequest } from "@/lib/api-types";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import {
  COSTS,
  deductCredits,
  refundCredits,
  getClientIp,
  incrementIpUsage,
  incrementGlobalDailyCounter,
  NANO_BANANA_DAILY_CAP,
  NANO_BANANA_GLOBAL_KEY,
} from "@/lib/credits";
import { acquireConcurrency, getIpRateLimit, getUserRateLimit, retryAfterSeconds } from "@/lib/ratelimit";
import { isProActive } from "@/lib/plans";
import {
  callGemini,
  isNanoBananaModel,
  GeminiQuotaError,
  GeminiSafetyError,
} from "@/lib/gemini-image";

// Vercel Hobby plan caps at 300s. Pollinations image gen can take 30s+.
export const maxDuration = 300;

const TIMEOUT_MILLIS = 110 * 1000;
const POLLINATIONS_BASE = (process.env.POLLINATIONS_BASE_URL || "https://image.pollinations.ai").replace(/\/+$/, "");
const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1024;

function dimsFor(aspectRatio?: AspectRatio): { width: number; height: number } {
  if (!aspectRatio) return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
  return ASPECT_DIMS[aspectRatio] ?? { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
}

const withTimeout = <T>(promise: Promise<T>, timeoutMillis: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeoutMillis)
    ),
  ]);
};

async function callPollinations(
  prompt: string,
  modelId: string,
  seed: number,
  width: number,
  height: number
): Promise<Buffer> {
  const url = new URL(`${POLLINATIONS_BASE}/prompt/${encodeURIComponent(prompt)}`);
  url.searchParams.set("width", String(width));
  url.searchParams.set("height", String(height));
  url.searchParams.set("model", modelId);
  url.searchParams.set("nologo", "true");
  url.searchParams.set("private", "true");
  url.searchParams.set("seed", String(seed));

  const resp = await fetch(url, {
    method: "GET",
    headers: { Accept: "image/*" },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Pollinations ${resp.status}: ${text.slice(0, 200)}`);
  }
  const contentType = resp.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Non-image response: ${contentType}`);
  }
  const buffer = Buffer.from(await resp.arrayBuffer());
  if (buffer.byteLength < 1024) {
    throw new Error(`Suspiciously small response: ${buffer.byteLength} bytes`);
  }
  return buffer;
}

/**
 * Composite a "Mires" watermark on the bottom-right of the image.
 * Uses sharp + SVG overlay so it works at any image size.
 */
async function addWatermark(input: Buffer): Promise<Buffer> {
  const meta = await sharp(input).metadata();
  const w = meta.width ?? DEFAULT_WIDTH;
  const h = meta.height ?? DEFAULT_HEIGHT;

  // Watermark sized proportionally — about 18% of image width
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
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="black" flood-opacity="0.5"/>
        </filter>
      </defs>
      <rect x="0" y="0" width="${wmWidth}" height="${wmHeight}" rx="${wmHeight / 2}" ry="${wmHeight / 2}" fill="black" fill-opacity="0.55"/>
      <text x="${wmWidth / 2}" y="${wmHeight * 0.7}" text-anchor="middle"
            font-family="-apple-system, system-ui, 'Segoe UI', sans-serif"
            font-weight="900" font-size="${fontSize}"
            fill="url(#g)" filter="url(#shadow)">Mires</text>
    </svg>
  `;

  return sharp(input)
    .composite([
      {
        input: Buffer.from(svg),
        top: h - wmHeight - margin,
        left: w - wmWidth - margin,
      },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const { prompt: rawPrompt, provider, modelId, aspectRatio, negativePrompt } =
    (await req.json()) as GenerateImageRequest;

  if (!rawPrompt || !provider || !modelId) {
    return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
  }

  // Negative prompt is appended as a natural-language directive — works
  // for both Pollinations (no native param support across all models) and
  // Gemini (which understands "avoid X" instructions in the main prompt).
  const prompt =
    negativePrompt && negativePrompt.trim().length > 0
      ? `${rawPrompt.trim()}. Avoid: ${negativePrompt.trim()}`
      : rawPrompt.trim();
  const dims = dimsFor(aspectRatio);

  const ip = getClientIp(req);
  const session = await auth.api.getSession({ headers: await nextHeaders() });

  // ---- Layer 1: per-IP / per-user rate limit (sliding window) ----
  const limiter = session?.user ? getUserRateLimit() : getIpRateLimit();
  const limitKey = session?.user ? session.user.id : ip;
  if (limiter) {
    const r = await limiter.limit(limitKey);
    if (!r.success) {
      return NextResponse.json(
        { error: "rate_limited", provider, retryAfter: retryAfterSeconds(r.reset) },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds(r.reset)) } }
      );
    }
  }

  // ---- Layer 2 & 3: concurrency cap (per-identity + global) ----
  const cc = await acquireConcurrency({ userId: session?.user?.id ?? null, ip });
  if (!cc.ok) {
    return NextResponse.json(
      { error: cc.reason, provider },
      { status: 429, headers: { "Retry-After": "10" } }
    );
  }

  // ---- Credit / quota gate ----
  const useNanoBanana = isNanoBananaModel(modelId);
  const generateCost = useNanoBanana ? COSTS.nanoBanana : COSTS.generate;
  let charged: { type: "user"; userId: string; cost: number } | { type: "ip"; ip: string };

  if (session?.user) {
    const result = await deductCredits(session.user.id, generateCost, "generate", {
      prompt: prompt.slice(0, 200),
      provider,
      modelId,
    });
    if ("error" in result) {
      await cc.release();
      return NextResponse.json(
        { error: result.error === "insufficient" ? "credits_insufficient" : "user_not_found", provider },
        { status: 402 }
      );
    }
    charged = { type: "user", userId: session.user.id, cost: generateCost };
  } else {
    const used = await incrementIpUsage(ip);
    if ("error" in used) {
      await cc.release();
      return NextResponse.json(
        { error: "anon_daily_limit", provider },
        { status: 429 }
      );
    }
    charged = { type: "ip", ip };
  }

  // ---- Nano Banana global daily cap (50 RPD on AI Studio free tier) ----
  if (useNanoBanana) {
    const q = await incrementGlobalDailyCounter(NANO_BANANA_GLOBAL_KEY, NANO_BANANA_DAILY_CAP);
    if ("error" in q) {
      if (charged.type === "user") {
        await refundCredits(charged.userId, charged.cost, "nano_banana_quota_refund", { provider }).catch(() => {});
      }
      await cc.release();
      return NextResponse.json(
        { error: "nano_banana_quota_exhausted", provider },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }
  }

  try {
    const startstamp = performance.now();
    const seed = Math.floor(Math.random() * 1_000_000);

    // Pro/Ultimate users get watermark-free output. Free users always get watermark.
    const proExpiresAt = (session?.user as unknown as { proPlanExpiresAt?: Date | string | null })
      ?.proPlanExpiresAt ?? null;
    const isPro = isProActive(proExpiresAt);

    const generatePromise = (async () => {
      const raw = useNanoBanana
        ? await callGemini(prompt)
        : await callPollinations(prompt, modelId, seed, dims.width, dims.height);
      let final: Buffer;
      if (isPro) {
        final = raw;
      } else {
        try {
          final = await addWatermark(raw);
        } catch (wmErr) {
          console.error(`[watermark] failed [requestId=${requestId}]:`, wmErr);
          final = raw;
        }
      }
      console.log(
        `Completed image request [requestId=${requestId}, provider=${provider}, model=${modelId}, elapsed=${(
          (performance.now() - startstamp) /
          1000
        ).toFixed(1)}s].`
      );
      return { provider: provider as ProviderKey, image: final.toString("base64") };
    })();

    const result = await withTimeout(generatePromise, TIMEOUT_MILLIS);
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      `Error in generate-images [requestId=${requestId}, provider=${provider}, model=${modelId}]:`,
      error
    );
    if (charged.type === "user") {
      const refundReason = error instanceof GeminiQuotaError
        ? "nano_banana_quota_refund"
        : error instanceof GeminiSafetyError
          ? "nano_banana_safety_refund"
          : "generate_refund";
      await refundCredits(charged.userId, charged.cost, refundReason, { requestId, provider }).catch(() => {});
    }
    if (error instanceof GeminiQuotaError) {
      return NextResponse.json(
        { error: "nano_banana_quota_exhausted", provider },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }
    if (error instanceof GeminiSafetyError) {
      return NextResponse.json(
        { error: "nano_banana_safety_blocked", provider },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error", provider },
      { status: 500 }
    );
  } finally {
    await cc.release();
  }
}
