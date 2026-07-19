// Parses lead-sheet style chord progression text (e.g. "Cmaj7 | A7 | Dm7 | G7")
// into StandardChord[], reusing the same shape STANDARDS entries already use
// so a custom progression can be fed straight into useBackingTrack and the
// chord-scale suggestion panel with no other code changes.

import { pc, type PitchClass } from "./notes";
import type { ChordQualityId } from "./chords";
import type { StandardChord } from "./standards";

export interface ParseError {
  index: number; // 0-based token index within the whole progression, -1 for whole-input errors
  token: string;
  message: string;
}

export type ParseResult =
  | { ok: true; chords: StandardChord[] }
  | { ok: false; errors: ParseError[] };

const ROOT_LETTERS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// The full remainder after the root letter+accidental is matched against
// this table as a WHOLE string (not a prefix), so there's no ambiguity
// between e.g. "m7b5" and "m7" and "m" — they're simply three different
// dictionary entries. Real-world lead sheets write chord extensions
// (9th/11th/13th/altered dominants etc.) this library doesn't model as
// distinct qualities, so those collapse onto the closest of the 13
// supported ChordQualityId values (e.g. "maj9" -> maj7, "9"/"13" -> dom7).
const QUALITY_ALIASES: Record<string, ChordQualityId> = {
  // maj7 family
  "maj7": "maj7", "Maj7": "maj7", "MA7": "maj7", "M7": "maj7", "Δ7": "maj7", "Δ": "maj7",
  "maj9": "maj7", "M9": "maj7", "Δ9": "maj7", "maj7#11": "maj7", "maj9#11": "maj7",
  // maj6 family
  "6": "maj6", "6/9": "maj6", "69": "maj6", "maj6": "maj6", "M6": "maj6",
  // dom7 family (all dominant colors/extensions collapse to plain dom7)
  "7": "dom7", "9": "dom7", "11": "dom7", "13": "dom7",
  "7b9": "dom7", "7#9": "dom7", "7#11": "dom7", "7b13": "dom7", "7b5": "dom7", "7#5": "dom7",
  "7alt": "dom7", "alt": "dom7", "dom7": "dom7",
  // min7 family
  "m7": "min7", "min7": "min7", "-7": "min7", "m9": "min7", "min9": "min7", "-9": "min7",
  "m11": "min7", "min11": "min7",
  // min6 family
  "m6": "min6", "min6": "min6", "-6": "min6", "m6/9": "min6", "min6/9": "min6",
  // minMaj7 family
  "mMaj7": "minMaj7", "mM7": "minMaj7", "m(maj7)": "minMaj7", "-Δ7": "minMaj7",
  "minMaj7": "minMaj7", "m/maj7": "minMaj7", "mΔ7": "minMaj7",
  // min7b5 family
  "m7b5": "min7b5", "m7-5": "min7b5", "min7b5": "min7b5", "ø": "min7b5", "ø7": "min7b5",
  "Ø": "min7b5", "Ø7": "min7b5",
  // dim7 family — bare "dim"/"o"/"°" conventionally means the fully
  // diminished 7th on a jazz lead sheet, not the plain diminished triad.
  "dim7": "dim7", "o7": "dim7", "°7": "dim7", "dim": "dim7", "o": "dim7", "°": "dim7",
  // aug7 family — likewise, bare "aug"/"+" is treated as the augmented 7th.
  "aug7": "aug7", "+7": "aug7", "aug": "aug7", "+": "aug7",
  // sus7 family
  "7sus4": "sus7", "7sus": "sus7", "sus7": "sus7", "sus4": "sus7", "sus": "sus7",
  // bare triads
  "": "maj", "maj": "maj", "M": "maj",
  "m": "min", "min": "min", "-": "min",
};

function lookupQuality(remainder: string): ChordQualityId | null {
  if (remainder in QUALITY_ALIASES) return QUALITY_ALIASES[remainder];
  const lower = remainder.toLowerCase();
  for (const [alias, quality] of Object.entries(QUALITY_ALIASES)) {
    if (alias.toLowerCase() === lower) return quality;
  }
  return null;
}

/** Parse a single chord symbol like "Cmaj7", "Bbm7b5", "F#7" into a root + quality. */
export function parseChordSymbol(token: string): { root: PitchClass; quality: ChordQualityId } | null {
  const trimmed = token.trim();
  if (trimmed.length === 0) return null;
  const letter = trimmed[0].toUpperCase();
  const base = ROOT_LETTERS[letter];
  if (base === undefined) return null;

  let i = 1;
  let accidental = 0;
  const next = trimmed[1];
  if (next === "#" || next === "♯") {
    accidental = 1;
    i = 2;
  } else if (next === "b" || next === "♭") {
    accidental = -1;
    i = 2;
  }

  const root = pc(base + accidental);
  const remainder = trimmed.slice(i);
  const quality = lookupQuality(remainder);
  if (!quality) return null;
  return { root, quality };
}

const BEAT_SUFFIX = /^(.+?)\((\d+(?:\.\d+)?)\)$/;

/**
 * Parse a full chord progression. Bars are separated by "|"; multiple chord
 * tokens within a bar (separated by whitespace) split the bar's beats evenly
 * unless a token carries an explicit "(n)" beat count (e.g. "C7(2) F7(2)").
 */
export function parseChordProgression(input: string, opts: { defaultBarBeats?: number } = {}): ParseResult {
  const barBeats = opts.defaultBarBeats ?? 4;
  const errors: ParseError[] = [];
  const chords: StandardChord[] = [];

  const bars = input.split("|");
  let tokenIndex = 0;
  for (const barText of bars) {
    const tokens = barText.trim().split(/\s+/).filter((t) => t.length > 0);
    if (tokens.length === 0) continue;

    const parsedTokens = tokens.map((raw) => {
      const m = raw.match(BEAT_SUFFIX);
      return m ? { symbol: m[1], beats: Number(m[2]), raw } : { symbol: raw, beats: null as number | null, raw };
    });
    const explicitTotal = parsedTokens.reduce((sum, t) => sum + (t.beats ?? 0), 0);
    const implicitCount = parsedTokens.filter((t) => t.beats === null).length;
    const remaining = Math.max(0, barBeats - explicitTotal);
    const perImplicit = implicitCount > 0 ? remaining / implicitCount : 0;

    for (const t of parsedTokens) {
      const parsed = parseChordSymbol(t.symbol);
      if (!parsed) {
        errors.push({ index: tokenIndex, token: t.raw, message: `コードとして認識できません` });
      } else {
        chords.push({ root: parsed.root, quality: parsed.quality, beats: t.beats ?? perImplicit });
      }
      tokenIndex++;
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  if (chords.length === 0) {
    return { ok: false, errors: [{ index: -1, token: "", message: "コードが入力されていません" }] };
  }
  return { ok: true, chords };
}
