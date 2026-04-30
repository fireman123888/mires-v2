import { useEffect, useState } from "react";

export function Stopwatch({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="text-2xl font-bold font-mono bg-gradient-to-r from-[hsl(178_92%_56%)] to-[hsl(347_99%_58%)] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">
      {(elapsed / 1000).toFixed(1)}s
    </div>
  );
}
