"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, Lock, X } from "lucide-react";
import { useT } from "@/components/I18nProvider";

type Reason = "credits_insufficient" | "anon_daily_limit" | "rate_limited" | "global_busy" | "user_busy" | "ip_busy" | null;

export function OutOfCreditsModal() {
  const [reason, setReason] = useState<Reason>(null);
  const { t } = useT();

  useEffect(() => {
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<Reason>).detail;
      setReason(detail);
    };
    window.addEventListener("mires:credits-blocked", onEvent as EventListener);
    return () => window.removeEventListener("mires:credits-blocked", onEvent as EventListener);
  }, []);

  if (!reason) return null;

  let Icon = Coins;
  let title = t("credits.outTitle");
  let body = t("credits.outBody").replace("{cost}", "10");
  let showSignin = true;

  if (reason === "anon_daily_limit") {
    Icon = Lock;
    title = t("credits.anonLimit");
    body = t("credits.anonLimitBody");
    showSignin = true;
  } else if (reason === "rate_limited") {
    Icon = Lock;
    title = t("rate.tooFast");
    body = t("rate.tooFastBody");
    showSignin = false;
  } else if (reason === "global_busy" || reason === "user_busy" || reason === "ip_busy") {
    Icon = Lock;
    title = t("rate.busy");
    body = t("rate.busyBody");
    showSignin = false;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={() => setReason(null)}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-md w-full relative shadow-[0_0_50px_-15px_hsl(347_99%_58%/0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setReason(null)}
          className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-secondary transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 ring-1 ring-primary/30 mb-4">
          <Icon className="w-6 h-6 text-primary" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold mb-2">{title}</h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{body}</p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          {showSignin && (
            <Link
              href="/signin"
              onClick={() => setReason(null)}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-center hover:opacity-90 transition-opacity"
            >
              {t("credits.signinCta")}
            </Link>
          )}
          <button
            onClick={() => setReason(null)}
            className={
              showSignin
                ? "flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-secondary text-foreground hover:bg-muted transition-colors text-sm font-medium"
                : "w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            }
          >
            {t("credits.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
