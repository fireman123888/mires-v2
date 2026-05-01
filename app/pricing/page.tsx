"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Check, Coins, Loader2, X, Upload, Crown, Sparkles } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { Header } from "@/components/Header";
import { useT } from "@/components/I18nProvider";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PLANS, type Plan, formatCny } from "@/lib/plans";

type Cadence = "monthly" | "yearly";

export default function PricingPage() {
  const { t } = useT();
  const { data: session } = useSession();
  const router = useRouter();
  const [cadence, setCadence] = useState<Cadence>("yearly");
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [showPacks, setShowPacks] = useState(false);

  const tiers: Array<{
    tier: "free" | "pro" | "ultimate";
    monthlyId?: string;
    yearlyId?: string;
    icon?: React.ReactNode;
    highlight?: boolean;
  }> = [
    { tier: "free" },
    {
      tier: "pro",
      monthlyId: "pro-monthly",
      yearlyId: "pro-yearly",
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      tier: "ultimate",
      monthlyId: "ultimate-monthly",
      yearlyId: "ultimate-yearly",
      icon: <Crown className="w-4 h-4" />,
      highlight: true,
    },
  ];

  const handleUpgrade = (tier: "pro" | "ultimate") => {
    if (!session?.user) {
      router.push("/signin");
      return;
    }
    const planId = cadence === "monthly" ? `${tier}-monthly` : `${tier}-yearly`;
    setActivePlan(PLANS[planId]);
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div className="text-center py-10 sm:py-14 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(347_99%_58%)] opacity-15 blur-[120px]" />
            <div className="absolute top-1/2 right-1/3 translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(178_92%_56%)] opacity-10 blur-[120px]" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            {t("pricing.title.before")}
            <span className="bg-gradient-to-r from-[hsl(178_92%_56%)] to-[hsl(347_99%_58%)] bg-clip-text text-transparent">
              {t("pricing.title.highlight")}
            </span>
            {t("pricing.title.after")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-xl mx-auto">
            {t("pricing.subtitle")}
          </p>

          {/* Monthly / yearly toggle */}
          <div className="mt-6 inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCadence("monthly")}
              className={
                "px-4 py-1.5 rounded-md text-sm font-semibold transition-colors " +
                (cadence === "monthly"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {t("pricing.cadence.monthly")}
            </button>
            <button
              type="button"
              onClick={() => setCadence("yearly")}
              className={
                "px-4 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 " +
                (cadence === "yearly"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {t("pricing.cadence.yearly")}
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/15 text-primary font-bold">
                {t("pricing.cadence.save")}
              </span>
            </button>
          </div>
        </div>

        {/* 3 plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {tiers.map((row) => {
            const planId = cadence === "monthly" ? row.monthlyId : row.yearlyId;
            const plan = planId ? PLANS[planId] : null;
            const name = t(`pricing.tier.${row.tier}.name`);
            const tagline = t(`pricing.tier.${row.tier}.tagline`);
            const features = (t(`pricing.tier.${row.tier}.features`) as unknown as string).split("|");

            return (
              <div
                key={row.tier}
                className={
                  "rounded-2xl border p-5 sm:p-6 flex flex-col relative " +
                  (row.highlight
                    ? "border-primary/50 bg-card shadow-[0_0_30px_-15px_hsl(347_99%_58%/0.5)]"
                    : "border-border bg-card")
                }
              >
                {row.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                    {t("pricing.popular")}
                  </span>
                )}

                <div className="flex items-center gap-2">
                  {row.icon}
                  <h3 className="text-lg font-bold">{name}</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{tagline}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  {row.tier === "free" ? (
                    <span className="text-3xl font-black tracking-tight">{t("pricing.free.price")}</span>
                  ) : plan ? (
                    <>
                      <span className="text-3xl font-black tracking-tight">{formatCny(plan.priceCents)}</span>
                      <span className="text-xs text-muted-foreground">
                        {cadence === "monthly" ? t("pricing.per.month") : t("pricing.per.year")}
                      </span>
                    </>
                  ) : null}
                </div>
                {row.tier !== "free" && cadence === "yearly" && plan && (
                  <p className="mt-1 text-xs text-emerald-500 font-medium">
                    {t("pricing.yearlyEquiv").replace("{n}", (plan.priceCents / 100 / 12).toFixed(1))}
                  </p>
                )}

                <ul className="mt-5 space-y-2 flex-1">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-[hsl(178_92%_56%)] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {row.tier === "free" ? (
                  <Link
                    href="/signin"
                    className="mt-6 py-2.5 rounded-lg text-sm font-semibold text-center transition-colors bg-secondary text-foreground hover:bg-muted"
                  >
                    {t("pricing.cta.startFree")}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpgrade(row.tier as "pro" | "ultimate")}
                    className={
                      "mt-6 py-2.5 rounded-lg text-sm font-semibold transition-colors " +
                      (row.highlight
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-secondary text-foreground hover:bg-muted")
                    }
                  >
                    {t(`pricing.cta.upgrade.${row.tier}`)}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Credit packs accordion */}
        <div className="mt-10 max-w-5xl mx-auto">
          <button
            type="button"
            onClick={() => setShowPacks(!showPacks)}
            className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <Coins className="w-4 h-4" />
            {showPacks ? t("pricing.packs.hide") : t("pricing.packs.show")}
          </button>

          {showPacks && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["pack-small", "pack-medium", "pack-large"] as const).map((id) => {
                const p = PLANS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      if (!session?.user) { router.push("/signin"); return; }
                      setActivePlan(p);
                    }}
                    className="rounded-lg border border-border bg-card p-4 text-left hover:border-primary/40 transition-colors"
                  >
                    <div className="text-base font-bold">{formatCny(p.priceCents)}</div>
                    <div className="text-xs text-[hsl(178_92%_56%)] font-semibold mt-1 flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      {p.credits} {t("pricing.packs.credits")}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{t("pricing.packs.never")}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          {t("pricing.payHint")}
        </p>
      </div>

      {activePlan && (
        <PayModal
          plan={activePlan}
          onClose={() => setActivePlan(null)}
        />
      )}
    </div>
  );
}

function PayModal({
  plan,
  onClose,
}: {
  plan: Plan;
  onClose: () => void;
}) {
  const { t } = useT();
  const [method, setMethod] = useState<"alipay" | "wechat">("alipay");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const priceYuan = plan.priceCents / 100;
  const subtitle =
    plan.kind === "subscription"
      ? `${plan.tier === "pro" ? "Pro" : "Ultimate"} · ${plan.days} ${t("pay.modal.days")}`
      : `${plan.credits} ${t("pricing.packs.credits")}`;

  async function onPickFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setErr(t("pay.modal.uploadOnlyImages"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr(t("pay.modal.uploadTooBig"));
      return;
    }
    setErr(null);
    setUploading(true);
    try {
      const blob = await upload(`screenshots/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload-screenshot",
        contentType: file.type,
      });
      setScreenshotUrl(blob.url);
    } catch (e) {
      setErr(t("pay.modal.uploadError").replace("{e}", e instanceof Error ? e.message : "Unknown"));
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setErr(null);
    try {
      const r = await fetch("/api/checkout/manual-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, paymentMethod: method, note, screenshotUrl }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(t("pay.modal.error").replace("{e}", d.error || `HTTP ${r.status}`));
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      setSubmitting(false);
    } catch (e) {
      setErr(t("pay.modal.error").replace("{e}", e instanceof Error ? e.message : "Unknown"));
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
          <h2 className="text-lg font-bold">
            {success ? t("pay.modal.success") : t("pay.modal.title")}
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
            <p className="text-muted-foreground leading-relaxed">{t("pay.modal.successBody")}</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90"
            >
              {t("pay.modal.successDone")}
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="text-center">
              <div className="text-2xl font-black">{t("pay.modal.amount").replace("{n}", String(priceYuan))}</div>
              <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
            </div>

            <div className="flex gap-2">
              {(["alipay", "wechat"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={
                    "flex-1 py-2 rounded-lg text-sm font-semibold transition-colors " +
                    (method === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-muted")
                  }
                >
                  {t(`pay.modal.tab${m === "alipay" ? "Alipay" : "Wechat"}`)}
                </button>
              ))}
            </div>

            <QrImage method={method} />

            <p className="text-xs text-center text-muted-foreground">{t("pay.modal.scanHint")}</p>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("pay.modal.uploadLabel")}</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickFile(f);
                  e.target.value = "";
                }}
              />
              {screenshotUrl ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={screenshotUrl} alt="screenshot" className="h-20 rounded-md border border-border" />
                  <button
                    type="button"
                    onClick={() => setScreenshotUrl(null)}
                    className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-0.5 shadow"
                    aria-label="remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-3 rounded-md border border-dashed border-border bg-background text-xs text-muted-foreground flex items-center justify-center gap-2 hover:bg-muted/40 disabled:opacity-50"
                >
                  {uploading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" />{t("pay.modal.uploading")}</>
                  ) : (
                    <><Upload className="w-3.5 h-3.5" />{t("pay.modal.uploadButton")}</>
                  )}
                </button>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">{t("pay.modal.uploadHint")}</p>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("pay.modal.noteLabel")}</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("pay.modal.notePlaceholder")}
                rows={2}
                maxLength={500}
                className="w-full text-sm rounded-md bg-background border border-border px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

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
                {t("pay.modal.cancel")}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? t("pay.modal.submitting") : t("pay.modal.confirm")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QrImage({ method }: { method: "alipay" | "wechat" }) {
  const { t } = useT();
  const [broken, setBroken] = useState(false);
  const src = method === "alipay" ? "/qr-alipay.png" : "/qr-wechat.png";
  const alt = t(method === "alipay" ? "pay.modal.qrAltAlipay" : "pay.modal.qrAltWechat");

  if (broken) {
    return (
      <div className="w-48 h-48 mx-auto rounded-lg bg-muted/50 border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground text-center px-3">
        {t("pay.modal.qrMissing")}
        <br />
        <code className="text-[10px] mt-1">public{src}</code>
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className="w-48 h-48 mx-auto rounded-lg bg-white p-2 object-contain"
    />
  );
}
