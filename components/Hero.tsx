"use client";

import { useT } from "@/components/I18nProvider";

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary text-foreground px-3 py-1 text-xs font-semibold ring-1 ring-white/5">
    <span className="h-1.5 w-1.5 rounded-full bg-[hsl(178_92%_56%)] shadow-[0_0_6px_hsl(178_92%_56%)]" />
    {children}
  </span>
);

export const Hero = () => {
  const { t } = useT();
  return (
    <section className="text-center py-2 sm:py-4 mb-3 relative">
      {/* Subtle red/cyan glow behind hero, Douyin chromatic feel */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[hsl(347_99%_58%)] opacity-20 blur-[120px]" />
        <div className="absolute top-1/2 right-1/3 translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[hsl(178_92%_56%)] opacity-15 blur-[120px]" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
        <Badge>{t("hero.badge.free")}</Badge>
        <Badge>{t("hero.badge.noLogin")}</Badge>
        <Badge>{t("hero.badge.unlimited")}</Badge>
      </div>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-balance">
        {t("hero.title.before")}
        <span className="bg-gradient-to-r from-[hsl(178_92%_56%)] via-white to-[hsl(347_99%_58%)] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
          {t("hero.title.highlight")}
        </span>
        {t("hero.title.after")}
      </h1>

      <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto text-balance line-clamp-2">
        {t("hero.description")}
      </p>
    </section>
  );
};
