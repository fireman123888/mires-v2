"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/I18nProvider";

const QUESTION_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"];

export function FAQ() {
  const { t } = useT();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="mt-20 mb-12 max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-semibold ring-1 ring-[hsl(178_92%_56%)]/20 mb-4">
          <HelpCircle className="w-3 h-3 text-[hsl(178_92%_56%)]" />
          FAQ
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{t("faq.title")}</h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground">{t("faq.subtitle")}</p>
      </div>

      <div className="space-y-2">
        {QUESTION_KEYS.map((qk, idx) => {
          const open = openIdx === idx;
          return (
            <div
              key={qk}
              className={cn(
                "rounded-xl border bg-card transition-colors",
                open ? "border-primary/40" : "border-border"
              )}
            >
              <button
                onClick={() => setOpenIdx(open ? null : idx)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-semibold text-sm sm:text-base">{t(`faq.${qk}.q`)}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300",
                    open && "rotate-180 text-primary"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {t(`faq.${qk}.a`)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
