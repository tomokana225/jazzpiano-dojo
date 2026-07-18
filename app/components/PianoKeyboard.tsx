import { useMemo } from "react";
import { pc, midiToNoteName } from "~/lib/theory/notes";
import {
  keyboardLayout,
  WHITE_KEY_W,
  WHITE_KEY_H,
  BLACK_KEY_W,
  BLACK_KEY_H,
} from "~/lib/keyboardGeometry";

export interface PianoKeyboardProps {
  lowMidi?: number;
  highMidi?: number;
  activeNotes: Set<number>;
  /** Highlight these exact MIDI notes as the goal (used for voicings / licks). */
  targetMidiNotes?: Set<number>;
  /** Highlight any octave of these pitch classes as the goal (used for chords / scales). */
  targetPitchClasses?: Set<number>;
  /** Softer "for reference" highlight (e.g. the full scale shape) shown under the goal highlight. */
  referencePitchClasses?: Set<number>;
  onNoteDown?: (midi: number) => void;
  onNoteUp?: (midi: number) => void;
  className?: string;
}

type KeyGeom = { midi: number; x: number; isWhite: boolean };

export function PianoKeyboard({
  lowMidi = 48,
  highMidi = 84,
  activeNotes,
  targetMidiNotes,
  targetPitchClasses,
  referencePitchClasses,
  onNoteDown,
  onNoteUp,
  className,
}: PianoKeyboardProps) {
  const { whites, blacks, width } = useMemo(
    () => keyboardLayout(lowMidi, highMidi),
    [lowMidi, highMidi],
  );

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

  function isReference(midi: number): boolean {
    return referencePitchClasses?.has(pc(midi)) ?? false;
  }

  function whiteFill(k: KeyGeom): string {
    const active = activeNotes.has(k.midi);
    const target = isTarget(k.midi);
    if (active && target) return "#4ade80"; // correct - green
    if (active && hasGoal && !target) return "#f87171"; // wrong - red
    if (active) return "#93c5fd"; // pressed, no goal context - blue
    if (target) return "#fde68a"; // goal outline fill - amber
    if (isReference(k.midi)) return "#fef3c7"; // soft reference tint (e.g. full scale shape)
    return "#f8fafc";
  }

  function blackFill(k: KeyGeom): string {
    const active = activeNotes.has(k.midi);
    const target = isTarget(k.midi);
    if (active && target) return "#16a34a";
    if (active && hasGoal && !target) return "#dc2626";
    if (active) return "#60a5fa";
    if (target) return "#d97706";
    if (isReference(k.midi)) return "#4a3510";
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
