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
    displayName: "Flux 标准",
    iconPath: "/provider-icons/replicate.svg",
    color: "from-cyan-400 to-blue-500",
    models: ["flux", "flux-pro"],
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
  // Free Unlimited: all 4 panels go through Pollinations (zero API cost,
  // no daily cap, no credit deduction beyond the standard 4-credit charge
  // per generation that matches anonymous-IP free tier).
  performance: {
    replicate: "flux",
    vertex: "flux-realism",
    openai: "flux-anime",
    fireworks: "turbo",
  },
  // Premium: vertex slot promoted to Nano Banana 2 (12 credits, gated by
  // global 45/day cap). Other 3 stay on Pollinations Pro variants.
  quality: {
    replicate: "flux-pro",
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
