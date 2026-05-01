// Google AI Studio (Gemini 3 Pro Image / Nano Banana 2) adapter.
//
// Free-tier specs (2026 mid-year, AI Studio):
//   - 10 requests / minute
//   - 500 requests / day per API key
//   - data may be used for training (free tier default)
//   - hard 429 on exhaustion — never silently bills
//
// Override via env: GEMINI_IMAGE_MODEL, GEMINI_API_BASE.

const DEFAULT_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-3-pro-image-preview";

export class GeminiQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiQuotaError";
  }
}

export class GeminiSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiSafetyError";
  }
}

interface GeminiPart {
  text?: string;
  inlineData?: { data: string; mimeType: string };
  inline_data?: { data: string; mimeType: string };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { code?: number; message?: string; status?: string };
}

export async function callGemini(prompt: string): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_STUDIO_API_KEY not set");
  }

  const base = (process.env.GEMINI_API_BASE || DEFAULT_BASE).replace(/\/+$/, "");
  const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;
  const url = `${base}/models/${encodeURIComponent(model)}:generateContent`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE"],
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (resp.status === 429) {
    throw new GeminiQuotaError("Gemini daily/RPM quota exhausted");
  }

  const text = await resp.text();
  let data: GeminiResponse;
  try {
    data = JSON.parse(text) as GeminiResponse;
  } catch {
    throw new Error(`Gemini ${resp.status}: ${text.slice(0, 300)}`);
  }

  if (!resp.ok || data.error) {
    const msg = data.error?.message || `HTTP ${resp.status}`;
    if (data.error?.status === "RESOURCE_EXHAUSTED") {
      throw new GeminiQuotaError(msg);
    }
    throw new Error(`Gemini ${resp.status}: ${msg.slice(0, 300)}`);
  }

  if (data.promptFeedback?.blockReason) {
    throw new GeminiSafetyError(
      `Prompt blocked: ${data.promptFeedback.blockReason}`
    );
  }

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const inline = parts.find(
    (p) => p.inlineData?.data || p.inline_data?.data
  );
  const inlineData = inline?.inlineData ?? inline?.inline_data;
  if (!inlineData?.data) {
    const finish = data.candidates?.[0]?.finishReason;
    if (finish === "SAFETY") {
      throw new GeminiSafetyError("Response blocked by safety filter");
    }
    throw new Error("Gemini returned no image data");
  }

  return Buffer.from(inlineData.data, "base64");
}

export const NANO_BANANA_MODEL_ID = "nano-banana-2";

export function isNanoBananaModel(modelId: string): boolean {
  return modelId === NANO_BANANA_MODEL_ID;
}
