"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Copy, ArrowRight, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/components/I18nProvider";

export default function OptimizerPage() {
  const { t } = useT();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOptimize = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setOutput("");
    try {
      const r = await fetch("/api/optimize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input.trim() }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Optimization failed");
        return;
      }
      setOutput(d.optimized);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <div className="max-w-3xl mx-auto py-10 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[hsl(178_92%_56%)] opacity-15 blur-[120px]" />
          </div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-semibold ring-1 ring-[hsl(178_92%_56%)]/20 mb-4">
              <Sparkles className="w-3 h-3 text-[hsl(178_92%_56%)]" />
              {t("optimizer.tag")}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{t("optimizer.title")}</h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">{t("optimizer.subtitle")}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 mb-4">
            <label className="block text-sm font-medium mb-2">{t("optimizer.inputLabel")}</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              placeholder={t("optimizer.inputPlaceholder")}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <button
              onClick={handleOptimize}
              disabled={!input.trim() || loading}
              className="mt-3 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? <Spinner className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {loading ? t("optimizer.optimizing") : t("optimizer.optimize")}
            </button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive mb-4">
              {error}
            </div>
          )}

          {output && (
            <div className="bg-card border border-primary/40 rounded-xl p-5 shadow-[0_0_30px_-15px_hsl(347_99%_58%/0.4)]">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[hsl(178_92%_56%)]" />
                  {t("optimizer.outputLabel")}
                </label>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary hover:bg-muted transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-[hsl(178_92%_56%)]" /> : <Copy className="w-3 h-3" />}
                  {copied ? t("optimizer.copied") : t("optimizer.copy")}
                </button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{output}</p>
              <div className="mt-4 pt-4 border-t border-border">
                <Link
                  href={`/?prompt=${encodeURIComponent(output)}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
                >
                  {t("optimizer.useNow")} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
