import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import { db } from "@/lib/db";
import { paymentOrder } from "@/lib/db/schema";
import { getPack } from "@/lib/credit-packs";
import { createXunHuPayment } from "@/lib/xunhupay";
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

  const appid = process.env.XUNHUPAY_APPID;
  const appsecret = process.env.XUNHUPAY_APPSECRET;
  if (!appid || !appsecret) {
    return NextResponse.json({ error: "payment_not_configured" }, { status: 503 });
  }

  // Create order in DB first; status=pending
  const tradeOrderId = `mires_${Date.now()}_${randomUUID().slice(0, 8)}`.slice(0, 32);
  await db.insert(paymentOrder).values({
    id: tradeOrderId,
    userId: session.user.id,
    packId: pack.id,
    creditAmount: pack.credits,
    priceCents: pack.priceCents,
    currency: "CNY",
    status: "pending",
    provider: "xunhupay",
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mires.top";

  const result = await createXunHuPayment({
    appid,
    appsecret,
    tradeOrderId,
    totalFeeCny: pack.priceCents / 100,
    title: `Mires ${pack.credits} 积分包`,
    notifyUrl: `${baseUrl}/api/checkout/notify`,
    returnUrl: `${baseUrl}/payment/success?order=${tradeOrderId}`,
    attach: `userId=${session.user.id};packId=${pack.id}`,
  });

  if (!result.ok) {
    console.error("[checkout/create] XunHuPay error:", result.errmsg, result.raw);
    return NextResponse.json(
      { error: "provider_error", detail: result.errmsg },
      { status: 502 }
    );
  }

  return NextResponse.json({
    orderId: tradeOrderId,
    checkoutUrl: result.url, // mobile-friendly
    qrCodeUrl: result.qrUrl, // PC QR code
  });
}
