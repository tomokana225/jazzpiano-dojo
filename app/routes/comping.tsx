import { useCallback, useEffect, useState } from "react";
import { Play, Square } from "lucide-react";
import type { Route } from "./+types/comping";
import { PianoKeyboard } from "~/components/PianoKeyboard";
import { ScoreHud } from "~/components/ScoreHud";
import { FeedbackBanner, type FeedbackKind } from "~/components/FeedbackBanner";
import { ProgressionPicker } from "~/components/ProgressionPicker";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { useProgressContext } from "~/lib/context/ProgressProvider";
import { useRoundScore } from "~/lib/hooks/useRoundScore";
import { useCompingClock } from "~/lib/hooks/useCompingClock";
import { chordSymbol, chordTones } from "~/lib/theory/chords";
import { COMPING_RHYTHMS, COMPING_RHYTHM_ORDER, type CompingRhythmId } from "~/lib/theory/compingRhythms";
import { STANDARDS, standardTotalBeats, type Standard } from "~/lib/theory/standards";

export function meta({}: Route.MetaArgs) {
  return [{ title: "コンピング・リズム練習 - Jazz Piano Dojo" }];
}

export default function CompingTrainer() {
  const { activeNotes, pressNote, releaseNote } = useMidiContext();
  const { recordResult } = useProgressContext();
  const score = useRoundScore();

  const [standard, setStandard] = useState<Standard>(STANDARDS[0]);
  const [rhythmId, setRhythmId] = useState<CompingRhythmId>("charleston");
  const [bpm, setBpm] = useState(100);
  const [feedback, setFeedback] = useState<FeedbackKind>(null);

  const rhythm = COMPING_RHYTHMS[rhythmId];

  const handleFinish = useCallback(
    (hits: number, total: number) => {
      const success = total > 0 && hits / total >= 0.8;
      setFeedback(success ? "correct" : "wrong");
      score.registerResult(success);
      recordResult("comping", success);
    },
    [score, recordResult],
  );

  const { phase, onsets, onsetStates, currentOnsetIndex, start, stop } = useCompingClock(handleFinish);
  const busy = phase === "playing" || phase === "countIn";

  useEffect(() => stop, [stop]);

  function handleStandardChange(next: Standard) {
    if (busy) stop();
    setStandard(next);
  }

  function startRun() {
    setFeedback(null);
    score.reset();
    const bars = Math.max(1, Math.ceil(standardTotalBeats(standard) / 4));
    start(standard, rhythm, bpm, bars);
  }

  const currentOnset = currentOnsetIndex >= 0 ? onsets[currentOnsetIndex] : null;
  const currentChord = currentOnset ? standard.chords[currentOnset.chordIndex] : null;
  const targetPitchClasses = currentChord
    ? new Set(chordTones({ root: currentChord.root, quality: currentChord.quality }))
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">コンピング・リズム練習</h1>
        <p className="mt-1 text-sm text-slate-400">
          「何を弾くか」ではなく「いつ弾くか」を鍛えます。選んだリズムパターンの拍で、コードトーンを含むボイシングを正しいタイミングで弾いてください。
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ScoreHud correct={score.correct} total={score.total} streak={score.streak} bestStreak={score.bestStreak} />
        <FeedbackBanner kind={feedback} />
      </div>

      <Card className="p-6">
        <ProgressionPicker onChange={handleStandardChange} disabled={busy} />
        <p className="mt-2 max-w-md text-xs text-slate-500">{standard.descriptionJa}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {COMPING_RHYTHM_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setRhythmId(id)}
              disabled={busy}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                rhythmId === id
                  ? "border-brass-400 bg-brass-400/15 text-brass-300"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {COMPING_RHYTHMS[id].nameJa}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">{rhythm.descriptionJa}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <span>{bpm} BPM</span>
            <input
              type="range"
              min={60}
              max={160}
              step={2}
              value={bpm}
              disabled={busy}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-28 accent-brass-400"
            />
          </label>
          <Button
            variant="primary"
            onClick={startRun}
            disabled={busy}
            icon={<Play className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />}
          >
            {phase === "countIn" ? "カウントイン中…" : phase === "playing" ? "演奏中…" : "スタート"}
          </Button>
          {busy && (
            <Button variant="danger" onClick={stop} icon={<Square className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />}>
              停止
            </Button>
          )}
        </div>

        {onsets.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1">
            {onsets.map((o, idx) => {
              const state = onsetStates[idx];
              const isCurrent = idx === currentOnsetIndex;
              return (
                <span
                  key={idx}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-md border px-1 text-xs font-semibold ${
                    isCurrent
                      ? "border-brass-400 bg-brass-400/20 scale-110"
                      : state === "hit"
                      ? "border-emerald-600 bg-emerald-400/10 text-emerald-300"
                      : state === "miss"
                      ? "border-red-600 bg-red-400/10 text-red-300"
                      : "border-slate-700 bg-slate-800/60 text-slate-400"
                  }`}
                >
                  {chordSymbol(standard.chords[o.chordIndex])}
                </span>
              );
            })}
          </div>
        )}
      </Card>

      <p className="text-xs text-slate-500">
        ハイライトされた鍵盤が現在のオンセットのコードトーンです。オンセットの前後の許容窓内でコードトーンをまとめて弾けば正解になります。
      </p>
      <PianoKeyboard
        lowMidi={41}
        highMidi={79}
        activeNotes={activeNotes}
        targetPitchClasses={targetPitchClasses}
        onNoteDown={pressNote}
        onNoteUp={releaseNote}
      />
    </div>
  );
}
