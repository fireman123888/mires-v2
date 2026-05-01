"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

export function ClaimActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function act(action: "approve" | "reject") {
    setBusy(action);
    setErr(null);
    try {
      const r = await fetch("/api/admin/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(d.error || `HTTP ${r.status}`);
        setBusy(null);
        return;
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => act("approve")}
          disabled={busy !== null}
          className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50 hover:bg-emerald-500"
        >
          {busy === "approve" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          通过并发放积分
        </button>
        <button
          type="button"
          onClick={() => act("reject")}
          disabled={busy !== null}
          className="px-3 py-1.5 rounded-md bg-secondary text-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-50 hover:bg-muted"
        >
          {busy === "reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          拒绝
        </button>
      </div>
      {err && <span className="text-xs text-destructive">{err}</span>}
    </div>
  );
}
