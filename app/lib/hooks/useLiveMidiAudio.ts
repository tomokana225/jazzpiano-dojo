import { useCallback, useEffect, useRef, useState } from "react";
import type * as ToneNS from "tone";
import { useMidiContext } from "~/lib/context/MidiProvider";

/**
 * Makes every note-on/note-off event (real MIDI hardware AND the on-screen
 * fallback keyboard) audible in real time via a persistent Tone.js synth.
 * Mounted once near the app root so sound works everywhere without each
 * practice page having to wire it up.
 *
 * Browsers require a real user gesture before audio can play, so this
 * exposes `audioEnabled` / `enableAudio` for a one-time "enable sound"
 * button; MIDI hardware note-on events aren't reliably treated as a
 * qualifying gesture, so we can't just auto-start on the first note.
 */
export function useLiveMidiAudio() {
  const { subscribe } = useMidiContext();
  const [audioEnabled, setAudioEnabled] = useState(false);
  const toneRef = useRef<typeof ToneNS | null>(null);
  const synthRef = useRef<ToneNS.PolySynth | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("tone").then((Tone) => {
      if (cancelled) return;
      toneRef.current = Tone;
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle8" },
        envelope: { attack: 0.004, decay: 0.15, sustain: 0.6, release: 0.5 },
      }).toDestination();
      synth.volume.value = -8;
      synthRef.current = synth;
      setAudioEnabled(Tone.getContext().state === "running");
    });
    return () => {
      cancelled = true;
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, []);

  useEffect(() => {
    return subscribe((event) => {
      const Tone = toneRef.current;
      const synth = synthRef.current;
      if (!Tone || !synth) return;
      const freq = Tone.Frequency(event.note, "midi").toFrequency();
      if (event.type === "on") {
        synth.triggerAttack(freq, Tone.now(), Math.max(0.05, event.velocity / 127));
      } else {
        synth.triggerRelease(freq, Tone.now());
      }
    });
  }, [subscribe]);

  const enableAudio = useCallback(async () => {
    const Tone = toneRef.current ?? (await import("tone"));
    toneRef.current = Tone;
    await Tone.start();
    setAudioEnabled(true);
  }, []);

  return { audioEnabled, enableAudio };
}
