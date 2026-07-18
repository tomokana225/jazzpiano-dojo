// Core note / pitch-class utilities shared by the whole theory library.
// We treat pitch as MIDI note numbers (60 = middle C / C4) and pitch
// classes as integers 0-11 (0 = C).

export const SHARP_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

export const FLAT_NAMES = [
  "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
] as const;

// Jazz "real book" style spelling used for chord roots - a practical mix
// of sharps/flats that matches how lead sheets are usually written.
export const JAZZ_ROOT_NAMES = [
  "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
] as const;

export type PitchClass = number; // 0-11
export type Midi = number; // 0-127

export function pc(n: number): PitchClass {
  return ((n % 12) + 12) % 12;
}

export function noteName(pitchClass: number, preferFlat = false): string {
  const table = preferFlat ? FLAT_NAMES : SHARP_NAMES;
  return table[pc(pitchClass)];
}

export function jazzRootName(pitchClass: number): string {
  return JAZZ_ROOT_NAMES[pc(pitchClass)];
}

export function midiToNoteName(midi: Midi, preferFlat = false): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${noteName(midi, preferFlat)}${octave}`;
}

export function midiToPitchClass(midi: Midi): PitchClass {
  return pc(midi);
}

// Nearest MIDI note to `near` that has the given pitch class.
export function nearestMidiForPitchClass(
  pitchClass: PitchClass,
  near: Midi,
): Midi {
  const base = near - (near % 12) + pc(pitchClass);
  const candidates = [base - 12, base, base + 12];
  return candidates.reduce((best, cand) =>
    Math.abs(cand - near) < Math.abs(best - near) ? cand : best,
  );
}

// Build an absolute MIDI note from a pitch-class + octave (octave 4 = C4 = 60).
export function midiOf(pitchClass: PitchClass, octave: number): Midi {
  return (octave + 1) * 12 + pc(pitchClass);
}

export const KEYS: { pitchClass: PitchClass; name: string }[] =
  JAZZ_ROOT_NAMES.map((name, pitchClass) => ({ pitchClass, name }));

export function randomPitchClass(rng: () => number = Math.random): PitchClass {
  return Math.floor(rng() * 12);
}

export function pick<T>(arr: readonly T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)];
}
