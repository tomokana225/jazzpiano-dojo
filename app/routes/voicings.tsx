import { useCallback, useEffect, useMemo, useState } from "react";
import type { Route } from "./+types/voicings";
import { PianoKeyboard } from "~/components/PianoKeyboard";
import { RootPicker } from "~/components/RootPicker";
import { ScoreHud } from "~/components/ScoreHud";
import { FeedbackBanner, type FeedbackKind } from "~/components/FeedbackBanner";
import { MultiSelectChips } from "~/components/MultiSelectChips";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { useProgressContext } from "~/lib/context/ProgressProvider";
import { useRoundScore } from "~/lib/hooks/useRoundScore";
import { useNotePlayer } from "~/lib/hooks/useSynth";
import { CHORD_QUALITIES, SEVENTH_CHORD_QUALITIES, chordSymbol, type ChordQualityId } from "~/lib/theory/chords";
import { VOICING_TYPES, availableVoicingTypes, buildVoicing, type VoicingType } from "~/lib/theory/voicings";
import { randomPitchClass, type PitchClass } from "~/lib/theory/notes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "ボイシング練習 - Jazz Piano Dojo" }];
}

const ANCHOR_MIDI = 60;
const ALL_VOICING_TYPES = Object.keys(VOICING_TYPES) as VoicingType[];

type Mode = "explore" | "quiz";

const MODE_TABS: { id: Mode; label: string }[] = [
  { id: "explore", label: "ボイシングを覚える" },
  { id: "quiz", label: "クイズ" },
];

export default function VoicingsPractice() {
  const [mode, setMode] = useState<Mode>("explore");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">ボイシング練習</h1>
        <p className="mt-1 text-sm text-slate-400">
          シェル・ロートレスA/B・ドロップ2など実戦的なボイシングを覚えましょう。
        </p>
      </div>

      <div className="inline-flex flex-wrap rounded-full border border-slate-800 bg-slate-900/60 p-1 text-xs">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
              mode === tab.id ? "bg-amber-400 text-slate-900" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "explore" && <VoicingExplorer />}
      {mode === "quiz" && <VoicingQuizTrainer />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Explore mode (default): pick a root, chord quality, and voicing type, and
// see it laid out on the keyboard at your own pace — no quiz, no timer.
// ---------------------------------------------------------------------------

function VoicingExplorer() {
  const { activeNotes, pressNote, releaseNote } = useMidiContext();
  const player = useNotePlayer();
  const [root, setRoot] = useState<PitchClass>(0);
  const [quality, setQuality] = useState<ChordQualityId>("maj7");
  const [voicingType, setVoicingType] = useState<VoicingType>("shell37");

  const available = useMemo(() => availableVoicingTypes(quality), [quality]);
  useEffect(() => {
    if (!available.includes(voicingType)) setVoicingType(available[0]);
  }, [available, voicingType]);

  const voicing = useMemo(
    () => buildVoicing(root, quality, voicingType, ANCHOR_MIDI),
    [root, quality, voicingType],
  );
  const targetMidiNotes = useMemo(() => new Set(voicing?.notes ?? []), [voicing]);

  function playPreview() {
    if (voicing) player.playChord(voicing.notes);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="grid gap-6 sm:grid-cols-3">
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
              {SEVENTH_CHORD_QUALITIES.map((q) => (
                <option key={q} value={q}>
                  {CHORD_QUALITIES[q].labelJa}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2 text-xs text-slate-500">ボイシング種別</p>
            <select
              value={voicingType}
              onChange={(e) => setVoicingType(e.target.value as VoicingType)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"
            >
              {available.map((t) => (
                <option key={t} value={t}>
                  {VOICING_TYPES[t].nameJa}
                </option>
              ))}
            </select>
          </div>
        </div>

        {voicing && (
          <div className="mt-6 text-center">
            <p className="text-xs uppercase tracking-widest text-slate-500">Selected Voicing</p>
            <p className="mt-2 text-3xl font-bold text-amber-300">{chordSymbol({ root, quality })}</p>
            <p className="mt-1 text-sm text-slate-300">{VOICING_TYPES[voicingType].nameJa}</p>
            <p className="mx-auto mt-2 max-w-md text-xs text-slate-500">{VOICING_TYPES[voicingType].descriptionJa}</p>
            <p className="mt-3 text-sm text-slate-400">構成音(下から): {voicing.degrees.join(" - ")}</p>
            <button
              type="button"
              onClick={playPreview}
              className="mt-4 rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-300 hover:border-amber-400 hover:text-amber-300"
            >
              🔊 音を聞く
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        ハイライトされた鍵盤がこのボイシングの構成音です(オクターブも指定通り)。実際に弾いてみましょう — 合っていれば緑、違う音は赤になります。
      </p>
      <PianoKeyboard
        lowMidi={41}
        highMidi={79}
        activeNotes={activeNotes}
        targetMidiNotes={targetMidiNotes}
        onNoteDown={pressNote}
        onNoteUp={releaseNote}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quiz mode: random chord + voicing, matched by playing the exact notes.
// ---------------------------------------------------------------------------

interface Round {
  id: number;
  root: PitchClass;
  quality: ChordQualityId;
  voicingType: VoicingType;
}

function randomRound(qualities: ChordQualityId[], voicingTypes: VoicingType[], prevId: number): Round {
  for (let attempt = 0; attempt < 20; attempt++) {
    const quality = qualities[Math.floor(Math.random() * qualities.length)];
    const available = availableVoicingTypes(quality).filter((t) => voicingTypes.includes(t));
    if (available.length === 0) continue;
    const voicingType = available[Math.floor(Math.random() * available.length)];
    return { id: prevId + 1, root: randomPitchClass(), quality, voicingType };
  }
  return { id: prevId + 1, root: randomPitchClass(), quality: "maj7", voicingType: "shell37" };
}

function VoicingQuizTrainer() {
  const { activeNotes, pressNote, releaseNote } = useMidiContext();
  const { recordResult } = useProgressContext();
  const score = useRoundScore();
  const player = useNotePlayer();

  const [selectedQualities, setSelectedQualities] = useState<Set<ChordQualityId>>(
    () => new Set(SEVENTH_CHORD_QUALITIES),
  );
  const [selectedVoicingTypes, setSelectedVoicingTypes] = useState<Set<VoicingType>>(
    () => new Set(ALL_VOICING_TYPES),
  );
  const [round, setRound] = useState<Round>(() =>
    randomRound([...SEVENTH_CHORD_QUALITIES], ALL_VOICING_TYPES, 0),
  );
  const [phase, setPhase] = useState<"playing" | "done">("playing");
  const [feedback, setFeedback] = useState<FeedbackKind>(null);

  const voicing = useMemo(
    () => buildVoicing(round.root, round.quality, round.voicingType, ANCHOR_MIDI),
    [round.root, round.quality, round.voicingType],
  );
  const targetMidiNotes = useMemo(() => new Set(voicing?.notes ?? []), [voicing]);

  const nextRound = useCallback(() => {
    const qualities = selectedQualities.size > 0 ? [...selectedQualities] : [...SEVENTH_CHORD_QUALITIES];
    const voicingTypes = selectedVoicingTypes.size > 0 ? [...selectedVoicingTypes] : ALL_VOICING_TYPES;
    setRound((prev) => randomRound(qualities, voicingTypes, prev.id));
    setPhase("playing");
    setFeedback(null);
  }, [selectedQualities, selectedVoicingTypes]);

  const finishRound = useCallback(
    (correct: boolean) => {
      if (phase !== "playing") return;
      setPhase("done");
      setFeedback(correct ? "correct" : "wrong");
      score.registerResult(correct);
      recordResult("voicings", correct);
      window.setTimeout(nextRound, correct ? 900 : 1600);
    },
    [phase, score, recordResult, nextRound],
  );

  useEffect(() => {
    if (phase !== "playing" || !voicing) return;
    if (activeNotes.size === 0) return;
    if (activeNotes.size !== targetMidiNotes.size) return;
    const matches = [...activeNotes].every((n) => targetMidiNotes.has(n));
    if (matches) finishRound(true);
  }, [activeNotes, targetMidiNotes, voicing, phase, finishRound]);

  function playPreview() {
    if (voicing) player.playChord(voicing.notes);
  }

  if (!voicing) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ScoreHud correct={score.correct} total={score.total} streak={score.streak} bestStreak={score.bestStreak} />
        <FeedbackBanner kind={feedback} />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">Target Voicing</p>
        <p className="mt-2 text-4xl font-bold text-amber-300">{chordSymbol(round)}</p>
        <p className="mt-1 text-sm text-slate-300">{VOICING_TYPES[round.voicingType].nameJa}</p>
        <p className="mx-auto mt-2 max-w-md text-xs text-slate-500">{VOICING_TYPES[round.voicingType].descriptionJa}</p>
        <p className="mt-3 text-sm text-slate-400">構成音(下から): {voicing.degrees.join(" - ")}</p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={playPreview}
            className="rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-300 hover:border-amber-400 hover:text-amber-300"
          >
            🔊 音を聞く
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
        lowMidi={41}
        highMidi={79}
        activeNotes={activeNotes}
        targetMidiNotes={targetMidiNotes}
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
            <p className="mb-2 text-xs text-slate-500">出題するボイシング種別</p>
            <MultiSelectChips
              options={ALL_VOICING_TYPES}
              selected={selectedVoicingTypes}
              onChange={setSelectedVoicingTypes}
              labelFor={(t) => VOICING_TYPES[t].nameJa}
            />
          </div>
        </div>
      </details>
    </div>
  );
}
