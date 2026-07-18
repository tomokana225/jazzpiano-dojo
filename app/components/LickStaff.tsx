import { useMemo } from "react";
import { midiToStaffPos, preferFlatForKey, TREBLE_BOTTOM_STEP } from "~/lib/theory/notation";
import { chordSymbol } from "~/lib/theory/chords";
import { pc, type PitchClass } from "~/lib/theory/notes";
import type { LickChordSlot } from "~/lib/theory/licks";

export interface StaffNote {
  midi: number;
  dur: number; // eighth-note units
  chord: LickChordSlot;
}

interface LickStaffProps {
  notes: StaffNote[];
  keyRoot: PitchClass;
  /** Index of the note currently being played, for highlighting. */
  currentIndex?: number;
  states?: ("pending" | "hit" | "miss")[];
}

const LINE_GAP = 12;
const STAFF_TOP = 48; // y of the top staff line (F5)
const LEFT_PAD = 62; // room for the clef
const TOP_STEP = TREBLE_BOTTOM_STEP + 8; // F5 (top line) = E4 + 8 diatonic steps

function chordForSlot(slot: LickChordSlot, keyRoot: PitchClass): string {
  if (slot === "ii") return chordSymbol({ root: pc(keyRoot + 2), quality: "min7" });
  if (slot === "V") return chordSymbol({ root: pc(keyRoot + 7), quality: "dom7" });
  return chordSymbol({ root: keyRoot, quality: "maj7" });
}

export function LickStaff({ notes, keyRoot, currentIndex = -1, states }: LickStaffProps) {
  const preferFlat = preferFlatForKey(keyRoot);

  const layout = useMemo(() => {
    let x = LEFT_PAD;
    const xs = notes.map((n) => {
      const cur = x;
      x += 26 + n.dur * 5;
      return cur;
    });
    return { xs, width: x + 24 };
  }, [notes]);

  const yForStep = (step: number) => STAFF_TOP + (TOP_STEP - step) * (LINE_GAP / 2);
  const staffLineYs = [0, 1, 2, 3, 4].map((i) => STAFF_TOP + i * LINE_GAP);
  const bottomLineY = STAFF_TOP + 4 * LINE_GAP;
  const height = 150;

  // Where chord symbols change (first note of each ii / V / I run).
  const chordChanges: { x: number; label: string }[] = [];
  let prevSlot: LickChordSlot | null = null;
  notes.forEach((n, i) => {
    if (n.chord !== prevSlot) {
      chordChanges.push({ x: layout.xs[i], label: chordForSlot(n.chord, keyRoot) });
      prevSlot = n.chord;
    }
  });

  function ledgerLines(step: number, x: number) {
    const lines: number[] = [];
    for (let s = TOP_STEP + 2; s <= step; s += 2) lines.push(s);
    for (let s = TREBLE_BOTTOM_STEP - 2; s >= step; s -= 2) lines.push(s);
    return lines.map((s) => (
      <line
        key={`ledger-${x}-${s}`}
        x1={x - 10}
        y1={yForStep(s)}
        x2={x + 10}
        y2={yForStep(s)}
        stroke="#334155"
        strokeWidth={1}
      />
    ));
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-50 p-2">
      <svg width={layout.width} height={height} style={{ minWidth: layout.width }} className="block">
        {/* staff lines */}
        {staffLineYs.map((y, i) => (
          <line key={i} x1={20} y1={y} x2={layout.width - 10} y2={y} stroke="#475569" strokeWidth={1} />
        ))}
        {/* treble clef */}
        <text x={24} y={bottomLineY + 6} fontSize={54} fill="#1e293b" fontFamily="serif">
          𝄞
        </text>

        {/* chord symbols */}
        {chordChanges.map((c, i) => (
          <text key={i} x={c.x - 4} y={STAFF_TOP - 14} fontSize={15} fontWeight="bold" fill="#b45309">
            {c.label}
          </text>
        ))}

        {/* notes */}
        {notes.map((n, i) => {
          const { step, accidental } = midiToStaffPos(n.midi, preferFlat);
          const x = layout.xs[i];
          const y = yForStep(step);
          const isCurrent = i === currentIndex;
          const st = states?.[i];
          const headFill =
            st === "hit" ? "#16a34a" : st === "miss" ? "#dc2626" : isCurrent ? "#f59e0b" : "#0f172a";
          const open = n.dur >= 4; // half/whole notes are hollow
          const stemUp = step < TOP_STEP - 4; // stem down for high notes
          return (
            <g key={i}>
              {ledgerLines(step, x)}
              {accidental && (
                <text x={x - 20} y={y + 5} fontSize={17} fill={headFill} fontFamily="serif">
                  {accidental === "sharp" ? "♯" : "♭"}
                </text>
              )}
              <ellipse
                cx={x}
                cy={y}
                rx={6.5}
                ry={5}
                fill={open ? "#f8fafc" : headFill}
                stroke={headFill}
                strokeWidth={open ? 2 : 1}
                transform={`rotate(-18 ${x} ${y})`}
              />
              {n.dur < 8 && (
                <line
                  x1={stemUp ? x + 6 : x - 6}
                  y1={y}
                  x2={stemUp ? x + 6 : x - 6}
                  y2={stemUp ? y - 34 : y + 34}
                  stroke={headFill}
                  strokeWidth={1.5}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
