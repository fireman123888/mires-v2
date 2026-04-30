import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { ProviderKey } from "@/lib/provider-config";
import { GenerateImageRequest } from "@/lib/api-types";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import { COSTS, deductCredits, refundCredits, getClientIp, incrementIpUsage } from "@/lib/credits";

// Vercel Hobby plan caps at 300s. Pollinations image gen can take 30s+.
export const maxDuration = 300;

const TIMEOUT_MILLIS = 110 * 1000;
const POLLINATIONS_BASE = (process.env.POLLINATIONS_BASE_URL || "https://image.pollinations.ai").replace(/\/+$/, "");
const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1024;

const withTimeout = <T>(promise: Promise<T>, timeoutMillis: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeoutMillis)
    ),
  ]);
};

async function callPollinations(prompt: string, modelId: string, seed: number): Promise<Buffer> {
  const url = new URL(`${POLLINATIONS_BASE}/prompt/${encodeURIComponent(prompt)}`);
  url.searchParams.set("width", String(DEFAULT_WIDTH));
  url.searchParams.set("height", String(DEFAULT_HEIGHT));
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
  const { prompt, provider, modelId } = (await req.json()) as GenerateImageRequest;

  if (!prompt || !provider || !modelId) {
    return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
  }

  // ---- Credit / quota gate ----
  const session = await auth.api.getSession({ headers: await nextHeaders() });
  let charged: { type: "user"; userId: string } | { type: "ip"; ip: string };

  if (session?.user) {
    const result = await deductCredits(session.user.id, COSTS.generate, "generate", {
      prompt: prompt.slice(0, 200),
      provider,
      modelId,
    });
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error === "insufficient" ? "credits_insufficient" : "user_not_found", provider },
        { status: 402 }
      );
    }
    charged = { type: "user", userId: session.user.id };
  } else {
    const ip = getClientIp(req);
    const used = await incrementIpUsage(ip);
    if ("error" in used) {
      return NextResponse.json(
        { error: "anon_daily_limit", provider },
        { status: 429 }
      );
    }
    charged = { type: "ip", ip };
  }

  try {
    const startstamp = performance.now();
    const seed = Math.floor(Math.random() * 1_000_000);

    const generatePromise = (async () => {
      const raw = await callPollinations(prompt, modelId, seed);
      let final: Buffer;
      try {
        final = await addWatermark(raw);
      } catch (wmErr) {
        console.error(`[watermark] failed [requestId=${requestId}]:`, wmErr);
        final = raw;
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
    // Refund on failure so the user's credits aren't burned by upstream errors.
    if (charged.type === "user") {
      await refundCredits(charged.userId, COSTS.generate, "generate_refund", { requestId, provider }).catch(() => {});
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error", provider },
      { status: 500 }
    );
  }
}
