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
    titleJa: "枯葉 (Autumn Leaves) 練習ループ",
    titleEn: "Autumn Leaves",
    key: G,
    suggestedBpm: 130,
    descriptionJa: "循環コード進行の代表曲。ii-V-I(メジャー)と ii-V-i(マイナー)が交互に現れる16小節ループ。",
    chords: [
      { root: C, quality: "min7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      { root: Bb, quality: "maj7", beats: 4 },
      { root: Eb, quality: "maj7", beats: 4 },
      { root: A, quality: "min7b5", beats: 4 },
      { root: D, quality: "dom7", beats: 4 },
      { root: G, quality: "min6", beats: 4 },
      { root: G, quality: "min6", beats: 4 },
      { root: A, quality: "min7b5", beats: 4 },
      { root: D, quality: "dom7", beats: 4 },
      { root: G, quality: "min6", beats: 4 },
      { root: G, quality: "min6", beats: 4 },
      { root: C, quality: "min7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      { root: Bb, quality: "maj7", beats: 4 },
      { root: Eb, quality: "maj7", beats: 4 },
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
    id: "rhythm-changes-a",
    titleJa: "リズムチェンジ A メロ (Bb)",
    titleEn: "Rhythm Changes (A section)",
    key: Bb,
    suggestedBpm: 160,
    descriptionJa: "「アイ・ガット・リズム」に代表されるサイクル進行。I-vi-ii-V の連続を素早く処理する練習。",
    chords: [
      { root: Bb, quality: "maj6", beats: 4 },
      { root: G, quality: "min7", beats: 4 },
      { root: C, quality: "min7", beats: 4 },
      { root: F, quality: "dom7", beats: 4 },
      { root: Bb, quality: "maj6", beats: 4 },
      { root: G, quality: "min7", beats: 4 },
      { root: C, quality: "min7", beats: 2 },
      { root: F, quality: "dom7", beats: 2 },
      { root: Bb, quality: "maj6", beats: 4 },
    ],
  },
  {
    id: "so-what",
    titleJa: "ソー・ホワット風モーダル・ヴァンプ",
    titleEn: "Modal Vamp (So What style)",
    key: D,
    suggestedBpm: 136,
    descriptionJa: "ドリアン・モードのみで構成されるモーダル進行。Dm7を中心に半音上のEbm7へ移る8小節ループ。",
    chords: [
      { root: D, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 },
      { root: Eb, quality: "min7", beats: 4 },
      { root: Eb, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 },
      { root: D, quality: "min7", beats: 4 },
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
