"use client";

import { useT } from "@/components/I18nProvider";

// 12 curated examples — images pre-generated and served as static files
// from /public/gallery/ via Vercel CDN for stability and speed.
// Re-generate with: node scripts/fetch-gallery.mjs
const EXAMPLES: { file: string; prompt: string }[] = [
  { file: "/gallery/01.jpg", prompt: "A majestic lion standing on a cliff at sunset, photorealistic, golden hour lighting, ultra detailed" },
  { file: "/gallery/02.jpg", prompt: "Cyberpunk samurai warrior in neon-lit Tokyo street, rain reflections, cinematic, 8k" },
  { file: "/gallery/03.jpg", prompt: "Cute cat astronaut floating in space, anime style, vibrant colors, dreamy atmosphere" },
  { file: "/gallery/04.jpg", prompt: "Underwater ancient temple with bioluminescent fish, mystical, ethereal lighting" },
  { file: "/gallery/05.jpg", prompt: "Watercolor painting of a Japanese garden in autumn, koi pond, maple trees, peaceful" },
  { file: "/gallery/06.jpg", prompt: "A futuristic city skyline at dusk, flying cars, holographic billboards, blade runner aesthetic" },
  { file: "/gallery/07.jpg", prompt: "Adorable corgi wearing a crown sitting on a velvet throne, royal portrait style" },
  { file: "/gallery/08.jpg", prompt: "Magical forest with glowing mushrooms and fireflies, fantasy art, ethereal mist" },
  { file: "/gallery/09.jpg", prompt: "Steampunk airship floating above clouds, brass and copper, intricate machinery, sunset" },
  { file: "/gallery/10.jpg", prompt: "Beautiful anime girl with cherry blossoms, pastel colors, soft lighting, detailed eyes" },
  { file: "/gallery/11.jpg", prompt: "A red dragon coiled around a mountain peak, dramatic clouds, epic fantasy, oil painting style" },
  { file: "/gallery/12.jpg", prompt: "Minimalist still life of fruits on a wooden table, morning light through window, photographic" },
];

interface GalleryProps {
  onUsePrompt: (prompt: string) => void;
}

export function Gallery({ onUsePrompt }: GalleryProps) {
  const { t } = useT();
  const handleClick = (prompt: string) => {
    onUsePrompt(prompt);
    // Smooth scroll to the prompt input
    const target = document.getElementById("prompt-input");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section className="mt-16 mb-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("gallery.title")}
        </h2>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          {t("gallery.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {EXAMPLES.map((ex, idx) => (
          <div
            key={idx}
            className="group rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_-10px_hsl(347_99%_58%/0.5)]"
          >
            <div className="aspect-square relative overflow-hidden bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ex.file}
                alt={ex.prompt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
                {ex.prompt}
              </p>
              <button
                onClick={() => handleClick(ex.prompt)}
                className="w-full text-sm font-semibold py-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
              >
                {t("gallery.usePrompt")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
