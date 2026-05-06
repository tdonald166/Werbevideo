// Extract configs from all posters in public/<id>/poster.* (or public/<id>/hero.*)
// in parallel. Skips IDs that already have a config.
//
// Usage:
//   npm run extract-all              # extract all
//   npm run extract-all -- --force   # re-extract even if config exists

import { readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const force = process.argv.includes("--force");

const PUBLIC = "public";
const candidates = [];

const entries = await readdir(PUBLIC);
for (const e of entries) {
  const dir = path.join(PUBLIC, e);
  const s = await stat(dir).catch(() => null);
  if (!s?.isDirectory()) continue;

  // Find first poster image in dir
  const files = await readdir(dir);
  const poster = files.find((f) => /^(poster|hero)\.(jpe?g|png|webp)$/i.test(f));
  if (!poster) continue;

  const cfgPath = `configs/${e}.json`;
  if (!force && existsSync(cfgPath)) {
    console.log(`⊘ skip ${e} (config exists)`);
    continue;
  }
  candidates.push({ id: e, image: path.join(dir, poster) });
}

if (!candidates.length) {
  console.log("Nothing to extract.");
  process.exit(0);
}

console.log(`▶ Extracting ${candidates.length} posters in parallel…`);

const run = ({ id, image }) =>
  new Promise((resolve) => {
    const p = spawn("node", ["scripts/extract-poster.mjs", image, id], {
      stdio: "inherit",
      shell: true,
    });
    p.on("close", (code) => resolve({ id, ok: code === 0 }));
  });

const results = await Promise.all(candidates.map(run));
const ok = results.filter((r) => r.ok).map((r) => r.id);
const fail = results.filter((r) => !r.ok).map((r) => r.id);

console.log(`\n✓ Extracted: ${ok.join(", ") || "none"}`);
if (fail.length) console.log(`✗ Failed:    ${fail.join(", ")}`);
console.log(`\n→ Jetzt rendern: npm run render-all`);
