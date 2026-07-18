import { pc } from "./notes";

// Map a MIDI note to a position on a diatonic staff. We spell each pitch
// class to a letter (C..B) plus an optional accidental, choosing sharps or
// flats based on the key so the notation reads naturally.

export type Accidental = "sharp" | "flat" | null;

// letterIndex: 0=C 1=D 2=E 3=F 4=G 5=A 6=B
const SHARP_SPELL: { letter: number; acc: Accidental }[] = [
  { letter: 0, acc: null }, // C
  { letter: 0, acc: "sharp" }, // C#
  { letter: 1, acc: null }, // D
  { letter: 1, acc: "sharp" }, // D#
  { letter: 2, acc: null }, // E
  { letter: 3, acc: null }, // F
  { letter: 3, acc: "sharp" }, // F#
  { letter: 4, acc: null }, // G
  { letter: 4, acc: "sharp" }, // G#
  { letter: 5, acc: null }, // A
  { letter: 5, acc: "sharp" }, // A#
  { letter: 6, acc: null }, // B
];

const FLAT_SPELL: { letter: number; acc: Accidental }[] = [
  { letter: 0, acc: null }, // C
  { letter: 1, acc: "flat" }, // Db
  { letter: 1, acc: null }, // D
  { letter: 2, acc: "flat" }, // Eb
  { letter: 2, acc: null }, // E
  { letter: 3, acc: null }, // F
  { letter: 4, acc: "flat" }, // Gb
  { letter: 4, acc: null }, // G
  { letter: 5, acc: "flat" }, // Ab
  { letter: 5, acc: null }, // A
  { letter: 6, acc: "flat" }, // Bb
  { letter: 6, acc: null }, // B
];

// Keys conventionally written with flats.
const FLAT_KEYS = new Set([5, 10, 3, 8, 1, 6]); // F Bb Eb Ab Db Gb

export function preferFlatForKey(keyRoot: number): boolean {
  return FLAT_KEYS.has(pc(keyRoot));
}

export interface StaffPos {
  /** Diatonic step: octave*7 + letterIndex. Larger = higher pitch. */
  step: number;
  accidental: Accidental;
}

export function midiToStaffPos(midi: number, preferFlat: boolean): StaffPos {
  const table = preferFlat ? FLAT_SPELL : SHARP_SPELL;
  const { letter, acc } = table[pc(midi)];
  const octave = Math.floor(midi / 12) - 1;
  return { step: octave * 7 + letter, accidental: acc };
}

// Treble-clef reference: the bottom line is E4.
export const TREBLE_BOTTOM_STEP = midiToStaffPos(64, false).step; // E4
