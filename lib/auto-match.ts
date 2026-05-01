import { db } from "@/lib/db";
import { paymentOrder } from "@/lib/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { approveAndGrant } from "@/lib/grant-claim";

export interface AutoMatchInput {
  amount: number; // yuan
  source: "alipay" | "wechat";
  payerName?: string;
  externalId?: string;
  receivedAt?: string;
}

export interface AutoMatchResult {
  matched: number;
  action:
    | "bad_amount"
    | "no_pending_order"
    | "ambiguous_left_for_human"
    | "approved"
    | "grant_failed"
    | "race_lost"
    | "user_not_found";
  orderId?: string;
  candidateIds?: string[];
  creditsGranted?: number;
  newBalance?: number;
}

/**
 * Find a pending_review payment_order matching `amount` (yuan, exact)
 * in the last 24h. If exactly one matches, auto-approve and grant
 * credits via approveAndGrant(). Otherwise return without side effects.
 */
export async function tryAutoMatch(
  input: AutoMatchInput
): Promise<AutoMatchResult> {
  const amountCents = Math.round(input.amount * 100);
  if (amountCents <= 0) {
    return { matched: 0, action: "bad_amount" };
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const candidates = await db
    .select({ id: paymentOrder.id })
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
      `[auto-match] no pending order for ¥${input.amount} from ${input.source}, payer=${input.payerName ?? "?"}`
    );
    return { matched: 0, action: "no_pending_order" };
  }

  if (candidates.length > 1) {
    console.log(
      `[auto-match] ambiguous: ${candidates.length} pending orders match ¥${input.amount}`
    );
    return {
      matched: candidates.length,
      action: "ambiguous_left_for_human",
      candidateIds: candidates.map((c) => c.id),
    };
  }

  const order = candidates[0];
  const result = await approveAndGrant(order.id, {
    approvedBy: `auto:${input.source}`,
    extraNotify: {
      autoMatchedAt: new Date().toISOString(),
      autoMatchedSource: input.source,
      payerName: input.payerName,
      externalId: input.externalId,
      receivedAt: input.receivedAt,
    },
  });

  if (!result.ok) {
    return {
      matched: 1,
      action: (result.reason as AutoMatchResult["action"]) ?? "grant_failed",
      orderId: order.id,
    };
  }

  console.log(
    `[auto-match] approved ${order.id}: +${result.creditsGranted} to ${result.userId} (source=${input.source})`
  );

  return {
    matched: 1,
    action: "approved",
    orderId: order.id,
    creditsGranted: result.creditsGranted,
    newBalance: result.newBalance,
  };
}
