import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  display: "swap",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mires — 免费 AI 图像生成 | 无需登录",
  description: "Mires 是免费、无需登录的 AI 图像生成平台。一次生成 4 种风格（标准 / 写实 / 动漫 / 极速），直接对比挑选。基于 Pollinations.AI 后端，完全免费。",
  keywords: ["AI 图像", "AI 绘画", "Flux", "免费", "Pollinations"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
