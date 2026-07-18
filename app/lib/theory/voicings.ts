import { nearestMidiForPitchClass, pc, type Midi, type PitchClass } from "./notes";
import type { ChordQualityId } from "./chords";

export type VoicingType =
  | "shell37"
  | "shell73"
  | "rootlessA"
  | "rootlessB"
  | "drop2";

export interface VoicingDef {
  id: VoicingType;
  nameJa: string;
  descriptionJa: string;
}

export const VOICING_TYPES: Record<VoicingType, VoicingDef> = {
  shell37: {
    id: "shell37",
    nameJa: "シェルボイシング (R-3-7)",
    descriptionJa: "ルート・3rd・7th のみで構成する軽量ボイシング。左手コンピングの基本形。",
  },
  shell73: {
    id: "shell73",
    nameJa: "シェルボイシング (R-7-3)",
    descriptionJa: "ルート・7th・3rd の順に積むシェルボイシング。ii-V-I でスムーズな声部進行を作る。",
  },
  rootlessA: {
    id: "rootlessA",
    nameJa: "ロートレス・ボイシング A形",
    descriptionJa: "ルートを省略し 3-5-7-9 (または 3-13-7-9) を積むビル・エヴァンス系ボイシング。",
  },
  rootlessB: {
    id: "rootlessB",
    nameJa: "ロートレス・ボイシング B形",
    descriptionJa: "A形を転回した 7-9-3-5 系のボイシング。A形と交互に使い滑らかに接続する。",
  },
  drop2: {
    id: "drop2",
    nameJa: "ドロップ2ボイシング",
    descriptionJa: "クローズボイシングの上から2番目の音を1オクターブ下げて広げたブロックコード。",
  },
};

// Degree -> semitone offsets from root used to build each voicing per chord quality.
// Offsets can exceed 12 (compound intervals like 9th/13th) — placement logic
// below folds them into a sensible octave range.
const ROOTLESS_A: Record<string, number[]> = {
  maj7: [4, 7, 11, 14], // 3 5 7 9
  dom7: [4, 9, 10, 14], // 3 13 b7 9
  min7: [3, 7, 10, 14], // b3 5 b7 9
  min7b5: [3, 6, 10, 13], // b3 b5 b7 b9(as color, kept in-key)
  minMaj7: [3, 7, 11, 14],
  maj6: [4, 7, 9, 14],
  min6: [3, 7, 9, 14],
};

const ROOTLESS_B: Record<string, number[]> = {
  maj7: [11, 14, 16, 19], // 7 9 3(+oct) 5(+oct)
  dom7: [10, 14, 16, 21], // b7 9 3(+oct) 13(+oct)
  min7: [10, 14, 15, 19], // b7 9 b3(+oct) 5(+oct)
  min7b5: [10, 13, 15, 18],
  minMaj7: [11, 14, 15, 19],
  maj6: [9, 14, 16, 19],
  min6: [9, 14, 15, 19],
};

function shellOffsets(quality: ChordQualityId, order: "37" | "73"): number[] {
  const third = quality.startsWith("min") || quality === "min7b5" || quality === "dim7" ? 3 : 4;
  const seventh =
    quality === "maj7" || quality === "minMaj7" ? 11 :
    quality === "dim7" ? 9 :
    quality === "maj6" || quality === "min6" ? 9 :
    10; // dom7, min7, min7b5
  return order === "37" ? [0, third, seventh] : [0, seventh, third + 12];
}

/**
 * Place a list of root-relative semitone offsets (which may repeat/skip
 * octaves) into ascending absolute MIDI notes clustered near `anchorMidi`.
 */
function place(root: PitchClass, offsets: number[], anchorMidi: Midi): Midi[] {
  const base = nearestMidiForPitchClass(root, anchorMidi);
  const notes = offsets.map((o) => base + o);
  // Fold anything that drifted more than an octave+ away from the anchor
  // back down/up so the voicing stays compact (typical LH/comping range).
  return notes
    .map((n) => {
      let m = n;
      while (m - anchorMidi > 12) m -= 12;
      while (anchorMidi - m > 12) m += 12;
      return m;
    })
    .sort((a, b) => a - b);
}

export interface VoicingResult {
  type: VoicingType;
  notes: Midi[];
  degrees: string[];
}

const DEGREE_LABELS: Record<number, string> = {
  0: "R", 3: "b3", 4: "3", 6: "b5", 7: "5", 9: "6/13", 10: "b7", 11: "7",
  13: "b9", 14: "9", 15: "b3", 16: "3", 18: "b5", 19: "5", 21: "13",
};

function degreeLabel(offset: number): string {
  if (offset in DEGREE_LABELS) return DEGREE_LABELS[offset];
  return DEGREE_LABELS[pc(offset)] ?? `${offset}`;
}

export function buildVoicing(
  root: PitchClass,
  quality: ChordQualityId,
  type: VoicingType,
  anchorMidi: Midi = 60,
): VoicingResult | null {
  if (type === "shell37" || type === "shell73") {
    const offsets = shellOffsets(quality, type === "shell37" ? "37" : "73");
    const notes = place(root, offsets, anchorMidi);
    return { type, notes, degrees: offsets.map((o) => degreeLabel(pc(o))) };
  }
  if (type === "rootlessA" || type === "rootlessB") {
    const table = type === "rootlessA" ? ROOTLESS_A : ROOTLESS_B;
    const offsets = table[quality];
    if (!offsets) return null;
    const notes = place(root, offsets, anchorMidi);
    return { type, notes, degrees: offsets.map(degreeLabel) };
  }
  if (type === "drop2") {
    const third = quality.startsWith("min") || quality === "min7b5" || quality === "dim7" ? 3 : 4;
    const fifth = quality === "min7b5" ? 6 : quality === "dim7" ? 6 : 7;
    const seventh =
      quality === "maj7" || quality === "minMaj7" ? 11 :
      quality === "dim7" ? 9 :
      quality === "maj6" || quality === "min6" ? 9 :
      10;
    // Close position root-3-5-7 ascending, then drop the 2nd-from-top (the 5th) an octave.
    const close = [0, third, fifth, seventh];
    const dropped = [close[0], close[1], close[2] - 12, close[3]];
    const notes = place(root, dropped, anchorMidi);
    return { type, notes, degrees: [close[0], close[1], close[2], close[3]].map((o) => degreeLabel(pc(o))) };
  }
  return null;
}

export function availableVoicingTypes(quality: ChordQualityId): VoicingType[] {
  const types: VoicingType[] = ["shell37", "shell73", "drop2"];
  if (ROOTLESS_A[quality]) types.push("rootlessA", "rootlessB");
  return types;
}

// Convenience for other modules that just need a set of chord-tone MIDI
// notes near a given octave (e.g. for playback of the "target" chord).
export function closeVoicingMidi(
  root: PitchClass,
  intervals: number[],
  anchorMidi: Midi = 60,
): Midi[] {
  const base = nearestMidiForPitchClass(root, anchorMidi);
  return intervals.map((i) => base + i).sort((a, b) => a - b);
}
