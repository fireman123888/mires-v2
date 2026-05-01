import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "智能裁剪 · 4 种社交媒体比例自动构图",
  description:
    "免费 AI 智能裁剪工具。自动识别图片主体，按 1:1（朋友圈 / Instagram）、9:16（小红书 / 抖音）、16:9（YouTube）、4:5（微信公众号）4 种比例最优裁剪。浏览器端 smartcrop.js 推理，不上传服务器。",
  keywords: [
    "智能裁剪",
    "AI 裁剪",
    "smart crop",
    "图片自动裁剪",
    "社交媒体 配图",
    "九宫格 裁剪",
  ],
  alternates: { canonical: "/crop" },
  openGraph: {
    title: "Mires 智能裁剪 — 4 比例一键出图",
    description: "1:1 / 9:16 / 16:9 / 4:5 自动构图，浏览器端处理。",
    url: "/crop",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
