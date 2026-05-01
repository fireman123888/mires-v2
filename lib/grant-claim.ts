import { db } from "@/lib/db";
import { paymentOrder, user, creditTransaction } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface GrantResult {
  ok: boolean;
  reason?: "not_pending" | "race_lost" | "user_not_found";
  orderId?: string;
  userId?: string;
  newBalance?: number;
  creditsGranted?: number;
}

/**
 * Race-safe approve + credit-grant. Used by both /api/admin/grant (manual)
 * and /api/checkout/auto-match (webhook).
 *
 * `extraNotify` gets merged into the order's existing rawNotify JSON so we
 * preserve the original claim data alongside whoever approved it.
 */
export async function approveAndGrant(
  orderId: string,
  meta: {
    approvedBy: string; // admin email or "auto:alipay" etc
    extraNotify?: Record<string, unknown>;
  }
): Promise<GrantResult> {
  // Read existing rawNotify so we can merge audit fields.
  const existing = await db
    .select({ rawNotify: paymentOrder.rawNotify })
    .from(paymentOrder)
    .where(eq(paymentOrder.id, orderId))
    .limit(1);

  let mergedRaw: string | null = null;
  if (existing.length > 0) {
    const prev = safeParse(existing[0].rawNotify);
    mergedRaw = JSON.stringify({
      ...prev,
      ...meta.extraNotify,
      approvedBy: meta.approvedBy,
      approvedAt: new Date().toISOString(),
    });
  }

  const updated = await db
    .update(paymentOrder)
    .set({
      status: "paid",
      paidAt: new Date(),
      ...(mergedRaw !== null ? { rawNotify: mergedRaw } : {}),
    })
    .where(
      sql`${paymentOrder.id} = ${orderId} AND ${paymentOrder.status} = 'pending_review'`
    )
    .returning({
      userId: paymentOrder.userId,
      creditAmount: paymentOrder.creditAmount,
      packId: paymentOrder.packId,
    });

  if (updated.length === 0) {
    return { ok: false, reason: "not_pending", orderId };
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

  if (balanceRows.length === 0) {
    return { ok: false, reason: "user_not_found", orderId, userId };
  }
  const newBalance = balanceRows[0].credits;

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
      approvedBy: meta.approvedBy,
    }),
  });

  return {
    ok: true,
    orderId,
    userId,
    newBalance,
    creditsGranted: creditAmount,
  };
}

function safeParse(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
