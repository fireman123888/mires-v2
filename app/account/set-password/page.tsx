"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Check } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/components/I18nProvider";

export default function SetPasswordPage() {
  const router = useRouter();
  const { t } = useT();
  const { data: session, isPending } = useSession();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  if (isPending || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const r = await fetch("/api/account/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(t("setPassword.error").replace("{e}", d.error || `HTTP ${r.status}`));
        setSubmitting(false);
        return;
      }
      setDone(true);
      setSubmitting(false);
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
              {done ? t("setPassword.success") : t("setPassword.title")}
            </h1>
            <p className="mt-3 text-muted-foreground text-sm">
              {done
                ? t("setPassword.successBody")
                : t("setPassword.subtitle").replace("{email}", session.user.email)}
            </p>
          </div>

          {done ? (
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4 shadow-[0_0_30px_-15px_hsl(347_99%_58%/0.4)]">
              <Check className="w-10 h-10 text-emerald-500 mx-auto" />
              <Link
                href="/"
                className="block w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90"
              >
                {t("setPassword.done")}
              </Link>
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
                disabled={submitting || newPassword.length < 8 || confirm.length < 8}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Spinner className="w-4 h-4" /> : null}
                {submitting ? t("setPassword.submitting") : t("setPassword.submit")}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("signin.back")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
