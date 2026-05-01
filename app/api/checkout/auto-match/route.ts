import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentOrder } from "@/lib/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "crypto";
import { approveAndGrant } from "@/lib/grant-claim";

export const maxDuration = 30;

/**
 * Auto-match webhook. External agent (IFTTT, Mailgun route, custom script)
 * POSTs JSON describing a received payment; we try to match it to a
 * pending_review order and auto-approve.
 *
 * Body shape:
 *   { amount: number, source: "alipay"|"wechat", payerName?: string,
 *     externalId?: string, receivedAt?: string }
 *
 * Auth: HMAC-SHA256 of the raw body using AUTO_MATCH_SECRET env var,
 * passed as X-Signature header (lowercase hex).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.AUTO_MATCH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") || "";
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  let sigOk = false;
  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    sigOk = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    sigOk = false;
  }
  if (!sigOk) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
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

  const amountCents = Math.round((payload.amount ?? 0) * 100);
  const source = payload.source === "wechat" ? "wechat" : "alipay";
  if (amountCents <= 0) {
    return NextResponse.json({ error: "bad_amount" }, { status: 400 });
  }

  // Find pending_review orders matching amount, in last 24h.
  // Get up to 2 to detect ambiguity.
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const candidates = await db
    .select({
      id: paymentOrder.id,
      userId: paymentOrder.userId,
      createdAt: paymentOrder.createdAt,
    })
    .from(paymentOrder)
    .where(
      and(
        eq(paymentOrder.status, "pending_review"),
        eq(paymentOrder.priceCents, amountCents),
        gte(paymentOrder.createdAt, cutoff)
      )
    )
    .orderBy(desc(paymentOrder.createdAt))
    .limit(2);

  if (candidates.length === 0) {
    console.log(
      `[auto-match] no pending order for ¥${payload.amount} from ${source}, payer=${payload.payerName ?? "?"}`
    );
    return NextResponse.json({
      matched: 0,
      action: "no_pending_order",
    });
  }

  if (candidates.length > 1) {
    console.log(
      `[auto-match] ambiguous: ${candidates.length} pending orders match ¥${payload.amount}`
    );
    return NextResponse.json({
      matched: candidates.length,
      action: "ambiguous_left_for_human",
      candidateIds: candidates.map((c) => c.id),
    });
  }

  // Single match — auto-approve via shared helper.
  const order = candidates[0];
  const result = await approveAndGrant(order.id, {
    approvedBy: `auto:${source}`,
    extraNotify: {
      autoMatchedAt: new Date().toISOString(),
      autoMatchedSource: source,
      payerName: payload.payerName,
      externalId: payload.externalId,
      receivedAt: payload.receivedAt,
    },
  });

  if (!result.ok) {
    return NextResponse.json({
      matched: 1,
      action: result.reason ?? "grant_failed",
      orderId: order.id,
    });
  }

  console.log(
    `[auto-match] approved ${order.id}: +${result.creditsGranted} to ${result.userId} (source=${source})`
  );

  return NextResponse.json({
    matched: 1,
    action: "approved",
    orderId: order.id,
    creditsGranted: result.creditsGranted,
    newBalance: result.newBalance,
  });
}
