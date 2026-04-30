"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { useT } from "@/components/I18nProvider";

function Content() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const { t } = useT();
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "error">("loading");
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      attempts++;
      try {
        const r = await fetch(`/api/checkout/status?order=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const d = await r.json();
        if (cancelled) return;
        if (d.status === "paid") {
          setStatus("paid");
          setCredits(d.creditAmount ?? null);
          // Refresh credit balance in header
          window.dispatchEvent(new Event("mires:credits-refresh"));
          return;
        }
        if (attempts < 10) {
          setStatus("pending");
          setTimeout(poll, 2000);
        } else {
          setStatus("pending");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className="max-w-md mx-auto py-16 sm:py-24 text-center relative">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[hsl(178_92%_56%)] opacity-15 blur-[120px]" />
      </div>

      {status === "loading" || status === "pending" ? (
        <>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-6">
            <Loader2 className="w-7 h-7 animate-spin text-[hsl(178_92%_56%)]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t("payment.checking")}</h1>
          <p className="mt-4 text-muted-foreground text-sm">{t("payment.checkingBody")}</p>
        </>
      ) : status === "paid" ? (
        <>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(178_92%_56%)]/10 ring-1 ring-[hsl(178_92%_56%)]/30 mb-6">
            <CheckCircle className="w-8 h-8 text-[hsl(178_92%_56%)]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t("payment.success")}</h1>
          {credits != null && (
            <p className="mt-4 text-base">
              {t("payment.granted").replace("{n}", String(credits))}
            </p>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 mt-8 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            {t("payment.startCreating")} <ArrowRight className="w-4 h-4" />
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t("payment.error")}</h1>
          <p className="mt-4 text-muted-foreground text-sm">{t("payment.errorBody")}</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 mt-6 text-sm text-muted-foreground hover:text-foreground"
          >
            {t("payment.backToPricing")} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <Suspense fallback={null}>
          <Content />
        </Suspense>
      </div>
    </div>
  );
}
