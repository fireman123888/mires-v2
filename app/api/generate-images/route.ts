import { NextRequest, NextResponse } from "next/server";
import { ProviderKey } from "@/lib/provider-config";
import { GenerateImageRequest } from "@/lib/api-types";

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

async function callPollinations(prompt: string, modelId: string, seed: number): Promise<string> {
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
  const buffer = await resp.arrayBuffer();
  if (buffer.byteLength < 1024) {
    throw new Error(`Suspiciously small response: ${buffer.byteLength} bytes`);
  }
  return Buffer.from(buffer).toString("base64");
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const { prompt, provider, modelId } = (await req.json()) as GenerateImageRequest;

  try {
    if (!prompt || !provider || !modelId) {
      const error = "Invalid request parameters";
      console.error(`${error} [requestId=${requestId}]`);
      return NextResponse.json({ error }, { status: 400 });
    }

    const startstamp = performance.now();
    const seed = Math.floor(Math.random() * 1_000_000);

    const generatePromise = callPollinations(prompt, modelId, seed).then((base64) => {
      console.log(
        `Completed image request [requestId=${requestId}, provider=${provider}, model=${modelId}, elapsed=${(
          (performance.now() - startstamp) /
          1000
        ).toFixed(1)}s].`
      );
      return { provider: provider as ProviderKey, image: base64 };
    });

    const result = await withTimeout(generatePromise, TIMEOUT_MILLIS);
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      `Error in generate-images [requestId=${requestId}, provider=${provider}, model=${modelId}]:`,
      error
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error", provider },
      { status: 500 }
    );
  }
}
