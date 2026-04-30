"use client";

import { useState } from "react";
import { Wand2, Download, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";

const STYLES = [
  { id: "minimal", label: "极简线条", suffix: "minimalist line icon, single color stroke, vector, simple, clean, white background, app icon style" },
  { id: "flat", label: "扁平彩色", suffix: "flat colorful icon, vibrant gradient, modern, vector, white background, app icon style, ios style" },
  { id: "3d", label: "3D 立体", suffix: "3d isometric icon, soft shadows, glossy, modern app icon, gradient background, premium feel" },
  { id: "neon", label: "霓虹风格", suffix: "neon glowing icon, cyberpunk style, dark background, vibrant pink and cyan, glowing edges" },
];

export default function IconPage() {
  const { t } = useT();
  const [input, setInput] = useState("");
  const [styleId, setStyleId] = useState(STYLES[0].id);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResults([]);
    const style = STYLES.find((s) => s.id === styleId)!;
    const fullPrompt = `${input.trim()}, ${style.suffix}`;

    try {
      // Generate 4 variations in parallel using all 4 provider keys.
      const providers = ["replicate", "vertex", "openai", "fireworks"] as const;
      const models: Record<string, string> = {
        replicate: "flux",
        vertex: "flux-realism",
        openai: "flux-anime",
        fireworks: "turbo",
      };
      const promises = providers.map((provider) =>
        fetch("/api/generate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: fullPrompt, provider, modelId: models[provider] }),
        })
          .then((r) => r.json())
          .then((d) => d.image as string | undefined)
          .catch(() => undefined)
      );
      const results = (await Promise.all(promises)).filter(Boolean) as string[];
      setResults(results);
      if (results.length === 0) setError(t("icon.allFailed"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (b64: string, idx: number) => {
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${b64}`;
    a.download = `mires-icon-${idx + 1}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <div className="max-w-4xl mx-auto py-8 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[hsl(280_70%_60%)] opacity-15 blur-[120px]" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-semibold ring-1 ring-[hsl(280_70%_60%)]/20 mb-4">
              <Wand2 className="w-3 h-3 text-[hsl(280_70%_60%)]" />
              {t("icon.tag")}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{t("icon.title")}</h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">{t("icon.subtitle")}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <label className="block text-sm font-medium mb-2">{t("icon.inputLabel")}</label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder={t("icon.inputPlaceholder")}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <label className="block text-sm font-medium mt-4 mb-2">{t("icon.styleLabel")}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyleId(s.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all",
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
              {loading ? <Spinner className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
              {loading ? t("icon.generating") : t("icon.generate")}
            </button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive mb-4">
              {error}
            </div>
          )}

          {(loading || results.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-card border border-border overflow-hidden relative group"
                >
                  {results[i] ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/png;base64,${results[i]}`}
                        alt={`Icon ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => downloadImage(results[i], i)}
                        className="absolute bottom-2 right-2 p-1.5 rounded-md bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
