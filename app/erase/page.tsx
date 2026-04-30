"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Eraser, Download, Trash2, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { useT } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";

export default function ErasePage() {
  const { t } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [originalUrl, resultUrl]);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(t("erase.notImage"));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError(t("erase.tooBig"));
      return;
    }
    setError(null);
    setResultUrl(null);
    setOriginalFile(file);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(URL.createObjectURL(file));
  }, [originalUrl, t]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) loadFile(f);
  };

  const handleClear = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setOriginalUrl(null);
    setResultUrl(null);
    setOriginalFile(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeBackground = async () => {
    if (!originalFile || processing) return;
    setProcessing(true);
    setError(null);
    setProgress(0);
    try {
      // Lazy-load the background-removal library — it's ~5MB so we only fetch
      // when the user clicks the button (saves bundle on first paint).
      const { removeBackground: imglyRemove } = await import("@imgly/background-removal");

      const blob = await imglyRemove(originalFile, {
        progress: (key: string, current: number, total: number) => {
          if (total > 0) setProgress(Math.round((current / total) * 100));
        },
      });

      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "mires-erase.png";
    a.click();
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <div className="max-w-4xl mx-auto py-8 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[hsl(160_70%_50%)] opacity-15 blur-[120px]" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-semibold ring-1 ring-[hsl(160_70%_50%)]/20 mb-4">
              <Eraser className="w-3 h-3 text-[hsl(160_70%_50%)]" />
              {t("erase.tag")}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{t("erase.title")}</h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">{t("erase.subtitle")}</p>
          </div>

          {!originalUrl && (
            <button
              onClick={() => fileRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={cn(
                "w-full rounded-xl border-2 border-dashed bg-card p-12 text-center transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <div className="font-semibold mb-1">{t("erase.dropZone")}</div>
              <div className="text-xs text-muted-foreground">{t("erase.dropHint")}</div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </button>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive my-4">
              {error}
            </div>
          )}

          {originalUrl && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <h2 className="text-sm font-semibold mb-3">{t("erase.original")}</h2>
                  <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-secondary flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={originalUrl} alt="Original" className="max-w-full max-h-full object-contain" />
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold">{t("erase.result")}</h2>
                    {resultUrl && (
                      <button
                        onClick={downloadResult}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      >
                        <Download className="w-3 h-3" />
                        PNG
                      </button>
                    )}
                  </div>
                  <div
                    className="relative w-full aspect-square overflow-hidden rounded-lg flex items-center justify-center"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)",
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0, 0 10px, 10px -10px, 10px 0",
                    }}
                  >
                    {resultUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resultUrl} alt="Result" className="max-w-full max-h-full object-contain" />
                    ) : processing ? (
                      <div className="text-center text-white">
                        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                        <div className="text-xs font-medium">{t("erase.processing")}</div>
                        {progress > 0 && (
                          <div className="text-xs mt-1 opacity-80">{progress}%</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-white/60">{t("erase.willAppear")}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={removeBackground}
                  disabled={processing}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eraser className="w-4 h-4" />}
                  {processing ? t("erase.processing") : t("erase.run")}
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2.5 rounded-lg bg-secondary hover:bg-muted transition-colors flex items-center gap-1 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("erase.clear")}
                </button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground text-center">
                {t("erase.privacy")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
