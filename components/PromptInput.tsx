import { useRef, useState } from "react";
import { ArrowUpRight, ArrowUp, RefreshCw, Sparkles, Volume2, Square } from "lucide-react";
import { getRandomSuggestions, Suggestion } from "@/lib/suggestions";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useT } from "@/components/I18nProvider";

type QualityMode = "performance" | "quality";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
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
}: PromptInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initSuggestions);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { t } = useT();

  if (externalPrompt && externalPrompt !== input) {
    setInput(externalPrompt);
  }

  const updateSuggestions = () => setSuggestions(getRandomSuggestions());

  const handleSuggestionSelect = (prompt: string) => {
    setInput(prompt);
    onSubmit(prompt);
  };

  const handleSubmit = () => {
    if (!isLoading && input.trim()) onSubmit(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) onSubmit(input);
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

  const stopSpeak = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const handleSpeak = async () => {
    if (!input.trim()) return;
    if (isSpeaking) {
      stopSpeak();
      return;
    }
    setIsSpeaking(true);
    try {
      const resp = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim(), voice: "nova" }),
      });
      if (!resp.ok) throw new Error(`TTS ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
        audioRef.current = null;
      };
      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      setIsSpeaking(false);
    }
  };

  return (
    <div id="prompt-input" className="w-full mb-8">
      <div className="bg-card border border-border rounded-xl p-4 shadow-[0_0_30px_-15px_hsl(347_99%_58%/0.4),0_0_30px_-15px_hsl(178_92%_56%/0.3)]">
        <div className="flex flex-col gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("prompt.placeholder")}
            rows={3}
            className="text-base bg-transparent border-none p-0 resize-none placeholder:text-muted-foreground text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          {/* Action row: optimize + tts on left, suggestions on right, submit at far right */}
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleOptimize}
                disabled={!input.trim() || isOptimizing}
                title={t("prompt.optimize.tooltip")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-xs sm:text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {isOptimizing ? (
                  <Spinner className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[hsl(178_92%_56%)]" />
                )}
                <span>{isOptimizing ? t("prompt.optimizing") : t("prompt.optimize")}</span>
              </button>

              <button
                type="button"
                onClick={handleSpeak}
                disabled={!input.trim()}
                title={t("prompt.tts.tooltip")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-xs sm:text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {isSpeaking ? (
                  <Square className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[hsl(178_92%_56%)]" />
                )}
                <span>{t("prompt.tts")}</span>
              </button>

              <button
                type="button"
                onClick={updateSuggestions}
                className="flex items-center px-2 rounded-lg py-1 bg-secondary text-sm hover:bg-muted group transition-colors duration-200"
              >
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion.prompt)}
                  className={cn(
                    "flex items-center px-2 rounded-lg py-1 bg-secondary/60 text-xs sm:text-sm hover:bg-muted group transition-colors",
                    index > 1 ? "hidden sm:flex" : "",
                  )}
                >
                  <span className="text-muted-foreground group-hover:text-foreground text-xs">
                    {suggestion.text.toLowerCase()}
                  </span>
                  <ArrowUpRight className="ml-1 h-3 w-3 text-muted-foreground" />
                </button>
              ))}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity shadow-[0_0_15px_hsl(347_99%_58%/0.4)] ml-1"
              >
                {isLoading ? (
                  <Spinner className="w-3 h-3" />
                ) : (
                  <ArrowUp className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
