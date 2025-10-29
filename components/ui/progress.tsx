import * as React from "react";

export function Progress({ value = 0, className = "" }: { value?: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={"relative h-2 w-full rounded bg-black/20 " + className}>
      <div className="h-full rounded bg-white/80 transition-[width]" style={{ width: `${v}%` }} />
    </div>
  );
}
