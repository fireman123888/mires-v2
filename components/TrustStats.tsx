"use client";

import { useT } from "@/components/I18nProvider";

export function TrustStats() {
  const { t } = useT();
  const stats = [
    { value: t("stats.s1.value"), label: t("stats.s1.label"), color: "from-[hsl(178_92%_56%)] to-[hsl(200_80%_50%)]" },
    { value: t("stats.s2.value"), label: t("stats.s2.label"), color: "from-[hsl(347_99%_58%)] to-[hsl(330_80%_50%)]" },
    { value: t("stats.s3.value"), label: t("stats.s3.label"), color: "from-[hsl(280_70%_60%)] to-[hsl(250_70%_55%)]" },
    { value: t("stats.s4.value"), label: t("stats.s4.label"), color: "from-[hsl(40_90%_60%)] to-[hsl(20_90%_55%)]" },
  ];
  return (
    <section className="mt-20 mb-12 relative">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[200px] rounded-full bg-gradient-to-r from-[hsl(178_92%_56%)] via-[hsl(280_70%_60%)] to-[hsl(347_99%_58%)] opacity-10 blur-[120px]" />
      </div>

      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{t("stats.title")}</h2>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">{t("stats.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="relative rounded-2xl border border-border bg-card p-5 sm:p-7 text-center overflow-hidden group hover:border-primary/40 transition-colors"
          >
            <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${s.color} opacity-15 blur-2xl group-hover:opacity-25 transition-opacity`} />
            <div className={`text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
              {s.value}
            </div>
            <div className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
