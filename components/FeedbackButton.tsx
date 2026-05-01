"use client";

import { useEffect, useState } from "react";
import { Bug, Heart, Lightbulb, Loader2, MessageSquare, Send, Star, X } from "lucide-react";
import { useT } from "@/components/I18nProvider";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type FeedbackType = "bug" | "feature" | "general" | "praise";

const TYPE_OPTIONS: Array<{ id: FeedbackType; icon: React.ReactNode; labelKey: string }> = [
  { id: "bug", icon: <Bug className="w-4 h-4" />, labelKey: "feedback.type.bug" },
  { id: "feature", icon: <Lightbulb className="w-4 h-4" />, labelKey: "feedback.type.feature" },
  { id: "general", icon: <MessageSquare className="w-4 h-4" />, labelKey: "feedback.type.general" },
  { id: "praise", icon: <Heart className="w-4 h-4" />, labelKey: "feedback.type.praise" },
];

export function FeedbackButton() {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  // Don't render the floating button on admin pages — clutter
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHidden(window.location.pathname.startsWith("/admin"));
    }
  }, []);

  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("feedback.button")}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-full bg-card border border-border shadow-lg hover:shadow-[0_0_20px_-5px_hsl(178_92%_56%/0.4),0_0_20px_-5px_hsl(347_99%_58%/0.4)] hover:-translate-y-0.5 transition-all text-sm font-semibold"
      >
        <MessageSquare className="w-4 h-4 text-[hsl(178_92%_56%)]" />
        <span className="hidden sm:inline">{t("feedback.button")}</span>
      </button>

      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const { data: session } = useSession();

  const [type, setType] = useState<FeedbackType>("general");
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Pressing Escape closes the modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isLoggedIn = !!session?.user;
  const messageOk = message.trim().length >= 5;

  async function submit() {
    if (!messageOk || submitting) return;
    setSubmitting(true);
    setErr(null);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          rating: rating > 0 ? rating : undefined,
          message: message.trim(),
          email: email.trim() || undefined,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(t(`feedback.error.${data.error || "generic"}`) || `HTTP ${r.status}`);
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      setSubmitting(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[hsl(178_92%_56%)]" />
            {success ? t("feedback.success.title") : t("feedback.modal.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            aria-label="close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-5 text-sm space-y-4">
            <p className="text-muted-foreground leading-relaxed">{t("feedback.success.body")}</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[hsl(178_92%_56%)] to-[hsl(347_99%_58%)] text-white font-semibold text-sm hover:opacity-90"
            >
              {t("feedback.success.done")}
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Type tabs */}
            <div className="grid grid-cols-4 gap-1.5">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 rounded-lg text-[11px] font-semibold transition-colors",
                    type === opt.id
                      ? "bg-secondary text-foreground ring-1 ring-primary/40"
                      : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {opt.icon}
                  <span>{t(opt.labelKey)}</span>
                </button>
              ))}
            </div>

            {/* Star rating */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                {t("feedback.rating.label")}
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(rating === n ? 0 : n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${n} stars`}
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        "w-5 h-5 transition-colors",
                        n <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                {t("feedback.message.label")}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t(`feedback.message.placeholder.${type}`)}
                rows={5}
                maxLength={2000}
                className="w-full text-sm rounded-md bg-background border border-border px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="text-[10px] text-muted-foreground mt-0.5 text-right tabular-nums">
                {message.length} / 2000
              </div>
            </div>

            {/* Email (only if not logged in) */}
            {!isLoggedIn && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  {t("feedback.email.label")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("feedback.email.placeholder")}
                  className="w-full text-sm rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}

            {err && (
              <div className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{err}</div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-secondary text-foreground text-sm font-semibold hover:bg-muted disabled:opacity-50"
              >
                {t("feedback.cancel")}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting || !messageOk}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[hsl(178_92%_56%)] to-[hsl(347_99%_58%)] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {submitting ? t("feedback.submitting") : t("feedback.submit")}
              </button>
            </div>

            <p className="text-[10px] text-center text-muted-foreground">{t("feedback.footnote")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
