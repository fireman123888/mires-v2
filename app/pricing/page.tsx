"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Header } from "@/components/Header";
import { useT } from "@/components/I18nProvider";

export default function PricingPage() {
  const { t } = useT();

  const PLANS = [
    {
      name: t("pricing.free.name"),
      price: "¥0",
      period: t("pricing.free.period"),
      highlight: false,
      cta: t("pricing.free.cta"),
      href: "/",
      features: [
        t("pricing.free.f1"),
        t("pricing.free.f2"),
        t("pricing.free.f3"),
        t("pricing.free.f4"),
        t("pricing.free.f5"),
      ],
    },
    {
      name: t("pricing.pro.name"),
      price: "¥39",
      period: t("pricing.pro.period"),
      highlight: true,
      cta: t("pricing.pro.cta"),
      href: "#",
      features: [
        t("pricing.pro.f1"),
        t("pricing.pro.f2"),
        t("pricing.pro.f3"),
        t("pricing.pro.f4"),
        t("pricing.pro.f5"),
        t("pricing.pro.f6"),
      ],
    },
    {
      name: t("pricing.team.name"),
      price: t("pricing.team.price"),
      period: "",
      highlight: false,
      cta: t("pricing.team.cta"),
      href: "#",
      features: [
        t("pricing.team.f1"),
        t("pricing.team.f2"),
        t("pricing.team.f3"),
        t("pricing.team.f4"),
        t("pricing.team.f5"),
      ],
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                "rounded-2xl border p-6 sm:p-8 flex flex-col " +
                (plan.highlight
                  ? "border-primary/50 bg-card shadow-[0_0_30px_-15px_hsl(347_99%_58%/0.5)] relative"
                  : "border-border bg-card")
              }
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                  {t("pricing.popular")}
                </span>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-[hsl(178_92%_56%)] shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={
                  "mt-8 py-2.5 rounded-lg text-sm font-semibold text-center transition-colors " +
                  (plan.highlight
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-secondary text-foreground hover:bg-muted")
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
