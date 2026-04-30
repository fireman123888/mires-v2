const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-medium ring-1 ring-primary/10">
    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
    {children}
  </span>
);

export const Hero = () => {
  return (
    <section className="text-center py-8 sm:py-12 mb-6">
      <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
        <Badge>100% 免费</Badge>
        <Badge>无需登录</Badge>
        <Badge>无限生成</Badge>
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance">
        在几秒钟内创建
        <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent"> 惊艳的 AI </span>
        图像
      </h1>
      <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
        Flux / 写实 / 动漫 / 极速 —— 4 种风格一键并行生成，对比挑选最佳结果。
        无需注册，无需 API key。
      </p>
    </section>
  );
};
