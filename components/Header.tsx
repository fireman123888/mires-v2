import Link from "next/link";

const Logo = ({ size = 30 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Douyin-style chromatic-aberration M */}
    <text x="9" y="24" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" fill="hsl(178 92% 56%)" opacity="0.9">M</text>
    <text x="11" y="24" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" fill="hsl(347 99% 58%)" opacity="0.9">M</text>
    <text x="10" y="24" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" fill="white">M</text>
  </svg>
);

export const Header = () => {
  return (
    <header className="mb-6">
      <div className="mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo />
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            Mires
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground border-l border-border pl-2 ml-1">
            AI 图像生成
          </span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="https://github.com/fireman123888/mires-v2"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
};
