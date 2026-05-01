// Re-skinned to use Pollinations.AI as the single backing service.
// Provider keys are kept (replicate/vertex/openai/fireworks) so existing
// components and types still work, but each one routes to a different
// Pollinations model preset under the hood. See app/api/generate-images/route.ts.

export type ProviderKey = "replicate" | "vertex" | "openai" | "fireworks";
// "performance" → Free Unlimited tier (all Pollinations, no credits)
// "quality"     → Premium tier (Nano Banana 2 in vertex slot, costs credits)
// Names kept for backwards compat with existing components.
export type ModelMode = "performance" | "quality";

export const PROVIDERS: Record<
  ProviderKey,
  {
    displayName: string;
    iconPath: string;
    color: string;
    models: string[];
  }
> = {
  replicate: {
    displayName: "Flux Schnell HD",
    iconPath: "/provider-icons/replicate.svg",
    color: "from-cyan-400 to-blue-500",
    models: ["flux-schnell-cf", "flux", "flux-pro"],
  },
  vertex: {
    displayName: "🍌 Nano Banana 2",
    iconPath: "/provider-icons/vertex.svg",
    color: "from-amber-400 to-yellow-500",
    models: ["nano-banana-2", "flux-realism"],
  },
  openai: {
    displayName: "动漫",
    iconPath: "/provider-icons/openai.svg",
    color: "from-pink-500 to-rose-500",
    models: ["flux-anime"],
  },
  fireworks: {
    displayName: "极速",
    iconPath: "/provider-icons/fireworks.svg",
    color: "from-rose-500 to-amber-500",
    models: ["turbo"],
  },
};

export const MODEL_CONFIGS: Record<ModelMode, Record<ProviderKey, string>> = {
  // Free Unlimited: replicate slot uses Cloudflare Workers AI Flux 1
  // Schnell (~100 imgs/day cap, free), vertex falls back to Pollinations
  // realism, others stay on Pollinations free.
  performance: {
    replicate: "flux-schnell-cf",
    vertex: "flux-realism",
    openai: "flux-anime",
    fireworks: "turbo",
  },
  // Premium: vertex promoted to Nano Banana 2 (12 credits, 450 RPD cap).
  // replicate stays on CF Flux Schnell HD.
  quality: {
    replicate: "flux-schnell-cf",
    vertex: "nano-banana-2",
    openai: "flux-anime",
    fireworks: "flux",
  },
};

export const PROVIDER_ORDER: ProviderKey[] = [
  "replicate",
  "vertex",
  "openai",
  "fireworks",
];

export const initializeProviderRecord = <T>(defaultValue?: T) =>
  Object.fromEntries(
    PROVIDER_ORDER.map((key) => [key, defaultValue])
  ) as Record<ProviderKey, T>;
