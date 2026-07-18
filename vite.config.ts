import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// GitHub Pages serves project sites from https://<user>.github.io/<repo>/,
// so assets must be requested under that subpath in production builds.
// Keep dev server at "/" for a normal local workflow.
const GITHUB_PAGES_BASE = "/remix_------ver2.47-2-/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? GITHUB_PAGES_BASE : "/",
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
}));
