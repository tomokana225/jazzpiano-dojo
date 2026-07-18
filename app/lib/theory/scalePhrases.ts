// Scale-based melodic patterns ("phrases") practiced over whichever scale
// and root the learner picks. Each pattern is described purely in terms of
// scale-degree steps rather than fixed semitones, so a single definition
// works over every scale in scales.ts regardless of its length (5-note
// pentatonics, 7-note modes, 8-note diminished/bebop scales, etc.).

export interface DegreeStep {
  /** Index into the scale, 0 = root, may go negative or beyond the octave. */
  degreeIndex: number;
  /** Duration in eighth-note units. */
  dur: number;
}

export interface ScalePhrasePattern {
  id: string;
  nameJa: string;
  descriptionJa: string;
  generate: (scaleLength: number) => DegreeStep[];
}

export const SCALE_PHRASE_PATTERNS: ScalePhrasePattern[] = [
  {
    id: "thirds-up",
    nameJa: "3度パターン(上行)",
    descriptionJa: "スケールを1つ飛ばしの3度で刻みながら上行する定番のテクニカル練習。",
    generate: (len) => {
      const steps: DegreeStep[] = [];
      for (let s = 0; s <= len; s++) {
        steps.push({ degreeIndex: s, dur: 1 }, { degreeIndex: s + 2, dur: 1 });
      }
      return steps;
    },
  },
  {
    id: "thirds-down",
    nameJa: "3度パターン(下行)",
    descriptionJa: "3度パターンを上のオクターブから下行させるバージョン。",
    generate: (len) => {
      const steps: DegreeStep[] = [];
      for (let s = len; s >= 0; s--) {
        steps.push({ degreeIndex: s, dur: 1 }, { degreeIndex: s - 2, dur: 1 });
      }
      return steps;
    },
  },
  {
    id: "cell-1235-up",
    nameJa: "1-2-3-5 セルパターン(上行)",
    descriptionJa: "ビバップ語法の基礎となる4音セルをスケールに沿って1音ずつ上げながら繰り返す。",
    generate: (len) => {
      const steps: DegreeStep[] = [];
      for (let s = 0; s < len; s++) {
        [0, 1, 2, 4].forEach((offset) => steps.push({ degreeIndex: s + offset, dur: 1 }));
      }
      steps.push({ degreeIndex: len, dur: 4 });
      return steps;
    },
  },
  {
    id: "cell-1235-down",
    nameJa: "1-2-3-5 セルパターン(下行)",
    descriptionJa: "4音セルパターンを上のオクターブから下げながら繰り返す。",
    generate: (len) => {
      const steps: DegreeStep[] = [];
      for (let s = len; s > 0; s--) {
        [0, -1, -2, -4].forEach((offset) => steps.push({ degreeIndex: s + offset, dur: 1 }));
      }
      steps.push({ degreeIndex: 0, dur: 4 });
      return steps;
    },
  },
  {
    id: "fourths-skip",
    nameJa: "4度スキップパターン",
    descriptionJa: "1音おきに4度上へジャンプしながら折り返す、モーダルな響きを持つ練習。",
    generate: (len) => {
      const steps: DegreeStep[] = [];
      for (let s = 0; s <= len; s++) steps.push({ degreeIndex: s % 2 === 0 ? s : s + 3, dur: 1 });
      steps.push({ degreeIndex: len, dur: 4 });
      return steps;
    },
  },
];
