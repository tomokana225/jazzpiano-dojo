import type * as ToneNS from "tone";

// Every hook that touches Tone.js (useSynth, useBackingTrack,
// useLiveMidiAudio) must go through this loader instead of `import("tone")`
// directly, and it must tweak Tone's own default context in place rather
// than swapping in a fresh `new Tone.Context()` + `Tone.setContext()`.
// Tone's top-level singletons (`Tone.Transport` in particular) are bound to
// whichever context exists the moment the `tone` module first evaluates —
// replacing the global context afterwards leaves Transport pointing at the
// old one forever, so its Clock/Ticker schedules against a context nothing
// else uses and every Part/Loop/Sequence callback (the backing-track
// player) silently never fires even though playback looks "started".
// Mutating `lookAhead` directly avoids that split: it's a live setter (unlike
// `latencyHint`, which really is construction-only), and AudioContext's own
// default latencyHint is already "interactive", so there's nothing to gain
// from constructing a second context anyway.
let tonePromise: Promise<typeof ToneNS> | null = null;

export function loadTone(): Promise<typeof ToneNS> {
  if (!tonePromise) {
    tonePromise = import("tone").then((Tone) => {
      Tone.getContext().lookAhead = 0;
      return Tone;
    });
  }
  return tonePromise;
}
