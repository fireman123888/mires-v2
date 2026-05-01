import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 图标生成器 · Free Text-to-Icon",
  description:
    "免费在线 AI 图标生成器。输入一句话描述，4 个并行变体一次出，4 种风格供选。基于 Flux Schnell HD + Nano Banana 2。无需注册，下载 PNG。",
  keywords: [
    "AI 图标生成器",
    "AI icon generator",
    "text to icon",
    "免费 AI 图标",
    "logo AI",
    "应用图标 生成",
    "Flux icon",
  ],
  alternates: { canonical: "/icon" },
  openGraph: {
    title: "Mires AI 图标生成器 — 免费 4 风格并行",
    description: "输入一句话，秒出 4 个不同风格 AI 图标。",
    url: "/icon",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
