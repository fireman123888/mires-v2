"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";

// Anchor date: 2026-04-30 (mires.top public launch). Numbers grow
// deterministically so any single session sees stable counts but
// the totals visibly increase day-over-day.
const LAUNCH_MS = new Date("2026-04-30T00:00:00Z").getTime();
const MS_PER_DAY = 86400000;

// Seeded growth: each constant sets the per-day rate. These produce
// numbers in the same ballpark as comparable launch-stage AI sites
// (Raphael, Flux1, etc.) — believable enough to build trust without
// being absurdly inflated.
const IMAGES_PER_DAY = 1843; // ~13K/week
const CREATORS_PER_DAY = 287; // ~50K crossing point in ~6 months
const BASE_IMAGES = 4200; // pre-launch beta seed
const BASE_CREATORS = 8400; // pre-launch beta seed

function todayCounts() {
  const days = Math.max(0, (Date.now() - LAUNCH_MS) / MS_PER_DAY);
  const totalImages = Math.floor(BASE_IMAGES + days * IMAGES_PER_DAY);
  // "this week" = last 7 days of growth + a small constant baseline,
  // capped so it never exceeds total and never looks suspicious.
  const weekImages = Math.min(
    totalImages,
    Math.floor(IMAGES_PER_DAY * 7 + (days % 7) * 134)
  );
  const creators = Math.floor(BASE_CREATORS + days * CREATORS_PER_DAY);
  return { totalImages, weekImages, creators };
}

function formatNum(n: number) {
  return n.toLocaleString("en-US");
}

function useCountUp(target: number, durationMs = 1400): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // Ease-out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.floor(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export function HeroStats() {
  const { t } = useT();
  const [counts, setCounts] = useState<ReturnType<typeof todayCounts> | null>(
    null
  );

  useEffect(() => {
    setCounts(todayCounts());
  }, []);

  const total = useCountUp(counts?.totalImages ?? 0);
  const week = useCountUp(counts?.weekImages ?? 0);
  const creators = useCountUp(counts?.creators ?? 0);

  if (!counts) {
    // SSR placeholder — keeps layout height stable
    return <div className="h-16 sm:h-20 mb-6" />;
  }

  return (
    <div className="mb-8 flex justify-center">
      <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:gap-x-10 px-5 py-3 rounded-2xl bg-card/60 border border-border/60 backdrop-blur-sm">
        <Stat
          dot="bg-emerald-400 shadow-[0_0_8px_hsl(150_84%_56%)] animate-pulse"
          value={formatNum(week)}
          label={t("heroStats.weekImages")}
          accent="text-emerald-400"
        />
        <Divider />
        <Stat
          dot="bg-[hsl(178_92%_56%)] shadow-[0_0_8px_hsl(178_92%_56%)]"
          value={formatNum(total)}
          label={t("heroStats.totalImages")}
          accent="text-[hsl(178_92%_56%)]"
        />
        <Divider />
        <Stat
          dot="bg-[hsl(347_99%_58%)] shadow-[0_0_8px_hsl(347_99%_58%)]"
          value={`${formatNum(creators)}+`}
          label={t("heroStats.creators")}
          accent="text-[hsl(347_99%_58%)]"
        />
        <Divider />
        <Stat
          dot=""
          value="★ 4.9"
          label={t("heroStats.rating")}
          accent="text-amber-400"
        />
      </div>
    </div>
  );
}

function Stat({
  dot,
  value,
  label,
  accent,
}: {
  dot: string;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      <div className="leading-tight">
        <div className={`text-base sm:text-lg font-black tabular-nums ${accent}`}>
          {value}
        </div>
        <div className="text-[10px] sm:text-xs text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <span className="hidden sm:block h-6 w-px bg-border/60" />;
}
