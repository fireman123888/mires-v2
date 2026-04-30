"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/components/I18nProvider";

export default function SignInPage() {
  const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
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

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-[0_0_30px_-15px_hsl(347_99%_58%/0.4)]">
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

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !email.trim()}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Spinner className="w-4 h-4" /> : null}
              {submitting ? t("signin.sending") : t("signin.submit")}
            </button>

            <p className="text-xs text-muted-foreground text-center pt-2">
              {t("signin.bonus")}
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
