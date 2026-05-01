import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 工具集 · 6 个免费在线工具",
  description:
    "Mires AI 工具集：AI 图像生成、图标生成、风格迁移、智能裁剪、背景去除、prompt 优化器。覆盖创作全链路，全部免费、无需注册。基于 Nano Banana 2 + Flux Schnell HD + 浏览器端 WASM。",
  keywords: [
    "AI 工具集",
    "AI tools",
    "免费 AI 工具",
    "AI 创作工具",
    "在线 AI 工具",
    "AI image tools",
  ],
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Mires AI 工具箱 — 6 个免费工具一站式",
    description: "图像生成 + 图标 + 风格 + 裁剪 + 抠图 + prompt 优化。",
    url: "/tools",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
