import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Shuffle, Volume2 } from "lucide-react";
import type { Route } from "./+types/ii-v-i";
import { PianoKeyboard } from "~/components/PianoKeyboard";
import { LickStaff, type StaffNote } from "~/components/LickStaff";
import { FallingNotes, type FallingNote } from "~/components/FallingNotes";
import { ScoreHud } from "~/components/ScoreHud";
import { FeedbackBanner, type FeedbackKind } from "~/components/FeedbackBanner";
import { MultiSelectChips } from "~/components/MultiSelectChips";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { useProgressContext } from "~/lib/context/ProgressProvider";
import { useRoundScore } from "~/lib/hooks/useRoundScore";
import { useNotePlayer } from "~/lib/hooks/useSynth";
import { useTimedSequence, COUNT_IN_BEATS, type TimedNoteSpec } from "~/lib/hooks/useTimedSequence";
import { keyboardLayout } from "~/lib/keyboardGeometry";
import { II_V_I_LICKS, type Lick, type LickChordSlot } from "~/lib/theory/licks";
import { jazzRootName, randomPitchClass, type PitchClass } from "~/lib/theory/notes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "II-V-Iリック練習 - Jazz Piano Dojo" }];
}

const KEYBOARD_LOW = 43;
const KEYBOARD_HIGH = 96;

interface LickTimedNote extends TimedNoteSpec {
  chord: LickChordSlot;
}

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
  const staffNotes = useMemo<StaffNote[]>(
    () => round.lick.notes.map((n) => ({ midi: 60 + round.keyRoot + n.semitone, dur: n.dur, chord: n.chord })),
    [round],
  );

  const handleFinish = useCallback(
    (success: boolean) => {
      setFeedback(success ? "correct" : "wrong");
      score.registerResult(success);
      recordResult("ii-v-i", success);
    },
    [score, recordResult],
  );

  const { phase, noteStates, currentIndex, start, resetIdle } = useTimedSequence(handleFinish);

  // Independent wall-clock elapsed-time tracker spanning the count-in AND
  // the playing phase, used only to drive the scrolling staff / falling
  // notes visuals. `useTimedSequence`'s own internal clock only starts
  // ticking once the count-in ends, so it can't drive a lead-in animation
  // during the count-in itself; this stays entirely separate from — and
  // never touches — the actual grading/score, which remains solely
  // `useTimedSequence`'s responsibility.
  const roundStartRef = useRef(0);
  const [roundElapsedSec, setRoundElapsedSec] = useState(0);

  useEffect(() => {
    if (phase !== "countIn" && phase !== "playing") return;
    let raf: number;
    const tick = () => {
      setRoundElapsedSec((performance.now() - roundStartRef.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const secPerEighth = 60 / bpm / 2;
  const countInSec = COUNT_IN_BEATS * (60 / bpm);
  const currentEighths = roundElapsedSec / secPerEighth;
  // Falling notes reach the hit line `countInSec` later than the lick's own
  // `startSec` (which is relative to when "playing" begins), so this piano
  // roll's fall lead-in plays out during the count-in and the first note
  // arrives exactly as the count-in ends.
  const fallingNotes = useMemo<FallingNote[]>(
    () => notes.map((n) => ({ midi: n.midi, hitAtSec: n.startSec + countInSec })),
    [notes, countInSec],
  );

  const pickRound = useCallback(() => {
    const pool = selectedLicks.size > 0 ? II_V_I_LICKS.filter((l) => selectedLicks.has(l.id)) : II_V_I_LICKS;
    const lick = pool[Math.floor(Math.random() * pool.length)];
    setRound((prev) => ({ id: prev.id + 1, lick, keyRoot: randomPitchClass() }));
    setFeedback(null);
    setRoundElapsedSec(0);
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
    roundStartRef.current = performance.now();
    start(notes, bpm);
  }

  const targetMidiNotes = currentIndex >= 0 ? new Set([notes[currentIndex].midi]) : undefined;
  const keyboardWidth = useMemo(() => keyboardLayout(KEYBOARD_LOW, KEYBOARD_HIGH).width, []);
  const running = phase === "countIn" || phase === "playing";

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

      <Card className="p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">
          Key of {jazzRootName(round.keyRoot)} ・ {round.lick.nameJa}
        </p>
        <p className="mx-auto mt-2 max-w-lg text-xs text-slate-500">{round.lick.descriptionJa}</p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={playDemo}
            disabled={phase === "countIn" || phase === "playing"}
            icon={<Volume2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />}
          >
            お手本を聞く
          </Button>
          <Button
            variant="primary"
            onClick={startRun}
            disabled={phase === "countIn" || phase === "playing"}
            icon={<Play className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />}
          >
            {phase === "countIn" ? "カウントイン中…" : phase === "playing" ? "演奏中…" : "スタート"}
          </Button>
          <Button onClick={pickRound} icon={<Shuffle className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />}>
            別のリック
          </Button>
        </div>
      </Card>

      <div>
        <LickStaff
          notes={staffNotes}
          keyRoot={round.keyRoot}
          currentIndex={currentIndex}
          states={noteStates}
          currentEighths={currentEighths}
          viewportWidth={keyboardWidth}
          className="rounded-t-xl border border-b-0 border-slate-800"
        />
        <FallingNotes
          lowMidi={KEYBOARD_LOW}
          highMidi={KEYBOARD_HIGH}
          notes={fallingNotes}
          running={running}
          className="border-x border-slate-800"
        />
        <PianoKeyboard
          lowMidi={KEYBOARD_LOW}
          highMidi={KEYBOARD_HIGH}
          activeNotes={activeNotes}
          targetMidiNotes={targetMidiNotes}
          onNoteDown={pressNote}
          onNoteUp={releaseNote}
          className="rounded-b-xl border border-t-0 border-slate-800"
        />
      </div>

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
              className="w-full accent-brass-400"
            />
          </div>
        </div>
      </details>
    </div>
  );
}
