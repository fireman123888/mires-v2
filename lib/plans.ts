// Single source of truth for all paid offerings: subscription plans (Pro,
// Ultimate, monthly + yearly) and one-time credit packs (kept as a
// "quick top-up" alternative for users who don't want a plan).

export type PlanTier = "free" | "pro" | "ultimate";
export type PlanKind = "subscription" | "credit-pack";
export type PlanCadence = "monthly" | "yearly" | "one-time";

export interface Plan {
  id: string;
  tier: PlanTier; // governs benefits (watermark, etc.)
  kind: PlanKind;
  cadence: PlanCadence;
  priceCents: number; // CNY in cents (¥9.9 = 990 cents)
  days?: number; // subscription duration; undefined for credit packs
  credits?: number; // one-time credit grant; undefined for subscriptions
  popular?: boolean; // visual highlight
}

export const PLANS: Record<string, Plan> = {
  // --- Subscription plans (manual QR purchase = pay once, get N days of Pro) ---
  "pro-monthly": {
    id: "pro-monthly",
    tier: "pro",
    kind: "subscription",
    cadence: "monthly",
    priceCents: 990, // ¥9.9
    days: 30,
  },
  "pro-yearly": {
    id: "pro-yearly",
    tier: "pro",
    kind: "subscription",
    cadence: "yearly",
    priceCents: 5900, // ¥59 (≈ ¥4.9/mo, save 50%)
    days: 365,
    popular: true,
  },
  "ultimate-monthly": {
    id: "ultimate-monthly",
    tier: "ultimate",
    kind: "subscription",
    cadence: "monthly",
    priceCents: 1990, // ¥19.9
    days: 30,
  },
  "ultimate-yearly": {
    id: "ultimate-yearly",
    tier: "ultimate",
    kind: "subscription",
    cadence: "yearly",
    priceCents: 11900, // ¥119 (≈ ¥9.9/mo, save 50%)
    days: 365,
  },
  // --- Credit packs (legacy, kept as quick top-up for users not on a plan) ---
  "pack-small": {
    id: "pack-small",
    tier: "free",
    kind: "credit-pack",
    cadence: "one-time",
    priceCents: 1000, // ¥10
    credits: 100,
  },
  "pack-medium": {
    id: "pack-medium",
    tier: "free",
    kind: "credit-pack",
    cadence: "one-time",
    priceCents: 3000, // ¥30
    credits: 500,
  },
  "pack-large": {
    id: "pack-large",
    tier: "free",
    kind: "credit-pack",
    cadence: "one-time",
    priceCents: 10000, // ¥100
    credits: 2000,
  },
};

export function getPlan(id: string): Plan | null {
  return PLANS[id] ?? null;
}

export function isProActive(
  proPlanExpiresAt: Date | string | null | undefined
): boolean {
  if (!proPlanExpiresAt) return false;
  const t =
    proPlanExpiresAt instanceof Date
      ? proPlanExpiresAt.getTime()
      : new Date(proPlanExpiresAt).getTime();
  return Number.isFinite(t) && t > Date.now();
}

export function formatCny(priceCents: number): string {
  // ¥9.9 vs ¥10 — preserve the .9 if present
  if (priceCents % 100 === 0) return `¥${priceCents / 100}`;
  return `¥${(priceCents / 100).toFixed(1)}`;
}

/**
 * Backward-compat shim for code still importing from credit-packs.ts.
 * Returns Plan if id matches a credit pack, otherwise null.
 */
export function getPack(id: string): Plan | null {
  // Accept legacy ids ("small" / "medium" / "large") OR new "pack-*" ids.
  if (PLANS[id]) return PLANS[id];
  const legacyMap: Record<string, string> = {
    small: "pack-small",
    medium: "pack-medium",
    large: "pack-large",
  };
  return PLANS[legacyMap[id]] ?? null;
}
