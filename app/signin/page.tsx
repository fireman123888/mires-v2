"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/components/I18nProvider";

type Mode = "magic" | "password";

export default function SignInPage() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  );
}

function SignInInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const justVerified = searchParams.get("verified") === "1";
  const justReset = searchParams.get("reset") === "1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t("signin.emailRequired"));
      return;
    }
    if (mode === "password" && !password) {
      setError(t("signin.passwordRequired"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "magic") {
        const { error } = await authClient.signIn.magicLink({
          email: email.trim(),
          callbackURL: "/",
        });
        if (error) {
          setError(error.message || "Failed to send link");
          setSubmitting(false);
          return;
        }
        router.push(`/signin/sent?email=${encodeURIComponent(email.trim())}`);
      } else {
        const { error } = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: "/",
        });
        if (error) {
          setError(error.message || t("signin.password.error"));
          setSubmitting(false);
          return;
        }
        router.push("/");
        router.refresh();
      }
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[hsl(178_92%_56%)] opacity-10 blur-[120px]" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {t("signin.title")}
            </h1>
            <p className="mt-3 text-muted-foreground text-sm">
              {t("signin.subtitle")}
            </p>
          </div>

          {justVerified && (
            <div className="mb-4 text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/30 rounded-md px-3 py-2 text-center">
              ✓ {t("signin.verified")}
            </div>
          )}
          {justReset && (
            <div className="mb-4 text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/30 rounded-md px-3 py-2 text-center">
              ✓ {t("signin.passwordReset")}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-[0_0_30px_-15px_hsl(347_99%_58%/0.4)]"
          >
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted/40">
              <button
                type="button"
                onClick={() => { setMode("password"); setError(null); }}
                className={
                  "py-1.5 rounded-md text-xs font-semibold transition-colors " +
                  (mode === "password"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {t("signin.tab.password")}
              </button>
              <button
                type="button"
                onClick={() => { setMode("magic"); setError(null); }}
                className={
                  "py-1.5 rounded-md text-xs font-semibold transition-colors " +
                  (mode === "magic"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {t("signin.tab.magic")}
              </button>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-foreground">{t("signin.email")}</span>
              <div className="mt-2 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
            </label>

            {mode === "password" && (
              <label className="block">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-foreground">{t("signin.password")}</span>
                  <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    {t("signin.forgot")}
                  </Link>
                </div>
                <div className="mt-2 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
              </label>
            )}

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
              {submitting
                ? t("signin.sending")
                : mode === "password"
                ? t("signin.password.submit")
                : t("signin.submit")}
            </button>

            <p className="text-xs text-muted-foreground text-center pt-2">
              {mode === "password"
                ? <>{t("signup.noAccount")} <Link href="/signup" className="text-primary hover:underline">{t("signup.signUp")}</Link></>
                : t("signin.bonus")}
            </p>
          </form>

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
