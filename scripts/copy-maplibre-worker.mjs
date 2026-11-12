// MapLibre v6 loads its Web Worker from a URL relative to its own module.
// Once bundled by Next, that file isn't emitted, so we serve it from /public
// (kept in sync with the installed version on every dev/build run).
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const distDir = dirname(require.resolve("maplibre-gl/package.json"));
const outDir = join(process.cwd(), "public", "maplibre");

mkdirSync(outDir, { recursive: true });
// The source map too, so DevTools doesn't log a 404 for it.
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-worker.mjs.map"]) {
  copyFileSync(join(distDir, "dist", file), join(outDir, file));
}
