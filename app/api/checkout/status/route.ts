import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import { db } from "@/lib/db";
import { paymentOrder } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await nextHeaders() });
  if (!session?.user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }
  const orderId = req.nextUrl.searchParams.get("order");
  if (!orderId) {
    return NextResponse.json({ error: "missing_order" }, { status: 400 });
  }
  const rows = await db
    .select({
      status: paymentOrder.status,
      creditAmount: paymentOrder.creditAmount,
      paidAt: paymentOrder.paidAt,
    })
    .from(paymentOrder)
    .where(and(eq(paymentOrder.id, orderId), eq(paymentOrder.userId, session.user.id)))
    .limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}
