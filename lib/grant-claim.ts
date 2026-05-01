import { db } from "@/lib/db";
import { paymentOrder, user, creditTransaction } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { isProActive } from "@/lib/plans";

export interface GrantResult {
  ok: boolean;
  reason?: "not_pending" | "race_lost" | "user_not_found";
  orderId?: string;
  userId?: string;
  newBalance?: number;
  creditsGranted?: number;
  planTier?: string;
  planDays?: number;
  newPlanExpiresAt?: Date;
}

/**
 * Race-safe approve. Used by both /api/admin/grant (manual) and
 * /api/checkout/auto-match (webhook).
 *
 * Two grant kinds (decided by rawNotify.planKind):
 *  - "credit-pack" → add creditAmount to user.credits
 *  - "subscription" → set user.proPlanType + extend proPlanExpiresAt
 *                     by planDays (stacks: if already active, adds to existing expiry)
 *
 * `extraNotify` is merged into the order's rawNotify so the audit trail
 * shows whoever approved it.
 */
export async function approveAndGrant(
  orderId: string,
  meta: {
    approvedBy: string;
    extraNotify?: Record<string, unknown>;
  }
): Promise<GrantResult> {
  const existing = await db
    .select({
      rawNotify: paymentOrder.rawNotify,
      creditAmount: paymentOrder.creditAmount,
      packId: paymentOrder.packId,
    })
    .from(paymentOrder)
    .where(eq(paymentOrder.id, orderId))
    .limit(1);

  if (existing.length === 0) {
    return { ok: false, reason: "not_pending", orderId };
  }

  const prev = safeParse(existing[0].rawNotify);
  const planKind = (prev.planKind as string) ?? "credit-pack"; // legacy default
  const planTier = (prev.planTier as string) ?? "free";
  const planDays = typeof prev.planDays === "number" ? prev.planDays : 0;

  const mergedRaw = JSON.stringify({
    ...prev,
    ...meta.extraNotify,
    approvedBy: meta.approvedBy,
    approvedAt: new Date().toISOString(),
  });

  // Race-safe flip
  const updated = await db
    .update(paymentOrder)
    .set({
      status: "paid",
      paidAt: new Date(),
      rawNotify: mergedRaw,
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

  if (planKind === "subscription" && (planTier === "pro" || planTier === "ultimate") && planDays > 0) {
    // Subscription grant: set tier + extend expiry
    const userRows = await db
      .select({
        proPlanType: user.proPlanType,
        proPlanExpiresAt: user.proPlanExpiresAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (userRows.length === 0) {
      return { ok: false, reason: "user_not_found", orderId, userId };
    }

    // If user has an active plan, extend from current expiry; else from now.
    // Tier upgrade (pro → ultimate) replaces tier but stacks days.
    const existingActive = isProActive(userRows[0].proPlanExpiresAt);
    const baseTime = existingActive
      ? new Date(userRows[0].proPlanExpiresAt!).getTime()
      : Date.now();
    const newExpiresAt = new Date(baseTime + planDays * 24 * 60 * 60 * 1000);

    // Upgrade rule: if buying ultimate, always set ultimate; if buying pro
    // while already ultimate, keep ultimate (don't downgrade).
    const newTier =
      userRows[0].proPlanType === "ultimate" && planTier === "pro"
        ? "ultimate"
        : planTier;

    await db
      .update(user)
      .set({
        proPlanType: newTier,
        proPlanExpiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    return {
      ok: true,
      orderId,
      userId,
      planTier: newTier,
      planDays,
      newPlanExpiresAt: newExpiresAt,
    };
  }

  // Credit-pack grant (legacy + current "pack-*" plans)
  if (creditAmount <= 0) {
    return { ok: true, orderId, userId, creditsGranted: 0 };
  }

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
