// All UI strings centralized here. To add a new language, add a key to LOCALES
// and a matching messages.<lang>.<key> entry below. Untranslated keys fall back to zh.

export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "zh";

export const LOCALE_LABELS: Record<Locale, string> = {
  zh: "简体中文",
  en: "English",
};

type Messages = Record<string, string>;

const zh: Messages = {
  // Header / nav
  "nav.editor": "AI 图像编辑器",
  "nav.video": "AI 视频生成器",
  "nav.pricing": "定价",
  "nav.tools": "AI 工具页面",
  "header.brand.tagline": "AI 图像生成",

  // Hero
  "hero.badge.free": "100% 免费",
  "hero.badge.noLogin": "无需登录",
  "hero.badge.unlimited": "无限生成",
  "hero.title.before": "在几秒钟内创建",
  "hero.title.highlight": " 惊艳的 AI ",
  "hero.title.after": "图像",
  "hero.description": "Flux / 写实 / 动漫 / 极速 —— 4 种风格一键并行生成，对比挑选最佳结果。无需注册，无需 API key。",

  // Prompt input
  "prompt.placeholder": "输入提示词，建议英文效果最佳...",

  // Gallery
  "gallery.title": "获取灵感",
  "gallery.subtitle": "发现新内容 · 点击任一示例直接使用其提示词",
  "gallery.usePrompt": "点击使用",

  // Provider names
  "provider.flux": "Flux 标准",
  "provider.real": "写实",
  "provider.anime": "动漫",
  "provider.turbo": "极速",

  // Coming Soon pages
  "comingSoon.editor.title": "AI 图像编辑器",
  "comingSoon.editor.description": "上传图片，用自然语言指令精准编辑：换背景、改光线、加元素、改风格。功能正在开发中。",
  "comingSoon.video.title": "AI 视频生成器",
  "comingSoon.video.description": "一句话生成短视频。文生视频、图生视频，支持多种风格和分辨率。功能正在开发中。",
  "comingSoon.tag": "敬请期待",
  "comingSoon.back": "返回首页继续生成图像",

  // Pricing page
  "pricing.title.before": "简单",
  "pricing.title.highlight": "透明",
  "pricing.title.after": "的定价",
  "pricing.description": "免费版永远免费、无限次生成。需要更高画质或商业 API？随时升级。",
  "pricing.popular": "最受欢迎",
  "pricing.free.name": "免费版",
  "pricing.free.period": "永久",
  "pricing.free.cta": "立即开始",
  "pricing.free.f1": "无限次生成",
  "pricing.free.f2": "4 种风格并行（Flux / 写实 / 动漫 / 极速）",
  "pricing.free.f3": "1024×1024 分辨率",
  "pricing.free.f4": "无需注册",
  "pricing.free.f5": "公平队列调度",
  "pricing.pro.name": "Pro",
  "pricing.pro.period": "/月",
  "pricing.pro.cta": "暂未开放",
  "pricing.pro.f1": "免费版全部功能",
  "pricing.pro.f2": "优先生成（更快队列）",
  "pricing.pro.f3": "2048×2048 高清输出",
  "pricing.pro.f4": "无水印 + 私密生成",
  "pricing.pro.f5": "API 接入",
  "pricing.pro.f6": "邮件支持",
  "pricing.team.name": "Team",
  "pricing.team.price": "联系我们",
  "pricing.team.cta": "暂未开放",
  "pricing.team.f1": "Pro 全部功能",
  "pricing.team.f2": "团队协作面板",
  "pricing.team.f3": "自定义模型微调",
  "pricing.team.f4": "SLA 保障",
  "pricing.team.f5": "专属客户经理",

  // Tools page
  "tools.title.before": "完整的 ",
  "tools.title.highlight": "AI 创作工具",
  "tools.title.after": "箱",
  "tools.description": "从生成到编辑、从图片到视频，覆盖创意工作流每一步。",
  "tools.comingSoonLabel": "即将推出",
  "tools.t1.title": "AI 图像生成",
  "tools.t1.desc": "文字一键生成 4 种风格图像（Flux / 写实 / 动漫 / 极速）",
  "tools.t2.title": "AI 图像编辑",
  "tools.t2.desc": "上传图片用自然语言精准编辑：换背景、改光线、加元素",
  "tools.t3.title": "AI 视频生成",
  "tools.t3.desc": "一句话生成短视频，文生视频 + 图生视频",
  "tools.t4.title": "智能擦除",
  "tools.t4.desc": "自动识别并擦除图片中的人物、文字、水印或瑕疵",
  "tools.t5.title": "图像放大",
  "tools.t5.desc": "把低分辨率图像无损放大到 4K / 8K",
  "tools.t6.title": "智能裁切",
  "tools.t6.desc": "AI 识别画面主体，自动调整为各种社交平台适配尺寸",
  "tools.t7.title": "AI 文字转图标",
  "tools.t7.desc": "输入描述生成应用图标 / Logo，多风格多尺寸",
  "tools.t8.title": "风格迁移",
  "tools.t8.desc": "把照片转换成油画 / 水彩 / 动漫 / 像素 / 赛博朋克等风格",
  "tools.t9.title": "AI 提示词优化",
  "tools.t9.desc": "把简短描述自动扩写成专业级英文 prompt",
};

const en: Messages = {
  "nav.editor": "AI Image Editor",
  "nav.video": "AI Video Generator",
  "nav.pricing": "Pricing",
  "nav.tools": "AI Tools",
  "header.brand.tagline": "AI Image Generation",

  "hero.badge.free": "100% Free",
  "hero.badge.noLogin": "No Login Required",
  "hero.badge.unlimited": "Unlimited Generation",
  "hero.title.before": "Create stunning",
  "hero.title.highlight": " AI images ",
  "hero.title.after": "in seconds",
  "hero.description": "Flux / Photoreal / Anime / Turbo — generate 4 styles in parallel, compare and pick the best. No registration, no API key.",

  "prompt.placeholder": "Enter your prompt (English works best)...",

  "gallery.title": "Get Inspired",
  "gallery.subtitle": "Discover new ideas · click any example to use its prompt",
  "gallery.usePrompt": "Use prompt",

  "provider.flux": "Flux Standard",
  "provider.real": "Photoreal",
  "provider.anime": "Anime",
  "provider.turbo": "Turbo",

  "comingSoon.editor.title": "AI Image Editor",
  "comingSoon.editor.description": "Upload an image and edit it with natural language: swap backgrounds, change lighting, add elements, restyle. In development.",
  "comingSoon.video.title": "AI Video Generator",
  "comingSoon.video.description": "Generate short videos from a single sentence. Text-to-video and image-to-video, multiple styles and resolutions. In development.",
  "comingSoon.tag": "Coming soon",
  "comingSoon.back": "Back to home, keep generating",

  "pricing.title.before": "Simple, ",
  "pricing.title.highlight": "transparent",
  "pricing.title.after": " pricing",
  "pricing.description": "The free tier is free forever with unlimited generations. Need higher resolution or a commercial API? Upgrade anytime.",
  "pricing.popular": "Most popular",
  "pricing.free.name": "Free",
  "pricing.free.period": "forever",
  "pricing.free.cta": "Get started",
  "pricing.free.f1": "Unlimited generations",
  "pricing.free.f2": "4 parallel styles (Flux / Photoreal / Anime / Turbo)",
  "pricing.free.f3": "1024×1024 resolution",
  "pricing.free.f4": "No registration",
  "pricing.free.f5": "Fair queue scheduling",
  "pricing.pro.name": "Pro",
  "pricing.pro.period": "/mo",
  "pricing.pro.cta": "Not available yet",
  "pricing.pro.f1": "Everything in Free",
  "pricing.pro.f2": "Priority queue (faster)",
  "pricing.pro.f3": "2048×2048 HD output",
  "pricing.pro.f4": "No watermark + private generation",
  "pricing.pro.f5": "API access",
  "pricing.pro.f6": "Email support",
  "pricing.team.name": "Team",
  "pricing.team.price": "Contact us",
  "pricing.team.cta": "Not available yet",
  "pricing.team.f1": "Everything in Pro",
  "pricing.team.f2": "Team collaboration panel",
  "pricing.team.f3": "Custom model fine-tuning",
  "pricing.team.f4": "SLA guarantee",
  "pricing.team.f5": "Dedicated account manager",

  "tools.title.before": "A complete ",
  "tools.title.highlight": "AI creative",
  "tools.title.after": " toolbox",
  "tools.description": "From generation to editing, from images to video — covering every step of the creative workflow.",
  "tools.comingSoonLabel": "Coming soon",
  "tools.t1.title": "AI Image Generation",
  "tools.t1.desc": "One click to generate 4 styles from text (Flux / Photoreal / Anime / Turbo)",
  "tools.t2.title": "AI Image Editing",
  "tools.t2.desc": "Upload an image, edit with natural language: backgrounds, lighting, elements",
  "tools.t3.title": "AI Video Generation",
  "tools.t3.desc": "Short videos from a sentence, text-to-video and image-to-video",
  "tools.t4.title": "Smart Erase",
  "tools.t4.desc": "Auto-detect and erase people, text, watermarks, or blemishes",
  "tools.t5.title": "Image Upscaling",
  "tools.t5.desc": "Lossless upscale of low-res images to 4K / 8K",
  "tools.t6.title": "Smart Crop",
  "tools.t6.desc": "AI detects subjects and crops to social platform sizes automatically",
  "tools.t7.title": "Text to Icon",
  "tools.t7.desc": "Generate app icons / logos from a description, multiple styles and sizes",
  "tools.t8.title": "Style Transfer",
  "tools.t8.desc": "Transform photos into oil / watercolor / anime / pixel / cyberpunk styles",
  "tools.t9.title": "Prompt Optimization",
  "tools.t9.desc": "Auto-expand short descriptions into professional English prompts",
};

export const messages: Record<Locale, Messages> = { zh, en };

export function translate(locale: Locale, key: string): string {
  return messages[locale]?.[key] ?? messages[DEFAULT_LOCALE][key] ?? key;
}
