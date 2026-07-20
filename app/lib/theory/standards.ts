import type { ChordQualityId } from "./chords";
import type { PitchClass } from "./notes";

export interface StandardChord {
  root: PitchClass;
  quality: ChordQualityId;
  /** Duration in quarter-note beats (bar = 4 beats, 4/4 assumed). */
  beats: number;
}

export interface Standard {
  id: string;
  titleJa: string;
  titleEn: string;
  key: PitchClass;
  suggestedBpm: number;
  descriptionJa: string;
  /** Flat list of chords with beat durations; bars are implied by beats summing to 4. */
  chords: StandardChord[];
}

// Pitch classes: C=0 Db=1 D=2 Eb=3 E=4 F=5 F#=6 G=7 Ab=8 A=9 Bb=10 B=11
const C = 0, Db = 1, D = 2, Eb = 3, E = 4, F = 5, Fs = 6, G = 7, Ab = 8, A = 9, Bb = 10, B = 11;

export const STANDARDS: Standard[] = [
  {
    id: "autumn-leaves",
    titleJa: "枯葉 (Autumn Leaves)",
    titleEn: "Autumn Leaves",
    key: G,
    suggestedBpm: 130,
    descriptionJa:
      "循環コード進行の代表曲。A-A-B-Cの32小節フルコーラス。ii-V-I(メジャー)と ii-V-i(マイナー)が交互に現れ、Cセクションは半音下行するターンアラウンドで締めくくる。",
    chords: [
      // A (1-8)
      { root: C, quality: "min7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      { root: Bb, quality: "maj7", beats: 4 },
      { root: Eb, quality: "maj7", beats: 4 },
      { root: A, quality: "min7b5", beats: 4 },
      { root: D, quality: "dom7", beats: 4 },
      { root: G, quality: "min6", beats: 4 },
      { root: G, quality: "min6", beats: 4 },
      // A' (9-16)
      { root: C, quality: "min7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      { root: Bb, quality: "maj7", beats: 4 },
      { root: Eb, quality: "maj7", beats: 4 },
      { root: A, quality: "min7b5", beats: 4 },
      { root: D, quality: "dom7", beats: 4 },
      { root: G, quality: "min6", beats: 4 },
      { root: G, quality: "min6", beats: 4 },
      // B (17-24)
      { root: A, quality: "min7b5", beats: 4 },
      { root: D, quality: "dom7", beats: 4 },
      { root: G, quality: "min6", beats: 4 },
      { root: G, quality: "min6", beats: 4 },
      { root: C, quality: "min7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      { root: Bb, quality: "maj7", beats: 4 },
      { root: Eb, quality: "maj7", beats: 4 },
      // C (25-32) - chromatically descending turnaround ending
      { root: A, quality: "min7b5", beats: 4 },
      { root: D, quality: "dom7", beats: 4 },
      { root: G, quality: "min7", beats: 2 }, { root: Fs, quality: "dom7", beats: 2 },
      { root: F, quality: "min7", beats: 2 }, { root: E, quality: "dom7", beats: 2 },
      { root: A, quality: "min7b5", beats: 4 },
      { root: D, quality: "dom7", beats: 4 },
      { root: G, quality: "min6", beats: 4 },
      { root: G, quality: "min6", beats: 4 },
    ],
  },
  {
    id: "jazz-blues-f",
    titleJa: "ジャズブルース (F) 12小節",
    titleEn: "F Jazz Blues",
    key: F,
    suggestedBpm: 120,
    descriptionJa: "王道の12小節ジャズブルース進行。ドミナント7thとii-Vターンアラウンドの練習に。",
    chords: [
      { root: F, quality: "dom7", beats: 4 },
      { root: Bb, quality: "dom7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      { root: Bb, quality: "dom7", beats: 4 },
      { root: Bb, quality: "dom7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      { root: D, quality: "dom7", beats: 4 },
      { root: G, quality: "min7", beats: 4 },
      { root: C, quality: "dom7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      { root: C, quality: "dom7", beats: 4 },
    ],
  },
  {
    id: "rhythm-changes",
    titleJa: "リズムチェンジ (Bb)",
    titleEn: "Rhythm Changes",
    key: Bb,
    suggestedBpm: 160,
    descriptionJa:
      "「アイ・ガット・リズム」に代表されるサイクル進行。I-vi-ii-V が続くA-A-B-Aの32小節フル形式で、ブリッジは3-6-2-5のドミナント7thが2小節ずつ循環する。",
    chords: [
      // A (1-8)
      { root: Bb, quality: "maj6", beats: 4 },
      { root: G, quality: "min7", beats: 4 },
      { root: C, quality: "min7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      { root: Bb, quality: "maj6", beats: 4 },
      { root: G, quality: "min7", beats: 4 },
      { root: C, quality: "min7", beats: 2 }, { root: F, quality: "dom7", beats: 2 },
      { root: Bb, quality: "maj6", beats: 4 },
      // A (9-16)
      { root: Bb, quality: "maj6", beats: 4 },
      { root: G, quality: "min7", beats: 4 },
      { root: C, quality: "min7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      { root: Bb, quality: "maj6", beats: 4 },
      { root: G, quality: "min7", beats: 4 },
      { root: C, quality: "min7", beats: 2 }, { root: F, quality: "dom7", beats: 2 },
      { root: Bb, quality: "maj6", beats: 4 },
      // B - bridge (17-24): III7-VI7-II7-V7, 2 bars each
      { root: D, quality: "dom7", beats: 4 },
      { root: D, quality: "dom7", beats: 4 },
      { root: G, quality: "dom7", beats: 4 },
      { root: G, quality: "dom7", beats: 4 },
      { root: C, quality: "dom7", beats: 4 },
      { root: C, quality: "dom7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      // A (25-32)
      { root: Bb, quality: "maj6", beats: 4 },
      { root: G, quality: "min7", beats: 4 },
      { root: C, quality: "min7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      { root: Bb, quality: "maj6", beats: 4 },
      { root: G, quality: "min7", beats: 4 },
      { root: C, quality: "min7", beats: 2 }, { root: F, quality: "dom7", beats: 2 },
      { root: Bb, quality: "maj6", beats: 4 },
    ],
  },
  {
    id: "so-what",
    titleJa: "ソー・ホワット風モーダル・ヴァンプ",
    titleEn: "Modal Vamp (So What style)",
    key: D,
    suggestedBpm: 136,
    descriptionJa:
      "ドリアン・モードのみで構成されるモーダル進行。Dm7が16小節続いた後、半音上のEbm7で8小節のブリッジ、最後にDm7へ8小節戻るA-A-B-Aの32小節フル形式。",
    chords: [
      // A-A: D dorian, 16 bars
      { root: D, quality: "min7", beats: 4 }, { root: D, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 }, { root: D, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 }, { root: D, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 }, { root: D, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 }, { root: D, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 }, { root: D, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 }, { root: D, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 }, { root: D, quality: "min7", beats: 4 },
      // B: Eb dorian, 8 bars
      { root: Eb, quality: "min7", beats: 4 }, { root: Eb, quality: "min7", beats: 4 },
      { root: Eb, quality: "min7", beats: 4 }, { root: Eb, quality: "min7", beats: 4 },
      { root: Eb, quality: "min7", beats: 4 }, { root: Eb, quality: "min7", beats: 4 },
      { root: Eb, quality: "min7", beats: 4 }, { root: Eb, quality: "min7", beats: 4 },
      // A: D dorian, 8 bars
      { root: D, quality: "min7", beats: 4 }, { root: D, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 }, { root: D, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 }, { root: D, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 }, { root: D, quality: "min7", beats: 4 },
    ],
  },
  {
    id: "all-the-things-you-are",
    titleJa: "All The Things You Are",
    titleEn: "All The Things You Are",
    key: Ab,
    suggestedBpm: 132,
    descriptionJa:
      "曲中で最も有名な、Ab→C→G→Ab(コーダでE経由)と転調しながら連なる ii-V-I チェーンが特徴のA-A-B-A'形式、コーダ込みで36小節のフル形式。",
    chords: [
      // A1 (1-8): Ab → tonicize C
      { root: F, quality: "min7", beats: 4 },
      { root: Bb, quality: "min7", beats: 4 },
      { root: Eb, quality: "dom7", beats: 4 },
      { root: Ab, quality: "maj7", beats: 4 },
      { root: Db, quality: "maj7", beats: 4 },
      { root: D, quality: "min7", beats: 2 }, { root: G, quality: "dom7", beats: 2 },
      { root: C, quality: "maj7", beats: 4 },
      { root: C, quality: "maj7", beats: 4 },
      // A2 (9-16): C → tonicize Eb → tonicize G
      { root: C, quality: "min7", beats: 4 },
      { root: F, quality: "min7", beats: 4 },
      { root: Bb, quality: "dom7", beats: 4 },
      { root: Eb, quality: "maj7", beats: 4 },
      { root: Ab, quality: "maj7", beats: 4 },
      { root: A, quality: "min7", beats: 2 }, { root: D, quality: "dom7", beats: 2 },
      { root: G, quality: "maj7", beats: 4 },
      { root: G, quality: "maj7", beats: 4 },
      // B - bridge (17-24): stays on G, then tonicizes E
      { root: A, quality: "min7", beats: 4 },
      { root: D, quality: "dom7", beats: 4 },
      { root: G, quality: "maj7", beats: 4 },
      { root: G, quality: "maj7", beats: 4 },
      { root: Fs, quality: "min7b5", beats: 4 },
      { root: B, quality: "dom7", beats: 4 },
      { root: E, quality: "maj7", beats: 4 },
      { root: C, quality: "dom7", beats: 4 },
      // A' + coda (25-36): back home to Ab, extended cadence
      { root: F, quality: "min7", beats: 4 },
      { root: Bb, quality: "min7", beats: 4 },
      { root: Eb, quality: "dom7", beats: 4 },
      { root: Ab, quality: "maj7", beats: 4 },
      { root: Db, quality: "maj7", beats: 4 },
      { root: Db, quality: "minMaj7", beats: 4 },
      { root: C, quality: "min7", beats: 4 },
      { root: B, quality: "dim7", beats: 4 },
      { root: Bb, quality: "min7", beats: 4 },
      { root: Eb, quality: "dom7", beats: 4 },
      { root: Ab, quality: "maj7", beats: 4 },
      { root: G, quality: "min7b5", beats: 2 }, { root: C, quality: "dom7", beats: 2 },
    ],
  },
  {
    id: "turnaround-etude",
    titleJa: "ターンアラウンド・エチュード (4キー巡回)",
    titleEn: "I-vi-ii-V Turnaround Etude",
    key: C,
    suggestedBpm: 120,
    descriptionJa: "I-vi-ii-V ターンアラウンドを C→F→Bb→Eb と4つのキーで巡回するオリジナル練習エチュード。",
    chords: [
      { root: C, quality: "maj7", beats: 1 }, { root: A, quality: "min7", beats: 1 }, { root: D, quality: "min7", beats: 1 }, { root: G, quality: "dom7", beats: 1 },
      { root: F, quality: "maj7", beats: 1 }, { root: D, quality: "min7", beats: 1 }, { root: G, quality: "min7", beats: 1 }, { root: C, quality: "dom7", beats: 1 },
      { root: Bb, quality: "maj7", beats: 1 }, { root: G, quality: "min7", beats: 1 }, { root: C, quality: "min7", beats: 1 }, { root: F, quality: "dom7", beats: 1 },
      { root: Eb, quality: "maj7", beats: 1 }, { root: C, quality: "min7", beats: 1 }, { root: F, quality: "min7", beats: 1 }, { root: Bb, quality: "dom7", beats: 1 },
    ],
  },
];

export function standardTotalBeats(standard: Standard): number {
  return standard.chords.reduce((sum, c) => sum + c.beats, 0);
}
