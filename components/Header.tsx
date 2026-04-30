"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const Logo = ({ size = 30 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <text x="9" y="24" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" fill="hsl(178 92% 56%)" opacity="0.9">M</text>
    <text x="11" y="24" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" fill="hsl(347 99% 58%)" opacity="0.9">M</text>
    <text x="10" y="24" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" fill="white">M</text>
  </svg>
);

const NAV_ITEMS = [
  { href: "/editor", label: "AI 图像编辑器" },
  { href: "/video", label: "AI 视频生成器" },
  { href: "/pricing", label: "定价" },
  { href: "/tools", label: "AI 工具页面" },
];

export const Header = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="mb-6 relative z-20">
      <div className="mx-auto flex justify-between items-center gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Logo />
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            Mires
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3 text-sm shrink-0">
          <Link
            href="https://github.com/fireman123888/mires-v2"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-md hover:bg-secondary transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav className="md:hidden mt-3 p-2 rounded-lg bg-card border border-border flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="https://github.com/fireman123888/mires-v2"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          >
            GitHub
          </Link>
        </nav>
      )}
    </header>
  );
};
