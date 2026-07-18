import { useCallback, useState } from "react";

export interface RoundScoreState {
  correct: number;
  total: number;
  streak: number;
  bestStreak: number;
}

const INITIAL: RoundScoreState = { correct: 0, total: 0, streak: 0, bestStreak: 0 };

export function useRoundScore() {
  const [state, setState] = useState<RoundScoreState>(INITIAL);

  const registerResult = useCallback((wasCorrect: boolean) => {
    setState((prev) => {
      const streak = wasCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (wasCorrect ? 1 : 0),
        total: prev.total + 1,
        streak,
        bestStreak: Math.max(prev.bestStreak, streak),
      };
    });
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, registerResult, reset };
}
