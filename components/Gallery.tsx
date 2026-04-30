"use client";

const POLL_BASE = "https://image.pollinations.ai/prompt";

// 12 curated examples — Pollinations URL with stable seed → cached server-side,
// browser only fetches once per (prompt, seed) tuple.
const EXAMPLES: { prompt: string; seed: number; model?: string }[] = [
  { prompt: "A majestic lion standing on a cliff at sunset, photorealistic, golden hour lighting, ultra detailed", seed: 1, model: "flux" },
  { prompt: "Cyberpunk samurai warrior in neon-lit Tokyo street, rain reflections, cinematic, 8k", seed: 2, model: "flux" },
  { prompt: "Cute cat astronaut floating in space, anime style, vibrant colors, dreamy atmosphere", seed: 3, model: "flux-anime" },
  { prompt: "Underwater ancient temple with bioluminescent fish, mystical, ethereal lighting", seed: 4, model: "flux" },
  { prompt: "Watercolor painting of a Japanese garden in autumn, koi pond, maple trees, peaceful", seed: 5, model: "flux" },
  { prompt: "A futuristic city skyline at dusk, flying cars, holographic billboards, blade runner aesthetic", seed: 6, model: "flux" },
  { prompt: "Adorable corgi wearing a crown sitting on a velvet throne, royal portrait style", seed: 7, model: "flux-realism" },
  { prompt: "Magical forest with glowing mushrooms and fireflies, fantasy art, ethereal mist", seed: 8, model: "flux" },
  { prompt: "Steampunk airship floating above clouds, brass and copper, intricate machinery, sunset", seed: 9, model: "flux" },
  { prompt: "Beautiful anime girl with cherry blossoms, pastel colors, soft lighting, detailed eyes", seed: 10, model: "flux-anime" },
  { prompt: "A red dragon coiled around a mountain peak, dramatic clouds, epic fantasy, oil painting style", seed: 11, model: "flux" },
  { prompt: "Minimalist still life of fruits on a wooden table, morning light through window, photographic", seed: 12, model: "flux-realism" },
];

const buildImageUrl = (prompt: string, seed: number, model = "flux") => {
  const params = new URLSearchParams({
    width: "512",
    height: "512",
    nologo: "true",
    private: "true",
    seed: String(seed),
    model,
  });
  return `${POLL_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;
};

interface GalleryProps {
  onUsePrompt: (prompt: string) => void;
}

export function Gallery({ onUsePrompt }: GalleryProps) {
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
          获取灵感
        </h2>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          发现新内容 · 点击任一示例直接使用其提示词
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
                src={buildImageUrl(ex.prompt, ex.seed, ex.model)}
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
                点击使用
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
