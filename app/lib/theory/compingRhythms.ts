// Comping rhythm patterns: WHEN to strike a voicing within a 4/4 bar, not
// WHAT to strike. Each pattern is a list of eighth-note onset positions
// (0-7) within one bar, used by the comping-rhythm trainer to schedule
// timing windows independent of which chord/voicing is being played.

export type CompingRhythmId = "charleston" | "allUpbeats" | "backbeat" | "syncopated";

export interface CompingRhythm {
  id: CompingRhythmId;
  nameJa: string;
  descriptionJa: string;
  /** Eighth-note positions (0-7) within one 4/4 bar at which a hit is expected. */
  hitsPerBar: number[];
}

export const COMPING_RHYTHMS: Record<CompingRhythmId, CompingRhythm> = {
  charleston: {
    id: "charleston",
    nameJa: "チャールストン",
    descriptionJa: "1拍目と2拍目の裏拍(2の裏)で弾く、最も定番のコンピングリズム。",
    hitsPerBar: [0, 3],
  },
  allUpbeats: {
    id: "allUpbeats",
    nameJa: "オフビート(全裏打ち)",
    descriptionJa: "4拍すべての裏拍で弾く、スウィング感を強調するリズム。",
    hitsPerBar: [1, 3, 5, 7],
  },
  backbeat: {
    id: "backbeat",
    nameJa: "バックビート(2&4)",
    descriptionJa: "2拍目と4拍目の表で弾く、シンプルで安定したリズム。",
    hitsPerBar: [2, 6],
  },
  syncopated: {
    id: "syncopated",
    nameJa: "シンコペーション",
    descriptionJa: "1拍目・2拍目の裏・4拍目の頭で弾く、変化のあるリズム。",
    hitsPerBar: [0, 3, 6],
  },
};

export const COMPING_RHYTHM_ORDER: CompingRhythmId[] = ["charleston", "allUpbeats", "backbeat", "syncopated"];
