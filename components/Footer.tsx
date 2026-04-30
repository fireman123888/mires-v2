"use client";

import Link from "next/link";
import { Github, Twitter } from "lucide-react";
import { useT } from "@/components/I18nProvider";

const LinkColumn = ({ title, links }: { title: string; links: { href: string; label: string; external?: boolean }[] }) => (
  <div>
    <h4 className="font-semibold text-sm mb-3">{title}</h4>
    <ul className="space-y-2">
      {links.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            target={l.external ? "_blank" : undefined}
            rel={l.external ? "noopener noreferrer" : undefined}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export function Footer() {
  const { t } = useT();
  return (
    <footer className="mt-24 border-t border-border bg-card/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(178_92%_56%)] to-[hsl(347_99%_58%)] flex items-center justify-center text-white font-black text-sm">
                M
              </div>
              <span className="text-lg font-extrabold tracking-tight">Mires</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>
          </div>

          <LinkColumn
            title={t("footer.col1.title")}
            links={[
              { href: "/", label: t("footer.col1.l1") },
              { href: "/editor", label: t("footer.col1.l2") },
              { href: "/video", label: t("footer.col1.l3") },
              { href: "/tools", label: t("footer.col1.l4") },
            ]}
          />

          <LinkColumn
            title={t("footer.col2.title")}
            links={[
              { href: "/pricing", label: t("footer.col2.l1") },
              { href: "/signin", label: t("footer.col2.l2") },
              { href: "https://pollinations.ai", label: t("footer.col2.l3"), external: true },
            ]}
          />

          <LinkColumn
            title={t("footer.col3.title")}
            links={[
              { href: "https://github.com/fireman123888/mires-v2", label: "GitHub", external: true },
              { href: "mailto:noreply@mires.top", label: t("footer.col3.l2") },
            ]}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Mires · {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="https://github.com/fireman123888/mires-v2"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
