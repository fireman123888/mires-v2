import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { tryAutoMatch, parseAlipayEmailBody } from "@/lib/auto-match";

export const maxDuration = 30;

/**
 * Mailgun Inbound Routes endpoint.
 *
 * Mailgun POSTs `multipart/form-data` with fields including:
 *   - body-plain, body-html, subject, from, sender, recipient
 *   - timestamp, token, signature  (for webhook verification)
 *
 * Auth (either works):
 *   - Easy: pass `?secret=<AUTO_MATCH_SECRET>` in the URL (Mailgun Routes
 *     don't let you set custom headers, so query param is the practical path)
 *   - Strict: set MAILGUN_SIGNING_KEY env var; we then verify Mailgun's
 *     own HMAC signature on (timestamp + token).
 *
 * Workflow:
 *   1. Verify auth (query secret OR Mailgun signature)
 *   2. Pull `body-plain` from form data
 *   3. Try to extract { amount, payerName } via parseAlipayEmailBody
 *   4. Call tryAutoMatch — same code path as the JSON endpoint
 */
export async function POST(req: NextRequest) {
  const secret = process.env.AUTO_MATCH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const form = await req.formData();
  const querySecret = req.nextUrl.searchParams.get("secret") || "";
  const mailgunTimestamp = String(form.get("timestamp") || "");
  const mailgunToken = String(form.get("token") || "");
  const mailgunSignature = String(form.get("signature") || "");

  // 1. Auth path A: query secret
  let authOk = false;
  if (querySecret && querySecret.length === secret.length) {
    try {
      authOk = timingSafeEqual(Buffer.from(querySecret), Buffer.from(secret));
    } catch {
      authOk = false;
    }
  }

  // 1. Auth path B: Mailgun signature
  if (!authOk && process.env.MAILGUN_SIGNING_KEY && mailgunSignature) {
    const ts = parseInt(mailgunTimestamp, 10);
    const fresh = Number.isFinite(ts) && Math.abs(Date.now() / 1000 - ts) < 300;
    if (fresh) {
      const expected = createHmac("sha256", process.env.MAILGUN_SIGNING_KEY)
        .update(mailgunTimestamp + mailgunToken)
        .digest("hex");
      try {
        const a = Buffer.from(mailgunSignature, "hex");
        const b = Buffer.from(expected, "hex");
        authOk = a.length === b.length && timingSafeEqual(a, b);
      } catch {
        authOk = false;
      }
    }
  }

  if (!authOk) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Pull email body
  const body = String(form.get("body-plain") || form.get("stripped-text") || "");
  const subject = String(form.get("subject") || "");
  const from = String(form.get("from") || form.get("sender") || "");

  // Sanity check: only act on emails from Alipay's domain (defense in depth).
  if (!/alipay\.com/i.test(from)) {
    console.log(`[auto-match/mailgun] non-alipay sender ignored: ${from}`);
    return NextResponse.json({ ignored: "non_alipay_sender" });
  }

  // 3. Parse
  const parsed = parseAlipayEmailBody(body, subject);
  if (!parsed) {
    console.log(
      `[auto-match/mailgun] could not parse amount from email; subject=${subject.slice(0, 80)}`
    );
    return NextResponse.json({ ignored: "parse_failed" });
  }

  // 4. Match
  const result = await tryAutoMatch({
    amount: parsed.amount,
    source: "alipay",
    payerName: parsed.payerName,
    externalId: mailgunToken || undefined, // dedup hint
    receivedAt: mailgunTimestamp
      ? new Date(parseInt(mailgunTimestamp, 10) * 1000).toISOString()
      : undefined,
  });

  return NextResponse.json(result);
}
