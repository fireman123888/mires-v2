import { db } from "@/lib/db";
import { user, creditTransaction, ipDailyUsage } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const COSTS = {
  generate: 10,
  upscale: 20,
};

export const ANONYMOUS_DAILY_LIMIT = 5;

function utcToday(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Atomically deduct credits from a user. Returns new balance, or null if insufficient.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<{ newBalance: number } | { error: "insufficient" } | { error: "user_not_found" }> {
  // Use a single SQL UPDATE with a CHECK condition to keep this race-safe.
  const result = await db
    .update(user)
    .set({ credits: sql`${user.credits} - ${amount}`, updatedAt: new Date() })
    .where(and(eq(user.id, userId), sql`${user.credits} >= ${amount}`))
    .returning({ credits: user.credits });

  if (result.length === 0) {
    // Either user doesn't exist or had insufficient balance. Distinguish.
    const u = await db.select({ credits: user.credits }).from(user).where(eq(user.id, userId)).limit(1);
    if (u.length === 0) return { error: "user_not_found" };
    return { error: "insufficient" };
  }

  const newBalance = result[0].credits;

  await db.insert(creditTransaction).values({
    id: randomUUID(),
    userId,
    delta: -amount,
    balanceAfter: newBalance,
    reason,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });

  return { newBalance };
}

/**
 * Refund credits to a user (e.g. after a generation fails).
 */
export async function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<{ newBalance: number } | { error: "user_not_found" }> {
  const result = await db
    .update(user)
    .set({ credits: sql`${user.credits} + ${amount}`, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning({ credits: user.credits });

  if (result.length === 0) return { error: "user_not_found" };

  const newBalance = result[0].credits;
  await db.insert(creditTransaction).values({
    id: randomUUID(),
    userId,
    delta: amount,
    balanceAfter: newBalance,
    reason,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
  return { newBalance };
}

/**
 * Get current credit balance for a user.
 */
export async function getCredits(userId: string): Promise<number | null> {
  const u = await db
    .select({ credits: user.credits })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return u[0]?.credits ?? null;
}

/**
 * Atomically increment IP usage for today. Returns the new count, or null if it
 * would exceed the daily limit (caller may then block).
 */
export async function incrementIpUsage(
  ip: string
): Promise<{ count: number; remaining: number } | { error: "limit" }> {
  const day = utcToday();
  // Upsert pattern with conditional increment.
  const result = await db
    .insert(ipDailyUsage)
    .values({ ip, day, count: 1 })
    .onConflictDoUpdate({
      target: [ipDailyUsage.ip, ipDailyUsage.day],
      set: {
        count: sql`${ipDailyUsage.count} + 1`,
        updatedAt: new Date(),
      },
      setWhere: sql`${ipDailyUsage.count} < ${ANONYMOUS_DAILY_LIMIT}`,
    })
    .returning({ count: ipDailyUsage.count });

  if (result.length === 0) {
    return { error: "limit" };
  }
  return { count: result[0].count, remaining: ANONYMOUS_DAILY_LIMIT - result[0].count };
}

/**
 * Get IP usage today (for displaying remaining quota to anonymous users).
 */
export async function getIpUsage(ip: string): Promise<{ used: number; remaining: number }> {
  const day = utcToday();
  const row = await db
    .select({ count: ipDailyUsage.count })
    .from(ipDailyUsage)
    .where(and(eq(ipDailyUsage.ip, ip), eq(ipDailyUsage.day, day)))
    .limit(1);
  const used = row[0]?.count ?? 0;
  return { used, remaining: Math.max(0, ANONYMOUS_DAILY_LIMIT - used) };
}

/**
 * Extract the client IP from request headers. Cloudflare/Vercel both forward.
 */
export function getClientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "0.0.0.0";
}
