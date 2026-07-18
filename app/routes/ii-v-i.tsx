import { useCallback, useEffect, useMemo, useState } from "react";
import type { Route } from "./+types/ii-v-i";
import { PianoKeyboard } from "~/components/PianoKeyboard";
import { ScoreHud } from "~/components/ScoreHud";
import { FeedbackBanner, type FeedbackKind } from "~/components/FeedbackBanner";
import { MultiSelectChips } from "~/components/MultiSelectChips";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { useProgressContext } from "~/lib/context/ProgressProvider";
import { useRoundScore } from "~/lib/hooks/useRoundScore";
import { useNotePlayer } from "~/lib/hooks/useSynth";
import { useTimedSequence, type TimedNoteSpec } from "~/lib/hooks/useTimedSequence";
import { II_V_I_LICKS, type Lick, type LickChordSlot } from "~/lib/theory/licks";
import { jazzRootName, pc, randomPitchClass, type PitchClass } from "~/lib/theory/notes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "II-V-Iリック練習 - Jazz Piano Dojo" }];
}

interface LickTimedNote extends TimedNoteSpec {
  chord: LickChordSlot;
}

const SLOT_COLOR: Record<LickChordSlot, string> = {
  ii: "text-sky-300",
  V: "text-fuchsia-300",
  I: "text-amber-300",
};

function computeTimedNotes(lick: Lick, keyRoot: PitchClass, bpm: number): LickTimedNote[] {
  const secPerEighth = 60 / bpm / 2;
  let cursorEighths = 0;
  return lick.notes.map((n) => {
    const note: LickTimedNote = {
      midi: 60 + keyRoot + n.semitone,
      startSec: cursorEighths * secPerEighth,
      durSec: n.dur * secPerEighth,
      chord: n.chord,
    };
    cursorEighths += n.dur;
    return note;
  });
}

export default function IiVITrainer() {
  const { activeNotes, pressNote, releaseNote } = useMidiContext();
  const { recordResult } = useProgressContext();
  const score = useRoundScore();
  const player = useNotePlayer();

  const [selectedLicks, setSelectedLicks] = useState<Set<string>>(() => new Set(II_V_I_LICKS.map((l) => l.id)));
  const [bpm, setBpm] = useState(90);
  const [round, setRound] = useState<{ id: number; lick: Lick; keyRoot: PitchClass }>(() => ({
    id: 0,
    lick: II_V_I_LICKS[0],
    keyRoot: 0,
  }));
  const [feedback, setFeedback] = useState<FeedbackKind>(null);

  useEffect(() => {
    setRound({ id: 1, lick: II_V_I_LICKS[Math.floor(Math.random() * II_V_I_LICKS.length)], keyRoot: randomPitchClass() });
    // run once on mount to randomize the very first round
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notes = useMemo(() => computeTimedNotes(round.lick, round.keyRoot, bpm), [round, bpm]);

  const handleFinish = useCallback(
    (success: boolean) => {
      setFeedback(success ? "correct" : "wrong");
      score.registerResult(success);
      recordResult("ii-v-i", success);
    },
    [score, recordResult],
  );

  const { phase, noteStates, currentIndex, start, resetIdle } = useTimedSequence(handleFinish);

  const pickRound = useCallback(() => {
    const pool = selectedLicks.size > 0 ? II_V_I_LICKS.filter((l) => selectedLicks.has(l.id)) : II_V_I_LICKS;
    const lick = pool[Math.floor(Math.random() * pool.length)];
    setRound((prev) => ({ id: prev.id + 1, lick, keyRoot: randomPitchClass() }));
    setFeedback(null);
    resetIdle();
  }, [selectedLicks, resetIdle]);

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

  const targetMidiNotes = currentIndex >= 0 ? new Set([notes[currentIndex].midi]) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">II-V-Iリック練習</h1>
        <p className="mt-1 text-sm text-slate-400">
          カウントインの後、表示されたリックをテンポに合わせて演奏してください。ハイライトされた鍵盤が今弾くべき音です。
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ScoreHud correct={score.correct} total={score.total} streak={score.streak} bestStreak={score.bestStreak} />
        <FeedbackBanner kind={feedback} />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">
          Key of {jazzRootName(round.keyRoot)} ・ {round.lick.nameJa}
        </p>
        <p className="mx-auto mt-2 max-w-lg text-xs text-slate-500">{round.lick.descriptionJa}</p>

        <div className="mt-4 flex flex-wrap justify-center gap-1">
          {notes.map((n, idx) => {
            const state = noteStates[idx];
            const isCurrent = idx === currentIndex;
            return (
              <span
                key={idx}
                className={`flex h-9 min-w-9 items-center justify-center rounded-md border px-1 text-xs font-semibold ${SLOT_COLOR[n.chord]} ${
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
            🔀 別のリック
          </button>
        </div>
      </div>

      <PianoKeyboard
        lowMidi={43}
        highMidi={96}
        activeNotes={activeNotes}
        targetMidiNotes={targetMidiNotes}
        onNoteDown={pressNote}
        onNoteUp={releaseNote}
      />

      <details className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400" open>
        <summary className="cursor-pointer select-none font-semibold text-slate-200">練習設定</summary>
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-xs text-slate-500">出題するリック</p>
            <MultiSelectChips
              options={II_V_I_LICKS.map((l) => l.id)}
              selected={selectedLicks}
              onChange={setSelectedLicks}
              labelFor={(id) => II_V_I_LICKS.find((l) => l.id === id)?.nameJa ?? id}
            />
          </div>
          <div>
            <p className="mb-2 text-xs text-slate-500">テンポ: {bpm} BPM</p>
            <input
              type="range"
              min={60}
              max={140}
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
