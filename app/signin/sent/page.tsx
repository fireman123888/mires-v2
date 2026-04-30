"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { useT } from "@/components/I18nProvider";

function Content() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const { t } = useT();
  return (
    <div className="max-w-md mx-auto py-16 sm:py-24 text-center relative">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[hsl(178_92%_56%)] opacity-15 blur-[120px]" />
      </div>

      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(178_92%_56%)]/10 ring-1 ring-[hsl(178_92%_56%)]/30 mb-6">
        <MailCheck className="w-7 h-7 text-[hsl(178_92%_56%)]" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
        {t("signin.sent.title")}
      </h1>

      <p className="mt-4 text-muted-foreground">
        {t("signin.sent.body").replace("{email}", email)}
      </p>

      <p className="mt-6 text-xs text-muted-foreground">
        {t("signin.sent.spam")}
      </p>

      <Link href="/signin" className="inline-flex items-center gap-1 mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        {t("signin.sent.back")}
      </Link>
    </div>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <Suspense fallback={null}>
          <Content />
        </Suspense>
      </div>
    </div>
  );
}
