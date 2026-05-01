"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { UserBadge } from "@/components/UserBadge";

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

export const Header = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useT();

  const NAV_ITEMS = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/editor", label: t("nav.editor") },
    { href: "/video", label: t("nav.video") },
    { href: "/pricing", label: t("nav.pricing") },
    { href: "/tools", label: t("nav.tools") },
  ];

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
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 text-sm shrink-0">
          <LanguageSwitcher />
          <UserBadge />

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
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
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
