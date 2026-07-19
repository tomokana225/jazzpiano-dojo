// Chromatic approach-note patterns: short runs that lead melodically into a
// chord tone from a half step (or two) away, including "enclosures" that
// surround the target from both sides before landing on it. Every pattern
// is expressed as semitone offsets from the TARGET note (offset 0), in the
// order they're played, with the target itself always last.

export type ApproachPatternId =
  | "chromaticBelow"
  | "chromaticAbove"
  | "doubleChromaticBelow"
  | "doubleChromaticAbove"
  | "enclosureAboveBelow"
  | "enclosureBelowAbove"
  | "scaleChromaticEnclosure";

export interface ApproachPattern {
  id: ApproachPatternId;
  nameJa: string;
  descriptionJa: string;
  /** Semitone offsets from the target note, in play order; the last entry is always 0 (the target). */
  offsets: number[];
}

export const APPROACH_PATTERNS: Record<ApproachPatternId, ApproachPattern> = {
  chromaticBelow: {
    id: "chromaticBelow",
    nameJa: "半音下からのアプローチ",
    descriptionJa: "ターゲットの半音下から入って解決する、最も基本的なクロマチックアプローチ。",
    offsets: [-1, 0],
  },
  chromaticAbove: {
    id: "chromaticAbove",
    nameJa: "半音上からのアプローチ",
    descriptionJa: "ターゲットの半音上から入って解決する。上からの半音アプローチも下からと同じくらい多用される。",
    offsets: [1, 0],
  },
  doubleChromaticBelow: {
    id: "doubleChromaticBelow",
    nameJa: "半音2つ下から駆け上がるアプローチ",
    descriptionJa: "ターゲットの2半音下から半音ずつ駆け上がって解決する。",
    offsets: [-2, -1, 0],
  },
  doubleChromaticAbove: {
    id: "doubleChromaticAbove",
    nameJa: "半音2つ上から駆け下りるアプローチ",
    descriptionJa: "ターゲットの2半音上から半音ずつ駆け下りて解決する。",
    offsets: [2, 1, 0],
  },
  enclosureAboveBelow: {
    id: "enclosureAboveBelow",
    nameJa: "エンクロージャー(上→下)",
    descriptionJa: "半音上・半音下でターゲットを挟み込んでから解決する、定番のエンクロージャー(囲い込み)。",
    offsets: [1, -1, 0],
  },
  enclosureBelowAbove: {
    id: "enclosureBelowAbove",
    nameJa: "エンクロージャー(下→上)",
    descriptionJa: "半音下・半音上の順でターゲットを挟み込んでから解決するエンクロージャー。",
    offsets: [-1, 1, 0],
  },
  scaleChromaticEnclosure: {
    id: "scaleChromaticEnclosure",
    nameJa: "スケール+半音のエンクロージャー",
    descriptionJa:
      "全音上(スケールトーン)・半音下(クロマチック)でターゲットを挟み込むビバップ語法の代表的なエンクロージャー。",
    offsets: [2, -1, 0],
  },
};

export const APPROACH_PATTERN_ORDER: ApproachPatternId[] = [
  "chromaticBelow",
  "chromaticAbove",
  "enclosureAboveBelow",
  "scaleChromaticEnclosure",
  "doubleChromaticBelow",
  "doubleChromaticAbove",
  "enclosureBelowAbove",
];

/** A practical starter set shown by default; the rest are opt-in via chips. */
export const DEFAULT_APPROACH_PATTERNS: ApproachPatternId[] = [
  "chromaticBelow",
  "chromaticAbove",
  "enclosureAboveBelow",
  "scaleChromaticEnclosure",
];
