import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("chords", "routes/chords.tsx"),
  route("scales", "routes/scales.tsx"),
  route("voicings", "routes/voicings.tsx"),
  route("ii-v-i", "routes/ii-v-i.tsx"),
  route("chromatic-approach", "routes/chromatic-approach.tsx"),
  route("comping", "routes/comping.tsx"),
  route("substitutions", "routes/substitutions.tsx"),
  route("standards", "routes/standards.tsx"),
  route("identify", "routes/identify.tsx"),
] satisfies RouteConfig;
