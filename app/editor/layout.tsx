import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 图像编辑器 · 在线智能修图",
  description:
    "免费 AI 图像编辑器。支持智能裁剪、背景去除、风格迁移、文字转图标、提示词优化等核心功能。基于 Nano Banana 2 + Flux Schnell HD，浏览器端 WASM 推理，零配置。",
  keywords: [
    "AI 图像编辑器",
    "AI image editor",
    "在线修图",
    "免费 PS",
    "Nano Banana 编辑",
    "图片处理 AI",
  ],
  alternates: { canonical: "/editor" },
  openGraph: {
    title: "Mires AI 图像编辑器 — 浏览器端 AI 修图",
    description: "智能裁剪 / 背景去除 / 风格迁移 全套工具，免费用。",
    url: "/editor",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
