import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 视频生成器 · 即将上线",
  description:
    "Mires AI 视频生成器即将上线。基于 Sora 2 / Veo 3 / Seedance 等主流视频模型，文字直接生成 5-10 秒短视频。免费试用即将开放。",
  keywords: [
    "AI 视频生成",
    "AI video generator",
    "text to video",
    "Sora",
    "Veo",
    "Seedance",
    "免费 AI 视频",
  ],
  alternates: { canonical: "/video" },
  openGraph: {
    title: "Mires AI 视频生成器 — 即将上线",
    description: "Sora 2 / Veo 3 / Seedance 文字转视频，敬请期待。",
    url: "/video",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
