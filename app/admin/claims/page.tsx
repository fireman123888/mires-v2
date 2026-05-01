import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { paymentOrder, user as userTable } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { requireAdminSession } from "@/lib/admin";
import { ClaimActions } from "./ClaimActions";

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage() {
  const session = await requireAdminSession();
  if (!session) redirect("/signin");

  // Show pending_review (need action) AND recent paid orders (so admin
  // can see auto-matched activity over the last 50 orders).
  const claims = await db
    .select({
      id: paymentOrder.id,
      userId: paymentOrder.userId,
      packId: paymentOrder.packId,
      creditAmount: paymentOrder.creditAmount,
      priceCents: paymentOrder.priceCents,
      status: paymentOrder.status,
      rawNotify: paymentOrder.rawNotify,
      createdAt: paymentOrder.createdAt,
      paidAt: paymentOrder.paidAt,
      userEmail: userTable.email,
      userName: userTable.name,
    })
    .from(paymentOrder)
    .leftJoin(userTable, eq(paymentOrder.userId, userTable.id))
    .where(inArray(paymentOrder.status, ["pending_review", "paid"]))
    .orderBy(desc(paymentOrder.createdAt))
    .limit(50);

  const pendingCount = claims.filter((c) => c.status === "pending_review").length;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-2xl font-bold">订单审核</h1>
          <span className="text-sm text-muted-foreground">
            {pendingCount} 待处理 · {claims.length} 总计
          </span>
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>暂无订单。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map((c) => {
              const meta = parseRaw(c.rawNotify);
              const isPending = c.status === "pending_review";
              const isAutoMatched = !!meta.autoMatchedSource;
              return (
                <div
                  key={c.id}
                  className={
                    "rounded-xl border p-4 sm:p-5 " +
                    (isPending
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-border bg-card opacity-80")
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 text-sm flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {c.id}
                        </span>
                        {!isPending && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-semibold">
                            已发放
                          </span>
                        )}
                        {isAutoMatched && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 font-semibold">
                            自动匹配 · {meta.autoMatchedSource}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold">
                        ¥{(c.priceCents / 100).toFixed(0)} → {c.creditAmount} 积分（{c.packId}）
                      </div>
                      <div className="text-muted-foreground">
                        {c.userName ?? "—"} · {c.userEmail ?? c.userId}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        支付方式：{meta.paymentMethod === "wechat" ? "微信" : "支付宝"}
                        　·　提交：{c.createdAt instanceof Date ? c.createdAt.toLocaleString("zh-CN") : String(c.createdAt)}
                        {meta.payerName && (
                          <>　·　付款人：{meta.payerName}</>
                        )}
                      </div>
                      {meta.note && (
                        <div className="mt-2 rounded-md bg-muted/40 px-3 py-2 text-xs whitespace-pre-wrap break-words">
                          <span className="text-muted-foreground">备注：</span> {meta.note}
                        </div>
                      )}
                      {meta.screenshotUrl && (
                        <a
                          href={meta.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={meta.screenshotUrl}
                            alt="payment screenshot"
                            className="max-h-40 rounded-md border border-border hover:opacity-90"
                          />
                        </a>
                      )}
                    </div>
                    {isPending && <ClaimActions orderId={c.id} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface ClaimMeta {
  paymentMethod?: string;
  note?: string;
  screenshotUrl?: string;
  autoMatchedSource?: string;
  payerName?: string;
}

function parseRaw(raw: string | null): ClaimMeta {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
