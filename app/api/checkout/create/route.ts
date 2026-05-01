import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import { db } from "@/lib/db";
import { paymentOrder } from "@/lib/db/schema";
import { getPack } from "@/lib/credit-packs";
import { buildYipaySubmitUrl } from "@/lib/yipay";
import { randomUUID } from "crypto";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await nextHeaders() });
  if (!session?.user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  let body: { packId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const pack = getPack(body.packId ?? "");
  if (!pack) {
    return NextResponse.json({ error: "invalid_pack" }, { status: 400 });
  }

  const gateway = process.env.YIPAY_GATEWAY;
  const pid = process.env.YIPAY_PID;
  const privateKey = process.env.YIPAY_PRIVATE_KEY;
  if (!gateway || !pid || !privateKey) {
    return NextResponse.json({ error: "payment_not_configured" }, { status: 503 });
  }

  const tradeOrderId = `mires_${Date.now()}_${randomUUID().slice(0, 8)}`.slice(0, 32);
  await db.insert(paymentOrder).values({
    id: tradeOrderId,
    userId: session.user.id,
    packId: pack.id,
    creditAmount: pack.credits,
    priceCents: pack.priceCents,
    currency: "CNY",
    status: "pending",
    provider: "yipay",
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mires.top";

  const checkoutUrl = buildYipaySubmitUrl({
    gateway,
    pid,
    privateKeyPem: privateKey,
    outTradeNo: tradeOrderId,
    notifyUrl: `${baseUrl}/api/checkout/notify`,
    returnUrl: `${baseUrl}/payment/success?order=${tradeOrderId}`,
    name: `Mires ${pack.credits} 积分包`,
    money: pack.priceCents / 100,
    param: `userId=${session.user.id};packId=${pack.id}`,
  });

  return NextResponse.json({
    orderId: tradeOrderId,
    checkoutUrl,
  });
}
