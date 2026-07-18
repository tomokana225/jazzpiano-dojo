export function MultiSelectChips<T extends string>({
  options,
  selected,
  onChange,
  labelFor,
}: {
  options: readonly T[];
  selected: Set<T>;
  onChange: (next: Set<T>) => void;
  labelFor: (option: T) => string;
}) {
  function toggle(option: T) {
    const next = new Set(selected);
    if (next.has(option)) {
      if (next.size > 1) next.delete(option);
    } else {
      next.add(option);
    }
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.has(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              active
                ? "border-amber-400 bg-amber-400/10 text-amber-300"
                : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
            }`}
          >
            {labelFor(option)}
          </button>
        );
      })}
    </div>
  );
}
