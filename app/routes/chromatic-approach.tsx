import { useCallback, useEffect, useMemo, useState } from "react";
import { SkipForward, Volume2 } from "lucide-react";
import type { Route } from "./+types/chromatic-approach";
import { PianoKeyboard } from "~/components/PianoKeyboard";
import { ScoreHud } from "~/components/ScoreHud";
import { FeedbackBanner, type FeedbackKind } from "~/components/FeedbackBanner";
import { MultiSelectChips } from "~/components/MultiSelectChips";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { useProgressContext } from "~/lib/context/ProgressProvider";
import { useRoundScore } from "~/lib/hooks/useRoundScore";
import { useNotePlayer } from "~/lib/hooks/useSynth";
import { CHORD_QUALITIES, SEVENTH_CHORD_QUALITIES, chordSymbol, type ChordQualityId } from "~/lib/theory/chords";
import {
  APPROACH_PATTERNS,
  APPROACH_PATTERN_ORDER,
  DEFAULT_APPROACH_PATTERNS,
  type ApproachPatternId,
} from "~/lib/theory/chromaticApproach";
import { jazzRootName, nearestMidiForPitchClass, pc, randomPitchClass, type PitchClass } from "~/lib/theory/notes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "クロマチックアプローチ練習 - Jazz Piano Dojo" }];
}

const ANCHOR_MIDI = 62;

interface ApproachRound {
  id: number;
  root: PitchClass;
  quality: ChordQualityId;
  degreeIndex: number;
  patternId: ApproachPatternId;
}

function randomRound(qualities: ChordQualityId[], patterns: ApproachPatternId[], prevId: number): ApproachRound {
  const quality = qualities[Math.floor(Math.random() * qualities.length)];
  const degreeCount = CHORD_QUALITIES[quality].intervals.length;
  const degreeIndex = Math.floor(Math.random() * degreeCount);
  const patternId = patterns[Math.floor(Math.random() * patterns.length)];
  return { id: prevId + 1, root: randomPitchClass(), quality, degreeIndex, patternId };
}

function targetPitchClass(round: ApproachRound): PitchClass {
  const q = CHORD_QUALITIES[round.quality];
  return pc(round.root + q.intervals[round.degreeIndex]);
}

function approachSequence(round: ApproachRound): PitchClass[] {
  const target = targetPitchClass(round);
  const pattern = APPROACH_PATTERNS[round.patternId];
  return pattern.offsets.map((o) => pc(target + o));
}

/** Places a pitch-class sequence into a natural stepwise melody: each note is placed nearest to the previous one. */
function toWalkingMidiSequence(pcs: PitchClass[], anchor: number): number[] {
  let prev = anchor;
  return pcs.map((p) => {
    const m = nearestMidiForPitchClass(p, prev);
    prev = m;
    return m;
  });
}

export default function ChromaticApproachTrainer() {
  const { activeNotes, pressNote, releaseNote, subscribe } = useMidiContext();
  const { recordResult } = useProgressContext();
  const score = useRoundScore();
  const player = useNotePlayer();

  const [selectedQualities, setSelectedQualities] = useState<Set<ChordQualityId>>(
    () => new Set(SEVENTH_CHORD_QUALITIES),
  );
  const [selectedPatterns, setSelectedPatterns] = useState<Set<ApproachPatternId>>(
    () => new Set(DEFAULT_APPROACH_PATTERNS),
  );
  const [round, setRound] = useState<ApproachRound>(() =>
    randomRound([...SEVENTH_CHORD_QUALITIES], DEFAULT_APPROACH_PATTERNS, 0),
  );
  const [pointer, setPointer] = useState(0);
  const [phase, setPhase] = useState<"playing" | "done">("playing");
  const [feedback, setFeedback] = useState<FeedbackKind>(null);

  const pattern = APPROACH_PATTERNS[round.patternId];
  const quality = CHORD_QUALITIES[round.quality];
  const target = useMemo(() => targetPitchClass(round), [round]);
  const sequence = useMemo(() => approachSequence(round), [round]);
  const chordPcs = useMemo(
    () => new Set(quality.intervals.map((iv) => pc(round.root + iv))),
    [quality, round.root],
  );

  const nextRound = useCallback(() => {
    const qualities = selectedQualities.size > 0 ? [...selectedQualities] : [...SEVENTH_CHORD_QUALITIES];
    const patterns = selectedPatterns.size > 0 ? [...selectedPatterns] : DEFAULT_APPROACH_PATTERNS;
    setRound((prev) => randomRound(qualities, patterns, prev.id));
    setPointer(0);
    setPhase("playing");
    setFeedback(null);
  }, [selectedQualities, selectedPatterns]);

  const finishRound = useCallback(
    (correct: boolean) => {
      if (phase !== "playing") return;
      setPhase("done");
      setFeedback(correct ? "correct" : "wrong");
      score.registerResult(correct);
      recordResult("chromatic-approach", correct);
      window.setTimeout(nextRound, correct ? 900 : 1600);
    },
    [phase, score, recordResult, nextRound],
  );

  // Note-on events only update `pointer` here (pure state update); the
  // effect below reacts to the resulting pointer value and triggers the
  // round-ending side effects exactly once (see scales.tsx for the same
  // pattern and why side effects must never live inside a setState updater).
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
    const midiSeq = toWalkingMidiSequence(sequence, ANCHOR_MIDI);
    player.playSequence(
      midiSeq.map((midi) => ({ midi, beats: 0.5 })),
      130,
    );
  }

  const targetPc = phase === "playing" && pointer >= 0 && pointer < sequence.length ? sequence[pointer] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">クロマチックアプローチ練習</h1>
        <p className="mt-1 text-sm text-slate-400">
          コードトーンへ半音(や全音)で寄り道してから着地する、アドリブの基本語法を練習します。エンクロージャー(囲い込み)も含みます。
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ScoreHud correct={score.correct} total={score.total} streak={score.streak} bestStreak={score.bestStreak} />
        <FeedbackBanner kind={feedback} />
      </div>

      <Card className="p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">Target Chord</p>
        <p className="mt-2 text-4xl font-bold tracking-tight text-brass-300">{chordSymbol(round)}</p>
        <p className="mt-1 text-sm text-slate-300">
          ターゲット音: {jazzRootName(target)} ({quality.degrees[round.degreeIndex]})
        </p>
        <p className="mt-3 text-base font-semibold text-slate-200">{pattern.nameJa}</p>
        <p className="mx-auto mt-1 max-w-lg text-xs text-slate-500">{pattern.descriptionJa}</p>

        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {sequence.map((p, idx) => {
            const isTarget = idx === sequence.length - 1;
            return (
              <span
                key={idx}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${
                  isTarget ? "ring-2 ring-brass-500" : ""
                } ${
                  idx < pointer
                    ? "bg-emerald-400/20 text-emerald-300"
                    : idx === pointer && phase === "playing"
                    ? "bg-brass-400 text-slate-900"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {jazzRootName(p)}
              </span>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <Button onClick={playPreview} icon={<Volume2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />}>
            お手本を聞く
          </Button>
          <Button onClick={nextRound} icon={<SkipForward className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />}>
            スキップ
          </Button>
        </div>
      </Card>

      <p className="text-xs text-slate-500">
        鍵盤の薄い色がターゲットコードのコードトーン、明るいオレンジが次に弾くべき音です(輪で囲まれた最後の音がターゲット)。
      </p>
      <PianoKeyboard
        lowMidi={48}
        highMidi={79}
        activeNotes={activeNotes}
        targetPitchClasses={targetPc !== null ? new Set([targetPc]) : undefined}
        referencePitchClasses={chordPcs}
        onNoteDown={pressNote}
        onNoteUp={releaseNote}
      />

      <details className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400" open>
        <summary className="cursor-pointer select-none font-semibold text-slate-200">練習設定</summary>
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-xs text-slate-500">出題するコードクオリティ</p>
            <MultiSelectChips
              options={SEVENTH_CHORD_QUALITIES}
              selected={selectedQualities}
              onChange={setSelectedQualities}
              labelFor={(q) => CHORD_QUALITIES[q].labelJa}
            />
          </div>
          <div>
            <p className="mb-2 text-xs text-slate-500">出題するアプローチパターン</p>
            <MultiSelectChips
              options={APPROACH_PATTERN_ORDER}
              selected={selectedPatterns}
              onChange={setSelectedPatterns}
              labelFor={(p) => APPROACH_PATTERNS[p].nameJa}
            />
          </div>
        </div>
      </details>
    </div>
  );
}
