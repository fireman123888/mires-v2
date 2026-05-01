import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentOrder } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { requireAdminSession } from "@/lib/admin";
import { approveAndGrant } from "@/lib/grant-claim";

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

  const result = await approveAndGrant(orderId, {
    approvedBy: session.user.email ?? "admin",
  });

  if (!result.ok) {
    const status = result.reason === "not_pending" ? 409 : 500;
    return NextResponse.json({ error: result.reason ?? "grant_failed" }, { status });
  }

  console.log(
    `[admin/grant] approved ${orderId}: +${result.creditsGranted} to ${result.userId} by ${session.user.email}. balance: ${result.newBalance}`
  );

  return NextResponse.json({
    ok: true,
    action,
    newBalance: result.newBalance,
  });
}
