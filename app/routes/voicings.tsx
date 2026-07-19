import { useCallback, useEffect, useMemo, useState } from "react";
import type { Route } from "./+types/voicings";
import { PianoKeyboard } from "~/components/PianoKeyboard";
import { RootPicker } from "~/components/RootPicker";
import { OctaveShiftControl } from "~/components/OctaveShiftControl";
import { ScoreHud } from "~/components/ScoreHud";
import { FeedbackBanner, type FeedbackKind } from "~/components/FeedbackBanner";
import { MultiSelectChips } from "~/components/MultiSelectChips";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { useProgressContext } from "~/lib/context/ProgressProvider";
import { useRoundScore } from "~/lib/hooks/useRoundScore";
import { useNotePlayer } from "~/lib/hooks/useSynth";
import { CHORD_QUALITIES, SEVENTH_CHORD_QUALITIES, chordSymbol, type ChordQualityId } from "~/lib/theory/chords";
import { VOICING_TYPES, availableVoicingTypes, buildVoicing, type VoicingType } from "~/lib/theory/voicings";
import { CIRCLE_OF_FIFTHS, jazzRootName, pc, randomPitchClass, type PitchClass } from "~/lib/theory/notes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "ボイシング練習 - Jazz Piano Dojo" }];
}

const ANCHOR_MIDI = 60;
const ALL_VOICING_TYPES = Object.keys(VOICING_TYPES) as VoicingType[];
const KEYBOARD_LOW = 33;
const KEYBOARD_HIGH = 88;

type Mode = "explore" | "quiz" | "iivi";

const MODE_TABS: { id: Mode; label: string }[] = [
  { id: "explore", label: "ボイシングを覚える" },
  { id: "quiz", label: "クイズ" },
  { id: "iivi", label: "II-V-I 連続練習 (5度圏)" },
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
      {mode === "iivi" && <VoicingIiViTrainer />}
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
  const [octaveShift, setOctaveShift] = useState(0);

  const available = useMemo(() => availableVoicingTypes(quality), [quality]);
  useEffect(() => {
    if (!available.includes(voicingType)) setVoicingType(available[0]);
  }, [available, voicingType]);

  const anchorMidi = ANCHOR_MIDI + octaveShift * 12;
  const voicing = useMemo(
    () => buildVoicing(root, quality, voicingType, anchorMidi),
    [root, quality, voicingType, anchorMidi],
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

        <div className="mt-6">
          <p className="mb-2 text-xs text-slate-500">オクターブ位置</p>
          <OctaveShiftControl value={octaveShift} onChange={setOctaveShift} />
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
        lowMidi={KEYBOARD_LOW}
        highMidi={KEYBOARD_HIGH}
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
  const [octaveShift, setOctaveShift] = useState(0);

  const anchorMidi = ANCHOR_MIDI + octaveShift * 12;
  const voicing = useMemo(
    () => buildVoicing(round.root, round.quality, round.voicingType, anchorMidi),
    [round.root, round.quality, round.voicingType, anchorMidi],
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
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
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
          <OctaveShiftControl value={octaveShift} onChange={setOctaveShift} />
        </div>
      </div>

      <PianoKeyboard
        lowMidi={KEYBOARD_LOW}
        highMidi={KEYBOARD_HIGH}
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

// ---------------------------------------------------------------------------
// II-V-I mode: drill a chosen voicing style through a full ii-V-I in one key,
// then automatically move to the next key around the circle of fifths (the
// same root motion as ii->V->I itself), looping forever.
// ---------------------------------------------------------------------------

type IiViVoicingChoice = VoicingType | "rootlessAlt";

const IIVI_VOICING_CHOICES: { id: IiViVoicingChoice; label: string }[] = [
  { id: "rootlessAlt", label: "ロートレス A/B 交互 (実戦的な声部進行)" },
  { id: "rootlessA", label: VOICING_TYPES.rootlessA.nameJa },
  { id: "rootlessB", label: VOICING_TYPES.rootlessB.nameJa },
  { id: "shell37", label: VOICING_TYPES.shell37.nameJa },
  { id: "shell73", label: VOICING_TYPES.shell73.nameJa },
  { id: "drop2", label: VOICING_TYPES.drop2.nameJa },
];

interface IiViSlot {
  label: "ii" | "V" | "I";
  root: PitchClass;
  quality: ChordQualityId;
}

const IIVI_SLOT_COLOR: Record<IiViSlot["label"], string> = {
  ii: "text-sky-300",
  V: "text-fuchsia-300",
  I: "text-amber-300",
};

function iiViSlots(keyRoot: PitchClass): IiViSlot[] {
  return [
    { label: "ii", root: pc(keyRoot + 2), quality: "min7" },
    { label: "V", root: pc(keyRoot + 7), quality: "dom7" },
    { label: "I", root: keyRoot, quality: "maj7" },
  ];
}

function VoicingIiViTrainer() {
  const { activeNotes, pressNote, releaseNote } = useMidiContext();
  const { recordResult } = useProgressContext();
  const score = useRoundScore();
  const player = useNotePlayer();

  const [choice, setChoice] = useState<IiViVoicingChoice>("rootlessAlt");
  const [octaveShift, setOctaveShift] = useState(0);
  const [circleIndex, setCircleIndex] = useState(0);
  const [step, setStep] = useState(0); // 0 = ii, 1 = V, 2 = I
  const [laps, setLaps] = useState(0);
  const [phase, setPhase] = useState<"playing" | "advancing">("playing");
  const [feedback, setFeedback] = useState<FeedbackKind>(null);

  const keyRoot = CIRCLE_OF_FIFTHS[circleIndex];
  const slots = useMemo(() => iiViSlots(keyRoot), [keyRoot]);
  const current = slots[step];
  const globalChordIndex = circleIndex * 3 + step;
  const currentVoicingType: VoicingType =
    choice === "rootlessAlt" ? (globalChordIndex % 2 === 0 ? "rootlessA" : "rootlessB") : choice;

  const anchorMidi = ANCHOR_MIDI + octaveShift * 12;
  const voicing = useMemo(
    () => buildVoicing(current.root, current.quality, currentVoicingType, anchorMidi),
    [current, currentVoicingType, anchorMidi],
  );
  const targetMidiNotes = useMemo(() => new Set(voicing?.notes ?? []), [voicing]);

  const advance = useCallback(() => {
    if (phase !== "playing") return;
    setPhase("advancing");
    setFeedback("correct");
    score.registerResult(true);
    recordResult("voicings", true);
    const isLast = step === 2;
    window.setTimeout(() => {
      if (isLast) {
        const next = (circleIndex + 1) % 12;
        setCircleIndex(next);
        if (next === 0) setLaps((l) => l + 1);
        setStep(0);
      } else {
        setStep((s) => s + 1);
      }
      setPhase("playing");
      setFeedback(null);
    }, 650);
  }, [phase, step, circleIndex, score, recordResult]);

  useEffect(() => {
    if (phase !== "playing" || !voicing) return;
    if (activeNotes.size === 0) return;
    if (activeNotes.size !== targetMidiNotes.size) return;
    const matches = [...activeNotes].every((n) => targetMidiNotes.has(n));
    if (matches) advance();
  }, [activeNotes, targetMidiNotes, voicing, phase, advance]);

  const resetCycle = useCallback(() => {
    setCircleIndex(0);
    setStep(0);
    setLaps(0);
    setPhase("playing");
    setFeedback(null);
  }, []);

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

      <p className="text-xs text-slate-500">
        1つのキーで ii → V → I の順に指定ボイシングを弾いてください。3つとも正解すると5度圏で次のキーに自動で進み、Cに戻るまで(そしてまたCから)ずっと続きます。
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {CIRCLE_OF_FIFTHS.map((root, i) => (
          <span
            key={i}
            className={`flex h-8 min-w-8 items-center justify-center rounded-md border px-1.5 text-xs font-semibold ${
              i === circleIndex
                ? "border-amber-400 bg-amber-400/20 text-amber-300 scale-110"
                : i < circleIndex
                ? "border-emerald-700 bg-emerald-400/5 text-emerald-500"
                : "border-slate-700 text-slate-500"
            }`}
          >
            {jazzRootName(root)}
          </span>
        ))}
      </div>
      <p className="text-center text-xs text-slate-500">周回数: {laps}</p>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">Key of {jazzRootName(keyRoot)}</p>
        <div className="mt-3 flex justify-center gap-3">
          {slots.map((s, i) => (
            <span
              key={s.label}
              className={`flex h-10 min-w-16 items-center justify-center rounded-lg border px-2 text-sm font-semibold ${IIVI_SLOT_COLOR[s.label]} ${
                i === step
                  ? "border-amber-400 bg-amber-400/20 scale-110"
                  : i < step
                  ? "border-emerald-600 bg-emerald-400/10"
                  : "border-slate-700 bg-slate-800/60"
              }`}
            >
              {chordSymbol(s)}
            </span>
          ))}
        </div>
        <p className="mt-4 text-3xl font-bold text-amber-300">{chordSymbol(current)}</p>
        <p className="mt-1 text-sm text-slate-300">{VOICING_TYPES[currentVoicingType].nameJa}</p>
        <p className="mt-3 text-sm text-slate-400">構成音(下から): {voicing.degrees.join(" - ")}</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <div>
            <p className="mb-1 text-xs text-slate-500">ボイシング種別</p>
            <select
              value={choice}
              onChange={(e) => setChoice(e.target.value as IiViVoicingChoice)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"
            >
              {IIVI_VOICING_CHOICES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500">オクターブ位置</p>
            <OctaveShiftControl value={octaveShift} onChange={setOctaveShift} />
          </div>
        </div>

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
            onClick={resetCycle}
            className="rounded-full border border-slate-700 px-4 py-1.5 text-xs text-slate-300 hover:border-slate-500"
          >
            🔁 Cから最初へ
          </button>
        </div>
      </div>

      <PianoKeyboard
        lowMidi={KEYBOARD_LOW}
        highMidi={KEYBOARD_HIGH}
        activeNotes={activeNotes}
        targetMidiNotes={targetMidiNotes}
        onNoteDown={pressNote}
        onNoteUp={releaseNote}
      />
    </div>
  );
}
