import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "./+types/identify";
import { PianoKeyboard } from "~/components/PianoKeyboard";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { useProgressContext } from "~/lib/context/ProgressProvider";
import { chordSymbol } from "~/lib/theory/chords";
import { candidateScales, identifyChords, identifyScales } from "~/lib/theory/identify";
import { jazzRootName, pc, type PitchClass } from "~/lib/theory/notes";
import { SCALES, type ScaleId } from "~/lib/theory/scales";

export function meta({}: Route.MetaArgs) {
  return [{ title: "逆引き練習 - Jazz Piano Dojo" }];
}

type Mode = "chords" | "scales";

export default function IdentifyPractice() {
  const [mode, setMode] = useState<Mode>("chords");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">逆引き練習</h1>
        <p className="mt-1 text-sm text-slate-400">
          いつもと逆方向。まず自分でコードやスケールを弾いて、それが何なのかアプリに当ててもらいましょう。
        </p>
      </div>

      <div className="inline-flex rounded-full border border-slate-800 bg-slate-900/60 p-1 text-xs">
        <button
          type="button"
          onClick={() => setMode("chords")}
          className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
            mode === "chords" ? "bg-amber-400 text-slate-900" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          コード当て
        </button>
        <button
          type="button"
          onClick={() => setMode("scales")}
          className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
            mode === "scales" ? "bg-amber-400 text-slate-900" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          スケール当て
        </button>
      </div>

      {mode === "chords" ? <ChordIdentifyTrainer /> : <ScaleIdentifyTrainer />}
    </div>
  );
}

function DiscoveryToast({ text }: { text: string | null }) {
  if (!text) return <div className="h-9" />;
  return (
    <div className="flex h-9 items-center gap-2 rounded-lg bg-emerald-400/15 px-3 text-sm font-semibold text-emerald-300">
      🎉 {text}
    </div>
  );
}

function ChordIdentifyTrainer() {
  const { activeNotes, pressNote, releaseNote } = useMidiContext();
  const { recordResult } = useProgressContext();
  const [discovered, setDiscovered] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const heldPitchClasses = useMemo(() => new Set([...activeNotes].map(pc)), [activeNotes]);
  const matches = useMemo(() => identifyChords(heldPitchClasses), [heldPitchClasses]);
  const symbols = useMemo(() => [...new Set(matches.map((m) => chordSymbol(m)))], [matches]);

  useEffect(() => {
    const newOnes = symbols.filter((s) => !discovered.has(s));
    if (newOnes.length === 0) return;
    setDiscovered((prev) => new Set([...prev, ...newOnes]));
    recordResult("identify", true);
    setToast(`新しいコードを発見: ${newOnes.join(" / ")}`);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
    // discovered is intentionally excluded: this effect only reacts to `symbols`,
    // re-deriving "newOnes" against the latest discovered set each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols, recordResult]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-300">
          <span className="mr-1.5 text-slate-500">発見したコード</span>
          <span className="font-semibold text-amber-300">{discovered.size}</span>
        </div>
        <DiscoveryToast text={toast} />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">Now Holding</p>
        <p className="mt-2 min-h-10 text-lg text-slate-300">
          {heldPitchClasses.size > 0 ? [...heldPitchClasses].map((p) => jazzRootName(p)).join(" - ") : "鍵盤で3和音以上を弾いてください"}
        </p>
        <p className="mt-3 text-xs uppercase tracking-widest text-slate-500">Recognized As</p>
        <p className="mt-2 text-4xl font-bold text-amber-300">
          {symbols.length > 0 ? symbols.join(" / ") : heldPitchClasses.size >= 3 ? "認識できるコードがありません" : "—"}
        </p>
      </div>

      <PianoKeyboard lowMidi={41} highMidi={79} activeNotes={activeNotes} onNoteDown={pressNote} onNoteUp={releaseNote} />

      {discovered.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[...discovered].map((s) => (
            <span key={s} className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ScaleIdentifyTrainer() {
  const { activeNotes, pressNote, releaseNote, subscribe } = useMidiContext();
  const { recordResult } = useProgressContext();
  const [playedSequence, setPlayedSequence] = useState<PitchClass[]>([]);
  const [discovered, setDiscovered] = useState<Set<ScaleId>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return subscribe((event) => {
      if (event.type !== "on") return;
      setPlayedSequence((prev) => (prev.includes(pc(event.note)) ? prev : [...prev, pc(event.note)]));
    });
  }, [subscribe]);

  const root = playedSequence[0] ?? null;
  const heldPitchClasses = useMemo(() => new Set(playedSequence), [playedSequence]);
  const exactMatches = useMemo(
    () => (root !== null ? identifyScales(root, heldPitchClasses) : []),
    [root, heldPitchClasses],
  );
  const candidates = useMemo(
    () => (root !== null ? candidateScales(root, heldPitchClasses) : []),
    [root, heldPitchClasses],
  );
  const matchLabels = useMemo(
    () => exactMatches.map((m) => `${jazzRootName(m.root)} ${SCALES[m.scaleId].nameJa}`),
    [exactMatches],
  );

  useEffect(() => {
    const newOnes = exactMatches.map((m) => m.scaleId).filter((id) => !discovered.has(id));
    if (newOnes.length === 0) return;
    setDiscovered((prev) => new Set([...prev, ...newOnes]));
    recordResult("identify", true);
    setToast(`一致: ${matchLabels.join(" / ")}`);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exactMatches, matchLabels, recordResult]);

  function reset() {
    setPlayedSequence([]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-300">
          <span className="mr-1.5 text-slate-500">発見したスケール</span>
          <span className="font-semibold text-amber-300">{discovered.size}</span>
        </div>
        <DiscoveryToast text={toast} />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">
          {root !== null ? `ルート: ${jazzRootName(root)}` : "最初に弾いた音がルートになります"}
        </p>
        <p className="mt-2 min-h-8 text-lg text-slate-300">
          {playedSequence.length > 0 ? playedSequence.map((p) => jazzRootName(p)).join(" - ") : "自由にスケールを弾いてみてください"}
        </p>

        {exactMatches.length > 0 ? (
          <p className="mt-3 text-3xl font-bold text-amber-300">{matchLabels.join(" / ")}</p>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            {playedSequence.length === 0
              ? "音を弾くと候補が絞り込まれていきます"
              : `候補: ${candidates.length}個のスケールと一致 (${candidates.map((id) => SCALES[id].nameJa).slice(0, 3).join("、")}${candidates.length > 3 ? "…" : ""})`}
          </p>
        )}

        <div className="mt-4">
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-300 hover:border-slate-500"
          >
            🔄 リセット
          </button>
        </div>
      </div>

      <PianoKeyboard
        lowMidi={41}
        highMidi={79}
        activeNotes={activeNotes}
        referencePitchClasses={heldPitchClasses}
        onNoteDown={pressNote}
        onNoteUp={releaseNote}
      />

      {discovered.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[...discovered].map((id) => (
            <span key={id} className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300">
              {SCALES[id].nameJa}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
