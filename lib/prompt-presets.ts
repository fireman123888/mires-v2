// Preset suffix bundles for the Raphael-style chip dropdowns. Selecting
// a preset appends its `suffix` to the user prompt (joined with ", ")
// before submission. None values are no-ops.
//
// Labels are intentionally plain English — Pollinations and Gemini both
// understand these natural-language directives without any model-specific
// adapter. Adding new presets requires no backend changes.

export interface Preset {
  id: string;
  labelKey: string; // i18n key OR literal label (when starts with "@")
  literalLabel?: string; // plain text fallback if no i18n
  suffix: string; // empty string = no-op
}

export const STYLE_PRESETS: Preset[] = [
  { id: "none", labelKey: "prompt.style.none", suffix: "" },
  { id: "photo", literalLabel: "Photorealistic", labelKey: "@", suffix: "photorealistic, ultra-detailed, dslr photography" },
  { id: "anime", literalLabel: "Anime", labelKey: "@", suffix: "anime style, cel shading, vibrant" },
  { id: "ghibli", literalLabel: "Studio Ghibli", labelKey: "@", suffix: "studio ghibli style, hand-painted, soft watercolor" },
  { id: "oil", literalLabel: "Oil Painting", labelKey: "@", suffix: "oil painting, thick brushstrokes, classical art" },
  { id: "water", literalLabel: "Watercolor", labelKey: "@", suffix: "watercolor painting, soft edges, paper texture" },
  { id: "3d", literalLabel: "3D Render", labelKey: "@", suffix: "3d render, octane, ray-traced lighting" },
  { id: "cyber", literalLabel: "Cyberpunk", labelKey: "@", suffix: "cyberpunk, neon, futuristic, blade runner aesthetic" },
  { id: "sketch", literalLabel: "Pencil Sketch", labelKey: "@", suffix: "pencil sketch, graphite, hand-drawn" },
];

export const COLOR_PRESETS: Preset[] = [
  { id: "none", labelKey: "prompt.color.none", suffix: "" },
  { id: "vibrant", literalLabel: "Vibrant", labelKey: "@", suffix: "vibrant saturated colors" },
  { id: "pastel", literalLabel: "Pastel", labelKey: "@", suffix: "soft pastel palette" },
  { id: "mono", literalLabel: "Monochrome", labelKey: "@", suffix: "monochrome, black and white" },
  { id: "sepia", literalLabel: "Sepia", labelKey: "@", suffix: "sepia tones, vintage" },
  { id: "neon", literalLabel: "Neon", labelKey: "@", suffix: "neon colors, glowing" },
  { id: "warm", literalLabel: "Warm", labelKey: "@", suffix: "warm color palette, golden tones" },
  { id: "cool", literalLabel: "Cool", labelKey: "@", suffix: "cool color palette, blue and teal tones" },
];

export const LIGHTING_PRESETS: Preset[] = [
  { id: "none", labelKey: "prompt.lighting.none", suffix: "" },
  { id: "cinematic", literalLabel: "Cinematic", labelKey: "@", suffix: "cinematic lighting, dramatic" },
  { id: "soft", literalLabel: "Soft Light", labelKey: "@", suffix: "soft diffused lighting" },
  { id: "golden", literalLabel: "Golden Hour", labelKey: "@", suffix: "golden hour, warm sunset light" },
  { id: "studio", literalLabel: "Studio", labelKey: "@", suffix: "studio lighting, three-point setup" },
  { id: "backlit", literalLabel: "Backlit", labelKey: "@", suffix: "backlit, rim lighting, silhouette" },
  { id: "neonglow", literalLabel: "Neon Glow", labelKey: "@", suffix: "neon glow, bioluminescent" },
  { id: "moody", literalLabel: "Moody", labelKey: "@", suffix: "moody chiaroscuro lighting, low-key" },
];

export const COMPOSITION_PRESETS: Preset[] = [
  { id: "none", labelKey: "prompt.composition.none", suffix: "" },
  { id: "closeup", literalLabel: "Close-up", labelKey: "@", suffix: "close-up shot, detailed" },
  { id: "wide", literalLabel: "Wide Angle", labelKey: "@", suffix: "wide angle shot, expansive view" },
  { id: "birdeye", literalLabel: "Bird's-eye", labelKey: "@", suffix: "bird's-eye view, top-down" },
  { id: "lowangle", literalLabel: "Low Angle", labelKey: "@", suffix: "low angle shot, dramatic perspective" },
  { id: "symmetric", literalLabel: "Symmetrical", labelKey: "@", suffix: "symmetrical composition, centered" },
  { id: "rule3", literalLabel: "Rule of Thirds", labelKey: "@", suffix: "rule of thirds composition" },
  { id: "macro", literalLabel: "Macro", labelKey: "@", suffix: "macro photography, extreme close-up" },
];

export const ASPECT_PRESETS: Array<{ id: "1:1" | "16:9" | "9:16" | "4:3" | "3:4"; label: string }> = [
  { id: "1:1", label: "1:1" },
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
  { id: "4:3", label: "4:3" },
  { id: "3:4", label: "3:4" },
];

/**
 * Joins a base prompt with selected preset suffixes. Filters out empty
 * suffixes (the "none" presets) so the final prompt stays clean.
 */
export function buildPrompt(base: string, suffixes: string[]): string {
  const cleaned = suffixes.map((s) => s.trim()).filter((s) => s.length > 0);
  if (cleaned.length === 0) return base.trim();
  return `${base.trim()}, ${cleaned.join(", ")}`;
}
