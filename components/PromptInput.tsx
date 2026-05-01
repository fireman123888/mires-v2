"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ImagePlus,
  RefreshCw,
  Shuffle,
  Sparkles,
  Zap,
} from "lucide-react";
import { getRandomSuggestions, Suggestion } from "@/lib/suggestions";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useT } from "@/components/I18nProvider";
import { AspectRatio } from "@/lib/api-types";
import {
  ASPECT_PRESETS,
  COLOR_PRESETS,
  COMPOSITION_PRESETS,
  LIGHTING_PRESETS,
  Preset,
  STYLE_PRESETS,
  buildPrompt,
} from "@/lib/prompt-presets";

type QualityMode = "performance" | "quality";

export interface SubmitPayload {
  prompt: string;
  aspectRatio: AspectRatio;
  negativePrompt: string;
}

interface PromptInputProps {
  onSubmit: (payload: SubmitPayload) => void;
  isLoading?: boolean;
  showProviders: boolean;
  onToggleProviders: () => void;
  mode: QualityMode;
  onModeChange: (mode: QualityMode) => void;
  suggestions: Suggestion[];
  externalPrompt?: string;
}

export function PromptInput({
  suggestions: initSuggestions,
  isLoading,
  onSubmit,
  externalPrompt,
  mode,
  onModeChange,
}: PromptInputProps) {
  const { t } = useT();
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initSuggestions);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Raphael-style controls
  const [aspect, setAspect] = useState<AspectRatio>("1:1");
  const [stylePreset, setStylePreset] = useState<Preset>(STYLE_PRESETS[0]);
  const [colorPreset, setColorPreset] = useState<Preset>(COLOR_PRESETS[0]);
  const [lightingPreset, setLightingPreset] = useState<Preset>(LIGHTING_PRESETS[0]);
  const [compositionPreset, setCompositionPreset] = useState<Preset>(COMPOSITION_PRESETS[0]);
  const [showNegative, setShowNegative] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [uploadHint, setUploadHint] = useState<string | null>(null);

  if (externalPrompt && externalPrompt !== input) {
    setInput(externalPrompt);
  }

  const updateSuggestions = () => setSuggestions(getRandomSuggestions());

  const buildAndSubmit = (raw: string) => {
    if (!raw.trim() || isLoading) return;
    const finalPrompt = buildPrompt(raw, [
      stylePreset.suffix,
      colorPreset.suffix,
      lightingPreset.suffix,
      compositionPreset.suffix,
    ]);
    onSubmit({
      prompt: finalPrompt,
      aspectRatio: aspect,
      negativePrompt: showNegative ? negativePrompt.trim() : "",
    });
  };

  const handleSuggestionSelect = (prompt: string) => {
    setInput(prompt);
    buildAndSubmit(prompt);
  };

  const handleSubmit = () => buildAndSubmit(input);

  const handleRandom = () => {
    const all = getRandomSuggestions();
    if (all.length === 0) return;
    const pick = all[Math.floor(Math.random() * all.length)];
    setInput(pick.prompt);
    setSuggestions(all);
  };

  const handleClear = () => {
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      buildAndSubmit(input);
    }
  };

  const handleOptimize = async () => {
    if (!input.trim() || isOptimizing) return;
    setIsOptimizing(true);
    try {
      const resp = await fetch("/api/optimize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input.trim() }),
      });
      const data = await resp.json();
      if (resp.ok && data.optimized) {
        setInput(data.optimized);
      } else {
        console.error("Optimize failed:", data);
      }
    } catch (err) {
      console.error("Optimize error:", err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleUploadClick = () => {
    setUploadHint(t("prompt.upload.comingSoon"));
    window.setTimeout(() => setUploadHint(null), 2400);
  };

  // 4 panels generated in parallel. Free mode: 4×4 = 16 credits.
  // Premium mode: 3 Pollinations panels (4 each) + 1 Nano Banana (12) = 24.
  const creditCost = mode === "quality" ? 24 : 16;

  return (
    <div id="prompt-input" className="w-full mb-8">
      {/* Section title */}
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">
        {t("prompt.sectionTitle")}
      </h2>

      {/* Main input card */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_-15px_hsl(347_99%_58%/0.4),0_0_30px_-15px_hsl(178_92%_56%/0.3)]">
        <div className="flex gap-4">
          {/* Image upload placeholder (left) */}
          <button
            type="button"
            onClick={handleUploadClick}
            title={t("prompt.upload.tooltip")}
            className="shrink-0 w-24 h-32 sm:w-28 sm:h-36 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-background/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors group relative"
          >
            <ImagePlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
            {uploadHint && (
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-foreground text-background text-[10px] whitespace-nowrap shadow-lg">
                {uploadHint}
              </span>
            )}
          </button>

          {/* Textarea (right) */}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("prompt.placeholder")}
            className="flex-1 min-h-32 sm:min-h-36 text-base bg-transparent border-none p-0 resize-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {/* Optional negative prompt textarea */}
        {showNegative && (
          <div className="mt-3 pt-3 border-t border-border/60">
            <Textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder={t("prompt.negativePrompt.placeholder")}
              rows={2}
              className="w-full text-sm bg-background/40 rounded-md px-3 py-2 resize-none border border-border/60 placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50"
            />
          </div>
        )}

        {/* Bottom chips row */}
        <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
          <AspectChip value={aspect} onChange={setAspect} />
          <PresetChip
            presets={STYLE_PRESETS}
            value={stylePreset}
            onChange={setStylePreset}
            t={t}
          />
          <PresetChip
            presets={COLOR_PRESETS}
            value={colorPreset}
            onChange={setColorPreset}
            t={t}
          />
          <PresetChip
            presets={LIGHTING_PRESETS}
            value={lightingPreset}
            onChange={setLightingPreset}
            t={t}
          />
          <PresetChip
            presets={COMPOSITION_PRESETS}
            value={compositionPreset}
            onChange={setCompositionPreset}
            t={t}
          />
        </div>
      </div>

      {/* Footer toolbar (outside card) */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: model selector + toggles */}
        <div className="flex items-center gap-3 flex-wrap">
          <ModelSelector mode={mode} onChange={onModeChange} t={t} />
          <ToggleSwitch
            on={mode === "quality"}
            onClick={() => onModeChange(mode === "quality" ? "performance" : "quality")}
            icon={<Zap className="w-3 h-3" />}
            label={t("prompt.fastMode")}
            activeColor="from-amber-400 to-yellow-500"
          />
          <ToggleSwitch
            on={showNegative}
            onClick={() => setShowNegative(!showNegative)}
            label={t("prompt.negativePrompt")}
            activeColor="from-cyan-400 to-blue-500"
          />
          <button
            type="button"
            onClick={handleOptimize}
            disabled={!input.trim() || isOptimizing}
            title={t("prompt.optimize.tooltip")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {isOptimizing ? (
              <Spinner className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[hsl(178_92%_56%)]" />
            )}
            <span>{isOptimizing ? t("prompt.optimizing") : t("prompt.optimize")}</span>
          </button>
        </div>

        {/* Right: Clear / Random / Generate */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={handleClear}
            disabled={!input}
            className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 px-2 py-1.5 transition-colors"
          >
            {t("prompt.clear")}
          </button>
          <button
            type="button"
            onClick={handleRandom}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1.5 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            {t("prompt.random")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="relative px-5 sm:px-6 py-2 rounded-lg bg-gradient-to-r from-[hsl(178_92%_56%)] via-[hsl(290_70%_60%)] to-[hsl(347_99%_58%)] text-white text-sm font-bold shadow-[0_0_20px_-5px_hsl(347_99%_58%/0.6),0_0_20px_-5px_hsl(178_92%_56%/0.5)] hover:opacity-95 hover:shadow-[0_0_24px_-3px_hsl(347_99%_58%/0.7),0_0_24px_-3px_hsl(178_92%_56%/0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span className="flex items-center gap-1.5">
              {isLoading ? (
                <>
                  <Spinner className="w-3.5 h-3.5" />
                  {t("prompt.generating")}
                </>
              ) : (
                t("prompt.generate")
              )}
            </span>
            <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
              {creditCost}
            </span>
          </button>
        </div>
      </div>

      {/* Suggestion pills (kept, optional row below) */}
      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={updateSuggestions}
          className="flex items-center px-2 rounded-lg py-1 bg-secondary text-xs hover:bg-muted group transition-colors"
          title={t("prompt.random")}
        >
          <RefreshCw className="w-3 h-3 text-muted-foreground" />
        </button>
        {suggestions.slice(0, 4).map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSuggestionSelect(s.prompt)}
            className={cn(
              "flex items-center px-2 rounded-lg py-1 bg-secondary/60 text-xs hover:bg-muted group transition-colors",
              i > 1 ? "hidden sm:flex" : ""
            )}
          >
            <span className="text-muted-foreground group-hover:text-foreground">
              {s.text.toLowerCase()}
            </span>
            <ArrowUpRight className="ml-1 h-3 w-3 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────

function AspectChip({
  value,
  onChange,
}: {
  value: AspectRatio;
  onChange: (v: AspectRatio) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-xs font-medium hover:bg-muted transition-colors"
      >
        <span className="w-3 h-3 rounded-sm border border-current opacity-70" />
        {value}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 left-0 min-w-24 bg-card border border-border rounded-lg shadow-lg p-1">
          {ASPECT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(p.id);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-2.5 py-1 rounded-md text-xs hover:bg-muted flex items-center justify-between",
                value === p.id && "bg-muted/60"
              )}
            >
              {p.label}
              {value === p.id && <Check className="w-3 h-3 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PresetChip({
  presets,
  value,
  onChange,
  t,
}: {
  presets: Preset[];
  value: Preset;
  onChange: (p: Preset) => void;
  t: (key: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false));
  const showLabel = (p: Preset) => (p.labelKey === "@" ? p.literalLabel ?? p.id : t(p.labelKey));
  const isActive = value.suffix.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
          isActive
            ? "bg-primary/15 text-primary border border-primary/30"
            : "bg-secondary hover:bg-muted text-foreground"
        )}
      >
        {showLabel(value)}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 left-0 min-w-40 bg-card border border-border rounded-lg shadow-lg p-1 max-h-64 overflow-y-auto">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-2.5 py-1 rounded-md text-xs hover:bg-muted flex items-center justify-between",
                value.id === p.id && "bg-muted/60"
              )}
            >
              <span>{showLabel(p)}</span>
              {value.id === p.id && <Check className="w-3 h-3 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({
  on,
  onClick,
  icon,
  label,
  activeColor,
}: {
  on: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 group"
    >
      <span
        className={cn(
          "relative w-8 h-4 rounded-full transition-colors",
          on ? `bg-gradient-to-r ${activeColor}` : "bg-secondary"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-3 h-3 rounded-full bg-background shadow transition-all",
            on ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        {icon}
        {label}
      </span>
    </button>
  );
}

function ModelSelector({
  mode,
  onChange,
  t,
}: {
  mode: QualityMode;
  onChange: (m: QualityMode) => void;
  t: (key: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false));

  const current = mode === "quality" ? t("hero.mode.premium") : t("hero.mode.free");
  const dotClass =
    mode === "quality"
      ? "bg-gradient-to-br from-amber-400 to-yellow-500"
      : "bg-gradient-to-br from-cyan-400 to-blue-500";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-secondary hover:bg-muted text-sm font-semibold transition-colors"
      >
        <span className={cn("w-5 h-5 rounded-full", dotClass)} />
        <span>{current}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute z-20 bottom-full mb-1 left-0 min-w-52 bg-card border border-border rounded-lg shadow-lg p-1">
          <ModelOption
            label={t("hero.mode.free")}
            hint={t("hero.mode.freeHint")}
            dotClass="bg-gradient-to-br from-cyan-400 to-blue-500"
            active={mode === "performance"}
            onClick={() => {
              onChange("performance");
              setOpen(false);
            }}
          />
          <ModelOption
            label={t("hero.mode.premium")}
            hint={t("hero.mode.premiumHint")}
            dotClass="bg-gradient-to-br from-amber-400 to-yellow-500"
            active={mode === "quality"}
            onClick={() => {
              onChange("quality");
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function ModelOption({
  label,
  hint,
  dotClass,
  active,
  onClick,
}: {
  label: string;
  hint: string;
  dotClass: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-2 py-1.5 rounded-md hover:bg-muted flex items-center gap-2",
        active && "bg-muted/60"
      )}
    >
      <span className={cn("w-5 h-5 rounded-full shrink-0", dotClass)} />
      <span className="flex-1 leading-tight">
        <span className="block text-xs font-bold">{label}</span>
        <span className="block text-[10px] text-muted-foreground">{hint}</span>
      </span>
      {active && <Check className="w-3.5 h-3.5 text-primary" />}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────
// Hooks
// ────────────────────────────────────────────────────────────────────

function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void
) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [ref, handler]);
}
