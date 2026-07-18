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
import { useTimedSequence, type TimedNoteSpec } from "~/lib/hooks/useTimedSequence";
import { DEFAULT_PRACTICE_SCALES, SCALES, SCALE_ORDER, scaleDegreeSemitone, scaleSequence, type ScaleId } from "~/lib/theory/scales";
import { SCALE_PHRASE_PATTERNS } from "~/lib/theory/scalePhrases";
import { jazzRootName, nearestMidiForPitchClass, pc, randomPitchClass, type PitchClass } from "~/lib/theory/notes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "スケール練習 - Jazz Piano Dojo" }];
}

type Mode = "straight" | "phrase";

export default function ScalesPractice() {
  const [mode, setMode] = useState<Mode>("straight");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">スケール練習</h1>
        <p className="mt-1 text-sm text-slate-400">
          モードスケールからビバップ・オルタード系まで、指とテンポに覚え込ませましょう。
        </p>
      </div>

      <div className="inline-flex rounded-full border border-slate-800 bg-slate-900/60 p-1 text-xs">
        <button
          type="button"
          onClick={() => setMode("straight")}
          className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
            mode === "straight" ? "bg-amber-400 text-slate-900" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          スケール(順番演奏)
        </button>
        <button
          type="button"
          onClick={() => setMode("phrase")}
          className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
            mode === "phrase" ? "bg-amber-400 text-slate-900" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          フレーズ(タイミングゲーム)
        </button>
      </div>

      {mode === "straight" ? <StraightScaleTrainer /> : <ScalePhraseTrainer />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Straight scale mode: play the scale ascending (optionally + descending) in
// order, any tempo. Matching is purely sequence-based, no timing pressure.
// ---------------------------------------------------------------------------

interface StraightRound {
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

function scaleAbsoluteNotes(root: PitchClass, scaleId: ScaleId, includeDescending: boolean) {
  const intervals = scaleSequence(SCALES[scaleId]);
  const base = nearestMidiForPitchClass(root, 60);
  const ascending = intervals.map((interval) => ({ midi: base + interval, beats: 0.5 }));
  if (!includeDescending) return ascending;
  const descending = [...intervals.slice(0, -1)].reverse().map((interval) => ({ midi: base + interval, beats: 0.5 }));
  return [...ascending, ...descending];
}

function StraightScaleTrainer() {
  const { activeNotes, pressNote, releaseNote, subscribe } = useMidiContext();
  const { recordResult } = useProgressContext();
  const score = useRoundScore();
  const player = useNotePlayer();

  const [selectedScales, setSelectedScales] = useState<Set<ScaleId>>(() => new Set(DEFAULT_PRACTICE_SCALES));
  const [includeDescending, setIncludeDescending] = useState(false);
  const [round, setRound] = useState<StraightRound>(() => ({ id: 0, root: randomPitchClass(), scaleId: "ionian" }));
  const [pointer, setPointer] = useState(0);
  const [phase, setPhase] = useState<"playing" | "done">("playing");
  const [feedback, setFeedback] = useState<FeedbackKind>(null);

  const scale = SCALES[round.scaleId];
  const sequence = useMemo(
    () => buildSequence(round.root, round.scaleId, includeDescending),
    [round.root, round.scaleId, includeDescending],
  );
  const fullScalePitchClasses = useMemo(
    () => new Set(scale.intervals.map((interval) => pc(round.root + interval))),
    [scale, round.root],
  );

  const nextRound = useCallback(() => {
    const pool = selectedScales.size > 0 ? [...selectedScales] : DEFAULT_PRACTICE_SCALES;
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

      <p className="text-xs text-slate-500">
        <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: "#fef3c7" }} />
        鍵盤の薄い色がスケール全体の音、明るいオレンジが次に弾く音です。
      </p>
      <PianoKeyboard
        lowMidi={48}
        highMidi={72}
        activeNotes={activeNotes}
        targetPitchClasses={targetPc !== null ? new Set([targetPc]) : undefined}
        referencePitchClasses={fullScalePitchClasses}
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

// ---------------------------------------------------------------------------
// Phrase mode: classic scale-degree patterns (thirds, 1235 cells, etc.)
// played to a metronome count-in, graded note-by-note like the II-V-I
// trainer via the shared useTimedSequence engine.
// ---------------------------------------------------------------------------

interface PhraseRound {
  id: number;
  root: PitchClass;
  scaleId: ScaleId;
  patternId: string;
}

function computePhraseNotes(scaleId: ScaleId, root: PitchClass, patternId: string, bpm: number): TimedNoteSpec[] {
  const scale = SCALES[scaleId];
  const pattern = SCALE_PHRASE_PATTERNS.find((p) => p.id === patternId) ?? SCALE_PHRASE_PATTERNS[0];
  const steps = pattern.generate(scale.intervals.length);
  const secPerEighth = 60 / bpm / 2;
  const base = nearestMidiForPitchClass(root, 60);
  let cursor = 0;
  return steps.map((step) => {
    const note: TimedNoteSpec = {
      midi: base + scaleDegreeSemitone(scale, step.degreeIndex),
      startSec: cursor * secPerEighth,
      durSec: step.dur * secPerEighth,
    };
    cursor += step.dur;
    return note;
  });
}

function ScalePhraseTrainer() {
  const { activeNotes, pressNote, releaseNote } = useMidiContext();
  const { recordResult } = useProgressContext();
  const score = useRoundScore();
  const player = useNotePlayer();

  const [selectedScales, setSelectedScales] = useState<Set<ScaleId>>(() => new Set(DEFAULT_PRACTICE_SCALES));
  const [selectedPatterns, setSelectedPatterns] = useState<Set<string>>(
    () => new Set(SCALE_PHRASE_PATTERNS.map((p) => p.id)),
  );
  const [bpm, setBpm] = useState(100);
  const [round, setRound] = useState<PhraseRound>(() => ({
    id: 0,
    root: randomPitchClass(),
    scaleId: "ionian",
    patternId: SCALE_PHRASE_PATTERNS[0].id,
  }));
  const [feedback, setFeedback] = useState<FeedbackKind>(null);

  useEffect(() => {
    const scalePool = [...DEFAULT_PRACTICE_SCALES];
    setRound({
      id: 1,
      root: randomPitchClass(),
      scaleId: scalePool[Math.floor(Math.random() * scalePool.length)],
      patternId: SCALE_PHRASE_PATTERNS[Math.floor(Math.random() * SCALE_PHRASE_PATTERNS.length)].id,
    });
    // run once on mount to randomize the very first round
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scale = SCALES[round.scaleId];
  const pattern = SCALE_PHRASE_PATTERNS.find((p) => p.id === round.patternId) ?? SCALE_PHRASE_PATTERNS[0];
  const notes = useMemo(
    () => computePhraseNotes(round.scaleId, round.root, round.patternId, bpm),
    [round, bpm],
  );
  const fullScalePitchClasses = useMemo(
    () => new Set(scale.intervals.map((interval) => pc(round.root + interval))),
    [scale, round.root],
  );

  const handleFinish = useCallback(
    (success: boolean) => {
      setFeedback(success ? "correct" : "wrong");
      score.registerResult(success);
      recordResult("scales", success);
    },
    [score, recordResult],
  );

  const { phase, noteStates, currentIndex, start, resetIdle } = useTimedSequence(handleFinish);

  const pickRound = useCallback(() => {
    const scalePool = selectedScales.size > 0 ? [...selectedScales] : DEFAULT_PRACTICE_SCALES;
    const patternPool = selectedPatterns.size > 0 ? SCALE_PHRASE_PATTERNS.filter((p) => selectedPatterns.has(p.id)) : SCALE_PHRASE_PATTERNS;
    const scaleId = scalePool[Math.floor(Math.random() * scalePool.length)];
    const patternId = patternPool[Math.floor(Math.random() * patternPool.length)].id;
    setRound((prev) => ({ id: prev.id + 1, root: randomPitchClass(), scaleId, patternId }));
    setFeedback(null);
    resetIdle();
  }, [selectedScales, selectedPatterns, resetIdle]);

  function playDemo() {
    player.playSequence(
      notes.map((n) => ({ midi: n.midi, beats: n.durSec * (bpm / 60) })),
      bpm,
    );
  }

  function startRun() {
    setFeedback(null);
    start(notes, bpm);
  }

  const targetPitchClasses = currentIndex >= 0 ? new Set([pc(notes[currentIndex].midi)]) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ScoreHud correct={score.correct} total={score.total} streak={score.streak} bestStreak={score.bestStreak} />
        <FeedbackBanner kind={feedback} />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">
          {jazzRootName(round.root)} {scale.nameJa} ・ {pattern.nameJa}
        </p>
        <p className="mx-auto mt-2 max-w-lg text-xs text-slate-500">{pattern.descriptionJa}</p>

        <div className="mt-4 flex flex-wrap justify-center gap-1">
          {notes.map((n, idx) => {
            const state = noteStates[idx];
            const isCurrent = idx === currentIndex;
            return (
              <span
                key={idx}
                className={`flex h-9 min-w-9 items-center justify-center rounded-md border px-1 text-xs font-semibold text-slate-200 ${
                  isCurrent
                    ? "border-amber-400 bg-amber-400/20 scale-110"
                    : state === "hit"
                    ? "border-emerald-600 bg-emerald-400/10"
                    : state === "miss"
                    ? "border-red-600 bg-red-400/10"
                    : "border-slate-700 bg-slate-800/60"
                }`}
              >
                {jazzRootName(pc(n.midi))}
              </span>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={playDemo}
            disabled={phase === "countIn" || phase === "playing"}
            className="rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-300 hover:border-amber-400 hover:text-amber-300 disabled:opacity-40"
          >
            🔊 お手本を聞く
          </button>
          <button
            type="button"
            onClick={startRun}
            disabled={phase === "countIn" || phase === "playing"}
            className="rounded-full bg-amber-400 px-5 py-1.5 text-xs font-semibold text-slate-900 hover:bg-amber-300 disabled:opacity-40"
          >
            {phase === "countIn" ? "カウントイン中…" : phase === "playing" ? "演奏中…" : "▶ スタート"}
          </button>
          <button
            type="button"
            onClick={pickRound}
            className="rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-300 hover:border-slate-500"
          >
            🔀 別のフレーズ
          </button>
        </div>
      </div>

      <PianoKeyboard
        lowMidi={43}
        highMidi={91}
        activeNotes={activeNotes}
        targetPitchClasses={targetPitchClasses}
        referencePitchClasses={fullScalePitchClasses}
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
          <div>
            <p className="mb-2 text-xs text-slate-500">出題するフレーズパターン</p>
            <MultiSelectChips
              options={SCALE_PHRASE_PATTERNS.map((p) => p.id)}
              selected={selectedPatterns}
              onChange={setSelectedPatterns}
              labelFor={(id: string) => SCALE_PHRASE_PATTERNS.find((p) => p.id === id)?.nameJa ?? id}
            />
          </div>
          <div>
            <p className="mb-2 text-xs text-slate-500">テンポ: {bpm} BPM</p>
            <input
              type="range"
              min={60}
              max={160}
              step={5}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>
        </div>
      </details>
    </div>
  );
}
