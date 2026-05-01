import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { feedback, user as userTable } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdminSession } from "@/lib/admin";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  bug: "🐛 Bug",
  feature: "✨ Feature",
  general: "💬 General",
  praise: "❤️ Praise",
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  new: { label: "新", cls: "bg-amber-500/15 text-amber-600" },
  in_progress: { label: "处理中", cls: "bg-blue-500/15 text-blue-600" },
  resolved: { label: "已解决", cls: "bg-emerald-500/15 text-emerald-600" },
  wontfix: { label: "暂不处理", cls: "bg-muted text-muted-foreground" },
};

export default async function AdminFeedbackPage() {
  const session = await requireAdminSession();
  if (!session) redirect("/signin");

  const rows = await db
    .select({
      id: feedback.id,
      userId: feedback.userId,
      email: feedback.email,
      type: feedback.type,
      rating: feedback.rating,
      message: feedback.message,
      pageUrl: feedback.pageUrl,
      userAgent: feedback.userAgent,
      status: feedback.status,
      adminNote: feedback.adminNote,
      createdAt: feedback.createdAt,
      userEmail: userTable.email,
      userName: userTable.name,
    })
    .from(feedback)
    .leftJoin(userTable, eq(feedback.userId, userTable.id))
    .orderBy(desc(feedback.createdAt))
    .limit(100);

  const newCount = rows.filter((r) => r.status === "new").length;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-2xl font-bold">用户反馈</h1>
          <span className="text-sm text-muted-foreground">
            {newCount} 待处理 · {rows.length} 总计（最近 100 条）
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>还没有反馈。</p>
            <p className="text-xs mt-2">右下角浮动按钮触发 → 写到 feedback 表。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const isNew = r.status === "new";
              const statusMeta = STATUS_LABEL[r.status] ?? STATUS_LABEL.new;
              return (
                <div
                  key={r.id}
                  className={
                    "rounded-xl border p-4 sm:p-5 " +
                    (isNew
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-border bg-card opacity-90")
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5 text-sm flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold">
                          {TYPE_LABEL[r.type] ?? r.type}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${statusMeta.cls}`}>
                          {statusMeta.label}
                        </span>
                        {r.rating && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 font-semibold">
                            {"★".repeat(r.rating)}
                            {"☆".repeat(5 - r.rating)}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {r.id.slice(0, 8)}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>
                          <b>来自：</b>{" "}
                          {r.userName || r.userEmail || r.email || "（匿名）"}
                          {r.email && r.email !== r.userEmail && ` · ${r.email}`}
                        </div>
                        {r.pageUrl && (
                          <div className="truncate">
                            <b>页面：</b>{" "}
                            <a
                              href={r.pageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {r.pageUrl}
                            </a>
                          </div>
                        )}
                        <div>
                          <b>时间：</b>{" "}
                          {new Date(r.createdAt).toLocaleString("zh-CN", {
                            timeZone: "Asia/Shanghai",
                          })}
                        </div>
                      </div>

                      <div className="mt-2 p-3 rounded-md bg-background/60 border border-border/60">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{r.message}</p>
                      </div>

                      {r.adminNote && (
                        <div className="mt-2 p-2 rounded-md bg-blue-500/10 border border-blue-500/30">
                          <p className="text-xs">
                            <b>内部备注：</b> {r.adminNote}
                          </p>
                        </div>
                      )}

                      {r.userAgent && (
                        <details className="text-[10px] text-muted-foreground mt-2">
                          <summary className="cursor-pointer">User-Agent</summary>
                          <code className="block mt-1 font-mono break-all">{r.userAgent}</code>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          状态变更 / 备注 / 回复用户的功能后续可加。当前 admin 邮件中已包含所有信息，回复用 reply-to 用户邮箱即可。
        </p>
      </div>
    </div>
  );
}
