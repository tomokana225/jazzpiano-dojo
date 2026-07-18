import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // This app is a client-heavy MIDI/audio tool with no need for SSR/SEO.
  ssr: false,
  // Must match the Vite `base` in vite.config.ts — GitHub Pages serves this
  // project site from https://<user>.github.io/remix_------ver2.47-2-/. Kept
  // at "/" outside production builds so `npm run dev` still runs at the root.
  basename: process.env.NODE_ENV === "production" ? "/remix_------ver2.47-2-/" : "/",
} satisfies Config;
