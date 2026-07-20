import { useCallback, useEffect, useMemo, useState } from "react";
import { SkipForward, Volume2 } from "lucide-react";
import type { Route } from "./+types/substitutions";
import { PianoKeyboard } from "~/components/PianoKeyboard";
import { ScoreHud } from "~/components/ScoreHud";
import { FeedbackBanner, type FeedbackKind } from "~/components/FeedbackBanner";
import { MultiSelectChips } from "~/components/MultiSelectChips";
import { ProgressionPicker } from "~/components/ProgressionPicker";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { useProgressContext } from "~/lib/context/ProgressProvider";
import { useRoundScore } from "~/lib/hooks/useRoundScore";
import { useNotePlayer } from "~/lib/hooks/useSynth";
import { CHORD_QUALITIES, chordSymbol, chordTones } from "~/lib/theory/chords";
import { closeVoicingMidi } from "~/lib/theory/voicings";
import {
  computeSubstitution,
  SUBSTITUTION_KINDS,
  SUBSTITUTION_KIND_ORDER,
  type SubstitutionKind,
  type SubstitutionResult,
} from "~/lib/theory/substitutions";
import { STANDARDS, type Standard, type StandardChord } from "~/lib/theory/standards";
import { pc } from "~/lib/theory/notes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "代理コード練習 - Jazz Piano Dojo" }];
}

interface SubRound {
  id: number;
  index: number;
  kind: SubstitutionKind;
  result: SubstitutionResult;
}

function collectValidPairs(chords: StandardChord[], kinds: SubstitutionKind[]) {
  const pairs: { index: number; kind: SubstitutionKind; result: SubstitutionResult }[] = [];
  for (let i = 0; i < chords.length; i++) {
    for (const kind of kinds) {
      const result = computeSubstitution(chords, i, kind);
      if (result) pairs.push({ index: i, kind, result });
    }
  }
  return pairs;
}

export default function SubstitutionsTrainer() {
  const { activeNotes, pressNote, releaseNote } = useMidiContext();
  const { recordResult } = useProgressContext();
  const score = useRoundScore();
  const player = useNotePlayer();

  const [standard, setStandard] = useState<Standard>(STANDARDS[0]);
  const [selectedKinds, setSelectedKinds] = useState<Set<SubstitutionKind>>(() => new Set(SUBSTITUTION_KIND_ORDER));
  const [round, setRound] = useState<SubRound | null>(null);
  const [noPairs, setNoPairs] = useState(false);
  const [phase, setPhase] = useState<"playing" | "done">("playing");
  const [feedback, setFeedback] = useState<FeedbackKind>(null);

  const pickRound = useCallback((std: Standard, kinds: Set<SubstitutionKind>) => {
    const kindsList = kinds.size > 0 ? [...kinds] : SUBSTITUTION_KIND_ORDER;
    const pairs = collectValidPairs(std.chords, kindsList);
    if (pairs.length === 0) {
      setRound(null);
      setNoPairs(true);
      return;
    }
    setNoPairs(false);
    const pick = pairs[Math.floor(Math.random() * pairs.length)];
    setRound((prev) => ({ id: (prev?.id ?? 0) + 1, index: pick.index, kind: pick.kind, result: pick.result }));
    setPhase("playing");
    setFeedback(null);
  }, []);

  function handleStandardChange(next: Standard) {
    setStandard(next);
    pickRound(next, selectedKinds);
  }

  const nextRound = useCallback(() => pickRound(standard, selectedKinds), [standard, selectedKinds, pickRound]);

  const finishRound = useCallback(
    (correct: boolean) => {
      if (phase !== "playing" || !round) return;
      setPhase("done");
      setFeedback(correct ? "correct" : "wrong");
      score.registerResult(correct);
      recordResult("substitutions", correct);
      window.setTimeout(nextRound, correct ? 900 : 1600);
    },
    [phase, round, score, recordResult, nextRound],
  );

  const targetPitchClasses = useMemo(() => {
    if (!round) return new Set<number>();
    return new Set(chordTones({ root: round.result.root, quality: round.result.quality }));
  }, [round]);

  useEffect(() => {
    if (phase !== "playing" || !round) return;
    const activePcs = new Set([...activeNotes].map(pc));
    if (activePcs.size === 0) return;
    if (activePcs.size !== targetPitchClasses.size) return;
    const matches = [...activePcs].every((p) => targetPitchClasses.has(p));
    if (matches) finishRound(true);
  }, [activeNotes, targetPitchClasses, phase, round, finishRound]);

  function playPreview() {
    if (!round) return;
    player.playChord(closeVoicingMidi(round.result.root, CHORD_QUALITIES[round.result.quality].intervals, 60));
  }

  const kindDef = round ? SUBSTITUTION_KINDS[round.kind] : null;
  const prevChord = round && round.index > 0 ? standard.chords[round.index - 1] : null;
  const currentChord = round ? standard.chords[round.index] : null;
  const nextChord = round ? standard.chords[round.index + 1] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">代理コード / リハーモナイズ練習</h1>
        <p className="mt-1 text-sm text-slate-400">
          進行の文脈の中でトライトーン代理・セカンダリードミナント・裏コード・ディミニッシュパッシングコードを見つけ、その代理コードをMIDIで弾いてください。
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ScoreHud correct={score.correct} total={score.total} streak={score.streak} bestStreak={score.bestStreak} />
        <FeedbackBanner kind={feedback} />
      </div>

      <Card className="p-6">
        <ProgressionPicker onChange={handleStandardChange} />
        <p className="mt-2 max-w-md text-xs text-slate-500">{standard.descriptionJa}</p>

        {noPairs && (
          <p className="mt-4 text-sm text-brass-300">
            この進行と選択中のパターンの組み合わせでは代理コードを作れる箇所がありません。別の進行を選ぶか、下の設定でパターンを増やしてください。
          </p>
        )}

        {round && currentChord && kindDef && (
          <div className="mt-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              {prevChord && <span className="rounded-md border border-slate-800 px-2 py-1">{chordSymbol(prevChord)}</span>}
              <span
                className={`rounded-md border px-2 py-1 font-semibold ${
                  round.result.relation === "replaces"
                    ? "border-red-500/60 text-red-300 line-through"
                    : "border-slate-700 text-slate-300"
                }`}
              >
                {chordSymbol(currentChord)}
              </span>
              {round.result.relation === "precedes" && <span className="text-brass-400">→ ここに挿入 →</span>}
              {nextChord && <span className="rounded-md border border-slate-800 px-2 py-1">{chordSymbol(nextChord)}</span>}
            </div>

            <p className="mt-4 text-xs uppercase tracking-widest text-slate-500">{kindDef.nameJa}</p>
            <p className="mt-2 text-5xl font-bold tracking-tight text-brass-300">{chordSymbol(round.result)}</p>
            <p className="mx-auto mt-3 max-w-lg text-xs text-slate-500">{round.result.explanationJa}</p>

            <div className="mt-4 flex justify-center gap-3">
              <Button onClick={playPreview} icon={<Volume2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />}>
                音を聞く
              </Button>
              <Button onClick={nextRound} icon={<SkipForward className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />}>
                スキップ
              </Button>
            </div>
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
        <div className="mt-4">
          <p className="mb-2 text-xs text-slate-500">出題する代理パターン</p>
          <MultiSelectChips
            options={SUBSTITUTION_KIND_ORDER}
            selected={selectedKinds}
            onChange={setSelectedKinds}
            labelFor={(k) => SUBSTITUTION_KINDS[k].nameJa}
          />
        </div>
      </details>
    </div>
  );
}
