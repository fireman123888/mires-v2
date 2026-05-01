import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Prompt 优化器 · 中文转专业英文 prompt",
  description:
    "免费 AI prompt 优化工具。把简短中文描述自动扩写成专业级英文 prompt，加入光照 / 构图 / 风格描述，输出质量提升 3-5 倍。基于 Google Gemini 2.5 Flash Lite。",
  keywords: [
    "AI prompt 优化",
    "prompt 优化器",
    "中文 prompt 转英文",
    "AI 提示词 中文",
    "Stable Diffusion prompt",
    "Flux prompt",
    "Midjourney prompt 翻译",
  ],
  alternates: { canonical: "/optimizer" },
  openGraph: {
    title: "Mires Prompt 优化器 — 中文 → 专业英文 prompt",
    description: "一句中文，秒变专业 prompt。质量提升 3-5 倍。",
    url: "/optimizer",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
