// "Reverse lookup": given the notes someone actually played, figure out
// which chord or scale they played, instead of the usual forward direction
// (app names a chord/scale, learner plays it).

import { CHORD_QUALITIES, type ChordQualityId } from "./chords";
import { SCALE_ORDER, SCALES, type ScaleId } from "./scales";
import { pc, type PitchClass } from "./notes";

export interface ChordMatch {
  root: PitchClass;
  quality: ChordQualityId;
}

function sameIntervalSet(a: Set<number>, b: readonly number[]): boolean {
  if (a.size !== b.length) return false;
  return b.every((interval) => a.has(interval));
}

/**
 * Try every held pitch class as a candidate root and see whether the rest
 * of the notes, relative to it, exactly match a known chord quality. This
 * naturally surfaces real enharmonic ambiguities (e.g. Cm6 and Am7b5 share
 * the same four notes) by returning every valid reading.
 */
export function identifyChords(heldPitchClasses: Set<PitchClass>): ChordMatch[] {
  if (heldPitchClasses.size < 3) return [];
  const matches: ChordMatch[] = [];
  for (const root of heldPitchClasses) {
    const relative = new Set([...heldPitchClasses].map((p) => pc(p - root)));
    for (const qualityId of Object.keys(CHORD_QUALITIES) as ChordQualityId[]) {
      if (sameIntervalSet(relative, CHORD_QUALITIES[qualityId].intervals)) {
        matches.push({ root, quality: qualityId });
      }
    }
  }
  return matches;
}

export interface ScaleMatch {
  root: PitchClass;
  scaleId: ScaleId;
}

/** Exact matches: the played set, relative to `root`, equals a scale's full note set. */
export function identifyScales(root: PitchClass, heldPitchClasses: Set<PitchClass>): ScaleMatch[] {
  if (heldPitchClasses.size < 3) return [];
  const relative = new Set([...heldPitchClasses].map((p) => pc(p - root)));
  const matches: ScaleMatch[] = [];
  for (const scaleId of SCALE_ORDER) {
    if (sameIntervalSet(relative, SCALES[scaleId].intervals)) {
      matches.push({ root, scaleId });
    }
  }
  return matches;
}

/** Scales still consistent with what's been played so far (subset match), for live narrowing feedback. */
export function candidateScales(root: PitchClass, heldPitchClasses: Set<PitchClass>): ScaleId[] {
  const relative = [...heldPitchClasses].map((p) => pc(p - root));
  return SCALE_ORDER.filter((scaleId) => {
    const intervals = SCALES[scaleId].intervals;
    return relative.every((interval) => intervals.includes(interval));
  });
}
