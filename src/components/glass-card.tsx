import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function GlassCard({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass rounded-3xl shadow-card",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
