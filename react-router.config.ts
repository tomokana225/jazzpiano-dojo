import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // This app is a client-heavy MIDI/audio tool with no need for SSR/SEO.
  ssr: false,
} satisfies Config;
