import { useCallback, useEffect, useMemo, useState } from "react";
import { SkipForward, Volume2 } from "lucide-react";
import type { Route } from "./+types/chords";
import { PianoKeyboard } from "~/components/PianoKeyboard";
import { RootPicker } from "~/components/RootPicker";
import { ScoreHud } from "~/components/ScoreHud";
import { FeedbackBanner, type FeedbackKind } from "~/components/FeedbackBanner";
import { MultiSelectChips } from "~/components/MultiSelectChips";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { useProgressContext } from "~/lib/context/ProgressProvider";
import { useRoundScore } from "~/lib/hooks/useRoundScore";
import { useRoundTimer } from "~/lib/hooks/useRoundTimer";
import { useNotePlayer } from "~/lib/hooks/useSynth";
import {
  CHORD_QUALITIES,
  SEVENTH_CHORD_QUALITIES,
  chordSymbol,
  chordToneDegrees,
  chordTones,
  type ChordQualityId,
} from "~/lib/theory/chords";
import { closeVoicingMidi } from "~/lib/theory/voicings";
import { jazzRootName, pc, randomPitchClass, type PitchClass } from "~/lib/theory/notes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "コード練習 - Jazz Piano Dojo" }];
}

const ALL_CHORD_QUALITIES = Object.keys(CHORD_QUALITIES) as ChordQualityId[];

type Mode = "explore" | "quiz";

const MODE_TABS: { id: Mode; label: string }[] = [
  { id: "explore", label: "コードを選んで表示" },
  { id: "quiz", label: "クイズ" },
];

export default function ChordsPractice() {
  const [mode, setMode] = useState<Mode>("explore");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">コード練習</h1>
        <p className="mt-1 text-sm text-slate-400">
          コードネームを選んで鍵盤上の構成音を確認したり、クイズ形式で覚えたコードを試したりできます。
        </p>
      </div>

      <div className="inline-flex flex-wrap rounded-full border border-slate-800 bg-slate-900/60 p-1 text-xs">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
              mode === tab.id ? "bg-brass-400 text-slate-900" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "explore" && <ChordExplorer />}
      {mode === "quiz" && <ChordQuizTrainer />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Explore mode (default): pick a root + chord quality and see it laid out on
// the keyboard at your own pace — no quiz, no timer.
// ---------------------------------------------------------------------------

const EXPLORE_LOW = 48;
const EXPLORE_HIGH = 72;

/** Degree label ("R", "b3", "5"...) for every occurrence of the chord's tones across the visible keyboard range. */
function chordNoteLabels(root: PitchClass, quality: ChordQualityId, lowMidi: number, highMidi: number): Map<number, string> {
  const q = CHORD_QUALITIES[quality];
  const degreeByOffset = new Map(q.intervals.map((interval, idx) => [pc(root + interval), q.degrees[idx]]));
  const map = new Map<number, string>();
  for (let midi = lowMidi; midi <= highMidi; midi++) {
    const label = degreeByOffset.get(pc(midi));
    if (label !== undefined) map.set(midi, label);
  }
  return map;
}

function ChordExplorer() {
  const { activeNotes, pressNote, releaseNote } = useMidiContext();
  const player = useNotePlayer();
  const [root, setRoot] = useState<PitchClass>(0);
  const [quality, setQuality] = useState<ChordQualityId>("maj7");

  const spec = { root, quality };
  const targetPitchClasses = useMemo(() => new Set(chordTones(spec)), [root, quality]);
  const degrees = useMemo(() => chordToneDegrees(spec), [root, quality]);
  const noteLabels = useMemo(() => chordNoteLabels(root, quality, EXPLORE_LOW, EXPLORE_HIGH), [root, quality]);

  function playPreview() {
    player.playChord(closeVoicingMidi(root, CHORD_QUALITIES[quality].intervals, 60));
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs text-slate-500">ルート</p>
            <RootPicker value={root} onChange={setRoot} />
          </div>
          <div>
            <p className="mb-2 text-xs text-slate-500">コードクオリティ</p>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as ChordQualityId)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"
            >
              {ALL_CHORD_QUALITIES.map((q) => (
                <option key={q} value={q}>
                  {CHORD_QUALITIES[q].labelJa} ({CHORD_QUALITIES[q].suffix || "triad"})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-widest text-slate-500">Selected Chord</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-brass-300">
            {jazzRootName(root)}{CHORD_QUALITIES[quality].suffix}
          </p>
          <p className="mt-1 text-sm text-slate-400">{CHORD_QUALITIES[quality].labelJa}</p>
          <p className="mt-3 text-sm text-slate-300">構成音: {degrees.map((d) => d.degree).join(" - ")}</p>
          <Button
            onClick={playPreview}
            className="mt-4"
            icon={<Volume2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />}
          >
            音を聞く
          </Button>
        </div>
      </Card>

      <p className="text-xs text-slate-500">
        ハイライトされた鍵盤がこのコードの構成音です。実際に弾いてみましょう — 合っていれば緑、違う音は赤になります。鍵盤上の数字はルートから見た度数です。
      </p>
      <PianoKeyboard
        lowMidi={EXPLORE_LOW}
        highMidi={EXPLORE_HIGH}
        activeNotes={activeNotes}
        targetPitchClasses={targetPitchClasses}
        noteLabels={noteLabels}
        onNoteDown={pressNote}
        onNoteUp={releaseNote}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quiz mode: random chord, matched by playing the exact tones.
// ---------------------------------------------------------------------------

const TIME_LIMITS = [0, 12000, 8000, 5000] as const;
const TIME_LIMIT_LABELS: Record<number, string> = {
  0: "タイマーなし",
  12000: "12秒",
  8000: "8秒",
  5000: "5秒",
};

interface Round {
  id: number;
  root: PitchClass;
  quality: ChordQualityId;
}

function randomRound(qualities: ChordQualityId[], prevId: number): Round {
  const quality = qualities[Math.floor(Math.random() * qualities.length)];
  return { id: prevId + 1, root: randomPitchClass(), quality };
}

function ChordQuizTrainer() {
  const { activeNotes, pressNote, releaseNote } = useMidiContext();
  const { recordResult } = useProgressContext();
  const score = useRoundScore();
  const player = useNotePlayer();

  const [selectedQualities, setSelectedQualities] = useState<Set<ChordQualityId>>(
    () => new Set(SEVENTH_CHORD_QUALITIES),
  );
  const [timeLimitMs, setTimeLimitMs] = useState<number>(0);
  const [round, setRound] = useState<Round>(() => randomRound([...SEVENTH_CHORD_QUALITIES], 0));
  const [phase, setPhase] = useState<"playing" | "done">("playing");
  const [feedback, setFeedback] = useState<FeedbackKind>(null);

  const spec = { root: round.root, quality: round.quality };
  const targetTones = useMemo(() => chordTones(spec), [round.root, round.quality]);
  const targetPitchClasses = useMemo(() => new Set(targetTones), [targetTones]);
  const degrees = useMemo(() => chordToneDegrees(spec), [round.root, round.quality]);

  const nextRound = useCallback(() => {
    const pool = selectedQualities.size > 0 ? [...selectedQualities] : [...SEVENTH_CHORD_QUALITIES];
    setRound((prev) => randomRound(pool, prev.id));
    setPhase("playing");
    setFeedback(null);
  }, [selectedQualities]);

  const finishRound = useCallback(
    (correct: boolean) => {
      if (phase !== "playing") return;
      setPhase("done");
      setFeedback(correct ? "correct" : "wrong");
      score.registerResult(correct);
      recordResult("chords", correct);
      window.setTimeout(nextRound, correct ? 900 : 1400);
    },
    [phase, score, recordResult, nextRound],
  );

  useEffect(() => {
    if (phase !== "playing") return;
    const activePcs = new Set([...activeNotes].map(pc));
    if (activePcs.size === 0) return;
    if (activePcs.size !== targetPitchClasses.size) return;
    const matches = [...activePcs].every((p) => targetPitchClasses.has(p));
    if (matches) finishRound(true);
  }, [activeNotes, targetPitchClasses, phase, finishRound]);

  const remainingMs = useRoundTimer(phase === "playing" && timeLimitMs > 0, timeLimitMs || 1, round.id, () =>
    finishRound(false),
  );

  function playPreview() {
    player.playChord(closeVoicingMidi(round.root, CHORD_QUALITIES[round.quality].intervals, 60));
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        表示されたコードシンボルを、MIDIキーボード(または下の鍵盤クリック)でどのオクターブ・展開形でもよいので押さえてください。
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ScoreHud correct={score.correct} total={score.total} streak={score.streak} bestStreak={score.bestStreak} />
        <FeedbackBanner kind={feedback} />
      </div>

      <Card className="p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">Target Chord</p>
        <p className="mt-2 text-5xl font-bold tracking-tight text-brass-300">{chordSymbol(spec)}</p>
        <p className="mt-2 text-sm text-slate-400">
          {CHORD_QUALITIES[round.quality].labelJa} ・ 構成音: {degrees.map((d) => d.degree).join(" - ")}
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button onClick={playPreview} icon={<Volume2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />}>
            音を聞く
          </Button>
          <Button onClick={nextRound} icon={<SkipForward className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />}>
            スキップ
          </Button>
        </div>
        {timeLimitMs > 0 && phase === "playing" && (
          <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-brass-400 transition-[width] duration-100 linear"
              style={{ width: `${(remainingMs / timeLimitMs) * 100}%` }}
            />
          </div>
        )}
      </Card>

      <PianoKeyboard
        lowMidi={48}
        highMidi={72}
        activeNotes={activeNotes}
        targetPitchClasses={targetPitchClasses}
        onNoteDown={pressNote}
        onNoteUp={releaseNote}
      />

      <details className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400" open>
        <summary className="cursor-pointer select-none font-semibold text-slate-200">練習設定</summary>
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-xs text-slate-500">出題するコードクオリティ</p>
            <MultiSelectChips
              options={Object.keys(CHORD_QUALITIES) as ChordQualityId[]}
              selected={selectedQualities}
              onChange={setSelectedQualities}
              labelFor={(q) => `${CHORD_QUALITIES[q].labelJa} (${CHORD_QUALITIES[q].suffix || "triad"})`}
            />
          </div>
          <div>
            <p className="mb-2 text-xs text-slate-500">タイムアタック</p>
            <div className="flex gap-2">
              {TIME_LIMITS.map((ms) => (
                <button
                  key={ms}
                  type="button"
                  onClick={() => setTimeLimitMs(ms)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    timeLimitMs === ms
                      ? "border-brass-400 bg-brass-400/10 text-brass-300"
                      : "border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {TIME_LIMIT_LABELS[ms]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
