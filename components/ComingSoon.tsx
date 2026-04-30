import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Header } from "./Header";

interface ComingSoonProps {
  title: string;
  description: string;
  emoji?: string;
}

export function ComingSoon({ title, description, emoji = "✨" }: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div className="text-center py-20 sm:py-32 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(347_99%_58%)] opacity-15 blur-[120px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[hsl(178_92%_56%)] opacity-10 blur-[120px]" />
          </div>

          <div className="text-6xl mb-6">{emoji}</div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-[hsl(178_92%_56%)] via-white to-[hsl(347_99%_58%)] bg-clip-text text-transparent">
              {title}
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto text-balance">
            {description}
          </p>

          <div className="mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm font-medium ring-1 ring-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            敬请期待
          </div>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页继续生成图像
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
