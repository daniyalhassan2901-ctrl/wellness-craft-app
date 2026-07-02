import { memo } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  className?: string;
  color?: string;
  label?: string;
  sublabel?: string;
}

export const ProgressRing = memo(function ProgressRing({
  value,
  max,
  size = 120,
  stroke = 10,
  className,
  color = "var(--color-primary)",
  label,
  sublabel,
}: Props) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, value / Math.max(1, max)));
  const offset = circ * (1 - pct);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 drop-shadow-sm">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-muted)"
          strokeWidth={stroke}
          fill="none"
          className="opacity-60 dark:opacity-40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 600ms ease",
            filter: "drop-shadow(0 0 5px color-mix(in oklab, var(--color-primary) 35%, transparent))",
          }}
        />
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {label && <div className="text-2xl font-bold tracking-tight text-foreground drop-shadow-sm">{label}</div>}
          {sublabel && <div className="text-xs font-medium text-muted-foreground">{sublabel}</div>}
        </div>
      )}
    </div>
  );
}

