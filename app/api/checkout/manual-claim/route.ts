import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import { db } from "@/lib/db";
import { paymentOrder } from "@/lib/db/schema";
import { getPlan, formatCny } from "@/lib/plans";
import { Resend } from "resend";
import { randomUUID } from "crypto";

export const maxDuration = 30;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await nextHeaders() });
  if (!session?.user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  let body: {
    planId?: string;
    paymentMethod?: string;
    note?: string;
    screenshotUrl?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const plan = getPlan(body.planId ?? "");
  if (!plan) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  const paymentMethod = body.paymentMethod === "wechat" ? "wechat" : "alipay";
  const note = (body.note ?? "").slice(0, 500);
  const screenshotUrl =
    typeof body.screenshotUrl === "string" &&
    /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(body.screenshotUrl)
      ? body.screenshotUrl
      : null;

  const orderId = `mires_${Date.now()}_${randomUUID().slice(0, 8)}`.slice(0, 32);
  await db.insert(paymentOrder).values({
    id: orderId,
    userId: session.user.id,
    packId: plan.id, // reused column — actually holds planId now
    creditAmount: plan.credits ?? 0, // 0 for subscriptions; admin grant will set plan expiry
    priceCents: plan.priceCents,
    currency: "CNY",
    status: "pending_review",
    provider: "manual",
    rawNotify: JSON.stringify({
      paymentMethod,
      note,
      screenshotUrl,
      claimedAt: new Date().toISOString(),
      userEmail: session.user.email,
      planId: plan.id,
      planTier: plan.tier,
      planKind: plan.kind,
      planDays: plan.days,
    }),
  });

  notifyAdmins({
    orderId,
    plan,
    paymentMethod,
    note,
    screenshotUrl,
    userEmail: session.user.email,
    userId: session.user.id,
  }).catch((e) => console.error("[manual-claim] notify failed:", e));

  return NextResponse.json({ orderId, ok: true });
}

interface NotifyArgs {
  orderId: string;
  plan: ReturnType<typeof getPlan>;
  paymentMethod: string;
  note: string;
  screenshotUrl: string | null;
  userEmail: string;
  userId: string;
}

async function notifyAdmins(args: NotifyArgs) {
  if (!resend) return;
  if (!args.plan) return;
  const adminList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (adminList.length === 0) return;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mires.top";
  const planLabel =
    args.plan.kind === "subscription"
      ? `${args.plan.tier === "pro" ? "Pro" : "Ultimate"} ${args.plan.cadence === "monthly" ? "月卡" : "年卡"}（${args.plan.days} 天）`
      : `${args.plan.credits} 积分包`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Mires <onboarding@resend.dev>",
    to: adminList,
    subject: `[Mires] 新订单待确认 ${formatCny(args.plan.priceCents)} (${planLabel})`,
    html: `
      <h2>新订单待确认</h2>
      <ul>
        <li><b>订单号：</b> ${args.orderId}</li>
        <li><b>套餐：</b> ${planLabel}</li>
        <li><b>金额：</b> ${formatCny(args.plan.priceCents)}</li>
        <li><b>支付方式：</b> ${args.paymentMethod === "wechat" ? "微信" : "支付宝"}</li>
        <li><b>用户邮箱：</b> ${args.userEmail}</li>
        <li><b>用户备注：</b> ${args.note || "（无）"}</li>
        ${args.screenshotUrl ? `<li><b>付款截图：</b> <a href="${args.screenshotUrl}">查看</a></li>` : ""}
      </ul>
      <p><a href="${baseUrl}/admin/claims">→ 去审核</a></p>
    `.trim(),
  });
}
