"use client";

import { useT } from "@/components/I18nProvider";
import { Sparkles, Zap, Lock, Layers, Globe, Wand2 } from "lucide-react";

const ITEMS = [
  { key: "f1", icon: Sparkles, color: "text-[hsl(178_92%_56%)]", bg: "bg-[hsl(178_92%_56%)]/10" },
  { key: "f2", icon: Wand2, color: "text-[hsl(347_99%_58%)]", bg: "bg-[hsl(347_99%_58%)]/10" },
  { key: "f3", icon: Layers, color: "text-[hsl(280_70%_60%)]", bg: "bg-[hsl(280_70%_60%)]/10" },
  { key: "f4", icon: Zap, color: "text-[hsl(40_90%_60%)]", bg: "bg-[hsl(40_90%_60%)]/10" },
  { key: "f5", icon: Lock, color: "text-[hsl(160_70%_50%)]", bg: "bg-[hsl(160_70%_50%)]/10" },
  { key: "f6", icon: Globe, color: "text-[hsl(200_80%_55%)]", bg: "bg-[hsl(200_80%_55%)]/10" },
];

export function Features() {
  const { t } = useT();
  return (
    <section className="mt-20 mb-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-semibold ring-1 ring-[hsl(347_99%_58%)]/20 mb-4">
          <Sparkles className="w-3 h-3 text-[hsl(347_99%_58%)]" />
          {t("features.tag")}
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{t("features.title")}</h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">{t("features.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="group relative rounded-2xl border border-border bg-card p-5 sm:p-6 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${item.bg} mb-3`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <h3 className="font-bold text-base sm:text-lg">{t(`features.${item.key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(`features.${item.key}.desc`)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
