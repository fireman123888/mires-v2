import Link from "next/link";
import { Header } from "@/components/Header";
import { ImageIcon, Wand2, Film, Layers, Eraser, Type, Crop, Sparkles, Palette, ArrowRight } from "lucide-react";

export const metadata = { title: "AI 工具 — Mires" };

const TOOLS = [
  {
    icon: ImageIcon,
    title: "AI 图像生成",
    description: "文字一键生成 4 种风格图像（Flux / 写实 / 动漫 / 极速）",
    href: "/",
    available: true,
  },
  {
    icon: Wand2,
    title: "AI 图像编辑",
    description: "上传图片用自然语言精准编辑：换背景、改光线、加元素",
    href: "/editor",
    available: false,
  },
  {
    icon: Film,
    title: "AI 视频生成",
    description: "一句话生成短视频，文生视频 + 图生视频",
    href: "/video",
    available: false,
  },
  {
    icon: Eraser,
    title: "智能擦除",
    description: "自动识别并擦除图片中的人物、文字、水印或瑕疵",
    href: "#",
    available: false,
  },
  {
    icon: Layers,
    title: "图像放大",
    description: "把低分辨率图像无损放大到 4K / 8K",
    href: "#",
    available: false,
  },
  {
    icon: Crop,
    title: "智能裁切",
    description: "AI 识别画面主体，自动调整为各种社交平台适配尺寸",
    href: "#",
    available: false,
  },
  {
    icon: Type,
    title: "AI 文字转图标",
    description: "输入描述生成应用图标 / Logo，多风格多尺寸",
    href: "#",
    available: false,
  },
  {
    icon: Palette,
    title: "风格迁移",
    description: "把照片转换成油画 / 水彩 / 动漫 / 像素 / 赛博朋克等风格",
    href: "#",
    available: false,
  },
  {
    icon: Sparkles,
    title: "AI 提示词优化",
    description: "把简短描述自动扩写成专业级英文 prompt",
    href: "#",
    available: false,
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div className="text-center py-12 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(347_99%_58%)] opacity-15 blur-[120px]" />
            <div className="absolute top-1/2 right-1/3 translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(178_92%_56%)] opacity-10 blur-[120px]" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            完整的 <span className="bg-gradient-to-r from-[hsl(178_92%_56%)] to-[hsl(347_99%_58%)] bg-clip-text text-transparent">AI 创作工具</span>箱
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            从生成到编辑、从图片到视频，覆盖创意工作流每一步。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const Wrapper: React.ElementType = tool.available || tool.href !== "#" ? Link : "div";
            const wrapperProps = tool.href !== "#" ? { href: tool.href } : {};
            return (
              <Wrapper
                key={tool.title}
                {...wrapperProps}
                className={
                  "group relative rounded-xl border p-5 sm:p-6 transition-all duration-300 " +
                  (tool.available
                    ? "border-border bg-card hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-[0_0_25px_-10px_hsl(347_99%_58%/0.5)]"
                    : tool.href !== "#"
                      ? "border-border bg-card hover:border-primary/30"
                      : "border-border/50 bg-card/50 cursor-not-allowed")
                }
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={
                      "p-2.5 rounded-lg shrink-0 " +
                      (tool.available
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground")
                    }
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg">{tool.title}</h3>
                    {!tool.available && (
                      <span className="text-xs text-muted-foreground">即将推出</span>
                    )}
                  </div>
                  {tool.available && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </div>
  );
}
