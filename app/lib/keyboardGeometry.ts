import { pc } from "~/lib/theory/notes";

// Shared piano-key layout so the on-screen keyboard AND the falling-note lane
// above it line up pixel-for-pixel.

export const WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11]);
export const WHITE_KEY_W = 34;
export const WHITE_KEY_H = 140;
export const BLACK_KEY_W = 21;
export const BLACK_KEY_H = 88;

export interface KeyGeom {
  midi: number;
  x: number;
  isWhite: boolean;
}

export interface KeyboardLayout {
  keys: KeyGeom[];
  whites: KeyGeom[];
  blacks: KeyGeom[];
  width: number;
}

export function keyboardLayout(lowMidi: number, highMidi: number): KeyboardLayout {
  const whites: KeyGeom[] = [];
  const blacks: KeyGeom[] = [];
  let whiteCount = 0;
  for (let midi = lowMidi; midi <= highMidi; midi++) {
    const isWhite = WHITE_PCS.has(pc(midi));
    if (isWhite) {
      whites.push({ midi, x: whiteCount * WHITE_KEY_W, isWhite: true });
      whiteCount++;
    } else {
      blacks.push({ midi, x: whiteCount * WHITE_KEY_W - BLACK_KEY_W / 2, isWhite: false });
    }
  }
  const keys = [...whites, ...blacks].sort((a, b) => a.midi - b.midi);
  return { keys, whites, blacks, width: whiteCount * WHITE_KEY_W };
}

/** Center x and width of the falling-note column for a given MIDI note. */
export function laneForMidi(layout: KeyboardLayout, midi: number): { x: number; width: number } | null {
  const key = layout.keys.find((k) => k.midi === midi);
  if (!key) return null;
  if (key.isWhite) return { x: key.x + WHITE_KEY_W / 2, width: WHITE_KEY_W - 4 };
  return { x: key.x + BLACK_KEY_W / 2, width: BLACK_KEY_W };
}
