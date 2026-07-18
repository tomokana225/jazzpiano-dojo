import { useCallback, useEffect, useMemo, useState } from "react";
import type { Route } from "./+types/scales";
import { PianoKeyboard } from "~/components/PianoKeyboard";
import { ScoreHud } from "~/components/ScoreHud";
import { FeedbackBanner, type FeedbackKind } from "~/components/FeedbackBanner";
import { MultiSelectChips } from "~/components/MultiSelectChips";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { useProgressContext } from "~/lib/context/ProgressProvider";
import { useRoundScore } from "~/lib/hooks/useRoundScore";
import { useNotePlayer } from "~/lib/hooks/useSynth";
import { SCALES, SCALE_ORDER, scaleSequence, type ScaleId } from "~/lib/theory/scales";
import { jazzRootName, nearestMidiForPitchClass, pc, randomPitchClass, type PitchClass } from "~/lib/theory/notes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "スケール練習 - Jazz Piano Dojo" }];
}

const DEFAULT_SCALES: ScaleId[] = ["ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"];

interface Round {
  id: number;
  root: PitchClass;
  scaleId: ScaleId;
}

function buildSequence(root: PitchClass, scaleId: ScaleId, includeDescending: boolean): PitchClass[] {
  const ascending = scaleSequence(SCALES[scaleId]).map((interval) => pc(root + interval));
  if (!includeDescending) return ascending;
  const descending = [...ascending.slice(0, -1)].reverse();
  return [...ascending, ...descending];
}

export default function ScalesPractice() {
  const { activeNotes, pressNote, releaseNote, subscribe } = useMidiContext();
  const { recordResult } = useProgressContext();
  const score = useRoundScore();
  const player = useNotePlayer();

  const [selectedScales, setSelectedScales] = useState<Set<ScaleId>>(() => new Set(DEFAULT_SCALES));
  const [includeDescending, setIncludeDescending] = useState(false);
  const [round, setRound] = useState<Round>(() => ({ id: 0, root: randomPitchClass(), scaleId: "ionian" }));
  const [pointer, setPointer] = useState(0);
  const [phase, setPhase] = useState<"playing" | "done">("playing");
  const [feedback, setFeedback] = useState<FeedbackKind>(null);

  const scale = SCALES[round.scaleId];
  const sequence = useMemo(
    () => buildSequence(round.root, round.scaleId, includeDescending),
    [round.root, round.scaleId, includeDescending],
  );

  const nextRound = useCallback(() => {
    const pool = selectedScales.size > 0 ? [...selectedScales] : DEFAULT_SCALES;
    const scaleId = pool[Math.floor(Math.random() * pool.length)];
    setRound((prev) => ({ id: prev.id + 1, root: randomPitchClass(), scaleId }));
    setPointer(0);
    setPhase("playing");
    setFeedback(null);
  }, [selectedScales]);

  const finishRound = useCallback(
    (correct: boolean) => {
      if (phase !== "playing") return;
      setPhase("done");
      setFeedback(correct ? "correct" : "wrong");
      score.registerResult(correct);
      recordResult("scales", correct);
      window.setTimeout(nextRound, correct ? 900 : 1600);
    },
    [phase, score, recordResult, nextRound],
  );

  // Note-on events only update `pointer` here (pure state update); the
  // effect below reacts to the resulting pointer value and triggers the
  // round-ending side effects exactly once. Side effects must never live
  // inside a setState updater — React may invoke updaters more than once
  // (e.g. under StrictMode), which would double-count the score.
  useEffect(() => {
    if (phase !== "playing") return;
    const unsubscribe = subscribe((event) => {
      if (event.type !== "on") return;
      setPointer((current) => {
        if (current < 0 || current >= sequence.length) return current;
        const expected = sequence[current];
        if (pc(event.note) !== expected) return -1;
        return current + 1;
      });
    });
    return unsubscribe;
  }, [phase, subscribe, sequence]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (pointer < 0) finishRound(false);
    else if (pointer >= sequence.length) finishRound(true);
  }, [pointer, phase, sequence, finishRound]);

  function playPreview() {
    player.playSequence(scaleAbsoluteNotes(round.root, round.scaleId, includeDescending), 140);
  }

  const targetPc = phase === "playing" && pointer >= 0 ? sequence[pointer] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">スケール練習</h1>
        <p className="mt-1 text-sm text-slate-400">
          表示されたスケールをルートから順番に演奏してください。ハイライトされている鍵盤が次に弾く音です。
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ScoreHud correct={score.correct} total={score.total} streak={score.streak} bestStreak={score.bestStreak} />
        <FeedbackBanner kind={feedback} />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">Target Scale</p>
        <p className="mt-2 text-4xl font-bold text-amber-300">
          {jazzRootName(round.root)} {scale.nameJa}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {scale.nameEn} ・ 主な使用場面: {scale.usageJa}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {sequence.map((p, idx) => (
            <span
              key={idx}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                idx < pointer
                  ? "bg-emerald-400/20 text-emerald-300"
                  : idx === pointer && phase === "playing"
                  ? "bg-amber-400 text-slate-900"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {jazzRootName(p)}
            </span>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={playPreview}
            className="rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-300 hover:border-amber-400 hover:text-amber-300"
          >
            🔊 お手本を聞く
          </button>
          <button
            type="button"
            onClick={nextRound}
            className="rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-300 hover:border-slate-500"
          >
            ⏭ スキップ
          </button>
        </div>
      </div>

      <PianoKeyboard
        lowMidi={48}
        highMidi={72}
        activeNotes={activeNotes}
        targetPitchClasses={targetPc !== null ? new Set([targetPc]) : undefined}
        onNoteDown={pressNote}
        onNoteUp={releaseNote}
      />

      <details className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400" open>
        <summary className="cursor-pointer select-none font-semibold text-slate-200">練習設定</summary>
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-xs text-slate-500">出題するスケール</p>
            <MultiSelectChips
              options={SCALE_ORDER}
              selected={selectedScales}
              onChange={setSelectedScales}
              labelFor={(id) => SCALES[id].nameJa}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={includeDescending}
              onChange={(e) => setIncludeDescending(e.target.checked)}
              className="h-3.5 w-3.5 accent-amber-400"
            />
            上行だけでなく下行も演奏する
          </label>
        </div>
      </details>
    </div>
  );
}

function scaleAbsoluteNotes(root: PitchClass, scaleId: ScaleId, includeDescending: boolean) {
  const intervals = scaleSequence(SCALES[scaleId]);
  const base = nearestMidiForPitchClass(root, 60);
  const ascending = intervals.map((interval) => ({ midi: base + interval, beats: 0.5 }));
  if (!includeDescending) return ascending;
  const descending = [...intervals.slice(0, -1)].reverse().map((interval) => ({ midi: base + interval, beats: 0.5 }));
  return [...ascending, ...descending];
}
