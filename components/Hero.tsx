const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary text-foreground px-3 py-1 text-xs font-semibold ring-1 ring-white/5">
    <span className="h-1.5 w-1.5 rounded-full bg-[hsl(178_92%_56%)] shadow-[0_0_6px_hsl(178_92%_56%)]" />
    {children}
  </span>
);

export const Hero = () => {
  return (
    <section className="text-center py-8 sm:py-12 mb-6 relative">
      {/* Subtle red/cyan glow behind hero, Douyin chromatic feel */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(347_99%_58%)] opacity-20 blur-[120px]" />
        <div className="absolute top-1/2 right-1/3 translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(178_92%_56%)] opacity-15 blur-[120px]" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
        <Badge>100% 免费</Badge>
        <Badge>无需登录</Badge>
        <Badge>无限生成</Badge>
      </div>

      <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-balance">
        在几秒钟内创建
        <span className="block sm:inline bg-gradient-to-r from-[hsl(178_92%_56%)] via-white to-[hsl(347_99%_58%)] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
          {' 惊艳的 AI '}
        </span>
        图像
      </h1>

      <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
        Flux / 写实 / 动漫 / 极速 —— 4 种风格一键并行生成，对比挑选最佳结果。
        无需注册，无需 API key。
      </p>
    </section>
  );
};
