import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNum(n: number, decimals: number = 2) {
  return (+n || 0).toLocaleString('th-TH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatPct(n: number) {
  return (n > 0 ? '+' : '') + formatNum(n) + '%';
}

export function ValueDisplay({ value, decimals = 2, className }: { value: number, decimals?: number, className?: string }) {
  const isPos = value > 0;
  const isNeg = value < 0;
  
  return (
    <span className={cn(
      isPos ? "text-positive" : isNeg ? "text-negative" : "text-muted-foreground",
      className
    )}>
      {isPos ? '+' : ''}{formatNum(value, decimals)}
    </span>
  );
}

export function PctBadge({ value, className }: { value: number, className?: string }) {
  const isPos = value > 0;
  const isNeg = value < 0;
  
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-md text-xs font-bold inline-block",
      isPos ? "bg-positive-subtle text-positive" : isNeg ? "bg-negative-subtle text-negative" : "bg-muted text-muted-foreground",
      className
    )}>
      {formatPct(value)}
    </span>
  );
}
