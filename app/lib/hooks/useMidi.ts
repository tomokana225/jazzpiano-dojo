import { useCallback, useEffect, useRef, useState } from "react";

export type MidiSupportStatus =
  | "checking"
  | "unsupported"
  | "denied"
  | "ready"
  | "no-devices";

export interface MidiDeviceInfo {
  id: string;
  name: string;
}

export interface NoteEvent {
  note: number;
  velocity: number;
  type: "on" | "off";
  source: "midi" | "virtual";
  at: number;
}

type NoteListener = (event: NoteEvent) => void;

export interface UseMidiResult {
  status: MidiSupportStatus;
  devices: MidiDeviceInfo[];
  activeNotes: Set<number>;
  /** Manually trigger a note-on, used by the on-screen fallback keyboard. */
  pressNote: (note: number, velocity?: number) => void;
  pressChord: (notes: number[], velocity?: number) => void;
  releaseNote: (note: number) => void;
  releaseAll: () => void;
  /** Subscribe to raw note events (both real MIDI and virtual). Returns an unsubscribe fn. */
  subscribe: (listener: NoteListener) => () => void;
}

export function useMidi(): UseMidiResult {
  const [status, setStatus] = useState<MidiSupportStatus>("checking");
  const [devices, setDevices] = useState<MidiDeviceInfo[]>([]);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const listenersRef = useRef<Set<NoteListener>>(new Set());

  const emit = useCallback((event: NoteEvent) => {
    setActiveNotes((prev) => {
      const next = new Set(prev);
      if (event.type === "on") next.add(event.note);
      else next.delete(event.note);
      return next;
    });
    listenersRef.current.forEach((listener) => listener(event));
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("requestMIDIAccess" in navigator)) {
      setStatus("unsupported");
      return;
    }

    let cancelled = false;
    let access: MIDIAccess | null = null;

    function handleMessage(event: MIDIMessageEvent) {
      const data = event.data;
      if (!data || data.length < 2) return;
      const statusByte = data[0];
      const note = data[1];
      const velocity = data[2] ?? 0;
      const command = statusByte & 0xf0;
      if (command === 0x90 && velocity > 0) {
        emit({ note, velocity, type: "on", source: "midi", at: performance.now() });
      } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
        emit({ note, velocity, type: "off", source: "midi", at: performance.now() });
      }
    }

    function refreshDevices(a: MIDIAccess) {
      const list: MidiDeviceInfo[] = [];
      a.inputs.forEach((input) => {
        list.push({ id: input.id, name: input.name ?? "MIDI Keyboard" });
        input.onmidimessage = handleMessage;
      });
      if (cancelled) return;
      setDevices(list);
      setStatus(list.length > 0 ? "ready" : "no-devices");
    }

    navigator
      .requestMIDIAccess({ sysex: false })
      .then((a) => {
        if (cancelled) return;
        access = a;
        refreshDevices(a);
        a.onstatechange = () => refreshDevices(a);
      })
      .catch(() => {
        if (!cancelled) setStatus("denied");
      });

    return () => {
      cancelled = true;
      if (access) {
        access.inputs.forEach((input) => {
          input.onmidimessage = null;
        });
        access.onstatechange = null;
      }
    };
  }, [emit]);

  const pressNote = useCallback(
    (note: number, velocity = 100) => {
      emit({ note, velocity, type: "on", source: "virtual", at: performance.now() });
    },
    [emit],
  );

  const pressChord = useCallback(
    (notes: number[], velocity = 100) => {
      notes.forEach((note) => emit({ note, velocity, type: "on", source: "virtual", at: performance.now() }));
    },
    [emit],
  );

  const releaseNote = useCallback(
    (note: number) => {
      emit({ note, velocity: 0, type: "off", source: "virtual", at: performance.now() });
    },
    [emit],
  );

  const releaseAll = useCallback(() => {
    setActiveNotes((prev) => {
      prev.forEach((note) => {
        listenersRef.current.forEach((listener) =>
          listener({ note, velocity: 0, type: "off", source: "virtual", at: performance.now() }),
        );
      });
      return new Set();
    });
  }, []);

  const subscribe = useCallback((listener: NoteListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return { status, devices, activeNotes, pressNote, pressChord, releaseNote, releaseAll, subscribe };
}
