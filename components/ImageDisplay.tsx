import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Download, ImageIcon, AlertCircle, Maximize2, Loader2 } from "lucide-react";
import { Stopwatch } from "./Stopwatch";
import { cn } from "@/lib/utils";
import { imageHelpers } from "@/lib/image-helpers";
import { ProviderTiming } from "@/lib/image-types";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface ImageDisplayProps {
  provider: string;
  image: string | null | undefined;
  timing?: ProviderTiming;
  failed?: boolean;
  fallbackIcon?: React.ReactNode;
  enabled?: boolean;
  modelId: string;
  prompt?: string;
}

export function ImageDisplay({
  provider,
  image,
  timing,
  failed,
  fallbackIcon,
  modelId,
  prompt,
}: ImageDisplayProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [upscaling, setUpscaling] = useState(false);

  const handleUpscale = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!prompt || upscaling) return;
    setUpscaling(true);
    try {
      const r = await fetch("/api/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: modelId }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.error === "credits_insufficient" || d.error === "login_required") {
          window.dispatchEvent(new CustomEvent("mires:credits-blocked", { detail: d.error === "login_required" ? "anon_daily_limit" : "credits_insufficient" }));
        }
        throw new Error(d.error || "upscale failed");
      }
      // Trigger download of the 2K version (re-encode as real PNG)
      await imageHelpers.downloadAsPng(d.image, `${provider}-2k`);
      // Refresh credits in header
      window.dispatchEvent(new Event("mires:credits-refresh"));
    } catch (err) {
      console.error("upscale error:", err);
    } finally {
      setUpscaling(false);
    }
  };

  useEffect(() => {
    if (isZoomed) {
      window.history.pushState({ zoomed: true }, "");
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isZoomed) {
        setIsZoomed(false);
      }
    };

    const handlePopState = () => {
      if (isZoomed) {
        setIsZoomed(false);
      }
    };

    if (isZoomed) {
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isZoomed]);

  const handleImageClick = (e: React.MouseEvent) => {
    if (image) {
      e.stopPropagation();
      setIsZoomed(true);
    }
  };

  const handleActionClick = (
    e: React.MouseEvent,
    imageData: string,
    provider: string,
  ) => {
    e.stopPropagation();
    imageHelpers.downloadAsPng(imageData, provider).catch((error) => {
      console.error("Failed to download image:", error);
    });
  };

  const isLoading = !image && !failed && !!timing?.startTime;
  return (
    <>
      <div
        className={cn(
          "relative w-full aspect-square group rounded-lg overflow-hidden bg-secondary/40 border border-border",
          image && !failed && "cursor-pointer",
        )}
        onClick={handleImageClick}
      >
        {/* Animated chromatic glow during loading — matches Douyin theme */}
        {isLoading && (
          <>
            <div className="absolute inset-0 -z-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] rounded-full bg-gradient-to-br from-[hsl(178_92%_56%)] via-transparent to-[hsl(347_99%_58%)] opacity-25 blur-3xl animate-pulse" />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.05)_50%,transparent_70%)] bg-[length:200%_100%] animate-[shimmer_2.5s_infinite_linear] pointer-events-none" />
          </>
        )}

        {(image || failed) && (
          <div className="absolute top-2 left-2 max-w-[75%] bg-black/60 backdrop-blur-md px-2 py-1 flex items-center gap-2 rounded-md ring-1 ring-white/10 z-10">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Label className="text-xs text-white/90 truncate min-w-0 grow">
                    {imageHelpers.formatModelId(modelId)}
                  </Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{modelId}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        {image && !failed ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${image}`}
              alt={`Generated by ${provider}`}
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute bottom-2 left-2 flex gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                onClick={(e) => handleActionClick(e, image, provider)}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              {prompt && (
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleUpscale}
                  disabled={upscaling}
                  title="Upscale to 2K (20 credits)"
                >
                  {upscaling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              )}
            </div>
            {timing?.elapsed && (
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1 shadow">
                <span className="text-xs text-white/90 font-medium">
                  {(timing.elapsed / 1000).toFixed(1)}s
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {failed ? (
              fallbackIcon || <AlertCircle className="h-8 w-8 text-red-500" />
            ) : timing?.startTime ? (
              <Stopwatch startTime={timing.startTime} />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            )}
          </div>
        )}
      </div>

      {isZoomed &&
        image &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center cursor-pointer min-h-[100dvh] w-screen"
            onClick={() => setIsZoomed(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${image}`}
              alt={`Generated by ${provider}`}
              className="max-h-[90dvh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
