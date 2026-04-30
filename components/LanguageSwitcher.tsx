"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { LOCALES, LOCALE_LABELS, Locale } from "@/lib/messages";
import { useT } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale } = useT();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        aria-label="Switch language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[140px] rounded-lg bg-card border border-border shadow-lg p-1 z-50">
          {LOCALES.map((loc) => {
            const active = loc === locale;
            return (
              <button
                key={loc}
                onClick={() => {
                  setLocale(loc as Locale);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <span>{LOCALE_LABELS[loc]}</span>
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
