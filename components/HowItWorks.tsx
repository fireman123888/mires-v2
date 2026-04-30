"use client";

import { useT } from "@/components/I18nProvider";
import { Pencil, Sparkles, Download } from "lucide-react";

export function HowItWorks() {
  const { t } = useT();
  const steps = [
    { key: "s1", icon: Pencil, color: "from-[hsl(178_92%_56%)] to-[hsl(200_80%_50%)]" },
    { key: "s2", icon: Sparkles, color: "from-[hsl(280_70%_60%)] to-[hsl(347_99%_58%)]" },
    { key: "s3", icon: Download, color: "from-[hsl(40_90%_60%)] to-[hsl(20_90%_55%)]" },
  ];
  return (
    <section className="mt-20 mb-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-semibold ring-1 ring-[hsl(178_92%_56%)]/20 mb-4">
          <Sparkles className="w-3 h-3 text-[hsl(178_92%_56%)]" />
          {t("how.tag")}
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{t("how.title")}</h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">{t("how.subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative">
        {/* Connecting line, hidden on mobile */}
        <div className="hidden md:block absolute top-9 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-[hsl(178_92%_56%)]/40 via-[hsl(280_70%_60%)]/40 to-[hsl(40_90%_60%)]/40 -z-10" />
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className="relative bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-3xl font-black opacity-30">0{i + 1}</div>
              </div>
              <h3 className="font-bold text-lg">{t(`how.${step.key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(`how.${step.key}.desc`)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
