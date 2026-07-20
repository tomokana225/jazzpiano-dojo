import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Play, Square, Volume2, X } from "lucide-react";
import type { Route } from "./+types/standards";
import { PianoKeyboard } from "~/components/PianoKeyboard";
import { ScoreHud } from "~/components/ScoreHud";
import { ProgressionPicker } from "~/components/ProgressionPicker";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { useProgressContext } from "~/lib/context/ProgressProvider";
import { useRoundScore } from "~/lib/hooks/useRoundScore";
import { useBackingTrack } from "~/lib/hooks/useBackingTrack";
import { useNotePlayer } from "~/lib/hooks/useSynth";
import { STANDARDS, type Standard } from "~/lib/theory/standards";
import { chordSymbol, chordTones } from "~/lib/theory/chords";
import { CHORD_SCALE_SUGGESTIONS } from "~/lib/theory/chordScales";
import { SCALES, scaleSequence, type ScaleId } from "~/lib/theory/scales";
import { nearestMidiForPitchClass, pc, type PitchClass } from "~/lib/theory/notes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "スタンダード バッキング練習 - Jazz Piano Dojo" }];
}

function scalePreviewNotes(root: PitchClass, scaleId: ScaleId) {
  const base = nearestMidiForPitchClass(root, 60);
  return scaleSequence(SCALES[scaleId]).map((interval) => ({ midi: base + interval, beats: 0.5 }));
}

export default function StandardsPractice() {
  const { activeNotes, pressNote, releaseNote } = useMidiContext();
  const { recordResult } = useProgressContext();
  const score = useRoundScore();

  const [standard, setStandard] = useState<Standard>(STANDARDS[0]);
  const [bpm, setBpm] = useState(standard.suggestedBpm);
  const [barFlash, setBarFlash] = useState<"hit" | "miss" | null>(null);
  const [liveCoverage, setLiveCoverage] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [selectedScale, setSelectedScale] = useState<ScaleId>("ionian");
  const player = useNotePlayer();

  const maxCoverageRef = useRef(0);
  const lastChordIndexRef = useRef(-1);

  const { isPlaying, currentChordIndex, start, stop } = useBackingTrack();

  useEffect(() => {
    setBpm(standard.suggestedBpm);
    setPreviewIndex(0);
  }, [standard.id, standard.suggestedBpm]);

  useEffect(() => stop, [stop]);

  function handleStandardChange(next: Standard) {
    if (isPlaying) handleStop();
    setStandard(next);
  }

  const currentChord = currentChordIndex >= 0 ? standard.chords[currentChordIndex] : null;
  const currentChordTargetPcs = useMemo(
    () => (currentChord ? new Set(chordTones({ root: currentChord.root, quality: currentChord.quality })) : undefined),
    [currentChord],
  );
  const nextChord =
    currentChordIndex >= 0 ? standard.chords[(currentChordIndex + 1) % standard.chords.length] : null;

  // The chord to show scale suggestions/keyboard for: the live backing-track
  // chord while playing, or a chord the learner clicked to preview while idle
  // (so they can browse chord-scale choices before/without starting playback).
  const displayIndex = isPlaying ? currentChordIndex : previewIndex;
  const displayChord = displayIndex >= 0 ? standard.chords[displayIndex] : null;
  const displayTargetPcs = useMemo(
    () => (displayChord ? new Set(chordTones({ root: displayChord.root, quality: displayChord.quality })) : undefined),
    [displayChord],
  );

  const scaleSuggestions = displayChord ? CHORD_SCALE_SUGGESTIONS[displayChord.quality] : [];
  const activeScale = scaleSuggestions.includes(selectedScale) ? selectedScale : scaleSuggestions[0];

  useEffect(() => {
    if (scaleSuggestions.length > 0 && !scaleSuggestions.includes(selectedScale)) {
      setSelectedScale(scaleSuggestions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayChord?.root, displayChord?.quality]);

  const scaleReferencePcs = useMemo(() => {
    if (!displayChord || !activeScale) return undefined;
    return new Set(SCALES[activeScale].intervals.map((iv) => pc(displayChord.root + iv)));
  }, [displayChord, activeScale]);

  function playScalePreview() {
    if (!displayChord || !activeScale) return;
    player.playSequence(scalePreviewNotes(displayChord.root, activeScale), 180);
  }

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
            className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${
              barFlash === "hit" ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"
            }`}
          >
            {barFlash === "hit" ? (
              <Check className="h-4 w-4" strokeWidth={2.75} aria-hidden />
            ) : (
              <X className="h-4 w-4" strokeWidth={2.75} aria-hidden />
            )}
            {barFlash === "hit" ? "Nice comping!" : "コードトーンを増やそう"}
          </div>
        )}
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <ProgressionPicker onChange={handleStandardChange} />
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
                className="w-28 accent-brass-400"
              />
            </label>
            {!isPlaying ? (
              <Button
                variant="primary"
                onClick={handleStart}
                icon={<Play className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />}
              >
                バッキング開始
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleStop}
                icon={<Square className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />}
              >
                停止
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-widest text-slate-500">Now</p>
          <p className="mt-1 text-5xl font-bold tracking-tight text-brass-300">
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
            <button
              key={idx}
              type="button"
              disabled={isPlaying}
              onClick={() => setPreviewIndex(idx)}
              className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                idx === displayIndex
                  ? "border-brass-400 bg-brass-400/20 text-brass-300"
                  : "border-slate-800 bg-slate-900 text-slate-500 enabled:hover:border-slate-600 enabled:hover:text-slate-300"
              } ${isPlaying ? "cursor-default" : "cursor-pointer"}`}
            >
              {chordSymbol(c)}
            </button>
          ))}
        </div>
      </Card>

      {displayChord && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">
                {chordSymbol(displayChord)} 上で使えるスケール
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {isPlaying ? "今鳴っているコード" : "コードをタップして選択中"} ・ アドリブ練習用に候補スケールを鍵盤に薄く表示します
              </p>
            </div>
            <Button onClick={playScalePreview} icon={<Volume2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />}>
              スケールを聴く
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {scaleSuggestions.map((sid) => (
              <button
                key={sid}
                type="button"
                onClick={() => setSelectedScale(sid)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  sid === activeScale
                    ? "border-brass-400 bg-brass-400/15 text-brass-300"
                    : "border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
              >
                {SCALES[sid].nameJa}
              </button>
            ))}
          </div>
        </Card>
      )}

      <p className="text-xs text-slate-500">
        濃いハイライトがコードトーン、薄いハイライトが選択中のスケール音です。両方を見ながらアドリブしてみましょう。
      </p>
      <PianoKeyboard
        lowMidi={41}
        highMidi={79}
        activeNotes={activeNotes}
        targetPitchClasses={displayTargetPcs}
        referencePitchClasses={scaleReferencePcs}
        onNoteDown={pressNote}
        onNoteUp={releaseNote}
      />
    </div>
  );
}
