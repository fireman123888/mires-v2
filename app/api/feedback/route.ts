import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { Resend } from "resend";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { getClientIp } from "@/lib/credits";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const maxDuration = 30;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Light rate limit so feedback doesn't become a spam vector. Reuses the
// same Upstash Redis the rest of the app talks to. If KV vars aren't set,
// gracefully no-ops (open-source / preview deploys without rate limiting).
const limiter =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(3, "10 m"), // 3 submissions per 10 min per key
        prefix: "ratelimit:feedback",
      })
    : null;

const ALLOWED_TYPES = new Set(["bug", "feature", "general", "praise"]);

export async function POST(req: NextRequest) {
  let body: {
    type?: string;
    rating?: number;
    message?: string;
    email?: string;
    pageUrl?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  // Validate
  const type = typeof body.type === "string" && ALLOWED_TYPES.has(body.type) ? body.type : "general";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length < 5) {
    return NextResponse.json({ error: "message_too_short" }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "message_too_long" }, { status: 400 });
  }
  const rating =
    typeof body.rating === "number" && body.rating >= 1 && body.rating <= 5
      ? Math.round(body.rating)
      : null;
  const pageUrl =
    typeof body.pageUrl === "string" && body.pageUrl.length <= 500 ? body.pageUrl : null;

  const session = await auth.api.getSession({ headers: await nextHeaders() });
  const ip = getClientIp(req);

  if (limiter) {
    const key = session?.user?.id ?? `ip:${ip}`;
    const r = await limiter.limit(key);
    if (!r.success) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
  }

  // Email: prefer session, fall back to body field, validate format if provided
  const rawEmail = (body.email ?? "").trim();
  const emailFromBody =
    rawEmail.length > 0 && rawEmail.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)
      ? rawEmail
      : null;
  const email = session?.user?.email ?? emailFromBody;

  const userAgent = req.headers.get("user-agent")?.slice(0, 300) ?? null;
  const id = randomUUID();

  await db.insert(feedback).values({
    id,
    userId: session?.user?.id ?? null,
    email,
    type,
    rating,
    message,
    pageUrl,
    userAgent,
    status: "new",
  });

  notifyAdmins({ id, type, rating, message, email, pageUrl, userId: session?.user?.id ?? null }).catch(
    (e) => console.error("[feedback] admin notify failed:", e)
  );

  return NextResponse.json({ ok: true, id });
}

interface NotifyArgs {
  id: string;
  type: string;
  rating: number | null;
  message: string;
  email: string | null;
  pageUrl: string | null;
  userId: string | null;
}

async function notifyAdmins(args: NotifyArgs) {
  if (!resend) return;
  const adminList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (adminList.length === 0) return;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mires.top";
  const typeLabel = ({
    bug: "🐛 Bug",
    feature: "✨ Feature request",
    general: "💬 General",
    praise: "❤️ Praise",
  } as Record<string, string>)[args.type] || args.type;

  const ratingLine = args.rating ? `${"★".repeat(args.rating)}${"☆".repeat(5 - args.rating)} (${args.rating}/5)` : "—";

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Mires <onboarding@resend.dev>",
    to: adminList,
    subject: `[Mires] ${typeLabel} 反馈 ${args.rating ? `· ${args.rating}★` : ""}`,
    html: `
      <h2>${typeLabel}</h2>
      <ul>
        <li><b>评分：</b> ${ratingLine}</li>
        <li><b>用户邮箱：</b> ${args.email || "（匿名）"}</li>
        <li><b>用户 ID：</b> ${args.userId || "（未登录）"}</li>
        <li><b>页面：</b> ${args.pageUrl ? `<a href="${args.pageUrl}">${args.pageUrl}</a>` : "—"}</li>
      </ul>
      <h3>内容</h3>
      <p style="white-space: pre-wrap; background: #f5f5f5; padding: 12px; border-radius: 6px;">${escapeHtml(args.message)}</p>
      <p><a href="${baseUrl}/admin/feedback">→ 去后台查看</a></p>
    `.trim(),
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
