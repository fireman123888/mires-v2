"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Coins, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { useT } from "@/components/I18nProvider";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

type PackId = "starter" | "small" | "medium" | "large";
const PURCHASABLE_PACKS: PackId[] = ["small", "medium", "large"];

export default function PricingPage() {
  const { t } = useT();
  const { data: session } = useSession();
  const router = useRouter();
  const [loadingPack, setLoadingPack] = useState<PackId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const PLANS: Array<{
    key: PackId;
    highlight: boolean;
    featureKeys: string[];
  }> = [
    { key: "starter", highlight: false, featureKeys: ["f1", "f2", "f3", "f4"] },
    { key: "small",   highlight: false, featureKeys: ["f1", "f2", "f3", "f4"] },
    { key: "medium",  highlight: true,  featureKeys: ["f1", "f2", "f3", "f4", "f5"] },
    { key: "large",   highlight: false, featureKeys: ["f1", "f2", "f3", "f4", "f5", "f6"] },
  ];

  const handlePurchase = async (packId: PackId) => {
    setError(null);
    if (!session?.user) {
      // Send them to signin first, then back to pricing
      router.push("/signin");
      return;
    }
    setLoadingPack(packId);
    try {
      const r = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const d = await r.json();
      if (!r.ok || !d.checkoutUrl) {
        setError(d.error || "checkout_failed");
        setLoadingPack(null);
        return;
      }
      // Redirect to XunHuPay's hosted checkout (mobile-optimized URL)
      window.location.href = d.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoadingPack(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div className="text-center py-12 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(347_99%_58%)] opacity-15 blur-[120px]" />
            <div className="absolute top-1/2 right-1/3 translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(178_92%_56%)] opacity-10 blur-[120px]" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            {t("pricing.title.before")}
            <span className="bg-gradient-to-r from-[hsl(178_92%_56%)] to-[hsl(347_99%_58%)] bg-clip-text text-transparent">
              {t("pricing.title.highlight")}
            </span>
            {t("pricing.title.after")}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("pricing.description")}
          </p>
          {error && (
            <div className="mt-4 inline-block bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 text-sm text-destructive">
              {error === "payment_not_configured" ? t("pricing.notConfigured") : error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            const name = t(`pricing.${plan.key}.name`);
            const price = t(`pricing.${plan.key}.price`);
            const credits = t(`pricing.${plan.key}.credits`);
            const cta = t(`pricing.${plan.key}.cta`);
            const isPurchasable = PURCHASABLE_PACKS.includes(plan.key);
            const isLoading = loadingPack === plan.key;

            return (
              <div
                key={plan.key}
                className={
                  "rounded-2xl border p-5 sm:p-6 flex flex-col relative " +
                  (plan.highlight
                    ? "border-primary/50 bg-card shadow-[0_0_30px_-15px_hsl(347_99%_58%/0.5)]"
                    : "border-border bg-card")
                }
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                    {t("pricing.popular")}
                  </span>
                )}
                <h3 className="text-lg font-bold">{name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tight">{price}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-sm text-[hsl(178_92%_56%)] font-semibold">
                  <Coins className="w-4 h-4" />
                  <span>{credits}</span>
                </div>
                <ul className="mt-5 space-y-2 flex-1">
                  {plan.featureKeys.map((fk) => (
                    <li key={fk} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-[hsl(178_92%_56%)] shrink-0 mt-0.5" />
                      <span>{t(`pricing.${plan.key}.${fk}`)}</span>
                    </li>
                  ))}
                </ul>

                {plan.key === "starter" ? (
                  <Link
                    href="/signin"
                    className="mt-6 py-2.5 rounded-lg text-sm font-semibold text-center transition-colors bg-secondary text-foreground hover:bg-muted"
                  >
                    {cta}
                  </Link>
                ) : isPurchasable ? (
                  <button
                    type="button"
                    onClick={() => handlePurchase(plan.key)}
                    disabled={isLoading || loadingPack !== null}
                    className={
                      "mt-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 " +
                      (plan.highlight
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-secondary text-foreground hover:bg-muted")
                    }
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoading ? t("pricing.creatingOrder") : t(`pricing.${plan.key}.buyCta`)}
                  </button>
                ) : (
                  <div className="mt-6 py-2.5 rounded-lg text-sm font-semibold text-center bg-secondary/50 text-muted-foreground cursor-not-allowed">
                    {cta}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          {t("pricing.payHint")}
        </p>
      </div>
    </div>
  );
}
