// Re-skinned to use Pollinations.AI as the single backing service.
// Provider keys are kept (replicate/vertex/openai/fireworks) so existing
// components and types still work, but each one routes to a different
// Pollinations model preset under the hood. See app/api/generate-images/route.ts.

export type ProviderKey = "replicate" | "vertex" | "openai" | "fireworks";
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
    color: "from-teal-500 to-cyan-500",
    models: ["flux", "flux-pro"],
  },
  vertex: {
    displayName: "写实",
    iconPath: "/provider-icons/vertex.svg",
    color: "from-emerald-500 to-teal-500",
    models: ["flux-realism"],
  },
  openai: {
    displayName: "动漫",
    iconPath: "/provider-icons/openai.svg",
    color: "from-rose-400 to-pink-400",
    models: ["flux-anime"],
  },
  fireworks: {
    displayName: "极速",
    iconPath: "/provider-icons/fireworks.svg",
    color: "from-amber-400 to-orange-400",
    models: ["turbo"],
  },
};

export const MODEL_CONFIGS: Record<ModelMode, Record<ProviderKey, string>> = {
  performance: {
    replicate: "flux",
    vertex: "flux-realism",
    openai: "flux-anime",
    fireworks: "turbo",
  },
  quality: {
    replicate: "flux-pro",
    vertex: "flux-realism",
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
