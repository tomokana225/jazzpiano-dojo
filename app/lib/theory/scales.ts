export type ScaleId =
  | "ionian"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "aeolian"
  | "locrian"
  | "melodicMinor"
  | "dorianB2"
  | "lydianAugmented"
  | "lydianDominant"
  | "mixolydianB6"
  | "halfDiminished"
  | "altered"
  | "harmonicMinor"
  | "phrygianDominant"
  | "wholeTone"
  | "dimWholeHalf"
  | "dimHalfWhole"
  | "bebopDominant"
  | "bebopMajor"
  | "blues"
  | "majorPentatonic"
  | "minorPentatonic";

export interface Scale {
  id: ScaleId;
  nameJa: string;
  nameEn: string;
  /** Semitone offsets from the root within one octave, ascending, no repeated top root. */
  intervals: number[];
  /** Typical chord context this scale is practiced/used over. */
  usageJa: string;
}

export const SCALES: Record<ScaleId, Scale> = {
  ionian: { id: "ionian", nameJa: "アイオニアン(メジャースケール)", nameEn: "Ionian", intervals: [0, 2, 4, 5, 7, 9, 11], usageJa: "Maj7" },
  dorian: { id: "dorian", nameJa: "ドリアン", nameEn: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10], usageJa: "m7" },
  phrygian: { id: "phrygian", nameJa: "フリジアン", nameEn: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10], usageJa: "m7 (b9)" },
  lydian: { id: "lydian", nameJa: "リディアン", nameEn: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11], usageJa: "Maj7(#11)" },
  mixolydian: { id: "mixolydian", nameJa: "ミクソリディアン", nameEn: "Mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10], usageJa: "7th" },
  aeolian: { id: "aeolian", nameJa: "エオリアン(自然的短音階)", nameEn: "Aeolian", intervals: [0, 2, 3, 5, 7, 8, 10], usageJa: "m7" },
  locrian: { id: "locrian", nameJa: "ロクリアン", nameEn: "Locrian", intervals: [0, 1, 3, 5, 6, 8, 10], usageJa: "m7b5 (静的)" },
  melodicMinor: { id: "melodicMinor", nameJa: "メロディックマイナー", nameEn: "Melodic Minor", intervals: [0, 2, 3, 5, 7, 9, 11], usageJa: "mMaj7" },
  dorianB2: { id: "dorianB2", nameJa: "ドリアンb2(フリジアン#6)", nameEn: "Dorian b2", intervals: [0, 1, 3, 5, 7, 9, 10], usageJa: "sus(b9) / m7(b9)" },
  lydianAugmented: { id: "lydianAugmented", nameJa: "リディアンオーギュメント", nameEn: "Lydian Augmented", intervals: [0, 2, 4, 6, 8, 9, 11], usageJa: "Maj7(#5)" },
  lydianDominant: { id: "lydianDominant", nameJa: "リディアンドミナント(リディアンb7)", nameEn: "Lydian Dominant", intervals: [0, 2, 4, 6, 7, 9, 10], usageJa: "7(#11)" },
  mixolydianB6: { id: "mixolydianB6", nameJa: "ミクソリディアンb6", nameEn: "Mixolydian b6", intervals: [0, 2, 4, 5, 7, 8, 10], usageJa: "7(b13)" },
  halfDiminished: { id: "halfDiminished", nameJa: "ハーフディミニッシュ(ロクリアン#2)", nameEn: "Half-Diminished (Locrian #2)", intervals: [0, 2, 3, 5, 6, 8, 10], usageJa: "m7b5 (ii-V-i マイナー)" },
  altered: { id: "altered", nameJa: "オルタード", nameEn: "Altered (Super Locrian)", intervals: [0, 1, 3, 4, 6, 8, 10], usageJa: "7alt" },
  harmonicMinor: { id: "harmonicMinor", nameJa: "ハーモニックマイナー", nameEn: "Harmonic Minor", intervals: [0, 2, 3, 5, 7, 8, 11], usageJa: "m(maj7)" },
  phrygianDominant: { id: "phrygianDominant", nameJa: "フリジアンドミナント", nameEn: "Phrygian Dominant", intervals: [0, 1, 4, 5, 7, 8, 10], usageJa: "7(b9,b13) → minor" },
  wholeTone: { id: "wholeTone", nameJa: "ホールトーン", nameEn: "Whole Tone", intervals: [0, 2, 4, 6, 8, 10], usageJa: "7(#5)" },
  dimWholeHalf: { id: "dimWholeHalf", nameJa: "ディミニッシュ(W-H)", nameEn: "Diminished (W-H)", intervals: [0, 2, 3, 5, 6, 8, 9, 11], usageJa: "dim7" },
  dimHalfWhole: { id: "dimHalfWhole", nameJa: "コンビネーションオブディミニッシュ(H-W)", nameEn: "Diminished (H-W)", intervals: [0, 1, 3, 4, 6, 7, 9, 10], usageJa: "7(b9)" },
  bebopDominant: { id: "bebopDominant", nameJa: "ビバップドミナント", nameEn: "Bebop Dominant", intervals: [0, 2, 4, 5, 7, 9, 10, 11], usageJa: "7th" },
  bebopMajor: { id: "bebopMajor", nameJa: "ビバップメジャー", nameEn: "Bebop Major", intervals: [0, 2, 4, 5, 7, 8, 9, 11], usageJa: "Maj7" },
  blues: { id: "blues", nameJa: "ブルーススケール", nameEn: "Blues Scale", intervals: [0, 3, 5, 6, 7, 10], usageJa: "7th / m7" },
  majorPentatonic: { id: "majorPentatonic", nameJa: "メジャーペンタトニック", nameEn: "Major Pentatonic", intervals: [0, 2, 4, 7, 9], usageJa: "Maj7" },
  minorPentatonic: { id: "minorPentatonic", nameJa: "マイナーペンタトニック", nameEn: "Minor Pentatonic", intervals: [0, 3, 5, 7, 10], usageJa: "m7" },
};

export const SCALE_ORDER: ScaleId[] = [
  "ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian",
  "melodicMinor", "dorianB2", "lydianAugmented", "lydianDominant", "mixolydianB6", "halfDiminished", "altered",
  "harmonicMinor", "phrygianDominant",
  "wholeTone", "dimWholeHalf", "dimHalfWhole",
  "bebopDominant", "bebopMajor",
  "blues", "majorPentatonic", "minorPentatonic",
];

/** A practical starter set shown by default in the trainer; the rest are opt-in via chips. */
export const DEFAULT_PRACTICE_SCALES: ScaleId[] = [
  "ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian",
];

/** Full ascending sequence of pitch classes including the octave root at the end. */
export function scaleSequence(scale: Scale): number[] {
  return [...scale.intervals, 12];
}

/**
 * Semitone offset from the root for an arbitrary (possibly negative, possibly
 * >= scale length) scale-degree index, wrapping into neighboring octaves.
 * Degree index 0 is the root, `scale.intervals.length` is the octave root.
 */
export function scaleDegreeSemitone(scale: Scale, degreeIndex: number): number {
  const len = scale.intervals.length;
  const octave = Math.floor(degreeIndex / len);
  const idx = ((degreeIndex % len) + len) % len;
  return octave * 12 + scale.intervals[idx];
}

const SCALE_DEGREE_LABELS: Record<number, string> = {
  0: "1", 1: "b2", 2: "2", 3: "b3", 4: "3", 5: "4", 6: "b5", 7: "5", 8: "b6", 9: "6", 10: "b7", 11: "7",
};

/** Degree label (e.g. "b3", "5") for a semitone offset from the root, used for on-keyboard display. */
export function scaleDegreeLabel(offset: number): string {
  return SCALE_DEGREE_LABELS[((offset % 12) + 12) % 12] ?? `${offset}`;
}
