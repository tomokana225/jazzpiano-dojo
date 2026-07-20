import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-brass-300 to-brass-400 text-slate-950 shadow-[0_1px_0_0_rgba(255,255,255,0.35)_inset,0_4px_12px_-4px_rgba(212,161,63,0.55)] hover:from-brass-200 hover:to-brass-300 active:from-brass-400 active:to-brass-400",
  secondary:
    "border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500 hover:bg-slate-800/70",
  ghost: "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50",
  danger: "border border-red-500/50 bg-red-500/5 text-red-300 hover:border-red-400 hover:bg-red-500/10",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
};

/**
 * The app's one button component — every route should reach for this
 * instead of hand-rolling className strings, so buttons look and behave
 * consistently across pages. `primary` is reserved for the single main
 * action on a screen (start/play); `secondary` for everything else;
 * `danger` for stop/destructive actions; `ghost` for the lowest-emphasis
 * inline actions.
 */
export function Button({
  variant = "secondary",
  size = "md",
  icon,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
