// Render all configs. Default: cinematic horizontal only (1 video per customer).
//
// Usage:
//   npm run render-all              # alle Kunden, cinematic-h
//   npm run render-all -- --all     # alle Kunden, alle Stile + beide Formate (6 Videos pro Kunde)
//   npm run render-all -- --style neon
//   npm run render-all -- --concurrency 2

import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
const concIdx = args.indexOf("--concurrency");
const concurrency = concIdx >= 0 ? parseInt(args[concIdx + 1], 10) || 1 : 1;

// Pass-through flags to render-ad.mjs (everything except --concurrency)
const passthrough = args.filter((a, i) => {
  if (a === "--concurrency") return false;
  if (i > 0 && args[i - 1] === "--concurrency") return false;
  return true;
});

const cfgs = (await readdir("configs"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => path.basename(f, ".json"));

if (!cfgs.length) {
  console.log("No configs found in configs/");
  process.exit(0);
}

console.log(`▶ Rendering ${cfgs.length} customer(s)${passthrough.length ? ` ${passthrough.join(" ")}` : " (cinematic horizontal)"}…\n`);

const run = (id) =>
  new Promise((resolve) => {
    const cliArgs = ["scripts/render-ad.mjs", id, ...passthrough];
    const p = spawn("node", cliArgs, { stdio: "inherit", shell: true });
    p.on("close", (code) => resolve({ id, ok: code === 0 }));
  });

const results = [];
if (concurrency <= 1) {
  for (const id of cfgs) results.push(await run(id));
} else {
  const queue = [...cfgs];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const id = queue.shift();
      results.push(await run(id));
    }
  });
  await Promise.all(workers);
}

const ok = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok);

console.log(`\n${"=".repeat(50)}`);
console.log(`✓ ${ok}/${cfgs.length} customers rendered.`);
if (fail.length) {
  console.log(`✗ Failed:`);
  fail.forEach((r) => console.log(`   - ${r.id}`));
}
console.log(`Output → out/`);
