import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import { db } from "@/lib/db";
import { paymentOrder } from "@/lib/db/schema";
import { getPack } from "@/lib/credit-packs";
import { Resend } from "resend";
import { randomUUID } from "crypto";

export const maxDuration = 30;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await nextHeaders() });
  if (!session?.user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  let body: { packId?: string; paymentMethod?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const pack = getPack(body.packId ?? "");
  if (!pack) {
    return NextResponse.json({ error: "invalid_pack" }, { status: 400 });
  }

  const paymentMethod = body.paymentMethod === "wechat" ? "wechat" : "alipay";
  const note = (body.note ?? "").slice(0, 500);

  const orderId = `mires_${Date.now()}_${randomUUID().slice(0, 8)}`.slice(0, 32);
  await db.insert(paymentOrder).values({
    id: orderId,
    userId: session.user.id,
    packId: pack.id,
    creditAmount: pack.credits,
    priceCents: pack.priceCents,
    currency: "CNY",
    status: "pending_review",
    provider: "manual",
    rawNotify: JSON.stringify({
      paymentMethod,
      note,
      claimedAt: new Date().toISOString(),
      userEmail: session.user.email,
    }),
  });

  // Fire off admin notification (best-effort, don't block response)
  notifyAdmins({
    orderId,
    packCredits: pack.credits,
    priceYuan: pack.priceCents / 100,
    paymentMethod,
    note,
    userEmail: session.user.email,
    userId: session.user.id,
  }).catch((e) => console.error("[manual-claim] notify failed:", e));

  return NextResponse.json({ orderId, ok: true });
}

interface NotifyArgs {
  orderId: string;
  packCredits: number;
  priceYuan: number;
  paymentMethod: string;
  note: string;
  userEmail: string;
  userId: string;
}

async function notifyAdmins(args: NotifyArgs) {
  if (!resend) return;
  const adminList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (adminList.length === 0) return;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mires.top";

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Mires <onboarding@resend.dev>",
    to: adminList,
    subject: `[Mires] 新订单待确认 ¥${args.priceYuan} (${args.packCredits} 积分)`,
    html: `
      <h2>新积分包订单待确认</h2>
      <ul>
        <li><b>订单号：</b> ${args.orderId}</li>
        <li><b>金额：</b> ¥${args.priceYuan}（${args.packCredits} 积分）</li>
        <li><b>支付方式：</b> ${args.paymentMethod === "wechat" ? "微信" : "支付宝"}</li>
        <li><b>用户邮箱：</b> ${args.userEmail}</li>
        <li><b>用户备注：</b> ${args.note || "（无）"}</li>
      </ul>
      <p><a href="${baseUrl}/admin/claims">→ 去审核</a></p>
    `.trim(),
  });
}
