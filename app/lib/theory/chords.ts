import { jazzRootName, pc, type PitchClass } from "./notes";

export type ChordQualityId =
  | "maj7"
  | "maj6"
  | "dom7"
  | "min7"
  | "min6"
  | "minMaj7"
  | "min7b5"
  | "dim7"
  | "aug7"
  | "sus7"
  | "maj"
  | "min"
  | "dim";

export interface ChordQuality {
  id: ChordQualityId;
  /** Symbol suffix appended to the root, e.g. "maj7" -> "Cmaj7". */
  suffix: string;
  /** Human readable name in Japanese for UI copy. */
  labelJa: string;
  /** Semitone offsets from the root, ascending, root always 0. */
  intervals: number[];
  /** Degree labels matching `intervals`, used for voicing/lick math. */
  degrees: string[];
}

export const CHORD_QUALITIES: Record<ChordQualityId, ChordQuality> = {
  maj7: { id: "maj7", suffix: "maj7", labelJa: "メジャーセブンス", intervals: [0, 4, 7, 11], degrees: ["R", "3", "5", "7"] },
  maj6: { id: "maj6", suffix: "6", labelJa: "メジャーシックス", intervals: [0, 4, 7, 9], degrees: ["R", "3", "5", "6"] },
  dom7: { id: "dom7", suffix: "7", labelJa: "ドミナントセブンス", intervals: [0, 4, 7, 10], degrees: ["R", "3", "5", "b7"] },
  min7: { id: "min7", suffix: "m7", labelJa: "マイナーセブンス", intervals: [0, 3, 7, 10], degrees: ["R", "b3", "5", "b7"] },
  min6: { id: "min6", suffix: "m6", labelJa: "マイナーシックス", intervals: [0, 3, 7, 9], degrees: ["R", "b3", "5", "6"] },
  minMaj7: { id: "minMaj7", suffix: "mMaj7", labelJa: "マイナーメジャーセブンス", intervals: [0, 3, 7, 11], degrees: ["R", "b3", "5", "7"] },
  min7b5: { id: "min7b5", suffix: "m7b5", labelJa: "マイナーセブンフラットファイブ", intervals: [0, 3, 6, 10], degrees: ["R", "b3", "b5", "b7"] },
  dim7: { id: "dim7", suffix: "dim7", labelJa: "ディミニッシュセブンス", intervals: [0, 3, 6, 9], degrees: ["R", "b3", "b5", "bb7"] },
  aug7: { id: "aug7", suffix: "aug7", labelJa: "オーギュメントセブンス", intervals: [0, 4, 8, 10], degrees: ["R", "3", "#5", "b7"] },
  sus7: { id: "sus7", suffix: "7sus4", labelJa: "セブンスサスフォー", intervals: [0, 5, 7, 10], degrees: ["R", "4", "5", "b7"] },
  maj: { id: "maj", suffix: "", labelJa: "メジャートライアド", intervals: [0, 4, 7], degrees: ["R", "3", "5"] },
  min: { id: "min", suffix: "m", labelJa: "マイナートライアド", intervals: [0, 3, 7], degrees: ["R", "b3", "5"] },
  dim: { id: "dim", suffix: "dim", labelJa: "ディミニッシュトライアド", intervals: [0, 3, 6], degrees: ["R", "b3", "b5"] },
};

export const SEVENTH_CHORD_QUALITIES: ChordQualityId[] = [
  "maj7", "dom7", "min7", "min7b5", "dim7", "maj6", "min6",
];

export interface ChordSpec {
  root: PitchClass;
  quality: ChordQualityId;
}

export function chordSymbol(spec: ChordSpec): string {
  return `${jazzRootName(spec.root)}${CHORD_QUALITIES[spec.quality].suffix}`;
}

/** Pitch classes that make up the chord, in interval order starting at root. */
export function chordTones(spec: ChordSpec): PitchClass[] {
  const q = CHORD_QUALITIES[spec.quality];
  return q.intervals.map((i) => pc(spec.root + i));
}

export function chordToneDegrees(spec: ChordSpec): { pitchClass: PitchClass; degree: string }[] {
  const q = CHORD_QUALITIES[spec.quality];
  return q.intervals.map((interval, idx) => ({
    pitchClass: pc(spec.root + interval),
    degree: q.degrees[idx],
  }));
}
