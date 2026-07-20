import { useEffect, useState } from "react";
import { STANDARDS, type Standard } from "~/lib/theory/standards";
import { parseChordProgression } from "~/lib/theory/chordSymbolParser";
import { useCustomProgressions, type SavedProgression } from "~/lib/hooks/useCustomProgressions";

type Source = "builtin" | "custom";

export interface ProgressionPickerProps {
  onChange: (standard: Standard) => void;
  disabled?: boolean;
}

function buildCustomStandard(name: string, chords: Standard["chords"]): Standard {
  const title = name.trim() || "カスタム進行";
  return {
    id: `custom-${Date.now()}`,
    titleJa: title,
    titleEn: title,
    key: chords[0]?.root ?? 0,
    suggestedBpm: 120,
    descriptionJa: "自分で入力したコード進行。",
    chords,
  };
}

/**
 * Lets the learner pick either a built-in STANDARDS entry or type/paste their
 * own chord progression (e.g. "Cmaj7 | A7 | Dm7 | G7"), producing a
 * `Standard` either way so callers (backing-track playback, chord-scale
 * suggestions, comping/substitution practice) don't need to know which
 * source it came from.
 */
export function ProgressionPicker({ onChange, disabled }: ProgressionPickerProps) {
  const [source, setSource] = useState<Source>("builtin");
  const [builtinId, setBuiltinId] = useState(STANDARDS[0].id);
  const [customName, setCustomName] = useState("");
  const [customText, setCustomText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const { saved, save, remove } = useCustomProgressions();

  // Apply the default builtin selection once on mount so the parent always
  // starts with a valid `Standard`, mirroring the mount-time randomize
  // pattern used elsewhere in this app (e.g. ii-v-i.tsx).
  useEffect(() => {
    onChange(STANDARDS[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectBuiltin(id: string) {
    setBuiltinId(id);
    onChange(STANDARDS.find((s) => s.id === id) ?? STANDARDS[0]);
  }

  function applyCustomText() {
    const result = parseChordProgression(customText);
    if (!result.ok) {
      setErrors(result.errors.map((e) => (e.token ? `"${e.token}": ${e.message}` : e.message)));
      return;
    }
    setErrors([]);
    onChange(buildCustomStandard(customName, result.chords));
  }

  function applySaved(entry: SavedProgression) {
    setCustomName(entry.name);
    setCustomText(entry.rawText);
    setErrors([]);
    onChange(entry.standard);
  }

  function saveCurrent() {
    const result = parseChordProgression(customText);
    if (!result.ok) {
      setErrors(result.errors.map((e) => (e.token ? `"${e.token}": ${e.message}` : e.message)));
      return;
    }
    save(customName.trim() || "カスタム進行", customText, buildCustomStandard(customName, result.chords));
  }

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-1 text-xs">
        <button
          type="button"
          onClick={() => setSource("builtin")}
          className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
            source === "builtin" ? "bg-brass-400 text-slate-900" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          組み込みスタンダード
        </button>
        <button
          type="button"
          onClick={() => setSource("custom")}
          className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
            source === "custom" ? "bg-brass-400 text-slate-900" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          カスタム入力
        </button>
      </div>

      {source === "builtin" && (
        <select
          value={builtinId}
          disabled={disabled}
          onChange={(e) => selectBuiltin(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
        >
          {STANDARDS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.titleJa}
            </option>
          ))}
        </select>
      )}

      {source === "custom" && (
        <div className="max-w-md space-y-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            disabled={disabled}
            placeholder="進行の名前(任意)"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
          />
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            disabled={disabled}
            rows={3}
            placeholder="例: Cmaj7 | A7 | Dm7 | G7"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
          />
          {errors.length > 0 && (
            <ul className="space-y-0.5 text-xs text-red-400">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyCustomText}
              disabled={disabled}
              className="rounded-full bg-brass-400 px-4 py-1.5 text-xs font-semibold text-slate-900 hover:bg-brass-300 disabled:opacity-40"
            >
              反映
            </button>
            <button
              type="button"
              onClick={saveCurrent}
              disabled={disabled || customText.trim().length === 0}
              className="rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-300 hover:border-slate-500 disabled:opacity-40"
            >
              保存
            </button>
          </div>
          {saved.length > 0 && (
            <div>
              <p className="text-xs text-slate-500">保存済み</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {saved.map((entry) => (
                  <span
                    key={entry.id}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300"
                  >
                    <button type="button" onClick={() => applySaved(entry)} disabled={disabled} className="hover:text-brass-300">
                      {entry.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(entry.id)}
                      disabled={disabled}
                      className="text-slate-500 hover:text-red-400"
                      aria-label={`${entry.name}を削除`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
