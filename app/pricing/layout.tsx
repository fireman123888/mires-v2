import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "定价 · Pro & Ultimate 套餐",
  description:
    "Mires Pro ¥9.9/月 起，解锁 🍌 Nano Banana 2 优先调用、无水印、200+ 积分/天、2K 高清放大。Ultimate ¥19.9/月 含无限 Nano Banana 2 与 4K 放大。微信 / 支付宝 直扫付款。",
  keywords: [
    "Nano Banana 2 价格",
    "Mires Pro",
    "Mires Ultimate",
    "AI 图像生成 订阅",
    "免费 AI 绘画 升级",
    "Flux 月卡",
  ],
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Mires 定价 — Pro ¥9.9/月，Ultimate ¥19.9/月",
    description: "解锁 Nano Banana 2 + 无水印 + 4K 放大。微信 / 支付宝 直扫付款。",
    url: "/pricing",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
