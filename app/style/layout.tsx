import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 风格迁移 · 12 种艺术风格 1 秒出图",
  description:
    "免费 AI 风格迁移工具。12 种艺术风格（动漫 / 油画 / 水彩 / 赛博朋克 / 吉卜力 / 3D 渲染等）任选，配合 Flux Schnell HD 一次输出。无需注册。",
  keywords: [
    "AI 风格迁移",
    "AI style transfer",
    "动漫风格 AI",
    "油画 AI",
    "吉卜力 风格 AI",
    "赛博朋克 AI",
    "Stable Diffusion 风格",
  ],
  alternates: { canonical: "/style" },
  openGraph: {
    title: "Mires AI 风格迁移 — 12 种艺术风格免费",
    description: "动漫 / 油画 / 吉卜力 / 赛博朋克 任选，秒级出图。",
    url: "/style",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
