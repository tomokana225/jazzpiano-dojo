import { Minus, Plus } from "lucide-react";

export function OctaveShiftControl({
  value,
  onChange,
  min = -2,
  max = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-6 w-6 items-center justify-center rounded-md text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      </button>
      <span className="w-16 text-center text-xs text-slate-300">
        {value === 0 ? "基準" : `${value > 0 ? "+" : ""}${value}オクターブ`}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-6 w-6 items-center justify-center rounded-md text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}
