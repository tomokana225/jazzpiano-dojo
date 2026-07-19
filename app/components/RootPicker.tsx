import { JAZZ_ROOT_NAMES, type PitchClass } from "~/lib/theory/notes";

export function RootPicker({ value, onChange }: { value: PitchClass; onChange: (root: PitchClass) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {JAZZ_ROOT_NAMES.map((name, root) => (
        <button
          key={root}
          type="button"
          onClick={() => onChange(root)}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
            value === root
              ? "border-amber-400 bg-amber-400/15 text-amber-300"
              : "border-slate-700 text-slate-300 hover:border-slate-500"
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
