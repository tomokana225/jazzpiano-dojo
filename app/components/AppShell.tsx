import { NavLink } from "react-router";
import type { ReactNode } from "react";
import { MidiStatusBadge } from "~/components/MidiStatusBadge";
import { LiveMidiAudio } from "~/components/LiveMidiAudio";
import { useProgressContext } from "~/lib/context/ProgressProvider";

const NAV_ITEMS = [
  { to: "/", label: "ホーム", end: true },
  { to: "/chords", label: "コード" },
  { to: "/scales", label: "スケール" },
  { to: "/voicings", label: "ボイシング" },
  { to: "/ii-v-i", label: "II-V-Iリック" },
  { to: "/standards", label: "スタンダード" },
  { to: "/identify", label: "逆引き" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { state, level, levelProgress } = useProgressContext();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <NavLink to="/" className="mr-2 flex items-center gap-2 text-lg font-semibold tracking-tight text-amber-300">
            <span aria-hidden>🎹</span>
            <span>Jazz Piano Dojo</span>
          </NavLink>
          <nav className="flex flex-1 flex-wrap gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item ? item.end : false}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-amber-400/15 text-amber-300"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 sm:flex">
              <span className="text-amber-300">Lv.{level}</span>
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${(levelProgress.current / levelProgress.needed) * 100}%` }}
                />
              </div>
              <span>🔥{state.streakDays}</span>
            </div>
            <LiveMidiAudio />
            <MidiStatusBadge />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
