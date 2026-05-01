import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentOrder, user, creditTransaction } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAdminSession } from "@/lib/admin";
import { randomUUID } from "crypto";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { orderId?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const orderId = body.orderId;
  const action = body.action;
  if (!orderId || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (action === "reject") {
    const updated = await db
      .update(paymentOrder)
      .set({ status: "rejected" })
      .where(
        sql`${paymentOrder.id} = ${orderId} AND ${paymentOrder.status} = 'pending_review'`
      )
      .returning({ id: paymentOrder.id });
    if (updated.length === 0) {
      return NextResponse.json({ error: "not_pending" }, { status: 409 });
    }
    return NextResponse.json({ ok: true, action });
  }

  // approve: race-safe flip + grant
  const updated = await db
    .update(paymentOrder)
    .set({ status: "paid", paidAt: new Date() })
    .where(
      sql`${paymentOrder.id} = ${orderId} AND ${paymentOrder.status} = 'pending_review'`
    )
    .returning({
      userId: paymentOrder.userId,
      creditAmount: paymentOrder.creditAmount,
      packId: paymentOrder.packId,
    });

  if (updated.length === 0) {
    return NextResponse.json({ error: "not_pending" }, { status: 409 });
  }

  const { userId, creditAmount, packId } = updated[0];

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
      orderId,
      packId,
      provider: "manual",
      approvedBy: session.user.email,
    }),
  });

  console.log(
    `[admin/grant] approved ${orderId}: +${creditAmount} to ${userId} by ${session.user.email}. balance: ${newBalance}`
  );

  return NextResponse.json({ ok: true, action, newBalance });
}
