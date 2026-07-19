import { useCallback, useEffect, useState } from "react";
import type { Standard } from "~/lib/theory/standards";

const STORAGE_KEY = "jazz-piano-custom-progressions-v1";

export interface SavedProgression {
  id: string;
  name: string;
  rawText: string;
  standard: Standard;
  savedAt: string;
}

function loadSaved(): SavedProgression[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useCustomProgressions() {
  const [saved, setSaved] = useState<SavedProgression[]>(() => loadSaved());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // storage unavailable (private mode etc.) — ignore, progress just won't persist
    }
  }, [saved]);

  const save = useCallback((name: string, rawText: string, standard: Standard) => {
    const entry: SavedProgression = {
      id: crypto.randomUUID(),
      name,
      rawText,
      standard,
      savedAt: new Date().toISOString(),
    };
    setSaved((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const remove = useCallback((id: string) => {
    setSaved((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { saved, save, remove };
}
