import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "jazz-piano-progress-v1";

export interface ProgressState {
  xp: number;
  streakDays: number;
  lastPracticeDate: string | null; // YYYY-MM-DD
  roundsByMode: Record<string, { correct: number; total: number }>;
}

const DEFAULT_STATE: ProgressState = {
  xp: 0,
  streakDays: 0,
  lastPracticeDate: null,
  roundsByMode: {},
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): ProgressState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function levelForXp(xp: number): number {
  return Math.floor(xp / 150) + 1;
}

export function xpIntoLevel(xp: number): { current: number; needed: number } {
  const level = levelForXp(xp);
  const floor = (level - 1) * 150;
  return { current: xp - floor, needed: 150 };
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(() => loadState());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable (private mode etc.) — ignore, progress just won't persist
    }
  }, [state]);

  const recordResult = useCallback((mode: string, correct: boolean) => {
    setState((prev) => {
      const today = todayStr();
      let streakDays = prev.streakDays;
      if (prev.lastPracticeDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        streakDays = prev.lastPracticeDate === yesterday ? prev.streakDays + 1 : 1;
      }
      const bucket = prev.roundsByMode[mode] ?? { correct: 0, total: 0 };
      const xpGain = correct ? 10 : 2;
      return {
        ...prev,
        xp: prev.xp + xpGain,
        streakDays,
        lastPracticeDate: today,
        roundsByMode: {
          ...prev.roundsByMode,
          [mode]: { correct: bucket.correct + (correct ? 1 : 0), total: bucket.total + 1 },
        },
      };
    });
  }, []);

  const reset = useCallback(() => setState(DEFAULT_STATE), []);

  return { state, recordResult, reset, level: levelForXp(state.xp), levelProgress: xpIntoLevel(state.xp) };
}
