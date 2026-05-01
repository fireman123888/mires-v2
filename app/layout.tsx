import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { I18nProvider } from "@/components/I18nProvider";
import { Footer } from "@/components/Footer";
import { FeedbackButton } from "@/components/FeedbackButton";
import { StructuredData } from "@/components/StructuredData";

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

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "https://mires.top";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mires — 免费无限 Nano Banana 2 图像生成 · Free AI Image Generator",
    template: "%s | Mires",
  },
  description:
    "Mires 是免费的 Nano Banana 2 图像生成器。集成 Google Gemini 3 Pro Image、Flux 2、Qwen-Image，多模型并行对比，一键挑选最佳结果。打开即用，无需注册。",
  keywords: [
    "Nano Banana 2",
    "Nano Banana",
    "Gemini 3",
    "Flux",
    "Flux Schnell",
    "AI image generator",
    "free AI image",
    "AI 图像生成",
    "AI 绘画",
    "免费 AI 绘画",
    "文生图",
    "text to image",
  ],
  authors: [{ name: "Mires" }],
  alternates: {
    canonical: "/",
    languages: {
      "zh-CN": "/",
      "en": "/",
    },
  },
  openGraph: {
    type: "website",
    siteName: "Mires",
    locale: "zh_CN",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@mires_top",
  },
  // Search-engine verification placeholders. Fill via env so we don't have to
  // commit verification codes. See SEO setup notes in README.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: {
      "msvalidate.01": process.env.BING_SITE_VERIFICATION || "",
      "baidu-site-verification": process.env.BAIDU_SITE_VERIFICATION || "",
    },
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <I18nProvider>
          {children}
          <Footer />
          <FeedbackButton />
        </I18nProvider>
        <Analytics />
        <StructuredData />
      </body>
    </html>
  );
}
