"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { Coins, LogOut, Key, Crown, Sparkles } from "lucide-react";
import { useT } from "@/components/I18nProvider";
import { isProActive } from "@/lib/plans";

export function UserBadge() {
  const { data: session, isPending } = useSession();
  const { t } = useT();
  const [credits, setCredits] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const proPlanType = (session?.user as unknown as { proPlanType?: string | null })?.proPlanType ?? null;
  const proPlanExpiresAt = (session?.user as unknown as { proPlanExpiresAt?: Date | string | null })?.proPlanExpiresAt ?? null;
  const isPro = isProActive(proPlanExpiresAt);
  const tierLabel = proPlanType === "ultimate" ? "Ultimate" : "Pro";
  const TierIcon = proPlanType === "ultimate" ? Crown : Sparkles;

  useEffect(() => {
    if (!session?.user) {
      setCredits(null);
      return;
    }
    // The session user object includes additionalFields, including `credits`.
    // Type-safe access via cast since the better-auth client type may not infer it.
    const c = (session.user as unknown as { credits?: number }).credits;
    if (typeof c === "number") setCredits(c);
  }, [session]);

  // Allow other parts of the app to push a credit refresh after a generation.
  useEffect(() => {
    const refresh = async () => {
      try {
        const resp = await fetch("/api/me/credits", { cache: "no-store" });
        if (resp.ok) {
          const d = await resp.json();
          if (typeof d.credits === "number") setCredits(d.credits);
        }
      } catch {}
    };
    window.addEventListener("mires:credits-refresh", refresh);
    return () => window.removeEventListener("mires:credits-refresh", refresh);
  }, []);

  if (isPending) return null;

  if (!session?.user) {
    return (
      <Link
        href="/signin"
        className="text-sm font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        {t("header.signin")}
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md hover:bg-secondary transition-colors"
      >
        {isPro && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[hsl(280_85%_60%)] to-[hsl(347_99%_58%)] text-white text-xs font-bold">
            <TierIcon className="w-3 h-3" />
            {tierLabel}
          </span>
        )}
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs font-semibold ring-1 ring-[hsl(178_92%_56%)]/30">
          <Coins className="w-3 h-3 text-[hsl(178_92%_56%)]" />
          {credits ?? "—"}
        </span>
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(178_92%_56%)] to-[hsl(347_99%_58%)] flex items-center justify-center text-white font-bold text-xs">
          {(session.user.email || "?")[0].toUpperCase()}
        </span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 min-w-[220px] rounded-lg bg-card border border-border shadow-lg p-2 z-50"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-3 py-2 border-b border-border mb-1">
            <div className="text-xs text-muted-foreground">{t("header.signedInAs")}</div>
            <div className="text-sm font-medium truncate">{session.user.email}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <Coins className="w-3.5 h-3.5 text-[hsl(178_92%_56%)]" />
              <span className="font-semibold">{credits ?? "—"}</span>
              <span className="text-muted-foreground">{t("header.credits")}</span>
            </div>
            {isPro && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                <TierIcon className="w-3.5 h-3.5 text-[hsl(280_85%_60%)]" />
                <span className="font-semibold">{tierLabel}</span>
                <span className="text-muted-foreground">
                  · {t("header.proExpires")}{" "}
                  {proPlanExpiresAt ? new Date(proPlanExpiresAt).toLocaleDateString("zh-CN") : ""}
                </span>
              </div>
            )}
          </div>
          <Link href="/pricing" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-secondary transition-colors">
            <Coins className="w-4 h-4" />
            {t("header.buyCredits")}
          </Link>
          <Link href="/account/set-password" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-secondary transition-colors">
            <Key className="w-4 h-4" />
            {t("header.setPassword")}
          </Link>
          <button
            onClick={async () => {
              await authClient.signOut();
              window.location.href = "/";
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-secondary transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            {t("header.signout")}
          </button>
        </div>
      )}
    </div>
  );
}
