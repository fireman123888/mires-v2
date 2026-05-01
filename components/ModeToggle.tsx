"use client";

import { Infinity as InfinityIcon, Sparkles } from "lucide-react";
import { ModelMode } from "@/lib/provider-config";
import { useT } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  mode: ModelMode;
  onChange: (mode: ModelMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const { t } = useT();

  return (
    <div className="w-full mb-3 flex justify-center">
      <div className="inline-flex items-stretch gap-1 p-1 rounded-2xl bg-card border border-border shadow-[0_0_30px_-15px_hsl(178_92%_56%/0.4)]">
        <Pill
          active={mode === "performance"}
          onClick={() => onChange("performance")}
          icon={<InfinityIcon className="w-3.5 h-3.5" />}
          title={t("hero.mode.free")}
          hint={t("hero.mode.freeHint")}
          accent="from-emerald-400 to-cyan-400"
        />
        <Pill
          active={mode === "quality"}
          onClick={() => onChange("quality")}
          icon={<Sparkles className="w-3.5 h-3.5" />}
          title={t("hero.mode.premium")}
          hint={t("hero.mode.premiumHint")}
          accent="from-amber-400 to-yellow-500"
        />
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  icon,
  title,
  hint,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative px-4 sm:px-5 py-2 rounded-xl text-left transition-all duration-200",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-1.5 text-sm font-bold leading-tight">
        <span
          className={cn(
            "p-1 rounded-md bg-gradient-to-r text-black",
            accent,
            !active && "opacity-60"
          )}
        >
          {icon}
        </span>
        {title}
      </div>
      <div className="text-[10px] mt-0.5 text-muted-foreground/80 leading-tight whitespace-nowrap">
        {hint}
      </div>
    </button>
  );
}
