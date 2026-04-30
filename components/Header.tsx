import Link from "next/link";

const Logo = ({ size = 28 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="mires-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(174, 72%, 38%)" />
        <stop offset="1" stopColor="hsl(200, 80%, 45%)" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#mires-grad)" />
    <path
      d="M9 22V10h2.4l4.6 7.6L20.6 10H23v12h-2.2v-7.8l-4.2 6.8h-1.2l-4.2-6.8V22H9z"
      fill="white"
    />
  </svg>
);

export const Header = () => {
  return (
    <header className="mb-6">
      <div className="mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
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
