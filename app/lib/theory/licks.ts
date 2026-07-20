// II-V-I licks: each note is expressed as a semitone offset from the KEY
// root (the I chord), which lets us transpose a lick into any of the 12
// keys just by adding the key's root pitch class to every note.
//
// Durations are in eighth-note units (1 = eighth, 2 = quarter, 4 = half,
// 8 = whole). 0.5 = sixteenth, 2/3 = eighth-note triplet. `chord` marks
// which chord of the ii-V-I the note belongs to, used purely for
// coloring/labeling in the UI.

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

const T = 2 / 3; // eighth-note triplet unit

export const II_V_I_LICKS: Lick[] = [
  {
    id: "chord-tone-descent",
    nameJa: "コードトーン下降ライン",
    descriptionJa:
      "ii7・V7 のコードトーンを4分音符でアルペジオ下降し、I の3rdに着地した後、9th・ルートへ下降する短いターンで締めくくる定番フレーズ。",
    notes: [
      { semitone: 2, dur: 2, chord: "ii" }, // D  (R)
      { semitone: 5, dur: 2, chord: "ii" }, // F  (b3)
      { semitone: 9, dur: 2, chord: "ii" }, // A  (5)
      { semitone: 12, dur: 2, chord: "ii" }, // C  (b7)
      { semitone: 11, dur: 2, chord: "V" }, // B  (3)
      { semitone: 9, dur: 2, chord: "V" }, // A  (9)
      { semitone: 7, dur: 2, chord: "V" }, // G  (R)
      { semitone: 5, dur: 2, chord: "V" }, // F  (b7)
      { semitone: 4, dur: 3, chord: "I" }, // E  (3) 着地
      { semitone: 2, dur: 3, chord: "I" }, // D  (9) 経過
      { semitone: 0, dur: 2, chord: "I" }, // C  (R) 着地
    ],
  },
  {
    id: "guide-tone-line",
    nameJa: "ガイドトーンライン",
    descriptionJa:
      "3rd と 7th だけを使ったガイドトーンの受け渡し。声部進行の基礎練習に最適で、Iに入ってからも9th・ルートへ静かに降りていく。",
    notes: [
      { semitone: 12, dur: 4, chord: "ii" }, // C  (b7 of Dm7)
      { semitone: 11, dur: 4, chord: "V" }, // B  (3 of G7)
      { semitone: 5, dur: 4, chord: "V" }, // F  (b7 of G7)
      { semitone: 4, dur: 4, chord: "I" }, // E  (3 of Cmaj7) 着地
      { semitone: 2, dur: 2, chord: "I" }, // D  (9)
      { semitone: 0, dur: 2, chord: "I" }, // C  (R)
    ],
  },
  {
    id: "chromatic-enclosure",
    nameJa: "クロマチック・エンクロージャー",
    descriptionJa:
      "V7 の3rdを上下の半音で囲い込む(エンクロージャー)ビバップ語法。Iの3rdにも16分音符の二重エンクロージャーをかけ、5th・ルートへ抜ける。",
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
      { semitone: 5, dur: 0.5, chord: "I" }, // F  (16分, 上のエンクロージャー)
      { semitone: 3, dur: 0.5, chord: "I" }, // Eb (16分, 下のエンクロージャー)
      { semitone: 4, dur: 2, chord: "I" }, // E  (3, target)
      { semitone: 7, dur: 2, chord: "I" }, // G  (5)
      { semitone: 0, dur: 3, chord: "I" }, // C  (R) 着地
    ],
  },
  {
    id: "bebop-dominant-run",
    nameJa: "ビバップ・ドミナント・スケール ライン",
    descriptionJa:
      "ii7 をアルペジオ、V7 をビバップドミナントスケールで駆け下りIへ着地。3rdに着地した後は3連符のターンでルートへ抜ける、止まらず動き続けるフレージング。",
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
      { semitone: -8, dur: 2, chord: "I" }, // E (3, オクターブ下) 着地
      { semitone: -7, dur: T, chord: "I" }, // F  (3連符・上の隣接音)
      { semitone: -9, dur: T, chord: "I" }, // Eb (3連符・下の隣接音)
      { semitone: -8, dur: T, chord: "I" }, // E  (3連符・ターゲットへ戻る)
      { semitone: -12, dur: 4, chord: "I" }, // C (R, オクターブ下) 着地
    ],
  },
  {
    id: "evans-extensions-line",
    nameJa: "エヴァンス風 9th/13thカラーライン",
    descriptionJa:
      "ビル・エヴァンスに代表される、9th/13thをコードトーンと同格に扱う語法。R-9-5-b7、3-13-9-3と積み、Iに入ってからも9th→13th→5thとカラートーンを渡り歩いて締める。",
    notes: [
      { semitone: 2, dur: 2, chord: "ii" }, // D  (R)
      { semitone: 4, dur: 2, chord: "ii" }, // E  (9)
      { semitone: 9, dur: 2, chord: "ii" }, // A  (5)
      { semitone: 12, dur: 2, chord: "ii" }, // C  (b7)
      { semitone: 11, dur: 2, chord: "V" }, // B  (3)
      { semitone: 16, dur: 2, chord: "V" }, // E  (13)
      { semitone: 14, dur: 2, chord: "V" }, // D  (9)
      { semitone: 11, dur: 2, chord: "V" }, // B  (3)
      { semitone: 14, dur: 3, chord: "I" }, // D  (9 of Cmaj7) 着地
      { semitone: 21, dur: 3, chord: "I" }, // A  (13) カラートーンへ
      { semitone: 19, dur: 2, chord: "I" }, // G  (5) 着地
    ],
  },
  {
    id: "evans-anticipation",
    nameJa: "エヴァンス風シンコペーション&タイ",
    descriptionJa:
      "ビル・エヴァンスら多くの奏者が使う、Iの解決音を1拍早く先取りしてタイで小節をまたぐフレージング。裏拍でのアプローチと「前のめり」な解決感が特徴で、着地後は9th・ルートへ短く降りる。",
    notes: [
      { semitone: 2, dur: 2, chord: "ii" }, // D  (R)
      { semitone: 5, dur: 2, chord: "ii" }, // F  (b3)
      { semitone: 9, dur: 2, chord: "ii" }, // A  (5)
      { semitone: 12, dur: 2, chord: "ii" }, // C  (b7)
      { semitone: 11, dur: 2, chord: "V" }, // B  (3)
      { semitone: 9, dur: 2, chord: "V" }, // A  (9)
      { semitone: 7, dur: 2, chord: "V" }, // G  (R)
      { semitone: 16, dur: 4, chord: "I" }, // E (3 of Cmaj7) - 1拍早く入り、小節をまたいでタイで保持
      { semitone: 14, dur: 2, chord: "I" }, // D  (9)
      { semitone: 12, dur: 2, chord: "I" }, // C  (R) 着地
    ],
  },
  {
    id: "sixteenth-turn-figures",
    nameJa: "16分音符ターン・フィギュア",
    descriptionJa:
      "ターゲット音を上下の隣接音で挟む「ターン」を16分音符4つで駆け抜けるバードばりの装飾。ii・V・Iそれぞれのコードトーンにターンをかけながら流れるように解決する。",
    notes: [
      { semitone: 2, dur: 2, chord: "ii" }, // D  (R)
      { semitone: 5, dur: 2, chord: "ii" }, // F  (b3)
      { semitone: 7, dur: 0.5, chord: "ii" }, // G  (16分, 下の隣接音)
      { semitone: 9, dur: 0.5, chord: "ii" }, // A  (16分, ターゲット/5th)
      { semitone: 11, dur: 0.5, chord: "ii" }, // B  (16分, 上の隣接音)
      { semitone: 9, dur: 0.5, chord: "ii" }, // A  (16分, ターゲットへ戻る)
      { semitone: 12, dur: 2, chord: "ii" }, // C  (b7)
      { semitone: 9, dur: 1, chord: "V" }, // A  (9)
      { semitone: 7, dur: 1, chord: "V" }, // G  (R)
      { semitone: 5, dur: 1, chord: "V" }, // F  (b7)
      { semitone: 4, dur: 1, chord: "V" }, // E  (13)
      { semitone: 12, dur: 0.5, chord: "V" }, // C  (16分, 上の半音エンクロージャー)
      { semitone: 10, dur: 0.5, chord: "V" }, // Bb (16分, 下の半音エンクロージャー)
      { semitone: 11, dur: 1, chord: "V" }, // B  (3, target)
      { semitone: 14, dur: 1, chord: "V" }, // D  (9) 上昇して勢いをつける
      { semitone: 12, dur: 2, chord: "I" }, // C  (R) 着地
      { semitone: 14, dur: 0.5, chord: "I" }, // D  (16分, 9th)
      { semitone: 16, dur: 0.5, chord: "I" }, // E  (16分, 3rd)
      { semitone: 18, dur: 0.5, chord: "I" }, // F# (16分, #11のカラー)
      { semitone: 19, dur: 0.5, chord: "I" }, // G  (16分, 5th)
      { semitone: 16, dur: 3, chord: "I" }, // E  (3) 着地
    ],
  },
  {
    id: "triplet-turn-lick",
    nameJa: "3連符ターン・ライン",
    descriptionJa:
      "8分音符3連符でターンや半音囲い込みを繰り出す、スウィング~ビバップに共通する語法。3拍子的な浮遊感を作りながらii-V-Iを駆け抜け、Iでも3連符のエンクロージャーで締める。",
    notes: [
      { semitone: 2, dur: 2, chord: "ii" }, // D  (R)
      { semitone: 7, dur: T, chord: "ii" }, // G  (3連符・上の隣接音)
      { semitone: 4, dur: T, chord: "ii" }, // E  (3連符・下の隣接音)
      { semitone: 5, dur: T, chord: "ii" }, // F  (3連符・ターゲット/b3)
      { semitone: 9, dur: 2, chord: "ii" }, // A  (5)
      { semitone: 12, dur: 2, chord: "ii" }, // C  (b7)
      { semitone: 11, dur: T, chord: "V" }, // B  (3連符・3rd)
      { semitone: 9, dur: T, chord: "V" }, // A  (3連符・9th)
      { semitone: 7, dur: T, chord: "V" }, // G  (3連符・R)
      { semitone: 5, dur: T, chord: "V" }, // F  (3連符・b7)
      { semitone: 3, dur: T, chord: "V" }, // Eb (3連符・半音経過)
      { semitone: 2, dur: T, chord: "V" }, // D  (3連符・9th)
      { semitone: 0, dur: 1, chord: "V" }, // C  (経過音)
      { semitone: -1, dur: 1, chord: "V" }, // B  (3rdへ着地前)
      { semitone: 0, dur: 2, chord: "I" }, // C  (R) 着地
      { semitone: 5, dur: T, chord: "I" }, // F  (3連符・上の隣接音)
      { semitone: 3, dur: T, chord: "I" }, // Eb (3連符・下の隣接音)
      { semitone: 4, dur: T, chord: "I" }, // E  (3連符・ターゲット/3rd)
      { semitone: 7, dur: 3, chord: "I" }, // G  (5) 着地
    ],
  },
];

export function totalLickBeats(lick: Lick): number {
  return lick.notes.reduce((sum, n) => sum + n.dur, 0);
}
