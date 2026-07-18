import { useCallback, useEffect, useRef, useState } from "react";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { useNotePlayer } from "~/lib/hooks/useSynth";
import { pc } from "~/lib/theory/notes";

export type SequenceNoteState = "pending" | "hit" | "miss";
export type SequencePhase = "idle" | "countIn" | "playing" | "result";

export interface TimedNoteSpec {
  midi: number;
  startSec: number;
  durSec: number;
}

const HIT_GRACE_SEC = 0.3;
const MISS_GRACE_SEC = 0.25;
const END_GRACE_SEC = 0.4;
const SUCCESS_THRESHOLD = 0.8;
const COUNT_IN_BEATS = 4;

/**
 * Drives a "play this timed sequence of notes" mini rhythm-game: a count-in,
 * a moving cursor that marks notes missed once their window passes, and
 * MIDI note-on grading against the nearest pending note. Shared by the
 * II-V-I lick trainer and the scale-phrase trainer, which both need
 * identical count-in/cursor/grading behavior over different note data.
 */
export function useTimedSequence(onFinish: (success: boolean, hits: number, total: number) => void) {
  const { subscribe } = useMidiContext();
  const player = useNotePlayer();

  const [phase, setPhase] = useState<SequencePhase>("idle");
  const [noteStates, setNoteStates] = useState<SequenceNoteState[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const notesRef = useRef<TimedNoteSpec[]>([]);
  const noteStatesRef = useRef<SequenceNoteState[]>([]);
  const startTimeRef = useRef(0);
  const totalSecRef = useRef(0);
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const finish = useCallback((states: SequenceNoteState[]) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const total = states.length;
    const hits = states.filter((s) => s === "hit").length;
    const success = total > 0 && hits / total >= SUCCESS_THRESHOLD;
    setPhase("result");
    onFinishRef.current(success, hits, total);
  }, []);

  // Cursor / miss-detection loop. Reads and writes via refs so the
  // just-computed array can be handed straight to `finish` without relying
  // on a setState updater (which React may invoke more than once).
  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      const sec = (performance.now() - startTimeRef.current) / 1000;
      setElapsed(sec);
      const notes = notesRef.current;
      const prev = noteStatesRef.current;
      const next = prev.map((s, i) =>
        s === "pending" && sec > notes[i].startSec + notes[i].durSec + MISS_GRACE_SEC ? ("miss" as SequenceNoteState) : s,
      );
      noteStatesRef.current = next;
      setNoteStates(next);
      if (sec > totalSecRef.current + END_GRACE_SEC) {
        window.clearInterval(id);
        finish(next);
      }
    }, 40);
    return () => window.clearInterval(id);
  }, [phase, finish]);

  // Grade incoming MIDI note-on events against the nearest pending note.
  useEffect(() => {
    if (phase !== "playing") return;
    return subscribe((event) => {
      if (event.type !== "on") return;
      const sec = (performance.now() - startTimeRef.current) / 1000;
      const notes = notesRef.current;
      setNoteStates((prev) => {
        let bestIdx = -1;
        let bestDist = Infinity;
        notes.forEach((n, i) => {
          if (prev[i] !== "pending") return;
          if (pc(event.note) !== pc(n.midi)) return;
          if (sec < n.startSec - HIT_GRACE_SEC || sec > n.startSec + n.durSec + HIT_GRACE_SEC) return;
          const dist = Math.abs(sec - n.startSec);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        });
        if (bestIdx === -1) return prev;
        const next = [...prev];
        next[bestIdx] = "hit";
        noteStatesRef.current = next;
        return next;
      });
    });
  }, [phase, subscribe]);

  const start = useCallback(
    (notes: TimedNoteSpec[], bpm: number) => {
      notesRef.current = notes;
      const pending = notes.map(() => "pending" as SequenceNoteState);
      noteStatesRef.current = pending;
      totalSecRef.current = notes.length > 0 ? notes[notes.length - 1].startSec + notes[notes.length - 1].durSec : 0;
      finishedRef.current = false;
      setNoteStates(pending);
      setElapsed(0);
      setPhase("countIn");

      const beatSec = 60 / bpm;
      for (let i = 0; i < COUNT_IN_BEATS; i++) {
        window.setTimeout(() => player.playChord([i === 0 ? 84 : 72], 0.1), i * beatSec * 1000);
      }
      window.setTimeout(() => {
        startTimeRef.current = performance.now();
        setElapsed(0);
        setPhase("playing");
      }, COUNT_IN_BEATS * beatSec * 1000);
    },
    [player],
  );

  const resetIdle = useCallback(() => {
    setPhase("idle");
    setNoteStates([]);
    noteStatesRef.current = [];
    setElapsed(0);
  }, []);

  const currentIndex =
    phase === "playing"
      ? notesRef.current.findIndex((n, i) => noteStates[i] === "pending" && elapsed <= n.startSec + n.durSec + MISS_GRACE_SEC)
      : -1;

  return { phase, noteStates, currentIndex, start, resetIdle };
}
