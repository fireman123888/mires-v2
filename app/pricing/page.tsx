"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Coins, Loader2, X } from "lucide-react";
import { Header } from "@/components/Header";
import { useT } from "@/components/I18nProvider";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

type PackId = "starter" | "small" | "medium" | "large";
const PURCHASABLE_PACKS: PackId[] = ["small", "medium", "large"];

const PACK_PRICE_YUAN: Record<Exclude<PackId, "starter">, number> = {
  small: 10,
  medium: 30,
  large: 100,
};

export default function PricingPage() {
  const { t } = useT();
  const { data: session } = useSession();
  const router = useRouter();
  const [activePack, setActivePack] = useState<PackId | null>(null);

  const PLANS: Array<{
    key: PackId;
    highlight: boolean;
    featureKeys: string[];
  }> = [
    { key: "starter", highlight: false, featureKeys: ["f1", "f2", "f3", "f4"] },
    { key: "small",   highlight: false, featureKeys: ["f1", "f2", "f3", "f4"] },
    { key: "medium",  highlight: true,  featureKeys: ["f1", "f2", "f3", "f4", "f5"] },
    { key: "large",   highlight: false, featureKeys: ["f1", "f2", "f3", "f4", "f5", "f6"] },
  ];

  const handlePurchase = (packId: PackId) => {
    if (!session?.user) {
      router.push("/signin");
      return;
    }
    setActivePack(packId);
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div className="text-center py-12 relative">
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
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("pricing.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            const name = t(`pricing.${plan.key}.name`);
            const price = t(`pricing.${plan.key}.price`);
            const credits = t(`pricing.${plan.key}.credits`);
            const cta = t(`pricing.${plan.key}.cta`);
            const isPurchasable = PURCHASABLE_PACKS.includes(plan.key);

            return (
              <div
                key={plan.key}
                className={
                  "rounded-2xl border p-5 sm:p-6 flex flex-col relative " +
                  (plan.highlight
                    ? "border-primary/50 bg-card shadow-[0_0_30px_-15px_hsl(347_99%_58%/0.5)]"
                    : "border-border bg-card")
                }
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                    {t("pricing.popular")}
                  </span>
                )}
                <h3 className="text-lg font-bold">{name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tight">{price}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-sm text-[hsl(178_92%_56%)] font-semibold">
                  <Coins className="w-4 h-4" />
                  <span>{credits}</span>
                </div>
                <ul className="mt-5 space-y-2 flex-1">
                  {plan.featureKeys.map((fk) => (
                    <li key={fk} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-[hsl(178_92%_56%)] shrink-0 mt-0.5" />
                      <span>{t(`pricing.${plan.key}.${fk}`)}</span>
                    </li>
                  ))}
                </ul>

                {plan.key === "starter" ? (
                  <Link
                    href="/signin"
                    className="mt-6 py-2.5 rounded-lg text-sm font-semibold text-center transition-colors bg-secondary text-foreground hover:bg-muted"
                  >
                    {cta}
                  </Link>
                ) : isPurchasable ? (
                  <button
                    type="button"
                    onClick={() => handlePurchase(plan.key)}
                    className={
                      "mt-6 py-2.5 rounded-lg text-sm font-semibold transition-colors " +
                      (plan.highlight
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-secondary text-foreground hover:bg-muted")
                    }
                  >
                    {t(`pricing.${plan.key}.buyCta`)}
                  </button>
                ) : (
                  <div className="mt-6 py-2.5 rounded-lg text-sm font-semibold text-center bg-secondary/50 text-muted-foreground cursor-not-allowed">
                    {cta}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          {t("pricing.payHint")}
        </p>
      </div>

      {activePack && activePack !== "starter" && (
        <PayModal
          packId={activePack as Exclude<PackId, "starter">}
          priceYuan={PACK_PRICE_YUAN[activePack as Exclude<PackId, "starter">]}
          credits={Number(t(`pricing.${activePack}.credits`).replace(/\D/g, "")) || 0}
          onClose={() => setActivePack(null)}
        />
      )}
    </div>
  );
}

function PayModal({
  packId,
  priceYuan,
  credits,
  onClose,
}: {
  packId: "small" | "medium" | "large";
  priceYuan: number;
  credits: number;
  onClose: () => void;
}) {
  const { t } = useT();
  const [method, setMethod] = useState<"alipay" | "wechat">("alipay");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setErr(null);
    try {
      const r = await fetch("/api/checkout/manual-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, paymentMethod: method, note }),
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
            <p className="text-muted-foreground leading-relaxed">
              {t("pay.modal.successBody")}
            </p>
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
              <div className="text-2xl font-black">
                {t("pay.modal.amount").replace("{n}", String(priceYuan))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {credits} 积分 · {packId}
              </div>
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

            <p className="text-xs text-center text-muted-foreground">
              {t("pay.modal.scanHint")}
            </p>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {t("pay.modal.noteLabel")}
              </label>
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
              <div className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {err}
              </div>
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
  const src = method === "alipay" ? "/qr-alipay.jpg" : "/qr-wechat.jpg";
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

  // Plain img tag — these are user-uploaded static QR files, no optimization needed.
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
