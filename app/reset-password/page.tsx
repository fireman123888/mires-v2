"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/components/I18nProvider";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetInner />
    </Suspense>
  );
}

function ResetInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError(t("reset.invalidLink"));
      return;
    }
    if (newPassword !== confirm) {
      setError(t("setPassword.mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("setPassword.tooShort"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, token }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.message || d.error || t("reset.error"));
        setSubmitting(false);
        return;
      }
      setDone(true);
      setSubmitting(false);
      setTimeout(() => router.push("/signin?reset=1"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div className="max-w-md mx-auto py-12 sm:py-20 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[hsl(347_99%_58%)] opacity-15 blur-[120px]" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {done ? t("reset.success") : t("reset.title")}
            </h1>
            <p className="mt-3 text-muted-foreground text-sm">
              {done ? t("reset.successBody") : t("reset.subtitle")}
            </p>
          </div>

          {done ? (
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3 shadow-[0_0_30px_-15px_hsl(347_99%_58%/0.4)]">
              <Check className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm text-muted-foreground">{t("reset.redirecting")}</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-[0_0_30px_-15px_hsl(347_99%_58%/0.4)]"
            >
              <label className="block">
                <span className="text-sm font-medium text-foreground">{t("setPassword.newPassword")}</span>
                <div className="mt-2 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t("setPassword.hint")}</p>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">{t("setPassword.confirm")}</span>
                <div className="mt-2 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
              </label>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Spinner className="w-4 h-4" /> : null}
                {submitting ? t("setPassword.submitting") : t("reset.submit")}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("signin.back")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
