"use client";

import { useEffect, useRef, useState } from "react";
import { Quote, Star, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/I18nProvider";

interface Testimonial {
  key: string;
  initials: string;
  color: string; // tailwind gradient
}

const TESTIMONIALS: Testimonial[] = [
  { key: "t1", initials: "L", color: "from-[hsl(178_92%_56%)] to-[hsl(200_80%_50%)]" },
  { key: "t2", initials: "Z", color: "from-[hsl(347_99%_58%)] to-[hsl(330_80%_50%)]" },
  { key: "t3", initials: "M", color: "from-[hsl(280_70%_60%)] to-[hsl(250_70%_55%)]" },
  { key: "t4", initials: "A", color: "from-[hsl(40_90%_60%)] to-[hsl(20_90%_55%)]" },
  { key: "t5", initials: "K", color: "from-[hsl(160_70%_50%)] to-[hsl(180_70%_45%)]" },
  { key: "t6", initials: "S", color: "from-[hsl(347_99%_58%)] to-[hsl(40_90%_60%)]" },
  { key: "t7", initials: "R", color: "from-[hsl(200_80%_55%)] to-[hsl(280_70%_60%)]" },
  { key: "t8", initials: "W", color: "from-[hsl(178_92%_56%)] to-[hsl(347_99%_58%)]" },
];

export function Testimonials() {
  const { t } = useT();
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Sync active dot indicator from scroll position.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const cardWidth = el.scrollWidth / TESTIMONIALS.length;
      const idx = Math.round(el.scrollLeft / cardWidth);
      setActiveIdx(Math.min(Math.max(idx, 0), TESTIMONIALS.length - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollBy = (dir: "prev" | "next") => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / TESTIMONIALS.length;
    el.scrollBy({ left: dir === "next" ? cardWidth : -cardWidth, behavior: "smooth" });
  };

  return (
    <section className="mt-20 mb-12 relative">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full bg-gradient-to-r from-[hsl(178_92%_56%)] via-[hsl(280_70%_60%)] to-[hsl(347_99%_58%)] opacity-8 blur-[120px]" />
      </div>

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-semibold ring-1 ring-[hsl(280_70%_60%)]/20 mb-4">
          <MessageSquare className="w-3 h-3 text-[hsl(280_70%_60%)]" />
          {t("testimonials.tag")}
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{t("testimonials.title")}</h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">{t("testimonials.subtitle")}</p>
      </div>

      <div className="relative">
        {/* Carousel track */}
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scroll-smooth scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {TESTIMONIALS.map((tm) => (
            <article
              key={tm.key}
              className="snap-center shrink-0 w-[85%] sm:w-[420px] rounded-2xl bg-card border border-border p-6 relative overflow-hidden hover:border-primary/40 transition-colors"
            >
              <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${tm.color} opacity-15 blur-2xl`} />
              <Quote className="w-6 h-6 text-primary/30 mb-3" />
              <p className="text-sm sm:text-base leading-relaxed mb-5 min-h-[5em]">
                &ldquo;{t(`testimonials.${tm.key}.quote`)}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${tm.color} flex items-center justify-center text-white font-black shrink-0`}>
                  {tm.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate">{t(`testimonials.${tm.key}.name`)}</div>
                  <div className="text-xs text-muted-foreground truncate">{t(`testimonials.${tm.key}.role`)}</div>
                </div>
                <div className="flex gap-0.5 text-[hsl(40_90%_60%)] shrink-0">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Side fade gradients to hint scrollability */}
        <div className="hidden sm:block absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="hidden sm:block absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />

        {/* Prev/Next buttons (desktop) */}
        <button
          onClick={() => scrollBy("prev")}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card border border-border items-center justify-center hover:bg-secondary transition-colors z-10"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scrollBy("next")}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card border border-border items-center justify-center hover:bg-secondary transition-colors z-10"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-5">
        {TESTIMONIALS.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === activeIdx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </section>
  );
}
