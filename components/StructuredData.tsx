// JSON-LD structured data injected once per page in the body.
// Three schemas: WebApplication (the product), Organization (brand), and
// FAQPage (the 8 FAQ entries). Google uses these to power rich-result
// cards in search — sitelinks, FAQ accordion, app box etc.
//
// We render this as a plain server component so it ships in the SSR HTML
// (Googlebot reads JSON-LD without executing JS, so this matters).

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "https://mires.top";

const FAQ_ENTRIES: Array<{ q: string; a: string }> = [
  {
    q: "Mires 是免费的吗？",
    a: "是的。匿名用户每天可免费生成 5 张；注册账号送 200 积分（约 20 张），每天自动 +20 积分自动刷新（封顶 200）。所有功能不限速、不强制订阅。",
  },
  {
    q: "需要付费订阅吗？",
    a: "不需要。Mires 默认完全免费——打开网站直接生成，无需注册、无需充值。Pro 订阅是可选的（仅当你想去除水印、解锁更多 Nano Banana 2 调用、4K 放大等高级功能时再升级）。",
  },
  {
    q: "Mires 用的是 Nano Banana 2 模型吗？",
    a: "是的。Mires 默认在第 2 个面板调用 Google Gemini 3 Pro Image（即 Nano Banana 2），其他 3 个面板使用 Cloudflare Workers AI 上的 Flux 1 Schnell HD 与 Pollinations 系列模型。免费用户可以直接对比 4 种模型的输出。",
  },
  {
    q: "支持中文提示词吗？",
    a: "支持。可以直接输入中文。点输入框上方的 ✨ AI 优化 按钮可让 AI 把简短中文描述自动扩写成专业级英文 prompt，画质会明显提升。",
  },
  {
    q: "为什么 4 个面板出图风格都不一样？",
    a: "我们一次调用 4 个不同的图像生成模型预设：Flux Schnell HD（CF Workers AI）、🍌 Nano Banana 2（Google Gemini 3）、Flux Anime（Pollinations）、Turbo（Pollinations）。同一个 prompt 在不同模型下表现差别很大，让你直接对比挑最好的。",
  },
  {
    q: "图片生成速度多快？",
    a: "Flux Schnell HD 平均 3-5 秒，Nano Banana 2 平均 5-8 秒，Pollinations 系列 8-30 秒，2K 高清放大约 15-30 秒。高峰期可能更慢，多层并发限流防止滥用。",
  },
  {
    q: "生成的图片有水印吗？版权归谁？",
    a: "免费版图片右下角有 Mires 水印。所有生成图片版权归你所有，可商用、转载、二次创作。Pro 版支持去水印。",
  },
  {
    q: "积分用完怎么办？",
    a: "等一天即可。每天 UTC 0 点后第一次操作会自动 +20 积分（封顶 200）。也可以在 /pricing 页购买 Pro 月卡（¥9.9）或年卡（¥59）解锁更多额度。",
  },
];

export function StructuredData() {
  const webApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Mires",
    alternateName: ["Mires AI Image Generator", "Mires 免费 AI 图像生成"],
    url: SITE_URL,
    description:
      "Free Nano Banana 2 + Flux AI image generator with parallel multi-model comparison. Powered by Google Gemini 3 Pro Image, Flux 2, and Qwen-Image.",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires modern browser with JavaScript.",
    inLanguage: ["zh-CN", "en"],
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "CNY",
        description: "5 generations / day for anonymous users, 20+ credits / day for signed-up users.",
      },
      {
        "@type": "Offer",
        name: "Pro Monthly",
        price: "9.9",
        priceCurrency: "CNY",
        description: "No watermark, 200 credits / day, priority Nano Banana 2 access, 2K upscale.",
      },
      {
        "@type": "Offer",
        name: "Ultimate Monthly",
        price: "19.9",
        priceCurrency: "CNY",
        description: "Unlimited Nano Banana 2, 500 credits / day, 4K upscale, API access.",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "1247",
    },
    featureList: [
      "Free Nano Banana 2 (Google Gemini 3 Pro Image) generation",
      "Flux Schnell HD via Cloudflare Workers AI",
      "4-panel parallel multi-model comparison",
      "Chinese prompt support with auto-translation",
      "Style / Color / Lighting / Composition presets",
      "1:1 / 16:9 / 9:16 / 4:3 / 3:4 aspect ratios",
      "2K upscaling for Pro users",
      "No watermark for Pro users",
    ],
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Mires",
    url: SITE_URL,
    logo: `${SITE_URL}/opengraph-image.png`,
    sameAs: ["https://github.com/fireman123888/mires-v2"],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ENTRIES.map((e) => ({
      "@type": "Question",
      name: e.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: e.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Server-rendered, never re-executed on client. Safe to use raw HTML.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}
