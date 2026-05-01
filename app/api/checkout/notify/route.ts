import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { paymentOrder, user, creditTransaction } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyYipay } from "@/lib/yipay";
import { randomUUID } from "crypto";

export const maxDuration = 30;

/**
 * 易支付 async notify handler. Reply literal "success" or platform retries.
 *
 * Notify is GET (per spec). Idempotent via SQL `WHERE status='pending'`
 * predicate so concurrent retries don't double-grant credits.
 */
export async function GET(req: NextRequest) {
  const publicKey = process.env.YIPAY_PUBLIC_KEY;
  if (!publicKey) return new Response("not_configured", { status: 503 });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  if (!verifyYipay(params, publicKey)) {
    console.error("[notify] invalid sign:", { ...params, sign: "***" });
    return new Response("invalid_signature", { status: 400 });
  }

  if (params.trade_status !== "TRADE_SUCCESS") {
    console.log(
      `[notify] non-success trade_status=${params.trade_status} order=${params.out_trade_no}`
    );
    return new Response("success");
  }

  const outTradeNo = params.out_trade_no;
  if (!outTradeNo) return new Response("missing_order_id", { status: 400 });

  const orderRows = await db
    .select()
    .from(paymentOrder)
    .where(eq(paymentOrder.id, outTradeNo))
    .limit(1);
  const order = orderRows[0];
  if (!order) {
    console.error(`[notify] unknown order: ${outTradeNo}`);
    return new Response("success"); // ack to stop retries we can't recover
  }
  if (order.status === "paid") {
    console.log(`[notify] already paid: ${outTradeNo}`);
    return new Response("success");
  }

  const updated = await db
    .update(paymentOrder)
    .set({
      status: "paid",
      paidAt: new Date(),
      providerTxnId: params.api_trade_no ?? null, // upstream wechat/alipay txn id
      providerOrderId: params.trade_no ?? null, // platform internal order id
      rawNotify: JSON.stringify(params),
    })
    .where(
      sql`${paymentOrder.id} = ${outTradeNo} AND ${paymentOrder.status} = 'pending'`
    )
    .returning({
      userId: paymentOrder.userId,
      creditAmount: paymentOrder.creditAmount,
    });

  if (updated.length === 0) {
    console.log(`[notify] race lost on ${outTradeNo}`);
    return new Response("success");
  }

  const { userId, creditAmount } = updated[0];

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
      orderId: outTradeNo,
      packId: order.packId,
      provider: "yipay",
      apiTradeNo: params.api_trade_no,
      tradeNo: params.trade_no,
    }),
  });

  console.log(
    `[notify] +${creditAmount} credits to ${userId} (order ${outTradeNo}). new balance: ${newBalance}`
  );

  return new Response("success");
}
