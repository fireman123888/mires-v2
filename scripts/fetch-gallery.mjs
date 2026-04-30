// Pre-fetch 12 gallery images from Pollinations and save to public/gallery/.
// Run once before deploy: node scripts/fetch-gallery.mjs
// Skips already-downloaded files. Retries up to 5 times per image.

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "public", "gallery");
const POLL_BASE = "https://image.pollinations.ai/prompt";

const EXAMPLES = [
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

const buildUrl = (prompt, seed, model) => {
  const params = new URLSearchParams({
    width: "768",
    height: "768",
    nologo: "true",
    private: "true",
    seed: String(seed),
    model,
  });
  return `${POLL_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;
};

async function fetchOne(idx, ex) {
  const filename = String(idx + 1).padStart(2, "0") + ".jpg";
  const outPath = path.join(OUT_DIR, filename);

  if (existsSync(outPath)) {
    const stat = await fs.stat(outPath);
    if (stat.size > 5_000) {
      console.log(`[skip] ${filename} already exists (${stat.size} bytes)`);
      return { filename, status: "skipped" };
    }
  }

  const url = buildUrl(ex.prompt, ex.seed, ex.model);
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`[fetch] ${filename} attempt ${attempt}: ${ex.prompt.slice(0, 50)}...`);
      const resp = await fetch(url, {
        headers: { Accept: "image/*" },
        signal: AbortSignal.timeout(120_000),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const ct = resp.headers.get("content-type") || "";
      if (!ct.startsWith("image/")) throw new Error(`bad content-type: ${ct}`);
      const buf = Buffer.from(await resp.arrayBuffer());
      if (buf.byteLength < 5_000) throw new Error(`tiny response: ${buf.byteLength}`);
      await fs.writeFile(outPath, buf);
      console.log(`[ok]   ${filename} -> ${buf.byteLength} bytes`);
      return { filename, status: "ok", size: buf.byteLength };
    } catch (err) {
      console.warn(`[retry] ${filename} attempt ${attempt} failed: ${err.message}`);
      if (attempt < 5) await new Promise((r) => setTimeout(r, 5000));
    }
  }
  return { filename, status: "failed" };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`Saving to ${OUT_DIR}`);
  const results = [];
  for (let i = 0; i < EXAMPLES.length; i++) {
    results.push(await fetchOne(i, EXAMPLES[i]));
    // small jitter to be polite to Pollinations
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log("\nSummary:");
  console.table(results);
  const failed = results.filter((r) => r.status === "failed");
  if (failed.length > 0) {
    console.error(`${failed.length} images failed. Re-run to retry only those.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
