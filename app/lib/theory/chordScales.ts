import type { ChordQualityId } from "./chords";
import type { ScaleId } from "./scales";

/**
 * Common scale choices for improvising over each seventh/triad chord
 * quality, ordered from the most "inside" (safe, fully diatonic) choice to
 * more colorful alternatives. Used to suggest what to practice/hear over a
 * given chord in the standards backing-track trainer.
 */
export const CHORD_SCALE_SUGGESTIONS: Record<ChordQualityId, ScaleId[]> = {
  maj7: ["ionian", "lydian", "bebopMajor", "majorPentatonic"],
  maj6: ["ionian", "lydian", "majorPentatonic"],
  dom7: ["mixolydian", "lydianDominant", "bebopDominant", "altered", "wholeTone", "dimHalfWhole"],
  min7: ["dorian", "aeolian", "minorPentatonic", "phrygian"],
  min6: ["melodicMinor", "dorian"],
  minMaj7: ["melodicMinor", "harmonicMinor"],
  min7b5: ["halfDiminished", "locrian"],
  dim7: ["dimWholeHalf"],
  aug7: ["wholeTone", "lydianAugmented"],
  sus7: ["mixolydian", "dorian"],
  maj: ["ionian", "majorPentatonic", "lydian"],
  min: ["aeolian", "dorian", "minorPentatonic"],
  dim: ["dimWholeHalf", "locrian"],
};
