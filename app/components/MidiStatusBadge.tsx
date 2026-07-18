import { useMidiContext } from "~/lib/context/MidiProvider";

const STATUS_COPY: Record<string, { label: string; dot: string; text: string }> = {
  checking: { label: "MIDI確認中…", dot: "bg-slate-400", text: "text-slate-300" },
  unsupported: { label: "この端末はWeb MIDI非対応", dot: "bg-red-500", text: "text-red-300" },
  denied: { label: "MIDIアクセスが拒否されました", dot: "bg-red-500", text: "text-red-300" },
  "no-devices": { label: "MIDIキーボード未接続", dot: "bg-amber-400", text: "text-amber-300" },
  ready: { label: "MIDI接続中", dot: "bg-emerald-400", text: "text-emerald-300" },
};

export function MidiStatusBadge() {
  const { status, devices } = useMidiContext();
  const copy = STATUS_COPY[status] ?? STATUS_COPY.checking;
  return (
    <div
      className={`flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs ${copy.text}`}
      title={devices.map((d) => d.name).join(", ")}
    >
      <span className={`h-2 w-2 rounded-full ${copy.dot}`} />
      <span>{copy.label}</span>
      {status === "ready" && devices.length > 0 && (
        <span className="text-slate-400">({devices.length})</span>
      )}
    </div>
  );
}
