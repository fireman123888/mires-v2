import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { tryAutoMatch } from "@/lib/auto-match";

export const maxDuration = 30;

/**
 * Auto-match webhook (JSON payload). External agent (IFTTT, Zapier,
 * custom script) POSTs JSON describing a received payment; we try to
 * match it to a pending_review order and auto-approve.
 *
 * Body shape:
 *   { amount: number, source: "alipay"|"wechat", payerName?: string,
 *     externalId?: string, receivedAt?: string }
 *
 * Auth (either works):
 *   - Easy: `Authorization: Bearer <AUTO_MATCH_SECRET>` (IFTTT/Zapier-friendly)
 *   - Strict: `X-Signature: <HMAC-SHA256(body, secret) lowercase hex>`
 *
 * For Mailgun-format input (multipart form with body-plain etc.)
 * see /api/checkout/auto-match/mailgun.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.AUTO_MATCH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const signature = req.headers.get("x-signature") || "";

  let authOk = false;
  if (bearer && bearer.length === secret.length) {
    try {
      authOk = timingSafeEqual(Buffer.from(bearer), Buffer.from(secret));
    } catch {
      authOk = false;
    }
  }
  if (!authOk && signature) {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    try {
      const a = Buffer.from(signature, "hex");
      const b = Buffer.from(expected, "hex");
      authOk = a.length === b.length && timingSafeEqual(a, b);
    } catch {
      authOk = false;
    }
  }
  if (!authOk) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: {
    amount?: number;
    source?: string;
    payerName?: string;
    externalId?: string;
    receivedAt?: string;
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const result = await tryAutoMatch({
    amount: payload.amount ?? 0,
    source: payload.source === "wechat" ? "wechat" : "alipay",
    payerName: payload.payerName,
    externalId: payload.externalId,
    receivedAt: payload.receivedAt,
  });

  return NextResponse.json(result);
}
