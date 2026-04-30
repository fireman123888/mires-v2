import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { paymentOrder, user, creditTransaction } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyXunHuPay } from "@/lib/xunhupay";
import { randomUUID } from "crypto";

export const maxDuration = 30;

/**
 * XunHuPay async notify handler. Returns literal "success" on accept.
 *
 * Idempotent: if the same trade_order_id is paid twice we don't double-grant
 * credits — DB transaction with status check prevents that.
 */
export async function POST(req: NextRequest) {
  const appsecret = process.env.XUNHUPAY_APPSECRET;
  if (!appsecret) return new Response("not_configured", { status: 503 });

  // XunHuPay sends form-encoded body
  const text = await req.text();
  const params = Object.fromEntries(new URLSearchParams(text).entries());

  // 1. Verify signature
  if (!verifyXunHuPay(params, appsecret)) {
    console.error("[notify] invalid hash:", params);
    return new Response("invalid_signature", { status: 400 });
  }

  // 2. Only act on "OD" (paid) — ignore other statuses
  if (params.status !== "OD") {
    console.log(`[notify] non-paid status=${params.status} order=${params.trade_order_id}`);
    return new Response("success");
  }

  const tradeOrderId = params.trade_order_id;
  if (!tradeOrderId) {
    return new Response("missing_order_id", { status: 400 });
  }

  // 3. Look up the order
  const orderRows = await db
    .select()
    .from(paymentOrder)
    .where(eq(paymentOrder.id, tradeOrderId))
    .limit(1);
  const order = orderRows[0];
  if (!order) {
    console.error(`[notify] unknown order: ${tradeOrderId}`);
    // Reply success to stop retries (we won't be able to recover this anyway)
    return new Response("success");
  }

  // 4. Idempotency: only grant if currently pending
  if (order.status === "paid") {
    console.log(`[notify] already paid: ${tradeOrderId}`);
    return new Response("success");
  }

  // 5. Mark paid + grant credits + log transaction (atomic-ish)
  const updated = await db
    .update(paymentOrder)
    .set({
      status: "paid",
      paidAt: new Date(),
      providerTxnId: params.transaction_id ?? null,
      providerOrderId: params.open_order_id ?? null,
      rawNotify: JSON.stringify(params),
    })
    .where(
      // race-safe: only flip if still pending
      sql`${paymentOrder.id} = ${tradeOrderId} AND ${paymentOrder.status} = 'pending'`
    )
    .returning({ userId: paymentOrder.userId, creditAmount: paymentOrder.creditAmount });

  if (updated.length === 0) {
    // Already moved by a concurrent notify — just ack
    console.log(`[notify] race lost on ${tradeOrderId}, status was already changed`);
    return new Response("success");
  }

  const { userId, creditAmount } = updated[0];

  // 6. Add credits to user
  const balanceRows = await db
    .update(user)
    .set({
      credits: sql`${user.credits} + ${creditAmount}`,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning({ credits: user.credits });

  const newBalance = balanceRows[0]?.credits ?? -1;

  await db.insert(creditTransaction).values({
    id: randomUUID(),
    userId,
    delta: creditAmount,
    balanceAfter: newBalance,
    reason: "purchase",
    metadata: JSON.stringify({
      orderId: tradeOrderId,
      packId: order.packId,
      provider: "xunhupay",
      providerTxnId: params.transaction_id,
    }),
  });

  console.log(`[notify] granted ${creditAmount} credits to ${userId} (order ${tradeOrderId}). new balance: ${newBalance}`);

  return new Response("success");
}
