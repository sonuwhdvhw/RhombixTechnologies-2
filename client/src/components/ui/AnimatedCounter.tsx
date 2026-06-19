import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  formatFn?: (value: number) => string;
}

export default function AnimatedCounter({
  from = 0,
  to,
  duration = 2,
  formatFn,
}: AnimatedCounterProps) {
  const [value, setValue] = useState(from);
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = (timestamp - startTime.current) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setValue(from + (to - from) * easedProgress);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [from, to, duration]);

  const display = formatFn ? formatFn(value) : Math.round(value).toString();
  return <span>{display}</span>;
}
