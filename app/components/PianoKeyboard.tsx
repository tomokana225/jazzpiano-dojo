import { useMemo } from "react";
import { pc, midiToNoteName } from "~/lib/theory/notes";

const WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11]);
const WHITE_KEY_W = 34;
const WHITE_KEY_H = 140;
const BLACK_KEY_W = 21;
const BLACK_KEY_H = 88;

export interface PianoKeyboardProps {
  lowMidi?: number;
  highMidi?: number;
  activeNotes: Set<number>;
  /** Highlight these exact MIDI notes as the goal (used for voicings / licks). */
  targetMidiNotes?: Set<number>;
  /** Highlight any octave of these pitch classes as the goal (used for chords / scales). */
  targetPitchClasses?: Set<number>;
  onNoteDown?: (midi: number) => void;
  onNoteUp?: (midi: number) => void;
  className?: string;
}

interface KeyGeom {
  midi: number;
  x: number;
  isWhite: boolean;
}

export function PianoKeyboard({
  lowMidi = 48,
  highMidi = 84,
  activeNotes,
  targetMidiNotes,
  targetPitchClasses,
  onNoteDown,
  onNoteUp,
  className,
}: PianoKeyboardProps) {
  const { whites, blacks, width } = useMemo(() => {
    const whites: KeyGeom[] = [];
    const blacks: KeyGeom[] = [];
    let whiteCount = 0;
    for (let midi = lowMidi; midi <= highMidi; midi++) {
      const isWhite = WHITE_PCS.has(pc(midi));
      if (isWhite) {
        whites.push({ midi, x: whiteCount * WHITE_KEY_W, isWhite: true });
        whiteCount++;
      } else {
        blacks.push({ midi, x: whiteCount * WHITE_KEY_W - BLACK_KEY_W / 2, isWhite: false });
      }
    }
    return { whites, blacks, width: whiteCount * WHITE_KEY_W };
  }, [lowMidi, highMidi]);

  function isTarget(midi: number): boolean {
    if (targetMidiNotes?.has(midi)) return true;
    if (targetPitchClasses?.has(pc(midi))) return true;
    return false;
  }

  const hasGoal = Boolean(targetMidiNotes || targetPitchClasses);

  function keyDown(midi: number) {
    onNoteDown?.(midi);
  }
  function keyUp(midi: number) {
    onNoteUp?.(midi);
  }

  function whiteFill(k: KeyGeom): string {
    const active = activeNotes.has(k.midi);
    const target = isTarget(k.midi);
    if (active && target) return "#4ade80"; // correct - green
    if (active && hasGoal && !target) return "#f87171"; // wrong - red
    if (active) return "#93c5fd"; // pressed, no goal context - blue
    if (target) return "#fde68a"; // goal outline fill - amber
    return "#f8fafc";
  }

  function blackFill(k: KeyGeom): string {
    const active = activeNotes.has(k.midi);
    const target = isTarget(k.midi);
    if (active && target) return "#16a34a";
    if (active && hasGoal && !target) return "#dc2626";
    if (active) return "#60a5fa";
    if (target) return "#d97706";
    return "#111827";
  }

  return (
    <div className={`overflow-x-auto ${className ?? ""}`}>
      <svg
        width={width}
        height={WHITE_KEY_H}
        viewBox={`0 0 ${width} ${WHITE_KEY_H}`}
        className="select-none touch-none"
        style={{ minWidth: width }}
      >
        {whites.map((k) => (
          <g key={k.midi}>
            <rect
              x={k.x + 1}
              y={0}
              width={WHITE_KEY_W - 2}
              height={WHITE_KEY_H}
              rx={4}
              fill={whiteFill(k)}
              stroke="#334155"
              strokeWidth={1}
              onPointerDown={() => keyDown(k.midi)}
              onPointerUp={() => keyUp(k.midi)}
              onPointerLeave={() => activeNotes.has(k.midi) && keyUp(k.midi)}
              className="cursor-pointer transition-colors duration-75"
            />
            {pc(k.midi) === 0 && (
              <text
                x={k.x + WHITE_KEY_W / 2}
                y={WHITE_KEY_H - 10}
                fontSize={9}
                textAnchor="middle"
                fill="#64748b"
                pointerEvents="none"
              >
                {midiToNoteName(k.midi)}
              </text>
            )}
          </g>
        ))}
        {blacks.map((k) => (
          <rect
            key={k.midi}
            x={k.x}
            y={0}
            width={BLACK_KEY_W}
            height={BLACK_KEY_H}
            rx={3}
            fill={blackFill(k)}
            stroke="#0f172a"
            strokeWidth={1}
            onPointerDown={() => keyDown(k.midi)}
            onPointerUp={() => keyUp(k.midi)}
            onPointerLeave={() => activeNotes.has(k.midi) && keyUp(k.midi)}
            className="cursor-pointer transition-colors duration-75"
          />
        ))}
      </svg>
    </div>
  );
}
