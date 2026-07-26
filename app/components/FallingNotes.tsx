import { useEffect, useMemo, useRef, useState } from "react";
import { useMidiContext } from "~/lib/context/MidiProvider";
import { keyboardLayout, laneForMidi, WHITE_PCS } from "~/lib/keyboardGeometry";
import { jazzRootName, pc } from "~/lib/theory/notes";

export interface FallingNote {
  midi: number;
  /** Seconds from run start when this note should reach the hit line. */
  hitAtSec: number;
}

export type FallingNoteState = "pending" | "hit" | "miss";

interface FallingNotesProps {
  lowMidi: number;
  highMidi: number;
  notes: FallingNote[];
  running: boolean;
  /** How long a note takes to fall from the top to the hit line. */
  fallSeconds?: number;
  onResult?: (index: number, hit: boolean) => void;
  onComplete?: () => void;
  className?: string;
}

const LANE_HEIGHT = 260;
const HIT_WINDOW_SEC = 0.28; // how close to the hit line a press must land

export function FallingNotes({
  lowMidi,
  highMidi,
  notes,
  running,
  fallSeconds = 2.4,
  onResult,
  onComplete,
  className,
}: FallingNotesProps) {
  const { subscribe } = useMidiContext();
  const layout = useMemo(() => keyboardLayout(lowMidi, highMidi), [lowMidi, highMidi]);

  const [states, setStates] = useState<FallingNoteState[]>(() => notes.map(() => "pending"));
  const [elapsed, setElapsed] = useState(0);

  const statesRef = useRef<FallingNoteState[]>(states);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const completedRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onCompleteRef = useRef(onComplete);
  onResultRef.current = onResult;
  onCompleteRef.current = onComplete;

  // Reset whenever the note set changes.
  useEffect(() => {
    const fresh = notes.map(() => "pending" as FallingNoteState);
    statesRef.current = fresh;
    setStates(fresh);
    setElapsed(0);
    completedRef.current = false;
  }, [notes]);

  function judge(index: number, hit: boolean) {
    if (statesRef.current[index] !== "pending") return;
    const next = [...statesRef.current];
    next[index] = hit ? "hit" : "miss";
    statesRef.current = next;
    setStates(next);
    onResultRef.current?.(index, hit);
  }

  // Animation + miss detection loop.
  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    completedRef.current = false;

    const tick = () => {
      const sec = (performance.now() - startRef.current) / 1000;
      setElapsed(sec);
      notes.forEach((n, i) => {
        if (statesRef.current[i] === "pending" && sec > n.hitAtSec + HIT_WINDOW_SEC) {
          judge(i, false);
        }
      });
      const lastHit = notes.length > 0 ? notes[notes.length - 1].hitAtSec : 0;
      if (sec > lastHit + HIT_WINDOW_SEC + 0.3) {
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, notes]);

  // Grade MIDI/on-screen note-on events against the nearest note at the line.
  useEffect(() => {
    if (!running) return;
    return subscribe((event) => {
      if (event.type !== "on") return;
      const sec = (performance.now() - startRef.current) / 1000;
      let bestIdx = -1;
      let bestDist = Infinity;
      notes.forEach((n, i) => {
        if (statesRef.current[i] !== "pending") return;
        if (pc(n.midi) !== pc(event.note)) return; // octave-independent match
        const dist = Math.abs(sec - n.hitAtSec);
        if (dist <= HIT_WINDOW_SEC && dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });
      if (bestIdx !== -1) judge(bestIdx, true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, subscribe, notes]);

  const whiteLaneShades = layout.whites.map((k) => (
    <rect
      key={`bg-${k.midi}`}
      x={k.x + 1}
      y={0}
      width={30}
      height={LANE_HEIGHT}
      fill={WHITE_PCS.has(pc(k.midi)) && pc(k.midi) === 0 ? "#0b1220" : "transparent"}
    />
  ));

  // `className` fully replaces the border/rounding classes (not appended) so
  // a caller stacking this between two other panels can drop the rounding
  // and top border without fighting Tailwind's utility-order cascade.
  const frameClassName = className ?? "rounded-t-xl border border-b-0 border-slate-800";
  return (
    <div className={`overflow-x-auto bg-slate-950 ${frameClassName}`}>
      <svg width={layout.width} height={LANE_HEIGHT} style={{ minWidth: layout.width }} className="block">
        {whiteLaneShades}
        {/* lane divider lines at each C */}
        {layout.whites
          .filter((k) => pc(k.midi) === 0)
          .map((k) => (
            <line key={`div-${k.midi}`} x1={k.x} y1={0} x2={k.x} y2={LANE_HEIGHT} stroke="#1e293b" strokeWidth={1} />
          ))}
        {/* hit line */}
        <line x1={0} y1={LANE_HEIGHT - 4} x2={layout.width} y2={LANE_HEIGHT - 4} stroke="#f59e0b" strokeWidth={2} />

        {notes.map((n, i) => {
          const lane = laneForMidi(layout, n.midi);
          if (!lane) return null;
          const appearAt = n.hitAtSec - fallSeconds;
          const progress = (elapsed - appearAt) / fallSeconds; // 0 at top, 1 at hit line
          if (progress < -0.05 || progress > 1.3) return null;
          const state = states[i];
          const y = progress * (LANE_HEIGHT - 4) - 22;
          const noteH = 20;
          const fill =
            state === "hit" ? "#4ade80" : state === "miss" ? "#64748b" : "#38bdf8";
          const opacity = state === "hit" || state === "miss" ? 0.55 : 1;
          return (
            <g key={i} opacity={opacity}>
              <rect
                x={lane.x - lane.width / 2}
                y={y}
                width={lane.width}
                height={noteH}
                rx={4}
                fill={fill}
              />
              <text
                x={lane.x}
                y={y + noteH / 2 + 3}
                fontSize={9}
                textAnchor="middle"
                fill="#0f172a"
                fontWeight="bold"
                pointerEvents="none"
              >
                {jazzRootName(pc(n.midi))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
