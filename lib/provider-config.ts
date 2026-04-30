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
    displayName: "Flux",
    iconPath: "/provider-icons/replicate.svg",
    color: "from-purple-500 to-blue-500",
    models: ["flux", "flux-pro"],
  },
  vertex: {
    displayName: "Photoreal",
    iconPath: "/provider-icons/vertex.svg",
    color: "from-green-500 to-emerald-500",
    models: ["flux-realism"],
  },
  openai: {
    displayName: "Anime",
    iconPath: "/provider-icons/openai.svg",
    color: "from-pink-500 to-rose-500",
    models: ["flux-anime"],
  },
  fireworks: {
    displayName: "Turbo",
    iconPath: "/provider-icons/fireworks.svg",
    color: "from-orange-500 to-red-500",
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
