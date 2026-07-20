import { NavLink } from "react-router";
import type { ReactNode } from "react";
import { Flame, Piano } from "lucide-react";
import { MidiStatusBadge } from "~/components/MidiStatusBadge";
import { LiveMidiAudio } from "~/components/LiveMidiAudio";
import { useProgressContext } from "~/lib/context/ProgressProvider";

const NAV_ITEMS = [
  { to: "/", label: "ホーム", end: true },
  { to: "/chords", label: "コード" },
  { to: "/scales", label: "スケール" },
  { to: "/voicings", label: "ボイシング" },
  { to: "/ii-v-i", label: "II-V-Iリック" },
  { to: "/chromatic-approach", label: "クロマチックアプローチ" },
  { to: "/comping", label: "コンピング" },
  { to: "/substitutions", label: "代理コード" },
  { to: "/standards", label: "スタンダード" },
  { to: "/identify", label: "逆引き" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { state, level, levelProgress } = useProgressContext();
  return (
    <div className="min-h-screen text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <NavLink to="/" className="mr-1 flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-brass-300 to-brass-500 text-slate-950 shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset]">
              <Piano className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-slate-100">
              Jazz Piano <span className="text-brass-300">Dojo</span>
            </span>
          </NavLink>
          <nav className="thin-scrollbar flex flex-1 items-center gap-0.5 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item ? item.end : false}
                className={({ isActive }) =>
                  `shrink-0 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-brass-400/10 text-brass-300"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 sm:flex">
              <span className="font-semibold text-brass-300">Lv.{level}</span>
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brass-400 to-brass-300"
                  style={{ width: `${(levelProgress.current / levelProgress.needed) * 100}%` }}
                />
              </div>
              <span className="flex items-center gap-0.5 text-orange-400">
                <Flame className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                {state.streakDays}
              </span>
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
