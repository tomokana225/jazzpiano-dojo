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
      <span
        className="flex cursor-help items-center gap-1 rounded-full border border-emerald-700/50 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300"
        title={
          "低遅延モードで再生中です。\n" +
          "※ ブラウザはASIO等のネイティブ音声ドライバに直接アクセスできないため、Web Audioで可能な最小遅延に設定しています。\n" +
          "さらに遅延を詰めたい場合は、外部音源(DAW/ハード音源)をASIOで鳴らし、MIDIキーボードから直接そちらへ送る運用がおすすめです(このアプリは判定と可視化に使用)。"
        }
      >
        🔊 音声ON (低遅延)
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
