"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Crop as CropIcon, Download, Trash2, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { useT } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";

const RATIOS = [
  { id: "1x1", label: "1:1", w: 1080, h: 1080, hint: "Instagram / 头像" },
  { id: "9x16", label: "9:16", w: 1080, h: 1920, hint: "抖音 / 小红书 / Reels" },
  { id: "16x9", label: "16:9", w: 1920, h: 1080, hint: "YouTube / 横屏" },
  { id: "4x5", label: "4:5", w: 1080, h: 1350, hint: "IG 竖图" },
];

interface CropResult {
  ratioId: string;
  dataUrl: string;
}

export default function CropPage() {
  const { t } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);
  const [results, setResults] = useState<CropResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const loadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(t("crop.notImage"));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError(t("crop.tooBig"));
      return;
    }
    setError(null);
    setResults([]);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setOriginalImg(img);
    img.onerror = () => setError(t("crop.loadFailed"));
    img.src = url;
  }, [t]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadImage(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) loadImage(f);
  };

  const handleClear = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(null);
    setOriginalImg(null);
    setResults([]);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const cropAll = useCallback(async () => {
    if (!originalImg) return;
    setProcessing(true);
    setError(null);
    setResults([]);
    try {
      // Lazy-load smartcrop only when user actually crops (saves bundle on first load).
      const smartcrop = (await import("smartcrop")).default as unknown as {
        crop: (img: HTMLImageElement, opts: { width: number; height: number }) => Promise<{
          topCrop: { x: number; y: number; width: number; height: number };
        }>;
      };

      const out: CropResult[] = [];
      for (const r of RATIOS) {
        // smartcrop's analysis works in source-image pixel space
        const result = await smartcrop.crop(originalImg, { width: r.w, height: r.h });
        const c = result.topCrop;

        // Render the chosen rectangle, scaled to the target output size.
        const canvas = document.createElement("canvas");
        canvas.width = r.w;
        canvas.height = r.h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(originalImg, c.x, c.y, c.width, c.height, 0, 0, r.w, r.h);
        out.push({ ratioId: r.id, dataUrl: canvas.toDataURL("image/jpeg", 0.92) });
      }
      setResults(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setProcessing(false);
    }
  }, [originalImg]);

  const downloadOne = (dataUrl: string, ratioId: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `mires-crop-${ratioId}.jpg`;
    a.click();
  };

  const downloadAll = () => {
    results.forEach((r, i) => {
      // small stagger so the browser doesn't squash multiple downloads
      setTimeout(() => downloadOne(r.dataUrl, r.ratioId), i * 200);
    });
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <div className="max-w-4xl mx-auto py-8 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[hsl(40_90%_60%)] opacity-15 blur-[120px]" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-semibold ring-1 ring-[hsl(40_90%_60%)]/20 mb-4">
              <CropIcon className="w-3 h-3 text-[hsl(40_90%_60%)]" />
              {t("crop.tag")}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{t("crop.title")}</h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">{t("crop.subtitle")}</p>
          </div>

          {/* Upload zone */}
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
              <div className="font-semibold mb-1">{t("crop.dropZone")}</div>
              <div className="text-xs text-muted-foreground">{t("crop.dropHint")}</div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </button>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive my-4">
              {error}
            </div>
          )}

          {/* Original preview + actions */}
          {originalUrl && (
            <>
              <div className="bg-card border border-border rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold">{t("crop.original")}</h2>
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary hover:bg-muted transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    {t("crop.clear")}
                  </button>
                </div>
                <div className="relative w-full max-h-[400px] overflow-hidden rounded-lg bg-secondary flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={originalUrl} alt="Original" className="max-w-full max-h-[400px] object-contain" />
                </div>
              </div>

              <button
                onClick={cropAll}
                disabled={!originalImg || processing}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-6"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CropIcon className="w-4 h-4" />}
                {processing ? t("crop.processing") : t("crop.cropAll")}
              </button>
            </>
          )}

          {/* Results */}
          {results.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">{t("crop.results")}</h2>
                <button
                  onClick={downloadAll}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Download className="w-3 h-3" />
                  {t("crop.downloadAll")}
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {results.map((r) => {
                  const meta = RATIOS.find((x) => x.id === r.ratioId)!;
                  return (
                    <div key={r.ratioId} className="rounded-xl bg-card border border-border overflow-hidden group">
                      <div
                        className="relative bg-secondary"
                        style={{ aspectRatio: `${meta.w} / ${meta.h}` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.dataUrl} alt={meta.label} className="absolute inset-0 w-full h-full object-cover" />
                        <button
                          onClick={() => downloadOne(r.dataUrl, r.ratioId)}
                          className="absolute bottom-2 right-2 p-1.5 rounded-md bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="px-3 py-2">
                        <div className="font-bold text-sm">{meta.label}</div>
                        <div className="text-[10px] text-muted-foreground">{meta.hint}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
