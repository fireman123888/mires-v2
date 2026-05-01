// Cloudflare Workers AI adapter for Flux 1 Schnell.
//
// Free-tier specs (2026):
//   - 10,000 Neurons/day shared across all CF AI calls
//   - Flux Schnell ≈ 100 neurons/image → ~100 images/day site-wide
//   - 429 on quota exhaustion (no auto-billing)
//   - Global edge inference (US/EU/APAC), notably faster than Pollinations
//
// Endpoint:
//   POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/ai/run/{MODEL}
//   Authorization: Bearer {API_TOKEN}
//   Body: { prompt, num_steps?, width?, height? }
//   Response (default JSON): { result: { image: "<base64>" } }

const CF_BASE = "https://api.cloudflare.com/client/v4/accounts";

export class CloudflareQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloudflareQuotaError";
  }
}

const MODEL_MAP: Record<string, string> = {
  "flux-schnell-cf": "@cf/black-forest-labs/flux-1-schnell",
  "sdxl-cf": "@cf/stabilityai/stable-diffusion-xl-base-1.0",
};

interface CfImageResponse {
  result?: {
    image?: string; // base64
  };
  success?: boolean;
  errors?: Array<{ code?: number; message: string }>;
  messages?: Array<{ message: string }>;
}

interface CallOptions {
  width?: number;
  height?: number;
}

export async function callCloudflare(
  prompt: string,
  modelId: string,
  options: CallOptions = {}
): Promise<Buffer> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN not set"
    );
  }

  const cfModel = MODEL_MAP[modelId] ?? "@cf/black-forest-labs/flux-1-schnell";
  const url = `${CF_BASE}/${accountId}/ai/run/${cfModel}`;

  const body: Record<string, unknown> = {
    prompt,
    num_steps: 4, // Schnell is optimized for 4 steps
  };
  if (options.width) body.width = options.width;
  if (options.height) body.height = options.height;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (resp.status === 429) {
    throw new CloudflareQuotaError("Cloudflare daily quota exhausted");
  }

  const text = await resp.text();
  let data: CfImageResponse;
  try {
    data = JSON.parse(text) as CfImageResponse;
  } catch {
    // Some CF AI models still return raw binary — handle that path.
    if (resp.headers.get("content-type")?.startsWith("image/")) {
      const buf = Buffer.from(await resp.arrayBuffer());
      if (buf.byteLength < 1024) {
        throw new Error(`Cloudflare returned suspiciously small buffer: ${buf.byteLength}`);
      }
      return buf;
    }
    throw new Error(`Cloudflare ${resp.status}: ${text.slice(0, 300)}`);
  }

  if (!resp.ok || data.success === false) {
    const msg = data.errors?.[0]?.message ?? `HTTP ${resp.status}`;
    if (/quota|rate|exhausted/i.test(msg)) {
      throw new CloudflareQuotaError(msg);
    }
    throw new Error(`Cloudflare ${resp.status}: ${msg.slice(0, 300)}`);
  }

  const b64 = data.result?.image;
  if (!b64) {
    throw new Error("Cloudflare returned no image data");
  }
  return Buffer.from(b64, "base64");
}

export function isCloudflareModel(modelId: string): boolean {
  return modelId in MODEL_MAP;
}
