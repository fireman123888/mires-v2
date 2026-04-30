// Single source of truth for credit pack pricing — used by both /pricing UI
// and /api/checkout/create.

export interface CreditPack {
  id: "small" | "medium" | "large";
  credits: number;
  priceCents: number; // CNY in cents (¥10.00 = 1000 cents)
  popular?: boolean;
}

export const CREDIT_PACKS: Record<CreditPack["id"], CreditPack> = {
  small:  { id: "small",  credits: 100,  priceCents: 1000  },
  medium: { id: "medium", credits: 500,  priceCents: 3000, popular: true },
  large:  { id: "large",  credits: 2000, priceCents: 10000 },
};

export function getPack(id: string): CreditPack | null {
  return CREDIT_PACKS[id as CreditPack["id"]] ?? null;
}

export function formatCny(priceCents: number): string {
  return `¥${(priceCents / 100).toFixed(0)}`;
}
