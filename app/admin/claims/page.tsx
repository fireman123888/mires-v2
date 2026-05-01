import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { paymentOrder, user as userTable } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdminSession } from "@/lib/admin";
import { ClaimActions } from "./ClaimActions";

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage() {
  const session = await requireAdminSession();
  if (!session) redirect("/signin");

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
      userEmail: userTable.email,
      userName: userTable.name,
    })
    .from(paymentOrder)
    .leftJoin(userTable, eq(paymentOrder.userId, userTable.id))
    .where(eq(paymentOrder.status, "pending_review"))
    .orderBy(desc(paymentOrder.createdAt));

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-2xl font-bold">待审核订单</h1>
          <span className="text-sm text-muted-foreground">{claims.length} 条</span>
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>没有待审核的订单。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map((c) => {
              const meta = parseRaw(c.rawNotify);
              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-border bg-card p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 text-sm">
                      <div className="font-mono text-xs text-muted-foreground">
                        {c.id}
                      </div>
                      <div className="font-semibold">
                        ¥{(c.priceCents / 100).toFixed(0)} → {c.creditAmount} 积分（{c.packId}）
                      </div>
                      <div className="text-muted-foreground">
                        {c.userName ?? "—"} · {c.userEmail ?? c.userId}
                      </div>
                      <div className="text-muted-foreground">
                        支付方式：{meta.paymentMethod === "wechat" ? "微信" : "支付宝"}
                        　·　提交：{c.createdAt instanceof Date ? c.createdAt.toLocaleString("zh-CN") : String(c.createdAt)}
                      </div>
                      {meta.note && (
                        <div className="mt-2 rounded-md bg-muted/40 px-3 py-2 text-xs whitespace-pre-wrap break-words">
                          <span className="text-muted-foreground">备注：</span> {meta.note}
                        </div>
                      )}
                    </div>
                    <ClaimActions orderId={c.id} />
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

function parseRaw(raw: string | null): { paymentMethod?: string; note?: string } {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
