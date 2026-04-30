"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { useT } from "@/components/I18nProvider";
import { ImageIcon, Wand2, Film, Layers, Eraser, Type, Crop, Sparkles, Palette, ArrowRight } from "lucide-react";

export default function ToolsPage() {
  const { t } = useT();

  const TOOLS = [
    { icon: ImageIcon, key: "t1", href: "/", available: true },
    { icon: Wand2, key: "t2", href: "/editor", available: false },
    { icon: Film, key: "t3", href: "/video", available: false },
    { icon: Eraser, key: "t4", href: "/erase", available: true },
    { icon: Layers, key: "t5", href: "/", available: false },
    { icon: Crop, key: "t6", href: "/crop", available: true },
    { icon: Type, key: "t7", href: "/icon", available: true },
    { icon: Palette, key: "t8", href: "/style", available: true },
    { icon: Sparkles, key: "t9", href: "/optimizer", available: true },
  ];

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div className="text-center py-12 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(347_99%_58%)] opacity-15 blur-[120px]" />
            <div className="absolute top-1/2 right-1/3 translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(178_92%_56%)] opacity-10 blur-[120px]" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            {t("tools.title.before")}
            <span className="bg-gradient-to-r from-[hsl(178_92%_56%)] to-[hsl(347_99%_58%)] bg-clip-text text-transparent">
              {t("tools.title.highlight")}
            </span>
            {t("tools.title.after")}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("tools.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const Wrapper: React.ElementType = tool.href !== "#" ? Link : "div";
            const wrapperProps = tool.href !== "#" ? { href: tool.href } : {};
            const title = t(`tools.${tool.key}.title`);
            const desc = t(`tools.${tool.key}.desc`);
            return (
              <Wrapper
                key={tool.key}
                {...wrapperProps}
                className={
                  "group relative rounded-xl border p-5 sm:p-6 transition-all duration-300 " +
                  (tool.available
                    ? "border-border bg-card hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-[0_0_25px_-10px_hsl(347_99%_58%/0.5)]"
                    : tool.href !== "#"
                      ? "border-border bg-card hover:border-primary/30"
                      : "border-border/50 bg-card/50 cursor-not-allowed")
                }
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={
                      "p-2.5 rounded-lg shrink-0 " +
                      (tool.available
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground")
                    }
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg">{title}</h3>
                    {!tool.available && (
                      <span className="text-xs text-muted-foreground">{t("tools.comingSoonLabel")}</span>
                    )}
                  </div>
                  {tool.available && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </div>
  );
}
