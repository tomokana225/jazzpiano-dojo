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
  /** Elapsed playback position, in eighth-note units. Drives the auto-scroll so this position stays under the playhead. Defaults to 0 (static). */
  currentEighths?: number;
  /** Fixed viewport width in px. When set, the staff scrolls horizontally as `currentEighths` advances, like a scrolling score. Defaults to the full content width (static, no scrolling). */
  viewportWidth?: number;
  className?: string;
}

const LINE_GAP = 12;
const STAFF_TOP = 48; // y of the top staff line (F5)
const LEFT_PAD = 62; // room for the clef
const TOP_STEP = TREBLE_BOTTOM_STEP + 8; // F5 (top line) = E4 + 8 diatonic steps
const PX_PER_EIGHTH = 26; // horizontal spacing is proportional to time, so barlines line up
const EIGHTHS_PER_MEASURE = 8; // 4/4 time, our durations are in eighth-note units
const STEM_LEN = 34;
// Extra horizontal room reserved at every barline so a barline is never
// drawn through a notehead — without this, the first note of each measure
// lands at exactly the same x as the barline itself (both are placed by the
// same eighths-since-start -> x mapping), so they visually overlap.
const BAR_GAP = 28;
// Fixed x (within the viewport) that "now" stays pinned to while the staff
// auto-scrolls — just to the right of the clef, matching the reference
// layout's playhead position.
const PLAYHEAD_X = LEFT_PAD + 8;

function chordForSlot(slot: LickChordSlot, keyRoot: PitchClass): string {
  if (slot === "ii") return chordSymbol({ root: pc(keyRoot + 2), quality: "min7" });
  if (slot === "V") return chordSymbol({ root: pc(keyRoot + 7), quality: "dom7" });
  return chordSymbol({ root: keyRoot, quality: "maj7" });
}

/** An eighth-note triplet: 3 notes in the space normally taken by 2 eighths. */
const TRIPLET_EIGHTH = 2 / 3;

/** How a duration (in eighth-note units) should be notated. */
function noteValueInfo(dur: number): { flags: number; dotted: boolean; open: boolean; triplet: boolean } {
  if (dur >= 8) return { flags: 0, dotted: false, open: true, triplet: false }; // whole
  if (dur === 6) return { flags: 0, dotted: true, open: true, triplet: false }; // dotted half
  if (dur === 4) return { flags: 0, dotted: false, open: true, triplet: false }; // half
  if (dur === 3) return { flags: 0, dotted: true, open: false, triplet: false }; // dotted quarter
  if (dur === 2) return { flags: 0, dotted: false, open: false, triplet: false }; // quarter
  if (dur === 1.5) return { flags: 1, dotted: true, open: false, triplet: false }; // dotted eighth
  if (dur === 1) return { flags: 1, dotted: false, open: false, triplet: false }; // eighth
  if (dur === TRIPLET_EIGHTH) return { flags: 1, dotted: false, open: false, triplet: true }; // triplet eighth
  if (dur === 0.75) return { flags: 2, dotted: true, open: false, triplet: false }; // dotted sixteenth
  if (dur === 0.5) return { flags: 2, dotted: false, open: false, triplet: false }; // sixteenth
  return { flags: 0, dotted: false, open: dur >= 4, triplet: false };
}

interface RenderNote {
  originalIndex: number;
  startEighths: number;
  dur: number;
  midi: number;
  chord: LickChordSlot;
  tiedFromPrev: boolean;
  tiedToNext: boolean;
}

// All supported durations (including eighth-note triplets, dur = 2/3) are
// exact multiples of 1/12 of an eighth note. Snapping every accumulated
// position to that grid absorbs the floating-point drift that repeated
// additions of 2/3 would otherwise introduce — left unsnapped, a position
// that should land exactly on a barline (e.g. 16) can come out as
// 15.999999999999996, which throws off the modulo-based measure/beat math
// downstream (a near-zero sliver gets split off before the "barline").
const POSITION_GRID = 12;
const snapToGrid = (x: number) => Math.round(x * POSITION_GRID) / POSITION_GRID;

/**
 * Split any note whose duration would cross a measure boundary into tied
 * fragments, one per measure — otherwise a barline would be drawn through
 * the middle of a still-sounding note, and everything past it would drift
 * out of alignment with the actual beat grid.
 */
function splitAcrossBarlines(notes: StaffNote[]): RenderNote[] {
  const result: RenderNote[] = [];
  let cursor = 0;
  notes.forEach((n, originalIndex) => {
    let remaining = n.dur;
    let start = cursor;
    let first = true;
    while (remaining > 1e-9) {
      const posInMeasure = start % EIGHTHS_PER_MEASURE;
      const roomInMeasure = EIGHTHS_PER_MEASURE - posInMeasure;
      const segDur = Math.min(remaining, roomInMeasure);
      const tiedToNext = segDur < remaining - 1e-9;
      result.push({
        originalIndex,
        startEighths: start,
        dur: segDur,
        midi: n.midi,
        chord: n.chord,
        tiedFromPrev: !first,
        tiedToNext,
      });
      start = snapToGrid(start + segDur);
      remaining -= segDur;
      first = false;
    }
    cursor = snapToGrid(cursor + n.dur);
  });
  return result;
}

/** Consecutive, un-tied eighth/sixteenth notes within the same beat get one shared beam. */
function findBeamGroups(rnotes: RenderNote[]): number[][] {
  const groups: number[][] = [];
  let current: number[] = [];
  const beatOf = (n: RenderNote) => Math.floor((n.startEighths % EIGHTHS_PER_MEASURE) / 2);
  const flush = () => {
    if (current.length > 1) groups.push(current);
    current = [];
  };
  for (let i = 0; i < rnotes.length; i++) {
    const n = rnotes[i];
    const eligible = noteValueInfo(n.dur).flags >= 1 && !n.tiedFromPrev && !n.tiedToNext;
    if (!eligible) {
      flush();
      continue;
    }
    if (current.length > 0) {
      const prev = rnotes[current[current.length - 1]];
      const contiguous = Math.abs(prev.startEighths + prev.dur - n.startEighths) < 1e-6;
      if (!contiguous || beatOf(prev) !== beatOf(n)) flush();
    }
    current.push(i);
  }
  flush();
  return groups;
}

export function LickStaff({
  notes,
  keyRoot,
  currentIndex = -1,
  states,
  currentEighths = 0,
  viewportWidth,
  className,
}: LickStaffProps) {
  const preferFlat = preferFlatForKey(keyRoot);
  // Every full measure elapsed before this point pushes notes right by
  // BAR_GAP, reserving breathing room around each barline (see BAR_GAP).
  const timeToX = (eighths: number) =>
    LEFT_PAD + eighths * PX_PER_EIGHTH + Math.floor(eighths / EIGHTHS_PER_MEASURE) * BAR_GAP;
  // A barline sits centered in the gap between the last note of the measure
  // before it and the first note of the measure after it.
  const barlineX = (measureBoundaryEighths: number) => {
    const priorBars = measureBoundaryEighths / EIGHTHS_PER_MEASURE;
    return LEFT_PAD + measureBoundaryEighths * PX_PER_EIGHTH + (priorBars - 1) * BAR_GAP + BAR_GAP / 2;
  };

  const rnotes = useMemo(() => splitAcrossBarlines(notes), [notes]);
  const beamGroups = useMemo(() => findBeamGroups(rnotes), [rnotes]);
  const beamedIndex = useMemo(() => {
    const map = new Map<number, number>(); // render-note index -> group index
    beamGroups.forEach((g, gi) => g.forEach((i) => map.set(i, gi)));
    return map;
  }, [beamGroups]);

  const layout = useMemo(() => {
    const totalEighths = notes.reduce((sum, n) => sum + n.dur, 0);
    const barlines: number[] = [];
    for (let m = EIGHTHS_PER_MEASURE; m < totalEighths; m += EIGHTHS_PER_MEASURE) {
      barlines.push(barlineX(m));
    }
    const endX = timeToX(totalEighths);
    return { barlines, endX, width: endX + 24 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  const yForStep = (step: number) => STAFF_TOP + (TOP_STEP - step) * (LINE_GAP / 2);
  const staffLineYs = [0, 1, 2, 3, 4].map((i) => STAFF_TOP + i * LINE_GAP);
  const bottomLineY = STAFF_TOP + 4 * LINE_GAP;
  const height = 150;

  // Where chord symbols change (first fragment of each ii / V / I run).
  const chordChanges: { x: number; label: string }[] = [];
  let prevSlot: LickChordSlot | null = null;
  rnotes.forEach((n) => {
    if (n.tiedFromPrev) return;
    if (n.chord !== prevSlot) {
      chordChanges.push({ x: timeToX(n.startEighths), label: chordForSlot(n.chord, keyRoot) });
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

  function flagPath(x: number, stemEndY: number, stemUp: boolean, flagIndex: number): string {
    const dir = stemUp ? 1 : -1;
    const y0 = stemEndY + flagIndex * dir * 7;
    const sx = stemUp ? x + 6 : x - 6;
    const hx = dir * 9;
    return `M ${sx},${y0} q ${hx},3 ${hx * 0.85},14 q ${-hx * 0.2},7 ${-hx * 0.7},9`;
  }

  // Precompute per-render-note pitch position once.
  const positioned = rnotes.map((n) => {
    const { step, accidental } = midiToStaffPos(n.midi, preferFlat);
    return { ...n, step, accidental, x: timeToX(n.startEighths), y: yForStep(step) };
  });

  const vw = viewportWidth ?? layout.width;
  const scrollOffset = Math.max(0, timeToX(currentEighths) - PLAYHEAD_X);
  // `className` fully replaces the border/rounding classes (not appended) so
  // a caller stacking this above another panel can drop the rounding and
  // bottom border without fighting Tailwind's utility-order cascade.
  const frameClassName = className ?? "rounded-xl border border-slate-800";

  return (
    <div
      className={`relative overflow-hidden bg-slate-50 ${frameClassName}`}
      style={{ width: vw, maxWidth: "100%" }}
    >
      <div style={{ width: layout.width, transform: `translateX(${-scrollOffset}px)` }}>
      <svg width={layout.width} height={height} style={{ minWidth: layout.width }} className="block">
        {/* staff lines */}
        {staffLineYs.map((y, i) => (
          <line key={i} x1={20} y1={y} x2={layout.endX} y2={y} stroke="#475569" strokeWidth={1} />
        ))}
        {/* measure barlines */}
        {layout.barlines.map((x, i) => (
          <line key={`bar-${i}`} x1={x} y1={STAFF_TOP} x2={x} y2={bottomLineY} stroke="#475569" strokeWidth={1} />
        ))}
        {/* final double barline */}
        <line x1={layout.endX - 5} y1={STAFF_TOP} x2={layout.endX - 5} y2={bottomLineY} stroke="#475569" strokeWidth={1} />
        <line x1={layout.endX} y1={STAFF_TOP} x2={layout.endX} y2={bottomLineY} stroke="#475569" strokeWidth={2.5} />
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

        {/* beams (drawn under noteheads) */}
        {beamGroups.map((group, gi) => {
          const members = group.map((i) => positioned[i]);
          const avgStep = members.reduce((s, n) => s + n.step, 0) / members.length;
          const stemUp = avgStep < TOP_STEP - 4;
          const beamY = stemUp
            ? Math.min(...members.map((n) => n.y)) - STEM_LEN
            : Math.max(...members.map((n) => n.y)) + STEM_LEN;
          const maxFlags = Math.max(...members.map((n) => noteValueInfo(n.dur).flags));
          const x1 = stemUp ? members[0].x + 6 : members[0].x - 6;
          const x2 = stemUp ? members[members.length - 1].x + 6 : members[members.length - 1].x - 6;
          const st = states?.[members[0].originalIndex];
          const color = st === "hit" ? "#16a34a" : st === "miss" ? "#dc2626" : "#0f172a";
          const isTriplet = members.length === 3 && members.every((n) => noteValueInfo(n.dur).triplet);
          return (
            <g key={`beam-${gi}`}>
              {members.map((n) => (
                <line
                  key={`stem-${n.originalIndex}-${n.startEighths}`}
                  x1={stemUp ? n.x + 6 : n.x - 6}
                  y1={n.y}
                  x2={stemUp ? n.x + 6 : n.x - 6}
                  y2={beamY}
                  stroke={n.originalIndex === currentIndex ? "#f59e0b" : color}
                  strokeWidth={1.5}
                />
              ))}
              {Array.from({ length: maxFlags }).map((_, bi) => (
                <line
                  key={`bar${bi}`}
                  x1={x1}
                  y1={beamY + bi * (stemUp ? 5 : -5)}
                  x2={x2}
                  y2={beamY + bi * (stemUp ? 5 : -5)}
                  stroke={color}
                  strokeWidth={4}
                />
              ))}
              {isTriplet && (
                <text
                  x={(x1 + x2) / 2}
                  y={beamY + (stemUp ? -6 : 14)}
                  fontSize={11}
                  fontStyle="italic"
                  textAnchor="middle"
                  fill={color}
                >
                  3
                </text>
              )}
            </g>
          );
        })}

        {/* notes */}
        {positioned.map((n, i) => {
          const isCurrent = n.originalIndex === currentIndex;
          const st = states?.[n.originalIndex];
          const headFill = st === "hit" ? "#16a34a" : st === "miss" ? "#dc2626" : isCurrent ? "#f59e0b" : "#0f172a";
          const { open, flags, dotted } = noteValueInfo(n.dur);
          const stemUp = n.step < TOP_STEP - 4;
          const inBeam = beamedIndex.has(i);
          const showIndividualFlags = flags > 0 && !inBeam;
          const stemEndY = stemUp ? n.y - STEM_LEN : n.y + STEM_LEN;
          const next = positioned[i + 1];
          const showTie =
            n.tiedToNext && next && Math.abs(next.startEighths - (n.startEighths + n.dur)) < 1e-6;

          return (
            <g key={`${n.originalIndex}-${n.startEighths}`}>
              {ledgerLines(n.step, n.x)}
              {n.accidental && !n.tiedFromPrev && (
                <text x={n.x - 20} y={n.y + 5} fontSize={17} fill={headFill} fontFamily="serif">
                  {n.accidental === "sharp" ? "♯" : "♭"}
                </text>
              )}
              <ellipse
                cx={n.x}
                cy={n.y}
                rx={6.5}
                ry={5}
                fill={open ? "#f8fafc" : headFill}
                stroke={headFill}
                strokeWidth={open ? 2 : 1}
                transform={`rotate(-18 ${n.x} ${n.y})`}
              />
              {dotted && <circle cx={n.x + 11} cy={n.y - 2} r={1.8} fill={headFill} />}
              {noteValueInfo(n.dur).flags >= 0 && n.dur < 8 && !inBeam && (
                <line
                  x1={stemUp ? n.x + 6 : n.x - 6}
                  y1={n.y}
                  x2={stemUp ? n.x + 6 : n.x - 6}
                  y2={stemEndY}
                  stroke={headFill}
                  strokeWidth={1.5}
                />
              )}
              {showIndividualFlags &&
                Array.from({ length: flags }).map((_, fi) => (
                  <path
                    key={fi}
                    d={flagPath(n.x, stemEndY, stemUp, fi)}
                    fill="none"
                    stroke={headFill}
                    strokeWidth={1.5}
                  />
                ))}
              {showTie && next && (
                <path
                  d={`M ${n.x + 8},${n.y + (stemUp ? 8 : -8)} Q ${(n.x + next.x) / 2},${
                    n.y + (stemUp ? 16 : -16)
                  } ${next.x - 8},${next.y + (stemUp ? 8 : -8)}`}
                  fill="none"
                  stroke="#475569"
                  strokeWidth={1.5}
                />
              )}
            </g>
          );
        })}
      </svg>
      </div>
      {viewportWidth !== undefined && (
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-sky-400/70"
          style={{ left: PLAYHEAD_X }}
        />
      )}
    </div>
  );
}
