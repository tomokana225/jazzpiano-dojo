import { useCallback, useRef, useState } from "react";
import type * as ToneNS from "tone";
import { chordTones } from "~/lib/theory/chords";
import { nearestMidiForPitchClass, pc } from "~/lib/theory/notes";
import type { Standard, StandardChord } from "~/lib/theory/standards";

type Tone = typeof ToneNS;

export interface UseBackingTrackResult {
  isPlaying: boolean;
  currentChordIndex: number;
  start: (standard: Standard, bpm: number) => Promise<void>;
  stop: () => void;
}

function beatsToBBS(beatPos: number): string {
  const bar = Math.floor(beatPos / 4);
  const beat = Math.floor(beatPos % 4);
  const sixteenth = Math.round((beatPos % 1) * 4);
  return `${bar}:${beat}:${sixteenth}`;
}

export function useBackingTrack(
  onChordChange?: (index: number, chord: StandardChord) => void,
): UseBackingTrackResult {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(-1);
  const toneRef = useRef<Tone | null>(null);
  const disposablesRef = useRef<{ dispose: () => void }[]>([]);

  const stop = useCallback(() => {
    const Tone = toneRef.current;
    if (Tone) {
      Tone.Transport.stop();
      Tone.Transport.cancel(0);
      disposablesRef.current.forEach((d) => d.dispose());
      disposablesRef.current = [];
    }
    setIsPlaying(false);
    setCurrentChordIndex(-1);
  }, []);

  const start = useCallback(
    async (standard: Standard, bpm: number) => {
      stop();
      const Tone = await import("tone");
      toneRef.current = Tone;
      await Tone.start();

      Tone.Transport.bpm.value = bpm;
      Tone.Transport.swing = 0.55;
      Tone.Transport.swingSubdivision = "8n";

      const bass = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.02, decay: 0.25, sustain: 0.35, release: 0.2 },
      }).toDestination();
      bass.volume.value = -8;

      const stab = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle8" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.35 },
      }).toDestination();
      stab.volume.value = -16;

      const hihat = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.04, sustain: 0 },
      }).toDestination();
      hihat.volume.value = -26;

      const snare = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
      }).toDestination();
      snare.volume.value = -20;

      const kick = new Tone.MembraneSynth({ octaves: 4, pitchDecay: 0.02 }).toDestination();
      kick.volume.value = -12;

      disposablesRef.current.push(bass, stab, hihat, snare, kick);

      let cursor = 0;
      const events: { beatPos: number; chordIndex: number; chord: StandardChord }[] = [];
      standard.chords.forEach((chord, chordIndex) => {
        events.push({ beatPos: cursor, chordIndex, chord });
        cursor += chord.beats;
      });
      const totalBeats = cursor;
      const totalBars = Math.ceil(totalBeats / 4);

      type ChordEvent = { beatPos: number; chordIndex: number; chord: StandardChord };
      const chordPart = new Tone.Part<[string, ChordEvent]>(
        (time, ev: ChordEvent) => {
          const root = ev.chord.root;
          const fifth = pc(root + 7);
          const beats = Math.max(1, Math.round(ev.chord.beats));
          for (let i = 0; i < beats; i++) {
            const bassPc = i % 2 === 0 ? root : fifth;
            const bassMidi = nearestMidiForPitchClass(bassPc, 40);
            bass.triggerAttackRelease(
              Tone.Frequency(bassMidi, "midi").toFrequency(),
              "4n",
              time + i * (60 / bpm),
            );
          }
          const tones = chordTones({ root: ev.chord.root, quality: ev.chord.quality }).map((p) =>
            nearestMidiForPitchClass(p, 62),
          );
          const freqs = tones.map((m) => Tone.Frequency(m, "midi").toFrequency());
          stab.triggerAttackRelease(freqs, "8n", time, 0.55);
          if (ev.chord.beats >= 2) {
            stab.triggerAttackRelease(freqs, "8n", time + 1.5 * (60 / bpm), 0.35);
          }
          Tone.Draw.schedule(() => {
            setCurrentChordIndex(ev.chordIndex);
            onChordChange?.(ev.chordIndex, ev.chord);
          }, time);
        },
        events.map((e) => [beatsToBBS(e.beatPos), e] as [string, typeof e]),
      );
      chordPart.loop = true;
      chordPart.loopEnd = `${totalBars}:0:0`;
      chordPart.start(0);
      disposablesRef.current.push(chordPart);

      const hihatLoop = new Tone.Loop((time) => {
        hihat.triggerAttackRelease("16n", time, 0.5);
      }, "8n");
      hihatLoop.start(0);
      disposablesRef.current.push(hihatLoop);

      const drumLoop = new Tone.Sequence(
        (time, step) => {
          if (step === 0 || step === 2) kick.triggerAttackRelease("C1", "8n", time);
          if (step === 1 || step === 3) snare.triggerAttackRelease("8n", time, 0.6);
        },
        [0, 1, 2, 3],
        "4n",
      );
      drumLoop.start(0);
      disposablesRef.current.push(drumLoop);

      Tone.Transport.loop = true;
      Tone.Transport.loopStart = 0;
      Tone.Transport.loopEnd = `${totalBars}:0:0`;
      Tone.Transport.position = 0;
      Tone.Transport.start();

      setIsPlaying(true);
    },
    [stop, onChordChange],
  );

  return { isPlaying, currentChordIndex, start, stop };
}
