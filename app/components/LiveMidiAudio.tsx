import { useLiveMidiAudio } from "~/lib/hooks/useLiveMidiAudio";

/**
 * Header control that both makes MIDI/on-screen key presses audible and
 * shows the user whether that's currently active (browsers block audio
 * until a real click/tap happens at least once per page load).
 */
export function LiveMidiAudio() {
  const { audioEnabled, enableAudio } = useLiveMidiAudio();

  if (audioEnabled) {
    return (
      <span className="flex items-center gap-1 rounded-full border border-emerald-700/50 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
        🔊 音声ON
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={enableAudio}
      className="rounded-full border border-amber-500/60 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300 hover:bg-amber-400/20"
    >
      🔈 音を有効にする
    </button>
  );
}
