"use client";

import Link from "next/link";
import { Check, Coins } from "lucide-react";
import { Header } from "@/components/Header";
import { useT } from "@/components/I18nProvider";

export default function PricingPage() {
  const { t } = useT();

  const PLANS = [
    {
      key: "starter",
      highlight: false,
      cta_href: "/signin",
      cta_disabled: false,
      featureKeys: ["f1", "f2", "f3", "f4"],
    },
    {
      key: "small",
      highlight: false,
      cta_href: "#",
      cta_disabled: true,
      featureKeys: ["f1", "f2", "f3", "f4"],
    },
    {
      key: "medium",
      highlight: true,
      cta_href: "#",
      cta_disabled: true,
      featureKeys: ["f1", "f2", "f3", "f4", "f5"],
    },
    {
      key: "large",
      highlight: false,
      cta_href: "#",
      cta_disabled: true,
      featureKeys: ["f1", "f2", "f3", "f4", "f5", "f6"],
    },
  ];

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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            const name = t(`pricing.${plan.key}.name`);
            const price = t(`pricing.${plan.key}.price`);
            const credits = t(`pricing.${plan.key}.credits`);
            const cta = t(`pricing.${plan.key}.cta`);
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

                {plan.cta_disabled ? (
                  <div className="mt-6 py-2.5 rounded-lg text-sm font-semibold text-center bg-secondary/50 text-muted-foreground cursor-not-allowed">
                    {cta}
                  </div>
                ) : (
                  <Link
                    href={plan.cta_href}
                    className={
                      "mt-6 py-2.5 rounded-lg text-sm font-semibold text-center transition-colors " +
                      (plan.highlight
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-secondary text-foreground hover:bg-muted")
                    }
                  >
                    {cta}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
