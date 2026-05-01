import { ProviderKey } from "./provider-config";

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export const ASPECT_DIMS: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "4:3": { width: 1024, height: 768 },
  "3:4": { width: 768, height: 1024 },
};

export interface GenerateImageRequest {
  prompt: string;
  provider: ProviderKey;
  modelId: string;
  aspectRatio?: AspectRatio;
  negativePrompt?: string;
}

export interface GenerateImageResponse {
  image?: string;
  error?: string;
}
