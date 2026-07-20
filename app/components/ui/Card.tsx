import type { HTMLAttributes } from "react";

/**
 * The app's one card surface. A subtle gradient + inset top highlight + soft
 * shadow gives real depth instead of a single flat translucent fill, and
 * every practice route composes its panels from this instead of repeating
 * the same border/bg className string by hand.
 */
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 to-slate-900/35 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_20px_40px_-30px_rgba(0,0,0,0.9)] ${className}`}
      {...props}
    />
  );
}
