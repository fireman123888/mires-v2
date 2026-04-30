"use client";

import { useState } from "react";
import { Palette, Download, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";

const STYLES = [
  { id: "watercolor", label: "水彩", suffix: "watercolor painting style, soft brush strokes, paper texture, pastel colors" },
  { id: "oil", label: "油画", suffix: "oil painting style, thick brush strokes, classical art, rich textures" },
  { id: "pixel", label: "像素", suffix: "pixel art, 8-bit retro game style, blocky pixels, limited color palette" },
  { id: "anime", label: "动漫", suffix: "anime style, cel shaded, vibrant colors, manga aesthetic, studio ghibli" },
  { id: "cyberpunk", label: "赛博朋克", suffix: "cyberpunk style, neon lights, futuristic, blade runner aesthetic, rain reflections" },
  { id: "ghibli", label: "吉卜力", suffix: "studio ghibli style, miyazaki, pastoral, dreamy, hand-drawn animation" },
  { id: "lowpoly", label: "低多边形", suffix: "low poly 3d render, geometric, flat shading, vibrant colors" },
  { id: "comic", label: "美漫", suffix: "american comic book style, halftone dots, bold lines, dramatic shading" },
  { id: "realistic", label: "写实", suffix: "photorealistic, ultra detailed, professional photography, sharp focus, dramatic lighting" },
  { id: "sketch", label: "素描", suffix: "pencil sketch, black and white, hand drawn, detailed shading, artistic" },
  { id: "vintage", label: "复古", suffix: "vintage 1970s aesthetic, faded colors, film grain, retro photography" },
  { id: "synthwave", label: "蒸汽波", suffix: "synthwave aesthetic, retro 80s, neon grid, sunset, palm trees, vaporwave" },
];

export default function StylePage() {
  const { t } = useT();
  const [input, setInput] = useState("");
  const [styleId, setStyleId] = useState(STYLES[0].id);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const style = STYLES.find((s) => s.id === styleId)!;
    const fullPrompt = `${input.trim()}, ${style.suffix}`;

    try {
      const r = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt, provider: "replicate", modelId: "flux" }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Generation failed");
        return;
      }
      setResult(d.image);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${result}`;
    a.download = `mires-style-${styleId}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <div className="max-w-4xl mx-auto py-8 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[hsl(347_99%_58%)] opacity-15 blur-[120px]" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-semibold ring-1 ring-[hsl(347_99%_58%)]/20 mb-4">
              <Palette className="w-3 h-3 text-[hsl(347_99%_58%)]" />
              {t("style.tag")}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{t("style.title")}</h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">{t("style.subtitle")}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <label className="block text-sm font-medium mb-2">{t("style.inputLabel")}</label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder={t("style.inputPlaceholder")}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <label className="block text-sm font-medium mt-4 mb-2">{t("style.styleLabel")}</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyleId(s.id)}
                  className={cn(
                    "px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all",
                    styleId === s.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-muted"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              onClick={generate}
              disabled={!input.trim() || loading}
              className="mt-5 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? <Spinner className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
              {loading ? t("style.generating") : t("style.generate")}
            </button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive mb-4">
              {error}
            </div>
          )}

          {(loading || result) && (
            <div className="aspect-square max-w-md mx-auto rounded-xl bg-card border border-border overflow-hidden relative group">
              {result ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${result}`}
                    alt="Generated"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={downloadImage}
                    className="absolute bottom-3 right-3 p-2 rounded-md bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
