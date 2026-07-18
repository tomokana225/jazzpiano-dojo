// II-V-I licks: each note is expressed as a semitone offset from the KEY
// root (the I chord), which lets us transpose a lick into any of the 12
// keys just by adding the key's root pitch class to every note.
//
// Durations are in eighth-note units (1 = eighth, 2 = quarter, 4 = half,
// 8 = whole). `chord` marks which chord of the ii-V-I the note belongs to,
// used purely for coloring/labeling in the UI.

export type LickChordSlot = "ii" | "V" | "I";

export interface LickNote {
  semitone: number; // offset from key root, may be negative or > 12
  dur: number; // eighth-note units
  chord: LickChordSlot;
}

export interface Lick {
  id: string;
  nameJa: string;
  descriptionJa: string;
  notes: LickNote[];
}

export const II_V_I_LICKS: Lick[] = [
  {
    id: "chord-tone-descent",
    nameJa: "コードトーン下降ライン",
    descriptionJa: "ii7・V7 のコードトーンを4分音符でアルペジオ下降し、I の3rdに解決する定番フレーズ。",
    notes: [
      { semitone: 2, dur: 2, chord: "ii" }, // D  (R)
      { semitone: 5, dur: 2, chord: "ii" }, // F  (b3)
      { semitone: 9, dur: 2, chord: "ii" }, // A  (5)
      { semitone: 12, dur: 2, chord: "ii" }, // C  (b7)
      { semitone: 11, dur: 2, chord: "V" }, // B  (3)
      { semitone: 9, dur: 2, chord: "V" }, // A  (9)
      { semitone: 7, dur: 2, chord: "V" }, // G  (R)
      { semitone: 5, dur: 2, chord: "V" }, // F  (b7)
      { semitone: 4, dur: 8, chord: "I" }, // E  (3) held
    ],
  },
  {
    id: "guide-tone-line",
    nameJa: "ガイドトーンライン",
    descriptionJa: "3rd と 7th だけを使ったガイドトーンの受け渡し。声部進行の基礎練習に最適。",
    notes: [
      { semitone: 12, dur: 4, chord: "ii" }, // C  (b7 of Dm7)
      { semitone: 11, dur: 4, chord: "V" }, // B  (3 of G7)
      { semitone: 5, dur: 4, chord: "V" }, // F  (b7 of G7)
      { semitone: 4, dur: 8, chord: "I" }, // E  (3 of Cmaj7) held
    ],
  },
  {
    id: "chromatic-enclosure",
    nameJa: "クロマチック・エンクロージャー",
    descriptionJa: "V7 の3rdを上下の半音で囲い込む(エンクロージャー)ビバップ語法。",
    notes: [
      { semitone: 2, dur: 2, chord: "ii" }, // D  (R)
      { semitone: 5, dur: 2, chord: "ii" }, // F  (b3)
      { semitone: 9, dur: 2, chord: "ii" }, // A  (5)
      { semitone: 13, dur: 1, chord: "ii" }, // C# (upper enclosure)
      { semitone: 10, dur: 1, chord: "V" }, // Bb (lower enclosure)
      { semitone: 11, dur: 2, chord: "V" }, // B  (3, target)
      { semitone: 9, dur: 2, chord: "V" }, // A  (9)
      { semitone: 7, dur: 2, chord: "V" }, // G  (R)
      { semitone: 5, dur: 2, chord: "V" }, // F  (b7)
      { semitone: 4, dur: 8, chord: "I" }, // E  (3) held
    ],
  },
  {
    id: "bebop-dominant-run",
    nameJa: "ビバップ・ドミナント・スケール ライン",
    descriptionJa: "ii7 をアルペジオ、V7 をビバップドミナントスケールで駆け下り I へ着地する。",
    notes: [
      { semitone: 2, dur: 2, chord: "ii" }, // D
      { semitone: 5, dur: 2, chord: "ii" }, // F
      { semitone: 9, dur: 2, chord: "ii" }, // A
      { semitone: 12, dur: 2, chord: "ii" }, // C
      { semitone: 7, dur: 1, chord: "V" }, // G
      { semitone: 6, dur: 1, chord: "V" }, // F# (bebop passing tone)
      { semitone: 5, dur: 1, chord: "V" }, // F
      { semitone: 4, dur: 1, chord: "V" }, // E
      { semitone: 2, dur: 1, chord: "V" }, // D
      { semitone: 0, dur: 1, chord: "V" }, // C
      { semitone: -1, dur: 1, chord: "V" }, // B
      { semitone: -3, dur: 1, chord: "V" }, // A
      { semitone: -8, dur: 8, chord: "I" }, // E (3, an octave down) held
    ],
  },
];

export function totalLickBeats(lick: Lick): number {
  return lick.notes.reduce((sum, n) => sum + n.dur, 0);
}
