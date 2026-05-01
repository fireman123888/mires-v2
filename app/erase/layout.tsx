import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 背景去除 · Free Background Remover",
  description:
    "免费在线 AI 背景去除工具。一键抠图，输出透明 PNG。基于 @imgly/background-removal WASM 模型，**完全在浏览器运行，图片不上传服务器**。无水印、无注册、无次数限制。",
  keywords: [
    "AI 背景去除",
    "AI 抠图",
    "background remover",
    "remove background",
    "免费抠图",
    "在线抠图",
    "透明 PNG",
  ],
  alternates: { canonical: "/erase" },
  openGraph: {
    title: "Mires AI 抠图 — 浏览器端去背景，零上传",
    description: "WASM 模型本地推理，图片不离开你的设备。无水印、无限次。",
    url: "/erase",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
