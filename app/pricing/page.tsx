import Link from "next/link";
import { Check } from "lucide-react";
import { Header } from "@/components/Header";

export const metadata = { title: "定价 — Mires" };

const PLANS = [
  {
    name: "免费版",
    price: "¥0",
    period: "永久",
    highlight: false,
    cta: "立即开始",
    href: "/",
    features: [
      "无限次生成",
      "4 种风格并行（Flux / 写实 / 动漫 / 极速）",
      "1024×1024 分辨率",
      "无需注册",
      "公平队列调度",
    ],
  },
  {
    name: "Pro",
    price: "¥39",
    period: "/月",
    highlight: true,
    cta: "暂未开放",
    href: "#",
    features: [
      "免费版全部功能",
      "优先生成（更快队列）",
      "2048×2048 高清输出",
      "无水印 + 私密生成",
      "API 接入",
      "邮件支持",
    ],
  },
  {
    name: "Team",
    price: "联系我们",
    period: "",
    highlight: false,
    cta: "暂未开放",
    href: "#",
    features: [
      "Pro 全部功能",
      "团队协作面板",
      "自定义模型微调",
      "SLA 保障",
      "专属客户经理",
    ],
  },
];

export default function PricingPage() {
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
            简单<span className="bg-gradient-to-r from-[hsl(178_92%_56%)] to-[hsl(347_99%_58%)] bg-clip-text text-transparent">透明</span>的定价
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            免费版永远免费、无限次生成。需要更高画质或商业 API？随时升级。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                "rounded-2xl border p-6 sm:p-8 flex flex-col " +
                (plan.highlight
                  ? "border-primary/50 bg-card shadow-[0_0_30px_-15px_hsl(347_99%_58%/0.5)] relative"
                  : "border-border bg-card")
              }
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                  最受欢迎
                </span>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-[hsl(178_92%_56%)] shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={
                  "mt-8 py-2.5 rounded-lg text-sm font-semibold text-center transition-colors " +
                  (plan.highlight
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-secondary text-foreground hover:bg-muted")
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
