import { useState } from "react";
import { ArrowUpRight, ArrowUp, RefreshCw } from "lucide-react";
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
  const { t } = useT();

  // External prompt injection from Gallery card click
  if (externalPrompt && externalPrompt !== input) {
    setInput(externalPrompt);
  }

  const updateSuggestions = () => {
    setSuggestions(getRandomSuggestions());
  };
  const handleSuggestionSelect = (prompt: string) => {
    setInput(prompt);
    onSubmit(prompt);
  };

  const handleSubmit = () => {
    if (!isLoading && input.trim()) {
      onSubmit(input);
    }
  };

  // const handleRefreshSuggestions = () => {
  //   setCurrentSuggestions(getRandomSuggestions());
  // };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSubmit(input);
      }
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
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center justify-between space-x-2">
              <button
                onClick={updateSuggestions}
                className="flex items-center justify-between px-2 rounded-lg py-1 bg-secondary text-sm hover:bg-muted group transition-colors duration-200"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              </button>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionSelect(suggestion.prompt)}
                  className={cn(
                    "flex items-center justify-between px-2 rounded-lg py-1 bg-secondary text-sm hover:bg-muted group transition-colors duration-200",
                    index > 2
                      ? "hidden md:flex"
                      : index > 1
                        ? "hidden sm:flex"
                        : "",
                  )}
                >
                  <span>
                    <span className="text-foreground text-xs sm:text-sm">
                      {suggestion.text.toLowerCase()}
                    </span>
                  </span>
                  <ArrowUpRight className="ml-1 h-2 w-2 sm:h-3 sm:w-3 text-muted-foreground group-hover:text-foreground" />
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity shadow-[0_0_15px_hsl(347_99%_58%/0.4)]"
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
  );
}
