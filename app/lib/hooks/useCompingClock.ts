import { useCallback, useEffect, useRef, useState } from "react";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { useNotePlayer } from "~/lib/hooks/useSynth";
import { chordTones } from "~/lib/theory/chords";
import { nearestMidiForPitchClass, pc } from "~/lib/theory/notes";
import type { Standard } from "~/lib/theory/standards";
import type { CompingRhythm } from "~/lib/theory/compingRhythms";

export type OnsetState = "pending" | "hit" | "miss";
export type CompingPhase = "idle" | "countIn" | "playing" | "result";

export interface CompingOnset {
  atSec: number;
  chordIndex: number; // index into standard.chords
}

const COVERAGE_THRESHOLD = 0.5;
const COUNT_IN_BEATS = 4;
const END_GRACE_SEC = 0.4;

/**
 * Lay out onset times for `bars` bars, repeating `rhythm.hitsPerBar` every
 * bar, and tag each onset with whichever chord of `standard.chords` is
 * sounding at that point in the progression (looping the progression itself
 * if it's shorter than the requested bar count).
 */
function buildOnsets(standard: Standard, rhythm: CompingRhythm, bpm: number, bars: number): CompingOnset[] {
  const secPerEighth = 60 / bpm / 2;
  const boundaries = standard.chords.map((c) => c.beats * 2); // quarter-note beats -> eighths
  const totalEighths = boundaries.reduce((a, b) => a + b, 0);

  function chordIndexAt(eighths: number): number {
    if (totalEighths <= 0) return 0;
    const pos = eighths % totalEighths;
    let cursor = 0;
    for (let i = 0; i < boundaries.length; i++) {
      cursor += boundaries[i];
      if (pos < cursor) return i;
    }
    return boundaries.length - 1;
  }

  const onsets: CompingOnset[] = [];
  for (let bar = 0; bar < bars; bar++) {
    for (const hit of rhythm.hitsPerBar) {
      const eighths = bar * 8 + hit;
      onsets.push({ atSec: eighths * secPerEighth, chordIndex: chordIndexAt(eighths) });
    }
  }
  return onsets;
}

/**
 * Drives the comping-rhythm mini rhythm-game: a count-in, then a sequence of
 * rhythmic onsets (not single notes) each graded by how well the learner's
 * held notes covered the current chord's tones within a timing window
 * around that onset. Unlike `useTimedSequence` (one monophonic note per
 * timed slot, exact pitch match), this grades a SET of notes per onset via
 * chord-tone coverage, matching the convention `standards.tsx` already uses
 * for its (untimed) bar-coverage grading.
 */
export function useCompingClock(onFinish: (hits: number, total: number) => void) {
  const { subscribe } = useMidiContext();
  const player = useNotePlayer();

  const [phase, setPhase] = useState<CompingPhase>("idle");
  const [onsets, setOnsets] = useState<CompingOnset[]>([]);
  const [onsetStates, setOnsetStates] = useState<OnsetState[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const onsetsRef = useRef<CompingOnset[]>([]);
  const onsetStatesRef = useRef<OnsetState[]>([]);
  const requiredRef = useRef<Set<number>[]>([]); // per-onset required chord-tone pitch classes
  const matchedRef = useRef<Set<number>[]>([]); // per-onset accumulated matched pitch classes
  const hitWindowRef = useRef(0.15);
  const startTimeRef = useRef(0);
  const totalSecRef = useRef(0);
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  const timeoutIdsRef = useRef<number[]>([]);
  onFinishRef.current = onFinish;

  const clearScheduled = useCallback(() => {
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutIdsRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutIdsRef.current.push(id);
  }, []);

  const finish = useCallback((states: OnsetState[]) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase("result");
    const hits = states.filter((s) => s === "hit").length;
    onFinishRef.current(hits, states.length);
  }, []);

  // Cursor loop: resolves each onset to hit/miss once its window has passed.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      const sec = (performance.now() - startTimeRef.current) / 1000;
      setElapsed(sec);
      const items = onsetsRef.current;
      const window_ = hitWindowRef.current;
      const prev = onsetStatesRef.current;
      const next = prev.map((s, i) => {
        if (s !== "pending") return s;
        if (sec <= items[i].atSec + window_) return s;
        const required = requiredRef.current[i];
        const matched = matchedRef.current[i];
        const coverage = required.size > 0 ? matched.size / required.size : 0;
        return coverage >= COVERAGE_THRESHOLD ? ("hit" as OnsetState) : ("miss" as OnsetState);
      });
      onsetStatesRef.current = next;
      setOnsetStates(next);
      if (sec > totalSecRef.current + window_ + END_GRACE_SEC) {
        window.clearInterval(id);
        finish(next);
      }
    }, 40);
    return () => window.clearInterval(id);
  }, [phase, finish]);

  // Accumulate incoming MIDI note-on pitch classes into whichever pending
  // onset(s) they fall within the timing window of.
  useEffect(() => {
    if (phase !== "playing") return;
    return subscribe((event) => {
      if (event.type !== "on") return;
      const sec = (performance.now() - startTimeRef.current) / 1000;
      const items = onsetsRef.current;
      const window_ = hitWindowRef.current;
      const noteP = pc(event.note);
      items.forEach((onset, i) => {
        if (onsetStatesRef.current[i] !== "pending") return;
        if (sec < onset.atSec - window_ || sec > onset.atSec + window_) return;
        matchedRef.current[i].add(noteP);
      });
    });
  }, [phase, subscribe]);

  const start = useCallback(
    async (standard: Standard, rhythm: CompingRhythm, bpm: number, bars: number) => {
      clearScheduled();
      const built = buildOnsets(standard, rhythm, bpm, bars);
      onsetsRef.current = built;
      setOnsets(built);
      const pending = built.map(() => "pending" as OnsetState);
      onsetStatesRef.current = pending;
      setOnsetStates(pending);
      requiredRef.current = built.map((o) => {
        const chord = standard.chords[o.chordIndex];
        return new Set(chordTones({ root: chord.root, quality: chord.quality }));
      });
      matchedRef.current = built.map(() => new Set<number>());
      totalSecRef.current = built.length > 0 ? built[built.length - 1].atSec : 0;

      // Scale the timing window to tempo/pattern density so windows for
      // adjacent onsets (e.g. every offbeat) never overlap.
      const secPerEighth = 60 / bpm / 2;
      hitWindowRef.current = Math.min(0.2, secPerEighth * 0.4);

      finishedRef.current = false;
      setElapsed(0);
      setPhase("countIn");

      const beatSec = 60 / bpm;
      for (let i = 0; i < COUNT_IN_BEATS; i++) {
        schedule(() => player.playChord([i === 0 ? 84 : 72], 0.1), i * beatSec * 1000);
      }
      schedule(() => {
        startTimeRef.current = performance.now();
        setElapsed(0);
        setPhase("playing");
        // Audible reference blip (chord root) at each onset.
        built.forEach((onset) => {
          schedule(() => {
            const root = standard.chords[onset.chordIndex].root;
            player.playChord([nearestMidiForPitchClass(root, 48)], 0.15);
          }, onset.atSec * 1000);
        });
      }, COUNT_IN_BEATS * beatSec * 1000);
    },
    [player, clearScheduled, schedule],
  );

  const stop = useCallback(() => {
    clearScheduled();
    finishedRef.current = true;
    setPhase("idle");
    setOnsets([]);
    setOnsetStates([]);
    onsetsRef.current = [];
    onsetStatesRef.current = [];
    setElapsed(0);
  }, [clearScheduled]);

  const currentOnsetIndex =
    phase === "playing"
      ? onsets.findIndex((o, i) => onsetStates[i] === "pending" && elapsed <= o.atSec + hitWindowRef.current + END_GRACE_SEC)
      : -1;

  return { phase, onsets, onsetStates, currentOnsetIndex, start, stop };
}
