import type * as ToneNS from "tone";

// Every hook that touches Tone.js (useSynth, useBackingTrack,
// useLiveMidiAudio) must go through this loader instead of `import("tone")`
// directly. Web Audio's output latency is fixed when the AudioContext is
// constructed — setting `latencyHint` on an already-running context doesn't
// shrink the underlying hardware buffer, it just gets ignored. So we build
// one low-latency Tone.Context up front, before any synth anywhere in the
// app creates its first node, and every caller shares that single promise.
let tonePromise: Promise<typeof ToneNS> | null = null;

export function loadTone(): Promise<typeof ToneNS> {
  if (!tonePromise) {
    tonePromise = import("tone").then((Tone) => {
      const ctx = new Tone.Context({ latencyHint: "interactive" });
      // Remove Tone's default ~100ms look-ahead scheduling buffer too, so
      // notes triggered "now" play immediately instead of being queued.
      ctx.lookAhead = 0;
      Tone.setContext(ctx);
      return Tone;
    });
  }
  return tonePromise;
}
