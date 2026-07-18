import { useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "./+types/standards";
import { PianoKeyboard } from "~/components/PianoKeyboard";
import { ScoreHud } from "~/components/ScoreHud";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { useProgressContext } from "~/lib/context/ProgressProvider";
import { useRoundScore } from "~/lib/hooks/useRoundScore";
import { useBackingTrack } from "~/lib/hooks/useBackingTrack";
import { STANDARDS } from "~/lib/theory/standards";
import { chordSymbol, chordTones } from "~/lib/theory/chords";
import { pc } from "~/lib/theory/notes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "スタンダード バッキング練習 - Jazz Piano Dojo" }];
}

export default function StandardsPractice() {
  const { activeNotes, pressNote, releaseNote } = useMidiContext();
  const { recordResult } = useProgressContext();
  const score = useRoundScore();

  const [standardId, setStandardId] = useState(STANDARDS[0].id);
  const standard = STANDARDS.find((s) => s.id === standardId) ?? STANDARDS[0];
  const [bpm, setBpm] = useState(standard.suggestedBpm);
  const [barFlash, setBarFlash] = useState<"hit" | "miss" | null>(null);
  const [liveCoverage, setLiveCoverage] = useState(0);

  const maxCoverageRef = useRef(0);
  const lastChordIndexRef = useRef(-1);

  const { isPlaying, currentChordIndex, start, stop } = useBackingTrack();

  useEffect(() => {
    setBpm(standard.suggestedBpm);
  }, [standard.suggestedBpm]);

  useEffect(() => stop, [stop]);

  const currentChord = currentChordIndex >= 0 ? standard.chords[currentChordIndex] : null;
  const currentChordTargetPcs = useMemo(
    () => (currentChord ? new Set(chordTones({ root: currentChord.root, quality: currentChord.quality })) : undefined),
    [currentChord],
  );
  const nextChord =
    currentChordIndex >= 0 ? standard.chords[(currentChordIndex + 1) % standard.chords.length] : null;

  // Track how well the learner's held notes covered the current chord's tones over the bar.
  useEffect(() => {
    if (!isPlaying || !currentChordTargetPcs || currentChordTargetPcs.size === 0) return;
    const activePcs = new Set([...activeNotes].map(pc));
    let matched = 0;
    currentChordTargetPcs.forEach((p) => {
      if (activePcs.has(p)) matched++;
    });
    const ratio = matched / currentChordTargetPcs.size;
    maxCoverageRef.current = Math.max(maxCoverageRef.current, ratio);
    setLiveCoverage(ratio);
  }, [activeNotes, isPlaying, currentChordTargetPcs]);

  // Grade the previous bar whenever the backing track moves to a new chord.
  useEffect(() => {
    if (!isPlaying) return;
    if (lastChordIndexRef.current === -1) {
      lastChordIndexRef.current = currentChordIndex;
      maxCoverageRef.current = 0;
      return;
    }
    if (currentChordIndex !== lastChordIndexRef.current) {
      const success = maxCoverageRef.current >= 0.5;
      score.registerResult(success);
      recordResult("standards", success);
      setBarFlash(success ? "hit" : "miss");
      window.setTimeout(() => setBarFlash(null), 500);
      maxCoverageRef.current = 0;
      lastChordIndexRef.current = currentChordIndex;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChordIndex, isPlaying]);

  async function handleStart() {
    score.reset();
    lastChordIndexRef.current = -1;
    maxCoverageRef.current = 0;
    setLiveCoverage(0);
    await start(standard, bpm);
  }

  function handleStop() {
    stop();
    lastChordIndexRef.current = -1;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">スタンダード バッキング練習</h1>
        <p className="mt-1 text-sm text-slate-400">
          ベース＆ドラムの伴奏に合わせてコードチェンジを確認しながらコンピングしましょう。1小節の間にコードトーンをどれだけ弾けたかでスコアがつきます。
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ScoreHud correct={score.correct} total={score.total} streak={score.streak} bestStreak={score.bestStreak} />
        {barFlash && (
          <div
            className={`flex h-9 items-center rounded-lg px-3 text-sm font-semibold ${
              barFlash === "hit" ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"
            }`}
          >
            {barFlash === "hit" ? "🎹 Nice comping!" : "🙈 コードトーンを増やそう"}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <select
              value={standardId}
              onChange={(e) => {
                if (isPlaying) handleStop();
                setStandardId(e.target.value);
              }}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
            >
              {STANDARDS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.titleJa}
                </option>
              ))}
            </select>
            <p className="mt-2 max-w-md text-xs text-slate-500">{standard.descriptionJa}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <span>{bpm} BPM</span>
              <input
                type="range"
                min={60}
                max={220}
                step={2}
                value={bpm}
                disabled={isPlaying}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-28 accent-amber-400"
              />
            </label>
            {!isPlaying ? (
              <button
                type="button"
                onClick={handleStart}
                className="rounded-full bg-amber-400 px-5 py-1.5 text-xs font-semibold text-slate-900 hover:bg-amber-300"
              >
                ▶ バッキング開始
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStop}
                className="rounded-full border border-red-500/60 px-5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10"
              >
                ■ 停止
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-widest text-slate-500">Now</p>
          <p className="mt-1 text-5xl font-bold text-amber-300">
            {currentChord ? chordSymbol(currentChord) : "—"}
          </p>
          <p className="mt-2 text-sm text-slate-500">Next: {nextChord ? chordSymbol(nextChord) : "—"}</p>
          <div className="mx-auto mt-4 h-2 w-56 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-400 transition-[width] duration-150"
              style={{ width: `${liveCoverage * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">現在のコードトーン一致率</p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          {standard.chords.map((c, idx) => (
            <span
              key={idx}
              className={`rounded-md border px-2 py-1 text-xs font-medium ${
                idx === currentChordIndex
                  ? "border-amber-400 bg-amber-400/20 text-amber-300"
                  : "border-slate-800 bg-slate-900 text-slate-500"
              }`}
            >
              {chordSymbol(c)}
            </span>
          ))}
        </div>
      </div>

      <PianoKeyboard
        lowMidi={41}
        highMidi={79}
        activeNotes={activeNotes}
        targetPitchClasses={currentChordTargetPcs}
        onNoteDown={pressNote}
        onNoteUp={releaseNote}
      />
    </div>
  );
}
