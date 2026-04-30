"use client";

import { useT } from "@/components/I18nProvider";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// 12 curated examples — images pre-generated and served as static files
// from /public/gallery/ via Vercel CDN for stability and speed.
const EXAMPLES: { file: string; prompt: string; tag: string }[] = [
  { file: "/gallery/01.jpg", prompt: "A majestic lion standing on a cliff at sunset, photorealistic, golden hour lighting, ultra detailed", tag: "写实" },
  { file: "/gallery/02.jpg", prompt: "Cyberpunk samurai warrior in neon-lit Tokyo street, rain reflections, cinematic, 8k", tag: "赛博朋克" },
  { file: "/gallery/03.jpg", prompt: "Cute cat astronaut floating in space, anime style, vibrant colors, dreamy atmosphere", tag: "动漫" },
  { file: "/gallery/04.jpg", prompt: "Underwater ancient temple with bioluminescent fish, mystical, ethereal lighting", tag: "奇幻" },
  { file: "/gallery/05.jpg", prompt: "Watercolor painting of a Japanese garden in autumn, koi pond, maple trees, peaceful", tag: "水彩" },
  { file: "/gallery/06.jpg", prompt: "A futuristic city skyline at dusk, flying cars, holographic billboards, blade runner aesthetic", tag: "科幻" },
  { file: "/gallery/07.jpg", prompt: "Adorable corgi wearing a crown sitting on a velvet throne, royal portrait style", tag: "肖像" },
  { file: "/gallery/08.jpg", prompt: "Magical forest with glowing mushrooms and fireflies, fantasy art, ethereal mist", tag: "幻想" },
  { file: "/gallery/09.jpg", prompt: "Steampunk airship floating above clouds, brass and copper, intricate machinery, sunset", tag: "蒸汽朋克" },
  { file: "/gallery/10.jpg", prompt: "Beautiful anime girl with cherry blossoms, pastel colors, soft lighting, detailed eyes", tag: "动漫" },
  { file: "/gallery/11.jpg", prompt: "A red dragon coiled around a mountain peak, dramatic clouds, epic fantasy, oil painting style", tag: "油画" },
  { file: "/gallery/12.jpg", prompt: "Minimalist still life of fruits on a wooden table, morning light through window, photographic", tag: "极简" },
];

// Bento layout — 12 cards in mixed sizes. Indices 0, 5, 10 get 2x2 feature
// treatment so the grid breathes; rest are 1x1.
const FEATURED_INDICES = new Set([0, 5, 10]);

interface GalleryProps {
  onUsePrompt: (prompt: string) => void;
}

export function Gallery({ onUsePrompt }: GalleryProps) {
  const { t } = useT();
  const handleClick = (prompt: string) => {
    onUsePrompt(prompt);
    const target = document.getElementById("prompt-input");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section className="mt-20 mb-12 relative">
      {/* Decorative top divider with chromatic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[hsl(178_92%_56%)] to-transparent opacity-60" />

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-semibold ring-1 ring-[hsl(178_92%_56%)]/20 mb-4">
          <Sparkles className="w-3 h-3 text-[hsl(178_92%_56%)]" />
          Inspiration
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
          {t("gallery.title")}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          {t("gallery.subtitle")}
        </p>
      </div>

      {/* Bento grid: 4 cols on desktop with mixed spans for visual rhythm */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[160px] sm:auto-rows-[180px] lg:auto-rows-[200px]">
        {EXAMPLES.map((ex, idx) => {
          const featured = FEATURED_INDICES.has(idx);
          return (
            <button
              key={idx}
              onClick={() => handleClick(ex.prompt)}
              className={cn(
                "group relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_-8px_hsl(347_99%_58%/0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                featured && "sm:col-span-2 sm:row-span-2"
              )}
              aria-label={ex.prompt}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ex.file}
                alt={ex.prompt}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Bottom gradient overlay for text legibility */}
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none" />

              {/* Tag pill — top-left */}
              <span className="absolute top-2.5 left-2.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-sm text-white border border-white/20">
                {ex.tag}
              </span>

              {/* Hover-only "use prompt" cue — top-right */}
              <span className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>

              {/* Prompt text — bottom, larger on featured */}
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 text-left">
                <p className={cn(
                  "text-white line-clamp-2 leading-snug font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
                  featured ? "text-sm sm:text-base" : "text-xs sm:text-sm"
                )}>
                  {ex.prompt}
                </p>
                <span className="mt-1.5 inline-block text-[10px] sm:text-xs font-semibold text-[hsl(178_92%_56%)] opacity-0 group-hover:opacity-100 transition-opacity">
                  {t("gallery.usePrompt")} →
                </span>
              </div>

              {/* Decorative corner glow on hover */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
