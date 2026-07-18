import { useCallback, useEffect, useRef } from "react";
import type * as ToneNS from "tone";

type Tone = typeof ToneNS;

/**
 * Lightweight wrapper around Tone.js for one-off previews: playing a target
 * chord, a scale run, or a lick so the learner can hear it before/after
 * attempting it on their MIDI keyboard. Tone.js is loaded dynamically so it
 * never touches the AudioContext during SSR/build.
 */
export function useNotePlayer() {
  const toneRef = useRef<Tone | null>(null);
  const synthRef = useRef<ToneNS.PolySynth | null>(null);

  const ensure = useCallback(async () => {
    if (synthRef.current) return { Tone: toneRef.current as Tone, synth: synthRef.current };
    const Tone = await import("tone");
    await Tone.start();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle8" },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.25, release: 0.6 },
    }).toDestination();
    synth.volume.value = -6;
    toneRef.current = Tone;
    synthRef.current = synth;
    return { Tone, synth };
  }, []);

  const playChord = useCallback(
    async (midiNotes: number[], durationSeconds = 1.2) => {
      const { Tone, synth } = await ensure();
      const freqs = midiNotes.map((m) => Tone.Frequency(m, "midi").toFrequency());
      synth.triggerAttackRelease(freqs, durationSeconds);
    },
    [ensure],
  );

  const playSequence = useCallback(
    async (notes: { midi: number; beats: number }[], bpm = 100) => {
      const { Tone, synth } = await ensure();
      const secPerBeat = 60 / bpm;
      let t = Tone.now();
      for (const n of notes) {
        const dur = n.beats * secPerBeat;
        synth.triggerAttackRelease(Tone.Frequency(n.midi, "midi").toFrequency(), dur * 0.92, t);
        t += dur;
      }
    },
    [ensure],
  );

  const stopAll = useCallback(() => {
    synthRef.current?.releaseAll();
  }, []);

  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, []);

  return { playChord, playSequence, stopAll };
}
