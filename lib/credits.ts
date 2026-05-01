import { db } from "@/lib/db";
import { user, creditTransaction, ipDailyUsage } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const COSTS = {
  generate: 4,
  upscale: 20,
  nanoBanana: 12,
};

export const ANONYMOUS_DAILY_LIMIT = 5;
// Global daily cap for the AI Studio free tier (50 RPD on gemini-3-pro-image-preview).
// Counted across the whole site, not per-IP. Cap leaves 5-call headroom for retries.
export const NANO_BANANA_DAILY_CAP = 45;
export const NANO_BANANA_GLOBAL_KEY = "__nano_banana_global__";
export const DAILY_REFRESH_AMOUNT = 20;
export const DAILY_REFRESH_CAP = 200; // don't refill if balance already >= cap

function utcToday(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Lazily applies the daily +20 refresh if the user hasn't received it yet today.
 * Idempotent — safe to call before every credit operation.
 * Capped: only adds credits if current balance < DAILY_REFRESH_CAP.
 */
export async function applyDailyRefresh(userId: string): Promise<{ refreshed: boolean; balance: number }> {
  const today = utcToday();
  // Single update conditional on lastDailyRefresh != today AND balance < cap.
  // Using a CASE so we add at most CAP - balance (don't overshoot the cap).
  const result = await db
    .update(user)
    .set({
      credits: sql`LEAST(${user.credits} + ${DAILY_REFRESH_AMOUNT}, ${DAILY_REFRESH_CAP})`,
      lastDailyRefresh: today,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(user.id, userId),
        sql`(${user.lastDailyRefresh} IS NULL OR ${user.lastDailyRefresh} <> ${today})`,
        sql`${user.credits} < ${DAILY_REFRESH_CAP}`
      )
    )
    .returning({ credits: user.credits });

  if (result.length > 0) {
    const newBalance = result[0].credits;
    await db.insert(creditTransaction).values({
      id: randomUUID(),
      userId,
      delta: DAILY_REFRESH_AMOUNT, // approximate — actual may be capped
      balanceAfter: newBalance,
      reason: "daily_refresh",
    });
    return { refreshed: true, balance: newBalance };
  }

  // No refresh needed (already done today or balance >= cap). Just stamp the date
  // so we don't re-check forever; only stamp if not already today.
  await db
    .update(user)
    .set({ lastDailyRefresh: today })
    .where(
      and(
        eq(user.id, userId),
        sql`(${user.lastDailyRefresh} IS NULL OR ${user.lastDailyRefresh} <> ${today})`
      )
    );

  const u = await db.select({ credits: user.credits }).from(user).where(eq(user.id, userId)).limit(1);
  return { refreshed: false, balance: u[0]?.credits ?? 0 };
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
  // Apply daily +20 refresh before checking balance.
  await applyDailyRefresh(userId).catch((e) => console.warn("daily refresh failed:", e));

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
 * Get current credit balance for a user. Also applies the daily refresh if due.
 */
export async function getCredits(userId: string): Promise<number | null> {
  await applyDailyRefresh(userId).catch((e) => console.warn("daily refresh failed:", e));
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
 * Atomically increment a global daily counter, capped at `cap`. Used for
 * shared quotas like Gemini AI Studio's 50 RPD per API key. Reuses the
 * ipDailyUsage table with a sentinel `key` in the `ip` column.
 */
export async function incrementGlobalDailyCounter(
  key: string,
  cap: number
): Promise<{ count: number; remaining: number } | { error: "limit" }> {
  const day = utcToday();
  const result = await db
    .insert(ipDailyUsage)
    .values({ ip: key, day, count: 1 })
    .onConflictDoUpdate({
      target: [ipDailyUsage.ip, ipDailyUsage.day],
      set: {
        count: sql`${ipDailyUsage.count} + 1`,
        updatedAt: new Date(),
      },
      setWhere: sql`${ipDailyUsage.count} < ${cap}`,
    })
    .returning({ count: ipDailyUsage.count });

  if (result.length === 0) return { error: "limit" };
  return { count: result[0].count, remaining: cap - result[0].count };
}

/**
 * Read current global counter value (for displaying remaining quota).
 */
export async function getGlobalDailyCounter(
  key: string,
  cap: number
): Promise<{ used: number; remaining: number }> {
  const day = utcToday();
  const row = await db
    .select({ count: ipDailyUsage.count })
    .from(ipDailyUsage)
    .where(and(eq(ipDailyUsage.ip, key), eq(ipDailyUsage.day, day)))
    .limit(1);
  const used = row[0]?.count ?? 0;
  return { used, remaining: Math.max(0, cap - used) };
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
